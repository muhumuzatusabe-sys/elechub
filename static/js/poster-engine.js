/**
 * ELECHUB — High-Resolution Campus Campaign Poster Engine
 * Deterministic Canvas & SVG Rendering (300 DPI Export)
 */

class CampaignPosterEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.format = '1:1'; // '1:1' (2000x2000) or '9:16' (1080x1920)
        this.template = 'executive'; // 'executive', 'rally', 'manifesto', 'endorsement'
        
        this.data = {
            candidateName: "",
            position: "",
            slogan: "",
            tagline: "",
            facultyOrHall: "",
            alliance: "",
            rallyDate: "",
            rallyVenue: "",
            manifestoList: [],
            primaryColor: "#1e3a8a",   // Deep Navy
            secondaryColor: "#f59e0b", // Warm Gold
            accentColor: "#dc2626",    // Crimson
            photoImg: null,
            photoScale: 1.0,
            photoXOffset: 0,
            photoYOffset: 0,
            photoFitMode: 'contain',
            mobilizerName: "",
            mobilizerRole: "",
            mobilizerPhoto: null,

            // Authentic Campus & Mobilization Fields
            greetingScript: "",
            greetingTitle: "",
            goodwillMessage: "",
            courseYear: "",
            subPosition: "",
            hashtag: "",
            sessionName: "",
            associationName: "",
            associationAcronym: "",
            showWatermark: false,
            showBadges: false,

            // Interactive Image Adjustments & Flexible Background Handling
            photoContrast: 100,
            photoBrightness: 100,
            photoSaturate: 100,
            photoFlipH: false,
            photoBlendMode: 'normal',
            photoBackdropColor: 'transparent',
            photoBottomFade: 0,
            removePhotoBg: false,
            photoBgKeyColor: '#ffffff',
            photoBgTolerance: 25,
            photoBgSmoothness: 10,
            photoBgConnectedOnly: true,

            // Interactive Per-Entry Font Sizes
            nameFontSize: null,
            positionFontSize: null,
            sloganFontSize: null,
            scriptFontSize: null,
            titleFontSize: null,
            quoteFontSize: null,

            // Interactive Per-Entry Position Offsets (Vertical Y & Horizontal X)
            nameYOffset: 0,
            nameXOffset: 0,
            positionYOffset: 0,
            positionXOffset: 0,
            sloganYOffset: 0,
            sloganXOffset: 0,
            scriptYOffset: 0,
            scriptXOffset: 0,
            titleYOffset: 0,
            titleXOffset: 0,
            quoteYOffset: 0,
            quoteXOffset: 0,

            // Interactive Per-Entry Colors
            nameColor: null,
            secondaryNameColor: null,
            positionColor: null,
            sloganColor: null,
            scriptColor: null,
            titleColor: null,
            quoteColor: null,
            courseYearColor: null,
            subPositionColor: null,
            bannerColor: null,
            cardBgColor: null,

            // Pinterest & Custom Template Import Properties
            customTemplateImg: null,
            customTemplateUrl: null,
            showCustomBackground: true,
            customTemplateFit: 'cover', // 'cover', 'contain', 'stretch'
            customTemplateOpacity: 100,
            customTemplateBrightness: 100,
            customTemplateContrast: 100,
            customTemplateTintAlpha: 0,
            customTemplateTintColor: '#000000',
            customTemplateScale: 1.0,
            customTemplateXOffset: 0,
            customTemplateYOffset: 0,
            customTemplatePhotoShape: 'circle', // 'circle', 'rounded', 'cutout'
            customTemplateShowPhoto: true,
            customTemplateShowName: true,
            customTemplateShowPosition: true,
            customTemplateShowSlogan: true,

            // Candidate Shield / Background Mask (Optional patch covering reference person in template image)
            customTemplateMaskEnabled: false,
            customTemplateMaskShape: 'card', // 'card', 'pill', 'circle', 'patch', 'gradient'
            customTemplateMaskColor: '#0f172a',
            customTemplateMaskWidth: 0,
            customTemplateMaskHeight: 0,
            customTemplateMaskXOffset: 0,
            customTemplateMaskYOffset: 0,
            customTemplateMaskBorder: true,
            customTemplateMaskBorderColor: null,

            // Customizable Overlay Ribbons & Banner Patches (For covering & replacing items on Pinterest templates)
            customRibbons: [],

            // Template Ribbon & Backdrop Card Controls (Adjustable, resizable, nudgable, deletable)
            showTemplateRibbon: true,
            templateRibbonYOffset: 0,
            templateRibbonXOffset: 0,
            templateRibbonWidthOffset: 0,
            templateRibbonHeightOffset: 0,
            showVotePill: true,
            votePillYOffset: 0,
            votePillXOffset: 0,
            customTemplateShowTagline: true,

            // Ribbon Lighting Fade (Anchored to card/ribbon top edge, not floating in the middle)
            showRibbonFade: true,
            ribbonFadeHeight: 45,

            // Poster Boundary & Crop Frame Tool (Define active region to eliminate unwanted areas)
            boundaryInsetTop: 0,
            boundaryInsetBottom: 0,
            boundaryInsetLeft: 0,
            boundaryInsetRight: 0,
            showBoundaries: true,
            boundaryRuleOfThirds: false,

            // Multi-Photo Layer Support (Additional candidate / speaker / guest photos)
            extraPhotos: []
        };

        this.updateDimensions();
    }

    setFormat(fmt) {
        this.format = fmt;
        this.updateDimensions();
        this.render();
    }

    setTemplate(tpl) {
        this.template = tpl;
        this.render();
    }

    updateDimensions() {
        if (this.format === '9:16') {
            this.width = 1080;
            this.height = 1920;
        } else if (this.format === '4:5') {
            this.width = 1600;
            this.height = 2000;
        } else if (this.format === '16:9') {
            this.width = 1920;
            this.height = 1080;
        } else if (this.format === 'a4') {
            this.width = 2480;
            this.height = 3508;
        } else if (this.format === 'custom') {
            if (!this.width) this.width = 2000;
            if (!this.height) this.height = 2000;
        } else {
            this.width = 2000;
            this.height = 2000;
        }
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setCustomDimensions(width, height) {
        this.width = Math.max(400, Math.min(6000, parseInt(width) || 2000));
        this.height = Math.max(400, Math.min(6000, parseInt(height) || 2000));
        this.format = 'custom';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.render();
    }

    addCustomText(text = 'NEW NOTICE / TEXT', x = null, y = null, fontSize = 54, color = null) {
        if (!this.data.customTexts) this.data.customTexts = [];
        const index = this.data.customTexts.length + 1;

        if (!color) {
            const lightTemplates = ['presidential_landmark', 'goodwill_greeting', 'asymmetric_card'];
            const isLightBg = lightTemplates.includes(this.template) || (this.data.cardBgColor && ['#ffffff', '#fff', '#f8fafc', '#f1f5f9'].includes(this.data.cardBgColor.toLowerCase()));
            color = isLightBg ? (this.data.primaryColor || '#0f172a') : '#ffffff';
        }

        const newText = {
            id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            text: text,
            x: x !== null ? x : Math.round(this.width / 2),
            y: y !== null ? y : Math.round(this.height * 0.45) + (index * 70),
            fontSize: fontSize,
            color: color,
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: '800',
            fontStyle: 'normal',
            textTransform: 'none',
            align: 'center',
            strokeColor: null,
            strokeWidth: 0,
            shadowStyle: 'soft',
            bgBadge: 'none',
            xOffset: 0,
            yOffset: 0,
            isCentered: true
        };
        this.data.customTexts.push(newText);
        this.selectedElement = newText.id;
        this.render();
        return newText;
    }

    removeCustomText(id) {
        if (!this.data.customTexts) return;
        this.data.customTexts = this.data.customTexts.filter(t => t.id !== id);
        if (this.selectedElement === id) {
            this.selectedElement = null;
        }
        this.render();
    }

    addCustomRibbon(options = {}) {
        if (!this.data.customRibbons) this.data.customRibbons = [];
        const index = this.data.customRibbons.length + 1;
        const newRibbon = {
            id: 'custom_ribbon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            x: options.x !== undefined ? options.x : Math.round(this.width / 2),
            y: options.y !== undefined ? options.y : Math.round(this.height * 0.70) + (index * 40),
            w: options.w || Math.round(this.width * 0.82),
            h: options.h || 120,
            xOffset: 0,
            yOffset: 0,
            color: options.color || this.data.secondaryColor || '#f59e0b',
            borderRadius: options.borderRadius !== undefined ? options.borderRadius : 20,
            opacity: options.opacity !== undefined ? options.opacity : 100,
            borderColor: options.borderColor || null,
            borderWidth: options.borderWidth || 0,
            isCentered: true
        };
        this.data.customRibbons.push(newRibbon);
        this.selectedElement = newRibbon.id;
        this.render();
        return newRibbon;
    }

    removeCustomRibbon(id) {
        if (!this.data.customRibbons) return;
        this.data.customRibbons = this.data.customRibbons.filter(r => r.id !== id);
        if (this.selectedElement === id) {
            this.selectedElement = null;
        }
        this.render();
    }

    loadPhoto(src, callback) {
        if (!src) {
            this.data.photoImg = null;
            this.render();
            if (callback) callback(null);
            return;
        }
        const img = new Image();
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
            this.data.photoImg = img;
            this.render();
            if (callback) callback(img);
        };
        img.onerror = () => {
            console.warn('[PosterEngine] Could not load photo:', src);
            this.data.photoImg = null;
            this.render();
            if (callback) callback(null);
        };
        img.src = src;
    }

    loadMobilizerPhoto(src, callback) {
        if (!src) {
            this.data.mobilizerPhoto = null;
            this.render();
            if (callback) callback(null);
            return;
        }
        const img = new Image();
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
            this.data.mobilizerPhoto = img;
            this.render();
            if (callback) callback(img);
        };
        img.onerror = () => {
            console.warn('[PosterEngine] Could not load mobilizer photo:', src);
            this.data.mobilizerPhoto = null;
            this.render();
            if (callback) callback(null);
        };
        img.src = src;
    }

    loadCustomTemplate(src, callback, autoAdaptSize = false, targetTemplate = null) {
        if (!src) {
            if (callback) callback(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let retriedWithProxy = false;

        img.onload = () => {
            this.data.customTemplateImg = img;
            this.data.customTemplateUrl = src;
            this.data.showCustomBackground = true;
            if (autoAdaptSize && img.naturalWidth && img.naturalHeight) {
                this.setCustomDimensions(img.naturalWidth, img.naturalHeight);
            }
            if (targetTemplate) {
                this.template = targetTemplate;
            }
            this.render();
            if (callback) callback(img);
        };

        img.onerror = (err) => {
            if (!retriedWithProxy && (src.startsWith('http://') || src.startsWith('https://')) && !src.includes('/posters/proxy-image')) {
                retriedWithProxy = true;
                img.src = '/posters/proxy-image?url=' + encodeURIComponent(src);
                return;
            }
            console.warn('Custom template image failed to load:', src, err);
            if (callback) callback(null);
        };

        img.src = src;
    }

    loadBadge1(src, callback) {
        if (!src) {
            if (callback) callback(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let retriedWithProxy = false;

        img.onload = () => {
            this.data.badge1Img = img;
            this.data.badge1Url = src;
            this.data.badge1Visible = true;
            this.data.showBadges = true;
            this.render();
            if (callback) callback(img);
        };

        img.onerror = (err) => {
            if (!retriedWithProxy && (src.startsWith('http://') || src.startsWith('https://')) && !src.includes('/posters/proxy-image')) {
                retriedWithProxy = true;
                img.src = '/posters/proxy-image?url=' + encodeURIComponent(src);
                return;
            }
            console.warn('Badge 1 failed to load:', src, err);
            if (callback) callback(null);
        };

        img.src = src;
    }

    loadBadge2(src, callback) {
        if (!src) {
            if (callback) callback(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let retriedWithProxy = false;

        img.onload = () => {
            this.data.badge2Img = img;
            this.data.badge2Url = src;
            this.data.badge2Visible = true;
            this.data.showBadges = true;
            this.render();
            if (callback) callback(img);
        };

        img.onerror = (err) => {
            if (!retriedWithProxy && (src.startsWith('http://') || src.startsWith('https://')) && !src.includes('/posters/proxy-image')) {
                retriedWithProxy = true;
                img.src = '/posters/proxy-image?url=' + encodeURIComponent(src);
                return;
            }
            console.warn('Badge 2 failed to load:', src, err);
            if (callback) callback(null);
        };

        img.src = src;
    }

    loadLandmarkGraphic(src, callback) {
        if (!src) {
            if (callback) callback(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let retriedWithProxy = false;

        img.onload = () => {
            this.data.landmarkImg = img;
            this.data.landmarkUrl = src;
            this.data.landmarkVisible = true;
            this.data.showWatermark = true;
            this.render();
            if (callback) callback(img);
        };

        img.onerror = (err) => {
            if (!retriedWithProxy && (src.startsWith('http://') || src.startsWith('https://')) && !src.includes('/posters/proxy-image')) {
                retriedWithProxy = true;
                img.src = '/posters/proxy-image?url=' + encodeURIComponent(src);
                return;
            }
            console.warn('Landmark graphic failed to load:', src, err);
            if (callback) callback(null);
        };

        img.src = src;
    }

    /* Direct in-place replacement for currently selected canvas image element */
    replaceSelectedImage(src, callback) {
        const el = this.selectedElement;
        if (!el) return;
        if (el === 'photo') {
            this.loadPhoto(src, callback);
        } else if (el === 'badge1') {
            this.loadBadge1(src, callback);
        } else if (el === 'badge2') {
            this.loadBadge2(src, callback);
        } else if (el === 'landmark') {
            this.loadLandmarkGraphic(src, callback);
        } else if (el === 'customTemplate' || el === 'backdrop' || el === 'background') {
            this.loadCustomTemplate(src, callback);
        }
    }

    /* Universal Typography Helpers: Retrieve dynamic font family and text styles */
    getFontString(elementKey, defaultSize, defaultFamily = 'Plus Jakarta Sans', defaultWeight = '800', defaultStyle = 'normal') {
        const size = this.data[`${elementKey}FontSize`] || defaultSize;
        const family = this.data[`${elementKey}FontFamily`] || defaultFamily;
        const weight = this.data[`${elementKey}FontWeight`] || defaultWeight;
        const style = this.data[`${elementKey}FontStyle`] || defaultStyle;
        return `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px "${family}", sans-serif`;
    }

    applyTextTransform(elementKey, text) {
        if (!text) return '';
        const transform = this.data[`${elementKey}TextTransform`];
        if (transform === 'uppercase') return text.toUpperCase();
        if (transform === 'lowercase') return text.toLowerCase();
        if (transform === 'none') return text;
        return text;
    }

    drawStyledText(ctx, elementKey, text, x, y, options = {}) {
        if (!text) return;
        const size = options.size || this.data[`${elementKey}FontSize`] || 48;
        const family = this.data[`${elementKey}FontFamily`] || options.family || 'Plus Jakarta Sans';
        const weight = this.data[`${elementKey}FontWeight`] || options.weight || '800';
        const style = this.data[`${elementKey}FontStyle`] || options.style || 'normal';
        const align = options.align || 'center';
        const strokeWidth = this.data[`${elementKey}StrokeWidth`] || 0;
        const strokeColor = this.data[`${elementKey}StrokeColor`];
        const shadowStyle = this.data[`${elementKey}ShadowStyle`] || (options.shadow !== undefined ? options.shadow : 'soft');
        const bgBadge = this.data[`${elementKey}BgBadge`] || 'none';

        ctx.save();
        ctx.font = `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px "${family}", sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = options.baseline || 'middle';

        const metrics = ctx.measureText(text);
        const textW = metrics.width;
        const textH = size * 1.2;

        if (bgBadge && bgBadge !== 'none') {
            ctx.save();
            const padX = Math.max(14, size * 0.35);
            const padY = Math.max(8, size * 0.2);
            const bW = textW + (padX * 2);
            const bH = textH + (padY * 2);
            let bX = x - (bW / 2);
            if (align === 'left') bX = x - padX;
            else if (align === 'right') bX = x - textW - padX;
            const bY = y - (textH / 2) - padY;

            if (bgBadge === 'dark') ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            else if (bgBadge === 'light') ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            else if (bgBadge === 'accent') ctx.fillStyle = this.data.primaryColor || '#4f46e5';
            else if (bgBadge === 'danger') ctx.fillStyle = '#dc2626';
            else if (bgBadge === 'gold') ctx.fillStyle = '#d97706';

            const rad = Math.min(14, bH / 2);
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(bX, bY, bW, bH, rad);
                ctx.fill();
            } else {
                ctx.fillRect(bX, bY, bW, bH);
            }
            ctx.restore();
        }

        if (shadowStyle === 'soft') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = Math.round(size * 0.16);
            ctx.shadowOffsetY = 2;
        } else if (shadowStyle === 'deep') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
            ctx.shadowBlur = Math.round(size * 0.28);
            ctx.shadowOffsetY = 4;
        } else if (shadowStyle === 'glow') {
            ctx.shadowColor = options.glowColor || this.data[`${elementKey}Color`] || '#38bdf8';
            ctx.shadowBlur = Math.round(size * 0.35);
        }

        if (strokeWidth > 0 && strokeColor) {
            ctx.save();
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeColor;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
            ctx.restore();
        }

        ctx.fillStyle = options.color || this.data[`${elementKey}Color`] || '#ffffff';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    /* Universal Backdrop / Custom Background Image renderer across templates */
    drawPosterBackdrop(ctx, w, h) {
        const tImg = this.data.customTemplateImg;
        if (!tImg || this.data.showCustomBackground === false) return;

        ctx.save();
        const b = this.data.customTemplateBrightness !== undefined ? this.data.customTemplateBrightness : 100;
        const c = this.data.customTemplateContrast !== undefined ? this.data.customTemplateContrast : 100;
        const op = this.data.customTemplateOpacity !== undefined ? (this.data.customTemplateOpacity / 100) : 1;
        ctx.filter = `brightness(${b}%) contrast(${c}%)`;
        ctx.globalAlpha = Math.max(0, Math.min(1, op));

        const fit = this.data.customTemplateFit || 'cover';
        const xOff = this.data.customTemplateXOffset || 0;
        const yOff = this.data.customTemplateYOffset || 0;
        const scale = this.data.customTemplateScale || 1.0;

        let dx = 0, dy = 0, dw = w, dh = h;
        if (fit === 'stretch') {
            dw = w * scale;
            dh = h * scale;
            dx = (w - dw) / 2 + xOff;
            dy = (h - dh) / 2 + yOff;
            ctx.drawImage(tImg, dx, dy, dw, dh);
        } else if (fit === 'contain') {
            const s = Math.min(w / (tImg.naturalWidth || 1), h / (tImg.naturalHeight || 1)) * scale;
            dw = (tImg.naturalWidth || 1) * s;
            dh = (tImg.naturalHeight || 1) * s;
            dx = (w - dw) / 2 + xOff;
            dy = (h - dh) / 2 + yOff;
            ctx.drawImage(tImg, dx, dy, dw, dh);
        } else {
            // Cover
            const s = Math.max(w / (tImg.naturalWidth || 1), h / (tImg.naturalHeight || 1)) * scale;
            dw = (tImg.naturalWidth || 1) * s;
            dh = (tImg.naturalHeight || 1) * s;
            dx = (w - dw) / 2 + xOff;
            dy = (h - dh) / 2 + yOff;
            ctx.drawImage(tImg, dx, dy, dw, dh);
        }
        ctx.restore();

        // Color Tint overlay if enabled
        if (this.data.customTemplateTintAlpha > 0) {
            ctx.save();
            ctx.fillStyle = this.data.customTemplateTintColor || '#000000';
            ctx.globalAlpha = Math.max(0, Math.min(1, this.data.customTemplateTintAlpha / 100));
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        this.recordElementBox('background', 0, 0, w, h);
    }

    /* -------------------------------------------------------------------------
       MULTI-PHOTO LAYER SUPPORT
       Add multiple people/speakers, reposition, edit, and copy photo styles
       ------------------------------------------------------------------------- */
    addExtraPhoto(src, opts = {}) {
        const id = opts.id || ('extra_photo_' + Date.now());
        const photo = {
            id: id,
            img: null,
            src: src || '',
            x: opts.x !== undefined ? opts.x : (this.width / 2),
            y: opts.y !== undefined ? opts.y : (this.height * 0.45),
            size: opts.size || 300,
            shape: opts.shape || 'circle', // 'circle', 'rounded', 'square', 'cutout'
            borderWidth: opts.borderWidth !== undefined ? opts.borderWidth : 6,
            borderColor: opts.borderColor || '#ffffff',
            brightness: opts.brightness !== undefined ? opts.brightness : 100,
            contrast: opts.contrast !== undefined ? opts.contrast : 100,
            saturate: opts.saturate !== undefined ? opts.saturate : 100,
            opacity: opts.opacity !== undefined ? opts.opacity : 100,
            flipH: opts.flipH || false,
            shadow: opts.shadow !== undefined ? opts.shadow : true,
            label: opts.label || '',
            labelColor: opts.labelColor || '#ffffff',
            labelBg: opts.labelBg || '#0f172a',
            labelSize: opts.labelSize || 28,
            xOffset: opts.xOffset || 0,
            yOffset: opts.yOffset || 0
        };

        if (src) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                photo.img = img;
                this.render();
            };
            img.src = src;
        }

        if (!this.data.extraPhotos) this.data.extraPhotos = [];
        this.data.extraPhotos.push(photo);
        this.selectedElement = id;
        this.render();
        return photo;
    }

    removeExtraPhoto(id) {
        if (!this.data.extraPhotos) return;
        this.data.extraPhotos = this.data.extraPhotos.filter(p => p.id !== id);
        if (this.selectedElement === id) {
            this.selectedElement = null;
        }
        this.render();
    }

    getExtraPhoto(id) {
        return (this.data.extraPhotos || []).find(p => p.id === id);
    }

    copyPhotoEdits(fromSource, toTarget) {
        let srcData = {};
        if (fromSource === 'photo') {
            srcData = {
                shape: this.data.customTemplatePhotoShape || 'circle',
                borderWidth: this.data.photoBorderWidth !== undefined ? this.data.photoBorderWidth : 6,
                borderColor: this.data.photoBorderColor || '#ffffff',
                brightness: this.data.photoBrightness !== undefined ? this.data.photoBrightness : 100,
                contrast: this.data.photoContrast !== undefined ? this.data.photoContrast : 100,
                saturate: this.data.photoSaturate !== undefined ? this.data.photoSaturate : 100,
                opacity: 100,
                flipH: this.data.photoFlipH || false
            };
        } else {
            const p = this.getExtraPhoto(fromSource);
            if (!p) return false;
            srcData = {
                shape: p.shape || 'circle',
                borderWidth: p.borderWidth !== undefined ? p.borderWidth : 6,
                borderColor: p.borderColor || '#ffffff',
                brightness: p.brightness !== undefined ? p.brightness : 100,
                contrast: p.contrast !== undefined ? p.contrast : 100,
                saturate: p.saturate !== undefined ? p.saturate : 100,
                opacity: p.opacity !== undefined ? p.opacity : 100,
                flipH: p.flipH || false
            };
        }

        if (toTarget === 'photo') {
            this.data.customTemplatePhotoShape = srcData.shape;
            this.data.photoBrightness = srcData.brightness;
            this.data.photoContrast = srcData.contrast;
            this.data.photoSaturate = srcData.saturate;
            this.data.photoFlipH = srcData.flipH;
        } else {
            const targetP = this.getExtraPhoto(toTarget);
            if (!targetP) return false;
            targetP.shape = srcData.shape;
            targetP.borderWidth = srcData.borderWidth;
            targetP.borderColor = srcData.borderColor;
            targetP.brightness = srcData.brightness;
            targetP.contrast = srcData.contrast;
            targetP.saturate = srcData.saturate;
            targetP.opacity = srcData.opacity;
            targetP.flipH = srcData.flipH;
        }
        this.render();
        return true;
    }

    drawExtraPhotoItem(ctx, p, w, h) {
        const px = (p.x !== undefined ? p.x : (w / 2)) + (p.xOffset || 0);
        const py = (p.y !== undefined ? p.y : (h * 0.45)) + (p.yOffset || 0);
        const sz = p.size || 300;
        const radius = sz / 2;
        const op = Math.max(0, Math.min(1, (p.opacity !== undefined ? p.opacity : 100) / 100));

        ctx.save();
        ctx.globalAlpha = op;

        // Filter
        const br = p.brightness !== undefined ? p.brightness : 100;
        const ct = p.contrast !== undefined ? p.contrast : 100;
        const sat = p.saturate !== undefined ? p.saturate : 100;
        if (ctx.filter !== undefined) {
            ctx.filter = `contrast(${ct}%) brightness(${br}%) saturate(${sat}%)`;
        }

        // Optional shadow
        if (p.shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 6;
        }

        // Clipping & Image Draw
        ctx.save();
        ctx.beginPath();
        if (p.shape === 'circle') {
            ctx.arc(px, py, radius, 0, Math.PI * 2);
        } else if (p.shape === 'rounded') {
            const r = Math.round(sz * 0.14);
            if (ctx.roundRect) {
                ctx.roundRect(px - radius, py - radius, sz, sz, r);
            } else {
                ctx.rect(px - radius, py - radius, sz, sz);
            }
        } else if (p.shape === 'square') {
            ctx.rect(px - radius, py - radius, sz, sz);
        } else {
            // Cutout or unclipped
            ctx.rect(px - radius, py - radius, sz, sz);
        }
        ctx.clip();

        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
            if (p.flipH) {
                ctx.save();
                ctx.translate(px, py);
                ctx.scale(-1, 1);
                ctx.drawImage(p.img, -radius, -radius, sz, sz);
                ctx.restore();
            } else {
                ctx.drawImage(p.img, px - radius, py - radius, sz, sz);
            }
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px - radius, py - radius, sz, sz);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `bold ${Math.round(sz * 0.3)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', px, py);
        }
        ctx.restore(); // end clip

        // Border
        if (p.borderWidth && p.borderWidth > 0 && p.borderColor) {
            ctx.lineWidth = p.borderWidth;
            ctx.strokeStyle = p.borderColor;
            ctx.beginPath();
            if (p.shape === 'circle') {
                ctx.arc(px, py, radius, 0, Math.PI * 2);
            } else if (p.shape === 'rounded') {
                const r = Math.round(sz * 0.14);
                if (ctx.roundRect) {
                    ctx.roundRect(px - radius, py - radius, sz, sz, r);
                } else {
                    ctx.rect(px - radius, py - radius, sz, sz);
                }
            } else if (p.shape === 'square') {
                ctx.rect(px - radius, py - radius, sz, sz);
            }
            ctx.stroke();
        }

        // Name / Role Label Pill under photo
        let labelH = 0;
        if (p.label && p.label.trim()) {
            const lSize = p.labelSize || 28;
            ctx.font = `800 ${lSize}px "Plus Jakarta Sans", sans-serif`;
            const metrics = ctx.measureText(p.label);
            const pillW = metrics.width + 36;
            const pillH = lSize * 1.5;
            const pillX = px - pillW / 2;
            const pillY = py + radius + 10;
            labelH = pillH + 12;

            ctx.fillStyle = p.labelBg || '#0f172a';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(pillX, pillY, pillW, pillH, 10);
            } else {
                ctx.rect(pillX, pillY, pillW, pillH);
            }
            ctx.fill();

            if (p.borderWidth && p.borderWidth > 0 && p.borderColor) {
                ctx.strokeStyle = p.borderColor;
                ctx.lineWidth = Math.min(3, p.borderWidth);
                ctx.stroke();
            }

            ctx.fillStyle = p.labelColor || '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, px, pillY + pillH / 2);
        }

        ctx.restore();

        // Record hit box
        this.recordElementBox(p.id, px - radius, py - radius, sz, sz + labelH);
    }

    render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        ctx.clearRect(0, 0, w, h);
        this.elementBoxes = {};

        switch (this.template) {
            // Authentic Campus Series (From Real Winning Election Materials)
            case 'presidential_landmark':
                this.renderPresidentialLandmark(ctx, w, h);
                break;
            case 'diagonal_wave_grc':
                this.renderDiagonalWaveGRC(ctx, w, h);
                break;
            case 'goodwill_greeting':
                this.renderGoodwillGreeting(ctx, w, h);
                break;
            case 'asymmetric_card':
                this.renderAsymmetricCard(ctx, w, h);
                break;
            case 'speaker_gradient':
                this.renderSpeakerGradient(ctx, w, h);
                break;

            // Design Studio Classics
            case 'executive':
                this.renderExecutive(ctx, w, h);
                break;
            case 'rally':
                this.renderRally(ctx, w, h);
                break;
            case 'manifesto':
                this.renderManifesto(ctx, w, h);
                break;
            case 'endorsement':
                this.renderEndorsement(ctx, w, h);
                break;
            case 'bold_minimal':
                this.renderBoldMinimal(ctx, w, h);
                break;
            case 'neon_pulse':
                this.renderNeonPulse(ctx, w, h);
                break;
            case 'varsity_prestige':
                this.renderVarsityPrestige(ctx, w, h);
                break;
            case 'grassroots_unity':
                this.renderGrassrootsUnity(ctx, w, h);
                break;
            case 'future_forward':
                this.renderFutureForward(ctx, w, h);
                break;
            case 'custom_template':
                this.renderCustomTemplate(ctx, w, h);
                break;
            default:
                this.renderExecutive(ctx, w, h);
        }

        // Universal Elements: If badges were not drawn by the current template, draw them now if visible/uploaded!
        if (!this.elementBoxes['badge1'] && this.data.badge1Visible !== false && (this.data.badge1Img || this.data.showBadges !== false)) {
            this.drawInstitutionalBadge1(ctx, 110, 110, 52, "");
        }

        if (!this.elementBoxes['badge2'] && this.data.badge2Visible !== false && (this.data.badge2Img || this.data.associationAcronym || this.data.showBadges !== false)) {
            this.drawInstitutionalBadge2(ctx, w - 110, 110, 52, this.data.associationAcronym || "");
        }

        // Universal Landmark Graphic / Watermark
        if (!this.elementBoxes['landmark'] && this.data.landmarkVisible !== false && (this.data.landmarkImg || this.data.showWatermark !== false)) {
            this.drawIvoryTowerWatermark(ctx, w * 0.5, h * 0.38, (this.data.landmarkScale || 1.0) * w * 0.0009, (this.data.landmarkOpacity !== undefined ? this.data.landmarkOpacity : 15) / 100);
        }

        // Universal Script Calligraphy Accent if provided and not yet drawn
        if (!this.elementBoxes['script'] && this.data.greetingScript && this.data.greetingScript.trim()) {
            const scriptSize = this.data.scriptFontSize || 85;
            const scriptX = (w * 0.5) + (this.data.scriptXOffset || 0);
            const scriptY = (h * 0.68) + (this.data.scriptYOffset || 0);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `italic ${scriptSize}px "Alex Brush", cursive`;
            ctx.fillStyle = this.data.scriptColor || '#ffffff';
            ctx.fillText(this.data.greetingScript, scriptX, scriptY);
            this.recordElementBox('script', scriptX - w * 0.35, scriptY - scriptSize, w * 0.7, scriptSize * 1.2);
            ctx.restore();
        }

        // Universal Hollow Outline Title if provided and not yet drawn
        if (!this.elementBoxes['title'] && this.data.greetingTitle && this.data.greetingTitle.trim()) {
            const titleSize = this.data.titleFontSize || 95;
            const titleX = (w * 0.5) + (this.data.titleXOffset || 0);
            const titleY = (h * 0.75) + (this.data.titleYOffset || 0);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `900 ${titleSize}px "Montserrat", sans-serif`;
            ctx.letterSpacing = '6px';
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.data.titleColor || '#ffffff';
            ctx.strokeText(this.data.greetingTitle.toUpperCase(), titleX, titleY);
            ctx.letterSpacing = '0px';
            this.recordElementBox('title', titleX - w * 0.4, titleY - titleSize, w * 0.8, titleSize * 1.2);
            ctx.restore();
        }

        // Universal Slogan / Statement if provided and not yet drawn by template
        if (!this.elementBoxes['slogan'] && this.data.slogan && this.data.slogan.trim() && this.data.customTemplateShowSlogan !== false) {
            const slogSize = this.data.sloganFontSize || 36;
            const sx = (w * 0.5) + (this.data.sloganXOffset || 0);
            const sy = (h * 0.90) + (this.data.sloganYOffset || 0);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `bold italic ${slogSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = this.data.sloganColor || this.data.secondaryColor || '#fbbf24';
            this.wrapText(ctx, `“${this.data.slogan}”`, sx, sy, w * 0.85, Math.round(slogSize * 1.3));
            this.recordElementBox('slogan', sx - w * 0.42, sy - slogSize, w * 0.84, slogSize * 2.2);
            ctx.restore();
        }

        // Render Custom Ribbons / Banner Patches (Underneath text, on top of template)
        if (this.data.customRibbons && Array.isArray(this.data.customRibbons)) {
            this.data.customRibbons.forEach(item => {
                const rx = (item.x || (w / 2)) + (item.xOffset || 0);
                const ry = (item.y || (h / 2)) + (item.yOffset || 0);
                const rw = item.w || 600;
                const rh = item.h || 100;
                const radius = item.borderRadius !== undefined ? item.borderRadius : 16;
                const op = item.opacity !== undefined ? Math.max(0, Math.min(1, item.opacity / 100)) : 1;

                ctx.save();
                ctx.globalAlpha = op;
                ctx.fillStyle = item.color || '#1e3a8a';

                const startX = item.isCentered !== false ? Math.round(rx - rw / 2) : Math.round(rx);
                const startY = item.isCentered !== false ? Math.round(ry - rh / 2) : Math.round(ry);

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(startX, startY, rw, rh, radius);
                } else {
                    ctx.rect(startX, startY, rw, rh);
                }
                ctx.fill();

                if (item.borderWidth && item.borderWidth > 0 && item.borderColor) {
                    ctx.lineWidth = item.borderWidth;
                    ctx.strokeStyle = item.borderColor;
                    ctx.stroke();
                }

                ctx.restore();
                this.recordElementBox(item.id, startX, startY, rw, rh);
            });
        }

        // Render Extra Photo Layers (Multiple Speakers / Candidates / Guests)
        if (this.data.extraPhotos && Array.isArray(this.data.extraPhotos)) {
            this.data.extraPhotos.forEach(p => {
                this.drawExtraPhotoItem(ctx, p, w, h);
            });
        }

        // Render any Custom Added Text Elements on Top of Poster
        if (this.data.customTexts && Array.isArray(this.data.customTexts)) {
            this.data.customTexts.forEach(item => {
                const tx = (item.x || (w / 2)) + (item.xOffset || 0);
                const ty = (item.y || (h / 2)) + (item.yOffset || 0);
                const size = item.fontSize || 54;
                const fontFamily = item.fontFamily || 'Plus Jakarta Sans';
                const fontWeight = item.fontWeight || '800';
                const fontStyle = item.fontStyle === 'italic' ? 'italic' : 'normal';
                let rawText = item.text || '';
                if (item.textTransform === 'uppercase') {
                    rawText = rawText.toUpperCase();
                } else if (item.textTransform === 'lowercase') {
                    rawText = rawText.toLowerCase();
                }

                const lines = String(rawText).split('\n');
                const lineHeight = size * 1.22;

                ctx.save();
                ctx.font = `${fontStyle === 'italic' ? 'italic ' : ''}${fontWeight} ${size}px "${fontFamily}", sans-serif`;

                const align = item.align || (item.isCentered !== false ? 'center' : 'left');
                ctx.textAlign = align;
                ctx.textBaseline = 'middle';

                // Calculate maximum line width for bounding box and background badges
                let maxLineWidth = 0;
                lines.forEach(line => {
                    const m = ctx.measureText(line);
                    if (m.width > maxLineWidth) maxLineWidth = m.width;
                });

                const totalHeight = lines.length * lineHeight;
                const startY = ty - ((lines.length - 1) * lineHeight / 2);

                // Background Badge Pill / Highlight Box if selected
                if (item.bgBadge && item.bgBadge !== 'none') {
                    ctx.save();
                    const padX = Math.max(16, size * 0.4);
                    const padY = Math.max(10, size * 0.25);
                    const badgeW = maxLineWidth + (padX * 2);
                    const badgeH = totalHeight + (padY * 2);
                    let badgeX = tx - (badgeW / 2);
                    if (align === 'left') badgeX = tx - padX;
                    else if (align === 'right') badgeX = tx - maxLineWidth - padX;
                    const badgeY = startY - (lineHeight / 2) - padY;

                    if (item.bgBadge === 'dark') {
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
                    } else if (item.bgBadge === 'light') {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    } else if (item.bgBadge === 'accent') {
                        ctx.fillStyle = this.data.primaryColor || '#4f46e5';
                    } else if (item.bgBadge === 'danger') {
                        ctx.fillStyle = '#dc2626';
                    } else if (item.bgBadge === 'gold') {
                        ctx.fillStyle = '#d97706';
                    }

                    // Rounded badge
                    const rad = Math.min(16, badgeH / 2);
                    if (ctx.roundRect) {
                        ctx.beginPath();
                        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, rad);
                        ctx.fill();
                    } else {
                        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
                    }
                    ctx.restore();
                }

                // Shadow & Glow Styles
                const shadow = item.shadowStyle || 'soft';
                const c = (item.color || '#ffffff').toLowerCase();
                const isWhite = c === '#ffffff' || c === '#fff';

                if (shadow === 'soft') {
                    ctx.shadowColor = isWhite ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.5)';
                    ctx.shadowBlur = Math.round(size * 0.16);
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 2;
                } else if (shadow === 'deep') {
                    ctx.shadowColor = isWhite ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = Math.round(size * 0.28);
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 4;
                } else if (shadow === 'glow') {
                    ctx.shadowColor = item.color || '#38bdf8';
                    ctx.shadowBlur = Math.round(size * 0.35);
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }

                lines.forEach((line, idx) => {
                    const lineY = startY + (idx * lineHeight);

                    // Stroke / Text Outline (High readability against noisy backgrounds)
                    if (item.strokeWidth && item.strokeWidth > 0 && item.strokeColor) {
                        ctx.save();
                        ctx.lineWidth = item.strokeWidth;
                        ctx.strokeStyle = item.strokeColor;
                        ctx.lineJoin = 'round';
                        ctx.miterLimit = 2;
                        ctx.strokeText(line, tx, lineY);
                        ctx.restore();
                    }

                    ctx.fillStyle = item.color || '#ffffff';
                    ctx.fillText(line, tx, lineY);
                });

                // Record Element Box for dragging and selection
                let boxLeft = tx - (maxLineWidth / 2);
                if (align === 'left') boxLeft = tx;
                else if (align === 'right') boxLeft = tx - maxLineWidth;
                const boxTop = startY - (lineHeight / 2);
                this.recordElementBox(item.id, boxLeft - 10, boxTop - 6, maxLineWidth + 20, totalHeight + 12);

                ctx.restore();
            });
        }

        if (this.selectedElement && this.elementBoxes && this.elementBoxes[this.selectedElement]) {
            this.drawSelectionOutline(ctx);
        }

        // Non-Destructive Active Boundary Frame & Unwanted Region Dimming
        this.drawBoundaryOverlay(ctx, w, h);
    }

    /* -------------------------------------------------------------------------
       POSTER BOUNDARY & CROP TOOL
       Eliminate unwanted margins/footers and crop to standard social formats
       ------------------------------------------------------------------------- */
    drawBoundaryOverlay(ctx, w, h) {
        if (!this.data.showBoundaries) return;
        const inTop = Math.max(0, this.data.boundaryInsetTop || 0);
        const inBottom = Math.max(0, this.data.boundaryInsetBottom || 0);
        const inLeft = Math.max(0, this.data.boundaryInsetLeft || 0);
        const inRight = Math.max(0, this.data.boundaryInsetRight || 0);

        if (inTop === 0 && inBottom === 0 && inLeft === 0 && inRight === 0) return;

        const cropX = inLeft;
        const cropY = inTop;
        const cropW = Math.max(20, w - inLeft - inRight);
        const cropH = Math.max(20, h - inTop - inBottom);

        ctx.save();

        // 1. Darken and dim unwanted regions outside the active boundary
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        if (cropY > 0) ctx.fillRect(0, 0, w, cropY);
        if (cropY + cropH < h) ctx.fillRect(0, cropY + cropH, w, h - (cropY + cropH));
        if (cropX > 0) ctx.fillRect(0, cropY, cropX, cropH);
        if (cropX + cropW < w) ctx.fillRect(cropX + cropW, cropY, w - (cropX + cropW), cropH);

        // 2. Active Frame Border with glowing cyan dashed accent
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 6]);
        ctx.strokeRect(cropX, cropY, cropW, cropH);
        ctx.setLineDash([]);

        // 3. Bold Corner Crop Marks (L-brackets)
        const markLen = Math.min(36, Math.min(cropW, cropH) * 0.2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(cropX, cropY + markLen); ctx.lineTo(cropX, cropY); ctx.lineTo(cropX + markLen, cropY);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(cropX + cropW - markLen, cropY); ctx.lineTo(cropX + cropW, cropY); ctx.lineTo(cropX + cropW, cropY + markLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(cropX, cropY + cropH - markLen); ctx.lineTo(cropX, cropY + cropH); ctx.lineTo(cropX + markLen, cropY + cropH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(cropX + cropW - markLen, cropY + cropH); ctx.lineTo(cropX + cropW, cropY + cropH); ctx.lineTo(cropX + cropW, cropY + cropH - markLen);
        ctx.stroke();

        // 4. Optional Rule-of-Thirds Grid inside active boundary
        if (this.data.boundaryRuleOfThirds) {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cropX + cropW / 3, cropY); ctx.lineTo(cropX + cropW / 3, cropY + cropH);
            ctx.moveTo(cropX + (cropW * 2) / 3, cropY); ctx.lineTo(cropX + (cropW * 2) / 3, cropY + cropH);
            ctx.moveTo(cropX, cropY + cropH / 3); ctx.lineTo(cropX + cropW, cropY + cropH / 3);
            ctx.moveTo(cropX, cropY + (cropH * 2) / 3); ctx.lineTo(cropX + cropW, cropY + (cropH * 2) / 3);
            ctx.stroke();
        }

        // 5. Active Format Pill Badge
        const tagText = `ACTIVE BOUNDARY: ${cropW} × ${cropH} px (${(cropW / cropH).toFixed(2)})`;
        ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
        const metrics = ctx.measureText(tagText);
        const tagPadX = 14;
        const tagH = 34;
        const tagX = Math.max(10, Math.min(w - metrics.width - tagPadX * 2 - 10, cropX + 10));
        const tagY = Math.max(10, cropY + 10);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(tagX, tagY, metrics.width + tagPadX * 2, tagH, 8);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(tagX, tagY, metrics.width + tagPadX * 2, tagH);
            ctx.strokeRect(tagX, tagY, metrics.width + tagPadX * 2, tagH);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(tagText, tagX + tagPadX, tagY + tagH / 2);

        ctx.restore();
    }

    recordElementBox(name, x, y, w, h) {
        if (!this.elementBoxes) this.elementBoxes = {};
        this.elementBoxes[name] = { x, y, w, h };
    }

    getElementAt(canvasX, canvasY) {
        if (!this.elementBoxes) return null;
        // Priority order: custom texts first, then standard text elements, then custom ribbons, then badges/photo
        if (this.data.customTexts) {
            for (let i = this.data.customTexts.length - 1; i >= 0; i--) {
                const id = this.data.customTexts[i].id;
                const b = this.elementBoxes[id];
                if (b && canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
                    return id;
                }
            }
        }
        if (this.data.extraPhotos) {
            for (let i = this.data.extraPhotos.length - 1; i >= 0; i--) {
                const id = this.data.extraPhotos[i].id;
                const b = this.elementBoxes[id];
                if (b && canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
                    return id;
                }
            }
        }
        const textKeys = ['name', 'position', 'slogan', 'script', 'title', 'quote', 'tagline'];
        for (const k of textKeys) {
            const b = this.elementBoxes[k];
            if (b && canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
                return k;
            }
        }
        if (this.data.customRibbons) {
            for (let i = this.data.customRibbons.length - 1; i >= 0; i--) {
                const id = this.data.customRibbons[i].id;
                const b = this.elementBoxes[id];
                if (b && canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
                    return id;
                }
            }
        }
        if (this.elementBoxes['vote_pill']) {
            const b = this.elementBoxes['vote_pill'];
            if (canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
                return 'vote_pill';
            }
        }
        for (const bk of ['badge1', 'badge2']) {
            const b = this.elementBoxes[bk];
            if (b && canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h) {
                return bk;
            }
        }
        const p = this.elementBoxes['photo'];
        if (p && canvasX >= p.x && canvasX <= p.x + p.w && canvasY >= p.y && canvasY <= p.y + p.h) {
            return 'photo';
        }
        const r = this.elementBoxes['ribbon'];
        if (r && canvasX >= r.x && canvasX <= r.x + r.w && canvasY >= r.y && canvasY <= r.y + r.h) {
            return 'ribbon';
        }
        const m = this.elementBoxes['mask'];
        if (m && canvasX >= m.x && canvasX <= m.x + m.w && canvasY >= m.y && canvasY <= m.y + m.h) {
            return 'mask';
        }
        const lm = this.elementBoxes['landmark'];
        if (lm && canvasX >= lm.x && canvasX <= lm.x + lm.w && canvasY >= lm.y && canvasY <= lm.y + lm.h) {
            return 'landmark';
        }
        const bg = this.elementBoxes['background'];
        if (bg && canvasX >= bg.x && canvasX <= bg.x + bg.w && canvasY >= bg.y && canvasY <= bg.y + bg.h) {
            return 'background';
        }
        return null;
    }

    drawSelectionOutline(ctx) {
        const box = this.elementBoxes[this.selectedElement];
        if (!box) return;
        ctx.save();
        ctx.strokeStyle = '#4f46e5'; // Indigo selection
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        if (this.selectedElement === 'background') {
            ctx.strokeRect(8, 8, box.w - 16, box.h - 16);
        } else {
            ctx.strokeRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
        }
        
        // 4 corner grab dots
        ctx.fillStyle = '#4f46e5';
        const corners = this.selectedElement === 'background' ? [
            [12, 12],
            [box.w - 12, 12],
            [12, box.h - 12],
            [box.w - 12, box.h - 12]
        ] : [
            [box.x - 6, box.y - 6],
            [box.x + box.w + 6, box.y - 6],
            [box.x - 6, box.y + box.h + 6],
            [box.x + box.w + 6, box.y + box.h + 6]
        ];
        for (const [cx, cy] of corners) {
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /* -------------------------------------------------------------
       TEMPLATE 1: EXECUTIVE AUTHORITY (Presidential, Sleek, Formal)
       ------------------------------------------------------------- */
    renderExecutive(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e3a8a';
        const sColor = this.data.secondaryColor || '#f59e0b';

        // 1. Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.4, '#0f172a');
        bgGrad.addColorStop(1, pColor);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Subtle Geometric Grid / Accents
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 3;
        for (let x = 0; x < w; x += 120) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Gold / Accent Top Banner
        ctx.fillStyle = sColor;
        ctx.fillRect(0, 0, w, 24);

        // 4. Header Tagline / Campus Name
        if (this.data.tagline && this.data.customTemplateShowTagline !== false) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '4px';
            const tagX = 100 + (this.data.taglineXOffset || 0);
            const tagY = 110 + (this.data.taglineYOffset || 0);
            const tagText = this.data.tagline.toUpperCase();
            ctx.fillText(tagText, tagX, tagY);
            const tagMetrics = ctx.measureText(tagText);
            this.recordElementBox('tagline', tagX, tagY - 30, tagMetrics.width, 40);
        }

        // Alliance Tag
        if (this.data.alliance) {
            ctx.fillStyle = sColor;
            ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(this.data.alliance.toUpperCase(), w - 100, 110);
            ctx.textAlign = 'left';
        }

        // 5. Candidate Portrait
        const photo = this.data.photoImg;
        const photoY = this.format === '9:16' ? 240 : 200;
        const photoH = this.format === '9:16' ? h * 0.52 : h * 0.55;

        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            // Subtle portrait glow
            const radGrad = ctx.createRadialGradient(w / 2, photoY + photoH / 2, 100, w / 2, photoY + photoH / 2, w / 2);
            radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
            radGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = radGrad;
            ctx.fillRect(0, photoY, w, photoH + 200);

            // Draw Photo
            this.drawContainedImage(ctx, photo, 80, photoY, w - 160, photoH, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', 80, photoY, w - 160, photoH);
        }

        // 6. Solid Bottom Content Card (Adjustable, Resizable & Deletable)
        const baseBottomY = photoY + photoH - 80;
        let bottomCardY = baseBottomY;
        let cardX = 0;
        let cardY = baseBottomY;
        let cardW = w;
        let cardH = h - baseBottomY;

        if (this.data.showTemplateRibbon !== false) {
            const rxOffset = this.data.templateRibbonXOffset || 0;
            const ryOffset = this.data.templateRibbonYOffset || 0;
            const rwOffset = this.data.templateRibbonWidthOffset || 0;
            const rhOffset = this.data.templateRibbonHeightOffset || 0;

            cardX = Math.max(0, -rwOffset / 2 + rxOffset);
            cardY = baseBottomY + ryOffset;
            cardW = Math.max(100, Math.min(w * 1.5, w + rwOffset));
            cardH = Math.max(40, Math.min(h, (h - baseBottomY) + rhOffset));
            bottomCardY = cardY;

            // Soft lighting/fade strictly anchored to the bottom ribbon card (cardY), NOT in the middle of candidate photo
            if (this.data.showRibbonFade !== false) {
                const fadeH = Math.max(0, Math.min(150, this.data.ribbonFadeHeight !== undefined ? this.data.ribbonFadeHeight : 45));
                if (fadeH > 0) {
                    const fadeGrad = ctx.createLinearGradient(0, cardY - fadeH, 0, cardY);
                    fadeGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
                    fadeGrad.addColorStop(1, this.data.cardBgColor || '#0f172a');
                    ctx.fillStyle = fadeGrad;
                    ctx.fillRect(cardX, cardY - fadeH, cardW, fadeH + 2);
                }
            }

            ctx.save();
            ctx.fillStyle = this.data.cardBgColor || '#0f172a';
            ctx.fillRect(cardX, cardY, cardW, cardH);

            // 7. Gold Divider Bar
            ctx.fillStyle = sColor;
            ctx.fillRect(cardX + 100, cardY, 180, 10);
            ctx.restore();

            this.recordElementBox('ribbon', cardX, cardY, cardW, cardH);
        } else {
            bottomCardY = photoY + photoH - 40;
        }

        // 8. Candidate Name
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameX = 100 + (this.data.nameXOffset || 0);
            const nameY = bottomCardY + 110 + (this.data.nameYOffset || 0);
            const nameSize = this.data.nameFontSize || 96;
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.font = `800 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
            const nText = this.data.candidateName.toUpperCase();
            ctx.fillText(nText, nameX, nameY);
            const nMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX, nameY - (nameSize * 0.8), nMetrics.width + 20, nameSize * 1.1);
        }

        // 10. Office / Position Tag
        if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posX = 100 + (this.data.positionXOffset || 0);
            const posY = bottomCardY + 180 + (this.data.positionYOffset || 0);
            const posSize = this.data.positionFontSize || 44;
            ctx.fillStyle = this.data.positionColor || sColor;
            ctx.font = `bold ${posSize}px "Plus Jakarta Sans", sans-serif`;
            const posText = this.data.position.toUpperCase();
            ctx.fillText(posText, posX, posY);
            const pMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX, posY - (posSize * 0.8), pMetrics.width + 20, posSize * 1.2);
        }

        // 11. Faculty / Hall Sub-badge
        if (this.data.facultyOrHall) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 34px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(`• ${this.data.facultyOrHall}`, 100, bottomCardY + 235);
        }

        // 12. Campaign Slogan in Quotation Box
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan && this.data.slogan.trim()) {
            const slogX = 100 + (this.data.sloganXOffset || 0);
            const sloganY = bottomCardY + 310 + (this.data.sloganYOffset || 0);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(slogX, sloganY, w - 200, 140, 20);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            const sloganSize = this.data.sloganFontSize || 36;
            ctx.fillStyle = this.data.sloganColor || '#f8fafc';
            ctx.font = `italic 600 ${sloganSize}px "Plus Jakarta Sans", sans-serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX + 30, sloganY + 55, w - 260, Math.round(sloganSize * 1.25));
            this.recordElementBox('slogan', slogX, sloganY, w - 200, 140);
        }

        // 13. Footer Strip
        const footerText = (this.data.footerTagline || this.data.tagline || '').trim();
        if (footerText) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, h - 80, w, 80);
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(footerText.toUpperCase(), 100, h - 30);
        }
    }

    /* -------------------------------------------------------------
       TEMPLATE 2: DYNAMIC YOUTH RALLY (High Energy, Modern Diagonal)
       ------------------------------------------------------------- */
    renderRally(ctx, w, h) {
        const pColor = this.data.primaryColor || '#dc2626'; // Energetic Crimson or Blue
        const sColor = this.data.secondaryColor || '#fbbf24';

        // 1. Dark Base
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. High-Voltage Diagonal Slash
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, h * 0.35);
        ctx.lineTo(w, h * 0.15);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = pColor;
        ctx.fill();

        // Secondary Accent Slash
        ctx.beginPath();
        ctx.moveTo(0, h * 0.35);
        ctx.lineTo(w, h * 0.15);
        ctx.lineTo(w, h * 0.18);
        ctx.lineTo(0, h * 0.38);
        ctx.closePath();
        ctx.fillStyle = sColor;
        ctx.fill();
        ctx.restore();

        // 3. Candidate Portrait
        const photo = this.data.photoImg;
        if (photo) {
            ctx.save();
            this.drawContainedImage(ctx, photo, 60, 160, w - 120, h * 0.58, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', 60, 160, w - 120, h * 0.58);
        }

        // 4. Big Stamp Headline
        ctx.save();
        const titleSize = this.data.titleFontSize || 68;
        const titleX = 80 + (this.data.titleXOffset || 0);
        const titleY = 110 + (this.data.titleYOffset || 0);
        ctx.fillStyle = this.data.titleColor || '#ffffff';
        ctx.font = `900 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.letterSpacing = '6px';
        const rallyTitle = (this.data.greetingTitle || 'GRAND CAMPAIGN RALLY').toUpperCase();
        ctx.fillText(rallyTitle, titleX, titleY);
        ctx.restore();
        this.recordElementBox('title', titleX, titleY - titleSize * 0.8, w - 160, titleSize * 1.2);

        // 5. Rally Date & Venue Banner (High Contrast Card / Ribbon)
        const baseBannerY = (h * 0.68);
        let bannerY = baseBannerY + (this.data.sloganYOffset || 0);
        let bannerX = 80 + (this.data.sloganXOffset || 0);
        let bannerW = w - 160;
        let bannerH = 180;

        if (this.data.showTemplateRibbon !== false) {
            const rxOffset = this.data.templateRibbonXOffset || 0;
            const ryOffset = this.data.templateRibbonYOffset || 0;
            const rwOffset = this.data.templateRibbonWidthOffset || 0;
            const rhOffset = this.data.templateRibbonHeightOffset || 0;

            bannerX = Math.max(0, 80 - rwOffset / 2 + rxOffset + (this.data.sloganXOffset || 0));
            bannerY = baseBannerY + (this.data.sloganYOffset || 0) + ryOffset;
            bannerW = Math.max(100, Math.min(w, w - 160 + rwOffset));
            bannerH = Math.max(40, Math.min(600, 180 + rhOffset));

            ctx.save();
            ctx.fillStyle = this.data.cardBgColor || '#0f172a';
            ctx.beginPath();
            ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 24);
            ctx.fill();
            ctx.strokeStyle = this.data.bannerColor || sColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();

            this.recordElementBox('ribbon', bannerX, bannerY, bannerW, bannerH);
        }

        if (this.data.customTemplateShowSlogan !== false) {
            const sloganSize = this.data.sloganFontSize || 36;
            let currentLineY = bannerY + 65;
            if (this.data.rallyDate && this.data.rallyDate.trim()) {
                ctx.fillStyle = this.data.secondaryNameColor || sColor;
                ctx.font = `bold ${sloganSize}px "Plus Jakarta Sans", sans-serif`;
                ctx.fillText('DATE: ' + this.data.rallyDate.trim(), bannerX + 40, currentLineY);
                currentLineY += 65;
            }
            const venueOrSlogan = (this.data.rallyVenue || this.data.slogan || '').trim();
            if (venueOrSlogan) {
                ctx.fillStyle = this.data.sloganColor || '#ffffff';
                ctx.font = `bold ${Math.round(sloganSize * 1.1)}px "Plus Jakarta Sans", sans-serif`;
                ctx.fillText(this.data.rallyVenue ? 'VENUE: ' + this.data.rallyVenue : venueOrSlogan.toUpperCase(), bannerX + 40, currentLineY);
            }
            if (this.data.rallyDate || venueOrSlogan) {
                this.recordElementBox('slogan', bannerX, bannerY, bannerW, bannerH);
            }
        }

        // 6. Big Candidate Name Over Banner
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameSize = this.data.nameFontSize || 100;
            const nameX = 80 + (this.data.nameXOffset || 0);
            const nameY = bannerY + bannerH + 100 + (this.data.nameYOffset || 0);
            const nText = this.applyTextTransform('name', this.data.candidateName);
            this.drawStyledText(ctx, 'name', nText, nameX, nameY, {
                size: nameSize,
                align: 'left',
                color: this.data.nameColor || '#ffffff',
                baseline: 'alphabetic'
            });
            ctx.save();
            ctx.font = this.getFontString('name', nameSize, 'Plus Jakarta Sans', '900');
            const nMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX, nameY - nameSize * 0.8, nMetrics.width + 20, nameSize * 1.1);
            ctx.restore();

            if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
                const posSize = this.data.positionFontSize || 48;
                const posX = 80 + (this.data.positionXOffset || 0);
                const posY = nameY + 65 + (this.data.positionYOffset || 0);
                const posText = this.applyTextTransform('position', this.data.position);
                this.drawStyledText(ctx, 'position', posText, posX, posY, {
                    size: posSize,
                    align: 'left',
                    color: this.data.positionColor || sColor,
                    baseline: 'alphabetic'
                });
                ctx.save();
                ctx.font = this.getFontString('position', posSize, 'Plus Jakarta Sans', '800');
                const pMetrics = ctx.measureText(posText);
                this.recordElementBox('position', posX, posY - posSize * 0.8, pMetrics.width + 20, posSize * 1.2);
                ctx.restore();
            }
        } else if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posSize = this.data.positionFontSize || 48;
            const posX = 80 + (this.data.positionXOffset || 0);
            const posY = bannerY + bannerH + 80 + (this.data.positionYOffset || 0);
            const posText = this.applyTextTransform('position', this.data.position);
            this.drawStyledText(ctx, 'position', posText, posX, posY, {
                size: posSize,
                align: 'left',
                color: this.data.positionColor || sColor,
                baseline: 'alphabetic'
            });
            ctx.save();
            ctx.font = this.getFontString('position', posSize, 'Plus Jakarta Sans', '800');
            const pMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX, posY - posSize * 0.8, pMetrics.width + 20, posSize * 1.2);
            ctx.restore();
        }
    }

    /* -------------------------------------------------------------
       TEMPLATE 3: MANIFESTO PILLARS (Clean Policy Agenda Promises)
       ------------------------------------------------------------- */
    renderManifesto(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e3a8a';
        const sColor = this.data.secondaryColor || '#f59e0b';

        // Light & Crisp Executive Theme
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // Top Brand Header Strip
        ctx.fillStyle = pColor;
        ctx.fillRect(0, 0, w, 280);

        // Candidate Photo Circular / Rounded Card (Left side)
        const photo = this.data.photoImg;
        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(100, 120, 500, 580, 32);
            ctx.clip();
            this.drawContainedImage(ctx, photo, 100, 120, 500, 580, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset);
            ctx.restore();

            // Border around portrait
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.roundRect(100, 120, 500, 580, 32);
            ctx.stroke();
            this.recordElementBox('photo', 100, 120, 500, 580);
        }

        // Header Text beside Photo
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameSize = this.data.nameFontSize || 64;
            const nameX = 640 + (this.data.nameXOffset || 0);
            const nameY = 180 + (this.data.nameYOffset || 0);
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.font = `800 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
            const nText = this.data.candidateName.toUpperCase();
            ctx.fillText(nText, nameX, nameY);
            const nMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX, nameY - nameSize * 0.8, nMetrics.width + 20, nameSize * 1.2);
        }

        if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posSize = this.data.positionFontSize || 36;
            const posX = 640 + (this.data.positionXOffset || 0);
            const posY = 180 + (this.data.nameYOffset || 0) + 60 + (this.data.positionYOffset || 0);
            ctx.fillStyle = this.data.positionColor || sColor;
            ctx.font = `bold ${posSize}px "Plus Jakarta Sans", sans-serif`;
            const posText = this.data.position.toUpperCase();
            ctx.fillText(posText, posX, posY);
            const pMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX, posY - posSize * 0.8, pMetrics.width + 20, posSize * 1.2);
        }

        // Slogan
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan && this.data.slogan.trim()) {
            const sloganSize = this.data.sloganFontSize || 36;
            const slogX = 640 + (this.data.sloganXOffset || 0);
            const slogY = 180 + (this.data.nameYOffset || 0) + 140 + (this.data.sloganYOffset || 0);
            ctx.fillStyle = this.data.sloganColor || '#1e293b';
            ctx.font = `italic 600 ${sloganSize}px "Plus Jakarta Sans", sans-serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX, slogY, w - slogX - 60, Math.round(sloganSize * 1.3));
            this.recordElementBox('slogan', slogX, slogY - sloganSize * 0.8, w - slogX - 40, sloganSize * 3);
        }

        // Section Title: OUR 3 CORE PROMISES
        const pillarsY = 740;
        const titleSize = this.data.titleFontSize || 48;
        const titleX = 100 + (this.data.titleXOffset || 0);
        const titleY = pillarsY + (this.data.titleYOffset || 0);
        ctx.fillStyle = this.data.titleColor || pColor;
        ctx.font = `900 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
        const pTitle = (this.data.greetingTitle || 'OUR CORE MANIFESTO PILLARS').toUpperCase();
        ctx.fillText(pTitle, titleX, titleY);
        this.recordElementBox('title', titleX, titleY - titleSize * 0.8, w - 200, titleSize * 1.2);

        ctx.fillStyle = this.data.bannerColor || sColor;
        ctx.fillRect(titleX, titleY + 16, 240, 6);

        // Render 3 Pillars as Rich Cards
        const pillars = this.data.manifestoList.slice(0, 3);
        let cardY = pillarsY + 60;
        pillars.forEach((pillar, idx) => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(100, cardY, w - 200, 160, 24);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Number Stamp Circle
            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(180, cardY + 80, 48, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((idx + 1).toString(), 180, cardY + 95);
            ctx.textAlign = 'left';

            // Pillar Text
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
            this.wrapText(ctx, pillar, 260, cardY + 70, w - 400, 44);

            cardY += 190;
        });

        // Bottom Banner
        ctx.fillStyle = pColor;
        ctx.fillRect(0, h - 140, w, 140);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`SUPPORT ${this.data.candidateName.toUpperCase()} FOR ${this.data.position.toUpperCase()}`, 100, h - 60);
    }

    /* -------------------------------------------------------------
       TEMPLATE 4: BATCH MOBILIZER / ENDORSEMENT FLYER
       (Personalized Supporter Flyer with Generic Campaign Message)
       ------------------------------------------------------------- */
    /* -------------------------------------------------------------
       TEMPLATE 4: MULTI-PURPOSE BATCH / INDIVIDUAL FLIER
       (Executive Commendation, Exam Wishes, Invitations, Notices, or Campaign)
       ---------------------------------------------    /* -------------------------------------------------------------
       TEMPLATE 4: MULTI-PURPOSE BATCH / INDIVIDUAL FLIER
       (Executive Commendation, Exam Wishes, Invitations, Notices, or Campaign)
       ------------------------------------------------------------- */
    renderEndorsement(ctx, w, h) {
        const layout = this.data.layoutStyle || 'executive';
        if (layout === 'magazine') {
            return this.renderBatchMagazine(ctx, w, h);
        } else if (layout === 'certificate') {
            return this.renderBatchCertificate(ctx, w, h);
        } else {
            return this.renderBatchExecutive(ctx, w, h);
        }
    }

    /* -------------------------------------------------------------
       LAYOUT 1: GRAND EXECUTIVE (HERO CENTER)
       ------------------------------------------------------------- */
    renderBatchExecutive(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e3a8a';
        const sColor = this.data.secondaryColor || '#f59e0b';
        const isLight = this.data.batchTheme === 'light';
        const isTall = (h / w > 1.35); // 9:16 or portrait aspect ratio
        const density = this.data.textDensity || 'auto';

        ctx.save();

        // 1. Studio Lighting & Cinematic Backdrop
        if (isLight) {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#ffffff');
            bgGrad.addColorStop(0.3, '#f8fafc');
            bgGrad.addColorStop(0.7, '#f1f5f9');
            bgGrad.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Subtle warm studio glow behind portrait
            const pSpotY = isTall ? 640 : 420;
            const spotGrad = ctx.createRadialGradient(w / 2, pSpotY, 40, w / 2, pSpotY, w * 0.55);
            spotGrad.addColorStop(0, this.hexToRgba(sColor, 0.16));
            spotGrad.addColorStop(0.5, this.hexToRgba(pColor, 0.08));
            spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = spotGrad;
            ctx.fillRect(0, 0, w, h);
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#060911');
            bgGrad.addColorStop(0.25, '#0b1120');
            bgGrad.addColorStop(0.65, this.hexToRgba(pColor, 0.45));
            bgGrad.addColorStop(0.9, '#080d18');
            bgGrad.addColorStop(1, '#04070d');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Ambient portrait backlight glow
            const pSpotY = isTall ? 640 : 420;
            const spotGrad = ctx.createRadialGradient(w / 2, pSpotY, 40, w / 2, pSpotY, w * 0.55);
            spotGrad.addColorStop(0, this.hexToRgba(sColor, 0.28));
            spotGrad.addColorStop(0.4, this.hexToRgba(pColor, 0.25));
            spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = spotGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // Custom template or texture backdrop overlay if provided
        this.drawPosterBackdrop(ctx, w, h);

        // Subtle Corner Accents (Executive Flier Geometric Brackets)
        const cornerSize = isTall ? 36 : 28;
        const cornerInset = isTall ? 45 : 35;
        ctx.strokeStyle = this.hexToRgba(sColor, isLight ? 0.35 : 0.45);
        ctx.lineWidth = 2;

        // Top-left bracket
        ctx.beginPath();
        ctx.moveTo(cornerInset + cornerSize, cornerInset);
        ctx.lineTo(cornerInset, cornerInset);
        ctx.lineTo(cornerInset, cornerInset + cornerSize);
        ctx.stroke();

        // Top-right bracket
        ctx.beginPath();
        ctx.moveTo(w - cornerInset - cornerSize, cornerInset);
        ctx.lineTo(w - cornerInset, cornerInset);
        ctx.lineTo(w - cornerInset, cornerInset + cornerSize);
        ctx.stroke();

        // Bottom-left bracket
        ctx.beginPath();
        ctx.moveTo(cornerInset + cornerSize, h - cornerInset);
        ctx.lineTo(cornerInset, h - cornerInset);
        ctx.lineTo(cornerInset, h - cornerInset - cornerSize);
        ctx.stroke();

        // Bottom-right bracket
        ctx.beginPath();
        ctx.moveTo(w - cornerInset - cornerSize, h - cornerInset);
        ctx.lineTo(w - cornerInset, h - cornerInset);
        ctx.lineTo(w - cornerInset, h - cornerInset - cornerSize);
        ctx.stroke();

        // Top Metallic Accent Stripe (Glow Bar)
        const topGlow = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
        topGlow.addColorStop(0, 'rgba(245, 158, 11, 0)');
        topGlow.addColorStop(0.5, sColor);
        topGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, w, 6);

        // 2. Top Tagline / Category Pill
        let curY = isTall ? 70 : 34;
        const rawTagline = (this.data.tagline || this.data.batchTagline || '').trim();
        if (rawTagline) {
            ctx.save();
            const tagText = `✦  ${rawTagline.toUpperCase()}  ✦`;
            ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '2px';
            const tagMetrics = ctx.measureText(tagText);
            const pillW = Math.min(w - 120, tagMetrics.width + 48);
            const pillH = 32;
            const pillX = (w - pillW) / 2;

            ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.75)';
            ctx.beginPath();
            ctx.roundRect(pillX, curY, pillW, pillH, 16);
            ctx.fill();

            ctx.strokeStyle = this.hexToRgba(sColor, 0.6);
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = sColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tagText, w / 2, curY + pillH / 2 + 1);
            ctx.restore();

            curY += pillH + (isTall ? 20 : 10);
        } else {
            curY += isTall ? 16 : 8;
        }

        // 3. Main Target Headline / Title
        const defaultTitle = this.data.candidateName ? `I STAND WITH ${this.data.candidateName}` : 'SPECIAL COMMENDATION & HONORS';
        const titleText = (this.data.greetingTitle || this.data.batchTitle || defaultTitle).trim();
        
        ctx.save();
        let titleSize = isTall 
            ? (titleText.length > 40 ? 36 : (titleText.length > 25 ? 42 : 48))
            : (titleText.length > 40 ? 28 : (titleText.length > 25 ? 34 : 40));
        
        ctx.font = `900 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
        const titleLines = this.getWrappedLines(ctx, titleText.toUpperCase(), w - 160);
        const titleLineHeight = Math.round(titleSize * 1.18);

        ctx.fillStyle = this.data.titleColor || (isLight ? '#0f172a' : '#ffffff');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;

        const startTitleY = curY;
        titleLines.forEach((line) => {
            ctx.fillText(line, w / 2, curY);
            curY += titleLineHeight;
        });
        this.recordElementBox('title', 80, startTitleY, w - 160, curY - startTitleY);
        ctx.restore();

        // 4. Subtitle / Occasion / Department
        const defaultSub = this.data.position ? `FOR ${this.data.position}` : '';
        const subText = (this.data.subPosition || this.data.batchSubtitle || defaultSub).trim();
        if (subText) {
            curY += 4;
            ctx.save();
            const subSize = isTall ? 22 : 18;
            ctx.font = `700 ${subSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = this.data.positionColor || sColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.letterSpacing = '1.5px';
            ctx.fillText(`—  ${subText.toUpperCase()}  —`, w / 2, curY);
            this.recordElementBox('position', 80, curY, w - 160, subSize * 1.4);
            ctx.restore();
            curY += subSize + (isTall ? 24 : 14);
        } else {
            curY += isTall ? 18 : 10;
        }

        // 5. Centerpiece Portrait (Photo of the Individual)
        const portraitW = isTall ? 580 : 520;
        const portraitH = isTall ? 630 : 470;
        const portraitX = (w - portraitW) / 2;
        const portraitY = curY;
        const portraitRadius = 28;

        const photo = this.data.mobilizerPhoto || this.data.photoImg;

        // Outer soft glow & drop shadow
        ctx.save();
        ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;

        // Card base backdrop (rich dark/ivory slate)
        ctx.fillStyle = isLight ? '#e2e8f0' : '#0a0f1d';
        ctx.beginPath();
        ctx.roundRect(portraitX, portraitY, portraitW, portraitH, portraitRadius);
        ctx.fill();
        ctx.restore();

        // Draw individual photo or prestigious VIP avatar fallback
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(portraitX, portraitY, portraitW, portraitH, portraitRadius);
        ctx.clip();

        if (photo) {
            this.drawContainedImage(ctx, photo, portraitX, portraitY, portraitW, portraitH, this.data.photoScale || 1.0, this.data.photoXOffset || 0, this.data.photoYOffset || 0, 'cover');
        } else {
            // Fallback VIP Monogram Emblem
            const discGrad = ctx.createLinearGradient(portraitX, portraitY, portraitX + portraitW, portraitY + portraitH);
            discGrad.addColorStop(0, '#1e3a8a');
            discGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = discGrad;
            ctx.fillRect(portraitX, portraitY, portraitW, portraitH);

            const mobName = (this.data.mobilizerName || 'Recipient').trim();
            const initials = mobName.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '★';

            ctx.fillStyle = sColor;
            ctx.font = '900 84px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, portraitX + portraitW / 2, portraitY + portraitH / 2 - 20);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('HONORED RECIPIENT', portraitX + portraitW / 2, portraitY + portraitH / 2 + 55);
        }
        ctx.restore();

        // Metallic Multi-Ring Bezel Frame
        ctx.save();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(portraitX, portraitY, portraitW, portraitH, portraitRadius);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(portraitX + 4, portraitY + 4, portraitW - 8, portraitH - 8, portraitRadius - 4);
        ctx.stroke();
        ctx.restore();

        this.recordElementBox('photo', portraitX, portraitY, portraitW, portraitH);

        // 6. Floating Glassmorphic Name & Role Badge (Anchored on bottom edge of portrait)
        const badgeW = Math.min(w - 120, portraitW + 70);
        const badgeH = isTall ? 98 : 84;
        const badgeX = (w - badgeW) / 2;
        const badgeY = portraitY + portraitH - Math.round(badgeH * 0.46);

        ctx.save();
        ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;

        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.94)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
        ctx.fill();

        ctx.strokeStyle = sColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Individual's Full Name
        const mobName = (this.data.mobilizerName || 'INDIVIDUAL RECIPIENT').trim();
        const mobRole = (this.data.mobilizerRole || '').trim();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const nameSize = isTall 
            ? (mobName.length > 22 ? 32 : 38)
            : (mobName.length > 22 ? 26 : 32);

        ctx.fillStyle = this.data.nameColor || (isLight ? '#0f172a' : '#ffffff');
        ctx.font = `900 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
        const nameY = mobRole ? (badgeY + badgeH * 0.38) : (badgeY + badgeH * 0.5);
        ctx.fillText(mobName.toUpperCase(), badgeX + badgeW / 2, nameY);
        this.recordElementBox('name', badgeX + 20, nameY - nameSize * 0.6, badgeW - 40, nameSize * 1.2);

        // Individual's Role / Department
        if (mobRole) {
            const roleSize = isTall ? 19 : 16;
            ctx.fillStyle = this.data.secondaryNameColor || sColor;
            ctx.font = `700 ${roleSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.letterSpacing = '1px';
            ctx.fillText(mobRole.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH * 0.74);
        }
        ctx.restore();

        // 7. Dedicated Auto-Balanced Proclamation Card (No more giant empty void!)
        const msgBody = (this.data.goodwillMessage || this.data.slogan || '').trim();
        const footerSpace = isTall ? 80 : 55;
        const msgCardW = w - (isTall ? 140 : 120);
        const msgCardX = (w - msgCardW) / 2;

        if (msgBody) {
            // Generous, authoritative font sizing based on user text density preference
            let msgFontSize = 38;
            if (density === 'large') {
                msgFontSize = isTall ? (msgBody.length > 200 ? 42 : 50) : (msgBody.length > 200 ? 36 : 44);
            } else if (density === 'compact') {
                msgFontSize = isTall ? 28 : 24;
            } else { // auto
                if (msgBody.length <= 130) {
                    msgFontSize = isTall ? 48 : 42;
                } else if (msgBody.length <= 230) {
                    msgFontSize = isTall ? 42 : 36;
                } else {
                    msgFontSize = isTall ? 34 : 28;
                }
            }

            ctx.font = `600 ${msgFontSize}px "Plus Jakarta Sans", sans-serif`;
            const maxTextW = msgCardW - 70;
            const msgLines = this.getWrappedLines(ctx, `“${msgBody}”`, maxTextW);
            const lineH = Math.round(msgFontSize * 1.42);
            const totalTextH = msgLines.length * lineH;

            // Hug content height + comfortable padding
            const desiredCardH = Math.max(150, totalTextH + (isTall ? 60 : 48));
            const availableSpaceBelowBadge = (h - footerSpace) - (badgeY + badgeH);
            const actualCardH = Math.min(availableSpaceBelowBadge - 16, desiredCardH);

            // Vertically center the card in the remaining space below badge
            const spaceOffset = Math.max(14, Math.round((availableSpaceBelowBadge - actualCardH) * 0.35));
            const msgCardY = badgeY + badgeH + spaceOffset;

            ctx.save();
            ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.09)' : 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 6;

            // High quality card background
            if (isLight) {
                const cardGrad = ctx.createLinearGradient(msgCardX, msgCardY, msgCardX + msgCardW, msgCardY + actualCardH);
                cardGrad.addColorStop(0, '#ffffff');
                cardGrad.addColorStop(1, '#f8fafc');
                ctx.fillStyle = cardGrad;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            }
            ctx.beginPath();
            ctx.roundRect(msgCardX, msgCardY, msgCardW, actualCardH, 20);
            ctx.fill();

            // Crisp border
            ctx.strokeStyle = isLight ? this.hexToRgba(sColor, 0.45) : this.hexToRgba(sColor, 0.3);
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Decorative inner border hairline for royal stationery feel
            ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.5)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(msgCardX + 5, msgCardY + 5, msgCardW - 10, actualCardH - 10, 16);
            ctx.stroke();

            // Decorative watermark quotation mark
            ctx.font = 'italic 70px "Plus Jakarta Sans", serif';
            ctx.fillStyle = this.hexToRgba(sColor, isLight ? 0.25 : 0.35);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('“', msgCardX + 20, msgCardY + 8);

            // Render message lines
            let startY = msgCardY + Math.max(16, (actualCardH - totalTextH) / 2);
            ctx.fillStyle = this.data.sloganColor || (isLight ? '#0f172a' : '#f8fafc');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `600 ${msgFontSize}px "Plus Jakarta Sans", sans-serif`;

            msgLines.forEach((mLine) => {
                ctx.fillText(mLine, w / 2, startY);
                startY += lineH;
            });

            this.recordElementBox('slogan', msgCardX + 20, msgCardY + 15, msgCardW - 40, actualCardH - 30);
            ctx.restore();
        }

        // 8. Bottom Footer Bar & Optional Endorsement
        ctx.save();
        const footerY = h - (isTall ? 55 : 36);

        // Fine divider line above footer
        const divLineY = footerY - (isTall ? 36 : 24);
        const divGrad = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
        divGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        divGrad.addColorStop(0.5, this.hexToRgba(sColor, 0.4));
        divGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, divLineY);
        ctx.lineTo(w * 0.85, divLineY);
        ctx.stroke();

        // Center diamond ornament on divider
        ctx.fillStyle = sColor;
        ctx.beginPath();
        ctx.arc(w / 2, divLineY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Footer Content
        const footerText = (this.data.batchFooter || '').trim();
        const hasEndorsement = (this.data.includeCandidateBranding && this.data.candidateName);

        if (hasEndorsement) {
            const endText = `★  OFFICIALLY ENDORSED BY ${this.data.candidateName.toUpperCase()} • ${this.data.position.toUpperCase()}  ★`;
            ctx.font = 'bold 19px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = sColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1px';
            ctx.fillText(endText, w / 2, footerY - (footerText ? 16 : 0));

            if (footerText) {
                ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
                ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
                ctx.fillText(footerText.toUpperCase(), w / 2, footerY + 12);
            }
        } else if (footerText) {
            ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1.5px';
            ctx.fillText(footerText.toUpperCase(), w / 2, footerY);
        } else {
            ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#94a3b8' : '#64748b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '2px';
            ctx.fillText('ELECHUB EXECUTIVE FLIER STUDIO • OFFICIAL COMMENDATION', w / 2, footerY);
        }
        ctx.restore();

        ctx.restore();
    }

    /* -------------------------------------------------------------
       LAYOUT 2: MODERN EDITORIAL (SIDE-BY-SIDE SPLIT)
       (Zero vertical dead space, magazine person-of-the-year styling)
       ------------------------------------------------------------- */
    renderBatchMagazine(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e3a8a';
        const sColor = this.data.secondaryColor || '#f59e0b';
        const isLight = this.data.batchTheme === 'light';
        const isTall = (h / w > 1.35);
        const density = this.data.textDensity || 'auto';

        ctx.save();

        // 1. Background
        if (isLight) {
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#fcfcfd');
            bgGrad.addColorStop(0.5, '#f8fafc');
            bgGrad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Left column spotlight
            const spotGrad = ctx.createRadialGradient(w * 0.25, h * 0.45, 60, w * 0.25, h * 0.45, w * 0.5);
            spotGrad.addColorStop(0, this.hexToRgba(sColor, 0.12));
            spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = spotGrad;
            ctx.fillRect(0, 0, w, h);
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#070b14');
            bgGrad.addColorStop(0.5, '#0b1120');
            bgGrad.addColorStop(1, '#020617');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            const spotGrad = ctx.createRadialGradient(w * 0.25, h * 0.45, 60, w * 0.25, h * 0.45, w * 0.5);
            spotGrad.addColorStop(0, this.hexToRgba(pColor, 0.35));
            spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = spotGrad;
            ctx.fillRect(0, 0, w, h);
        }

        this.drawPosterBackdrop(ctx, w, h);

        // Top & Bottom Accent bars
        ctx.fillStyle = sColor;
        ctx.fillRect(0, 0, w, 5);
        ctx.fillRect(0, h - 5, w, 5);

        // 2. Geometry: Split Two Columns
        const margin = isTall ? 50 : 42;
        const col1W = Math.round(w * (isTall ? 0.45 : 0.43));
        const col1X = margin;
        const col1Y = margin + 10;
        const col1H = h - col1Y - margin - 20;

        const col2X = col1X + col1W + (isTall ? 44 : 36);
        const col2W = w - col2X - margin;
        let col2Y = col1Y + 10;

        // LEFT COLUMN: Full Height Hero Portrait
        const photo = this.data.mobilizerPhoto || this.data.photoImg;
        const radius = 24;

        ctx.save();
        ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = isLight ? '#e2e8f0' : '#0f172a';
        ctx.beginPath();
        ctx.roundRect(col1X, col1Y, col1W, col1H, radius);
        ctx.fill();
        ctx.restore();

        // Clip and draw photo
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(col1X, col1Y, col1W, col1H, radius);
        ctx.clip();

        if (photo) {
            this.drawContainedImage(ctx, photo, col1X, col1Y, col1W, col1H, this.data.photoScale || 1.0, this.data.photoXOffset || 0, this.data.photoYOffset || 0, 'cover');
        } else {
            const discGrad = ctx.createLinearGradient(col1X, col1Y, col1X + col1W, col1Y + col1H);
            discGrad.addColorStop(0, '#1e3a8a');
            discGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = discGrad;
            ctx.fillRect(col1X, col1Y, col1W, col1H);

            const mobName = (this.data.mobilizerName || 'Recipient').trim();
            const initials = mobName.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '★';

            ctx.fillStyle = sColor;
            ctx.font = '900 88px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, col1X + col1W / 2, col1Y + col1H / 2 - 20);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('FEATURED SCHOLAR', col1X + col1W / 2, col1Y + col1H / 2 + 50);
        }

        // Left photo bottom subtle gradient for name badge readability
        const scrimH = Math.round(col1H * 0.38);
        const scrimGrad = ctx.createLinearGradient(0, col1Y + col1H - scrimH, 0, col1Y + col1H);
        scrimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        scrimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = scrimGrad;
        ctx.fillRect(col1X, col1Y + col1H - scrimH, col1W, scrimH);
        ctx.restore();

        // Left Photo Gold Metallic Outer Border
        ctx.save();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(col1X, col1Y, col1W, col1H, radius);
        ctx.stroke();
        ctx.restore();

        this.recordElementBox('photo', col1X, col1Y, col1W, col1H);

        // Overlaid Name Badge on Left Column Bottom
        const mobName = (this.data.mobilizerName || 'INDIVIDUAL RECIPIENT').trim();
        const mobRole = (this.data.mobilizerRole || '').trim();
        const leftBadgeW = col1W - 32;
        const leftBadgeH = 88;
        const leftBadgeX = col1X + 16;
        const leftBadgeY = col1Y + col1H - leftBadgeH - 16;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(leftBadgeX, leftBadgeY, leftBadgeW, leftBadgeH, 16);
        ctx.fill();

        ctx.strokeStyle = sColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const leftNameSize = mobName.length > 20 ? 24 : 28;
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${leftNameSize}px "Plus Jakarta Sans", sans-serif`;
        const leftNameY = mobRole ? (leftBadgeY + leftBadgeH * 0.38) : (leftBadgeY + leftBadgeH * 0.5);
        ctx.fillText(mobName.toUpperCase(), leftBadgeX + leftBadgeW / 2, leftNameY);

        if (mobRole) {
            ctx.fillStyle = sColor;
            ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '1px';
            ctx.fillText(mobRole.toUpperCase(), leftBadgeX + leftBadgeW / 2, leftBadgeY + leftBadgeH * 0.74);
        }
        ctx.restore();
        this.recordElementBox('name', leftBadgeX, leftBadgeY, leftBadgeW, leftBadgeH);

        // RIGHT COLUMN: Editorial Proclamation in Unified Magazine Card
        const rCardX = col2X;
        const rCardY = col1Y;
        const rCardW = col2W;
        const rCardH = col1H;

        ctx.save();
        ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;

        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(rCardX, rCardY, rCardW, rCardH, 24);
        ctx.fill();

        ctx.strokeStyle = isLight ? this.hexToRgba(sColor, 0.45) : this.hexToRgba(sColor, 0.35);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Inner subtle hairline border
        ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.5)' : 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(rCardX + 6, rCardY + 6, rCardW - 12, rCardH - 12, 18);
        ctx.stroke();
        ctx.restore();

        let innerY = rCardY + 28;
        const innerW = rCardW - 48;
        const innerX = rCardX + 24;

        // 1. Tagline Pill
        const rawTagline = (this.data.tagline || this.data.batchTagline || 'OFFICIAL ACADEMIC GOODWILL').trim();
        ctx.save();
        const tagText = `✦  ${rawTagline.toUpperCase()}  ✦`;
        ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
        ctx.letterSpacing = '1.5px';
        const tagMetrics = ctx.measureText(tagText);
        const pillW = Math.min(innerW, tagMetrics.width + 36);
        const pillH = 30;

        ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.95)' : 'rgba(30, 41, 59, 0.85)';
        ctx.beginPath();
        ctx.roundRect(innerX, innerY, pillW, pillH, 15);
        ctx.fill();

        ctx.strokeStyle = this.hexToRgba(sColor, 0.7);
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = sColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, innerX + 18, innerY + pillH / 2 + 1);
        ctx.restore();

        innerY += pillH + 16;

        // 2. Striking Editorial Headline
        const defaultTitle = this.data.candidateName ? `I STAND WITH ${this.data.candidateName}` : 'SUCCESS & EXCELLENCE IN EXAMINATIONS';
        const titleText = (this.data.greetingTitle || this.data.batchTitle || defaultTitle).trim();

        ctx.save();
        const titleSize = titleText.length > 35 ? 32 : (titleText.length > 22 ? 38 : 44);
        ctx.font = `900 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
        const titleLines = this.getWrappedLines(ctx, titleText.toUpperCase(), innerW);
        const titleLineH = Math.round(titleSize * 1.16);

        ctx.fillStyle = this.data.titleColor || (isLight ? '#0f172a' : '#ffffff');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const startTitleY = innerY;
        titleLines.forEach((line) => {
            ctx.fillText(line, innerX, innerY);
            innerY += titleLineH;
        });
        this.recordElementBox('title', innerX, startTitleY, innerW, innerY - startTitleY);
        ctx.restore();

        // 3. Subtitle / Department
        const defaultSub = this.data.position ? `FOR ${this.data.position}` : '';
        const subText = (this.data.subPosition || this.data.batchSubtitle || defaultSub).trim();
        if (subText) {
            innerY += 4;
            ctx.save();
            ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = this.data.positionColor || sColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.letterSpacing = '1px';
            ctx.fillText(`—  ${subText.toUpperCase()}`, innerX, innerY);
            ctx.restore();
            innerY += 26;
        } else {
            innerY += 14;
        }

        // 4. Fine Horizontal Gold Divider
        ctx.save();
        const divGrad = ctx.createLinearGradient(innerX, 0, innerX + innerW, 0);
        divGrad.addColorStop(0, sColor);
        divGrad.addColorStop(0.7, this.hexToRgba(sColor, 0.4));
        divGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(innerX + innerW, innerY);
        ctx.stroke();
        ctx.restore();

        innerY += 18;

        // 5. Magazine Proclamation Quote with prominent typography
        const msgBody = (this.data.goodwillMessage || this.data.slogan || '').trim();
        if (msgBody) {
            let msgFontSize = 36;
            if (density === 'large') {
                msgFontSize = msgBody.length > 200 ? 38 : 44;
            } else if (density === 'compact') {
                msgFontSize = 26;
            } else { // auto
                if (msgBody.length <= 130) {
                    msgFontSize = 42;
                } else if (msgBody.length <= 230) {
                    msgFontSize = 36;
                } else {
                    msgFontSize = 28;
                }
            }

            ctx.save();
            // Giant decorative opening quote mark
            ctx.font = 'italic 76px "Plus Jakarta Sans", serif';
            ctx.fillStyle = this.hexToRgba(sColor, isLight ? 0.3 : 0.4);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('“', innerX, innerY - 14);

            // Message text
            ctx.font = `600 ${msgFontSize}px "Plus Jakarta Sans", sans-serif`;
            const msgLines = this.getWrappedLines(ctx, msgBody, innerW - 10);
            const lineH = Math.round(msgFontSize * 1.44);
            let textY = innerY + 36;

            ctx.fillStyle = this.data.sloganColor || (isLight ? '#1e293b' : '#f1f5f9');
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            msgLines.forEach((mLine) => {
                ctx.fillText(mLine, innerX + 8, textY);
                textY += lineH;
            });

            this.recordElementBox('slogan', innerX, innerY, innerW, textY - innerY);
            ctx.restore();
        }

        // 6. Right Column Bottom Endorsement / Verification Box (Taking lower card section)
        ctx.save();
        const endBoxH = 88;
        const endBoxY = rCardY + rCardH - endBoxH - 18;
        const endBoxX = innerX;
        const endBoxW = innerW;

        // Subtle pill background for endorsement at bottom
        ctx.fillStyle = isLight ? 'rgba(248, 250, 252, 0.95)' : 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.roundRect(endBoxX, endBoxY, endBoxW, endBoxH, 16);
        ctx.fill();

        ctx.strokeStyle = this.hexToRgba(sColor, 0.5);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const footerText = (this.data.batchFooter || '').trim();
        const hasEndorsement = (this.data.includeCandidateBranding && this.data.candidateName);

        if (hasEndorsement) {
            ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = sColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`★ OFFICIALLY ENDORSED BY ${this.data.candidateName.toUpperCase()}`, endBoxX + 18, endBoxY + 30);

            ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.fillText(this.data.position.toUpperCase() + (footerText ? ` • ${footerText.toUpperCase()}` : ''), endBoxX + 18, endBoxY + 58);
        } else if (footerText) {
            ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1px';
            ctx.fillText(footerText.toUpperCase(), endBoxX + 18, endBoxY + endBoxH / 2);
        } else {
            ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1.5px';
            ctx.fillText('ELECHUB EDITORIAL STUDIO • OFFICIAL COMMENDATION', endBoxX + 18, endBoxY + endBoxH / 2);
        }
        ctx.restore();

        ctx.restore();
    }

    /* -------------------------------------------------------------
       LAYOUT 3: ROYAL COMMENDATION (CREST & CERTIFICATE)
       (Ornate gold filigree, central medallion, formal testimonial)
       ------------------------------------------------------------- */
    renderBatchCertificate(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e3a8a';
        const sColor = this.data.secondaryColor || '#f59e0b';
        const isLight = this.data.batchTheme === 'light';
        const isTall = (h / w > 1.35);
        const density = this.data.textDensity || 'auto';

        ctx.save();

        // 1. Prestigious Parchment Backdrop
        if (isLight) {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#fcfaf5');
            bgGrad.addColorStop(0.5, '#f7f4ec');
            bgGrad.addColorStop(1, '#f1ede0');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);
        } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#090d16');
            bgGrad.addColorStop(0.5, '#0d1527');
            bgGrad.addColorStop(1, '#050811');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);
        }

        this.drawPosterBackdrop(ctx, w, h);

        // 2. Ornate Double Gold Certificate Border with Corner Rosettes
        const outerInset = 28;
        const innerInset = 38;

        // Outer heavy gold border
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(outerInset, outerInset, w - outerInset * 2, h - outerInset * 2);

        // Inner hairline border
        ctx.strokeStyle = this.hexToRgba(sColor, 0.55);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(innerInset, innerInset, w - innerInset * 2, h - innerInset * 2);

        // 4 Corner Rosette Ornaments
        const corners = [
            [innerInset, innerInset],
            [w - innerInset, innerInset],
            [innerInset, h - innerInset],
            [w - innerInset, h - innerInset]
        ];
        corners.forEach(([cx, cy]) => {
            ctx.save();
            ctx.fillStyle = sColor;
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isLight ? '#f7f4ec' : '#0d1527';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });

        // 3. Top Institutional Header
        let curY = isTall ? 66 : 46;

        // Top Garland / Star Emblem
        ctx.save();
        ctx.fillStyle = sColor;
        ctx.font = '24px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★   ✦   ★   ✦   ★', w / 2, curY);
        ctx.restore();

        curY += 26;

        // Formal Header
        const rawTagline = (this.data.tagline || this.data.batchTagline || 'OFFICIAL COMMENDATION OF EXCELLENCE').trim();
        ctx.save();
        ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillStyle = sColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(rawTagline.toUpperCase(), w / 2, curY);
        ctx.restore();

        curY += 24;

        // Main Title
        const defaultTitle = this.data.candidateName ? `ENDORSEMENT OF ${this.data.candidateName}` : 'CERTIFICATE OF ACADEMIC GOODWILL';
        const titleText = (this.data.greetingTitle || this.data.batchTitle || defaultTitle).trim();

        ctx.save();
        const titleSize = isTall ? 36 : 30;
        ctx.font = `900 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = this.data.titleColor || (isLight ? '#0f172a' : '#ffffff');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = '1px';
        ctx.fillText(titleText.toUpperCase(), w / 2, curY);
        ctx.restore();

        curY += titleSize + 8;

        // Subtitle
        const defaultSub = this.data.position ? `FOR ${this.data.position}` : '';
        const subText = (this.data.subPosition || this.data.batchSubtitle || defaultSub).trim();
        if (subText) {
            ctx.save();
            ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.letterSpacing = '1.5px';
            ctx.fillText(`PRESENTED TO ALL SCHOLARS — ${subText.toUpperCase()}`, w / 2, curY);
            ctx.restore();
            curY += 26;
        } else {
            curY += 14;
        }

        // 4. Centerpiece Medallion Portrait
        const diam = isTall ? 440 : 380;
        const pCenterX = w / 2;
        const pCenterY = curY + diam / 2;
        const photo = this.data.mobilizerPhoto || this.data.photoImg;

        // Outer Shadow
        ctx.save();
        ctx.shadowColor = isLight ? 'rgba(15, 23, 42, 0.2)' : 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;

        // Clip circular portrait
        ctx.beginPath();
        ctx.arc(pCenterX, pCenterY, diam / 2, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#e2e8f0' : '#0f172a';
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(pCenterX, pCenterY, diam / 2, 0, Math.PI * 2);
        ctx.clip();

        if (photo) {
            const pX = pCenterX - diam / 2;
            const pY = pCenterY - diam / 2;
            this.drawContainedImage(ctx, photo, pX, pY, diam, diam, this.data.photoScale || 1.0, this.data.photoXOffset || 0, this.data.photoYOffset || 0, 'cover');
        } else {
            const discGrad = ctx.createLinearGradient(pCenterX - diam / 2, pCenterY - diam / 2, pCenterX + diam / 2, pCenterY + diam / 2);
            discGrad.addColorStop(0, '#1e3a8a');
            discGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = discGrad;
            ctx.fillRect(pCenterX - diam / 2, pCenterY - diam / 2, diam, diam);

            const mobName = (this.data.mobilizerName || 'Recipient').trim();
            const initials = mobName.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '★';

            ctx.fillStyle = sColor;
            ctx.font = '900 84px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, pCenterX, pCenterY);
        }
        ctx.restore();

        // Double Concentric Gold Frame
        ctx.save();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(pCenterX, pCenterY, diam / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(pCenterX, pCenterY, diam / 2 - 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        this.recordElementBox('photo', pCenterX - diam / 2, pCenterY - diam / 2, diam, diam);

        // 5. Recipient Name Ribbon below Medallion
        const mobName = (this.data.mobilizerName || 'HONORED RECIPIENT').trim();
        const mobRole = (this.data.mobilizerRole || '').trim();
        const ribbonW = Math.min(w - 140, diam + 130);
        const ribbonH = 82;
        const ribbonX = (w - ribbonW) / 2;
        const ribbonY = pCenterY + diam / 2 - 28;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;

        ctx.fillStyle = isLight ? '#0f172a' : '#0f172a';
        ctx.beginPath();
        ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 18);
        ctx.fill();

        ctx.strokeStyle = sColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const certNameSize = mobName.length > 20 ? 26 : 30;
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${certNameSize}px "Plus Jakarta Sans", sans-serif`;
        const cNameY = mobRole ? (ribbonY + ribbonH * 0.38) : (ribbonY + ribbonH * 0.5);
        ctx.fillText(mobName.toUpperCase(), w / 2, cNameY);

        if (mobRole) {
            ctx.fillStyle = sColor;
            ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '1px';
            ctx.fillText(mobRole.toUpperCase(), w / 2, ribbonY + ribbonH * 0.74);
        }
        ctx.restore();
        this.recordElementBox('name', ribbonX, ribbonY, ribbonW, ribbonH);

        // 6. Proclamation Parchment Box (Taking the lower portion of the certificate)
        const msgBody = (this.data.goodwillMessage || this.data.slogan || '').trim();
        const footerY = h - (isTall ? 65 : 46);
        const pCardY = ribbonY + ribbonH + 16;
        const pCardW = w - 140;
        const pCardX = 70;
        const pCardH = (footerY - 20) - pCardY;

        if (msgBody && pCardH > 80) {
            ctx.save();
            ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.roundRect(pCardX, pCardY, pCardW, pCardH, 20);
            ctx.fill();

            ctx.strokeStyle = this.hexToRgba(sColor, 0.45);
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Inner hairline border
            ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.5)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(pCardX + 5, pCardY + 5, pCardW - 10, pCardH - 10, 16);
            ctx.stroke();

            let msgFontSize = 36;
            if (density === 'large') {
                msgFontSize = msgBody.length > 200 ? 38 : 44;
            } else if (density === 'compact') {
                msgFontSize = 26;
            } else { // auto
                if (msgBody.length <= 130) {
                    msgFontSize = 42;
                } else if (msgBody.length <= 230) {
                    msgFontSize = 36;
                } else {
                    msgFontSize = 28;
                }
            }

            ctx.font = `600 ${msgFontSize}px "Plus Jakarta Sans", sans-serif`;
            const msgLines = this.getWrappedLines(ctx, `“${msgBody}”`, pCardW - 60);
            const lineH = Math.round(msgFontSize * 1.42);
            const totalTextH = msgLines.length * lineH;

            let textY = pCardY + Math.max(16, (pCardH - totalTextH) / 2);

            ctx.fillStyle = this.data.sloganColor || (isLight ? '#1e293b' : '#f1f5f9');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            msgLines.forEach((mLine) => {
                ctx.fillText(mLine, w / 2, textY);
                textY += lineH;
            });

            this.recordElementBox('slogan', pCardX, pCardY, pCardW, pCardH);
            ctx.restore();
        }

        // 7. Verification Seal & Signature
        ctx.save();
        const footerText = (this.data.batchFooter || '').trim();
        const hasEndorsement = (this.data.includeCandidateBranding && this.data.candidateName);

        if (hasEndorsement) {
            const endText = `SEAL OF ENDORSEMENT • ${this.data.candidateName.toUpperCase()} (${this.data.position.toUpperCase()})`;
            ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = sColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1px';
            ctx.fillText(endText, w / 2, footerY - (footerText ? 14 : 0));

            if (footerText) {
                ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
                ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
                ctx.fillText(footerText.toUpperCase(), w / 2, footerY + 12);
            }
        } else if (footerText) {
            ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '1.5px';
            ctx.fillText(footerText.toUpperCase(), w / 2, footerY);
        } else {
            ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = isLight ? '#94a3b8' : '#64748b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '2px';
            ctx.fillText('ELECHUB ROYAL COMMENDATION • OFFICIAL TESTIMONIAL', w / 2, footerY);
        }
        ctx.restore();

        ctx.restore();
    }

    /* -------------------------------------------------------------
       TEMPLATE 5: BOLD MODERNIST / SWISS EDITORIAL
       (High-Fashion Typography, Asymmetrical Color Block, Crisp Framing)
       ------------------------------------------------------------- */
    renderBoldMinimal(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e293b';
        const sColor = this.data.secondaryColor || '#e11d48';

        // 1. Crisp Off-White Background
        ctx.fillStyle = '#fafaf9';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Bold Asymmetric Color Slab on Right
        const slabW = w * 0.32;
        ctx.fillStyle = pColor;
        ctx.fillRect(w - slabW, 0, slabW, h);

        // Secondary Accent Pinstripe
        ctx.fillStyle = sColor;
        ctx.fillRect(w - slabW - 16, 0, 16, h);

        // 3. Ultra-Bold Giant Typographic Header
        const nameSize = this.data.nameFontSize || 110;
        const nameX = 80 + (this.data.nameXOffset || 0);
        const nameY = 150 + (this.data.nameYOffset || 0);
        ctx.fillStyle = this.data.nameColor || '#0f172a';
        ctx.font = `900 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.letterSpacing = '-2px';
        ctx.fillText(this.data.candidateName.toUpperCase(), nameX, nameY);
        const nameMetrics = ctx.measureText(this.data.candidateName.toUpperCase());
        this.recordElementBox('name', nameX, nameY - nameSize * 0.85, nameMetrics.width, nameSize * 1.1);

        // 4. Clean Monochromatic Office Pill
        const posSize = this.data.positionFontSize || 28;
        const posX = 105 + (this.data.positionXOffset || 0);
        const posY = 228 + (this.data.positionYOffset || 0);
        const pillW = Math.max(520, posSize * (this.data.position.length * 0.7 + 5));
        ctx.fillStyle = this.data.bannerColor || sColor;
        ctx.beginPath();
        ctx.roundRect(posX - 25, posY - 38, pillW, posSize + 28, 12);
        ctx.fill();

        ctx.fillStyle = this.data.positionColor || '#ffffff';
        ctx.font = `800 ${posSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.letterSpacing = '2px';
        ctx.fillText(`FOR ${this.data.position.toUpperCase()}`, posX, posY);
        this.recordElementBox('position', posX - 25, posY - 38, pillW, posSize + 28);

        // Subtitle / Alliance
        if (this.data.alliance) {
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(this.data.alliance.toUpperCase(), posX + pillW + 20, posY);
        }

        // 5. Large Photo Placement (Centered-left with sharp clean frame)
        const photo = this.data.photoImg;
        const photoBoxW = w * 0.62;
        const photoBoxH = h * 0.58;
        const photoBoxX = 80;
        const photoBoxY = 280;

        if (photo) {
            ctx.save();
            this.drawContainedImage(ctx, photo, photoBoxX, photoBoxY, photoBoxW, photoBoxH, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', photoBoxX, photoBoxY, photoBoxW, photoBoxH);
        }

        // 6. Right Vertical Stamp Text
        const vertTag = (this.data.tagline || '').trim();
        if (vertTag) {
            ctx.save();
            ctx.translate(w - (slabW / 2), h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '900 54px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '12px';
            ctx.textAlign = 'center';
            ctx.fillText(vertTag.toUpperCase(), 0, 0);
            ctx.restore();
        }

        // 7. Bottom Statement / Slogan Box
        let bottomY = photoBoxY + photoBoxH + 50;
        if (this.data.slogan) {
            const slogSize = this.data.sloganFontSize || 42;
            const slogX = 80 + (this.data.sloganXOffset || 0);
            const slogY = bottomY + (this.data.sloganYOffset || 0);
            ctx.fillStyle = this.data.sloganColor || '#0f172a';
            ctx.font = `italic 700 ${slogSize}px "Plus Jakarta Sans", sans-serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX, slogY, w * 0.62, Math.round(slogSize * 1.3));
            this.recordElementBox('slogan', slogX, slogY - slogSize * 0.8, w * 0.62, slogSize * 2.5);
            bottomY = slogY + 80;
        }

        // Faculty or Hall Stamp
        if (this.data.facultyOrHall) {
            ctx.fillStyle = sColor;
            ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(`• ${this.data.facultyOrHall.toUpperCase()}`, 80, bottomY + 50);
        }
    }

    /* -------------------------------------------------------------
       TEMPLATE 6: ELECTRIC CYBER / YOUTH WAVE
       (High-Energy Cyberpunk, Glowing Neon Accents, Tech Innovator)
       ------------------------------------------------------------- */
    renderNeonPulse(ctx, w, h) {
        const pColor = this.data.primaryColor || '#06b6d4';
        const sColor = this.data.secondaryColor || '#a855f7';

        // 1. Deep Obsidian Cyber Base
        ctx.fillStyle = '#050711';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Glowing Diagonal Cyber Grid
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 2;
        for (let i = -w; i < w * 2; i += 80) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + h * 0.5, h);
            ctx.stroke();
        }
        ctx.restore();

        // Top Cyber Status Badge
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.beginPath();
        ctx.roundRect(80, 60, 480, 52, 26);
        ctx.fill();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.data.tagline && this.data.customTemplateShowTagline !== false) {
            ctx.fillStyle = '#e0e7ff';
            ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '3px';
            const tagText = this.data.tagline.toUpperCase();
            ctx.fillText(tagText, 120, 94);
            const tMetrics = ctx.measureText(tagText);
            this.recordElementBox('tagline', 120, 94 - 18, tMetrics.width, 26);
        }

        // 3. Central Candidate Photo with Glowing Neon Frame
        const photo = this.data.photoImg;
        const photoY = 150;
        const photoH = h * 0.54;
        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            const neonGrad = ctx.createRadialGradient(w / 2, photoY + photoH / 2, 100, w / 2, photoY + photoH / 2, w * 0.45);
            neonGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            neonGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
            neonGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = neonGrad;
            ctx.fillRect(0, photoY - 50, w, photoH + 100);

            this.drawContainedImage(ctx, photo, 80, photoY, w - 160, photoH, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', 80, photoY, w - 160, photoH);
        }

        // Cyber Bottom Slanted Card (Adjustable, Resizable & Deletable)
        const baseCardY = photoY + photoH - 60;
        let cardY = baseCardY;
        if (this.data.showTemplateRibbon !== false) {
            const rxOffset = this.data.templateRibbonXOffset || 0;
            const ryOffset = this.data.templateRibbonYOffset || 0;
            const rwOffset = this.data.templateRibbonWidthOffset || 0;
            const rhOffset = this.data.templateRibbonHeightOffset || 0;

            const baseCardX = 60;
            const baseCardW = w - 120;
            const baseCardH = h - baseCardY - 60;

            const cardX = Math.max(0, baseCardX - rwOffset / 2 + rxOffset);
            cardY = baseCardY + ryOffset;
            const cardW = Math.max(100, Math.min(w, baseCardW + rwOffset));
            const cardH = Math.max(40, Math.min(h, baseCardH + rhOffset));

            ctx.save();
            ctx.fillStyle = this.data.cardBgColor || 'rgba(10, 15, 30, 0.94)';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 32);
            ctx.fill();
            ctx.strokeStyle = pColor;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glowing Top Edge of Card
            const edgeGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
            edgeGrad.addColorStop(0, pColor);
            edgeGrad.addColorStop(0.5, sColor);
            edgeGrad.addColorStop(1, pColor);
            ctx.fillStyle = edgeGrad;
            ctx.fillRect(cardX + 40, cardY, cardW - 80, 6);
            ctx.restore();

            this.recordElementBox('ribbon', cardX, cardY, cardW, cardH);
        } else {
            cardY = photoY + photoH - 20;
        }

        // Candidate Name in Neon White
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameSize = this.data.nameFontSize || 90;
            const nameX = 110 + (this.data.nameXOffset || 0);
            const nameY = cardY + 105 + (this.data.nameYOffset || 0);
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.font = `900 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
            const nText = this.data.candidateName.toUpperCase();
            ctx.fillText(nText, nameX, nameY);
            const nameMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX, nameY - nameSize * 0.85, nameMetrics.width + 20, nameSize * 1.1);
        }

        // Position Badge with Glowing Tag
        if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posSize = this.data.positionFontSize || 42;
            const posX = 110 + (this.data.positionXOffset || 0);
            const posY = cardY + 170 + (this.data.positionYOffset || 0);
            ctx.fillStyle = this.data.positionColor || pColor;
            ctx.font = `800 ${posSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.letterSpacing = '2px';
            const posText = this.data.position.toUpperCase();
            ctx.fillText(posText, posX, posY);
            const posMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX, posY - posSize * 0.85, posMetrics.width + 20, posSize * 1.1);
        }

        // Cyber Slogan Box
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan && this.data.slogan.trim()) {
            const slogSize = this.data.sloganFontSize || 32;
            const slogBoxY = cardY + 230;
            const slogX = 140 + (this.data.sloganXOffset || 0);
            const slogY = slogBoxY + 50 + (this.data.sloganYOffset || 0);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
            ctx.beginPath();
            ctx.roundRect(110, slogBoxY, w - 220, 120, 16);
            ctx.fill();
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = this.data.sloganColor || '#f1f5f9';
            ctx.font = `italic 600 ${slogSize}px "Plus Jakarta Sans", sans-serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX, slogY, w - 280, Math.round(slogSize * 1.3));
            this.recordElementBox('slogan', 110, slogBoxY, w - 220, 120);
        }
        ctx.restore();
    }

    /* -------------------------------------------------------------
       TEMPLATE 7: VARSITY ACADEMIC HERITAGE
       (Ivy League Prestige, Oxford Serif Gravitas, Regal Crest Frame)
       ------------------------------------------------------------- */
    renderVarsityPrestige(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e1b4b';
        const sColor = this.data.secondaryColor || '#d97706';

        // 1. Rich Parchment / Dark Navy Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Elegant Double Gold Regal Border
        ctx.save();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = 6;
        ctx.strokeRect(50, 50, w - 100, h - 100);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(66, 66, w - 132, h - 132);

        // Corner Ornamental Accents
        const corners = [[50, 50], [w - 50, 50], [50, h - 50], [w - 50, h - 50]];
        ctx.fillStyle = sColor;
        corners.forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // 3. Top Regal Crest Banner
        const instTitle = (this.data.associationName || this.data.facultyOrHall || '').trim();
        if (instTitle) {
            ctx.fillStyle = sColor;
            ctx.font = 'bold 30px Georgia, "Plus Jakarta Sans", serif';
            ctx.letterSpacing = '6px';
            ctx.textAlign = 'center';
            ctx.fillText(`• ${instTitle.toUpperCase()} •`, w / 2, 130);
        }

        const varsityTag = (this.data.tagline || '').trim();
        if (varsityTag) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 500 24px Georgia, serif';
            ctx.letterSpacing = '2px';
            ctx.textAlign = 'center';
            ctx.fillText(varsityTag.toUpperCase(), w / 2, 175);
        }
        ctx.textAlign = 'left';

        // 4. Candidate Portrait
        const photo = this.data.photoImg;
        const photoY = 220;
        const photoH = h * 0.48;
        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            this.drawContainedImage(ctx, photo, 100, photoY, w - 200, photoH, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', 100, photoY, w - 200, photoH);
        }

        // 5. Solid Regal Navy Lower Banner (Adjustable, Resizable & Deletable)
        const baseBannerY = photoY + photoH - 60;
        let bannerY = baseBannerY;
        if (this.data.showTemplateRibbon !== false) {
            const rxOffset = this.data.templateRibbonXOffset || 0;
            const ryOffset = this.data.templateRibbonYOffset || 0;
            const rwOffset = this.data.templateRibbonWidthOffset || 0;
            const rhOffset = this.data.templateRibbonHeightOffset || 0;

            const baseCardX = 100;
            const baseCardW = w - 200;
            const baseCardH = h - baseBannerY - 90;

            const cardX = Math.max(0, baseCardX - rwOffset / 2 + rxOffset);
            bannerY = baseBannerY + ryOffset;
            const cardW = Math.max(100, Math.min(w, baseCardW + rwOffset));
            const cardH = Math.max(40, Math.min(h, baseCardH + rhOffset));

            ctx.save();
            ctx.fillStyle = this.data.cardBgColor || pColor;
            ctx.beginPath();
            ctx.roundRect(cardX, bannerY, cardW, cardH, 24);
            ctx.fill();
            ctx.strokeStyle = sColor;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Gold Ribbon Divider
            ctx.fillStyle = sColor;
            ctx.fillRect(w / 2 - 120, bannerY + 125, 240, 6);
            ctx.restore();

            this.recordElementBox('ribbon', cardX, bannerY, cardW, cardH);
        } else {
            bannerY = photoY + photoH - 20;
        }

        // Candidate Name in Serif Authority
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameSize = this.data.nameFontSize || 84;
            const nameX = (w / 2) + (this.data.nameXOffset || 0);
            const nameY = bannerY + 100 + (this.data.nameYOffset || 0);
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.font = `900 ${nameSize}px Georgia, "Plus Jakarta Sans", serif`;
            ctx.textAlign = 'center';
            const nText = this.data.candidateName.toUpperCase();
            ctx.fillText(nText, nameX, nameY);
            const nameMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX - nameMetrics.width / 2, nameY - nameSize * 0.85, nameMetrics.width, nameSize * 1.1);
        }

        // Office
        if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posSize = this.data.positionFontSize || 36;
            const posX = (w / 2) + (this.data.positionXOffset || 0);
            const posY = bannerY + 185 + (this.data.positionYOffset || 0);
            ctx.fillStyle = this.data.positionColor || sColor;
            ctx.font = `bold ${posSize}px Georgia, serif`;
            ctx.letterSpacing = '4px';
            ctx.textAlign = 'center';
            const posText = this.data.position.toUpperCase();
            ctx.fillText(posText, posX, posY);
            const posMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX - posMetrics.width / 2, posY - posSize * 0.85, posMetrics.width, posSize * 1.1);
        }

        // Faculty / Hall
        if (this.data.facultyOrHall) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '1px';
            ctx.textAlign = 'center';
            ctx.fillText(this.data.facultyOrHall.toUpperCase(), w / 2, bannerY + 230);
        }

        // Slogan in Italic Parchment Quote
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan && this.data.slogan.trim()) {
            const slogSize = this.data.sloganFontSize || 32;
            const slogX = 160 + (this.data.sloganXOffset || 0);
            const slogY = bannerY + 310 + (this.data.sloganYOffset || 0);
            ctx.fillStyle = this.data.sloganColor || '#ffffff';
            ctx.font = `italic 500 ${slogSize}px Georgia, serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX, slogY, w - 320, Math.round(slogSize * 1.3));
            this.recordElementBox('slogan', 160, bannerY + 260, w - 320, 100);
        }
        ctx.textAlign = 'left';
    }

    /* -------------------------------------------------------------
       TEMPLATE 8: GRASSROOTS MOVEMENT / SOLIDARITY
       (Warm Sunrise Energy, Activist Stencil Banner, People's Choice)
       ------------------------------------------------------------- */
    renderGrassrootsUnity(ctx, w, h) {
        const pColor = this.data.primaryColor || '#b45309';
        const sColor = this.data.secondaryColor || '#dc2626';

        // 1. Warm Sunrise Gradient
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#78350f');
        grad.addColorStop(0.35, '#b45309');
        grad.addColorStop(0.7, '#991b1b');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. High-Impact Diagonal Stencil Ribbon across Top
        ctx.save();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, 130);
        ctx.lineTo(0, 200);
        ctx.closePath();
        ctx.fill();

        const topHeader = (this.data.tagline || this.data.associationName || '').trim();
        if (topHeader) {
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 42px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '6px';
            ctx.fillText(topHeader.toUpperCase(), 80, 95);
        }
        ctx.restore();

        // 3. Central Candidate Portrait
        const photo = this.data.photoImg;
        const photoY = 190;
        const photoH = h * 0.52;
        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            this.drawContainedImage(ctx, photo, 60, photoY, w - 120, photoH, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', 60, photoY, w - 120, photoH);
        }

        // 4. Heavy Stencil Bottom Plate (Adjustable, Resizable & Deletable)
        const basePlateY = photoY + photoH - 70;
        let plateY = basePlateY;
        if (this.data.showTemplateRibbon !== false) {
            const rxOffset = this.data.templateRibbonXOffset || 0;
            const ryOffset = this.data.templateRibbonYOffset || 0;
            const rwOffset = this.data.templateRibbonWidthOffset || 0;
            const rhOffset = this.data.templateRibbonHeightOffset || 0;

            const cardX = Math.max(0, -rwOffset / 2 + rxOffset);
            plateY = basePlateY + ryOffset;
            const cardW = Math.max(100, Math.min(w * 1.5, w + rwOffset));
            const cardH = Math.max(40, Math.min(h, (h - basePlateY) + rhOffset));

            ctx.save();
            ctx.fillStyle = this.data.cardBgColor || '#090d16';
            ctx.fillRect(cardX, plateY, cardW, cardH);

            // Yellow Action Stripe
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cardX, plateY, cardW, 16);
            ctx.restore();

            this.recordElementBox('ribbon', cardX, plateY, cardW, cardH);
        } else {
            plateY = photoY + photoH - 20;
        }

        // Candidate Full Name (Ultra-Heavy)
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameSize = this.data.nameFontSize || 96;
            const nameX = 80 + (this.data.nameXOffset || 0);
            const nameY = plateY + 115 + (this.data.nameYOffset || 0);
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.font = `900 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.letterSpacing = '-1px';
            const nText = this.data.candidateName.toUpperCase();
            ctx.fillText(nText, nameX, nameY);
            const nameMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX, nameY - nameSize * 0.85, nameMetrics.width, nameSize * 1.1);
        }

        // Position Badge
        if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posSize = this.data.positionFontSize || 46;
            const posX = 80 + (this.data.positionXOffset || 0);
            const posY = plateY + 185 + (this.data.positionYOffset || 0);
            ctx.fillStyle = this.data.positionColor || '#facc15';
            ctx.font = `900 ${posSize}px "Plus Jakarta Sans", sans-serif`;
            const posText = this.data.position.toUpperCase();
            ctx.fillText(posText, posX, posY);
            const posMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX, posY - posSize * 0.85, posMetrics.width, posSize * 1.1);
        }

        // Slogan in Bold Banner
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan && this.data.slogan.trim()) {
            const slogSize = this.data.sloganFontSize || 36;
            const slogBoxY = plateY + 250;
            const slogX = 110 + (this.data.sloganXOffset || 0);
            const slogY = slogBoxY + 52 + (this.data.sloganYOffset || 0);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.beginPath();
            ctx.roundRect(80, slogBoxY, w - 160, 130, 20);
            ctx.fill();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = this.data.sloganColor || '#f8fafc';
            ctx.font = `700 ${slogSize}px "Plus Jakarta Sans", sans-serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX, slogY, w - 220, Math.round(slogSize * 1.25));
            this.recordElementBox('slogan', 80, slogBoxY, w - 160, 130);
        }
    }

    /* -------------------------------------------------------------
       TEMPLATE 9: NEXT-GEN GLASSMORPHISM
       (Translucent Frosted Cards, Mesh Gradient, Futuristic Polish)
       ------------------------------------------------------------- */
    renderFutureForward(ctx, w, h) {
        const pColor = this.data.primaryColor || '#2563eb';
        const sColor = this.data.secondaryColor || '#10b981';

        // 1. Sleek Mesh Gradient Backdrop
        const meshGrad = ctx.createLinearGradient(0, 0, w, h);
        meshGrad.addColorStop(0, '#030712');
        meshGrad.addColorStop(0.4, '#0f172a');
        meshGrad.addColorStop(0.8, '#1e1b4b');
        meshGrad.addColorStop(1, '#022c22');
        ctx.fillStyle = meshGrad;
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // Ambient Mesh Orbs
        ctx.save();
        const orb1 = ctx.createRadialGradient(200, 300, 50, 200, 300, 600);
        orb1.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
        orb1.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = orb1;
        ctx.fillRect(0, 0, w, h);

        const orb2 = ctx.createRadialGradient(w - 200, h - 400, 50, w - 200, h - 400, 700);
        orb2.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        orb2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = orb2;
              // 2. Floating Frosted Glass Header Pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(80, 60, w - 160, 80, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.data.tagline && this.data.customTemplateShowTagline !== false) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '4px';
            const tagX = 120 + (this.data.taglineXOffset || 0);
            const tagY = 110 + (this.data.taglineYOffset || 0);
            const tagText = this.data.tagline.toUpperCase();
            ctx.fillText(tagText, tagX, tagY);
            const tMetrics = ctx.measureText(tagText);
            this.recordElementBox('tagline', tagX, tagY - 24, tMetrics.width, 32);
        }

        const subTag = (this.data.hashtag || '').trim();
        if (subTag) {
            ctx.fillStyle = sColor;
            ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(subTag.toUpperCase(), w - 120, 110);
            ctx.textAlign = 'left';
        }

        // 3. Central Candidate Portrait with Halo Backing
        const photo = this.data.photoImg;
        const photoY = 170;
        const photoH = h * 0.52;
        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            this.drawContainedImage(ctx, photo, 80, photoY, w - 160, photoH, this.data.photoScale, this.data.photoXOffset, this.data.photoYOffset, this.data.photoFitMode || 'contain');
            ctx.restore();
            this.recordElementBox('photo', 80, photoY, w - 160, photoH);
        }

        // 4. Large Translucent Glass Card on Bottom (Adjustable, Resizable & Deletable)
        const baseGlassY = photoY + photoH - 90;
        let glassY = baseGlassY;
        if (this.data.showTemplateRibbon !== false) {
            const rxOffset = this.data.templateRibbonXOffset || 0;
            const ryOffset = this.data.templateRibbonYOffset || 0;
            const rwOffset = this.data.templateRibbonWidthOffset || 0;
            const rhOffset = this.data.templateRibbonHeightOffset || 0;

            const baseCardX = 80;
            const baseCardW = w - 160;
            const baseCardH = h - baseGlassY - 70;

            const cardX = Math.max(0, baseCardX - rwOffset / 2 + rxOffset);
            glassY = baseGlassY + ryOffset;
            const cardW = Math.max(100, Math.min(w, baseCardW + rwOffset));
            const cardH = Math.max(40, Math.min(h, baseCardH + rhOffset));

            ctx.save();
            ctx.fillStyle = this.data.cardBgColor || 'rgba(15, 23, 42, 0.88)';
            ctx.beginPath();
            ctx.roundRect(cardX, glassY, cardW, cardH, 36);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            this.recordElementBox('ribbon', cardX, glassY, cardW, cardH);
        } else {
            glassY = photoY + photoH - 20;
        }

        // Candidate Name with Modern Gradient Look
        if (this.data.customTemplateShowName !== false && this.data.candidateName && this.data.candidateName.trim()) {
            const nameSize = this.data.nameFontSize || 92;
            const nameX = 130 + (this.data.nameXOffset || 0);
            const nameY = glassY + 110 + (this.data.nameYOffset || 0);
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.font = `900 ${nameSize}px "Plus Jakarta Sans", sans-serif`;
            const nText = this.data.candidateName.toUpperCase();
            ctx.fillText(nText, nameX, nameY);
            const nameMetrics = ctx.measureText(nText);
            this.recordElementBox('name', nameX, nameY - nameSize * 0.85, nameMetrics.width, nameSize * 1.1);
        }

        // Office Badge
        if (this.data.customTemplateShowPosition !== false && this.data.position && this.data.position.trim()) {
            const posSize = this.data.positionFontSize || 40;
            const posX = 130 + (this.data.positionXOffset || 0);
            const posY = glassY + 175 + (this.data.positionYOffset || 0);
            ctx.fillStyle = this.data.positionColor || sColor;
            ctx.font = `800 ${posSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.letterSpacing = '2px';
            const posText = this.data.position.toUpperCase();
            ctx.fillText(posText, posX, posY);
            const posMetrics = ctx.measureText(posText);
            this.recordElementBox('position', posX, posY - posSize * 0.85, posMetrics.width, posSize * 1.1);
        }

        // Progressive Slogan Glass Bubble
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan && this.data.slogan.trim()) {
            const slogSize = this.data.sloganFontSize || 32;
            const bubY = glassY + 230;
            const slogX = 160 + (this.data.sloganXOffset || 0);
            const slogY = bubY + 50 + (this.data.sloganYOffset || 0);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(130, bubY, w - 260, 120, 20);
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = this.data.sloganColor || '#e2e8f0';
            ctx.font = `italic 500 ${slogSize}px "Plus Jakarta Sans", sans-serif`;
            this.wrapText(ctx, `“${this.data.slogan}”`, slogX, slogY, w - 320, Math.round(slogSize * 1.3));
            this.recordElementBox('slogan', 130, bubY, w - 260, 120);
        }
        ctx.restore();
    }

    /* Helper: Draw photo fitted inside a box with zoom & pan, ensuring face/head is always visible */
    drawContainedImage(ctx, img, x, y, w, h, scale = 1.0, offsetX = 0, offsetY = 0, fitMode = 'contain') {
        if (img === this.data.photoImg) {
            img = this.getProcessedPhotoImage() || img;
        }
        if (!img) return;

        const imgRatio = img.width / img.height;
        const boxRatio = w / h;
        let renderW, renderH;

        if (fitMode === 'cover') {
            // Cover mode: fill box completely
            if (imgRatio > boxRatio) {
                renderH = h * scale;
                renderW = renderH * imgRatio;
            } else {
                renderW = w * scale;
                renderH = renderW / imgRatio;
            }
        } else {
            // 'contain' mode: ensure entire photo fits within box boundaries
            if (imgRatio > boxRatio) {
                // Wide photo: fit width
                renderW = w * scale;
                renderH = renderW / imgRatio;
            } else {
                // Tall portrait photo: fit height so face and body are fully visible
                renderH = h * scale;
                renderW = renderH * imgRatio;
            }
        }

        const renderX = x + (w - renderW) / 2 + offsetX;
        
        let renderY;
        if (imgRatio < boxRatio) {
            renderY = y + offsetY;
        } else {
            renderY = y + (h - renderH) / 2 + offsetY;
        }

        ctx.drawImage(img, renderX, renderY, renderW, renderH);
    }

    /* Smart Photo Background Cutout & Extraction Studio */
    getProcessedPhotoImage() {
        const photo = this.data.photoImg;
        if (!photo) return null;
        if (!this.data.removePhotoBg) {
            return photo;
        }

        const cacheKey = `${photo.src || 'custom'}_${this.data.photoBgKeyColor}_${this.data.photoBgTolerance}_${this.data.photoBgSmoothness}_${this.data.photoBackdropColor}_${this.data.photoBgConnectedOnly}`;
        if (this._cutoutCacheKey === cacheKey && this._cutoutCanvas) {
            return this._cutoutCanvas;
        }

        try {
            const offCanvas = document.createElement('canvas');
            let pw = photo.naturalWidth || photo.width || 800;
            let ph = photo.naturalHeight || photo.height || 1000;
            const maxDim = 1200;
            if (pw > maxDim || ph > maxDim) {
                if (pw > ph) {
                    ph = Math.round((ph * maxDim) / pw);
                    pw = maxDim;
                } else {
                    pw = Math.round((pw * maxDim) / ph);
                    ph = maxDim;
                }
            }
            offCanvas.width = pw;
            offCanvas.height = ph;
            const oCtx = offCanvas.getContext('2d');
            oCtx.drawImage(photo, 0, 0, pw, ph);

            const imgData = oCtx.getImageData(0, 0, pw, ph);
            const data = imgData.data;
            const hex = this.data.photoBgKeyColor || '#ffffff';
            let kr = parseInt(hex.slice(1, 3), 16);
            let kg = parseInt(hex.slice(3, 5), 16);
            let kb = parseInt(hex.slice(5, 7), 16);
            if (isNaN(kr)) kr = 255;
            if (isNaN(kg)) kg = 255;
            if (isNaN(kb)) kb = 255;

            // Map tolerance 0-100 to calibrated Euclidean distance (max ~190 for clean studio background)
            const userTol = this.data.photoBgTolerance !== undefined ? this.data.photoBgTolerance : 25;
            const tol = (userTol / 100) * 190;
            const smooth = ((this.data.photoBgSmoothness || 10) / 100) * 50;
            const tolMax = tol + smooth;

            const connectedOnly = this.data.photoBgConnectedOnly !== false; // Default: true (protects interior clothes & details)
            const isKeyNeutral = Math.abs(kr - kg) < 20 && Math.abs(kr - kb) < 20;

            // Optional replacement backdrop tint
            const replaceBg = this.data.photoBackdropColor && this.data.photoBackdropColor !== 'transparent';
            let tr = 0, tg = 0, tb = 0;
            if (replaceBg) {
                const thex = this.data.photoBackdropColor;
                tr = parseInt(thex.slice(1, 3), 16) || 0;
                tg = parseInt(thex.slice(3, 5), 16) || 0;
                tb = parseInt(thex.slice(5, 7), 16) || 0;
            }

            const totalPixels = pw * ph;

            if (connectedOnly) {
                // BFS Flood Fill from outer edges (Perimeter)
                // Ensures the cutout ONLY applies to contiguous background touching the photo edges.
                // Enclosed regions (candidate's white shirt, collar, tie, teeth, highlights) are NEVER touched!
                const isBg = new Uint8Array(totalPixels);
                const queue = new Int32Array(totalPixels);
                let qHead = 0;
                let qTail = 0;

                function matchesKey(idx) {
                    const i4 = idx << 2;
                    const r = data[i4], g = data[i4 + 1], b = data[i4 + 2];
                    const dr = r - kr;
                    const dg = g - kg;
                    const db = b - kb;
                    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
                    if (dist > tol) return false;
                    if (isKeyNeutral) {
                        const chroma = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
                        if (chroma > 20) return false; // Reject skin, tie, or colored clothing from background
                    }
                    return true;
                }

                // 1. Seed top edge
                for (let x = 0; x < pw; x++) {
                    const idx = x;
                    if (matchesKey(idx)) {
                        isBg[idx] = 2;
                        queue[qTail++] = idx;
                    }
                }

                // 2. Seed left & right edges
                for (let y = 0; y < ph; y++) {
                    const idxL = y * pw;
                    if (isBg[idxL] === 0 && matchesKey(idxL)) {
                        isBg[idxL] = 2;
                        queue[qTail++] = idxL;
                    }
                    const idxR = y * pw + (pw - 1);
                    if (isBg[idxR] === 0 && matchesKey(idxR)) {
                        isBg[idxR] = 2;
                        queue[qTail++] = idxR;
                    }
                }

                // 3. Seed bottom corners (left 25% and right 25% of bottom edge)
                const cornerW = Math.floor(pw * 0.25);
                const botRow = (ph - 1) * pw;
                for (let x = 0; x < cornerW; x++) {
                    const idx = botRow + x;
                    if (isBg[idx] === 0 && matchesKey(idx)) {
                        isBg[idx] = 2;
                        queue[qTail++] = idx;
                    }
                }
                for (let x = pw - cornerW; x < pw; x++) {
                    const idx = botRow + x;
                    if (isBg[idx] === 0 && matchesKey(idx)) {
                        isBg[idx] = 2;
                        queue[qTail++] = idx;
                    }
                }

                // 4. Run BFS
                while (qHead < qTail) {
                    const curr = queue[qHead++];
                    isBg[curr] = 1;

                    const cx = curr % pw;
                    const cy = (curr / pw) | 0;

                    // Left
                    if (cx > 0) {
                        const n = curr - 1;
                        if (isBg[n] === 0 && matchesKey(n)) {
                            isBg[n] = 2;
                            queue[qTail++] = n;
                        }
                    }
                    // Right
                    if (cx < pw - 1) {
                        const n = curr + 1;
                        if (isBg[n] === 0 && matchesKey(n)) {
                            isBg[n] = 2;
                            queue[qTail++] = n;
                        }
                    }
                    // Up
                    if (cy > 0) {
                        const n = curr - pw;
                        if (isBg[n] === 0 && matchesKey(n)) {
                            isBg[n] = 2;
                            queue[qTail++] = n;
                        }
                    }
                    // Down
                    if (cy < ph - 1) {
                        const n = curr + pw;
                        if (isBg[n] === 0 && matchesKey(n)) {
                            isBg[n] = 2;
                            queue[qTail++] = n;
                        }
                    }
                }

                // 5. Apply cutout ONLY to visited background pixels
                for (let idx = 0; idx < totalPixels; idx++) {
                    if (isBg[idx] === 1) {
                        const i4 = idx << 2;
                        if (replaceBg) {
                            data[i4] = tr;
                            data[i4 + 1] = tg;
                            data[i4 + 2] = tb;
                            data[i4 + 3] = 255;
                        } else {
                            data[i4 + 3] = 0; // 100% Transparent
                        }
                    }
                }

                // 6. Anti-Aliasing Matte Choke & Edge De-Fringing (Permanently eliminates white lines at the edges!)
                if (!replaceBg) {
                    for (let pass = 0; pass < 2; pass++) {
                        const borderIndices = [];
                        for (let idx = 0; idx < totalPixels; idx++) {
                            const i4 = idx << 2;
                            if (data[i4 + 3] > 0) {
                                const cx = idx % pw;
                                const cy = (idx / pw) | 0;
                                const touchesTrans = (cx > 0 && data[(idx - 1) * 4 + 3] === 0) ||
                                                     (cx < pw - 1 && data[(idx + 1) * 4 + 3] === 0) ||
                                                     (cy > 0 && data[(idx - pw) * 4 + 3] === 0) ||
                                                     (cy < ph - 1 && data[(idx + pw) * 4 + 3] === 0);
                                if (touchesTrans) {
                                    borderIndices.push(idx);
                                }
                            }
                        }

                        for (let b = 0; b < borderIndices.length; b++) {
                            const idx = borderIndices[b];
                            const i4 = idx << 2;
                            const r = data[i4], g = data[i4 + 1], bCol = data[i4 + 2];
                            const dr = r - kr, dg = g - kg, db = bCol - kb;
                            const dist = Math.sqrt(dr * dr + dg * dg + db * db);
                            const chroma = Math.max(Math.abs(r - g), Math.abs(r - bCol), Math.abs(g - bCol));

                            // If border pixel is light/white fringe from original backdrop, erode it completely
                            if (dist < 145 && chroma < 28) {
                                data[i4 + 3] = 0; // Strip white fringe halo
                            } else if (dist < 175) {
                                // Smooth feathering without white edge
                                const alphaRatio = Math.max(0.2, Math.min(1.0, (dist - 80) / 95));
                                data[i4 + 3] = Math.round(data[i4 + 3] * alphaRatio);
                            }
                        }
                    }
                }
            } else {
                // Global color distance fallback (if connectedOnly is false)
                for (let i = 0; i < data.length; i += 4) {
                    const dr = data[i] - kr;
                    const dg = data[i + 1] - kg;
                    const db = data[i + 2] - kb;
                    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

                    if (replaceBg) {
                        if (dist <= tol) {
                            data[i] = tr;
                            data[i + 1] = tg;
                            data[i + 2] = tb;
                            data[i + 3] = 255;
                        } else if (dist < tol + smooth && smooth > 0) {
                            const alphaRatio = (dist - tol) / smooth;
                            const tRatio = 1 - alphaRatio;
                            data[i] = Math.round(data[i] * (1 - tRatio) + tr * tRatio);
                            data[i + 1] = Math.round(data[i + 1] * (1 - tRatio) + tg * tRatio);
                            data[i + 2] = Math.round(data[i + 2] * (1 - tRatio) + tb * tRatio);
                        }
                    } else {
                        if (dist <= tol) {
                            data[i + 3] = 0;
                        } else if (dist < tol + smooth && smooth > 0) {
                            const alphaRatio = (dist - tol) / smooth;
                            data[i + 3] = Math.round(data[i + 3] * alphaRatio);
                        }
                    }
                }
            }

            oCtx.putImageData(imgData, 0, 0);
            this._cutoutCanvas = offCanvas;
            this._cutoutCacheKey = cacheKey;
            return offCanvas;
        } catch (e) {
            return photo;
        }
    }

    drawCandidatePhoto(ctx, x, y, w, h, options = {}) {
        if (!this.data.photoImg) return;
        const scale = options.scale !== undefined ? options.scale : (this.data.photoScale || 1.0);
        const offsetX = options.offsetX !== undefined ? options.offsetX : (this.data.photoXOffset || 0);
        const offsetY = options.offsetY !== undefined ? options.offsetY : (this.data.photoYOffset || 0);
        const fitMode = options.fitMode || this.data.photoFitMode || 'contain';
        const contrast = this.data.photoContrast !== undefined ? this.data.photoContrast : 100;
        const brightness = this.data.photoBrightness !== undefined ? this.data.photoBrightness : 100;
        const saturate = this.data.photoSaturate !== undefined ? this.data.photoSaturate : 100;
        const flipH = this.data.photoFlipH || false;
        const blendMode = this.data.photoBlendMode || 'normal';
        const backdrop = this.data.photoBackdropColor;
        const bottomFade = this.data.photoBottomFade || 0;

        const photoToDraw = this.getProcessedPhotoImage();
        if (!photoToDraw) return;

        ctx.save();

        // 1. Optional Backdrop Tint Behind Candidate (Only if NOT in cutout mode; in cutout mode, replacement tint replaces removed BG pixels directly)
        if (backdrop && backdrop !== 'transparent' && !this.data.removePhotoBg) {
            ctx.fillStyle = backdrop;
            ctx.fillRect(x, y, w, h);
        }

        // 2. Blend Mode
        if (blendMode && blendMode !== 'normal') {
            ctx.globalCompositeOperation = blendMode;
        }

        // 3. Contrast, Brightness & Saturation Filters
        if (ctx.filter !== undefined) {
            ctx.filter = `contrast(${contrast}%) brightness(${brightness}%) saturate(${saturate}%)`;
        }

        // 4. Draw Photo with optional horizontal mirror flip
        if (flipH) {
            ctx.save();
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            this.drawContainedImage(ctx, photoToDraw, 0, 0, w, h, scale, -offsetX, offsetY, fitMode);
            ctx.restore();
        } else {
            this.drawContainedImage(ctx, photoToDraw, x, y, w, h, scale, offsetX, offsetY, fitMode);
        }

        ctx.restore();

        // 5. Optional Bottom Fade (Gradient Feathering into Background)
        if (bottomFade > 0) {
            ctx.save();
            const fadeGrad = ctx.createLinearGradient(0, y + h - bottomFade, 0, y + h);
            const fadeColor = this.data.cardBgColor || '#ffffff';
            fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
            fadeGrad.addColorStop(1, fadeColor);
            ctx.fillStyle = fadeGrad;
            ctx.fillRect(x - 50, y + h - bottomFade, w + 100, bottomFade + 5);
            ctx.restore();
        }
    }

    /* -------------------------------------------------------------------------
       AUTHENTIC CAMPUS SERIES 1: PRESIDENTIAL LANDMARK (Mbabali Keneth Style)
       Top-heavy dual-tone name, tower watermark, flanking crests, bottom banners
       ------------------------------------------------------------------------- */
    renderPresidentialLandmark(ctx, w, h) {
        const pColor = this.data.primaryColor || '#0f2b5c'; // Navy
        const sColor = this.data.secondaryColor || '#dc2626'; // Crimson Red
        const accent = this.data.bannerColor || this.data.accentColor || '#16a34a'; // Vibrant Green

        // 1. Clean crisp studio background
        ctx.fillStyle = this.data.cardBgColor || '#ffffff';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Soft Ivory Tower Watermark
        if (this.data.showWatermark !== false) {
            this.drawIvoryTowerWatermark(ctx, w * 0.5, h * 0.44, w * 0.00095, 0.12);
        }

        // 3. Header: Candidate Name at the VERY TOP
        const nameParts = (this.data.candidateName || "").trim().split(' ').filter(Boolean);
        if (nameParts.length > 0) {
            const surname = nameParts[0].toUpperCase();
            const otherNames = nameParts.slice(1).join(' ').toUpperCase();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const nameX = w * 0.5 + (this.data.nameXOffset || 0);
            const nameY = 55 + (this.data.nameYOffset || 0);
            const nameSize = this.data.nameFontSize || 135;

            // Surname in massive primary color
            ctx.fillStyle = this.data.nameColor || pColor;
            ctx.font = `900 ${nameSize}px "Montserrat", sans-serif`;
            ctx.letterSpacing = '4px';
            ctx.fillText(surname, nameX, nameY);

            // Given names in bold secondary color with tracking
            if (otherNames) {
                const secondarySize = Math.round(nameSize * 0.52);
                ctx.fillStyle = this.data.secondaryNameColor || sColor;
                ctx.font = `900 ${secondarySize}px "Montserrat", sans-serif`;
                ctx.letterSpacing = '14px';
                ctx.fillText(otherNames, nameX, nameY + nameSize + 15);
            }
            ctx.letterSpacing = '0px';

            this.recordElementBox('name', nameX - w * 0.44, nameY, w * 0.88, nameSize + 50);
        }

        // 4. Candidate Photo in center frame
        const photoY = 295;
        const photoH = h * 0.53;
        if (this.data.photoImg) {
            this.drawCandidatePhoto(ctx, w * 0.12, photoY, w * 0.76, photoH, {
                scale: this.data.photoScale || 1.0,
                offsetX: this.data.photoXOffset || 0,
                offsetY: this.data.photoYOffset || 0,
                fitMode: this.data.photoFitMode || 'contain'
            });
            this.recordElementBox('photo', w * 0.12, photoY, w * 0.76, photoH);
        }

        // 5. Flanking Institutional Badges (Left: Crest, Right: Association Logo)
        if (this.data.showBadges !== false) {
            this.drawUniversityCrest(ctx, w * 0.13, photoY + photoH * 0.35, 68, "");
            if (this.data.associationAcronym) {
                this.drawAssociationLogo(ctx, w * 0.87, photoY + photoH * 0.35, 68, this.data.associationAcronym);
            }
        }

        // 6. Bottom Position Banner Stack (Adjustable, Resizable & Deletable)
        const baseBanner1Y = h * 0.735;
        const banner1Y = baseBanner1Y + (this.data.templateRibbonYOffset || 0);
        const banner1H = Math.max(40, (h * 0.11) + (this.data.templateRibbonHeightOffset || 0));
        const bannerW = Math.max(200, w + (this.data.templateRibbonWidthOffset || 0));
        const bannerX = Math.round((w - bannerW) / 2) + (this.data.templateRibbonXOffset || 0);

        if (this.data.showTemplateRibbon !== false) {
            ctx.fillStyle = accent;
            ctx.fillRect(bannerX, banner1Y, bannerW, banner1H);
            this.recordElementBox('ribbon', bannerX, banner1Y, bannerW, banner1H);
        }

        if (this.data.position) {
            const posX = w * 0.5 + (this.data.positionXOffset || 0);
            const posSize = this.data.positionFontSize || 120;
            ctx.fillStyle = this.data.positionColor || '#ffffff';
            ctx.font = `900 ${posSize}px "Montserrat", sans-serif`;
            ctx.letterSpacing = '6px';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.data.position.toUpperCase(), posX, banner1Y + banner1H * 0.5);
            this.recordElementBox('position', posX - w * 0.45, banner1Y, w * 0.9, banner1H);
        }

        // Sub-Banner (Deep Navy: Association Name & Acronym)
        const banner2Y = banner1Y + banner1H;
        const banner2H = h * 0.115;
        if (this.data.showTemplateRibbon !== false) {
            ctx.fillStyle = pColor;
            ctx.fillRect(bannerX, banner2Y, bannerW, banner2H);
        }

        if (this.data.associationName) {
            ctx.fillStyle = this.data.subPositionColor || '#f8fafc';
            ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
            ctx.letterSpacing = '2px';
            ctx.textAlign = 'center';
            ctx.fillText(this.data.associationName.toUpperCase(), w * 0.5, banner2Y + 34);
        }

        if (this.data.associationAcronym) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 72px "Montserrat", sans-serif';
            ctx.letterSpacing = '8px';
            ctx.textAlign = 'center';
            ctx.fillText(this.data.associationAcronym.toUpperCase(), w * 0.5, banner2Y + 84);
        }

        // Bottom Strip: Slogan
        const banner3Y = banner2Y + banner2H;
        const banner3H = h - banner3Y;
        ctx.fillStyle = accent;
        ctx.fillRect(0, banner3Y, w, banner3H);

        if (this.data.slogan) {
            const slogX = w * 0.5 + (this.data.sloganXOffset || 0);
            const sloganSize = this.data.sloganFontSize || 34;
            ctx.fillStyle = this.data.sloganColor || '#ffffff';
            ctx.font = `800 ${sloganSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.letterSpacing = '4px';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.data.slogan.toUpperCase(), slogX, banner3Y + banner3H * 0.5 + (this.data.sloganYOffset || 0));
            ctx.letterSpacing = '0px';
            this.recordElementBox('slogan', slogX - w * 0.45, banner3Y + (this.data.sloganYOffset || 0), w * 0.9, banner3H);
        }
    }

    /* -------------------------------------------------------------------------
       AUTHENTIC CAMPUS SERIES 2: DYNAMIC DIAGONAL WAVE GRC
       Diagonal wave slice, VOTE 26|27 pill, stacked two-tone name, verified badge
       ------------------------------------------------------------------------- */
    renderDiagonalWaveGRC(ctx, w, h) {
        const brandMagenta = this.data.primaryColor || '#c026d3';
        const darkNavy = '#0f172a';

        // 1. Background
        ctx.fillStyle = this.data.cardBgColor || '#ffffff';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Soft Ivory Tower watermark in top right
        if (this.data.showWatermark !== false) {
            this.drawIvoryTowerWatermark(ctx, w * 0.62, h * 0.28, w * 0.00065, 0.10);
        }

        // 3. Diagonal Dynamic Wave Cut (Bottom right in magenta - Adjustable, Resizable & Deletable)
        if (this.data.showTemplateRibbon !== false) {
            ctx.save();
            const waveYOffset = this.data.templateRibbonYOffset || 0;
            const waveXOffset = this.data.templateRibbonXOffset || 0;
            ctx.translate(waveXOffset, waveYOffset);
            ctx.beginPath();
            ctx.moveTo(w * 0.44, h * 0.64);
            ctx.bezierCurveTo(w * 0.65, h * 0.52, w * 0.85, h * 0.42, w, h * 0.32);
            ctx.lineTo(w, h);
            ctx.lineTo(w * 0.08, h);
            ctx.bezierCurveTo(w * 0.22, h * 0.82, w * 0.32, h * 0.72, w * 0.44, h * 0.64);
            ctx.closePath();
            ctx.fillStyle = this.data.bannerColor || brandMagenta;
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 10;
            ctx.fill();
            ctx.restore();
            this.recordElementBox('ribbon', w * 0.15 + waveXOffset, h * 0.45 + waveYOffset, w * 0.85, h * 0.55);
        }

        // 4. Top Header Bar
        // Top Left: Crest + Session
        if (this.data.showBadges !== false) {
            this.drawUniversityCrest(ctx, 110, 100, 44, "");
        }
        const sessionHeader = (this.data.sessionName || "").trim();
        if (sessionHeader) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = darkNavy;
            ctx.letterSpacing = '1px';
            ctx.fillText(sessionHeader.toUpperCase(), 170, 100);
        }

        // Top Right: Hashtag
        const hashtagText = (this.data.hashtag || "").trim();
        if (hashtagText) {
            ctx.textAlign = 'right';
            ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = darkNavy;
            ctx.fillText(hashtagText.startsWith('#') ? hashtagText : '#' + hashtagText, w - 80, 100);
            ctx.letterSpacing = '0px';
        }

        // 5. Candidate Photo on Left Half
        if (this.data.photoImg) {
            this.drawCandidatePhoto(ctx, 40, 160, w * 0.52, h * 0.78, {
                scale: this.data.photoScale || 1.0,
                offsetX: this.data.photoXOffset || 0,
                offsetY: this.data.photoYOffset || 0,
                fitMode: this.data.photoFitMode || 'contain'
            });
            this.recordElementBox('photo', 40, 160, w * 0.52, h * 0.78);
        }

        // 6. Right Content Column
        const rcX = w * 0.54;
        let curY = (h * 0.26) + (this.data.nameYOffset || 0);

        // "VOTE [session]" Pill Badge (Dynamic, Movable & Deletable)
        if (this.data.showVotePill !== false) {
            const pillX = rcX + (this.data.votePillXOffset || 0);
            const pillY = curY + (this.data.votePillYOffset || 0);
            const sessionText = (this.data.sessionName || "").trim();
            const pillW = sessionText ? Math.max(260, 140 + sessionText.length * 15) : 180;
            const pillH = 58;

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 29);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#e2e8f0';
            ctx.stroke();

            ctx.font = '900 28px "Montserrat", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.data.bannerColor || brandMagenta;
            ctx.fillText("VOTE", pillX + 24, pillY + pillH * 0.5);

            if (sessionText) {
                // Session pill inside
                const innerW = pillW - 120;
                ctx.beginPath();
                ctx.roundRect(pillX + 110, pillY + 6, innerW, pillH - 12, 18);
                ctx.fillStyle = this.data.bannerColor || brandMagenta;
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = '800 22px "Montserrat", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(sessionText, pillX + 110 + innerW * 0.5, pillY + pillH * 0.5);
            }
            ctx.restore();

            this.recordElementBox('vote_pill', pillX, pillY, pillW, pillH);
        }

        curY += 120;

        // Giant Stacked Two-Tone Name
        const nameParts = (this.data.candidateName || "").trim().split(' ').filter(Boolean);
        if (nameParts.length > 0) {
            const fn = nameParts[0].toUpperCase();
            const sn = nameParts.slice(1).join(' ').toUpperCase();

            const nameX = rcX + (this.data.nameXOffset || 0);
            const nameSize = this.data.nameFontSize || 115;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.font = `900 ${nameSize}px "Montserrat", sans-serif`;
            ctx.letterSpacing = '1px';
            ctx.fillStyle = this.data.nameColor || brandMagenta;
            ctx.fillText(fn, nameX, curY);

            if (sn) {
                curY += (nameSize * 0.9);
                ctx.fillStyle = this.data.secondaryNameColor || darkNavy;
                ctx.fillText(sn, nameX, curY);
            }
            ctx.letterSpacing = '0px';
            this.recordElementBox('name', nameX, curY - (nameSize * 1.9), w * 0.44, nameSize * 2.1);
        }

        // Script accent
        if (this.data.greetingScript) {
            const scriptSize = this.data.scriptFontSize || 75;
            curY += (scriptSize * 0.95) + (this.data.scriptYOffset || 0);
            const scriptX = rcX + 140 + (this.data.scriptXOffset || 0);
            ctx.font = `italic ${scriptSize}px "Alex Brush", cursive`;
            ctx.fillStyle = this.data.scriptColor || '#ffffff';
            ctx.fillText(this.data.greetingScript, scriptX, curY);
            this.recordElementBox('script', scriptX, curY - scriptSize, w * 0.25, scriptSize * 1.2);
        }

        // Gold Verified Badge: Position Title
        if (this.data.position) {
            curY += 45 + (this.data.positionYOffset || 0);
            const posX = rcX + (this.data.positionXOffset || 0);
            const badgeW = w * 0.40;
            const badgeH = 88;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(posX, curY, badgeW, badgeH, 18);
            const goldGrad = ctx.createLinearGradient(posX, curY, posX + badgeW, curY);
            goldGrad.addColorStop(0, '#ffffff');
            goldGrad.addColorStop(1, '#fef08a');
            ctx.fillStyle = goldGrad;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#facc15';
            ctx.stroke();

            // Verified Shield Vector Icon
            const iconX = posX + 35;
            const iconY = curY + badgeH * 0.5;
            ctx.fillStyle = this.data.positionColor || brandMagenta;
            ctx.beginPath();
            ctx.arc(iconX, iconY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 18px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("V", iconX, iconY);

            // Position text inside verified badge
            const posSize = this.data.positionFontSize || 40;
            ctx.fillStyle = this.data.positionColor || brandMagenta;
            ctx.font = `900 ${posSize}px "Montserrat", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.data.position.toUpperCase(), posX + badgeW * 0.55, curY + badgeH * 0.5);
            ctx.restore();
            this.recordElementBox('position', posX, curY, badgeW, badgeH);
        }

        // Sub-Constituency
        if (this.data.subPosition) {
            curY += 128;
            ctx.textAlign = 'left';
            ctx.fillStyle = this.data.subPositionColor || '#fef08a';
            ctx.font = '900 34px "Montserrat", sans-serif';
            ctx.letterSpacing = '2px';
            ctx.fillText(this.data.subPosition.toUpperCase(), rcX, curY);
            ctx.letterSpacing = '0px';
        }
    }

    /* -------------------------------------------------------------------------
       AUTHENTIC CAMPUS SERIES 3: GOODWILL & NEW MONTH MOBILIZER
       Script accent, hollow outline month, inspiring paragraph, course badge
       ------------------------------------------------------------------------- */
    renderGoodwillGreeting(ctx, w, h) {
        const darkNavy = this.data.primaryColor || '#0a192f';
        const deepBlue = '#061325';

        // 1. Studio Dark Navy Gradient Background
        const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 100, w * 0.5, h * 0.5, w * 0.75);
        bgGrad.addColorStop(0, '#112240');
        bgGrad.addColorStop(0.6, darkNavy);
        bgGrad.addColorStop(1, deepBlue);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Top-Left College Crest & Name
        if (this.data.showBadges !== false) {
            this.drawUniversityCrest(ctx, 110, 110, 48, "");
        }
        const collegeText = (this.data.facultyOrHall || this.data.associationName || "").trim();
        const univText = (this.data.institutionName || this.data.sessionName || "").trim();
        if (collegeText || univText) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.letterSpacing = '2px';
            if (collegeText && univText) {
                ctx.fillText(collegeText.toUpperCase(), 175, 100);
                ctx.fillText(univText.toUpperCase(), 175, 130);
            } else {
                ctx.fillText((collegeText || univText).toUpperCase(), 175, 115);
            }
            ctx.letterSpacing = '0px';
        }

        // 3. Candidate Portrait (Centered, head and smile clearly framed)
        const photoY = 160;
        const photoH = h * 0.58;
        if (this.data.photoImg) {
            this.drawCandidatePhoto(ctx, w * 0.15, photoY, w * 0.70, photoH, {
                scale: this.data.photoScale || 1.0,
                offsetX: this.data.photoXOffset || 0,
                offsetY: this.data.photoYOffset || 0,
                fitMode: this.data.photoFitMode || 'contain'
            });
            this.recordElementBox('photo', w * 0.15, photoY, w * 0.70, photoH);
        }

        // 4. Center-Lower Frosted Dark Card (Adjustable, Resizable & Deletable)
        const baseCardY = h * 0.56;
        const cardY = baseCardY + (this.data.templateRibbonYOffset || 0);
        const cardH = Math.max(100, (h * 0.37) + (this.data.templateRibbonHeightOffset || 0));
        const cardW = Math.max(200, w + (this.data.templateRibbonWidthOffset || 0));
        const cardX = Math.round((w - cardW) / 2) + (this.data.templateRibbonXOffset || 0);

        if (this.data.showTemplateRibbon !== false) {
            const cardGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
            cardGrad.addColorStop(0, 'rgba(10, 25, 47, 0.70)');
            cardGrad.addColorStop(0.4, this.data.cardBgColor ? this.data.cardBgColor : 'rgba(10, 25, 47, 0.95)');
            cardGrad.addColorStop(1, '#071324');
            ctx.fillStyle = cardGrad;
            ctx.fillRect(cardX, cardY, cardW, cardH);
            this.recordElementBox('ribbon', cardX, cardY, cardW, cardH);
        }

        // 5. Script Calligraphy Accent
        if (this.data.greetingScript) {
            const scriptSize = this.data.scriptFontSize || 125;
            const scriptY = cardY + 20 + (this.data.scriptYOffset || 0);
            const scriptX = w * 0.10 + (this.data.scriptXOffset || 0);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.font = `italic ${scriptSize}px "Alex Brush", cursive`;
            ctx.fillStyle = this.data.scriptColor || '#ffffff';
            ctx.fillText(this.data.greetingScript, scriptX, scriptY);
            this.recordElementBox('script', scriptX, scriptY - scriptSize, w * 0.45, scriptSize * 1.2);
        }

        // 6. Giant Hollow Outline Title
        if (this.data.greetingTitle) {
            const titleSize = this.data.titleFontSize || 130;
            const titleY = cardY + 115 + (this.data.titleYOffset || 0);
            const titleX = w * 0.10 + (this.data.titleXOffset || 0);
            ctx.font = `900 ${titleSize}px "Montserrat", sans-serif`;
            ctx.letterSpacing = '6px';
            ctx.lineWidth = 4;
            ctx.strokeStyle = this.data.titleColor || '#ffffff';
            ctx.strokeText(this.data.greetingTitle.toUpperCase(), titleX, titleY);
            ctx.letterSpacing = '0px';
            this.recordElementBox('title', titleX, titleY - titleSize, w * 0.8, titleSize * 1.2);
        }

        // 7. Inspiring Paragraph Card
        const msg = (this.data.goodwillMessage || "").trim();
        if (msg) {
            const quoteSize = this.data.quoteFontSize || 25;
            const quoteY = cardY + 175 + (this.data.quoteYOffset || 0);
            const quoteX = w * 0.5 + (this.data.quoteXOffset || 0);
            ctx.textAlign = 'center';
            ctx.font = `500 ${quoteSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = this.data.quoteColor || '#e2e8f0';
            this.wrapText(ctx, msg, quoteX, quoteY, w * 0.82, Math.round(quoteSize * 1.44));
            this.recordElementBox('quote', quoteX - w * 0.42, quoteY - 15, w * 0.84, 120);
        }

        // 8. Giant Bold Candidate Name
        const nameParts = (this.data.candidateName || "").trim().split(' ').filter(Boolean);
        if (nameParts.length > 0) {
            const fn = nameParts[0].toUpperCase();
            const sn = nameParts.slice(1).join(' ').toUpperCase();

            const nameSize = this.data.nameFontSize || 120;
            const nameY = cardY + 310 + (this.data.nameYOffset || 0);
            const nameX = w * 0.5 + (this.data.nameXOffset || 0);
            ctx.textAlign = 'center';
            ctx.font = `900 ${nameSize}px "Montserrat", sans-serif`;
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.letterSpacing = '3px';
            ctx.fillText(fn, nameX, nameY);

            if (sn) {
                const subNameSize = Math.round(nameSize * 0.38);
                ctx.font = `800 ${subNameSize}px "Montserrat", sans-serif`;
                ctx.fillStyle = this.data.secondaryNameColor || '#f8fafc';
                ctx.letterSpacing = '8px';
                ctx.fillText(sn, nameX, nameY + 60);
            }
            ctx.letterSpacing = '0px';
            this.recordElementBox('name', nameX - w * 0.45, nameY - nameSize, w * 0.9, nameSize * 1.6);
        }

        // 9. Bottom Program / Year Strip
        if (this.data.courseYear) {
            const botBarH = h * 0.07;
            const botBarY = h - botBarH;
            ctx.fillStyle = this.data.bannerColor || '#0f2b5c';
            ctx.fillRect(0, botBarY, w, botBarH);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '900 42px "Montserrat", sans-serif';
            ctx.fillStyle = this.data.courseYearColor || '#ffffff';
            ctx.letterSpacing = '6px';
            ctx.fillText(this.data.courseYear.toUpperCase(), w * 0.5, botBarY + botBarH * 0.5);
            ctx.letterSpacing = '0px';
        }
    }

    /* -------------------------------------------------------------------------
       AUTHENTIC CAMPUS SERIES 4: ASYMMETRIC HALL & FACULTY CARD
       Teal gradient, twin mascots, quote glass card, script accent
       ------------------------------------------------------------------------- */
    renderAsymmetricCard(ctx, w, h) {
        const tealMain = this.data.primaryColor || '#0d9488';
        const deepNavy = '#0a1d37';

        // 1. Rich Teal to Navy Background
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#2dd4bf');
        bgGrad.addColorStop(0.3, tealMain);
        bgGrad.addColorStop(1, deepNavy);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // Soft ambient light flare at top center
        const flare = ctx.createRadialGradient(w * 0.60, 180, 10, w * 0.60, 180, 450);
        flare.addColorStop(0, 'rgba(255,255,255,0.7)');
        flare.addColorStop(0.3, 'rgba(255,255,255,0.2)');
        flare.addColorStop(1, 'transparent');
        ctx.fillStyle = flare;
        ctx.fillRect(0, 0, w, h);

        // 2. Top-Left Twin Badges
        this.drawUniversityCrest(ctx, 110, 100, 42, "");
        this.drawComplexCrocodile(ctx, 220, 100, 42);

        // 3. Right-Side Candidate Portrait
        if (this.data.photoImg) {
            this.drawCandidatePhoto(ctx, w * 0.38, 140, w * 0.60, h * 0.80, {
                scale: this.data.photoScale || 1.0,
                offsetX: this.data.photoXOffset || 0,
                offsetY: this.data.photoYOffset || 0,
                fitMode: this.data.photoFitMode || 'contain'
            });
            this.recordElementBox('photo', w * 0.38, 140, w * 0.60, h * 0.80);
        }

        // 4. Left Column: Greeting & Frosted Quote Box
        if (this.data.greetingScript) {
            const scriptSize = this.data.scriptFontSize || 95;
            const scriptY = 270 + (this.data.scriptYOffset || 0);
            const scriptX = 100 + (this.data.scriptXOffset || 0);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.font = `italic ${scriptSize}px "Alex Brush", cursive`;
            ctx.fillStyle = this.data.scriptColor || deepNavy;
            ctx.fillText(this.data.greetingScript, scriptX, scriptY);
            this.recordElementBox('script', scriptX, scriptY - scriptSize, w * 0.35, scriptSize * 1.2);
        }

        if (this.data.greetingTitle) {
            const titleSize = this.data.titleFontSize || 55;
            const titleX = 210 + (this.data.titleXOffset || 0);
            ctx.font = `900 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = this.data.titleColor || '#ffffff';
            ctx.fillText(this.data.greetingTitle, titleX, 310 + (this.data.titleYOffset || 0));
            this.recordElementBox('title', titleX, 310 - titleSize, w * 0.35, titleSize * 1.2);
        }

        // Rounded Glass Card (Adjustable, Resizable & Deletable)
        const msg = (this.data.goodwillMessage || "").trim();
        const baseCardX = 70;
        const cardX = baseCardX + (this.data.quoteXOffset || 0) + (this.data.templateRibbonXOffset || 0);
        const cardY = 380 + (this.data.quoteYOffset || 0) + (this.data.templateRibbonYOffset || 0);
        const cardW = Math.max(150, (w * 0.44) + (this.data.templateRibbonWidthOffset || 0));
        const cardH = Math.max(100, 460 + (this.data.templateRibbonHeightOffset || 0));

        if (this.data.showTemplateRibbon !== false && (msg || this.data.facultyOrHall)) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 24);
            ctx.fillStyle = this.data.cardBgColor || 'rgba(10, 29, 55, 0.65)';
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.stroke();

            // Card Content
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (this.data.facultyOrHall) {
                ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
                ctx.fillStyle = '#5eead4';
                ctx.fillText(this.data.facultyOrHall, cardX + cardW * 0.5, cardY + 60);
            }

            if (msg) {
                const quoteSize = this.data.quoteFontSize || 26;
                ctx.font = `600 ${quoteSize}px "Plus Jakarta Sans", sans-serif`;
                ctx.fillStyle = this.data.quoteColor || '#ffffff';
                this.wrapText(ctx, msg, cardX + cardW * 0.5, cardY + 130, cardW - 60, Math.round(quoteSize * 1.4));
            }
            ctx.restore();
            this.recordElementBox('quote', cardX, cardY, cardW, cardH);
            this.recordElementBox('ribbon', cardX, cardY, cardW, cardH);
        }

        // Slogan
        if (this.data.slogan) {
            const sloganY = cardY + cardH + 75 + (this.data.sloganYOffset || 0);
            const slogX = cardX + 30 + (this.data.sloganXOffset || 0);
            ctx.textAlign = 'left';
            ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = this.data.sloganColor || '#5eead4';
            ctx.fillText(this.data.slogan, slogX, sloganY);
            this.recordElementBox('slogan', slogX, sloganY - 40, cardW, 100);
        }

        // Bottom Nameplate Pill (Bottom Right)
        if (this.data.candidateName) {
            const nameW = 580;
            const nameH = 80;
            const nameX = w - nameW - 80 + (this.data.nameXOffset || 0);
            const nameY = h - nameH - 70 + (this.data.nameYOffset || 0);

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(nameX, nameY, nameW, nameH, 16);
            ctx.fillStyle = '#051124';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.data.bannerColor || '#0d9488';
            ctx.stroke();

            const nameSize = this.data.nameFontSize || 36;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `900 ${nameSize}px "Montserrat", sans-serif`;
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.letterSpacing = '3px';
            ctx.fillText(this.data.candidateName.toUpperCase(), nameX + nameW * 0.5, nameY + nameH * 0.5);
            ctx.restore();
            this.recordElementBox('name', nameX, nameY, nameW, nameH);
        }
    }

    /* -------------------------------------------------------------------------
       AUTHENTIC CAMPUS SERIES 5: EXECUTIVE SPEAKER GRADIENT
       Ivory tower watermark, twin checkmark/crest, upward emerald gradient
       ------------------------------------------------------------------------- */
    renderSpeakerGradient(ctx, w, h) {
        const emerald = this.data.primaryColor || '#047857';
        const deepForest = '#022c22';

        // 1. Soft Pure Alabaster Background
        ctx.fillStyle = this.data.cardBgColor || '#ffffff';
        ctx.fillRect(0, 0, w, h);
        this.drawPosterBackdrop(ctx, w, h);

        // 2. Soft Ivory Tower Watermark behind candidate
        if (this.data.showWatermark !== false) {
            this.drawIvoryTowerWatermark(ctx, w * 0.5, h * 0.35, w * 0.0010, 0.15);
        }

        // 3. Flanking Badges: Left Crest + Right Verified Vote Checkmark
        if (this.data.showBadges !== false) {
            this.drawUniversityCrest(ctx, w * 0.15, 170, 62, "");
            this.drawVoteCheckmarkBadge(ctx, w * 0.85, 170, 62);
        }

        // 4. Candidate Portrait in Center
        const photoY = 190;
        const photoH = h * 0.65;
        if (this.data.photoImg) {
            this.drawCandidatePhoto(ctx, w * 0.10, photoY, w * 0.80, photoH, {
                scale: this.data.photoScale || 1.0,
                offsetX: this.data.photoXOffset || 0,
                offsetY: this.data.photoYOffset || 0,
                fitMode: this.data.photoFitMode || 'contain'
            });
            this.recordElementBox('photo', w * 0.10, photoY, w * 0.80, photoH);
        }

        // 5. Upward Rich Emerald Gradient Blend (Adjustable, Resizable & Deletable)
        const baseGradY = h * 0.60;
        const gradY = baseGradY + (this.data.templateRibbonYOffset || 0);
        const gradH = Math.max(100, (h * 0.32) + (this.data.templateRibbonHeightOffset || 0));
        const gradW = Math.max(200, w + (this.data.templateRibbonWidthOffset || 0));
        const gradX = Math.round((w - gradW) / 2) + (this.data.templateRibbonXOffset || 0);

        if (this.data.showTemplateRibbon !== false) {
            const fadeGrad = ctx.createLinearGradient(0, gradY, 0, gradY + gradH);
            fadeGrad.addColorStop(0, 'rgba(4, 120, 87, 0)');
            fadeGrad.addColorStop(0.35, 'rgba(4, 120, 87, 0.85)');
            fadeGrad.addColorStop(0.7, this.data.bannerColor || emerald);
            fadeGrad.addColorStop(1, deepForest);
            ctx.fillStyle = fadeGrad;
            ctx.fillRect(gradX, gradY, gradW, gradH);
            this.recordElementBox('ribbon', gradX, gradY, gradW, gradH);
        }

        // 6. Candidate Name in Giant Clean Bold White
        if (this.data.candidateName) {
            const textY = (h * 0.77) + (this.data.nameYOffset || 0);
            const textX = w * 0.5 + (this.data.nameXOffset || 0);
            const nameSize = this.data.nameFontSize || 120;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.font = `900 ${nameSize}px "Montserrat", sans-serif`;
            ctx.fillStyle = this.data.nameColor || '#ffffff';
            ctx.letterSpacing = '3px';
            ctx.fillText(this.data.candidateName.toUpperCase(), textX, textY);
            ctx.letterSpacing = '0px';
            this.recordElementBox('name', textX - w * 0.45, textY - nameSize, w * 0.9, nameSize * 1.3);
        }

        // 7. Position Line
        if (this.data.position) {
            const posText = this.data.position.toUpperCase();
            const posSize = this.data.positionFontSize || 68;
            ctx.font = `900 ${posSize}px "Montserrat", sans-serif`;
            const posMetrics = ctx.measureText(posText);
            const scriptW = this.data.greetingScript ? 100 : 0;
            const totalW = posMetrics.width + scriptW;
            const startX = ((w - totalW) / 2) + (this.data.positionXOffset || 0);
            const textY = (h * 0.77) + (this.data.nameYOffset || 0);
            const posY = textY + 80 + (this.data.positionYOffset || 0);

            if (this.data.greetingScript) {
                const scriptSize = this.data.scriptFontSize || 75;
                ctx.textAlign = 'left';
                ctx.font = `italic ${scriptSize}px "Alex Brush", cursive`;
                ctx.fillStyle = this.data.scriptColor || '#ffffff';
                ctx.fillText(this.data.greetingScript, startX, posY);
            }

            ctx.textAlign = 'left';
            ctx.font = `900 ${posSize}px "Montserrat", sans-serif`;
            ctx.fillStyle = this.data.positionColor || '#ffffff';
            ctx.letterSpacing = '2px';
            ctx.fillText(posText, startX + scriptW + (scriptW ? 10 : 0), posY);
            ctx.letterSpacing = '0px';
            this.recordElementBox('position', startX, posY - posSize, totalW, posSize * 1.3);
        }

        // 8. Clean White Footer Ribbon with Tagline
        if (this.data.slogan) {
            const footH = h * 0.08;
            const footY = h - footH;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, footY, w, footH);

            const slogX = w * 0.5 + (this.data.sloganXOffset || 0);
            const slogY = footY + footH * 0.5 + (this.data.sloganYOffset || 0);
            const sloganSize = this.data.sloganFontSize || 36;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `900 ${sloganSize}px "Montserrat", sans-serif`;
            ctx.fillStyle = this.data.sloganColor || deepForest;
            ctx.letterSpacing = '3px';
            ctx.fillText(this.data.slogan.toUpperCase(), slogX, slogY);
            ctx.letterSpacing = '0px';
            this.recordElementBox('slogan', slogX - w * 0.45, footY + (this.data.sloganYOffset || 0), w * 0.9, footH);
        }
    }

    /* -------------------------------------------------------------------------
       PROCEDURAL GRAPHIC DRAWING HELPERS
       Deterministic, vector-sharp badges with zero external assets needed
       ------------------------------------------------------------------------- */

    /* Dynamic Campus Landmark / Architectural Background Watermark */
    drawLandmarkWatermark(ctx, cx, cy, baseScale, baseOpacity) {
        if (this.data.landmarkVisible === false) return;
        if (!this.data.landmarkImg && this.data.showWatermark === false) return;
        const scale = baseScale * (this.data.landmarkScale !== undefined ? this.data.landmarkScale : 1.0);
        const opacity = (this.data.landmarkOpacity !== undefined) ? (this.data.landmarkOpacity / 100) : (baseOpacity !== undefined ? baseOpacity : 0.15);
        const lx = cx + (this.data.landmarkXOffset || 0);
        const ly = cy + (this.data.landmarkYOffset || 0);

        this.recordElementBox('landmark', lx - 340 * scale, ly - 340 * scale, 680 * scale, 680 * scale);

        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (this.data.landmarkImg) {
            // User uploaded Landmark / Building / Skyline / Custom Graphic
            const img = this.data.landmarkImg;
            const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
            let dw = 900;
            let dh = 900;
            if (aspect > 1) {
                dh = dw / aspect;
            } else {
                dw = dh * aspect;
            }
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        } else {
            // Elegant Neutral Campus Landmark Silhoutte (Pillared Portico, Clock Tower & Wings)
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 6;

            // Central Clock Tower
            ctx.beginPath();
            ctx.rect(-150, -500, 300, 700);
            ctx.fill();

            // Tower Roof & Spire
            ctx.beginPath();
            ctx.moveTo(-170, -500);
            ctx.lineTo(0, -680);
            ctx.lineTo(170, -500);
            ctx.closePath();
            ctx.fill();

            // Clock Face
            ctx.beginPath();
            ctx.arc(0, -400, 60, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.arc(0, -400, 50, 0, Math.PI * 2);
            ctx.stroke();

            // Symmetrical Classical Wings
            ctx.fillStyle = '#334155';
            ctx.fillRect(-600, -200, 450, 400);
            ctx.fillRect(150, -200, 450, 400);

            // Wing Roofs
            ctx.beginPath();
            ctx.moveTo(-600, -200);
            ctx.lineTo(-375, -280);
            ctx.lineTo(-150, -200);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(150, -200);
            ctx.lineTo(375, -280);
            ctx.lineTo(600, -200);
            ctx.closePath();
            ctx.fill();

            // Arched Columns Row
            for (let i = -550; i <= 550; i += 70) {
                if (Math.abs(i) > 130) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.roundRect(i, -120, 35, 200, [15, 15, 0, 0]);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }

    /* The Iconic University Ivory Tower Watermark (Delegates to Dynamic Landmark) */
    drawIvoryTowerWatermark(ctx, cx, cy, scale, opacity) {
        this.drawLandmarkWatermark(ctx, cx, cy, scale, opacity);
    }

    /* Dynamic Institutional Badge 1 (University Crest / School Emblem / Council Seal) */
    drawInstitutionalBadge1(ctx, cx, cy, baseRadius, label) {
        if (this.data.badge1Visible === false) return;
        if (!this.data.badge1Img && this.data.showBadges === false) return;
        const scale = this.data.badge1Scale !== undefined ? this.data.badge1Scale : 1.0;
        const radius = Math.max(16, baseRadius * scale);
        const bx = cx + (this.data.badge1XOffset || 0);
        const by = cy + (this.data.badge1YOffset || 0);
        const shape = this.data.badge1Shape || 'circle';

        this.recordElementBox('badge1', bx - radius, by - radius, radius * 2, radius * 2);

        ctx.save();
        if (this.data.badge1Img) {
            // User uploaded custom badge 1
            if (shape === 'natural') {
                const img = this.data.badge1Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = radius * 2;
                let dh = radius * 2;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
            } else if (shape === 'shield') {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                const sw = radius * 1.8;
                const sh = radius * 2.2;
                ctx.moveTo(bx - sw * 0.5, by - sh * 0.5);
                ctx.lineTo(bx + sw * 0.5, by - sh * 0.5);
                ctx.lineTo(bx + sw * 0.5, by + sh * 0.1);
                ctx.bezierCurveTo(bx + sw * 0.5, by + sh * 0.45, bx, by + sh * 0.55, bx, by + sh * 0.55);
                ctx.bezierCurveTo(bx, by + sh * 0.55, bx - sw * 0.5, by + sh * 0.45, bx - sw * 0.5, by + sh * 0.1);
                ctx.closePath();
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = Math.max(2, radius * 0.06);
                ctx.strokeStyle = this.data.primaryColor || '#0f2b5c';
                ctx.stroke();
                ctx.clip();

                const img = this.data.badge1Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = sw * 0.88;
                let dh = sh * 0.88;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
                ctx.restore();
            } else if (shape === 'square') {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.18)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(bx - radius, by - radius, radius * 2, radius * 2, radius * 0.25);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = Math.max(2, radius * 0.05);
                ctx.strokeStyle = this.data.primaryColor || '#0f2b5c';
                ctx.stroke();
                ctx.clip();

                const img = this.data.badge1Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = radius * 1.8;
                let dh = radius * 1.8;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
                ctx.restore();
            } else {
                // Circular Disc Frame
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(bx, by, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = Math.max(2.5, radius * 0.06);
                ctx.strokeStyle = this.data.primaryColor || '#0f2b5c';
                ctx.stroke();
                ctx.clip();

                const img = this.data.badge1Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = radius * 1.85;
                let dh = radius * 1.85;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
                ctx.restore();

                // Outer gold accent ring
                ctx.beginPath();
                ctx.arc(bx, by, radius - 2, 0, Math.PI * 2);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = this.data.secondaryColor || '#ca8a04';
                ctx.stroke();
            }
        } else {
            // Prestigious Neutral Academic Crest (Universal, NOT hardcoded to single institution)
            ctx.save();
            ctx.beginPath();
            ctx.arc(bx, by, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.lineWidth = Math.max(2, radius * 0.05);
            ctx.strokeStyle = this.data.primaryColor || '#0f2b5c';
            ctx.stroke();

            // Outer gold accent ring
            ctx.beginPath();
            ctx.arc(bx, by, radius - 4, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ca8a04';
            ctx.stroke();

            // Inner Shield
            const sw = radius * 0.78;
            const sh = radius * 0.95;
            ctx.beginPath();
            ctx.moveTo(bx - sw * 0.5, by - sh * 0.38);
            ctx.lineTo(bx + sw * 0.5, by - sh * 0.38);
            ctx.lineTo(bx + sw * 0.5, by + sh * 0.1);
            ctx.bezierCurveTo(bx + sw * 0.5, by + sh * 0.45, bx, by + sh * 0.55, bx, by + sh * 0.55);
            ctx.bezierCurveTo(bx, by + sh * 0.55, bx - sw * 0.5, by + sh * 0.45, bx - sw * 0.5, by + sh * 0.1);
            ctx.closePath();
            ctx.fillStyle = this.data.primaryColor || '#0f2b5c';
            ctx.fill();

            // Open book / knowledge icon
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx - radius * 0.18, by - radius * 0.05, radius * 0.16, 0, Math.PI * 2);
            ctx.arc(bx + radius * 0.18, by - radius * 0.05, radius * 0.16, 0, Math.PI * 2);
            ctx.fill();

            // Golden star of excellence at center
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(bx, by - radius * 0.18, radius * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Flanking laurel wreath accents
            ctx.fillStyle = '#ca8a04';
            for (let a = -0.4; a <= 0.4; a += 0.2) {
                ctx.beginPath();
                ctx.arc(bx - radius * 0.52, by + a * radius * 0.8, radius * 0.06, 0, Math.PI * 2);
                ctx.arc(bx + radius * 0.52, by + a * radius * 0.8, radius * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Year or Custom Label beneath if present
        if (label) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `800 ${Math.max(12, Math.round(radius * 0.34))}px "Montserrat", sans-serif`;
            ctx.fillStyle = '#0f172a';
            ctx.fillText(label, bx, by + radius + 6);
        }
        ctx.restore();
    }

    /* Official Circular Crest (Delegates to Dynamic Badge 1) */
    drawUniversityCrest(ctx, cx, cy, radius, yearText) {
        this.drawInstitutionalBadge1(ctx, cx, cy, radius, yearText);
    }

    /* Dynamic Institutional Badge 2 (Guild / Party / Association / Union Emblem) */
    drawInstitutionalBadge2(ctx, cx, cy, baseRadius, label) {
        if (this.data.badge2Visible === false) return;
        if (!this.data.badge2Img && this.data.showBadges === false) return;
        const scale = this.data.badge2Scale !== undefined ? this.data.badge2Scale : 1.0;
        const radius = Math.max(16, baseRadius * scale);
        const bx = cx + (this.data.badge2XOffset || 0);
        const by = cy + (this.data.badge2YOffset || 0);
        const shape = this.data.badge2Shape || 'circle';

        this.recordElementBox('badge2', bx - radius, by - radius, radius * 2, radius * 2);

        ctx.save();
        if (this.data.badge2Img) {
            // User uploaded custom badge 2
            if (shape === 'natural') {
                const img = this.data.badge2Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = radius * 2;
                let dh = radius * 2;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
            } else if (shape === 'shield') {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                const sw = radius * 1.8;
                const sh = radius * 2.2;
                ctx.moveTo(bx - sw * 0.5, by - sh * 0.5);
                ctx.lineTo(bx + sw * 0.5, by - sh * 0.5);
                ctx.lineTo(bx + sw * 0.5, by + sh * 0.1);
                ctx.bezierCurveTo(bx + sw * 0.5, by + sh * 0.45, bx, by + sh * 0.55, bx, by + sh * 0.55);
                ctx.bezierCurveTo(bx, by + sh * 0.55, bx - sw * 0.5, by + sh * 0.45, bx - sw * 0.5, by + sh * 0.1);
                ctx.closePath();
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = Math.max(2, radius * 0.06);
                ctx.strokeStyle = this.data.secondaryColor || '#dc2626';
                ctx.stroke();
                ctx.clip();

                const img = this.data.badge2Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = sw * 0.88;
                let dh = sh * 0.88;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
                ctx.restore();
            } else if (shape === 'square') {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.18)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.roundRect(bx - radius, by - radius, radius * 2, radius * 2, radius * 0.25);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = Math.max(2, radius * 0.05);
                ctx.strokeStyle = this.data.secondaryColor || '#dc2626';
                ctx.stroke();
                ctx.clip();

                const img = this.data.badge2Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = radius * 1.8;
                let dh = radius * 1.8;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
                ctx.restore();
            } else {
                // Circular Disc Frame
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(bx, by, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = Math.max(2.5, radius * 0.06);
                ctx.strokeStyle = this.data.secondaryColor || '#dc2626';
                ctx.stroke();
                ctx.clip();

                const img = this.data.badge2Img;
                const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
                let dw = radius * 1.85;
                let dh = radius * 1.85;
                if (aspect > 1) {
                    dh = dw / aspect;
                } else {
                    dw = dh * aspect;
                }
                ctx.drawImage(img, bx - dw / 2, by - dh / 2, dw, dh);
                ctx.restore();

                // Outer accent ring
                ctx.beginPath();
                ctx.arc(bx, by, radius - 2, 0, Math.PI * 2);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = this.data.primaryColor || '#1d4ed8';
                ctx.stroke();
            }
        } else {
            // Clean Modern Guild / Student Union / Party Emblem Roundel
            ctx.save();
            ctx.beginPath();
            ctx.arc(bx, by, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.lineWidth = Math.max(2.5, radius * 0.06);
            ctx.strokeStyle = this.data.secondaryColor || '#1d4ed8';
            ctx.stroke();

            // Inner roundel
            ctx.beginPath();
            ctx.arc(bx, by, radius - 7, 0, Math.PI * 2);
            ctx.fillStyle = this.data.secondaryColor || '#dc2626';
            ctx.fill();

            // Center White Disc
            ctx.beginPath();
            ctx.arc(bx, by, radius * 0.48, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Association / Guild Acronym
            const acronymText = (this.data.associationAcronym || label || "GUILD").toUpperCase();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `900 ${Math.max(14, Math.round(radius * 0.32))}px "Montserrat", sans-serif`;
            ctx.fillStyle = '#0f172a';
            ctx.fillText(acronymText, bx, by);
            ctx.restore();
        }
        ctx.restore();
    }

    /* Association / Party Emblem Badge (Delegates to Dynamic Badge 2) */
    drawAssociationLogo(ctx, cx, cy, radius, acronym) {
        this.drawInstitutionalBadge2(ctx, cx, cy, radius, acronym);
    }

    /* Official Green Verified Vote Checkmark Badge */
    drawVoteCheckmarkBadge(ctx, cx, cy, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#047857'; // Emerald border
        ctx.stroke();

        // Green Checkmark Disc
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
        ctx.fillStyle = '#047857';
        ctx.fill();

        // Bold White Checkmark
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = radius * 0.18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.35, cy);
        ctx.lineTo(cx - radius * 0.08, cy + radius * 0.30);
        ctx.lineTo(cx + radius * 0.40, cy - radius * 0.28);
        ctx.stroke();
        ctx.restore();
    }

    /* Complex Hall Crocodile Mascot Badge */
    drawComplexCrocodile(ctx, cx, cy, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#059669';
        ctx.stroke();

        // Crocodile silhouette icon
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 0.6, radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes and snout
        ctx.beginPath();
        ctx.arc(cx + radius * 0.45, cy - radius * 0.1, radius * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.restore();
    }

    /* 15. Pinterest & Custom Imported Template Mode */
    renderCustomTemplate(ctx, w, h) {
        const pColor = this.data.primaryColor || '#1e3a8a';
        const sColor = this.data.secondaryColor || '#f59e0b';
        const tImg = this.data.customTemplateImg;

        if (tImg) {
            ctx.save();
            const b = this.data.customTemplateBrightness !== undefined ? this.data.customTemplateBrightness : 100;
            const c = this.data.customTemplateContrast !== undefined ? this.data.customTemplateContrast : 100;
            const op = this.data.customTemplateOpacity !== undefined ? (this.data.customTemplateOpacity / 100) : 1;
            ctx.filter = `brightness(${b}%) contrast(${c}%)`;
            ctx.globalAlpha = Math.max(0, Math.min(1, op));

            const fit = this.data.customTemplateFit || 'cover';
            if (fit === 'stretch') {
                ctx.drawImage(tImg, 0, 0, w, h);
            } else if (fit === 'contain') {
                const s = Math.min(w / tImg.naturalWidth, h / tImg.naturalHeight);
                const dw = tImg.naturalWidth * s;
                const dh = tImg.naturalHeight * s;
                const dx = (w - dw) / 2;
                const dy = (h - dh) / 2;
                ctx.fillStyle = '#090d16';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(tImg, dx, dy, dw, dh);
            } else {
                // Cover
                const s = Math.max(w / tImg.naturalWidth, h / tImg.naturalHeight);
                const dw = tImg.naturalWidth * s;
                const dh = tImg.naturalHeight * s;
                const dx = (w - dw) / 2;
                const dy = (h - dh) / 2;
                ctx.drawImage(tImg, dx, dy, dw, dh);
            }
            ctx.restore();

            // Color Tint overlay if enabled
            if (this.data.customTemplateTintAlpha > 0) {
                ctx.save();
                ctx.fillStyle = this.data.customTemplateTintColor || '#000000';
                ctx.globalAlpha = Math.max(0, Math.min(1, this.data.customTemplateTintAlpha / 100));
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            }
        } else {
            // Blueprint placeholder if no template image loaded yet
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, '#0f172a');
            bgGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Grid guides
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 2;
            for (let x = 0; x < w; x += 100) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += 100) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }
            ctx.restore();

            // Placeholder box
            ctx.save();
            ctx.strokeStyle = '#e11d48';
            ctx.setLineDash([20, 15]);
            ctx.lineWidth = 6;
            ctx.strokeRect(80, 80, w - 160, h - 160);
            ctx.restore();

            ctx.fillStyle = '#f43f5e';
            ctx.font = 'bold 84px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PINTEREST / CUSTOM TEMPLATE', w / 2, h * 0.38);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('Click "Import from Pinterest" to paste any Pin URL or upload a graphic', w / 2, h * 0.44);
            ctx.fillText('All text and photo elements will overlay directly on your imported design!', w / 2, h * 0.48);
            ctx.textAlign = 'left';
        }

        // Candidate Photo Overlay & Candidate Mask Shield
        // 1. Candidate Mask Shield (Completely covers original person/face in the reference template)
        const photo = this.data.photoImg;
        const shape = this.data.customTemplatePhotoShape || 'circle';
        const scale = this.data.photoScale || 1.0;
        const photoSize = Math.round(Math.min(w, h) * 0.42 * scale);
        const cx = (w / 2) + (this.data.photoXOffset || 0);
        const cy = (h * 0.42) + (this.data.photoYOffset || 0);

        if (this.data.customTemplateMaskEnabled === true) {
            ctx.save();
            const maskShape = this.data.customTemplateMaskShape || (shape === 'circle' ? 'circle' : 'card');
            const maskColor = this.data.customTemplateMaskColor || '#0f172a';
            const mx = cx + (this.data.customTemplateMaskXOffset || 0);
            const my = cy + (this.data.customTemplateMaskYOffset || 0);

            let mw = this.data.customTemplateMaskWidth || (shape === 'cutout' ? Math.round(w * 0.82 * scale) : Math.round(photoSize * 1.25));
            let mh = this.data.customTemplateMaskHeight || (shape === 'cutout' ? Math.round(h * 0.65 * scale) : Math.round(photoSize * 1.35));

            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 35;
            ctx.shadowOffsetY = 10;

            if (maskShape === 'circle') {
                const mr = Math.round(Math.max(mw, mh) / 2);
                ctx.beginPath();
                ctx.arc(mx, my, mr, 0, Math.PI * 2);
                ctx.fillStyle = maskColor;
                ctx.fill();
                if (this.data.customTemplateMaskBorder !== false) {
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = this.data.customTemplateMaskBorderColor || sColor;
                    ctx.stroke();
                }
                this.recordElementBox('mask', mx - mr, my - mr, mr * 2, mr * 2);
            } else if (maskShape === 'pill') {
                const rx = mx - mw / 2;
                const ry = my - mh / 2;
                const radius = mw / 2;
                ctx.beginPath();
                ctx.roundRect(rx, ry, mw, mh, radius);
                ctx.fillStyle = maskColor;
                ctx.fill();
                if (this.data.customTemplateMaskBorder !== false) {
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = this.data.customTemplateMaskBorderColor || sColor;
                    ctx.stroke();
                }
                this.recordElementBox('mask', rx, ry, mw, mh);
            } else if (maskShape === 'gradient') {
                const gy = my - mh / 2;
                const gGrad = ctx.createLinearGradient(0, gy, 0, gy + mh);
                gGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gGrad.addColorStop(0.35, maskColor);
                gGrad.addColorStop(1, maskColor);
                ctx.fillStyle = gGrad;
                ctx.fillRect(0, gy, w, mh + 200);
            } else {
                // 'card' or 'patch'
                const rx = mx - mw / 2;
                const ry = my - mh / 2;
                const radius = maskShape === 'patch' ? 12 : 36;
                ctx.beginPath();
                ctx.roundRect(rx, ry, mw, mh, radius);
                ctx.fillStyle = maskColor;
                ctx.fill();
                if (this.data.customTemplateMaskBorder !== false && maskShape !== 'patch') {
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = this.data.customTemplateMaskBorderColor || sColor;
                    ctx.stroke();
                }
                this.recordElementBox('mask', rx, ry, mw, mh);
            }
            ctx.restore();
        }

        // 2. Active Candidate Photo (Fully replaceable, resizable, cutout or framed)
        if (photo && this.data.customTemplateShowPhoto !== false) {
            ctx.save();
            if (shape === 'circle') {
                const r = photoSize / 2;
                // Outer glow / ring
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
                ctx.fillStyle = sColor;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 25;
                ctx.fill();
                ctx.restore();

                // Inner clip
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.clip();
                this.drawCandidatePhoto(ctx, cx - r, cy - r, photoSize, photoSize, { fitMode: this.data.photoFitMode || 'cover', scale: 1.0, offsetX: 0, offsetY: 0 });
                ctx.restore();

                this.recordElementBox('photo', cx - r - 10, cy - r - 10, photoSize + 20, photoSize + 20);
            } else if (shape === 'rounded') {
                const rw = photoSize;
                const rh = Math.round(photoSize * 1.15);
                const rx = cx - rw / 2;
                const ry = cy - rh / 2;
                const radius = 32;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(rx - 8, ry - 8, rw + 16, rh + 16, radius + 4);
                ctx.fillStyle = sColor;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 25;
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(rx, ry, rw, rh, radius);
                ctx.clip();
                this.drawCandidatePhoto(ctx, rx, ry, rw, rh, { fitMode: this.data.photoFitMode || 'cover', scale: 1.0, offsetX: 0, offsetY: 0 });
                ctx.restore();

                this.recordElementBox('photo', rx - 8, ry - 8, rw + 16, rh + 16);
            } else {
                // Cutout / Direct transparent photo placement anywhere on template
                const pw = Math.round(w * 0.75 * scale);
                const ph = Math.round(h * 0.60 * scale);
                const px = cx - pw / 2;
                const py = cy - ph / 2;
                this.drawCandidatePhoto(ctx, px, py, pw, ph, { fitMode: this.data.photoFitMode || 'contain', scale: 1.0, offsetX: 0, offsetY: 0 });
                this.recordElementBox('photo', px, py, pw, ph);
            }
            ctx.restore();
        } else if (!photo && this.data.customTemplateShowPhoto !== false) {
            // Visual placeholder asking user to drop/replace candidate photo
            ctx.save();
            ctx.strokeStyle = sColor;
            ctx.setLineDash([16, 12]);
            ctx.lineWidth = 5;
            const r = photoSize / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CANDIDATE PHOTO SLOT', cx, cy - 10);
            ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = sColor;
            ctx.fillText('Click to Select or Upload Photo', cx, cy + 30);
            this.recordElementBox('photo', cx - r, cy - r, photoSize, photoSize);
            ctx.restore();
        }

        // Draggable Typography Overlays
        // 1. Candidate Name
        if (this.data.customTemplateShowName !== false && this.data.candidateName) {
            const nameSize = this.data.nameFontSize || Math.round(w * 0.052);
            const nx = (w / 2) + (this.data.nameXOffset || 0);
            const ny = (h * 0.74) + (this.data.nameYOffset || 0);
            const rawName = this.applyTextTransform('name', this.data.candidateName);

            this.drawStyledText(ctx, 'name', rawName, nx, ny, {
                size: nameSize,
                align: this.data.nameAlign || 'center',
                color: this.data.nameColor || '#ffffff',
                baseline: 'middle'
            });

            ctx.save();
            ctx.font = this.getFontString('name', nameSize, 'Plus Jakarta Sans', '900');
            const nMetrics = ctx.measureText(rawName);
            this.recordElementBox('name', nx - nMetrics.width / 2 - 16, ny - nameSize * 0.6, nMetrics.width + 32, nameSize * 1.2);
            ctx.restore();
        }

        // 2. Position / Role
        if (this.data.customTemplateShowPosition !== false && this.data.position) {
            const posSize = this.data.positionFontSize || Math.round(w * 0.028);
            const px = (w / 2) + (this.data.positionXOffset || 0);
            const py = (h * 0.80) + (this.data.positionYOffset || 0);
            const rawPos = this.applyTextTransform('position', this.data.position);

            this.drawStyledText(ctx, 'position', rawPos, px, py, {
                size: posSize,
                align: this.data.positionAlign || 'center',
                color: this.data.positionColor || sColor,
                baseline: 'middle'
            });

            ctx.save();
            ctx.font = this.getFontString('position', posSize, 'Plus Jakarta Sans', '800');
            const pMetrics = ctx.measureText(rawPos);
            this.recordElementBox('position', px - pMetrics.width / 2 - 16, py - posSize * 0.6, pMetrics.width + 32, posSize * 1.2);
            ctx.restore();
        }

        // 3. Slogan / Message
        if (this.data.customTemplateShowSlogan !== false && this.data.slogan) {
            const slogSize = this.data.sloganFontSize || Math.round(w * 0.021);
            const sx = (w / 2) + (this.data.sloganXOffset || 0);
            const sy = (h * 0.86) + (this.data.sloganYOffset || 0);
            const rawSlog = `“${this.applyTextTransform('slogan', this.data.slogan)}”`;

            this.drawStyledText(ctx, 'slogan', rawSlog, sx, sy, {
                size: slogSize,
                align: this.data.sloganAlign || 'center',
                color: this.data.sloganColor || '#f8fafc',
                baseline: 'middle'
            });

            ctx.save();
            ctx.font = this.getFontString('slogan', slogSize, 'Plus Jakarta Sans', '600', 'italic');
            const sMetrics = ctx.measureText(rawSlog);
            this.recordElementBox('slogan', sx - sMetrics.width / 2 - 16, sy - slogSize * 0.6, sMetrics.width + 32, slogSize * 1.2);
            ctx.restore();
        }
    }

    /* Helper: Wrap text cleanly across multiple lines */
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    getWrappedLines(ctx, text, maxWidth) {
        if (!text) return [];
        const words = String(text).split(' ');
        const lines = [];
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = currentLine ? (currentLine + ' ' + words[n]) : words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(currentLine);
                currentLine = words[n];
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    hexToRgba(hex, alpha = 1.0) {
        if (!hex || typeof hex !== 'string') return `rgba(245, 158, 11, ${alpha})`;
        let clean = hex.replace('#', '').trim();
        if (clean.length === 3) {
            clean = clean.split('').map(c => c + c).join('');
        }
        if (clean.length !== 6) return `rgba(245, 158, 11, ${alpha})`;
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /* Export Canvas as High-Res Data URL (respects active boundaries if defined, supports PNG, JPEG, scaling) */
    toDataURL(cropToBoundaries = true, mimeType = 'image/png', quality = 1.0, scaleMultiplier = 1.0) {
        const inTop = Math.max(0, this.data.boundaryInsetTop || 0);
        const inBottom = Math.max(0, this.data.boundaryInsetBottom || 0);
        const inLeft = Math.max(0, this.data.boundaryInsetLeft || 0);
        const inRight = Math.max(0, this.data.boundaryInsetRight || 0);
        const hasBounds = (inTop > 0 || inBottom > 0 || inLeft > 0 || inRight > 0);

        const prevShow = this.data.showBoundaries;
        this.data.showBoundaries = false;
        this.render();

        let cropX = 0, cropY = 0, cropW = this.width, cropH = this.height;
        if (cropToBoundaries && hasBounds) {
            cropX = inLeft;
            cropY = inTop;
            cropW = Math.max(20, this.width - inLeft - inRight);
            cropH = Math.max(20, this.height - inTop - inBottom);
        }

        const mult = Math.max(0.5, Math.min(4.0, scaleMultiplier || 1.0));
        const outW = Math.round(cropW * mult);
        const outH = Math.round(cropH * mult);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = outW;
        outCanvas.height = outH;
        const outCtx = outCanvas.getContext('2d');
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';

        if (mimeType === 'image/jpeg') {
            outCtx.fillStyle = '#ffffff';
            outCtx.fillRect(0, 0, outW, outH);
        }

        outCtx.drawImage(this.canvas, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
        const q = Math.max(0.1, Math.min(1.0, quality || 1.0));
        const url = outCanvas.toDataURL(mimeType, q);

        // Restore preview overlay
        this.data.showBoundaries = prevShow;
        this.render();

        return url;
    }

    /* Download current flyer directly in chosen format & resolution */
    download(filename = 'campaign-poster.png', cropToBoundaries = true, mimeType = 'image/png', quality = 1.0, scaleMultiplier = 1.0) {
        if (filename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
            this.exportAsPDF(filename, cropToBoundaries, scaleMultiplier);
            return;
        }
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.toDataURL(cropToBoundaries, mimeType, quality, scaleMultiplier);
        link.click();
    }

    /* Export flyer as a high-definition, print-ready PDF file */
    exportAsPDF(filename = 'campaign-poster.pdf', cropToBoundaries = true, scaleMultiplier = 1.0) {
        const imgData = this.toDataURL(cropToBoundaries, 'image/jpeg', 0.98, scaleMultiplier);
        if (window.jspdf && window.jspdf.jsPDF) {
            const inTop = Math.max(0, this.data.boundaryInsetTop || 0);
            const inBottom = Math.max(0, this.data.boundaryInsetBottom || 0);
            const inLeft = Math.max(0, this.data.boundaryInsetLeft || 0);
            const inRight = Math.max(0, this.data.boundaryInsetRight || 0);
            const hasBounds = (inTop > 0 || inBottom > 0 || inLeft > 0 || inRight > 0);
            const cropW = (cropToBoundaries && hasBounds) ? Math.max(20, this.width - inLeft - inRight) : this.width;
            const cropH = (cropToBoundaries && hasBounds) ? Math.max(20, this.height - inTop - inBottom) : this.height;
            const orientation = cropW > cropH ? 'landscape' : 'portrait';
            const pdf = new window.jspdf.jsPDF({
                orientation: orientation,
                unit: 'pt',
                format: [cropW * 0.75, cropH * 0.75]
            });
            pdf.addImage(imgData, 'JPEG', 0, 0, cropW * 0.75, cropH * 0.75, undefined, 'FAST');
            pdf.save(filename);
            return;
        }

        // Fallback print/PDF window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        @page { size: auto; margin: 0; }
                        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
                        img { width: 100vw; height: auto; max-height: 100vh; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="${imgData}" onload="window.print(); window.close();" />
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            const link = document.createElement('a');
            link.download = filename.replace(/\.pdf$/i, '.png');
            link.href = this.toDataURL(cropToBoundaries, 'image/png', 1.0, scaleMultiplier);
            link.click();
        }
    }
}
