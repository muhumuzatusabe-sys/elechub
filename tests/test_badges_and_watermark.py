import io
import os
import unittest
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

class BadgesAndWatermarkTests(unittest.TestCase):
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

    def test_save_and_retrieve_custom_badges_and_landmark(self):
        self.login()
        election = Election(name="Guild Elections 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Mbabali Keneth",
            position="Guild President",
            party_or_slate="Independent Alliance",
            slogan="Making A Tangible Difference"
        )
        db.session.add(candidate)
        db.session.commit()

        # Save project with custom uploaded badge 1 (crest), badge 2 (logo), and landmark graphic
        payload = {
            'candidate_id': candidate.id,
            'title': 'Mbabali Keneth — Dynamic Campus Poster',
            'project_type': 'poster',
            'template': 'presidential_landmark',
            'format': '1:1',
            'candidate_name': 'Mbabali Keneth',
            'position': 'Guild President',
            'slogan': 'Making A Tangible Difference',
            'primary_color': '#0f2b5c',
            'secondary_color': '#dc2626',
            'extra_data': {
                'badge1Url': '/static/uploads/crests/custom_university_crest.png',
                'badge1Scale': 1.25,
                'badge1Shape': 'shield',
                'badge1XOffset': 15,
                'badge1YOffset': -10,
                'badge1Visible': True,
                'badge2Url': '/static/uploads/logos/custom_guild_logo.png',
                'badge2Scale': 1.10,
                'badge2Shape': 'circle',
                'badge2XOffset': -20,
                'badge2YOffset': 5,
                'badge2Visible': True,
                'landmarkUrl': '/static/uploads/landmarks/custom_campus_cathedral.png',
                'landmarkScale': 1.40,
                'landmarkOpacity': 18,
                'landmarkXOffset': 30,
                'landmarkYOffset': -40,
                'landmarkVisible': True,
                'customTemplateUrl': '/static/uploads/backgrounds/custom_pinterest_bg.png',
                'customTemplateFit': 'cover',
                'customTemplateOpacity': 90,
                'customTemplateScale': 1.15,
                'customTemplateXOffset': 25,
                'customTemplateYOffset': -15,
                'showCustomBackground': True
            }
        }

        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        project_id = data['project_id']

        # Query database and verify fields persisted correctly
        import json
        project = db.session.get(CampaignProject, project_id)
        self.assertIsNotNone(project)
        self.assertEqual(project.title, 'Mbabali Keneth — Dynamic Campus Poster')
        extra = json.loads(project.extra_data)
        self.assertEqual(extra['badge1Url'], '/static/uploads/crests/custom_university_crest.png')
        self.assertEqual(extra['badge1Scale'], 1.25)
        self.assertEqual(extra['badge1Shape'], 'shield')
        self.assertEqual(extra['badge1XOffset'], 15)
        self.assertEqual(extra['badge1YOffset'], -10)
        self.assertEqual(extra['badge2Url'], '/static/uploads/logos/custom_guild_logo.png')
        self.assertEqual(extra['badge2Scale'], 1.10)
        self.assertEqual(extra['badge2Shape'], 'circle')
        self.assertEqual(extra['landmarkUrl'], '/static/uploads/landmarks/custom_campus_cathedral.png')
        self.assertEqual(extra['landmarkScale'], 1.40)
        self.assertEqual(extra['landmarkOpacity'], 18)
        self.assertEqual(extra['landmarkXOffset'], 30)
        self.assertEqual(extra['landmarkYOffset'], -40)
        self.assertEqual(extra['customTemplateUrl'], '/static/uploads/backgrounds/custom_pinterest_bg.png')
        self.assertEqual(extra['customTemplateFit'], 'cover')
        self.assertEqual(extra['customTemplateOpacity'], 90)
        self.assertEqual(extra['customTemplateScale'], 1.15)
        self.assertEqual(extra['customTemplateXOffset'], 25)
        self.assertEqual(extra['customTemplateYOffset'], -15)
        self.assertTrue(extra['showCustomBackground'])

    def test_studio_page_loads_with_badge_and_landmark_controls(self):
        self.login()
        election = Election(name="Guild Elections 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Akello Evas",
            position="Guild Speaker",
            party_or_slate="Justice Forum",
            slogan="Equity For All"
        )
        db.session.add(candidate)
        db.session.commit()

        res = self.client.get(f'/posters/?candidate_id={candidate.id}')
        self.assertEqual(res.status_code, 200)
        html = res.get_data(as_text=True)

        # Verify uploaded badge and background controls exist in the HTML
        self.assertIn('poster-bg-file-input', html)
        self.assertIn('badge1-file-input', html)
        self.assertIn('badge2-file-input', html)
        self.assertIn('landmark-file-input', html)
        self.assertIn('btn-bg-fit-cover', html)
        self.assertIn('poster-bg-opacity', html)
        self.assertIn('badge1-scale', html)
        self.assertIn('badge2-scale', html)
        self.assertIn('landmark-scale', html)
        self.assertIn('landmark-opacity', html)
        self.assertIn('cbar-background-actions', html)
        self.assertIn('cbar-badge1-actions', html)
        self.assertIn('cbar-badge2-actions', html)
        self.assertIn('cbar-landmark-actions', html)
        self.assertIn('cbar-drag-handle', html)
        self.assertIn('inline-editor-drag-handle', html)

        # Verify Ribbon Fade, Draggable Sticky Bar, and Boundary & Crop Modal controls
        self.assertIn('toggle-ribbon-fade', html)
        self.assertIn('ribbon-fade-h', html)
        self.assertIn('sticky-bar-drag-handle', html)
        self.assertIn('btn-minimize-sticky-bar', html)
        self.assertIn('studio-sticky-bar-pill', html)
        self.assertIn('btn-open-bounds-modal', html)
        self.assertIn('boundaryModal', html)
        self.assertIn('boundary-top', html)
        self.assertIn('boundary-bottom', html)
        self.assertIn('boundary-left', html)
        self.assertIn('boundary-right', html)

        # Verify Quick Photo Framing & Cutout Studio controls in Section 1 and Toolbars
        self.assertIn('btn-quick-fit-cover', html)
        self.assertIn('btn-quick-fit-contain', html)
        self.assertIn('photo-scale-quick', html)
        self.assertIn('photo-y-offset-quick', html)
        self.assertIn('toggle-remove-bg-quick', html)
        self.assertIn('bg-cutout-controls-quick', html)
        self.assertIn('photo-bg-key-color-quick', html)
        self.assertIn('photo-bg-tolerance-quick', html)
        self.assertIn('photo-bg-smooth-quick', html)
        self.assertIn('photo-backdrop-color-quick', html)
        self.assertIn('toggle-connected-only-quick', html)
        self.assertIn('cbar-photo-fit-btn', html)
        self.assertIn('sticky-photo-fit-label', html)

    def test_save_and_retrieve_boundary_and_ribbon_fade_settings(self):
        """Test saving and restoring poster boundary insets and ribbon bottom fade settings"""
        self.login()
        election = Election(name="University Students Guild 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Mbabali Keneth",
            position="Guild President",
            party_or_slate="Independent",
            slogan="Bold Leadership for All"
        )
        db.session.add(candidate)
        db.session.commit()

        payload = {
            'candidate_id': candidate.id,
            'title': 'Keneth — Boundary & Ribbon Custom Poster',
            'project_type': 'poster',
            'template': 'executive',
            'format': '4:5',
            'candidate_name': 'Mbabali Keneth',
            'position': 'Guild President',
            'slogan': 'Bold Leadership for All',
            'primary_color': '#0f2b5c',
            'secondary_color': '#dc2626',
            'extra_data': {
                'showRibbonFade': True,
                'ribbonFadeHeight': 50,
                'boundaryInsetTop': 20,
                'boundaryInsetBottom': 160,
                'boundaryInsetLeft': 30,
                'boundaryInsetRight': 30,
                'showBoundaries': True
            }
        }

        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        project_id = data['project_id']

        import json
        project = db.session.get(CampaignProject, project_id)
        self.assertIsNotNone(project)
        extra = json.loads(project.extra_data)
        self.assertTrue(extra['showRibbonFade'])
        self.assertEqual(extra['ribbonFadeHeight'], 50)
        self.assertEqual(extra['boundaryInsetTop'], 20)
        self.assertEqual(extra['boundaryInsetBottom'], 160)
        self.assertEqual(extra['boundaryInsetLeft'], 30)
        self.assertEqual(extra['boundaryInsetRight'], 30)
        self.assertTrue(extra['showBoundaries'])

    def test_save_and_retrieve_photo_framing_and_cutout_protection(self):
        """Test saving and restoring photo framing mode and border-connected cutout settings"""
        self.login()
        election = Election(name="Campus Guild 2026")
        db.session.add(election)
        db.session.commit()

        candidate = Candidate(
            election_id=election.id,
            name="Namukasa Sarah",
            position="Vice Guild President",
            party_or_slate="Democratic Alliance",
            slogan="Action Over Words"
        )
        db.session.add(candidate)
        db.session.commit()

        payload = {
            'candidate_id': candidate.id,
            'title': 'Sarah — Full Frame & Protected Cutout Poster',
            'project_type': 'poster',
            'template': 'future_forward',
            'format': '4:5',
            'candidate_name': 'Namukasa Sarah',
            'position': 'Vice Guild President',
            'photo_fit_mode': 'cover',
            'photo_scale': 1.15,
            'photo_y_offset': 40,
            'extra_data': {
                'removePhotoBg': True,
                'photoBgKeyColor': '#f8fafc',
                'photoBgTolerance': 30,
                'photoBgSmoothness': 12,
                'photoBgConnectedOnly': True,
                'photoBackdropColor': 'transparent'
            }
        }

        res = self.client.post('/posters/api/save', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        project_id = data['project_id']

        import json
        project = db.session.get(CampaignProject, project_id)
        self.assertIsNotNone(project)
        self.assertEqual(project.photo_fit_mode, 'cover')
        self.assertEqual(project.photo_scale, 1.15)
        self.assertEqual(project.photo_y_offset, 40)
        extra = json.loads(project.extra_data)
        self.assertTrue(extra['removePhotoBg'])
        self.assertEqual(extra['photoBgKeyColor'], '#f8fafc')
        self.assertEqual(extra['photoBgTolerance'], 30)
        self.assertEqual(extra['photoBgSmoothness'], 12)
        self.assertTrue(extra['photoBgConnectedOnly'])
        self.assertEqual(extra['photoBackdropColor'], 'transparent')

if __name__ == '__main__':
    unittest.main()
