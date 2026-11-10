import os
import json
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
from auth import login_required
from models import db, Candidate, Election, CampaignVideo
from utils.video_compiler import (
    get_candidate_video_dirs,
    get_candidate_photos,
    get_available_audio_tracks,
    render_candidate_video_async,
    compile_candidate_promo_video
)

video_bp = Blueprint('video', __name__, url_prefix='/video')


@video_bp.route('/')
@login_required
def creator():
    candidate_id = request.args.get('candidate_id', type=int)
    candidates = Candidate.query.order_by(Candidate.name).all()
    elections = Election.query.order_by(Election.created_at.desc()).all()

    selected_candidate = db.session.get(Candidate, candidate_id) if candidate_id else (candidates[0] if candidates else None)

    photos = []
    videos = []
    if selected_candidate:
        photos = get_candidate_photos(selected_candidate.id)
        videos = CampaignVideo.query.filter_by(candidate_id=selected_candidate.id).order_by(CampaignVideo.generated_at.desc()).all()

    audio_tracks = get_available_audio_tracks()
    all_videos = CampaignVideo.query.order_by(CampaignVideo.generated_at.desc()).limit(15).all()

    return render_template(
        'video/creator.html',
        candidates=candidates,
        selected_candidate=selected_candidate,
        elections=elections,
        photos=photos,
        videos=videos,
        all_videos=all_videos,
        audio_tracks=audio_tracks
    )


@video_bp.route('/upload-photos/<int:candidate_id>', methods=['POST'])
@login_required
def upload_photos(candidate_id):
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        flash('Candidate not found.', 'danger')
        return redirect(url_for('video.creator'))

    dirs = get_candidate_video_dirs(candidate_id)
    files = request.files.getlist('photos')
    saved_count = 0

    allowed_exts = {'png', 'jpg', 'jpeg', 'webp'}
    for f in files:
        if f and f.filename:
            ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
            if ext in allowed_exts:
                safe_name = secure_filename(f.filename)
                # Prefix with timestamp to guarantee uniqueness
                import time
                unique_name = f"{int(time.time())}_{safe_name}"
                dest = os.path.join(dirs['photos'], unique_name)
                f.save(dest)
                saved_count += 1

    if saved_count > 0:
        flash(f'Successfully uploaded {saved_count} field photos for {candidate.name}.', 'success')
    else:
        flash('No valid images were uploaded. Allowed formats: PNG, JPG, JPEG, WEBP.', 'warning')

    return redirect(url_for('video.creator', candidate_id=candidate_id))


@video_bp.route('/delete-photo/<int:candidate_id>', methods=['POST'])
@login_required
def delete_photo(candidate_id):
    filename = request.form.get('filename')
    if filename:
        dirs = get_candidate_video_dirs(candidate_id)
        file_path = os.path.join(dirs['photos'], secure_filename(filename))
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                flash('Field photo deleted.', 'success')
            except Exception as e:
                flash(f'Failed to delete photo: {e}', 'danger')
    return redirect(url_for('video.creator', candidate_id=candidate_id))


@video_bp.route('/upload-audio', methods=['POST'])
@login_required
def upload_audio():
    audio_file = request.files.get('audio')
    candidate_id = request.form.get('candidate_id', type=int)

    if audio_file and audio_file.filename:
        ext = audio_file.filename.rsplit('.', 1)[-1].lower() if '.' in audio_file.filename else ''
        if ext in {'mp3', 'wav', 'm4a', 'aac'}:
            audio_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'candidate_videos', 'audio')
            os.makedirs(audio_dir, exist_ok=True)
            safe_name = secure_filename(audio_file.filename)
            dest = os.path.join(audio_dir, safe_name)
            audio_file.save(dest)
            flash(f'Background audio track "{safe_name}" uploaded.', 'success')
        else:
            flash('Invalid audio file format. Please upload MP3 or WAV.', 'danger')

    return redirect(url_for('video.creator', candidate_id=candidate_id))


@video_bp.route('/generate', methods=['POST'])
@login_required
def generate():
    candidate_id = request.form.get('candidate_id', type=int)
    aspect_ratio = request.form.get('aspect_ratio', '9:16')
    audio_track = request.form.get('audio_track')
    captions_raw = request.form.get('captions_json', '{}')

    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        flash('Candidate not found.', 'danger')
        return redirect(url_for('video.creator'))

    try:
        captions = json.loads(captions_raw)
    except Exception:
        captions = {}

    title = f"{candidate.name} — {candidate.position} {'Reel (9:16)' if aspect_ratio == '9:16' else 'Feed Video (1:1)'}"
    video = CampaignVideo(
        candidate_id=candidate.id,
        election_id=candidate.election_id,
        title=title,
        aspect_ratio=aspect_ratio,
        resolution='1080x1920' if aspect_ratio == '9:16' else '1080x1080',
        status='rendering',
        progress=5,
        audio_track=audio_track
    )
    db.session.add(video)
    db.session.commit()

    # If running in unit tests or testing mode, run synchronously
    if current_app.config.get('TESTING'):
        try:
            res = compile_candidate_promo_video(
                candidate_id=candidate.id,
                aspect_ratio=aspect_ratio,
                captions=captions,
                audio_track_filename=audio_track
            )
            video.file_path = res['file_path']
            video.duration = res['duration']
            video.resolution = res['resolution']
            video.status = 'completed'
            video.progress = 100
            db.session.commit()
        except Exception as ex:
            video.status = 'failed'
            video.error_message = str(ex)
            db.session.commit()
    else:
        # Launch background thread
        app_obj = current_app._get_current_object()
        render_candidate_video_async(
            app=app_obj,
            video_id=video.id,
            candidate_id=candidate.id,
            aspect_ratio=aspect_ratio,
            captions=captions,
            audio_track=audio_track
        )

    if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True, 'video_id': video.id, 'status': video.status, 'progress': video.progress})

    flash(f'Video compiler launched in background for {candidate.name}! Rendering progress is visible below.', 'success')
    return redirect(url_for('video.creator', candidate_id=candidate.id))


@video_bp.route('/bulk-generate', methods=['POST'])
@login_required
def bulk_generate():
    election_id = request.form.get('election_id', type=int)
    aspect_ratio = request.form.get('aspect_ratio', '9:16')
    audio_track = request.form.get('audio_track')

    election = db.session.get(Election, election_id) if election_id else Election.query.first()
    if not election:
        flash('No election selected.', 'danger')
        return redirect(url_for('video.creator'))

    candidates_with_photos = []
    for cand in election.candidates:
        photos = get_candidate_photos(cand.id)
        if photos or cand.photo:
            candidates_with_photos.append(cand)

    if not candidates_with_photos:
        flash('No candidates in this election have uploaded field photos.', 'warning')
        return redirect(url_for('video.creator'))

    app_obj = current_app._get_current_object()
    dispatched_count = 0

    for cand in candidates_with_photos:
        title = f"{cand.name} — {cand.position} Bulk Promo"
        video = CampaignVideo(
            candidate_id=cand.id,
            election_id=election.id,
            title=title,
            aspect_ratio=aspect_ratio,
            resolution='1080x1920' if aspect_ratio == '9:16' else '1080x1080',
            status='rendering',
            progress=5,
            audio_track=audio_track
        )
        db.session.add(video)
        db.session.commit()

        if current_app.config.get('TESTING'):
            try:
                res = compile_candidate_promo_video(cand.id, aspect_ratio=aspect_ratio)
                video.file_path = res['file_path']
                video.status = 'completed'
                video.progress = 100
                db.session.commit()
            except Exception:
                pass
        else:
            render_candidate_video_async(app_obj, video.id, cand.id, aspect_ratio=aspect_ratio, audio_track=audio_track)

        dispatched_count += 1

    flash(f'Bulk video rendering queued for {dispatched_count} candidates across {election.name}!', 'success')
    return redirect(url_for('video.creator'))


@video_bp.route('/status/<int:video_id>')
@login_required
def status(video_id):
    video = db.session.get(CampaignVideo, video_id)
    if not video:
        return jsonify({'success': False, 'error': 'Video not found'}), 404
    return jsonify({
        'success': True,
        'id': video.id,
        'title': video.title,
        'status': video.status,
        'progress': video.progress,
        'file_path': video.file_path,
        'duration': video.duration,
        'error_message': video.error_message
    })


@video_bp.route('/delete/<int:video_id>', methods=['POST'])
@login_required
def delete_video(video_id):
    video = db.session.get(CampaignVideo, video_id)
    if video:
        cand_id = video.candidate_id
        if video.file_path:
            clean_rel = video.file_path.lstrip('/')
            abs_path = os.path.join(current_app.root_path, clean_rel)
            if os.path.exists(abs_path):
                try:
                    os.remove(abs_path)
                except Exception:
                    pass
        db.session.delete(video)
        db.session.commit()
        flash('Video deleted successfully.', 'success')
        return redirect(url_for('video.creator', candidate_id=cand_id))
    return redirect(url_for('video.creator'))
