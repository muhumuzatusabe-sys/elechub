/**
 * ELECHUB — Campaign Field Photo to Video Reel Engine
 * Compiles campaign trail photos into dynamic 9:16 vertical short-form hype videos.
 */

class CampaignVideoReelEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 9:16 Vertical Video (1080x1920)
        this.width = 1080;
        this.height = 1920;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.photos = []; // Array of Image objects
        this.currentSlide = 0;
        this.slideDuration = 2800; // ms per slide
        this.fadeDuration = 600;   // ms transition
        
        this.isPlaying = false;
        this.isRecording = false;
        this.startTime = 0;
        this.animFrameId = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];

        this.meta = {
            candidateName: "",
            position: "",
            slogan: "",
            primaryColor: "#1e3a8a",
            secondaryColor: "#f59e0b"
        };
    }

    addPhotoFromDataUrl(dataUrl, callback) {
        const img = new Image();
        img.onload = () => {
            this.photos.push(img);
            if (!this.isPlaying) {
                this.renderSlide(0, 0);
            }
            if (callback) callback();
        };
        img.src = dataUrl;
    }

    clearPhotos() {
        this.photos = [];
        this.stop();
        this.renderBlank();
    }

    renderBlank() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Upload Field Photos to Preview Reel', this.width / 2, this.height / 2);
        this.ctx.textAlign = 'left';
    }

    play() {
        if (!this.photos.length) return;
        this.isPlaying = true;
        this.startTime = performance.now();
        this.loop();
    }

    stop() {
        this.isPlaying = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.photos.length > 0) {
            this.renderSlide(0, 0);
        }
    }

    loop() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const elapsedTotal = now - this.startTime;
        const totalDuration = this.photos.length * this.slideDuration;
        const loopTime = elapsedTotal % totalDuration;

        const slideIndex = Math.floor(loopTime / this.slideDuration);
        const slideProgress = (loopTime % this.slideDuration) / this.slideDuration;

        this.renderFrame(slideIndex, slideProgress, elapsedTotal);

        this.animFrameId = requestAnimationFrame(() => this.loop());
    }

    renderFrame(slideIdx, progress, globalTime) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        const currentImg = this.photos[slideIdx];
        const nextImg = this.photos[(slideIdx + 1) % this.photos.length];

        // 1. Ken Burns Pan / Zoom on Current Photo
        // Zoom from 1.05 to 1.18 smoothly
        const scale = 1.05 + progress * 0.12;
        const panX = Math.sin(progress * Math.PI) * 30;
        const panY = progress * -40;

        ctx.save();
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, w, h);
        this.drawImageCover(ctx, currentImg, panX, panY, scale);
        ctx.restore();

        // 2. Cross-fade to Next Photo if near transition end
        const transitionStart = 1.0 - (this.fadeDuration / this.slideDuration);
        if (progress > transitionStart && this.photos.length > 1) {
            const fadeProgress = (progress - transitionStart) / (1.0 - transitionStart);
            ctx.save();
            ctx.globalAlpha = fadeProgress;
            this.drawImageCover(ctx, nextImg, 0, 0, 1.05);
            ctx.restore();
        }

        // 3. Cinematic Dark Vignette Gradients (Top & Bottom)
        const topGrad = ctx.createLinearGradient(0, 0, 0, 360);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, 360);

        const bottomGrad = ctx.createLinearGradient(0, h - 680, 0, h);
        bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bottomGrad.addColorStop(0.5, 'rgba(5, 10, 24, 0.88)');
        bottomGrad.addColorStop(1, 'rgba(5, 10, 24, 0.98)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, h - 680, w, 680);

        // 4. Header Badge
        ctx.fillStyle = this.meta.secondaryColor || '#f59e0b';
        ctx.fillRect(0, 0, w, 16);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('CAMPUS TRAIL MOMENTS', 80, 80);

        // Progress Bar for Reel
        const barW = (w - 160) * (progress);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(80, 105, w - 160, 6);
        ctx.fillStyle = this.meta.secondaryColor || '#f59e0b';
        ctx.fillRect(80, 105, barW, 6);

        // 5. Lower-Third Candidate Banner (Always in Video)
        this.renderLowerThird(ctx, w, h, globalTime);
    }

    renderLowerThird(ctx, w, h, time) {
        const pColor = this.meta.primaryColor || '#1e3a8a';
        const sColor = this.meta.secondaryColor || '#f59e0b';

        const cardY = h - 480;

        // Banner Card
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(60, cardY, w - 120, 360, 32);
        ctx.fill();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Campaign Badge (Top Right of Card)
        const stampW = 160;
        const stampH = 54;
        const stampX = w - 60 - stampW - 30;
        const stampY = cardY + 45;

        ctx.fillStyle = sColor;
        ctx.beginPath();
        ctx.roundRect(stampX, stampY, stampW, stampH, 16);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('ELECT', stampX + 38, stampY + 36);

        // Candidate Name
        if (this.meta.candidateName) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 68px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(this.meta.candidateName.toUpperCase(), 100, cardY + 95);
        }

        // Office Contested
        if (this.meta.position) {
            ctx.fillStyle = sColor;
            ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(`FOR ${this.meta.position.toUpperCase()}`, 100, cardY + 155);
        }

        // Slogan Strip
        if (this.meta.slogan) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 500 30px "Plus Jakarta Sans", sans-serif';
            this.wrapText(ctx, `“${this.meta.slogan}”`, 100, cardY + 225, w - 200, 38);
        }

        // Campaign Hashtag
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('#Leadership • #Excellence', 100, cardY + 315);

        ctx.restore();
    }

    renderSlide(slideIdx, progress) {
        if (!this.photos.length) return;
        this.renderFrame(slideIdx, progress, 0);
    }

    drawImageCover(ctx, img, offsetX = 0, offsetY = 0, scale = 1.0) {
        const w = this.width;
        const h = this.height;
        const imgRatio = img.width / img.height;
        const screenRatio = w / h;

        let renderW, renderH;
        if (imgRatio > screenRatio) {
            renderH = h * scale;
            renderW = renderH * imgRatio;
        } else {
            renderW = w * scale;
            renderH = renderW / imgRatio;
        }

        const renderX = (w - renderW) / 2 + offsetX;
        const renderY = (imgRatio < screenRatio) ? offsetY : Math.max(0, (h - renderH) / 4) + offsetY;

        ctx.drawImage(img, renderX, renderY, renderW, renderH);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    /* Record Video using Canvas MediaRecorder */
    startRecording(onComplete) {
        if (!this.photos.length) return;

        this.stop();
        this.isRecording = true;
        this.recordedChunks = [];

        const stream = this.canvas.captureStream(30); // 30 FPS
        const options = { mimeType: 'video/webm;codecs=vp9' };

        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            this.mediaRecorder = new MediaRecorder(stream);
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            this.isRecording = false;
            this.stop();
            if (onComplete) onComplete(blob);
        };

        this.mediaRecorder.start();
        this.play();

        // Stop recording after 1 complete cycle through all photos
        const totalDuration = this.photos.length * this.slideDuration;
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        }, totalDuration);
    }
}
