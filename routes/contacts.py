from flask import Blueprint, render_template, request, redirect, url_for, flash, Response
from auth import login_required
from models import db, ContactList, Contact, Election
from utils.csv_helpers import parse_contact_csv, normalize_phone

contacts_bp = Blueprint('contacts', __name__, url_prefix='/contact-lists')

@contacts_bp.route('/')
@login_required
def index():
    election_id = request.args.get('election_id', type=int)
    query = ContactList.query
    if election_id:
        query = query.filter_by(election_id=election_id)
    contact_lists = query.order_by(ContactList.created_at.desc()).all()
    elections = Election.query.order_by(Election.name).all()
    return render_template('contacts/index.html', contact_lists=contact_lists, elections=elections, selected_election_id=election_id)

@contacts_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    elections = Election.query.order_by(Election.name).all()
    if not elections:
        flash('Please create an Election first before creating Contact Lists.', 'warning')
        return redirect(url_for('elections.new'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        election_id = request.form.get('election_id', type=int)

        if not name or not election_id:
            flash('List name and election are required.', 'danger')
            return render_template('contacts/form.html', contact_list=None, elections=elections)

        contact_list = ContactList(name=name, election_id=election_id)
        db.session.add(contact_list)
        db.session.commit()
        flash(f'Contact List "{contact_list.name}" created.', 'success')
        return redirect(url_for('contacts.view', id=contact_list.id))

    return render_template('contacts/form.html', contact_list=None, elections=elections)

@contacts_bp.route('/<int:id>')
@login_required
def view(id):
    contact_list = ContactList.query.get_or_404(id)
    contacts = Contact.query.filter_by(contact_list_id=id).order_by(Contact.name).all()
    return render_template('contacts/view.html', contact_list=contact_list, contacts=contacts)

@contacts_bp.route('/<int:id>/add-contact', methods=['POST'])
@login_required
def add_contact(id):
    contact_list = ContactList.query.get_or_404(id)
    name = request.form.get('name', '').strip()
    raw_phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip() or None

    if not name or not raw_phone:
        flash('Contact name and phone number are required.', 'danger')
        return redirect(url_for('contacts.view', id=id))

    phone = normalize_phone(raw_phone)
    if not phone:
        flash(f'Invalid phone number format: "{raw_phone}". Please provide a valid phone number.', 'danger')
        return redirect(url_for('contacts.view', id=id))

    # Check for duplicate in this list
    existing = Contact.query.filter_by(contact_list_id=id, phone=phone).first()
    if existing:
        flash(f'A contact with phone {phone} already exists in this list.', 'warning')
        return redirect(url_for('contacts.view', id=id))

    contact = Contact(
        contact_list_id=id,
        name=name,
        phone=phone,
        email=email
    )
    db.session.add(contact)
    db.session.commit()
    flash(f'Contact "{name}" added successfully.', 'success')
    return redirect(url_for('contacts.view', id=id))

@contacts_bp.route('/<int:id>/upload-csv', methods=['GET', 'POST'])
@login_required
def upload_csv(id):
    contact_list = ContactList.query.get_or_404(id)

    if request.method == 'POST':
        csv_file = request.files.get('csv_file')
        if not csv_file or csv_file.filename == '':
            flash('Please select a CSV file to upload.', 'danger')
            return redirect(url_for('contacts.upload_csv', id=id))

        if not csv_file.filename.lower().endswith('.csv'):
            flash('Only CSV files are accepted.', 'danger')
            return redirect(url_for('contacts.upload_csv', id=id))

        # Existing pairs for deduplication
        existing_contacts = Contact.query.filter_by(contact_list_id=id).all()
        existing_pairs = {(c.phone, c.email or '') for c in existing_contacts}

        valid_contacts, stats, errors = parse_contact_csv(csv_file.stream, existing_pairs=existing_pairs)

        if valid_contacts:
            new_objs = [
                Contact(
                    contact_list_id=id,
                    name=item['name'],
                    phone=item['phone'],
                    email=item['email']
                )
                for item in valid_contacts
            ]
            db.session.bulk_save_objects(new_objs)
            db.session.commit()

        flash_msg = (
            f"CSV Processed: {stats['imported']} contacts successfully added. "
            f"{stats['duplicates']} duplicate(s) skipped. "
            f"{stats['invalid']} invalid row(s) skipped."
        )
        if stats['imported'] > 0:
            flash(flash_msg, 'success')
        else:
            flash(flash_msg, 'warning')

        if errors:
            flash("Sample warnings: " + "; ".join(errors[:3]), 'info')

        return redirect(url_for('contacts.view', id=id))

    return render_template('contacts/upload_csv.html', contact_list=contact_list)

@contacts_bp.route('/contacts/<int:id>/delete', methods=['POST'])
@login_required
def delete_contact(id):
    contact = Contact.query.get_or_404(id)
    list_id = contact.contact_list_id
    db.session.delete(contact)
    db.session.commit()
    flash('Contact removed from list.', 'info')
    return redirect(url_for('contacts.view', id=list_id))

@contacts_bp.route('/<int:id>/delete', methods=['POST'])
@login_required
def delete(id):
    contact_list = ContactList.query.get_or_404(id)
    name = contact_list.name
    db.session.delete(contact_list)
    db.session.commit()
    flash(f'Contact List "{name}" and all contacts deleted.', 'info')
    return redirect(url_for('contacts.index'))

@contacts_bp.route('/sample-csv')
@login_required
def sample_csv():
    csv_data = "name,phone,email\n" \
               "Voter Name,+256700000001,voter1@campus.ac.ug\n" \
               "Student Name,+256700000002,voter2@campus.ac.ug\n"
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=elechub_voters_template.csv"}
    )
