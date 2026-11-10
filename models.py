from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def utc_now():
    return datetime.now(timezone.utc)

class CampaignWorkspace(db.Model):
    __tablename__ = 'elections'  # Kept as elections for seamless sqlite table compatibility

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    # Relationships
    candidates = db.relationship('Candidate', backref='election', cascade='all, delete-orphan', lazy=True)
    contact_lists = db.relationship('ContactList', backref='election', cascade='all, delete-orphan', lazy=True)

    def __repr__(self):
        return f'<CampaignWorkspace {self.id}: {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'candidate_count': len(self.candidates),
            'contact_list_count': len(self.contact_lists)
        }

# Backward compatibility alias
Election = CampaignWorkspace


class Candidate(db.Model):
    __tablename__ = 'candidates'

    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    ballot_number = db.Column(db.String(20), nullable=True, default="1")
    faculty_or_hall = db.Column(db.String(100), nullable=True)
    party_or_slate = db.Column(db.String(100), nullable=True)
    slogan = db.Column(db.Text, nullable=True)
    campaign_tagline = db.Column(db.String(255), nullable=True)
    manifesto_points = db.Column(db.Text, nullable=True)  # Newline-delimited agenda points
    photo = db.Column(db.String(255), nullable=True)
    logo_url = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    social_handles = db.Column(db.String(255), nullable=True)

    # Brand Kit Colors
    color_theme = db.Column(db.String(10), default='#2563eb', nullable=True)
    primary_color = db.Column(db.String(10), default='#2563eb', nullable=True)
    secondary_color = db.Column(db.String(10), default='#f59e0b', nullable=True)
    accent_color = db.Column(db.String(10), default='#10b981', nullable=True)

    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    # Relationships
    mobilizers = db.relationship('Mobilizer', backref='candidate', cascade='all, delete-orphan', lazy=True)

    def __repr__(self):
        return f'<Candidate {self.id}: {self.name} ({self.position})>'

    @property
    def photo_url(self):
        if self.photo:
            return self.photo
        return f'https://ui-avatars.com/api/?name={self.name.replace(" ", "+")}&background=1e293b&color=ffffff&size=256'

    @property
    def brand_color(self):
        return self.primary_color or self.color_theme or '#2563eb'

    def get_manifesto_list(self):
        if not self.manifesto_points:
            return []
        return [p.strip() for p in self.manifesto_points.split('\n') if p.strip()]

    def to_dict(self):
        return {
            'id': self.id,
            'election_id': self.election_id,
            'election_name': self.election.name if self.election else None,
            'name': self.name,
            'position': self.position,
            'ballot_number': self.ballot_number or '1',
            'faculty_or_hall': self.faculty_or_hall or '',
            'party_or_slate': self.party_or_slate or '',
            'slogan': self.slogan or '',
            'campaign_tagline': self.campaign_tagline or '',
            'manifesto_points': self.get_manifesto_list(),
            'photo': self.photo,
            'photo_url': self.photo_url,
            'logo_url': self.logo_url or '',
            'phone': self.phone or '',
            'email': self.email or '',
            'social_handles': self.social_handles or '',
            'primary_color': self.brand_color,
            'secondary_color': self.secondary_color or '#f59e0b',
            'accent_color': self.accent_color or '#10b981',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Mobilizer(db.Model):
    __tablename__ = 'mobilizers'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    hall_or_faculty = db.Column(db.String(100), nullable=True)
    photo = db.Column(db.String(255), nullable=True)
    endorsement_quote = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    @property
    def photo_url(self):
        if self.photo:
            return self.photo
        return f'https://ui-avatars.com/api/?name={self.name.replace(" ", "+")}&background=475569&color=ffffff&size=256'

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'name': self.name,
            'hall_or_faculty': self.hall_or_faculty or '',
            'photo_url': self.photo_url,
            'endorsement_quote': self.endorsement_quote or ''
        }


class ContactList(db.Model):
    __tablename__ = 'contact_lists'

    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    # Relationships
    contacts = db.relationship('Contact', backref='contact_list', cascade='all, delete-orphan', lazy=True)

    def __repr__(self):
        return f'<ContactList {self.id}: {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'election_id': self.election_id,
            'election_name': self.election.name if self.election else None,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'contact_count': len(self.contacts)
        }


class Contact(db.Model):
    __tablename__ = 'contacts'

    id = db.Column(db.Integer, primary_key=True)
    contact_list_id = db.Column(db.Integer, db.ForeignKey('contact_lists.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    hall_or_college = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f'<Contact {self.id}: {self.name} ({self.phone})>'

    def to_dict(self):
        return {
            'id': self.id,
            'contact_list_id': self.contact_list_id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'hall_or_college': self.hall_or_college or ''
        }


class SmsCampaign(db.Model):
    __tablename__ = 'sms_campaigns'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='SET NULL'), nullable=True)
    contact_list_id = db.Column(db.Integer, db.ForeignKey('contact_lists.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender_id = db.Column(db.String(50), nullable=True)
    recipient_count = db.Column(db.Integer, default=0)
    sent_count = db.Column(db.Integer, default=0)
    delivered_count = db.Column(db.Integer, default=0)
    failed_count = db.Column(db.Integer, default=0)
    opt_out_count = db.Column(db.Integer, default=0)
    total_cost = db.Column(db.String(50), default='UGX 0.00')
    status = db.Column(db.String(50), default='Sent')
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    candidate_rel = db.relationship('Candidate', backref='sms_campaigns', lazy=True)
    contact_list_rel = db.relationship('ContactList', backref='sms_campaigns', lazy=True)
    logs = db.relationship('SmsLog', backref='campaign', cascade='all, delete-orphan', lazy=True)


class SmsLog(db.Model):
    __tablename__ = 'sms_logs'

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('sms_campaigns.id', ondelete='CASCADE'), nullable=True)
    recipient = db.Column(db.String(50), nullable=False)
    recipient_name = db.Column(db.String(150), nullable=True)
    rendered_message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='queued')  # 'queued', 'sent', 'failed', 'delivered'
    at_message_id = db.Column(db.String(100), nullable=True, index=True)
    cost = db.Column(db.String(50), default='UGX 0.00')
    error_message = db.Column(db.Text, nullable=True)
    sent_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'recipient': self.recipient,
            'recipient_name': self.recipient_name or '',
            'rendered_message': self.rendered_message,
            'status': self.status,
            'at_message_id': self.at_message_id or '',
            'cost': self.cost,
            'error_message': self.error_message or '',
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class OptOut(db.Model):
    __tablename__ = 'opt_outs'

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(50), unique=True, nullable=False, index=True)
    reason = db.Column(db.String(255), default='STOP keyword')
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'phone': self.phone,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }



class EmailCampaign(db.Model):
    __tablename__ = 'email_campaigns'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='SET NULL'), nullable=True)
    contact_list_id = db.Column(db.Integer, db.ForeignKey('contact_lists.id', ondelete='SET NULL'), nullable=True)
    subject = db.Column(db.String(200), nullable=False)
    body_html = db.Column(db.Text, nullable=False)
    template_type = db.Column(db.String(50), default='Manifesto')
    recipient_count = db.Column(db.Integer, default=0)
    sent_count = db.Column(db.Integer, default=0)
    failed_count = db.Column(db.Integer, default=0)
    attach_poster = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50), default='Sent')
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    candidate_rel = db.relationship('Candidate', backref='email_campaigns', lazy=True)
    contact_list_rel = db.relationship('ContactList', backref='email_campaigns', lazy=True)
    logs = db.relationship('EmailLog', backref='campaign', cascade='all, delete-orphan', lazy=True)


class EmailLog(db.Model):
    __tablename__ = 'email_logs'

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('email_campaigns.id', ondelete='CASCADE'), nullable=True)
    recipient = db.Column(db.String(150), nullable=False)
    recipient_name = db.Column(db.String(150), nullable=True)
    subject = db.Column(db.String(255), nullable=False)
    body_html = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='sent')  # 'sent', 'failed', 'bounced'
    error_message = db.Column(db.Text, nullable=True)
    attached_poster_path = db.Column(db.String(255), nullable=True)
    sent_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'recipient': self.recipient,
            'recipient_name': self.recipient_name or '',
            'subject': self.subject,
            'status': self.status,
            'error_message': self.error_message or '',
            'attached_poster_path': self.attached_poster_path or '',
            'sent_at': self.sent_at.isoformat() if self.sent_at else None
        }



class CampaignProject(db.Model):
    __tablename__ = 'campaign_projects'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    project_type = db.Column(db.String(50), default='poster')  # 'poster', 'batch', 'video'
    template = db.Column(db.String(50), default='executive')
    format = db.Column(db.String(20), default='1:1')
    
    candidate_name = db.Column(db.String(150), nullable=True)
    position = db.Column(db.String(100), nullable=True)
    slogan = db.Column(db.Text, nullable=True)
    rally_date = db.Column(db.String(100), nullable=True)
    rally_venue = db.Column(db.String(100), nullable=True)
    primary_color = db.Column(db.String(20), nullable=True)
    secondary_color = db.Column(db.String(20), nullable=True)
    
    photo_scale = db.Column(db.Float, default=1.0)
    photo_x_offset = db.Column(db.Integer, default=0)
    photo_y_offset = db.Column(db.Integer, default=0)
    photo_fit_mode = db.Column(db.String(20), default='contain')
    is_template = db.Column(db.Boolean, default=False, nullable=False)
    category = db.Column(db.String(50), default='elections', nullable=True)
    custom_photo_url = db.Column(db.String(255), nullable=True)
    thumbnail_url = db.Column(db.String(255), nullable=True)
    extra_data = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    candidate = db.relationship('Candidate', backref='projects', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'title': self.title,
            'project_type': self.project_type,
            'template': self.template,
            'format': self.format,
            'is_template': bool(self.is_template),
            'category': self.category or 'elections',
            'candidate_name': self.candidate_name or '',
            'position': self.position or '',
            'slogan': self.slogan or '',
            'rally_date': self.rally_date or '',
            'rally_venue': self.rally_venue or '',
            'primary_color': self.primary_color or '#1e3a8a',
            'secondary_color': self.secondary_color or '#f59e0b',
            'photo_scale': self.photo_scale,
            'photo_x_offset': self.photo_x_offset,
            'photo_y_offset': self.photo_y_offset,
            'photo_fit_mode': self.photo_fit_mode or 'contain',
            'custom_photo_url': self.custom_photo_url or '',
            'thumbnail_url': self.thumbnail_url or '',
            'extra_data': self.extra_data or '{}',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class CampaignVideo(db.Model):
    __tablename__ = 'campaign_videos'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(255), nullable=True)
    duration = db.Column(db.Float, default=30.0)
    aspect_ratio = db.Column(db.String(20), default='9:16')  # '9:16' or '1:1'
    resolution = db.Column(db.String(50), default='1080x1920')
    status = db.Column(db.String(50), default='completed')  # 'queued', 'rendering', 'completed', 'failed'
    progress = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)
    audio_track = db.Column(db.String(255), nullable=True)
    generated_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    candidate = db.relationship('Candidate', backref='videos', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'candidate_name': self.candidate.name if self.candidate else '',
            'title': self.title,
            'file_path': self.file_path,
            'duration': self.duration,
            'aspect_ratio': self.aspect_ratio,
            'resolution': self.resolution,
            'status': self.status,
            'progress': self.progress,
            'error_message': self.error_message or '',
            'audio_track': self.audio_track or '',
            'generated_at': self.generated_at.isoformat() if self.generated_at else None
        }

# Backward compatibility alias per spec
Video = CampaignVideo


