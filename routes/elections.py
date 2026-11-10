from flask import Blueprint, render_template, request, redirect, url_for, flash
from auth import login_required
from models import db, Election

elections_bp = Blueprint('elections', __name__, url_prefix='/elections')

@elections_bp.route('/')
@login_required
def index():
    elections = Election.query.order_by(Election.created_at.desc()).all()
    return render_template('elections/index.html', elections=elections)

@elections_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Election name is required.', 'danger')
            return render_template('elections/form.html', election=None)

        election = Election(name=name)
        db.session.add(election)
        db.session.commit()
        flash(f'Election "{election.name}" created successfully.', 'success')
        return redirect(url_for('elections.index'))

    return render_template('elections/form.html', election=None)

@elections_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit(id):
    election = Election.query.get_or_404(id)
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        if not name:
            flash('Election name is required.', 'danger')
            return render_template('elections/form.html', election=election)

        election.name = name
        db.session.commit()
        flash(f'Election updated successfully.', 'success')
        return redirect(url_for('elections.index'))

    return render_template('elections/form.html', election=election)

@elections_bp.route('/<int:id>/delete', methods=['POST'])
@login_required
def delete(id):
    election = Election.query.get_or_404(id)
    name = election.name
    db.session.delete(election)
    db.session.commit()
    flash(f'Election "{name}" and all associated candidates & contact lists deleted.', 'info')
    return redirect(url_for('elections.index'))
