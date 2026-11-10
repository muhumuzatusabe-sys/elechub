from flask import Blueprint, render_template
from auth import login_required
from models import Election, Candidate, ContactList

placeholders_bp = Blueprint('placeholders', __name__)

@placeholders_bp.route('/posters')
@login_required
def posters():
    elections = Election.query.order_by(Election.name).all()
    candidates = Candidate.query.order_by(Candidate.name).all()
    return render_template('placeholders/posters.html', elections=elections, candidates=candidates)

@placeholders_bp.route('/sms')
@login_required
def sms():
    contact_lists = ContactList.query.order_by(ContactList.name).all()
    candidates = Candidate.query.order_by(Candidate.name).all()
    return render_template('placeholders/sms.html', contact_lists=contact_lists, candidates=candidates)

@placeholders_bp.route('/email')
@login_required
def email():
    contact_lists = ContactList.query.order_by(ContactList.name).all()
    elections = Election.query.order_by(Election.name).all()
    return render_template('placeholders/email.html', contact_lists=contact_lists, elections=elections)

@placeholders_bp.route('/video')
@login_required
def video():
    candidates = Candidate.query.order_by(Candidate.name).all()
    elections = Election.query.order_by(Election.name).all()
    return render_template('placeholders/video.html', candidates=candidates, elections=elections)
