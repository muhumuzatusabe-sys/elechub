import io
import os
import unittest
from datetime import datetime, date
from PIL import Image
from app import create_app
from config import Config
from models import db, Election, Candidate, CampaignProject

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    ADMIN_PASSWORD = 'testsecretpassword'
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'test_uploads')

class CustomTemplateTests(unittest.TestCase):
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

    def login(self):
        return self.client.post('/login', data={'password': 'testsecretpassword'}, follow_redirects=True)

    def test_upload_custom_template(self):
        self.login()
        # Generate in-memory 800x1200 image
        img = Image.new('RGB', (800, 1200), color=(225, 29, 72))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        data = {
            'file': (img_bytes, 'pinterest_test_pin.png')
        }
        res = self.client.post('/posters/upload-custom-template', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data['success'])
        self.assertEqual(json_data['width'], 800)
        self.assertEqual(json_data['height'], 1200)
        self.assertTrue(json_data['url'].startswith('/static/uploads/custom_templates/'))

    def test_fetch_external_template_validation(self):
        self.login()
        # Empty url
        res = self.client.post('/posters/fetch-external-template', json={'url': ''})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['success'])

        # Invalid scheme
        res = self.client.post('/posters/fetch-external-template', json={'url': 'ftp://invalid-scheme.com/img.jpg'})
        self.assertEqual(res.status_code, 400)
        self.assertIn('scheme', res.get_json()['error'])

    def test_save_custom_template_project(self):
        self.login()
        election = Election(name="Guild 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Grace Namukasa",
            position="Guild Vice President",
            party_or_slate="Vanguard",
            slogan="Empowerment & Inclusion"
        )
        db.session.add(candidate)
        db.session.commit()

        # Save project with custom_template and Pinterest settings
        payload = {
            'candidate_id': candidate.id,
            'title': 'Grace Namukasa — Pinterest Inspired Flyer',
            'project_type': 'poster',
            'template': 'custom_template',
            'format': 'custom',
            'candidate_name': 'Grace Namukasa',
            'position': 'Guild Vice President',
            'slogan': 'Empowerment & Inclusion',
            'primary_color': '#e11d48',
            'secondary_color': '#f59e0b',
            'extra_data': {
                'customTemplateUrl': '/static/uploads/custom_templates/template_sample.png',
                'customTemplateFit': 'cover',
                'customTemplatePhotoShape': 'circle',
                'customTemplateOpacity': 95,
                'customTexts': [
                    {'id': 'custom_1', 'text': 'GRAND RALLY THIS FRIDAY', 'fontSize': 64, 'color': '#ffffff'}
                ]
            }
        }
        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        save_json = res.get_json()
        self.assertTrue(save_json['success'])
        project_id = save_json['project_id']

        # Verify project is in database with custom_template
        project = CampaignProject.query.get(project_id)
        self.assertIsNotNone(project)
        self.assertEqual(project.template, 'custom_template')
        self.assertIn('customTemplateUrl', project.extra_data)
        self.assertIn('GRAND RALLY THIS FRIDAY', project.extra_data)

    def test_templates_library_api(self):
        self.login()
        res = self.client.get('/posters/templates-library')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 24)
        self.assertIn('Elections & Leadership', data['categories'])
        self.assertIn('Campus & GRC', data['categories'])

        # Test category filter
        res_cat = self.client.get('/posters/templates-library?category=Elections%20%26%20Leadership')
        self.assertEqual(res_cat.status_code, 200)
        data_cat = res_cat.get_json()
        self.assertTrue(data_cat['success'])
        self.assertEqual(data_cat['count'], 4)

    def test_studio_page_loads_library_templates(self):
        self.login()
        res = self.client.get('/posters/')
        self.assertEqual(res.status_code, 200)
        content = res.get_data(as_text=True)
        self.assertIn('Candidate & Photo Hub', content)
        self.assertIn('Candidate Mask Shield', content)
        self.assertIn('studio-sticky-bottom-bar', content)
        self.assertIn('zoomCanvas', content)
        self.assertIn('toggleMaskShield', content)
        self.assertIn('useLibraryTemplate', content)

    def test_save_project_with_mask_shield_settings(self):
        self.login()
        election = Election(name="Guild 2026 Test")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Brian Kato",
            position="Guild President"
        )
        db.session.add(candidate)
        db.session.commit()

        payload = {
            'candidate_id': candidate.id,
            'title': 'Brian Kato — Shield Mask Poster',
            'project_type': 'poster',
            'template': 'custom_template',
            'format': '1:1',
            'candidate_name': 'Brian Kato',
            'position': 'Guild President',
            'slogan': 'Leadership With Action',
            'primary_color': '#1e3a8a',
            'secondary_color': '#f59e0b',
            'extra_data': {
                'customTemplateUrl': '/static/uploads/custom_templates/sample.png',
                'customTemplateMaskEnabled': True,
                'customTemplateMaskShape': 'card',
                'customTemplateMaskColor': '#0f172a'
            }
        }
        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data['success'])

        project = db.session.get(CampaignProject, json_data['project_id'])
        self.assertIsNotNone(project)
        self.assertIn('customTemplateMaskEnabled', project.extra_data)
        self.assertIn('customTemplateMaskShape', project.extra_data)

    def test_custom_ribbons_and_element_replacement(self):
        """Test that custom ribbons / banner patches and element replacement settings are properly stored in extra_data"""
        self.login()
        election = Election(name="Student Council 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Diana Rose",
            position="Social Affairs Director"
        )
        db.session.add(candidate)
        db.session.commit()

        payload = {
            'candidate_id': candidate.id,
            'title': 'Diana Rose — Pinterest Item Replacement Poster',
            'project_type': 'poster',
            'template': 'custom_template',
            'format': '1:1',
            'candidate_name': 'Diana Rose',
            'position': 'Social Affairs Director',
            'slogan': 'Empower Every Student',
            'primary_color': '#e11d48',
            'secondary_color': '#f59e0b',
            'extra_data': {
                'customTemplateUrl': '/static/templates/library/classic_prestige_manifesto.jpg',
                'customTemplateMaskEnabled': False,
                'customTemplatePhotoShape': 'cutout',
                'customRibbons': [
                    {
                        'id': 'custom_ribbon_1',
                        'x': 1000,
                        'y': 1400,
                        'w': 900,
                        'h': 130,
                        'color': '#f59e0b',
                        'borderRadius': 20,
                        'opacity': 100
                    }
                ],
                'customTexts': [
                    {
                        'id': 'custom_1',
                        'text': 'REPLACED TITLE BANNER',
                        'x': 1000,
                        'y': 1400,
                        'fontSize': 64,
                        'color': '#ffffff'
                    }
                ]
            }
        }
        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])

        project = db.session.get(CampaignProject, data['project_id'])
        self.assertIsNotNone(project)
        import json
        extra = json.loads(project.extra_data) if isinstance(project.extra_data, str) else project.extra_data
        self.assertEqual(extra.get('customTemplateMaskEnabled'), False)
        self.assertEqual(extra.get('customTemplatePhotoShape'), 'cutout')
        self.assertIn('customRibbons', extra)
        self.assertEqual(len(extra['customRibbons']), 1)
        self.assertEqual(extra['customRibbons'][0]['w'], 900)

    def test_save_as_master_template_and_use_template(self):
        self.login()
        election = Election(name="Campus Events 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="MC Voltage",
            position="Main Stage Performer"
        )
        db.session.add(candidate)
        db.session.commit()

        # 1. Save project with is_template=True
        payload = {
            'candidate_id': candidate.id,
            'title': 'Neon Bash Master Flyer Template',
            'project_type': 'poster',
            'template': 'neon_pulse',
            'format': '1:1',
            'category': 'concert',
            'is_template': True,
            'candidate_name': 'MC Voltage',
            'position': 'Live in Concert',
            'slogan': 'Feel the Pulse',
            'primary_color': '#06b6d4',
            'secondary_color': '#ec4899',
            'extra_data': {
                'customTexts': [{'id': 'c1', 'text': 'VIP ACCESS $20'}]
            }
        }
        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        template_id = data['project_id']

        # Verify persisted fields
        tpl_project = db.session.get(CampaignProject, template_id)
        self.assertIsNotNone(tpl_project)
        self.assertTrue(tpl_project.is_template)
        self.assertEqual(tpl_project.category, 'concert')

        # 2. Query /posters/api/templates
        res_list = self.client.get('/posters/api/templates')
        self.assertEqual(res_list.status_code, 200)
        list_data = res_list.get_json()
        self.assertTrue(list_data['success'])
        found = [t for t in list_data['templates'] if t['id'] == template_id]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]['title'], 'Neon Bash Master Flyer Template')
        self.assertEqual(found[0]['category'], 'concert')

        # 3. Use template to clone into a new poster
        res_use = self.client.post(f'/posters/api/use-template/{template_id}')
        self.assertEqual(res_use.status_code, 200)
        use_data = res_use.get_json()
        self.assertTrue(use_data['success'])
        new_project_id = use_data['project_id']
        self.assertNotEqual(new_project_id, template_id)

        # Cloned project is a normal poster (not a template)
        cloned_project = db.session.get(CampaignProject, new_project_id)
        self.assertIsNotNone(cloned_project)
        self.assertFalse(cloned_project.is_template)
        self.assertEqual(cloned_project.category, 'concert')
        self.assertIn('Flyer from', cloned_project.title)

    def test_ai_generate_template(self):
        self.login()
        payload = {
            'prompt': 'Futuristic AI robotics hackathon with deep navy and neon cyan vibe',
            'category': 'tech'
        }
        res = self.client.post('/posters/api/ai-generate-template', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        bp = data['blueprint']
        self.assertEqual(bp['category'], 'tech')
        self.assertTrue(len(bp['primaryColor']) > 0)
        self.assertTrue(len(bp['secondaryColor']) > 0)
        self.assertIn('template', bp)
        self.assertIn('candidateName', bp)

    def test_proxy_image_route_validation(self):
        self.login()
        # Missing URL should return 400
        res = self.client.get('/posters/proxy-image')
        self.assertEqual(res.status_code, 400)
        # Invalid scheme should return 400
        res_invalid = self.client.get('/posters/proxy-image?url=ftp://evil.com/img.jpg')
        self.assertEqual(res_invalid.status_code, 400)

if __name__ == '__main__':
    unittest.main()


