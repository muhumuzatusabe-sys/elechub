import os
import re
import base64
from datetime import datetime, timezone
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from auth import login_required
from models import db, Candidate, Election, CampaignProject

posters_bp = Blueprint('posters', __name__, url_prefix='/posters')

@posters_bp.route('/')
@login_required
def studio():
    project_id = request.args.get('project_id', type=int)
    candidate_id = request.args.get('candidate_id', type=int)
    candidates = Candidate.query.order_by(Candidate.name).all()
    elections = Election.query.order_by(Election.name).all()
    
    selected_project = None
    if project_id:
        selected_project = CampaignProject.query.get(project_id)
        if selected_project and selected_project.candidate_id:
            candidate_id = selected_project.candidate_id
            
    selected_candidate = Candidate.query.get(candidate_id) if candidate_id else (candidates[0] if candidates else None)
    
    # Also fetch recent saved projects for quick switch drawer/dropdown
    recent_projects = CampaignProject.query.filter_by(is_template=False).order_by(CampaignProject.updated_at.desc()).limit(12).all()
    user_templates = CampaignProject.query.filter_by(is_template=True).order_by(CampaignProject.updated_at.desc()).all()
    
    # Load 24 Pro Curated Templates from Library Manifest
    import json
    manifest_path = os.path.join(current_app.root_path, 'static', 'templates', 'library', 'manifest.json')
    library_templates = []
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                library_templates = json.load(f)
        except Exception:
            library_templates = []

    return render_template(
        'posters/studio.html', 
        candidates=candidates, 
        selected_candidate=selected_candidate, 
        elections=elections,
        selected_project=selected_project,
        recent_projects=recent_projects,
        user_templates=user_templates,
        library_templates=library_templates
    )


@posters_bp.route('/projects')
@login_required
def projects_list():
    projects = CampaignProject.query.filter_by(is_template=False).order_by(CampaignProject.updated_at.desc()).all()
    templates = CampaignProject.query.filter_by(is_template=True).order_by(CampaignProject.updated_at.desc()).all()
    return render_template('posters/projects.html', projects=projects, templates=templates)

@posters_bp.route('/api/save', methods=['POST'])
@login_required
def api_save():
    data = request.get_json() or {}
    project_id = data.get('project_id')
    title = (data.get('title') or '').strip()
    candidate_id = data.get('candidate_id')
    is_template = bool(data.get('is_template', False))
    category = data.get('category', 'elections')
    
    if not title:
        candidate_name = data.get('candidate_name', 'Candidate')
        prefix = "Template: " if is_template else ""
        title = f"{prefix}{candidate_name} — {data.get('template', 'Executive').replace('_', ' ').title()} Poster"

    if project_id:
        project = CampaignProject.query.get(project_id)
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
    else:
        project = CampaignProject()
        db.session.add(project)

    project.title = title
    project.candidate_id = candidate_id if candidate_id else None
    project.project_type = 'template' if is_template else data.get('project_type', 'poster')
    project.is_template = is_template
    project.category = category
    project.template = data.get('template', 'executive')
    project.format = data.get('format', '1:1')
    
    project.candidate_name = data.get('candidate_name', '')
    project.position = data.get('position', '')
    project.slogan = data.get('slogan', '')
    project.rally_date = data.get('rally_date', '')
    project.rally_venue = data.get('rally_venue', '')
    project.primary_color = data.get('primary_color', '#1e3a8a')
    project.secondary_color = data.get('secondary_color', '#f59e0b')
    
    project.photo_scale = float(data.get('photo_scale', 1.0))
    project.photo_x_offset = int(data.get('photo_x_offset', 0))
    project.photo_y_offset = int(data.get('photo_y_offset', 0))
    project.photo_fit_mode = data.get('photo_fit_mode', 'contain')
    project.custom_photo_url = data.get('custom_photo_url', '')
    
    extra_data = data.get('extra_data')
    if isinstance(extra_data, dict):
        import json
        project.extra_data = json.dumps(extra_data)
    elif isinstance(extra_data, str):
        project.extra_data = extra_data

    db.session.flush()

    # Save thumbnail if provided
    thumbnail_data = data.get('thumbnail_data')
    if thumbnail_data and thumbnail_data.startswith('data:image'):
        try:
            upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'projects')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Extract base64
            img_format, img_str = thumbnail_data.split(';base64,')
            ext = 'png'
            filename = f"project_{project.id}.{ext}"
            file_path = os.path.join(upload_dir, filename)
            
            with open(file_path, 'wb') as fh:
                fh.write(base64.b64decode(img_str))
                
            project.thumbnail_url = f"/static/uploads/projects/{filename}?t={int(datetime.now().timestamp())}"
        except Exception as e:
            current_app.logger.error(f"Failed to save project thumbnail: {e}")

    db.session.commit()
    return jsonify({
        'success': True, 
        'project_id': project.id, 
        'title': project.title,
        'message': f'Project "{project.title}" saved successfully!'
    })

@posters_bp.route('/api/project/<int:id>')
@login_required
def api_get_project(id):
    project = CampaignProject.query.get_or_404(id)
    return jsonify({
        'success': True,
        'project': project.to_dict()
    })

@posters_bp.route('/api/templates')
@login_required
def api_templates():
    category = request.args.get('category')
    query = CampaignProject.query.filter_by(is_template=True)
    if category and category != 'All':
        query = query.filter_by(category=category)
    templates = query.order_by(CampaignProject.updated_at.desc()).all()
    return jsonify({
        'success': True,
        'templates': [t.to_dict() for t in templates]
    })

@posters_bp.route('/api/use-template/<int:id>', methods=['POST'])
@login_required
def api_use_template(id):
    tpl = CampaignProject.query.get_or_404(id)
    new_poster = CampaignProject(
        title=f"Flyer from {tpl.title}",
        project_type='poster',
        template=tpl.template,
        format=tpl.format,
        is_template=False,
        category=tpl.category or 'elections',
        candidate_name=tpl.candidate_name,
        position=tpl.position,
        slogan=tpl.slogan,
        rally_date=tpl.rally_date,
        rally_venue=tpl.rally_venue,
        primary_color=tpl.primary_color,
        secondary_color=tpl.secondary_color,
        photo_scale=tpl.photo_scale,
        photo_x_offset=tpl.photo_x_offset,
        photo_y_offset=tpl.photo_y_offset,
        photo_fit_mode=tpl.photo_fit_mode,
        custom_photo_url=tpl.custom_photo_url,
        thumbnail_url=tpl.thumbnail_url,
        extra_data=tpl.extra_data
    )
    db.session.add(new_poster)
    db.session.commit()
    return jsonify({
        'success': True,
        'project_id': new_poster.id,
        'project': new_poster.to_dict(),
        'studio_url': url_for('posters.studio', project_id=new_poster.id)
    })

@posters_bp.route('/projects/<int:id>/delete', methods=['POST'])
@login_required
def delete_project(id):
    project = CampaignProject.query.get_or_404(id)
    title = project.title
    
    # Remove thumbnail if exists
    if project.thumbnail_url and project.thumbnail_url.startswith('/static/uploads/projects/'):
        clean_path = project.thumbnail_url.split('?')[0].lstrip('/')
        full_path = os.path.join(current_app.root_path, clean_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError:
                pass
                
    db.session.delete(project)
    db.session.commit()
    flash(f'Project "{title}" deleted successfully.', 'info')
    return redirect(url_for('posters.projects_list'))

@posters_bp.route('/batch')
@login_required
def batch():
    candidate_id = request.args.get('candidate_id', type=int)
    candidates = Candidate.query.order_by(Candidate.name).all()
    selected_candidate = Candidate.query.get(candidate_id) if candidate_id else (candidates[0] if candidates else None)
    return render_template('posters/batch.html', candidates=candidates, selected_candidate=selected_candidate)

@posters_bp.route('/proxy-image')
def proxy_image():
    import urllib.request
    from flask import Response
    target_url = (request.args.get('url') or '').strip()
    if not target_url or not (target_url.startswith('http://') or target_url.startswith('https://')):
        return "Invalid URL", 400
    try:
        req = urllib.request.Request(
            target_url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read()
            content_type = resp.headers.get('Content-Type', 'image/png')
            headers = {
                'Content-Type': content_type,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
            }
            return Response(content, headers=headers)
    except Exception as e:
        return f"Proxy error: {str(e)}", 502

@posters_bp.route('/fetch-external-template', methods=['POST'])
@login_required
def fetch_external_template():
    import io
    import hashlib
    import urllib.request
    from PIL import Image

    data = request.get_json() or {}
    url = (data.get('url') or '').strip()

    if not url:
        return jsonify({'success': False, 'error': 'No URL provided.'}), 400

    if not (url.startswith('http://') or url.startswith('https://')):
        return jsonify({'success': False, 'error': 'Invalid URL scheme. Must start with http:// or https://.'}), 400

    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            content_type = (response.headers.get('Content-Type') or '').lower()
            content = response.read()

        # If user pasted a Pinterest page or web URL returning HTML, parse out the real high-res image
        if 'text/html' in content_type or b'<html' in content[:500].lower():
            import re
            html_text = content.decode('utf-8', errors='ignore')
            image_url = None
            
            # 1. Look for OpenGraph image
            og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
            if not og_match:
                og_match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html_text, re.IGNORECASE)
            if og_match:
                image_url = og_match.group(1)

            # 2. Look for Twitter image
            if not image_url:
                tw_match = re.search(r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
                if tw_match:
                    image_url = tw_match.group(1)

            # 3. Look for direct i.pinimg.com image URL in script or link tags
            if not image_url:
                pinimg_match = re.search(r'https://i\.pinimg\.com/(?:originals|736x|564x)/[^\s"\'\\]+', html_text)
                if pinimg_match:
                    image_url = pinimg_match.group(0)

            if not image_url:
                return jsonify({
                    'success': False, 
                    'error': 'Could not extract direct image from page. Please open the pin, right-click the image, choose "Copy Image Address", and paste that direct link.'
                }), 400

            # Now fetch the extracted direct image
            img_req = urllib.request.Request(
                image_url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                content = img_resp.read()

        # Validate with PIL
        img = Image.open(io.BytesIO(content))
        img.verify()
        # Re-open after verify()
        img = Image.open(io.BytesIO(content))
        width, height = img.size

        # Create destination dir
        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'custom_templates')
        os.makedirs(upload_dir, exist_ok=True)

        url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()[:12]
        filename = f"template_{url_hash}_{int(datetime.now(timezone.utc).timestamp())}.png"
        file_path = os.path.join(upload_dir, filename)

        # Convert to RGB/RGBA and save
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGBA')
        img.save(file_path, 'PNG', optimize=True)

        relative_url = url_for('static', filename=f"uploads/custom_templates/{filename}")
        return jsonify({
            'success': True,
            'url': relative_url,
            'width': width,
            'height': height,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to fetch template image: {str(e)}'}), 400

@posters_bp.route('/upload-custom-template', methods=['POST'])
@login_required
def upload_custom_template():
    import io
    import hashlib
    from PIL import Image

    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded.'}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'Empty file.'}), 400

    try:
        content = file.read()
        img = Image.open(io.BytesIO(content))
        img.verify()
        img = Image.open(io.BytesIO(content))
        width, height = img.size

        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'custom_templates')
        os.makedirs(upload_dir, exist_ok=True)

        file_hash = hashlib.md5(content).hexdigest()[:12]
        filename = f"upload_{file_hash}_{int(datetime.now(timezone.utc).timestamp())}.png"
        file_path = os.path.join(upload_dir, filename)

        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGBA')
        img.save(file_path, 'PNG', optimize=True)

        relative_url = url_for('static', filename=f"uploads/custom_templates/{filename}")
        return jsonify({
            'success': True,
            'url': relative_url,
            'width': width,
            'height': height,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'error': f'Invalid image file: {str(e)}'}), 400

@posters_bp.route('/templates-library', methods=['GET'])
@login_required
def templates_library():
    import json
    manifest_path = os.path.join(current_app.root_path, 'static', 'templates', 'library', 'manifest.json')
    if not os.path.exists(manifest_path):
        return jsonify({'success': True, 'templates': [], 'categories': []})
    
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            templates = json.load(f)
        
        category = request.args.get('category')
        if category and category != 'All':
            templates = [t for t in templates if t.get('category') == category]
            
        categories = sorted(list({t.get('category', 'General') for t in templates}))
        return jsonify({
            'success': True,
            'count': len(templates),
            'categories': categories,
            'templates': templates
        })
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to load templates library: {str(e)}'}), 500

def _extract_speaker_count(prompt_lower):
    """Extract number of speakers/panelists from the prompt."""
    import re
    # Look for explicit numbers: "4 speakers", "three presenters", etc.
    word_nums = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8}
    for word, num in word_nums.items():
        if word in prompt_lower:
            return num
    # Look for digit patterns: "4 speakers", "6 panelists"
    match = re.search(r'(\d+)\s*(?:speakers?|panelists?|presenters?|guests?|facilitators?|hosts?|persons?|people)', prompt_lower)
    if match:
        return min(int(match.group(1)), 8)  # cap at 8
    # If webinar/panel mentioned but no count, default to 4
    if any(k in prompt_lower for k in ['speaker', 'webinar', 'panel', 'presenter', 'moderator']):
        return 4
    return 0


def _build_speaker_slots(count, primary, secondary, canvas_w=1080, canvas_h=1350):
    """Build positioned speaker name + title customTexts for a grid layout."""
    speakers = []
    custom_texts = []
    custom_ribbons = []

    # Grid layout: up to 4 across, 2 rows
    cols = 2 if count <= 2 else (3 if count <= 6 else 4)
    rows = (count + cols - 1) // cols

    cell_w = canvas_w // cols
    cell_h = 320 if rows == 1 else (280 if rows == 2 else 240)

    # Panel header ribbon
    header_y = 80
    custom_ribbons.append({
        'id': 'ribbon_header', 'x': 0, 'y': header_y,
        'w': canvas_w, 'h': 100, 'color': primary, 'opacity': 95, 'shape': 'rectangle'
    })

    # Footer ribbon
    footer_y = canvas_h - 120
    custom_ribbons.append({
        'id': 'ribbon_footer', 'x': 0, 'y': footer_y,
        'w': canvas_w, 'h': 120, 'color': primary, 'opacity': 95, 'shape': 'rectangle'
    })

    # Speakers grid starts after header
    grid_start_y = header_y + 110
    default_names = [
        'SPEAKER ONE', 'SPEAKER TWO', 'SPEAKER THREE', 'SPEAKER FOUR',
        'SPEAKER FIVE', 'SPEAKER SIX', 'SPEAKER SEVEN', 'SPEAKER EIGHT'
    ]
    default_titles = [
        'PhD — University of Excellence', 'MSc — Research Director',
        'Professor — Innovation Hub', 'Dr. — Policy Analyst',
        'CEO — Tech Ventures Ltd', 'Author & Keynote Coach',
        'Director of Programs', 'Senior Research Fellow'
    ]

    for i in range(count):
        col = i % cols
        row = i // cols
        cx = col * cell_w + cell_w // 2
        cy = grid_start_y + row * (cell_h + 60) + cell_h // 2

        # Photo slot label (placeholder box outline via customText with bg)
        photo_size = min(cell_w - 40, 200)
        photo_x = cx - photo_size // 2
        photo_y = cy - photo_size // 2 - 30

        speakers.append({
            'index': i + 1,
            'name': default_names[i],
            'title': default_titles[i],
            'photoX': photo_x,
            'photoY': photo_y,
            'photoSize': photo_size,
            'nameX': cx,
            'nameY': photo_y + photo_size + 18,
            'titleX': cx,
            'titleY': photo_y + photo_size + 50,
        })

        # Speaker name label
        custom_texts.append({
            'id': f'speaker_{i+1}_name',
            'text': default_names[i],
            'x': cx,
            'y': photo_y + photo_size + 18,
            'fontSize': 28,
            'color': '#ffffff',
            'fontWeight': 'bold',
            'align': 'center'
        })

        # Speaker title label
        custom_texts.append({
            'id': f'speaker_{i+1}_title',
            'text': default_titles[i],
            'x': cx,
            'y': photo_y + photo_size + 52,
            'fontSize': 18,
            'color': secondary,
            'fontWeight': 'normal',
            'align': 'center'
        })

        # Photo slot placeholder (subtle box)
        custom_ribbons.append({
            'id': f'speaker_{i+1}_slot',
            'x': photo_x, 'y': photo_y,
            'w': photo_size, 'h': photo_size,
            'color': 'rgba(255,255,255,0.08)', 'opacity': 100, 'shape': 'rounded',
            'isSpeakerSlot': True,
            'speakerIndex': i + 1
        })

    return speakers, custom_texts, custom_ribbons


def generate_template_blueprint(prompt, category='elections', image_url=''):
    prompt_lower = (prompt or '').lower()
    cat_lower = (category or 'elections').lower()

    # 0. Detect multi-speaker / webinar / panel layout FIRST (highest priority)
    speaker_count = _extract_speaker_count(prompt_lower)
    is_webinar = speaker_count > 0 or any(k in prompt_lower for k in ['webinar', 'panel discussion', 'panellist', 'lineup', 'speaker series'])

    if is_webinar:
        # Determine theme
        if any(k in prompt_lower for k in ['tech', 'innovation', 'ai', 'digital', 'virtual', 'online', 'zoom', 'live stream']):
            primary = '#0f172a'
            secondary = '#38bdf8'
        elif any(k in prompt_lower for k in ['church', 'faith', 'gospel', 'worship']):
            primary = '#047857'
            secondary = '#fbbf24'
        elif any(k in prompt_lower for k in ['business', 'corporate', 'leadership', 'executive']):
            primary = '#1e293b'
            secondary = '#f59e0b'
        else:
            primary = '#1e3a8a'
            secondary = '#d97706'

        count = max(1, speaker_count) if speaker_count else 4
        headline_map = {
            1: 'EXCLUSIVE KEYNOTE LECTURE',
            2: 'PANEL DISCUSSION: TWO VOICES',
            3: 'TRIPLE SPEAKER FORUM',
            4: 'WEBINAR: FOUR EXPERT SPEAKERS',
            5: 'FIVE-SPEAKER SUMMIT PANEL',
            6: 'SIX SPEAKERS: GLOBAL VOICES',
            7: 'SEVEN-SPEAKER ROUNDTABLE',
            8: 'EIGHT-SPEAKER GRAND SUMMIT',
        }
        headline = headline_map.get(count, f'{count}-SPEAKER WEBINAR & PANEL')
        sub = 'INTERACTIVE FORUM WITH INDUSTRY EXPERTS & THOUGHT LEADERS'
        slogan = 'JOIN US LIVE — LIMITED SEATS AVAILABLE • REGISTER NOW'
        date = 'SATURDAY, 25TH OCT 2026 • 10:00 AM – 2:00 PM'
        venue = 'VIRTUAL EVENT — ZOOM WEBINAR & LIVE STREAM'
        badge_text = 'WEBINAR'
        fit_mode = 'cover'
        photo_shape = 'circle'
        tpl = 'speaker_gradient'

        speakers, speaker_texts, speaker_ribbons = _build_speaker_slots(count, primary, secondary)

        # Event title custom text at top
        event_texts = [
            {'id': 'event_title', 'text': headline, 'x': 540, 'y': 95, 'fontSize': 36, 'color': '#ffffff', 'fontWeight': 'bold', 'align': 'center'},
            {'id': 'event_sub', 'text': sub, 'x': 540, 'y': 145, 'fontSize': 18, 'color': secondary, 'fontWeight': 'normal', 'align': 'center'},
            {'id': 'event_date', 'text': date, 'x': 540, 'y': 1250, 'fontSize': 20, 'color': '#ffffff', 'fontWeight': 'bold', 'align': 'center'},
            {'id': 'event_venue', 'text': venue, 'x': 540, 'y': 1290, 'fontSize': 16, 'color': secondary, 'fontWeight': 'normal', 'align': 'center'},
        ]

        return {
            'template': tpl,
            'category': 'academic',
            'primaryColor': primary,
            'secondaryColor': secondary,
            'candidateName': headline,
            'position': sub,
            'slogan': slogan,
            'rallyDate': date,
            'rallyVenue': venue,
            'photoFitMode': fit_mode,
            'photoShape': photo_shape,
            'badgeText': badge_text,
            'customTemplateUrl': image_url or '',
            'speakers': speakers,
            'speakerCount': count,
            'isMultiSpeaker': True,
            'customTexts': event_texts + speaker_texts,
            'customRibbons': speaker_ribbons,
            'aiSummary': f"Multi-speaker layout with {count} speaker slot(s). Each slot has a photo placeholder, name label and title label — all fully editable. Palette: {primary} / {secondary}."
        }

    # 1. Select optimal layout base & default palette (single-subject events)
    if any(k in prompt_lower or k in cat_lower for k in ['concert', 'party', 'music', 'bash', 'dj', 'night', 'rave', 'disco']):
        tpl = 'neon_pulse'
        primary = '#ec4899'  # Neon Pink
        secondary = '#06b6d4'  # Electric Cyan
        headline = 'CAMPUS MEGA BASH 2026'
        sub = 'FEATURING LIVE ACTS & TOP CAMPUS DJS'
        slogan = 'THE WILDEST NIGHT OF THE SEMESTER • ALL ACCESS'
        date = 'FRIDAY, 28TH NOV • 7:00 PM TILL DAWN'
        venue = 'UNIVERSITY SPORTS GROUNDS'
        badge_text = 'LIVE CONCERT'
        fit_mode = 'cover'
        photo_shape = 'circle'
    elif any(k in prompt_lower or k in cat_lower for k in ['academic', 'seminar', 'lecture', 'conference', 'symposium', 'thesis', 'dean', 'faculty']):
        tpl = 'speaker_gradient'
        primary = '#1e3a8a'  # Royal Navy
        secondary = '#d97706'  # Amber Gold
        headline = 'ANNUAL SCHOLARS SYMPOSIUM'
        sub = 'DISTINGUISHED PUBLIC LECTURE & POLICY FORUM'
        slogan = 'TRANSFORMING HIGHER EDUCATION THROUGH ACTIONABLE RESEARCH'
        date = 'THURSDAY, 15TH OCT • 9:00 AM'
        venue = 'CENTRAL AUDITORIUM • MAIN CAMPUS'
        badge_text = 'PUBLIC FORUM'
        fit_mode = 'contain'
        photo_shape = 'card'
    elif any(k in prompt_lower or k in cat_lower for k in ['sport', 'tournament', 'cup', 'derby', 'football', 'soccer', 'basketball', 'athletics']):
        tpl = 'rally'
        primary = '#dc2626'  # Vibrant Red
        secondary = '#f59e0b'  # Golden Amber
        headline = 'FACULTY DERBY GRAND FINALS'
        sub = 'ENGINEERING LIONS VS BUSINESS WARRIORS'
        slogan = 'THE CLASH OF CHAMPIONS • WHO LIFTS THE GUILD CUP?'
        date = 'SATURDAY, 7TH NOV • 3:00 PM KICKOFF'
        venue = 'MAIN UNIVERSITY STADIUM'
        badge_text = 'CHAMPIONSHIP'
        fit_mode = 'cover'
        photo_shape = 'rounded'
    elif any(k in prompt_lower or k in cat_lower for k in ['church', 'faith', 'prayer', 'fellowship', 'worship', 'crusade', 'gospel', 'service', 'sunday']):
        tpl = 'goodwill_greeting'
        primary = '#047857'  # Emerald Green
        secondary = '#fbbf24'  # Warm Gold
        headline = 'ANNUAL CAMPUS HARVEST CRUSADE'
        sub = 'GUEST PREACHER & CAMPUS PRAISE CHOIR'
        slogan = 'EXPERIENCE DIVINE GRACE, RESTORATION & ELEVATION'
        date = 'SUNDAY, 18TH OCT • 10:00 AM & 4:00 PM'
        venue = 'FREEDOM SQUARE LAWNS • ALL ARE WELCOME'
        badge_text = 'FREE ENTRY'
        fit_mode = 'contain'
        photo_shape = 'cutout'
    elif any(k in prompt_lower or k in cat_lower for k in ['tech', 'hackathon', 'code', 'ai', 'summit', 'innovation', 'startup', 'workshop', 'developer']):
        tpl = 'future_forward'
        primary = '#0f172a'  # Slate Navy
        secondary = '#38bdf8'  # Neon Sky
        headline = 'CAMPUS AI & BUILDERS HACKATHON'
        sub = 'BUILD INTELLIGENT APPS IN 48 HOURS'
        slogan = 'INNOVATE • DEPLOY • SCALE • WIN $5,000 PRIZES'
        date = '12TH - 14TH NOV • 24/7 IN-PERSON & REMOTE'
        venue = 'INNOVATION HUB • LAB 4'
        badge_text = 'HACKATHON'
        fit_mode = 'cover'
        photo_shape = 'cutout'
    elif any(k in prompt_lower or k in cat_lower for k in ['charity', 'health', 'blood', 'donation', 'drive', 'medical', 'volunteer']):
        tpl = 'bold_minimal'
        primary = '#b91c1c'  # Crimson Red
        secondary = '#f43f5e'  # Rose
        headline = 'CAMPUS BLOOD DONATION DRIVE'
        sub = 'SAVE A LIFE TODAY • FREE COMPREHENSIVE HEALTH SCREEN'
        slogan = 'EVERY DROP COUNTS • STAND UNITED FOR OUR COMMUNITY'
        date = 'WEDNESDAY, 21ST OCT • 8:00 AM - 5:00 PM'
        venue = 'STUDENTS CENTRE MAIN GROUNDS'
        badge_text = 'DONATE LIFE'
        fit_mode = 'contain'
        photo_shape = 'circle'
    else:
        # Default Campus Election / Leadership
        tpl = 'presidential_landmark' if ('president' in prompt_lower or 'guild' in prompt_lower) else 'executive'
        primary = '#1e3a8a'
        secondary = '#f59e0b'
        headline = 'DR. ARTHUR K. BUKENYA'
        sub = 'GUILD PRESIDENTIAL CANDIDATE 2026 / 2027'
        slogan = 'STUDENT-CENTERED ADVOCACY • PROVEN INTEGRITY • INCLUSIVE GOVERNANCE'
        date = 'GRAND CAMPAIGN RALLY • FRIDAY 4:00 PM'
        venue = 'FREEDOM SQUARE GROUNDS'
        badge_text = 'VOTE 2026'
        fit_mode = 'cover'
        photo_shape = 'cutout'

    # 2. Color overrides if user explicitly specified colors in prompt
    if 'gold' in prompt_lower or 'luxury' in prompt_lower:
        secondary = '#f59e0b'
    if 'green' in prompt_lower or 'emerald' in prompt_lower:
        primary = '#065f46'
    if 'purple' in prompt_lower or 'violet' in prompt_lower:
        primary = '#6b21a8'
    if 'orange' in prompt_lower or 'amber' in prompt_lower:
        secondary = '#f97316'
    if 'cyan' in prompt_lower or 'sky' in prompt_lower:
        secondary = '#06b6d4'
    if 'black' in prompt_lower or 'dark' in prompt_lower:
        primary = '#090d16'

    # If image_url provided, use custom_template layout mode with reference
    if image_url:
        tpl = 'custom_template'

    return {
        'template': tpl,
        'category': category,
        'primaryColor': primary,
        'secondaryColor': secondary,
        'candidateName': headline,
        'position': sub,
        'slogan': slogan,
        'rallyDate': date,
        'rallyVenue': venue,
        'photoFitMode': fit_mode,
        'photoShape': photo_shape,
        'badgeText': badge_text,
        'customTemplateUrl': image_url or '',
        'isMultiSpeaker': False,
        'speakers': [],
        'speakerCount': 0,
        'customTexts': [
            {'id': 'badge_pill', 'text': badge_text, 'x': 860, 'y': 80, 'fontSize': 24, 'color': '#ffffff', 'bg': secondary, 'fontWeight': 'bold'},
            {'id': 'admission', 'text': 'ADMISSION FREE • ALL WELCOME', 'x': 600, 'y': 1140, 'fontSize': 20, 'color': '#ffffff', 'bg': 'rgba(15,23,42,0.85)', 'fontWeight': 'bold'}
        ],
        'customRibbons': [
            {'id': 'bottom_ribbon', 'x': 100, 'y': 1060, 'w': 1000, 'h': 75, 'color': primary, 'opacity': 90, 'shape': 'rectangle'}
        ],
        'aiSummary': f"AI Design Blueprint for {category.title()} flyer based on '{prompt or 'custom aesthetic'}'. Loaded with harmonious palette ({primary}, {secondary}) and editable layers."
    }

@posters_bp.route('/api/ai-generate-template', methods=['POST'])
@login_required
def ai_generate_template():
    data = request.get_json() or {}
    prompt = (data.get('prompt') or '').strip()
    category = (data.get('category') or 'elections').strip()
    image_url = (data.get('image_url') or '').strip()

    blueprint = generate_template_blueprint(prompt, category, image_url)
    return jsonify({
        'success': True,
        'blueprint': blueprint,
        'prompt': prompt,
        'category': category
    })

