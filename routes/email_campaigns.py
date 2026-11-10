import os
import re
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app
from auth import login_required
from models import db, Candidate, ContactList, Contact, EmailCampaign, EmailLog, Election
from utils.email_service import (
    interpolate_email_template,
    send_single_email,
    execute_email_broadcast,
    retry_failed_emails,
    resend_campaign_emails,
    is_smtp_active,
    test_smtp_connection
)

email_bp = Blueprint('email_campaigns', __name__, url_prefix='/email')


def _update_env_key(key, value):
    """Safely updates or uncomments a key in the project root .env file and active environment."""
    os.environ[key] = str(value) if value is not None else ''
    current_app.config[key] = str(value) if value is not None else ''
    # Protect live production credentials from being modified during unit tests
    if current_app.config.get('TESTING'):
        return
    try:
        env_path = os.path.join(current_app.root_path, '.env')
        if not os.path.exists(env_path):
            return
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        found = False
        new_lines = []
        for line in lines:
            if re.match(rf'^\s*#?\s*{key}\s*=', line):
                new_lines.append(f"{key}={value}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"{key}={value}\n")
            
        with open(env_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    except Exception as e:
        current_app.logger.warning(f"Could not persist {key} to .env: {e}")


@email_bp.route('/')
@login_required
def index():
    campaigns = EmailCampaign.query.order_by(EmailCampaign.created_at.desc()).all()
    candidates = Candidate.query.order_by(Candidate.name).all()
    contact_lists = ContactList.query.order_by(ContactList.name).all()

    total_sent = sum(c.sent_count or c.recipient_count or 0 for c in campaigns)
    total_failed = sum(c.failed_count or 0 for c in campaigns)
    total_inboxes = sum(c.recipient_count or 0 for c in campaigns)

    recent_logs = EmailLog.query.order_by(EmailLog.sent_at.desc()).limit(10).all()
    smtp_active = is_smtp_active()

    return render_template(
        'email/index.html',
        campaigns=campaigns,
        candidates=candidates,
        contact_lists=contact_lists,
        total_sent=total_sent,
        total_failed=total_failed,
        total_inboxes=total_inboxes,
        recent_logs=recent_logs,
        smtp_active=smtp_active,
        mail_server=current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
    )


@email_bp.route('/compose', methods=['GET', 'POST'])
@login_required
def compose():
    candidates = Candidate.query.order_by(Candidate.name).all()
    contact_lists = ContactList.query.order_by(ContactList.name).all()
    elections = Election.query.order_by(Election.created_at.desc()).all()

    if request.method == 'POST':
        subject = request.form.get('subject', '').strip()
        body_html = request.form.get('body_html', '').strip()
        template_type = request.form.get('template_type', 'Manifesto').strip()
        candidate_id = request.form.get('candidate_id', type=int)
        target_mode = request.form.get('target_mode', 'list')  # 'list', 'election_all', 'manual'
        contact_list_id = request.form.get('contact_list_id', type=int)
        election_id = request.form.get('election_id', type=int)
        manual_emails_raw = request.form.get('manual_emails', '').strip()
        attach_poster = bool(request.form.get('attach_poster'))

        # Verify subject and that body has actual visible text content (not just empty html tags like <p><br></p>)
        plain_body_text = re.sub(r'<[^>]+>|&nbsp;|\s', '', body_html)
        if not subject or not plain_body_text:
            flash('Email Subject Line and Message Body are required. Please type your message before broadcasting.', 'danger')
            return render_template(
                'email/compose.html',
                candidates=candidates,
                contact_lists=contact_lists,
                elections=elections,
                selected_candidate_id=candidate_id,
                preselect_attach_poster=attach_poster,
                smtp_active=is_smtp_active(),
                mail_username=current_app.config.get('MAIL_USERNAME', ''),
                mail_server=current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
            )

        recipient_tuples = []

        if target_mode == 'election_all' and election_id:
            election = db.session.get(Election, election_id)
            if election:
                for cl in election.contact_lists:
                    for c in cl.contacts:
                        if c.email and '@' in c.email:
                            recipient_tuples.append((c.name, c.email))
        elif contact_list_id:
            contact_list = db.session.get(ContactList, contact_list_id)
            if contact_list:
                for c in contact_list.contacts:
                    if c.email and '@' in c.email:
                        recipient_tuples.append((c.name, c.email))

        # Parse manual emails
        if manual_emails_raw:
            raw_entries = re.split(r'[\r\n,;]+', manual_emails_raw)
            for entry in raw_entries:
                cleaned = entry.strip().lower()
                if re.match(r'^[\w\.\-]+@[\w\.\-]+\.\w+$', cleaned):
                    recipient_tuples.append(('Voter', cleaned))

        if not recipient_tuples:
            flash('Please select a Recipient Voter List or manually input at least one valid recipient email address.', 'danger')
            return render_template('email/compose.html', candidates=candidates, contact_lists=contact_lists, elections=elections, selected_candidate_id=candidate_id, preselect_attach_poster=attach_poster)

        # Deduplicate
        seen_emails = set()
        deduped = []
        for name, em in recipient_tuples:
            norm = em.strip().lower()
            if norm not in seen_emails:
                seen_emails.add(norm)
                deduped.append((name, norm))

        campaign = EmailCampaign(
            candidate_id=candidate_id,
            contact_list_id=contact_list_id if target_mode == 'list' else None,
            subject=subject,
            body_html=body_html,
            template_type=template_type,
            recipient_count=len(deduped),
            attach_poster=attach_poster,
            status='Sending'
        )
        db.session.add(campaign)
        db.session.commit()

        # Execute broadcast
        result = execute_email_broadcast(campaign, deduped, attach_poster=attach_poster)

        if result.get('is_simulation'):
            flash(
                f'Email Campaign "{subject}" logged in SIMULATION MODE for {result["deduped_count"]} recipients. Notice: Live SMTP credentials are not yet configured in Settings, so no actual emails were delivered to student inboxes. Go to Settings to connect your mail server.',
                'warning'
            )
        elif result.get('failed_count', 0) > 0 and result.get('sent_count', 0) == 0:
            flash(
                f'Email Campaign "{subject}" failed: All {result["failed_count"]} recipient sends were rejected by SMTP server. Check credentials in Settings.',
                'danger'
            )
        elif result.get('failed_count', 0) > 0:
            flash(
                f'Campaign Email "{subject}" dispatched with issues: {result["sent_count"]} sent, {result["failed_count"]} failed.',
                'warning'
            )
        else:
            flash(
                f'Campaign Email "{subject}" queued and broadcasted to {result["sent_count"]} recipients via Live SMTP!',
                'success'
            )
        return redirect(url_for('email_campaigns.campaign_detail', campaign_id=campaign.id))

    preselect_candidate_id = request.args.get('candidate_id', type=int)
    preselect_attach_poster = bool(request.args.get('attach_poster'))
    return render_template(
        'email/compose.html',
        candidates=candidates,
        contact_lists=contact_lists,
        elections=elections,
        selected_candidate_id=preselect_candidate_id,
        preselect_attach_poster=preselect_attach_poster,
        smtp_active=is_smtp_active(),
        mail_username=current_app.config.get('MAIL_USERNAME', ''),
        mail_server=current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
    )


@email_bp.route('/campaign/<int:campaign_id>')
@login_required
def campaign_detail(campaign_id):
    campaign = db.session.get(EmailCampaign, campaign_id)
    if not campaign:
        flash('Campaign not found.', 'danger')
        return redirect(url_for('email_campaigns.index'))

    logs = EmailLog.query.filter_by(campaign_id=campaign.id).order_by(EmailLog.sent_at.desc()).all()
    is_simulated = (campaign.status == 'Simulated') or any(log.status == 'simulated' for log in logs)
    failed_logs = [log for log in logs if log.status == 'failed']
    return render_template(
        'email/campaign_detail.html',
        campaign=campaign,
        logs=logs,
        is_simulated=is_simulated,
        failed_count=len(failed_logs),
        smtp_active=is_smtp_active()
    )


@email_bp.route('/campaign/<int:campaign_id>/resend-failed', methods=['POST'])
@login_required
def resend_failed(campaign_id):
    success_count, fail_count, message = retry_failed_emails(campaign_id)
    if success_count > 0:
        flash(message, 'success')
    else:
        flash(message, 'warning' if fail_count > 0 else 'info')
    return redirect(url_for('email_campaigns.campaign_detail', campaign_id=campaign_id))


@email_bp.route('/campaign/<int:campaign_id>/resend-live', methods=['POST'])
@login_required
def resend_live(campaign_id):
    success_count, fail_count, message = resend_campaign_emails(campaign_id)
    if success_count > 0:
        flash(message, 'success')
    else:
        flash(message, 'danger')
    return redirect(url_for('email_campaigns.campaign_detail', campaign_id=campaign_id))


@email_bp.route('/api/preview', methods=['POST'])
@login_required
def api_preview():
    data = request.get_json() or {}
    subject = data.get('subject', '')
    body_html = data.get('body_html', '')
    candidate_id = data.get('candidate_id')
    contact_list_id = data.get('contact_list_id')

    candidate = db.session.get(Candidate, candidate_id) if candidate_id else None
    election = candidate.election if candidate and candidate.election else Election.query.first()

    contact_list = db.session.get(ContactList, contact_list_id) if contact_list_id else None

    recipients = []
    if contact_list and contact_list.contacts:
        for c in contact_list.contacts[:3]:
            recipients.append({'name': c.name, 'email': c.email or 'voter@campus.ac.ug'})
    else:
        recipients = [
            {'name': 'Sample Recipient', 'email': 'voter@campus.ac.ug'}
        ]

    previews = []
    for r in recipients:
        rendered_sub = interpolate_email_template(subject, recipient_name=r['name'], candidate=candidate, election=election)
        rendered_body = interpolate_email_template(body_html, recipient_name=r['name'], candidate=candidate, election=election)
        previews.append({
            'recipient_name': r['name'],
            'recipient_email': r['email'],
            'rendered_subject': rendered_sub,
            'rendered_body': rendered_body
        })

    return jsonify({'success': True, 'previews': previews})


@email_bp.route('/api/send-test', methods=['POST'])
@login_required
def api_send_test():
    data = request.get_json() or {}
    test_email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    body_html = data.get('body_html', '').strip()
    candidate_id = data.get('candidate_id')
    attach_poster = data.get('attach_poster', False)

    if not test_email or not subject or not body_html:
        return jsonify({'success': False, 'error': 'Target email, subject, and body are required.'}), 400

    candidate = db.session.get(Candidate, candidate_id) if candidate_id else None

    ok, res = send_single_email(
        to_email=test_email,
        subject=subject,
        body_html=body_html,
        recipient_name="Campaign Admin",
        candidate=candidate,
        attach_poster=attach_poster
    )

    if ok:
        return jsonify({
            'success': True,
            'message': f'Test email dispatched to {test_email} successfully!',
            'details': res
        })
    else:
        return jsonify({
            'success': False,
            'error': res.get('error', 'Failed to dispatch test email'),
            'details': res
        }), 400


@email_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    from app import mail
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'reset_simulation':
            _update_env_key('MAIL_USERNAME', '')
            _update_env_key('MAIL_PASSWORD', '')
            current_app.config['MAIL_USERNAME'] = ''
            current_app.config['MAIL_PASSWORD'] = ''
            try:
                mail.init_app(current_app._get_current_object())
            except Exception:
                pass
            flash("Email Gateway reset to Safe Simulation Mode. All test and campaign broadcasts will simulate safely.", "info")
            return redirect(url_for('email_campaigns.settings'))

        mail_server = request.form.get('mail_server', '').strip() or 'smtp.gmail.com'
        mail_port = request.form.get('mail_port', '587').strip() or '587'
        mail_use_tls = 'mail_use_tls' in request.form
        mail_use_ssl = 'mail_use_ssl' in request.form
        mail_username = request.form.get('mail_username', '').strip()
        mail_password = request.form.get('mail_password', '').strip()
        if mail_password:
            mail_password = mail_password.replace(' ', '')
        default_sender_fallback = f"ELECHUB Campaign Command <{mail_username}>" if mail_username and '@' in mail_username else 'noreply@elechub.campus.ac.ug'
        mail_default_sender = request.form.get('mail_default_sender', '').strip() or default_sender_fallback

        # Persist to .env and environment
        _update_env_key('MAIL_SERVER', mail_server)
        _update_env_key('MAIL_PORT', mail_port)
        _update_env_key('MAIL_USE_TLS', 'True' if mail_use_tls else 'False')
        _update_env_key('MAIL_USE_SSL', 'True' if mail_use_ssl else 'False')
        if mail_username:
            _update_env_key('MAIL_USERNAME', mail_username)
        if mail_password:
            _update_env_key('MAIL_PASSWORD', mail_password)
        if mail_default_sender:
            _update_env_key('MAIL_DEFAULT_SENDER', mail_default_sender)

        # Update in-memory config for immediate use
        current_app.config['MAIL_SERVER'] = mail_server
        try:
            current_app.config['MAIL_PORT'] = int(mail_port)
        except ValueError:
            current_app.config['MAIL_PORT'] = 587
        current_app.config['MAIL_USE_TLS'] = mail_use_tls
        current_app.config['MAIL_USE_SSL'] = mail_use_ssl
        if mail_username:
            current_app.config['MAIL_USERNAME'] = mail_username
        if mail_password:
            current_app.config['MAIL_PASSWORD'] = mail_password
        if mail_default_sender:
            current_app.config['MAIL_DEFAULT_SENDER'] = mail_default_sender

        try:
            mail.init_app(current_app._get_current_object())
        except Exception:
            pass

        flash("Email Gateway SMTP settings updated and saved to system.", "success")
        return redirect(url_for('email_campaigns.settings'))

    return render_template(
        'email/settings.html',
        mail_server=current_app.config.get('MAIL_SERVER', 'smtp.gmail.com'),
        mail_port=current_app.config.get('MAIL_PORT', 587),
        mail_use_tls=current_app.config.get('MAIL_USE_TLS', True),
        mail_use_ssl=current_app.config.get('MAIL_USE_SSL', False),
        mail_username=current_app.config.get('MAIL_USERNAME', ''),
        has_password=bool(current_app.config.get('MAIL_PASSWORD')),
        mail_default_sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@elechub.campus.ac.ug'),
        smtp_active=is_smtp_active()
    )


@email_bp.route('/api/test-connection', methods=['POST'])
@login_required
def api_test_connection():
    data = request.get_json() or {}
    server = (data.get('mail_server') or '').strip() or current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
    port = data.get('mail_port') or current_app.config.get('MAIL_PORT', 587)
    use_tls = bool(data.get('mail_use_tls', True))
    use_ssl = bool(data.get('mail_use_ssl', False))
    username = (data.get('mail_username') or '').strip() or current_app.config.get('MAIL_USERNAME', '')
    password = (data.get('mail_password') or '').strip() or current_app.config.get('MAIL_PASSWORD', '')

    success, message = test_smtp_connection(
        server=server,
        port=port,
        username=username,
        password=password,
        use_tls=use_tls,
        use_ssl=use_ssl
    )

    return jsonify({
        'success': success,
        'message': message
    }), (200 if success else 400)
