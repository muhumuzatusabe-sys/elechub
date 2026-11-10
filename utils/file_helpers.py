import os
from PIL import Image
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', {'png', 'jpg', 'jpeg', 'webp'})

def save_candidate_photo(file_storage, candidate_id):
    """
    Saves an uploaded candidate photo as a high-quality JPG image
    at /static/uploads/candidates/<candidate_id>.jpg.
    Resizes if dimensions exceed 1200x1200 while maintaining aspect ratio.
    """
    if not file_storage or file_storage.filename == '':
        return None

    if not allowed_file(file_storage.filename):
        raise ValueError('Invalid image format. Allowed formats: JPG, PNG, WEBP.')

    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{candidate_id}.jpg"
    filepath = os.path.join(upload_dir, filename)

    try:
        # Open and process with Pillow
        image = Image.open(file_storage)
        
        # Convert RGBA or Palette to RGB for JPEG saving
        if image.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            bg.paste(image, mask=image.split()[-1])
            image = bg
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # Limit maximum dimension to 1200px
        max_size = (1200, 1200)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)

        image.save(filepath, format='JPEG', quality=90, optimize=True)
        return f"/static/uploads/candidates/{filename}"
    except Exception as e:
        raise RuntimeError(f"Error processing candidate photo: {str(e)}")
