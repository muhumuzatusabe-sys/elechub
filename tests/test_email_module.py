import os
import unittest
from app import create_app
from config import Config
from models import db, Election, Candidate, ContactList, Contact, EmailCampaign, EmailLog
from utils.email_service import (
    interpolate_email_template,
    send_single_email,
    execute_email_broadcast,
    retry_failed_emails
)


class EmailTestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    ADMIN_PASSWORD = 'testsecretpassword'
    MAIL_SERVER = 'localhost'
    MAIL_PORT = 25
    MAIL_USERNAME = ''
    MAIL_PASSWORD = ''
    MAIL_DEFAULT_SENDER = 'test@elechub.campus.ac.ug'


class EmailModuleTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(EmailTestConfig)
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

    def create_sample_data(self):
        election = Election(name="Guild Elections 2026")
        db.session.add(election)
        db.session.flush()

        candidate = Candidate(
            election_id=election.id,
            name="Patricia Nakato",
            position="Guild Vice President",
            slogan="Empowered Minds, Transparent Leadership",
            email="patricia@campus.ac.ug",
            phone="+256782233445"
        )
        db.session.add(candidate)

        list1 = ContactList(election_id=election.id, name="Hall A Voters")
        list2 = ContactList(election_id=election.id, name="CEDAT Voters")
        db.session.add_all([list1, list2])
        db.session.flush()

        # Notice: Brian Kato exists in both list1 and list2 with same email to test deduplication!
        c1 = Contact(contact_list_id=list1.id, name="Brian Kato", phone="0701234567", email="brian.kato@campus.ac.ug")
        c2 = Contact(contact_list_id=list1.id, name="Sarah Namubiru", phone="0782345678", email="sarah.n@campus.ac.ug")
        c3 = Contact(contact_list_id=list2.id, name="Brian Kato (Duplicate in CEDAT)", phone="0701234567", email="brian.kato@campus.ac.ug")
        c4 = Contact(contact_list_id=list2.id, name="Timothy Mukasa", phone="0709876543", email="timothy.m@campus.ac.ug")

        db.session.add_all([c1, c2, c3, c4])
        db.session.commit()

        return election, candidate, list1, list2

    def test_mail_merge_interpolation(self):
        election, candidate, _, _ = self.create_sample_data()

        subject_template = "Manifesto from {{ candidate_name }} for {{ position }}"
        body_template = "<p>Dear {{ name }}, please vote in {{ election_name }}. Slogan: {{ slogan }}</p>"

        rendered_sub = interpolate_email_template(subject_template, recipient_name="Brian", candidate=candidate, election=election)
        rendered_body = interpolate_email_template(body_template, recipient_name="Brian", candidate=candidate, election=election)

        self.assertEqual(rendered_sub, "Manifesto from Patricia Nakato for Guild Vice President")
        self.assertIn("Dear Brian", rendered_body)
        self.assertIn("Guild Elections 2026", rendered_body)
        self.assertIn("Empowered Minds, Transparent Leadership", rendered_body)

    def test_test_email_endpoint(self):
        self.login()
        _, candidate, _, _ = self.create_sample_data()

        res = self.client.post('/email/api/send-test', json={
            'email': 'admin@campus.ac.ug',
            'subject': 'Test Subject {{ candidate_name }}',
            'body_html': '<p>Test email body</p>',
            'candidate_id': candidate.id
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['details']['status'], 'sent')

    def test_preview_endpoint(self):
        self.login()
        _, candidate, list1, _ = self.create_sample_data()

        res = self.client.post('/email/api/preview', json={
            'subject': 'Greetings {{ name }}',
            'body_html': '<p>Vote {{ candidate_name }}</p>',
            'candidate_id': candidate.id,
            'contact_list_id': list1.id
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['previews']), 2)
        self.assertEqual(data['previews'][0]['recipient_name'], 'Brian Kato')
        self.assertEqual(data['previews'][0]['rendered_subject'], 'Greetings Brian Kato')

    def test_email_campaign_broadcast_and_logging(self):
        self.login()
        election, candidate, list1, _ = self.create_sample_data()

        res = self.client.post('/email/compose', data={
            'subject': 'Official Manifesto Launch',
            'body_html': '<p>Here is my vision for student welfare.</p>',
            'template_type': 'Manifesto',
            'candidate_id': candidate.id,
            'target_mode': 'list',
            'contact_list_id': list1.id
        }, follow_redirects=True)

        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Official Manifesto Launch', res.data)

        # Check campaign in db
        campaign = EmailCampaign.query.filter_by(subject='Official Manifesto Launch').first()
        self.assertIsNotNone(campaign)
        self.assertEqual(campaign.sent_count, 2)
        self.assertEqual(len(campaign.logs), 2)

        # Verify logs
        logs = EmailLog.query.filter_by(campaign_id=campaign.id).all()
        recipients = [l.recipient for l in logs]
        self.assertIn('brian.kato@campus.ac.ug', recipients)
        self.assertIn('sarah.n@campus.ac.ug', recipients)

    def test_all_election_lists_deduplication(self):
        self.login()
        election, candidate, _, _ = self.create_sample_data()

        res = self.client.post('/email/compose', data={
            'subject': 'All Campus Broadcast',
            'body_html': '<p>Important election announcement.</p>',
            'template_type': 'Announcement',
            'candidate_id': candidate.id,
            'target_mode': 'election_all',
            'election_id': election.id
        }, follow_redirects=True)

        self.assertEqual(res.status_code, 200)

        # In sample data, 4 contacts exist across list1 and list2, but Brian Kato is duplicated.
        # Deduped count must be exactly 3!
        campaign = EmailCampaign.query.filter_by(subject='All Campus Broadcast').first()
        self.assertIsNotNone(campaign)
        self.assertEqual(campaign.recipient_count, 3)
        self.assertEqual(campaign.sent_count, 3)

    def test_resend_failed_emails(self):
        _, candidate, _, _ = self.create_sample_data()

        # Create campaign with one failed log and one sent log
        campaign = EmailCampaign(
            candidate_id=candidate.id,
            subject="Follow-up Message",
            body_html="<p>Follow-up message</p>",
            recipient_count=2,
            sent_count=1,
            failed_count=1,
            status='Completed'
        )
        db.session.add(campaign)
        db.session.commit()

        log_sent = EmailLog(
            campaign_id=campaign.id,
            recipient="success@campus.ac.ug",
            recipient_name="Success Student",
            subject="Follow-up Message",
            body_html="<p>Follow-up</p>",
            status='sent'
        )
        log_failed = EmailLog(
            campaign_id=campaign.id,
            recipient="failed@campus.ac.ug",
            recipient_name="Failed Student",
            subject="Follow-up Message",
            body_html="<p>Follow-up</p>",
            status='failed',
            error_message="Simulated temporary SMTP connection timeout"
        )
        db.session.add_all([log_sent, log_failed])
        db.session.commit()

        # Execute retry
        success_count, fail_count, msg = retry_failed_emails(campaign.id)
        self.assertEqual(success_count, 1)
        self.assertEqual(fail_count, 0)

        # Check that failed log was updated
        updated_log = db.session.get(EmailLog, log_failed.id)
        self.assertEqual(updated_log.status, 'sent')
        self.assertIsNone(updated_log.error_message)

        # Check campaign stats updated
        updated_campaign = db.session.get(EmailCampaign, campaign.id)
        self.assertEqual(updated_campaign.sent_count, 2)
        self.assertEqual(updated_campaign.failed_count, 0)

    def test_email_settings_get_and_post(self):
        self.login()

        # GET settings page
        res = self.client.get('/email/settings')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'SMTP Configuration', res.data)
        self.assertIn(b'Provider Quick Presets', res.data)

        # POST update settings
        post_res = self.client.post('/email/settings', data={
            'mail_server': 'smtp.gmail.com',
            'mail_port': '587',
            'mail_use_tls': 'on',
            'mail_username': 'campus.test@gmail.com',
            'mail_password': 'abcdefghijklmnop',
            'mail_default_sender': 'Test Campaign <campus.test@gmail.com>'
        }, follow_redirects=True)
        self.assertEqual(post_res.status_code, 200)
        self.assertIn(b'Email Gateway SMTP settings updated', post_res.data)

        # Verify in app.config
        self.assertEqual(self.app.config['MAIL_SERVER'], 'smtp.gmail.com')
        self.assertEqual(self.app.config['MAIL_PORT'], 587)
        self.assertEqual(self.app.config['MAIL_USERNAME'], 'campus.test@gmail.com')

        # Test Reset to Safe Simulation
        reset_res = self.client.post('/email/settings', data={
            'action': 'reset_simulation'
        }, follow_redirects=True)
        self.assertEqual(reset_res.status_code, 200)
        self.assertIn(b'Safe Simulation Mode', reset_res.data)
        self.assertEqual(self.app.config['MAIL_USERNAME'], '')

    def test_api_test_connection_validation(self):
        self.login()

        # Missing parameters
        res = self.client.post('/email/api/test-connection', json={
            'mail_server': '',
            'mail_username': '',
            'mail_password': ''
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['success'])
        self.assertIn('required', data['message'])


if __name__ == '__main__':
    unittest.main()
