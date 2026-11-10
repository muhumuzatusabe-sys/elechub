import os
from flask import Flask, render_template
from flask_migrate import Migrate
from flask_mail import Mail
from config import Config
from models import db, Election, Candidate, ContactList, Contact, SmsCampaign, SmsLog, OptOut, EmailCampaign, EmailLog
from utils.sms_service import update_delivery_status

mail = Mail()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    mail.init_app(app)

    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    from auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.elections import elections_bp
    from routes.candidates import candidates_bp
    from routes.contacts import contacts_bp
    from routes.posters import posters_bp
    from routes.sms import sms_bp
    from routes.email_campaigns import email_bp
    from routes.video import video_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(elections_bp)
    app.register_blueprint(candidates_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(posters_bp)
    app.register_blueprint(sms_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(video_bp)

    # Africa's Talking Delivery Webhook Endpoint
    from flask import request, jsonify
    @app.route('/webhooks/at-delivery', methods=['POST'])
    def at_delivery_webhook():
        at_id = request.form.get('id') or (request.json.get('id') if request.is_json else None)
        status = request.form.get('status') or (request.json.get('status') if request.is_json else None)
        phone = request.form.get('phoneNumber') or (request.json.get('phoneNumber') if request.is_json else None)
        failure_reason = request.form.get('failureReason') or (request.json.get('failureReason') if request.is_json else None)

        success, msg = update_delivery_status(at_id, status, failure_reason, phone)
        return jsonify({'received': True, 'updated': success, 'message': msg})


    # Context processors for template globals
    @app.context_processor
    def inject_global_vars():
        return {
            'app_name': app.config.get('APP_NAME', 'ELECHUB'),
            'app_tagline': app.config.get('APP_TAGLINE', 'Campus Campaign Command Center'),
            'all_elections': Election.query.order_by(Election.created_at.desc()).all() if db.engine else []
        }

    # Error Handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('base.html', error_title="Page Not Found", error_msg="The page you requested could not be located."), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('base.html', error_title="Internal Server Error", error_msg="An unexpected error occurred. Please check system logs."), 500

    # Auto-initialize database tables on startup (for Gunicorn/Cloud Run)
    if not app.config.get('TESTING'):
        with app.app_context():
            try:
                db.create_all()
            except Exception as e:
                app.logger.warning(f"Database auto-init deferred or handled: {e}")

    return app


app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
