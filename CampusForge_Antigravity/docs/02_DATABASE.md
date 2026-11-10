# Database

Core tables:
users, organizations, memberships, campaigns, candidates, positions, brand_kits, templates, template_elements, assets, asset_tags, flyers, flyer_batches, flyer_batch_items, contacts, contact_segments, contact_segment_members, sms_templates, sms_campaigns, sms_recipients, email_templates, email_campaigns, email_recipients, video_projects, video_scenes, video_renders, production_jobs, production_job_items, approvals, analytics_events, audit_logs.

Use UUID/non-guessable public IDs, timestamps, foreign keys and indexes for organization_id, campaign_id, status and created_at.
