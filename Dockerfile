# ELECHUB Production Container for Cloud Run & Firebase Hosting
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    FLASK_ENV=production

# Set working directory
WORKDIR /app

# Install system dependencies (including FFmpeg runtime dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir gunicorn

# Copy project files (respecting .dockerignore)
COPY . /app/

# Ensure static upload directories exist with write permissions
RUN mkdir -p /app/static/uploads/candidates \
             /app/static/uploads/custom_templates \
             /app/static/uploads/candidate_videos/audio \
             /app/static/uploads/candidate_videos/photos \
             /app/instance

EXPOSE 8080

# Start with Gunicorn binding to Cloud Run dynamic $PORT (default 8080)
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile - app:app"]
