from functools import wraps
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            flash('Please log in to access the ELECHUB admin portal.', 'warning')
            return redirect(url_for('auth.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('is_admin'):
        return redirect(url_for('dashboard.index'))

    if request.method == 'POST':
        password = request.form.get('password', '').strip()
        expected_password = current_app.config.get('ADMIN_PASSWORD', 'elechub2026')

        if password == expected_password:
            session['is_admin'] = True
            session.permanent = True
            flash('Welcome to ELECHUB Campaign Management Center.', 'success')
            next_page = request.args.get('next')
            if next_page and next_page.startswith('/'):
                return redirect(next_page)
            return redirect(url_for('dashboard.index'))
        else:
            flash('Invalid administrator password. Please try again.', 'danger')

    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    session.pop('is_admin', None)
    flash('You have been logged out securely.', 'info')
    return redirect(url_for('auth.login'))
