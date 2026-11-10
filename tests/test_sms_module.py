import os
import unittest
from app import create_app
from config import Config
from models import db, Election, Candidate, ContactList, Contact, SmsCampaign, SmsLog, OptOut
from utils.sms_service import (
    normalize_phone_number,
    calculate_sms_segments,
    interpolate_sms_template,
    execute_campaign_broadcast,
    send_single_sms,
    record_opt_out,
    is_number_opted_out,
    update_delivery_status
)


class SmsTestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    ADMIN_PASSWORD = 'testsecretpassword'
    AFRICA_TALKING_USERNAME = 'sandbox'
    AFRICA_TALKING_API_KEY = ''
    AFRICA_TALKING_SENDER_ID = 'ELECHUB'


class SmsModuleTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(SmsTestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self):
        return self.client.post('/login', data={'password': 'testsecretpassword'}, follow_redirects=True)

    def create_sample_election_and_candidate(self):
        election = Election(name="Guild Elections 2026")
        db.session.add(election)
        db.session.flush()

        candidate = Candidate(
            election_id=election.id,
            name="Allan Ssenyonjo",
            position="Guild President",
            slogan="Action Over Rhetoric",
            phone="+256701122334",
            email="allan@campus.ac.ug"
        )
        db.session.add(candidate)

        contact_list = ContactList(
            election_id=election.id,
            name="Livingstone Hall Voters"
        )
        db.session.add(contact_list)
        db.session.flush()

        c1 = Contact(contact_list_id=contact_list.id, name="Brian Kato", phone="0701234567", email="brian@campus.ac.ug")
        c2 = Contact(contact_list_id=contact_list.id, name="Sarah Namubiru", phone="+256782345678", email="sarah@campus.ac.ug")
        c3 = Contact(contact_list_id=contact_list.id, name="David Ochieng", phone="0773456789", email="david@campus.ac.ug")
        db.session.add_all([c1, c2, c3])
        db.session.commit()

        return election, candidate, contact_list

    def test_phone_normalization(self):
        self.assertEqual(normalize_phone_number("0701122334"), "+256701122334")
        self.assertEqual(normalize_phone_number("701122334"), "+256701122334")
        self.assertEqual(normalize_phone_number("+256782233445"), "+256782233445")
        self.assertEqual(normalize_phone_number("256773344556"), "+256773344556")
        self.assertEqual(normalize_phone_number("0701-122-334"), "+256701122334")
        self.assertEqual(normalize_phone_number("+254711000000"), "+254711000000")
        # Typo correction: letter 'O'/'o' instead of digit '0'
        self.assertEqual(normalize_phone_number("+O760834256"), "+256760834256")
        self.assertEqual(normalize_phone_number("O760834256"), "+256760834256")
        # Redundant trunk zero after +256
        self.assertEqual(normalize_phone_number("+2560701122334"), "+256701122334")

    def test_sms_segment_calculation(self):
        # Single standard GSM-7 message (<= 160 chars)
        short_text = "Vote Allan for Guild President! Rally at 4PM at Freedom Square."
        res1 = calculate_sms_segments(short_text)
        self.assertEqual(res1['segments'], 1)
        self.assertFalse(res1['is_unicode'])
        self.assertEqual(res1['encoding'], 'GSM 7-bit')

        # Multi-segment message (> 160 chars)
        long_text = "A" * 165
        res2 = calculate_sms_segments(long_text)
        self.assertEqual(res2['segments'], 2)
        self.assertEqual(res2['chars'], 165)

        # Unicode detection (e.g. emoji or special symbols)
        unicode_text = "Vote Allan 🗳️ for Guild President!"
        res3 = calculate_sms_segments(unicode_text)
        self.assertTrue(res3['is_unicode'])
        self.assertEqual(res3['encoding'], 'Unicode (UCS-2)')

    def test_template_interpolation(self):
        election, candidate, _ = self.create_sample_election_and_candidate()

        template = "Hello {{ name }}, vote {{ candidate_name }} for {{ position }} in {{ election_name }}! Slogan: {{ slogan }}."
        rendered = interpolate_sms_template(template, recipient_name="Brian Kato", candidate=candidate, election=election)

        self.assertIn("Hello Brian Kato", rendered)
        self.assertIn("vote Allan Ssenyonjo", rendered)
        self.assertIn("for Guild President", rendered)
        self.assertIn("Guild Elections 2026", rendered)
        self.assertIn("Action Over Rhetoric", rendered)

    def test_opt_out_compliance(self):
        election, candidate, contact_list = self.create_sample_election_and_candidate()

        # Add Sarah's number to OptOut
        sarah_phone = "+256782345678"
        record_opt_out(sarah_phone, reason="Student texted STOP")

        self.assertTrue(is_number_opted_out(sarah_phone))
        self.assertFalse(is_number_opted_out("+256701234567"))

        # Broadcast campaign to contact list
        campaign = SmsCampaign(
            candidate_id=candidate.id,
            contact_list_id=contact_list.id,
            title="Debate Blast",
            message="Join us tomorrow at Freedom Square!",
            recipient_count=3
        )
        db.session.add(campaign)
        db.session.commit()

        recipients = [(c.name, c.phone) for c in contact_list.contacts]
        result = execute_campaign_broadcast(campaign, recipients, append_opt_out=True)

        # Sarah should be skipped
        self.assertEqual(result['opt_out_skipped'], 1)
        self.assertEqual(result['sent_count'], 2)

        # Check that Sarah does NOT have a sent log
        sarah_log = SmsLog.query.filter_by(campaign_id=campaign.id, recipient=sarah_phone).first()
        self.assertIsNone(sarah_log)

        # Check that the other two contacts have logs with opt-out footer
        brian_log = SmsLog.query.filter_by(campaign_id=campaign.id, recipient="+256701234567").first()
        self.assertIsNotNone(brian_log)
        self.assertIn("(Reply STOP to opt out)", brian_log.rendered_message)
        self.assertEqual(brian_log.status, 'sent')

    def test_test_sms_endpoint(self):
        self.login()
        election, candidate, _ = self.create_sample_election_and_candidate()

        response = self.client.post('/sms/api/send-test', json={
            'phone': '0701122334',
            'message': 'Test dispatch from ELECHUB',
            'candidate_id': candidate.id
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('details', data)
        self.assertIn('message_id', data['details'])

    def test_campaign_compose_flow(self):
        self.login()
        election, candidate, contact_list = self.create_sample_election_and_candidate()

        response = self.client.post('/sms/compose', data={
            'title': 'Grand Finale Rally',
            'message': 'Hello {{ name }}, vote {{ candidate_name }} for {{ position }}!',
            'candidate_id': candidate.id,
            'contact_list_id': contact_list.id,
            'append_opt_out': 'on',
            'sender_id': 'ELECHUB'
        }, follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Grand Finale Rally', response.data)

        # Verify campaign in database
        campaign = SmsCampaign.query.filter_by(title='Grand Finale Rally').first()
        self.assertIsNotNone(campaign)
        self.assertEqual(campaign.sent_count, 3)
        self.assertEqual(len(campaign.logs), 3)

    def test_at_delivery_webhook(self):
        election, candidate, contact_list = self.create_sample_election_and_candidate()

        # Create campaign and log
        campaign = SmsCampaign(
            candidate_id=candidate.id,
            contact_list_id=contact_list.id,
            title="Webhook Test Campaign",
            message="Test message",
            recipient_count=1
        )
        db.session.add(campaign)
        db.session.commit()

        log = SmsLog(
            campaign_id=campaign.id,
            recipient="+256701234567",
            rendered_message="Test message",
            status="sent",
            at_message_id="AT_MSG_TEST_9999",
            cost="UGX 30.00"
        )
        db.session.add(log)
        db.session.commit()

        # Fire webhook at /webhooks/at-delivery
        response = self.client.post('/webhooks/at-delivery', data={
            'id': 'AT_MSG_TEST_9999',
            'status': 'Delivered',
            'phoneNumber': '+256701234567'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['updated'])

        # Check that log was updated to delivered
        updated_log = db.session.get(SmsLog, log.id)
        self.assertEqual(updated_log.status, 'delivered')

        # Check that campaign delivered_count incremented
        updated_campaign = db.session.get(SmsCampaign, campaign.id)
        self.assertEqual(updated_campaign.delivered_count, 1)


if __name__ == '__main__':
    unittest.main()
