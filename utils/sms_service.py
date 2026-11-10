import os
import re
import uuid
from uuid import uuid4
import time
from datetime import datetime, timezone
from flask import current_app
from models import db, SmsCampaign, SmsLog, OptOut

# GSM-7 basic character set
GSM_7_CHARS = set(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
)
# Extended characters count as 2 chars in GSM 7
GSM_7_EXTENDED = set("^{}\\[~]|€")


def normalize_phone_number(raw_phone):
    """
    Normalizes phone numbers to standard E.164 format.
    E.g. for Uganda: 0701122334 or 701122334 -> +256701122334
    Auto-corrects common user typos like letter 'O'/'o' entered instead of digit '0',
    handles +25607... (redundant 0 after country code), spaces, dashes, etc.
    """
    if not raw_phone:
        return ""
    s = str(raw_phone).strip()
    # Correct common typographical errors (letter O/o instead of digit 0)
    s = s.replace('O', '0').replace('o', '0')
    has_plus = s.startswith('+')

    # Extract only digits
    digits = re.sub(r'[^\d]', '', s)
    if not digits:
        return ""

    # Uganda specific normalization
    # Case: +25607XXXXXXXX (13 digits: 256 + 0 + 9-digit mobile) -> strip redundant 0
    if digits.startswith('2560') and len(digits) == 13:
        return '+256' + digits[4:]
    # Case: 07XXXXXXXX (10 digits starting with 07) -> +2567XXXXXXXX
    if digits.startswith('07') and len(digits) == 10:
        return '+256' + digits[1:]
    # Case: 7XXXXXXXX (9 digits starting with 7) -> +2567XXXXXXXX
    if digits.startswith('7') and len(digits) == 9:
        return '+256' + digits
    # Case: 2567XXXXXXXX (12 digits starting with 256) -> +2567XXXXXXXX
    if digits.startswith('256') and len(digits) == 12:
        return '+' + digits
    # Case: international dialing prefix 00...
    if s.startswith('00'):
        return '+' + digits[2:]

    # Generic international number with + or without
    if has_plus:
        return '+' + digits
    if len(digits) >= 10:
        return '+' + digits
    return '+' + digits


def calculate_sms_segments(text):
    """
    Calculates character count, Unicode detection, and SMS billable segments.
    GSM 7-bit: 1-160 chars = 1 segment, multi-part = 153 chars per segment.
    Unicode (UCS-2): 1-70 chars = 1 segment, multi-part = 67 chars per segment.
    """
    if not text:
        return {'chars': 0, 'segments': 0, 'is_unicode': False, 'encoding': 'GSM-7', 'max_single': 160}

    is_unicode = False
    effective_length = 0

    for ch in text:
        if ch in GSM_7_EXTENDED:
            effective_length += 2
        elif ch in GSM_7_CHARS:
            effective_length += 1
        else:
            is_unicode = True
            break

    if is_unicode:
        char_count = len(text)
        if char_count <= 70:
            segments = 1 if char_count > 0 else 0
        else:
            segments = (char_count + 66) // 67
        return {
            'chars': char_count,
            'segments': segments,
            'is_unicode': True,
            'encoding': 'Unicode (UCS-2)',
            'max_single': 70,
            'chars_left_in_segment': (70 - char_count) if segments <= 1 else (67 - (char_count % 67))
        }
    else:
        if effective_length <= 160:
            segments = 1 if effective_length > 0 else 0
        else:
            segments = (effective_length + 152) // 153
        return {
            'chars': effective_length,
            'segments': segments,
            'is_unicode': False,
            'encoding': 'GSM 7-bit',
            'max_single': 160,
            'chars_left_in_segment': (160 - effective_length) if segments <= 1 else (153 - (effective_length % 153))
        }


def interpolate_sms_template(template, recipient_name="", candidate=None, election=None):
    """
    Interpolates standard campus election variables into SMS template text:
    {{ name }}, {{ candidate_name }}, {{ position }}, {{ slogan }}, {{ election_name }}
    """
    rendered = template or ""

    # Recipient name
    rendered = re.sub(r'\{\{\s*(name|recipient_name|voter_name)\s*\}\}', recipient_name or "Voter", rendered, flags=re.IGNORECASE)

    # Candidate details
    c_name = candidate.name if candidate else "Our Candidate"
    c_pos = candidate.position if candidate else "Candidate"
    c_slogan = candidate.slogan if candidate else ""

    rendered = re.sub(r'\{\{\s*(candidate_name|candidate\.name)\s*\}\}', c_name, rendered, flags=re.IGNORECASE)
    rendered = re.sub(r'\{\{\s*(position|candidate\.position)\s*\}\}', c_pos, rendered, flags=re.IGNORECASE)
    rendered = re.sub(r'\{\{\s*(slogan|candidate\.slogan)\s*\}\}', c_slogan, rendered, flags=re.IGNORECASE)

    # Election details
    e_name = election.name if election else (candidate.election.name if candidate and candidate.election else "Campus Elections")
    rendered = re.sub(r'\{\{\s*(election_name|election\.name)\s*\}\}', e_name, rendered, flags=re.IGNORECASE)

    return rendered.strip()


def get_africastalking_client():
    """
    Attempts to initialize the Africa's Talking SMS client.
    Returns (sms_client, is_sandbox_or_live, status_message).
    """
    if current_app.config.get('TESTING'):
        return None, 'simulation', "Testing environment: Operating in Simulation Mode."

    # Prefer current_app.config if explicitly configured
    if 'AFRICA_TALKING_USERNAME' in current_app.config:
        username = current_app.config.get('AFRICA_TALKING_USERNAME')
    else:
        username = os.environ.get('AFRICA_TALKING_USERNAME')

    if 'AFRICA_TALKING_API_KEY' in current_app.config:
        api_key = current_app.config.get('AFRICA_TALKING_API_KEY')
    else:
        api_key = os.environ.get('AFRICA_TALKING_API_KEY')

    if not username or not api_key or api_key in ['your_api_key_here', '@Tusabe001']:
        return None, 'unconfigured', "Africa's Talking credentials not provided or invalid. Operating in safe Simulation Mode."

    try:
        import africastalking
        africastalking.initialize(username, api_key)
        sms = africastalking.SMS
        is_sandbox = (username.lower() == 'sandbox')
        return sms, 'sandbox' if is_sandbox else 'live', f"Connected to Africa's Talking ({'Sandbox' if is_sandbox else 'Production'})"
    except Exception as e:
        return None, 'error', f"Failed to initialize Africa's Talking: {str(e)}"


def get_africastalking_balance():
    """
    Fetches the live account balance from Africa's Talking.
    Returns (balance_str: str or None, mode: str, error: str or None).
    """
    client, mode, msg = get_africastalking_client()
    if not client or mode not in ['live', 'sandbox']:
        return None, mode, "Gateway operating in simulation mode"
    try:
        import africastalking
        app_data = africastalking.Application.fetch_application_data()
        user_data = app_data.get('UserData', {})
        balance = user_data.get('balance', 'UGX 0.00')
        return balance, mode, None
    except Exception as e:
        return None, mode, str(e)


def is_number_opted_out(phone):
    """Checks if normalized phone number exists in OptOut table."""
    norm = normalize_phone_number(phone)
    return db.session.query(OptOut).filter(OptOut.phone == norm).first() is not None


def record_opt_out(phone, reason="STOP keyword"):
    """Adds a phone number to the opt-out registry if not already present."""
    norm = normalize_phone_number(phone)
    if not norm:
        return None
    existing = db.session.query(OptOut).filter(OptOut.phone == norm).first()
    if not existing:
        entry = OptOut(phone=norm, reason=reason)
        db.session.add(entry)
        db.session.commit()
        return entry
    return existing


def send_single_sms(to_phone, message_text, sender_id=None):
    """
    Sends a single test SMS, returns (success: bool, info: dict).
    """
    norm_phone = normalize_phone_number(to_phone)
    if not norm_phone:
        return False, {'error': 'Invalid phone number'}

    if is_number_opted_out(norm_phone):
        return False, {'error': f'{norm_phone} has opted out of campaign messages.'}

    client, mode, msg = get_africastalking_client()
    sender = sender_id or current_app.config.get('AFRICA_TALKING_SENDER_ID') or os.environ.get('AFRICA_TALKING_SENDER_ID') or None

    if client and mode in ['live', 'sandbox']:
        try:
            kwargs = {
                'message': message_text,
                'recipients': [norm_phone]
            }
            if sender and mode == 'live':
                kwargs['sender_id'] = sender

            response = client.send(**kwargs)
            sms_data = response.get('SMSMessageData', {})
            recipients_data = sms_data.get('Recipients', [])
            top_msg = sms_data.get('Message', '')

            if recipients_data:
                r0 = recipients_data[0]
                status_raw = r0.get('status', 'Success')
                is_ok = status_raw.lower() in ['success', 'sent']
                err_msg = None if is_ok else (status_raw or top_msg or 'Carrier rejected delivery')
                return is_ok, {
                    'message_id': r0.get('messageId', f'AT_{uuid4().hex[:10]}'),
                    'cost': r0.get('cost', 'UGX 30.00'),
                    'status': 'sent' if is_ok else 'failed',
                    'error': err_msg,
                    'mode': mode
                }

            # If recipients_data is empty, Africa's Talking rejected the request at the gateway level!
            if top_msg == 'InvalidSenderId':
                err_reason = f"Carrier Rejected: Custom Sender ID '{sender}' is not approved on your Africa's Talking account. Leave Sender ID empty to use Africa's Talking default shortcode."
            elif 'insufficient' in top_msg.lower():
                err_reason = f"Africa's Talking balance depleted: {top_msg}. Please top up airtime."
            else:
                err_reason = top_msg or "Carrier rejected dispatch (No recipient confirmation from Africa's Talking)."

            return False, {
                'status': 'failed',
                'error': err_reason,
                'mode': mode
            }
        except Exception as e:
            return False, {'error': str(e), 'mode': mode}

    # Simulation fallback mode
    sim_id = f"AT_SIM_{uuid4().hex[:12].upper()}"
    return True, {
        'message_id': sim_id,
        'cost': 'UGX 30.00',
        'status': 'sent',
        'mode': 'simulated',
        'note': 'Simulated dispatch (No live AT credentials)'
    }


def execute_campaign_broadcast(campaign, recipient_tuples, append_opt_out=True):
    """
    Executes a bulk SMS blast for an SmsCampaign.
    recipient_tuples: list of tuples (name, raw_phone)
    Batches in chunks of 100 with compliance filtering and logging.
    """
    opt_out_footer = "\n(Reply STOP to opt out)"
    base_template = campaign.message.strip()

    candidate = campaign.candidate_rel
    election = candidate.election if candidate and candidate.election else None

    # Load all existing opt-outs for quick set check
    opt_out_numbers = set(row[0] for row in db.session.query(OptOut.phone).all())

    prepared_items = []
    opt_out_skipped = 0

    for name, raw_phone in recipient_tuples:
        norm_phone = normalize_phone_number(raw_phone)
        if not norm_phone:
            continue

        if norm_phone in opt_out_numbers:
            opt_out_skipped += 1
            continue

        personalized_msg = interpolate_sms_template(base_template, recipient_name=name, candidate=candidate, election=election)
        if append_opt_out and "(Reply STOP" not in personalized_msg:
            personalized_msg += opt_out_footer

        prepared_items.append({
            'name': name,
            'phone': norm_phone,
            'message': personalized_msg
        })

    client, mode, _ = get_africastalking_client()
    sender = campaign.sender_id or current_app.config.get('AFRICA_TALKING_SENDER_ID') or os.environ.get('AFRICA_TALKING_SENDER_ID') or None

    total_sent = 0
    total_failed = 0
    total_delivered = 0
    total_cost_ugx = 0.0

    # Process in chunks of 100
    chunk_size = 100
    for i in range(0, len(prepared_items), chunk_size):
        chunk = prepared_items[i:i + chunk_size]

        for item in chunk:
            msg_text = item['message']
            phone_num = item['phone']
            recip_name = item['name']

            at_msg_id = None
            cost_str = 'UGX 30.00'
            status = 'sent'
            err_msg = None

            if client and mode in ['live', 'sandbox']:
                try:
                    kwargs = {'message': msg_text, 'recipients': [phone_num]}
                    if sender and mode == 'live':
                        kwargs['sender_id'] = sender
                    resp = client.send(**kwargs)
                    sms_data = resp.get('SMSMessageData', {})
                    r_data = sms_data.get('Recipients', [])
                    top_msg = sms_data.get('Message', '')

                    if r_data:
                        r0 = r_data[0]
                        at_msg_id = r0.get('messageId')
                        cost_str = r0.get('cost') or 'UGX 30.00'
                        raw_status = r0.get('status', 'Success')
                        if raw_status.lower() in ['success', 'sent']:
                            status = 'sent'
                            total_sent += 1
                        else:
                            status = 'failed'
                            err_msg = raw_status or top_msg
                            total_failed += 1
                    else:
                        # Gateway rejected at top level (e.g. InvalidSenderId or InsufficientBalance)
                        status = 'failed'
                        total_failed += 1
                        if top_msg == 'InvalidSenderId':
                            err_msg = f"Carrier Rejected: Custom Sender ID '{sender}' is not approved on your Africa's Talking account. Leave Sender ID empty to use Africa's Talking default shortcode."
                        elif 'insufficient' in top_msg.lower():
                            err_msg = f"Africa's Talking credit depleted: {top_msg}. Please top up airtime."
                        else:
                            err_msg = top_msg or "Carrier rejected dispatch (No recipient confirmation from Africa's Talking)."
                except Exception as ex:
                    status = 'failed'
                    err_msg = str(ex)
                    total_failed += 1
            else:
                # Simulation mode
                at_msg_id = f"AT_SIM_{uuid4().hex[:12].upper()}"
                status = 'sent'
                total_sent += 1

            # Extract numeric cost for summing
            try:
                numeric_val = float(re.sub(r'[^\d\.]', '', cost_str)) if cost_str else 30.0
                total_cost_ugx += numeric_val
            except Exception:
                total_cost_ugx += 30.0

            sms_log = SmsLog(
                campaign_id=campaign.id,
                recipient=phone_num,
                recipient_name=recip_name,
                rendered_message=msg_text,
                status=status,
                at_message_id=at_msg_id,
                cost=cost_str,
                error_message=err_msg
            )
            db.session.add(sms_log)

        db.session.flush()
        if i + chunk_size < len(prepared_items):
            time.sleep(0.05)  # slight pause between batches

    # Update campaign record
    campaign.recipient_count = len(prepared_items)
    campaign.sent_count = total_sent
    campaign.failed_count = total_failed
    campaign.delivered_count = total_delivered
    campaign.opt_out_count = opt_out_skipped
    campaign.total_cost = f"UGX {total_cost_ugx:,.2f}"
    campaign.status = 'Completed' if total_failed == 0 else ('Failed' if total_sent == 0 else 'Partially Completed')

    db.session.commit()
    return {
        'total_target': len(recipient_tuples),
        'opt_out_skipped': opt_out_skipped,
        'prepared_count': len(prepared_items),
        'sent_count': total_sent,
        'failed_count': total_failed,
        'total_cost': campaign.total_cost
    }


def retry_failed_sms(campaign_id, force_default_sender=False):
    """
    Retries failed SMS dispatches for a campaign.
    If force_default_sender is True, bypasses custom sender ID to prevent InvalidSenderId errors.
    Returns (retried_success: int, retried_failed: int, message: str).
    """
    campaign = db.session.get(SmsCampaign, campaign_id)
    if not campaign:
        return 0, 0, "Campaign not found"

    failed_logs = SmsLog.query.filter_by(campaign_id=campaign.id, status='failed').all()
    if not failed_logs:
        return 0, 0, "No failed recipients to retry"

    client, mode, _ = get_africastalking_client()
    sender = None if force_default_sender else (campaign.sender_id or current_app.config.get('AFRICA_TALKING_SENDER_ID') or os.environ.get('AFRICA_TALKING_SENDER_ID') or None)

    retried_success = 0
    retried_failed = 0

    for log in failed_logs:
        if client and mode in ['live', 'sandbox']:
            try:
                kwargs = {'message': log.rendered_message, 'recipients': [log.recipient]}
                if sender and mode == 'live':
                    kwargs['sender_id'] = sender
                resp = client.send(**kwargs)
                sms_data = resp.get('SMSMessageData', {})
                r_data = sms_data.get('Recipients', [])
                top_msg = sms_data.get('Message', '')

                if r_data:
                    r0 = r_data[0]
                    raw_status = r0.get('status', 'Success')
                    if raw_status.lower() in ['success', 'sent']:
                        log.status = 'sent'
                        log.at_message_id = r0.get('messageId')
                        log.cost = r0.get('cost') or log.cost
                        log.error_message = None
                        log.sent_at = datetime.now(timezone.utc)
                        retried_success += 1
                    else:
                        log.error_message = raw_status or top_msg
                        retried_failed += 1
                else:
                    if top_msg == 'InvalidSenderId':
                        log.error_message = f"Carrier Rejected: Custom Sender ID '{sender}' is not approved on Africa's Talking. Use default shortcode."
                    elif 'insufficient' in top_msg.lower():
                        log.error_message = f"Insufficient balance: {top_msg}. Please top up airtime."
                    else:
                        log.error_message = top_msg or "Carrier rejected retry"
                    retried_failed += 1
            except Exception as ex:
                log.error_message = str(ex)
                retried_failed += 1
        else:
            log.status = 'sent'
            log.at_message_id = f"AT_SIM_{uuid4().hex[:12].upper()}"
            log.error_message = None
            log.sent_at = datetime.now(timezone.utc)
            retried_success += 1

    campaign.sent_count = (campaign.sent_count or 0) + retried_success
    campaign.failed_count = max(0, (campaign.failed_count or 0) - retried_success)
    if campaign.failed_count == 0:
        campaign.status = 'Completed'
    elif campaign.sent_count > 0:
        campaign.status = 'Partially Completed'
    else:
        campaign.status = 'Failed'

    if force_default_sender and retried_success > 0:
        campaign.sender_id = None  # switched to default sender

    db.session.commit()
    return retried_success, retried_failed, f"Retried {len(failed_logs)} recipients: {retried_success} succeeded, {retried_failed} failed."


def update_delivery_status(at_message_id, raw_status, failure_reason=None, phone_number=None):
    """
    Updates delivery report status when AT webhook fires.
    """
    query = db.session.query(SmsLog)
    if at_message_id:
        log_entry = query.filter(SmsLog.at_message_id == at_message_id).first()
    elif phone_number:
        norm_phone = normalize_phone_number(phone_number)
        log_entry = query.filter(SmsLog.recipient == norm_phone).order_by(SmsLog.sent_at.desc()).first()
    else:
        return False, "Neither message ID nor phone number provided"

    if not log_entry:
        return False, "Matching SMS log entry not found"

    norm_status = raw_status.lower() if raw_status else ''
    if norm_status in ['success', 'delivered']:
        log_entry.status = 'delivered'
        if log_entry.campaign:
            log_entry.campaign.delivered_count = (log_entry.campaign.delivered_count or 0) + 1
    elif norm_status in ['failed', 'rejected']:
        log_entry.status = 'failed'
        log_entry.error_message = failure_reason or 'Delivery failed according to carrier report'
        if log_entry.campaign:
            log_entry.campaign.failed_count = (log_entry.campaign.failed_count or 0) + 1
    else:
        log_entry.status = norm_status

    log_entry.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return True, f"Log {log_entry.id} updated to {log_entry.status}"
