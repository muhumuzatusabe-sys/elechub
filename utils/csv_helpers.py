import csv
import io
import re

def normalize_phone(phone_str, default_country_code='+256'):
    """
    Standardizes phone numbers.
    Removes spaces, hyphens, brackets.
    If Ugandan number starts with 07..., converts to +2567...
    """
    if not phone_str:
        return None
    # Strip all whitespace, dashes, parentheses
    cleaned = re.sub(r'[\s\-\(\)\.]', '', str(phone_str).strip())
    
    # Handle Ugandan 07xx / 03xx numbers
    if re.match(r'^0[73]\d{8}$', cleaned):
        return f"{default_country_code}{cleaned[1:]}"
    elif re.match(r'^256[73]\d{8}$', cleaned):
        return f"+{cleaned}"
    elif re.match(r'^\+[1-9]\d{7,14}$', cleaned):
        return cleaned
    elif re.match(r'^\d{9,15}$', cleaned):
        return f"+{cleaned}"
    
    # If it has at least 7 digits, keep it cleaned
    digits_only = re.sub(r'\D', '', cleaned)
    if len(digits_only) >= 7:
        return cleaned
    
    return None

def parse_contact_csv(file_stream, existing_pairs=None):
    """
    Parses CSV and returns:
    - valid_contacts: list of dicts [{'name': ..., 'phone': ..., 'email': ...}]
    - stats: {'total_rows': int, 'imported': int, 'duplicates': int, 'invalid': int}
    - errors: list of error strings
    """
    if existing_pairs is None:
        existing_pairs = set()

    # Read and decode stream, handling possible UTF-8 BOM
    content = file_stream.read()
    if isinstance(content, bytes):
        try:
            text = content.decode('utf-8-sig')
        except UnicodeDecodeError:
            text = content.decode('latin-1')
    else:
        text = str(content)

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if not rows:
        return [], {'total_rows': 0, 'imported': 0, 'duplicates': 0, 'invalid': 0}, ["Uploaded file is empty."]

    # Header detection
    headers = [h.strip().lower() for h in rows[0]]
    
    # Find column indexes
    name_idx = None
    phone_idx = None
    email_idx = None

    for i, col in enumerate(headers):
        if col in ('name', 'full name', 'fullname', 'voter', 'voter name', 'contact name'):
            name_idx = i
        elif col in ('phone', 'mobile', 'tel', 'telephone', 'phone number', 'contact'):
            phone_idx = i
        elif col in ('email', 'mail', 'email address', 'e-mail'):
            email_idx = i

    # Fallback to positional if standard headers aren't detected
    if name_idx is None and len(headers) > 0:
        name_idx = 0
    if phone_idx is None and len(headers) > 1:
        phone_idx = 1
    if email_idx is None and len(headers) > 2:
        email_idx = 2

    if phone_idx is None:
        return [], {'total_rows': len(rows) - 1, 'imported': 0, 'duplicates': 0, 'invalid': len(rows) - 1}, [
            "Could not identify a 'phone' column in CSV. Headers found: " + ", ".join(headers)
        ]

    valid_contacts = []
    seen_in_file = set()
    duplicate_count = 0
    invalid_count = 0
    errors = []

    # Iterate through data rows
    for row_num, row in enumerate(rows[1:], start=2):
        if not any(cell.strip() for cell in row):
            continue  # skip empty lines

        name = row[name_idx].strip() if name_idx is not None and name_idx < len(row) else ''
        raw_phone = row[phone_idx].strip() if phone_idx < len(row) else ''
        raw_email = row[email_idx].strip() if email_idx is not None and email_idx < len(row) else ''

        if not name:
            name = f"Voter {raw_phone or row_num}"

        phone = normalize_phone(raw_phone)
        if not phone:
            invalid_count += 1
            if len(errors) < 10:
                errors.append(f"Row {row_num}: Invalid phone number '{raw_phone}'.")
            continue

        email = raw_email.lower() if raw_email else None
        if email and not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
            email = None  # don't discard row for bad email, just ignore invalid email string

        dedupe_key = (phone, email or '')

        # Check for duplication within CSV or already in list
        if dedupe_key in seen_in_file or dedupe_key in existing_pairs:
            duplicate_count += 1
            continue

        seen_in_file.add(dedupe_key)
        valid_contacts.append({
            'name': name,
            'phone': phone,
            'email': email
        })

    total_data_rows = len(rows) - 1
    stats = {
        'total_rows': total_data_rows,
        'imported': len(valid_contacts),
        'duplicates': duplicate_count,
        'invalid': invalid_count
    }

    return valid_contacts, stats, errors
