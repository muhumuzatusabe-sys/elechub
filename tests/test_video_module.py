import os
import io
import unittest
from app import create_app
from config import Config
from models import db, Election, Candidate, CampaignVideo
from utils.video_compiler import (
    get_candidate_video_dirs,
    get_candidate_photos,
    create_title_card_image,
    create_closing_card_image,
    compile_candidate_promo_video
)
from PIL import Image



class VideoTestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    ADMIN_PASSWORD = 'testsecretpassword'


def make_png_bytes():
    buf = io.BytesIO()
    Image.new('RGB', (200, 200), (37, 99, 235)).save(buf, format='PNG')
    buf.seek(0)
    return buf


class VideoModuleTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(VideoTestConfig)
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

    def create_sample_candidate(self):
        election = Election(name="Guild Elections 2026")
        db.session.add(election)
        db.session.flush()

        candidate = Candidate(
            election_id=election.id,
            name="Allan Ssenyonjo",
            position="Guild President",
            slogan="Action Over Rhetoric",
            color_theme="#1d4ed8",
            secondary_color="#f59e0b",
            ballot_number="1",
            photo="/static/uploads/candidates/allan.jpg"
        )
        db.session.add(candidate)
        db.session.commit()
        return election, candidate


    def test_title_and_closing_card_generation(self):
        _, candidate = self.create_sample_candidate()
        dirs = get_candidate_video_dirs(candidate.id)

        # 9:16 Title Card
        title_img = create_title_card_image(candidate, aspect_ratio='9:16')
        self.assertEqual(title_img.size, (1080, 1920))

        # 1:1 Title Card
        title_img_1_1 = create_title_card_image(candidate, aspect_ratio='1:1')
        self.assertEqual(title_img_1_1.size, (1080, 1080))

        # Closing Card
        closing_img = create_closing_card_image(candidate, candidate.election, aspect_ratio='9:16')
        self.assertEqual(closing_img.size, (1080, 1920))

    def test_photo_upload_and_listing(self):
        self.login()
        _, candidate = self.create_sample_candidate()

        # Upload 2 test images
        img_bytes1 = make_png_bytes()
        img_bytes2 = make_png_bytes()

        res = self.client.post(
            f'/video/upload-photos/{candidate.id}',
            data={
                'photos': [
                    (img_bytes1, 'rally_1.jpg'),
                    (img_bytes2, 'rally_2.png')
                ]
            },
            content_type='multipart/form-data',
            follow_redirects=True
        )
        self.assertEqual(res.status_code, 200)

        photos = get_candidate_photos(candidate.id)
        self.assertGreaterEqual(len(photos), 2)
        filenames = [p['filename'] for p in photos]
        self.assertTrue(any('rally_1' in fn for fn in filenames))
        self.assertTrue(any('rally_2' in fn for fn in filenames))

    def test_video_generation_endpoint(self):
        self.login()
        _, candidate = self.create_sample_candidate()

        res = self.client.post('/video/generate', data={
            'candidate_id': candidate.id,
            'aspect_ratio': '9:16'
        }, headers={'X-Requested-With': 'XMLHttpRequest'})

        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        video_id = data['video_id']

        # Verify CampaignVideo created in DB
        video = db.session.get(CampaignVideo, video_id)
        self.assertIsNotNone(video)
        self.assertEqual(video.aspect_ratio, '9:16')
        self.assertIn(video.status, ['completed', 'rendering'])

    def test_video_status_endpoint(self):
        self.login()
        _, candidate = self.create_sample_candidate()

        video = CampaignVideo(
            candidate_id=candidate.id,
            title="Promo Reel",
            aspect_ratio="9:16",
            status="completed",
            progress=100,
            file_path="/static/uploads/candidate_videos/1/output/sample.mp4",
            duration=35.0
        )
        db.session.add(video)
        db.session.commit()

        res = self.client.get(f'/video/status/{video.id}')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['status'], 'completed')
        self.assertEqual(data['progress'], 100)

    def test_bulk_video_generate(self):
        self.login()
        election, candidate = self.create_sample_candidate()

        res = self.client.post('/video/bulk-generate', data={
            'election_id': election.id,
            'aspect_ratio': '1:1'
        }, follow_redirects=True)

        self.assertEqual(res.status_code, 200)
        videos = CampaignVideo.query.filter_by(candidate_id=candidate.id).all()
        self.assertGreaterEqual(len(videos), 1)

    def test_delete_video(self):
        self.login()
        _, candidate = self.create_sample_candidate()

        video = CampaignVideo(
            candidate_id=candidate.id,
            title="Video to delete",
            status="completed"
        )
        db.session.add(video)
        db.session.commit()

        res = self.client.post(f'/video/delete/{video.id}', follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(db.session.get(CampaignVideo, video.id))


if __name__ == '__main__':
    unittest.main()
