import os
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from auth import login_required
from models import db, Candidate, Election, Mobilizer
from utils.file_helpers import save_candidate_photo

candidates_bp = Blueprint('candidates', __name__, url_prefix='/candidates')

@candidates_bp.route('/')
@login_required
def index():
    election_id = request.args.get('election_id', type=int)
    query = Candidate.query
    if election_id:
        query = query.filter_by(election_id=election_id)
    candidates = query.order_by(Candidate.created_at.desc()).all()
    elections = Election.query.order_by(Election.name).all()
    return render_template('candidates/index.html', candidates=candidates, elections=elections, selected_election_id=election_id)

@candidates_bp.route('/api/all')
@login_required
def api_all():
    candidates = Candidate.query.order_by(Candidate.name).all()
    return jsonify([c.to_dict() for c in candidates])

@candidates_bp.route('/api/<int:id>')
@login_required
def api_get(id):
    candidate = Candidate.query.get_or_404(id)
    return jsonify(candidate.to_dict())

@candidates_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    elections = Election.query.order_by(Election.name).all()
    if not elections:
        flash('Please create a Campaign Season first before adding candidates.', 'warning')
        return redirect(url_for('elections.new'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        position = request.form.get('position', '').strip()
        election_id = request.form.get('election_id', type=int)
        ballot_number = request.form.get('ballot_number', '').strip() or None
        faculty_or_hall = request.form.get('faculty_or_hall', '').strip() or None
        party_or_slate = request.form.get('party_or_slate', '').strip() or None
        slogan = request.form.get('slogan', '').strip() or None
        campaign_tagline = request.form.get('campaign_tagline', '').strip() or None
        manifesto_points = request.form.get('manifesto_points', '').strip() or None
        phone = request.form.get('phone', '').strip() or None
        email = request.form.get('email', '').strip() or None
        social_handles = request.form.get('social_handles', '').strip() or None
        
        # Brand colors
        primary_color = request.form.get('primary_color', '#2563eb').strip()
        secondary_color = request.form.get('secondary_color', '#f59e0b').strip()
        accent_color = request.form.get('accent_color', '#10b981').strip()

        if not name or not position or not election_id:
            flash('Candidate Name, Position, and Campaign Season are required.', 'danger')
            return render_template('candidates/form.html', candidate=None, elections=elections)

        candidate = Candidate(
            name=name,
            position=position,
            election_id=election_id,
            ballot_number=ballot_number,
            faculty_or_hall=faculty_or_hall,
            party_or_slate=party_or_slate,
            slogan=slogan,
            campaign_tagline=campaign_tagline,
            manifesto_points=manifesto_points,
            phone=phone,
            email=email,
            social_handles=social_handles,
            color_theme=primary_color,
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color
        )
        db.session.add(candidate)
        db.session.flush()

        # Handle photo upload
        photo_file = request.files.get('photo')
        if photo_file and photo_file.filename:
            try:
                photo_path = save_candidate_photo(photo_file, candidate.id)
                candidate.photo = photo_path
            except Exception as e:
                flash(f'Candidate saved, but photo upload failed: {str(e)}', 'warning')

        db.session.commit()
        flash(f'Candidate profile for "{candidate.name}" saved to Vault.', 'success')
        return redirect(url_for('candidates.view', id=candidate.id))

    selected_election_id = request.args.get('election_id', type=int)
    return render_template('candidates/form.html', candidate=None, elections=elections, selected_election_id=selected_election_id)

@candidates_bp.route('/<int:id>')
@login_required
def view(id):
    candidate = Candidate.query.get_or_404(id)
    return render_template('candidates/view.html', candidate=candidate)

@candidates_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit(id):
    candidate = Candidate.query.get_or_404(id)
    elections = Election.query.order_by(Election.name).all()

    if request.method == 'POST':
        candidate.name = request.form.get('name', '').strip()
        candidate.position = request.form.get('position', '').strip()
        candidate.election_id = request.form.get('election_id', type=int)
        candidate.ballot_number = request.form.get('ballot_number', '').strip() or candidate.ballot_number
        candidate.faculty_or_hall = request.form.get('faculty_or_hall', '').strip() or None
        candidate.party_or_slate = request.form.get('party_or_slate', '').strip() or None
        candidate.slogan = request.form.get('slogan', '').strip() or None
        candidate.campaign_tagline = request.form.get('campaign_tagline', '').strip() or None
        candidate.manifesto_points = request.form.get('manifesto_points', '').strip() or None
        candidate.phone = request.form.get('phone', '').strip() or None
        candidate.email = request.form.get('email', '').strip() or None
        candidate.social_handles = request.form.get('social_handles', '').strip() or None
        
        primary_color = request.form.get('primary_color', '#2563eb').strip()
        candidate.primary_color = primary_color
        candidate.color_theme = primary_color
        candidate.secondary_color = request.form.get('secondary_color', '#f59e0b').strip()
        candidate.accent_color = request.form.get('accent_color', '#10b981').strip()

        if not candidate.name or not candidate.position or not candidate.election_id:
            flash('Candidate Name, Position, and Campaign Season are required.', 'danger')
            return render_template('candidates/form.html', candidate=candidate, elections=elections)

        photo_file = request.files.get('photo')
        if photo_file and photo_file.filename:
            try:
                photo_path = save_candidate_photo(photo_file, candidate.id)
                candidate.photo = photo_path
            except Exception as e:
                flash(f'Photo upload failed: {str(e)}', 'warning')

        db.session.commit()
        flash(f'Candidate profile for "{candidate.name}" updated successfully.', 'success')
        return redirect(url_for('candidates.view', id=candidate.id))

    return render_template('candidates/form.html', candidate=candidate, elections=elections)

@candidates_bp.route('/<int:id>/delete', methods=['POST'])
@login_required
def delete(id):
    candidate = Candidate.query.get_or_404(id)
    name = candidate.name
    
    if candidate.photo and candidate.photo.startswith('/static/'):
        full_path = os.path.join(current_app.root_path, candidate.photo.lstrip('/'))
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError:
                pass

    db.session.delete(candidate)
    db.session.commit()
    flash(f'Candidate "{name}" removed from Vault.', 'info')
    return redirect(url_for('candidates.index'))
