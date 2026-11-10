from flask import Blueprint, render_template
from auth import login_required
from models import db, Election, Candidate, ContactList, Contact

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@login_required
def index():
    elections_count = Election.query.count()
    candidates_count = Candidate.query.count()
    contact_lists_count = ContactList.query.count()
    contacts_count = Contact.query.count()

    recent_candidates = Candidate.query.order_by(Candidate.created_at.desc()).limit(6).all()
    recent_elections = Election.query.order_by(Election.created_at.desc()).limit(4).all()

    stats = {
        'elections': elections_count,
        'candidates': candidates_count,
        'contact_lists': contact_lists_count,
        'contacts': contacts_count
    }

    return render_template('dashboard/index.html', stats=stats, recent_candidates=recent_candidates, recent_elections=recent_elections)
