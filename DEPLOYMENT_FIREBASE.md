# Deploying ELECHUB to Firebase (Safe Subdomain or Default Firebase URL)

> **Important**: To protect your existing website at `muhumuzatusabe.online`, **do NOT connect or point your root domain (`@`)**. ELECHUB is configured to run either on a dedicated **subdomain** (e.g. `elechub.muhumuzatusabe.online`) or directly on the free Firebase URL (`https://<project-id>.web.app`). Your existing website will remain 100% untouched.

Firebase Hosting provides global CDN caching, automated SSL certificates, and custom subdomain mapping. Because **ELECHUB** is a dynamic Python/Flask application with media processing pipelines, it runs as a containerized backend on **Google Cloud Run**, integrated with **Firebase Hosting**.

---

## Architecture Overview

```
                   Dedicated Subdomain (or Firebase URL)
               elechub.muhumuzatusabe.online  /  *.web.app
                               │
                (Main website at muhumuzatusabe.online 
                 remains completely untouched!)
                               │
                               ▼
                  ┌──────────────────────────┐
                  │     Firebase Hosting     │  (Free SSL + Global CDN)
                  │      (firebase.json)     │
                  └────────────┬─────────────┘
                               │ Rewrites (**)
                               ▼
                  ┌──────────────────────────┐
                  │     Google Cloud Run     │  (Python 3.11 + Gunicorn)
                  │    Container: elechub    │  (Playwright + MoviePy)
                  └────────────┬─────────────┘
                               │
                     Database / Object Storage
```

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select your existing Google Cloud project).
3. Name your project (e.g., `elechub-campaign` or `muhumuzatech-campaign`).
4. Note your **Project ID** (e.g. `elechub-campaign-12345`).
5. Update [`.firebaserc`](file:///c:/Users/HP/Desktop/ELECHUB/.firebaserc) with this Project ID:
   ```json
   {
     "projects": {
       "default": "YOUR_PROJECT_ID_HERE"
     }
   }
   ```

---

## Step 2: Deploy the Backend to Cloud Run

You have two convenient ways to deploy the container:

### Option A: Using Google Cloud Console (No CLI needed)
1. Open the [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run).
2. Select your Firebase project from the top dropdown.
3. Click **Create Service**:
   - **Service name**: `elechub`
   - **Region**: `us-central1` (or matching your `firebase.json` region)
   - **Deployment source**: Continuously deploy from a Git repository (GitHub), or upload source code via Cloud Shell.
   - **Authentication**: Allow unauthenticated invocations (so Firebase Hosting can route public traffic to it).
   - **Container port**: `8080`.
4. Under **Environment variables**, set:
   - `ADMIN_PASSWORD`: Your secret admin password
   - `SECRET_KEY`: A strong random string
   - `DATABASE_URL`: Your database connection URL (or default SQLite)
5. Click **Create**.

### Option B: Using the `gcloud` CLI / Cloud Shell
From Google Cloud Shell or terminal:
```bash
# Build and deploy container directly
gcloud run deploy elechub \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars ADMIN_PASSWORD="your-secure-password",SECRET_KEY="your-secret-key"
```

---

## Step 3: Link Firebase Hosting

Once the Cloud Run service `elechub` is running:
1. Ensure your [`firebase.json`](file:///c:/Users/HP/Desktop/ELECHUB/firebase.json) matches the service name and region:
   ```json
   {
     "hosting": {
       "public": "public",
       "rewrites": [
         {
           "source": "**",
           "run": {
             "serviceId": "elechub",
             "region": "us-central1"
           }
         }
       ]
     }
   }
   ```
2. In Firebase Console, go to **Hosting** -> **Get Started** -> Deploy hosting.

---

## Step 4: Connect a Safe Subdomain (e.g., `elechub.muhumuzatusabe.online`)

> **Note**: Do NOT add `muhumuzatusabe.online` as the root domain if you have an existing website running on it. Instead, connect a **subdomain** so your main website stays live and unaffected.

1. In the [Firebase Console](https://console.firebase.google.com/), open **Build** -> **Hosting**.
2. Click **Add custom domain**.
3. Enter your chosen subdomain: **`elechub.muhumuzatusabe.online`**.
4. Firebase will give you a single **CNAME** record to add in your domain registrar's DNS manager (e.g. Namecheap, GoDaddy, Cloudflare):
   ```
   Type:  CNAME
   Host:  elechub
   Value: <your-firebase-project-id>.web.app
   ```
   *(Your root website `@` DNS records remain completely untouched!)*
5. **SSL Certificate**: Firebase will automatically generate a free SSL certificate for `elechub.muhumuzatusabe.online`. Once DNS propagates (typically 15–30 minutes), both your main website and ELECHUB will work side by side independently.

---

## Step 5: Persistent Storage for Photos & Videos in Production

On Cloud Run/Firebase, server instances scale down to 0 when idle, meaning local files like `/static/uploads/` should ideally use cloud storage:
- In production, configure **Firebase Storage** (Google Cloud Storage bucket).
- Files uploaded by candidates will be saved to your bucket, accessible globally via CDN URLs.
- Database: For permanent persistence across elections, connect **Cloud SQL (PostgreSQL)** or **Supabase PostgreSQL** via the `DATABASE_URL` environment variable.
