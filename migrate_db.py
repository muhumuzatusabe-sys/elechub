import sqlite3
import os

candidates_cols = [
    ('ballot_number', "TEXT DEFAULT '1'"),
    ('faculty_or_hall', "TEXT"),
    ('campaign_tagline', "TEXT"),
    ('manifesto_points', "TEXT"),
    ('logo_url', "TEXT"),
    ('social_handles', "TEXT"),
    ('primary_color', "TEXT DEFAULT '#2563eb'"),
    ('secondary_color', "TEXT DEFAULT '#f59e0b'"),
    ('accent_color', "TEXT DEFAULT '#10b981'")
]

sms_campaigns_cols = [
    ('sender_id', "TEXT"),
    ('sent_count', "INTEGER DEFAULT 0"),
    ('delivered_count', "INTEGER DEFAULT 0"),
    ('failed_count', "INTEGER DEFAULT 0"),
    ('opt_out_count', "INTEGER DEFAULT 0"),
    ('total_cost', "TEXT DEFAULT 'UGX 0.00'")
]

email_campaigns_cols = [
    ('sent_count', "INTEGER DEFAULT 0"),
    ('failed_count', "INTEGER DEFAULT 0"),
    ('attach_poster', "BOOLEAN DEFAULT 0")
]

paths = [
    os.path.join(os.path.dirname(__file__), 'instance', 'elechub.db')
]

for db_path in paths:
    if os.path.exists(db_path):
        print("Migrating:", db_path)
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        try:
            cur.execute('PRAGMA table_info(candidates)')
            cols = [r[1] for r in cur.fetchall()]
            for col_name, col_type in candidates_cols:
                if col_name not in cols:
                    cur.execute(f"ALTER TABLE candidates ADD COLUMN {col_name} {col_type}")
                    print(f"Added column {col_name} to {db_path}")

            cur.execute('PRAGMA table_info(contacts)')
            contact_cols = [r[1] for r in cur.fetchall()]
            if 'hall_or_college' not in contact_cols:
                cur.execute("ALTER TABLE contacts ADD COLUMN hall_or_college TEXT")
                print(f"Added column hall_or_college to {db_path}")

            cur.execute('PRAGMA table_info(sms_campaigns)')
            sms_cols = [r[1] for r in cur.fetchall()]
            for col_name, col_type in sms_campaigns_cols:
                if col_name not in sms_cols:
                    cur.execute(f"ALTER TABLE sms_campaigns ADD COLUMN {col_name} {col_type}")
                    print(f"Added column {col_name} to sms_campaigns in {db_path}")

            cur.execute('PRAGMA table_info(email_campaigns)')
            email_cols = [r[1] for r in cur.fetchall()]
            for col_name, col_type in email_campaigns_cols:
                if col_name not in email_cols:
                    cur.execute(f"ALTER TABLE email_campaigns ADD COLUMN {col_name} {col_type}")
                    print(f"Added column {col_name} to email_campaigns in {db_path}")

            conn.commit()
        except sqlite3.OperationalError as e:
            print("Table migration notice:", e)
        finally:
            conn.close()

from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print("All tables synced via SQLAlchemy create_all in instance/elechub.db!")
