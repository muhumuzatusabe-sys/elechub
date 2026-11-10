# Campaign Hub — Campus Campaign Season Build Spec

A single system for campaign season: bulk posters/flyers, bulk SMS, bulk email, and short promo videos from field photos — for one candidate or many at once.

**Stack (recommended, matches your existing Flask/Python workflow from Muhumuzatech Safe Voting):**
- Backend: Python + Flask
- DB: SQLite for now (swap to PostgreSQL later if it needs to survive across elections/years)
- Poster/flyer rendering: HTML/CSS → PNG via Playwright (headless Chromium) — gives you real typography, gradients, shadows, not blocky PIL text
- Bulk SMS: Africa's Talking API (Uganda sender IDs, bulk endpoint, delivery reports)
- Bulk Email: SMTP (Gmail/Zoho app password) to start; swap to SendGrid/Mailgun if volume gets large
- Video: MoviePy (wraps FFmpeg) for Ken-Burns-style photo montages with text overlays and music

Feed each module below to Antigravity **one at a time**, in order. Each prompt is self-contained — paste it as-is, then tell Antigravity to wire it into the previous module once both exist.

---

## 0. Foundation prompt (build this first)

```
Build a Flask web app called "Campaign Hub" — a tool for managing campus election
campaigns for multiple candidates at once.

Data model:
- Candidate: id, name, position (e.g. "Guild President", "Hall Chairperson"),
  party_or_slate (optional), slogan, photo (uploaded image), phone, email,
  color_theme (hex code, optional), created_at
- Election: id, name (e.g. "MUACR Elections 2026"), created_at
- Each Candidate belongs to one Election
- ContactList: id, election_id, name (e.g. "Hall A voters"), created_at
- Contact: id, contact_list_id, name, phone, email

Build:
1. A clean admin dashboard (sidebar nav: Candidates, Posters, SMS, Email, Video).
   Use Tailwind CSS via CDN. Dark sidebar, light content area, card-based layout.
2. CRUD screens for Elections and Candidates, with photo upload
   (store in /static/uploads/candidates/<id>.jpg).
3. CRUD + CSV upload for Contact Lists (CSV columns: name, phone, email —
   validate phone numbers, dedupe by phone+email).
4. A simple session-based admin login (single admin user, password from
   environment variable, no public signup).
5. SQLite database with SQLAlchemy models exactly as above, with a
   `flask db init/migrate/upgrade` setup using Flask-Migrate.

Leave clearly marked placeholder pages/routes for "Posters", "SMS", "Email",
and "Video" — I will hand you separate specs for each of those next, and they
must plug into these same Candidate/Election/Contact models rather than
inventing their own.
```

---

## 1. Poster & Flyer Generator

Handles both **individual** posters (fully customized per candidate) and
**bulk generic flyers** (one message/template, same layout, auto-filled with
each candidate's name/photo/position — what you asked for: "multiple flyers
for different people with a generic message").

```
Extend Campaign Hub with a Poster & Flyer module.

Install and use Playwright (Python, headless Chromium) to render HTML/CSS
templates to PNG images — do NOT use PIL/Pillow for the main design, it can't
do the typography and shadows we need. Use PIL only for final image
post-processing (e.g. batching into a PDF contact sheet).

1. Template system:
   - Store poster templates as HTML files with Jinja2-style placeholders:
     {{ candidate.name }}, {{ candidate.position }}, {{ candidate.slogan }},
     {{ candidate.photo_url }}, {{ candidate.color_theme }},
     {{ election.name }}.
   - Ship 4 starter templates in /templates/posters/:
     a) "Bold" — full-bleed candidate photo, name in large condensed
        uppercase type at bottom, slogan as a colored ribbon.
     b) "Minimalist" — white background, circular cropped photo, name and
        position in a clean sans-serif, generous whitespace.
     c) "Party" — split layout, candidate photo on one half, party color
        block with slogan on the other.
     d) "Grid" — for multi-candidate slate posters: repeatable candidate
        card component so several candidates can appear on one poster.
   - Each template has a matching square (1080x1080, social) and portrait
     (A3 print, 300dpi) CSS variant, selectable at generation time.

2. Single poster flow:
   - Pick a candidate, pick a template, live preview (render on the fly,
     show as an <img>), download as PNG or PDF.
   - Let the admin override any field just for this poster without changing
     the candidate's stored data (e.g. a one-off slogan).

3. BULK/GENERIC flyer flow (this is the key feature):
   - Admin selects an Election, then a Template, then either "all
     candidates in this election" or a multi-select subset.
   - Admin writes ONE generic message (e.g. "VOTE {{ candidate.name }} —
     {{ candidate.position }} — {{ election.name }} — Sept 20th") — the
     same message template is applied to every selected candidate, with
     placeholders auto-filled from each candidate's own record.
   - On "Generate All": render one poster per candidate in a background
     job (use Python threading or a simple job queue — no external broker
     needed at this scale), show a progress bar, then present all results
     as a downloadable ZIP of PNGs plus a single combined PDF (one poster
     per page) for easy printing.
   - Also generate a "grid" contact sheet PNG showing thumbnails of every
     generated poster, for quick admin review before printing/sending.

4. Store every generated poster in a Poster table (candidate_id, template
   name, file path, generated_at) so past posters can be re-downloaded
   without regenerating.
```

---

## 2. Bulk SMS

```
Extend Campaign Hub with a Bulk SMS module using the Africa's Talking API
(python package `africastalking`).

1. Settings page to store AT username + API key (from environment
   variables, never hardcoded) and the sender ID/short code.

2. Compose screen:
   - Choose a Contact List (or select individual Candidates' own contacts
     if this is a "vote for me" blast vs a voter announcement).
   - Message box with variable support: {{ name }}, {{ candidate_name }},
     {{ election_name }} — show a live character counter and SMS segment
     count (160 chars = 1 segment, warn when it'll split into multiple).
   - Preview: show the rendered message for the first 3 recipients before
     sending.
   - "Send test to my number" button before a full blast.

3. Sending:
   - Batch the send in chunks of 100 (Africa's Talking bulk limits), with a
     short delay between chunks to avoid rate limiting.
   - Log every message in an SmsLog table: recipient, rendered message,
     status (queued/sent/failed/delivered), AT message_id, cost, sent_at.
   - Poll or use AT's delivery report webhook to update status to
     "delivered"/"failed" after sending. Add a Flask route
     /webhooks/at-delivery to receive these.
   - Dashboard showing: total sent, delivered, failed, total cost, per
     campaign/blast.

4. Compliance: append "(Reply STOP to opt out)" automatically to marketing
   blasts, and keep an OptOut table (phone number) — check it before every
   send and skip opted-out numbers.
```

---

## 3. Bulk Email

```
Extend Campaign Hub with a Bulk Email module using Flask-Mail over SMTP
(Gmail or Zoho app password stored in environment variables — leave a
config comment showing where to swap in SendGrid/Mailgun later if volume
grows past what a personal SMTP account can handle, roughly 500/day).

1. Compose screen:
   - Rich text / HTML editor (use a lightweight JS library like Quill via
     CDN) for the email body, with the same {{ name }}, {{ candidate_name }},
     {{ election_name }} mail-merge variables as SMS.
   - Subject line field, also supports variables.
   - Optional: attach a previously generated poster/flyer (pull from the
     Poster table) automatically per recipient if the recipient is linked
     to a specific candidate.
   - "Send test to myself" before a full blast.

2. Sending:
   - Recipient source: a Contact List, or "everyone in this Election's
     contact lists combined, deduped by email".
   - Send via a background thread, batched (e.g. 20 at a time with a short
     pause) to stay under SMTP provider rate limits.
   - Log every send in an EmailLog table: recipient, subject, status
     (sent/failed/bounced), error message if failed, sent_at.
   - Handle SMTP errors gracefully — don't let one bad address kill the
     whole batch; continue and log the failure.

3. Dashboard: sent/failed counts per blast, searchable log, resend-failed
   button that only retries the ones that failed.
```

---

## 4. Video Compiler (field photos → short promo video)

```
Extend Campaign Hub with a Video module using MoviePy (Python, wraps
FFmpeg — make sure ffmpeg is available in the environment).

1. Per-candidate photo folder upload (multi-file upload, stored under
   /static/uploads/candidate_videos/<candidate_id>/).

2. Video template ("Field Recap"), roughly 30-45 seconds:
   - 0-3s: title card — candidate name + position + slogan, fading in over
     their profile photo, campaign color as background tint.
   - 3-30s: Ken Burns-style slow zoom/pan through the uploaded field
     photos, each shown ~3-4s with a crossfade transition between them.
     Auto-detect orientation (portrait/landscape) and letterbox/crop
     consistently so the whole video is one aspect ratio (offer 1:1 for
     Instagram feed and 9:16 for stories/reels).
   - 30-40s: closing card — "VOTE {{ candidate.name }} — {{ election.name }}"
     with contact/socials if provided.
   - Optional background music: let the admin upload one MP3 to use across
     all videos in an election, auto-ducked under any narration if added
     later; loop or trim to fit video length; fade out over the last 2s.
   - Optional text captions per photo (simple list of strings the admin
     can attach to specific photos, e.g. "Campus clean-up drive, August 2026").

3. Bulk generate: pick an Election, run the same template across every
   candidate who has photos uploaded, in a background job with a progress
   bar (this will be slow — CPU-bound video rendering — so run it in a
   worker thread, not the request thread, and let the admin navigate away
   and come back to check progress).

4. Store outputs in a Video table (candidate_id, file path, duration,
   aspect ratio, generated_at) with a simple in-browser <video> preview and
   download button.

5. Render at 1080p, H.264, reasonable bitrate (~5-8 Mbps) so files are
   small enough to send over WhatsApp/email without heavy compression
   destroying quality.
```

---

## Build order

1. Foundation (candidates/elections/contacts + admin shell)
2. Posters/flyers — the module you'll use most and can demo fastest
3. Bulk SMS
4. Bulk email
5. Video compiler (heaviest, do it last once the rest is stable)

## Before you start

- Create free/starter accounts and get API keys for: Africa's Talking
  (SMS), and pick an email sender (Gmail app password is fastest to set up).
- `pip install flask flask-sqlalchemy flask-migrate flask-mail playwright
  africastalking moviepy` then `playwright install chromium`.
- Keep every credential in a `.env` file, never in code — call this out to
  Antigravity explicitly if it ever hardcodes a key in a generated file.
