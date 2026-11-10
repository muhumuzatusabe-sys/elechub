import os
import re
import time
from datetime import datetime, timezone
from flask import current_app
from flask_mail import Message
from models import db, EmailCampaign, EmailLog, CampaignProject, Candidate
import smtplib


def interpolate_email_template(content, recipient_name="", candidate=None, election=None):
    """
    Interpolates variables in email subject lines or HTML bodies:
    {{ name }}, {{ candidate_name }}, {{ position }}, {{ slogan }}, {{ election_name }}
    """
    if not content:
        return ""

    rendered = content

    # Recipient name
    rendered = re.sub(r'\{\{\s*(name|recipient_name|voter_name)\s*\}\}', recipient_name or "Voter", rendered, flags=re.IGNORECASE)

    # Candidate details with natural fallbacks
    c_name = (candidate.name if candidate and candidate.name else "").strip()
    c_pos = (candidate.position if candidate and candidate.position else "").strip()
    c_slogan = (candidate.slogan if candidate and candidate.slogan else "").strip()

    # If candidate details are missing, handle combined pattern: "{{ candidate_name }} for {{ position }}"
    if not c_name and not c_pos:
        rendered = re.sub(r'\{\{\s*candidate_name\s*\}\}\s*(for\s*\{\{\s*position\s*\}\})?', 'Campus Leadership', rendered, flags=re.IGNORECASE)
    elif c_name and not c_pos:
        rendered = re.sub(r'\s*for\s*\{\{\s*position\s*\}\}', '', rendered, flags=re.IGNORECASE)

    rendered = re.sub(r'\{\{\s*(candidate_name|candidate\.name)\s*\}\}', c_name or "Our Campaign", rendered, flags=re.IGNORECASE)
    rendered = re.sub(r'\{\{\s*(position|candidate\.position)\s*\}\}', c_pos or "Student Leadership", rendered, flags=re.IGNORECASE)
    rendered = re.sub(r'\{\{\s*(slogan|candidate\.slogan)\s*\}\}', c_slogan or "", rendered, flags=re.IGNORECASE)

    # Election details
    e_name = election.name if election else (candidate.election.name if candidate and candidate.election else "Campus Elections")
    rendered = re.sub(r'\{\{\s*(election_name|election\.name)\s*\}\}', e_name or "Campus Elections", rendered, flags=re.IGNORECASE)

    # Clean up double spaces or dangling "for " in subject or headers
    rendered = re.sub(r'\s+for\s*$', '', rendered)
    rendered = re.sub(r'\s{2,}', ' ', rendered)

    return rendered.strip()


def get_candidate_poster_attachment(candidate_id):
    """
    Finds a candidate's official campaign poster or photo on disk to attach.
    Returns (abs_file_path, filename, mime_type) or None.
    """
    if not candidate_id:
        return None

    # Check for recent saved CampaignProject thumbnail or poster
    project = CampaignProject.query.filter_by(candidate_id=candidate_id).order_by(CampaignProject.updated_at.desc()).first()
    if project and project.thumbnail_url:
        clean_rel = project.thumbnail_url.lstrip('/')
        abs_path = os.path.join(current_app.root_path, clean_rel)
        if os.path.exists(abs_path):
            ext = os.path.splitext(abs_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/jpeg'
            return abs_path, f"campaign-poster-{candidate_id}{ext}", mime

    # Check candidate photo
    candidate = db.session.get(Candidate, candidate_id)
    if candidate and candidate.photo:
        clean_rel = candidate.photo.lstrip('/')
        abs_path = os.path.join(current_app.root_path, clean_rel)
        if os.path.exists(abs_path):
            ext = os.path.splitext(abs_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/jpeg'
            return abs_path, f"candidate-photo-{candidate_id}{ext}", mime

    return None


def is_smtp_active():
    """
    Returns True if live SMTP credentials are configured and not dummy placeholders.
    """
    user = current_app.config.get('MAIL_USERNAME') or os.environ.get('MAIL_USERNAME', '')
    pwd = current_app.config.get('MAIL_PASSWORD') or os.environ.get('MAIL_PASSWORD', '')
    server = current_app.config.get('MAIL_SERVER') or os.environ.get('MAIL_SERVER', '')
    if not user or not pwd or not server or user == 'your_email@gmail.com':
        return False
    return True


def send_single_email(to_email, subject, body_html, recipient_name="", candidate=None, attach_poster=False, sender=None):
    """
    Dispatches a single email (or test email).
    Returns (success: bool, info: dict).
    """
    if not to_email or '@' not in to_email:
        return False, {'error': 'Invalid email address'}

    election = candidate.election if candidate and candidate.election else None
    rendered_subject = interpolate_email_template(subject, recipient_name=recipient_name, candidate=candidate, election=election)
    rendered_body = interpolate_email_template(body_html, recipient_name=recipient_name, candidate=candidate, election=election)

    # Wrap in standard campus campaign branded email wrapper if raw HTML
    if '<html' not in rendered_body.lower():
        color_brand = candidate.color_theme if candidate and candidate.color_theme else '#4f46e5'
        
        header_block = ""
        if candidate and candidate.name:
            cand_pos = f' — {candidate.position}' if candidate.position else ''
            header_block = f"""
                <div style="background: {color_brand}; padding: 20px 24px; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 800;">{candidate.name}{cand_pos}</h2>
                    {f'<p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">{election.name}</p>' if election and election.name else ''}
                </div>
            """
        elif election and election.name:
            header_block = f"""
                <div style="background: {color_brand}; padding: 20px 24px; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 800;">{election.name}</h2>
                </div>
            """

        wrapped_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                {header_block}
                <div style="padding: 28px 24px; font-size: 14px; line-height: 1.6;">
                    {rendered_body}
                </div>
                <div style="background: #f8fafc; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
                    Official Student Campaign Communication • Powered by ELECHUB
                </div>
            </div>
        </body>
        </html>
        """
    else:
        wrapped_body = rendered_body

    from app import mail
    default_sender = current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@elechub.campus.ac.ug')
    mail_sender = sender or default_sender

    msg = Message(
        subject=rendered_subject,
        recipients=[to_email],
        html=wrapped_body,
        sender=mail_sender
    )

    attached_path = None
    if attach_poster and candidate:
        attachment_info = get_candidate_poster_attachment(candidate.id)
        if attachment_info:
            file_path, filename, mime = attachment_info
            try:
                with open(file_path, 'rb') as fp:
                    msg.attach(filename, mime, fp.read())
                    attached_path = file_path
            except Exception as ex:
                pass

    if is_smtp_active() and not current_app.config.get('TESTING'):
        try:
            mail.send(msg)
            return True, {
                'status': 'sent',
                'mode': 'live_smtp',
                'recipient': to_email,
                'attached_poster': attached_path
            }
        except (smtplib.SMTPException, OSError, Exception) as ex:
            return False, {
                'status': 'failed',
                'error': str(ex),
                'mode': 'live_smtp'
            }
    else:
        is_testing = bool(current_app.config.get('TESTING'))
        return True, {
            'status': 'sent' if is_testing else 'simulated',
            'mode': 'test' if is_testing else 'simulation',
            'recipient': to_email,
            'note': 'Dispatched in safe simulation mode (No live SMTP credentials configured in Settings). Real inboxes will not receive emails until SMTP settings are saved.',
            'attached_poster': attached_path
        }


def execute_email_broadcast(campaign, recipient_tuples, attach_poster=False):
    """
    Batches email sends in chunks of 20 with rate-limiting pauses.
    Gracefully catches errors per recipient so one invalid inbox does not halt the broadcast.
    """
    candidate = campaign.candidate_rel
    election = candidate.election if candidate and candidate.election else None

    # Deduplicate recipients by email
    seen_emails = set()
    deduped = []
    for name, email in recipient_tuples:
        clean = (email or '').strip().lower()
        if clean and '@' in clean and clean not in seen_emails:
            seen_emails.add(clean)
            deduped.append((name or 'Voter', clean))

    total_sent = 0
    total_simulated = 0
    total_failed = 0

    chunk_size = 20
    for i in range(0, len(deduped), chunk_size):
        chunk = deduped[i:i + chunk_size]

        for name, email in chunk:
            ok, res = send_single_email(
                to_email=email,
                subject=campaign.subject,
                body_html=campaign.body_html,
                recipient_name=name,
                candidate=candidate,
                attach_poster=attach_poster
            )

            status = res.get('status', 'sent' if ok else 'failed')
            err_msg = res.get('error') if not ok else (res.get('note') if status == 'simulated' else None)
            attached_path = res.get('attached_poster')

            if status == 'sent':
                total_sent += 1
            elif status == 'simulated':
                total_simulated += 1
            else:
                total_failed += 1

            # Log send record
            email_log = EmailLog(
                campaign_id=campaign.id,
                recipient=email,
                recipient_name=name,
                subject=interpolate_email_template(campaign.subject, recipient_name=name, candidate=candidate, election=election),
                body_html=campaign.body_html,
                status=status,
                error_message=err_msg,
                attached_poster_path=attached_path
            )
            db.session.add(email_log)

        db.session.flush()
        if i + chunk_size < len(deduped):
            time.sleep(0.05)  # brief pause between SMTP batches

    is_sim = (total_simulated > 0 and total_sent == 0)
    campaign.recipient_count = len(deduped)
    campaign.sent_count = total_sent if not is_sim else total_simulated
    campaign.failed_count = total_failed
    campaign.attach_poster = attach_poster
    if is_sim:
        campaign.status = 'Simulated'
    elif total_sent > 0 and total_failed == 0:
        campaign.status = 'Completed'
    elif total_sent > 0:
        campaign.status = 'Partially Completed'
    else:
        campaign.status = 'Failed'

    db.session.commit()

    return {
        'total_target': len(recipient_tuples),
        'deduped_count': len(deduped),
        'sent_count': total_sent,
        'simulated_count': total_simulated,
        'failed_count': total_failed,
        'status': campaign.status,
        'is_simulation': is_sim
    }


def retry_failed_emails(campaign_id):
    """
    Retries only the failed recipients for a given EmailCampaign.
    """
    campaign = db.session.get(EmailCampaign, campaign_id)
    if not campaign:
        return 0, 0, "Campaign not found"

    failed_logs = EmailLog.query.filter_by(campaign_id=campaign.id, status='failed').all()
    if not failed_logs:
        return 0, 0, "No failed recipients to retry"

    candidate = campaign.candidate_rel
    retried_success = 0
    retried_failed = 0

    for log in failed_logs:
        ok, res = send_single_email(
            to_email=log.recipient,
            subject=campaign.subject,
            body_html=campaign.body_html,
            recipient_name=log.recipient_name,
            candidate=candidate,
            attach_poster=campaign.attach_poster
        )
        if ok and res.get('status') == 'sent':
            log.status = 'sent'
            log.error_message = None
            log.sent_at = datetime.now(timezone.utc)
            retried_success += 1
        else:
            log.error_message = res.get('error', 'Retry failed')
            retried_failed += 1

    campaign.sent_count = EmailLog.query.filter_by(campaign_id=campaign.id, status='sent').count()
    campaign.failed_count = EmailLog.query.filter_by(campaign_id=campaign.id, status='failed').count()
    if campaign.failed_count == 0 and campaign.sent_count > 0:
        campaign.status = 'Completed'

    db.session.commit()
    return retried_success, retried_failed, f"Retried {len(failed_logs)} failed recipients: {retried_success} succeeded, {retried_failed} failed."


def resend_campaign_emails(campaign_id):
    """
    Dispatches simulated or failed emails for an EmailCampaign via live SMTP.
    Returns (retried_success: int, retried_failed: int, message: str).
    """
    campaign = db.session.get(EmailCampaign, campaign_id)
    if not campaign:
        return 0, 0, "Campaign not found"

    target_logs = EmailLog.query.filter(
        EmailLog.campaign_id == campaign.id,
        EmailLog.status.in_(['failed', 'simulated'])
    ).all()

    if not target_logs:
        return 0, 0, "No pending simulated or failed recipients to send"

    if not is_smtp_active() and not current_app.config.get('TESTING'):
        return 0, 0, "Live SMTP credentials are not configured yet. Please configure your outgoing mail server in Settings first."

    candidate = campaign.candidate_rel
    retried_success = 0
    retried_failed = 0

    for log in target_logs:
        ok, res = send_single_email(
            to_email=log.recipient,
            subject=campaign.subject,
            body_html=campaign.body_html,
            recipient_name=log.recipient_name,
            candidate=candidate,
            attach_poster=campaign.attach_poster
        )
        if ok and res.get('status') == 'sent':
            log.status = 'sent'
            log.error_message = None
            log.sent_at = datetime.now(timezone.utc)
            retried_success += 1
        else:
            log.status = 'failed'
            log.error_message = res.get('error', 'SMTP dispatch failed')
            retried_failed += 1

    campaign.sent_count = EmailLog.query.filter_by(campaign_id=campaign.id, status='sent').count()
    campaign.failed_count = EmailLog.query.filter_by(campaign_id=campaign.id, status='failed').count()
    if campaign.failed_count == 0 and campaign.sent_count > 0:
        campaign.status = 'Completed'
    elif campaign.sent_count > 0:
        campaign.status = 'Partially Completed'
    else:
        campaign.status = 'Failed'

    db.session.commit()
    return retried_success, retried_failed, f"Dispatched {len(target_logs)} recipients: {retried_success} sent successfully via SMTP, {retried_failed} failed."


def test_smtp_connection(server, port, username, password, use_tls=True, use_ssl=False, timeout=10):
    """
    Tests SMTP connection and credentials authentication.
    Returns (success: bool, message: str).
    """
    if not server or not username or not password:
        return False, "Server host, username, and password are required to test SMTP connection."

    try:
        port = int(port)
    except (ValueError, TypeError):
        return False, "Port must be a valid integer (e.g. 587 or 465)."

    username = (username or '').strip()
    password = (password or '').strip().replace(' ', '')

    try:
        if use_ssl or port == 465:
            server_conn = smtplib.SMTP_SSL(server, port, timeout=timeout)
            server_conn.ehlo()
        else:
            server_conn = smtplib.SMTP(server, port, timeout=timeout)
            server_conn.ehlo()
            if use_tls:
                server_conn.starttls()
                server_conn.ehlo()

        server_conn.login(username, password)
        server_conn.quit()
        return True, f"Authentication successful! Successfully connected to {server}:{port} as {username}."
    except smtplib.SMTPAuthenticationError as auth_err:
        err_str = str(auth_err)
        hint = ""
        if "535" in err_str or "Username and Password not accepted" in err_str:
            if '@' not in username:
                hint = f" Hint: Your Account Username is set to '{username}'. It must be your full email address (e.g. elechub8@gmail.com), not just a name."
            else:
                hint = " Hint: If using Gmail, make sure you enter a 16-character Google App Password (not your standard Google password) generated at myaccount.google.com/apppasswords."
        return False, f"Authentication failed: {err_str}.{hint}"
    except smtplib.SMTPConnectError as conn_err:
        return False, f"Connection to {server}:{port} failed: {conn_err}. Check server address and firewall/port access."
    except Exception as ex:
        return False, f"SMTP Connection error: {str(ex)}"
