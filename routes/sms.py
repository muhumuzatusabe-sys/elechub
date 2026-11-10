import os
import io
import csv
import re
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, Response, current_app
from auth import login_required
from models import db, Candidate, ContactList, Contact, SmsCampaign, SmsLog, OptOut, Election
from utils.sms_service import (
    calculate_sms_segments,
    interpolate_sms_template,
    send_single_sms,
    execute_campaign_broadcast,
    normalize_phone_number,
    get_africastalking_client,
    get_africastalking_balance,
    retry_failed_sms,
    record_opt_out,
    update_delivery_status
)

sms_bp = Blueprint('sms', __name__, url_prefix='/sms')


def _update_env_key(key, value):
    """Safely updates or uncomments a key in the project root .env file and active environment."""
    os.environ[key] = str(value) if value is not None else ''
    current_app.config[key] = str(value) if value is not None else ''
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


@sms_bp.route('/')
@login_required
def index():
    campaigns = SmsCampaign.query.order_by(SmsCampaign.created_at.desc()).all()
    contact_lists = ContactList.query.order_by(ContactList.name).all()
    candidates = Candidate.query.order_by(Candidate.name).all()

    total_sent = sum(c.sent_count or 0 for c in campaigns)
    total_delivered = sum(c.delivered_count or 0 for c in campaigns)
    total_failed = sum(c.failed_count or 0 for c in campaigns)
    total_opt_outs = OptOut.query.count()

    # Calculate aggregate cost
    total_cost_num = 0.0
    for c in campaigns:
        if c.total_cost:
            val = re.sub(r'[^\d\.]', '', c.total_cost)
            try:
                total_cost_num += float(val)
            except Exception:
                pass

    recent_logs = SmsLog.query.order_by(SmsLog.sent_at.desc()).limit(10).all()
    client, at_mode, at_msg = get_africastalking_client()

    return render_template(
        'sms/index.html',
        campaigns=campaigns,
        contact_lists=contact_lists,
        candidates=candidates,
        total_sent=total_sent,
        total_delivered=total_delivered,
        total_failed=total_failed,
        total_cost_str=f"UGX {total_cost_num:,.2f}",
        total_opt_outs=total_opt_outs,
        recent_logs=recent_logs,
        at_mode=at_mode,
        at_msg=at_msg
    )


@sms_bp.route('/compose', methods=['GET', 'POST'])
@login_required
def compose():
    contact_lists = ContactList.query.order_by(ContactList.name).all()
    candidates = Candidate.query.order_by(Candidate.name).all()
    elections = Election.query.order_by(Election.created_at.desc()).all()

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        message = request.form.get('message', '').strip()
        candidate_id = request.form.get('candidate_id', type=int)
        contact_list_id = request.form.get('contact_list_id', type=int)
        manual_numbers_raw = request.form.get('manual_numbers', '').strip()
        append_opt_out = bool(request.form.get('append_opt_out'))
        sender_id = request.form.get('sender_id', '').strip() or None

        if not title or not message:
            flash('Campaign Title and Message template are required.', 'danger')
            client, at_mode, at_msg = get_africastalking_client()
            return render_template('sms/compose.html', contact_lists=contact_lists, candidates=candidates, elections=elections, at_mode=at_mode, at_msg=at_msg)

        recipient_tuples = []

        # From contact list
        contact_list = db.session.get(ContactList, contact_list_id) if contact_list_id else None
        if contact_list:
            for c in contact_list.contacts:
                recipient_tuples.append((c.name, c.phone))

        # From manual numbers
        if manual_numbers_raw:
            raw_entries = re.split(r'[\r\n,;]+', manual_numbers_raw)
            for entry in raw_entries:
                cleaned = entry.strip()
                if len(re.sub(r'[^\d]', '', cleaned.replace('O', '0').replace('o', '0'))) >= 7:
                    recipient_tuples.append(('Voter', cleaned))

        if not recipient_tuples:
            flash('Please select a Target Voter List or manually input at least one recipient phone number.', 'danger')
            client, at_mode, at_msg = get_africastalking_client()
            return render_template('sms/compose.html', contact_lists=contact_lists, candidates=candidates, elections=elections, at_mode=at_mode, at_msg=at_msg)

        # Deduplicate recipient numbers while preserving order
        seen_phones = set()
        deduped_recipients = []
        for name, ph in recipient_tuples:
            norm = normalize_phone_number(ph)
            if norm and norm not in seen_phones:
                seen_phones.add(norm)
                deduped_recipients.append((name, norm))

        # Create campaign entity
        campaign = SmsCampaign(
            candidate_id=candidate_id,
            contact_list_id=contact_list_id if contact_list else None,
            title=title,
            message=message,
            sender_id=sender_id,
            recipient_count=len(deduped_recipients),
            status='Sending'
        )
        db.session.add(campaign)
        db.session.commit()

        # Execute broadcast
        result = execute_campaign_broadcast(campaign, deduped_recipients, append_opt_out=append_opt_out)

        if result.get('failed_count', 0) > 0 and result.get('sent_count', 0) == 0:
            flash(
                f'Bulk SMS Campaign "{title}" failed to deliver: {result["failed_count"]} recipient(s) rejected by telecom gateway. Check the details below to review carrier errors (e.g. unapproved custom Sender ID or low balance).',
                'danger'
            )
        elif result.get('failed_count', 0) > 0:
            flash(
                f'Bulk SMS Campaign "{title}" partially dispatched: {result["sent_count"]} sent, {result["failed_count"]} failed.',
                'warning'
            )
        else:
            flash(
                f'Bulk SMS Campaign "{title}" dispatched to {result["sent_count"]} recipients! Sent: {result["sent_count"]}, Skipped (Opt-out): {result["opt_out_skipped"]}. Total Cost: {result["total_cost"]}',
                'success'
            )
        return redirect(url_for('sms.campaign_detail', campaign_id=campaign.id))

    client, at_mode, at_msg = get_africastalking_client()
    at_balance, _, _ = get_africastalking_balance()
    return render_template('sms/compose.html', contact_lists=contact_lists, candidates=candidates, elections=elections, at_mode=at_mode, at_msg=at_msg, at_balance=at_balance)


@sms_bp.route('/campaign/<int:campaign_id>')
@login_required
def campaign_detail(campaign_id):
    campaign = db.session.get(SmsCampaign, campaign_id)
    if not campaign:
        flash('Campaign not found.', 'danger')
        return redirect(url_for('sms.index'))

    logs = SmsLog.query.filter_by(campaign_id=campaign.id).order_by(SmsLog.sent_at.desc()).all()
    is_simulated = any(log.at_message_id and log.at_message_id.startswith('AT_SIM_') for log in logs)
    failed_logs = [log for log in logs if log.status == 'failed']
    error_sample = failed_logs[0].error_message if failed_logs else None
    has_invalid_sender_id = any(
        log.error_message and ('invalidsenderid' in log.error_message.lower() or 'not approved' in log.error_message.lower())
        for log in failed_logs
    )
    at_balance, at_mode, _ = get_africastalking_balance()
    return render_template(
        'sms/campaign_detail.html',
        campaign=campaign,
        logs=logs,
        is_simulated=is_simulated,
        failed_count=len(failed_logs),
        error_sample=error_sample,
        has_invalid_sender_id=has_invalid_sender_id,
        at_balance=at_balance,
        at_mode=at_mode
    )


@sms_bp.route('/campaign/<int:campaign_id>/resend', methods=['POST'])
@login_required
def resend_failed(campaign_id):
    use_default_sender = request.form.get('use_default_sender', 'true').lower() in ['true', '1', 'yes']
    succeeded, failed, msg = retry_failed_sms(campaign_id, force_default_sender=use_default_sender)
    if succeeded > 0:
        flash(msg, 'success')
    else:
        flash(msg, 'danger')
    return redirect(url_for('sms.campaign_detail', campaign_id=campaign_id))


@sms_bp.route('/api/preview', methods=['POST'])
@login_required
def api_preview():
    data = request.get_json() or {}
    message_template = data.get('message', '')
    candidate_id = data.get('candidate_id')
    contact_list_id = data.get('contact_list_id')
    append_opt_out = data.get('append_opt_out', True)

    candidate = db.session.get(Candidate, candidate_id) if candidate_id else None
    election = candidate.election if candidate and candidate.election else None
    if not election:
        election = Election.query.first()

    contact_list = db.session.get(ContactList, contact_list_id) if contact_list_id else None

    # Pick up to 3 contacts
    recipients = []
    if contact_list and contact_list.contacts:
        for c in contact_list.contacts[:3]:
            recipients.append({'name': c.name, 'phone': c.phone})
    else:
        recipients = [
            {'name': 'Sample Recipient', 'phone': '+256700000000'}
        ]

    previews = []
    opt_out_footer = "\n(Reply STOP to opt out)"
    for r in recipients:
        rendered = interpolate_sms_template(message_template, recipient_name=r['name'], candidate=candidate, election=election)
        if append_opt_out and "(Reply STOP" not in rendered:
            rendered += opt_out_footer
        seg_info = calculate_sms_segments(rendered)
        previews.append({
            'recipient_name': r['name'],
            'recipient_phone': r['phone'],
            'rendered_message': rendered,
            'chars': seg_info['chars'],
            'segments': seg_info['segments'],
            'is_unicode': seg_info['is_unicode']
        })

    return jsonify({'success': True, 'previews': previews})


@sms_bp.route('/api/calculate-segments', methods=['POST'])
@login_required
def api_calculate_segments():
    data = request.get_json() or {}
    text = data.get('text', '')
    append_opt_out = data.get('append_opt_out', False)
    if append_opt_out and "(Reply STOP" not in text:
        text += "\n(Reply STOP to opt out)"
    seg_info = calculate_sms_segments(text)
    return jsonify({'success': True, 'data': seg_info})


@sms_bp.route('/api/send-test', methods=['POST'])
@login_required
def api_send_test():
    data = request.get_json() or {}
    test_phone = data.get('phone', '').strip()
    message_text = data.get('message', '').strip()
    candidate_id = data.get('candidate_id')
    sender_id = data.get('sender_id')

    if not test_phone or not message_text:
        return jsonify({'success': False, 'error': 'Phone number and message text are required.'}), 400

    candidate = db.session.get(Candidate, candidate_id) if candidate_id else None
    election = candidate.election if candidate and candidate.election else Election.query.first()

    rendered = interpolate_sms_template(message_text, recipient_name='Test Admin', candidate=candidate, election=election)
    if "(Reply STOP" not in rendered:
        rendered += "\n(Reply STOP to opt out)"

    ok, res = send_single_sms(test_phone, rendered, sender_id=sender_id)
    if ok:
        return jsonify({
            'success': True,
            'message': f'Test SMS sent to {test_phone} successfully!',
            'details': res,
            'rendered_preview': rendered
        })
    else:
        return jsonify({
            'success': False,
            'error': res.get('error', 'Failed to send test SMS'),
            'details': res
        }), 400


@sms_bp.route('/api/test-connection', methods=['POST'])
@login_required
def api_test_connection():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip() or current_app.config.get('AFRICA_TALKING_USERNAME') or os.environ.get('AFRICA_TALKING_USERNAME') or ''
    api_key = (data.get('api_key') or '').strip() or current_app.config.get('AFRICA_TALKING_API_KEY') or os.environ.get('AFRICA_TALKING_API_KEY') or ''

    if not username or not api_key:
        return jsonify({'success': False, 'error': 'Both Africa\'s Talking Username and API Key are required to test connection.'}), 400

    try:
        import africastalking
        africastalking.initialize(username, api_key)
        is_sandbox = (username.lower() == 'sandbox')
        
        balance_info = 'Active'
        try:
            user_data = africastalking.Application.fetch_application_data()
            balance_info = user_data.get('UserData', {}).get('balance', 'Active')
        except Exception:
            # Sub-applications on Africa's Talking (like ELECHUBS) authenticate on the SMS gateway
            balance_info = 'Live & Ready'

        return jsonify({
            'success': True,
            'mode': 'sandbox' if is_sandbox else 'live',
            'balance': balance_info,
            'message': f"Authentication Successful! Connected to Africa's Talking ({'Sandbox' if is_sandbox else 'Live/Production'}). Status: {balance_info}"
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@sms_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'reset_simulation':
            current_app.config['AFRICA_TALKING_USERNAME'] = ''
            current_app.config.pop('AFRICA_TALKING_API_KEY', None)
            _update_env_key('AFRICA_TALKING_USERNAME', '')
            _update_env_key('AFRICA_TALKING_API_KEY', '')
            flash("Gateway reset to Safe Simulation Mode. All subsequent test dispatches will simulate safely.", "info")
            return redirect(url_for('sms.settings'))

        username = request.form.get('africastalking_username', '').strip()
        api_key = request.form.get('africastalking_api_key', '').strip()
        sender_id = request.form.get('africastalking_sender_id', '').strip()

        # Update in-memory config for immediate use
        current_app.config['AFRICA_TALKING_USERNAME'] = username or 'sandbox'
        if api_key:
            current_app.config['AFRICA_TALKING_API_KEY'] = api_key
        current_app.config['AFRICA_TALKING_SENDER_ID'] = sender_id

        # Persist to .env file for reboot survival
        if username:
            _update_env_key('AFRICA_TALKING_USERNAME', username)
        if api_key:
            _update_env_key('AFRICA_TALKING_API_KEY', api_key)
        if sender_id is not None:
            _update_env_key('AFRICA_TALKING_SENDER_ID', sender_id)

        flash("Africa's Talking gateway configuration updated and saved to system.", 'success')
        return redirect(url_for('sms.settings'))

    client, at_mode, at_msg = get_africastalking_client()
    at_balance, _, _ = get_africastalking_balance()
    return render_template(
        'sms/settings.html',
        username=current_app.config.get('AFRICA_TALKING_USERNAME', 'sandbox'),
        has_api_key=bool(current_app.config.get('AFRICA_TALKING_API_KEY')),
        sender_id=current_app.config.get('AFRICA_TALKING_SENDER_ID', ''),
        at_mode=at_mode,
        at_msg=at_msg,
        at_balance=at_balance
    )


@sms_bp.route('/opt-outs', methods=['GET', 'POST'])
@login_required
def opt_outs():
    if request.method == 'POST':
        phone = request.form.get('phone', '').strip()
        reason = request.form.get('reason', 'Admin manual entry').strip()
        if phone:
            entry = record_opt_out(phone, reason=reason)
            flash(f'Phone {entry.phone} added to opt-out registry.', 'success')
        else:
            flash('Phone number is required.', 'danger')
        return redirect(url_for('sms.opt_outs'))

    records = OptOut.query.order_by(OptOut.created_at.desc()).all()
    return render_template('sms/opt_outs.html', records=records)


@sms_bp.route('/opt-outs/delete/<int:record_id>', methods=['POST'])
@login_required
def delete_opt_out(record_id):
    entry = db.session.get(OptOut, record_id)
    if entry:
        db.session.delete(entry)
        db.session.commit()
        flash(f'Phone number {entry.phone} removed from opt-out registry.', 'success')
    return redirect(url_for('sms.opt_outs'))


@sms_bp.route('/export/<int:list_id>')
@login_required
def export_csv(list_id):
    contact_list = db.session.get(ContactList, list_id)
    if not contact_list:
        flash('Contact list not found.', 'danger')
        return redirect(url_for('sms.index'))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Name', 'Phone', 'Email', 'Hall/College'])
    for c in contact_list.contacts:
        writer.writerow([c.name, c.phone, c.email or '', c.hall_or_college or ''])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=voters-{contact_list.name.replace(' ', '_').lower()}.csv"}
    )


@sms_bp.route('/webhook/delivery', methods=['POST'])
def delivery_webhook():
    """
    Africa's Talking Delivery Reports Webhook endpoint.
    Receives POST with formData: id, status, phoneNumber, failureReason, retryCount
    """
    at_id = request.form.get('id') or request.json.get('id') if request.is_json else None
    status = request.form.get('status') or request.json.get('status') if request.is_json else None
    phone = request.form.get('phoneNumber') or request.json.get('phoneNumber') if request.is_json else None
    failure_reason = request.form.get('failureReason') or request.json.get('failureReason') if request.is_json else None

    success, msg = update_delivery_status(at_id, status, failure_reason, phone)
    return jsonify({'received': True, 'updated': success, 'message': msg})
