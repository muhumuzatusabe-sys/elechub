import io
import os
import unittest
from app import create_app
from config import Config
from models import db, Election, Candidate, ContactList, Contact, CampaignProject
from utils.csv_helpers import normalize_phone, parse_contact_csv

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    ADMIN_PASSWORD = 'testsecretpassword'
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'test_uploads')

class ELECHUBFoundationTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def login(self, password='testsecretpassword'):
        return self.client.post('/login', data={'password': password}, follow_redirects=True)

    def test_phone_normalization(self):
        # Ugandan 07xx
        self.assertEqual(normalize_phone('0701234567'), '+256701234567')
        # Spaces & hyphens
        self.assertEqual(normalize_phone('+256 782-345 678'), '+256782345678')
        # Already international
        self.assertEqual(normalize_phone('+254712345678'), '+254712345678')
        # Invalid phone
        self.assertIsNone(normalize_phone('abc'))

    def test_csv_parser_and_deduplication(self):
        csv_content = (
            "Name,Phone,Email\n"
            "Alice Nalubega,0701112233,alice@campus.ac.ug\n"
            "Bob Kato,+256782223344,bob@campus.ac.ug\n"
            "Alice Nalubega (Duplicate),0701112233,alice@campus.ac.ug\n"
            "Invalid Number,123,\n"
        )
        stream = io.BytesIO(csv_content.encode('utf-8'))
        valid, stats, errors = parse_contact_csv(stream)
        
        self.assertEqual(len(valid), 2)
        self.assertEqual(stats['imported'], 2)
        self.assertEqual(stats['duplicates'], 1)
        self.assertEqual(stats['invalid'], 1)
        self.assertEqual(valid[0]['phone'], '+256701112233')
        self.assertEqual(valid[1]['phone'], '+256782223344')

    def test_auth_protection(self):
        # Unauthenticated access to dashboard should redirect to login
        res = self.client.get('/', follow_redirects=False)
        self.assertEqual(res.status_code, 302)
        self.assertIn('/login', res.headers['Location'])

        # Bad password
        bad_login = self.login(password='wrongpass')
        self.assertIn(b'Invalid administrator password', bad_login.data)

        # Good password
        good_login = self.login(password='testsecretpassword')
        self.assertIn(b'Command Center', good_login.data)

    def test_election_and_candidate_crud(self):
        self.login()

        # Create Election
        res = self.client.post('/elections/new', data={'name': 'MUACR Elections 2026'}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        election = Election.query.filter_by(name='MUACR Elections 2026').first()
        self.assertIsNotNone(election)

        # Create Candidate
        res = self.client.post('/candidates/new', data={
            'name': 'Allan Ssenyonjo',
            'position': 'Guild President',
            'election_id': election.id,
            'party_or_slate': 'Action Vanguard',
            'slogan': 'Action Over Rhetoric',
            'phone': '+256701122334',
            'email': 'allan@campus.ac.ug',
            'color_theme': '#1d4ed8'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)

        candidate = Candidate.query.filter_by(name='Allan Ssenyonjo').first()
        self.assertIsNotNone(candidate)
        self.assertEqual(candidate.position, 'Guild President')
        self.assertEqual(candidate.election_id, election.id)

    def test_contact_list_crud(self):
        self.login()
        election = Election(name='Law School Guild 2026')
        db.session.add(election)
        db.session.commit()

        # Create Contact List
        res = self.client.post('/contact-lists/new', data={
            'name': 'Year 3 Law Voters',
            'election_id': election.id
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        cl = ContactList.query.filter_by(name='Year 3 Law Voters').first()
        self.assertIsNotNone(cl)

        # Add single contact
        res = self.client.post(f'/contact-lists/{cl.id}/add-contact', data={
            'name': 'John Doe',
            'phone': '0709998877',
            'email': 'john@campus.ac.ug'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)

        contact = Contact.query.filter_by(contact_list_id=cl.id).first()
        self.assertIsNotNone(contact)
        self.assertEqual(contact.phone, '+256709998877')

    def test_campaign_studio_routes(self):
        self.login()
        for endpoint in ['/posters/', '/posters/projects', '/posters/batch', '/sms/', '/sms/compose', '/email/', '/email/compose', '/video/']:
            res = self.client.get(endpoint, follow_redirects=True)
            self.assertEqual(res.status_code, 200, f"Endpoint {endpoint} failed")

    def test_campaign_project_save_and_manage(self):
        self.login()
        election = Election(name='Guild Elections 2026')
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            name='Muhumuza Tusabe',
            position='Guild President',
            election_id=election.id,
            slogan='Excellence in Action'
        )
        db.session.add(candidate)
        db.session.commit()

        # Save project via API
        payload = {
            'title': 'Tusabe Official Executive Poster',
            'candidate_id': candidate.id,
            'project_type': 'poster',
            'template': 'executive',
            'format': 'instagram_post',
            'candidate_name': 'Muhumuza Tusabe',
            'position': 'Guild President',
            'slogan': 'Excellence in Action',
            'rally_date': 'Friday 28th October',
            'rally_venue': 'Freedom Square',
            'primary_color': '#1e3a8a',
            'secondary_color': '#d97706',
            'photo_scale': 1.15,
            'photo_x_offset': 10,
            'photo_y_offset': -20,
            'photo_fit_mode': 'custom',
            'extra_data': {
                'greetingScript': 'Blessed',
                'greetingTitle': 'SEPTEMBER',
                'goodwillMessage': 'May this September bring fresh momentum and victory.',
                'courseYear': 'BASS II',
                'subPosition': 'REPRESENTATIVE EDITORIAL BOARD',
                'hashtag': '# A VOICE YOU CAN TRUST',
                'sessionName': '92ND GUILD HOUSE',
                'associationAcronym': 'MESA',
                'showWatermark': True,
                'showBadges': True
            },
            # 1x1 transparent png data url
            'thumbnail': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }
        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        project_id = data['project_id']

        # Verify project in projects gallery
        gallery_res = self.client.get('/posters/projects')
        self.assertEqual(gallery_res.status_code, 200)
        self.assertIn(b'Tusabe Official Executive Poster', gallery_res.data)

        # Verify project API detail
        detail_res = self.client.get(f'/posters/api/project/{project_id}')
        self.assertEqual(detail_res.status_code, 200)
        detail_data = detail_res.get_json()
        self.assertTrue(detail_data['success'])
        self.assertEqual(detail_data['project']['template'], 'executive')
        self.assertEqual(detail_data['project']['photo_scale'], 1.15)
        self.assertIn('extra_data', detail_data['project'])
        self.assertIn('SEPTEMBER', detail_data['project']['extra_data'])

        # Verify studio reload with project_id
        studio_res = self.client.get(f'/posters/?project_id={project_id}')
        self.assertEqual(studio_res.status_code, 200)
        self.assertIn(b'Tusabe Official Executive Poster', studio_res.data)

        # Delete project
        del_res = self.client.post(f'/posters/projects/{project_id}/delete', follow_redirects=True)
        self.assertEqual(del_res.status_code, 200)
        self.assertIn(b'deleted successfully', del_res.data)
        self.assertIsNone(db.session.get(CampaignProject, project_id))

    def test_batch_fliers_studio(self):
        self.login()
        res = self.client.get('/posters/batch')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Multiple Fliers', res.data)
        self.assertIn(b'Quick Target Message Presets', res.data)
        self.assertIn(b'Bulk Upload Photos', res.data)

    def test_sms_manual_numbers(self):
        self.login()
        # Post SMS compose with manual phone numbers only (no contact list)
        res = self.client.post('/sms/compose', data={
            'title': 'Official Briefing Alert',
            'contact_list_id': '',
            'manual_numbers': '+256701234567, 0782345678\n+254712345678',
            'message': 'Hello, this is an official campus briefing.'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'dispatched to 3 recipients', res.data)

    def test_email_manual_recipients(self):
        self.login()
        # Post Email compose with manual email addresses only (no contact list)
        res = self.client.post('/email/compose', data={
            'contact_list_id': '',
            'manual_emails': 'scholar1@mak.ac.ug, scholar2@mak.ac.ug\nscholar3@gmail.com',
            'subject': 'Exam Timetable and Instructions',
            'body_html': '<p>Please find attached the examination timetable.</p>'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'queued and broadcasted to 3 recipients', res.data)

if __name__ == '__main__':
    unittest.main()


