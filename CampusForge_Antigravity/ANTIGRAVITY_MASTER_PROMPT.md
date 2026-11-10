# CAMPUSFORGE — MASTER ANTIGRAVITY BUILD PROMPT

You are a senior full-stack software architect, UI/UX designer, creative technology engineer, media-processing engineer and DevOps engineer.

Build a production-grade SaaS platform named CAMPUSFORGE.

## PURPOSE
CampusForge is a campaign creative and communications management platform for legitimate campus organizations, student candidates, clubs, associations and other campus campaigns.

Centralize:
- campaign workspaces
- candidates and positions
- Brand Kit
- flyer/poster creation
- bulk personalized flyer generation
- media management
- short-form video creation
- authorized SMS campaigns
- email campaigns
- scheduling
- analytics
- approvals
- exports

## CORE MODULES
Dashboard, Campaigns, Candidates, Brand Kit, Media Library, Flyer Studio, Template Studio, Batch Flyer Generator, Video Studio, SMS Studio, Email Studio, Campaign Calendar, Analytics, Approval Center, Export Center, Settings, Audit Logs.

## RECOMMENDED STACK
Frontend: Next.js + TypeScript + Tailwind CSS.
Editor: Fabric.js or Konva.js.
Images: Sharp.
Video: FFmpeg; Remotion where useful.
Backend: Node.js/TypeScript.
Database: PostgreSQL + Prisma.
Queues: Redis + BullMQ.
Storage: S3-compatible object storage.
Authentication: secure managed authentication or secure session architecture.
AI: provider abstraction layer.
Email/SMS: provider abstraction layers.

## CRITICAL ARCHITECTURE PRINCIPLE
Do NOT use generative AI to directly render final text-heavy flyers.

Use:
AI -> structured creative content -> deterministic template engine -> validation -> rendering.

This guarantees exact spelling, exact candidate names, consistent layouts, reproducible batch output and high-resolution exports.

## CAMPAIGN WORKSPACE
Each campaign has:
name, description, organization, candidates, positions, slogan, campaign message, Brand Kit, media library, templates, contacts, communication campaigns, production jobs and analytics.

## BRAND KIT
Support primary/secondary/accent colors, heading/body fonts, logo, slogan, social handles and candidate image preferences. All creative modules consume the Brand Kit.

## TEMPLATE ENGINE
Editable elements:
TEXT, IMAGE, LOGO, SHAPE, LINE, QR, ICON, BACKGROUND.

Variables:
{{candidate_name}}
{{position}}
{{slogan}}
{{faculty}}
{{year}}
{{campaign_message}}
{{phone}}
{{social_handle}}
{{candidate_photo}}
{{campaign_logo}}
{{qr_code}}

Support dimensions, layers, z-index, constraints, safe margins, typography rules and variable bindings.

## FLYER STUDIO
Provide visual canvas, layers, typography, image controls, alignment, guides, snapping, undo/redo, grouping, preview and export.

Exports: PNG, JPG, PDF.
Presets: A4, A5, 1:1, 4:5, 9:16 and custom.

## BATCH FLYER GENERATOR
CSV fields may include:
candidate_name, position, photo, slogan, faculty, year, phone, social_handle.

Workflow:
Upload -> map columns -> validate -> preview -> queue -> render -> validate -> package -> export.

Validate missing fields, text overflow, image resolution, aspect ratio, safe margins, invalid QR codes, invalid file references and unsupported characters.

Never silently produce a broken design.

## MEDIA LIBRARY
Upload, drag/drop, folders, tags, search, filtering, thumbnails, metadata, duplicate detection, usage tracking and permissions. Use signed URLs for private storage.

## VIDEO STUDIO
Upload photos, short videos, logos and audio the user has rights to use.

Support timeline, scene ordering, duration, transitions, text/logo overlays, audio, preview and aspect ratio.

Presets:
DYNAMIC
PROFESSIONAL
DOCUMENTARY
SOCIAL
PHOTO_STORY

Output:
1080x1920, 1080x1080, 1920x1080.

Use background rendering; never block HTTP requests during rendering.

## SMS STUDIO
Support authorized contacts, segments, templates, composer, character counter, variables, preview, scheduling, delivery/failure tracking, history and opt-out suppression.

Only send to authorized/consented recipients according to applicable law, institutional rules and provider requirements.

## EMAIL STUDIO
Support reusable HTML templates, block editor, personalization, subject, desktop/mobile preview, test send, scheduling, delivery/failure status, unsubscribe and click/open tracking where appropriate.

## PRODUCTION QUEUE
Allow requests such as:
"Create 50 candidate flyers, 10 WhatsApp posters, 3 Instagram creatives and one 45-second video."

Statuses:
QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED.

Show progress and allow retrying failed jobs.

## APPROVAL SYSTEM
DRAFT -> IN_REVIEW -> APPROVED -> SCHEDULED -> SENT/PUBLISHED
with REJECTED and CANCELLED states.

Require explicit approval before external communications are sent.

## DATABASE
Create relational models for:
users, organizations, memberships, campaigns, candidates, positions, brand_kits, templates, template_elements, assets, asset_tags, flyers, flyer_batches, flyer_batch_items, contacts, contact_segments, contact_segment_members, sms_templates, sms_campaigns, sms_recipients, email_templates, email_campaigns, email_recipients, video_projects, video_scenes, video_renders, production_jobs, production_job_items, approvals, analytics_events and audit_logs.

Use foreign keys, indexes, timestamps and appropriate uniqueness constraints.

## SECURITY
Implement authentication, authorization, tenant isolation, RBAC, validation, rate limiting, secure uploads, MIME validation, file-size limits, signed storage URLs, secure cookies, audit logs and environment variables.

Never expose provider API keys, database credentials, storage secrets or AI secrets to the frontend.

## ROLES
OWNER, ADMIN, EDITOR, COMMUNICATIONS_MANAGER, VIEWER.

Use permission checks at the service layer.

## UI/UX
Premium modern creative SaaS interface.

Sidebar:
Dashboard
Campaigns
Brand Kit
Media
Flyers
Video Studio
SMS
Email
Templates
Calendar
Analytics
Approvals
Settings

Include command palette, keyboard shortcuts, responsive design, accessibility, loading/empty/error states and progress indicators.

## API
Build versioned APIs for auth, campaigns, candidates, Brand Kits, assets, templates, flyer rendering, batch generation, video, contacts, SMS, email, analytics, approvals and jobs.

Validate every request. Use idempotency for external send operations where appropriate.

## WORKERS
Workers for image processing, flyer rendering, PDF generation, video rendering, email delivery, SMS delivery and analytics.

Every job has ID, status, attempts, progress, timestamps, errors and retry strategy.

## TESTING
Add unit, integration, API, rendering, batch, permissions, upload-validation and queue tests.

Critical test:
Given one valid flyer template and 100 valid candidate records, produce 100 correctly personalized outputs without changing template geometry.

## OBSERVABILITY
Structured logs, job metrics, error hooks, health endpoint and readiness endpoint.

## IMPLEMENTATION PHASES
Phase 1: Auth, database, campaigns, Brand Kit, Media Library.
Phase 2: Template Studio, Flyer Studio, deterministic rendering.
Phase 3: CSV import, variable mapping, batch generation, validation, ZIP export.
Phase 4: Video Studio, FFmpeg/Remotion worker, rendering queue.
Phase 5: SMS and Email, provider abstraction, compliance controls.
Phase 6: Calendar, approvals, analytics, audit logs, RBAC.
Phase 7: Testing, security hardening, monitoring, deployment and documentation.

After every phase:
1. typecheck
2. lint
3. test
4. fix failures
5. inspect UI
6. update documentation
7. proceed only when stable.

Do not create fake production functionality. If a provider is not configured, use a clearly labelled development adapter and never claim delivery.

## DELIVERABLE
Produce source code, migrations, seed data, tests, `.env.example`, Docker configuration, deployment documentation, API documentation and architecture documentation.

The finished application must be deployable as a real SaaS once legitimate provider credentials are configured.
