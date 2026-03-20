from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
from functools import wraps

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# ==============================================================
# DB HELPER — uses PostgreSQL on Render, SQLite locally
# ==============================================================
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Running on Render with PostgreSQL
    import psycopg2
    import psycopg2.extras

    def get_db_connection():
        # Render gives postgres:// but psycopg2 needs postgresql://
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url)
        conn.autocommit = False
        return conn

    def init_db():
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                instructor TEXT NOT NULL,
                description TEXT,
                telegram_link TEXT,
                price TEXT,
                thumbnail TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                course_type TEXT DEFAULT 'video',
                pdf_file TEXT DEFAULT ''
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                receipt TEXT,
                status TEXT DEFAULT 'pending'
            )
        """)
        conn.commit()
        cur.close()
        conn.close()

    # Initialize DB tables on startup
    with app.app_context():
        init_db()

else:
    # Running on SQLite (local or Render without PostgreSQL)
    def get_db_connection():
        conn = sqlite3.connect('database.db')
        conn.row_factory = sqlite3.Row
        return conn

    def init_db():
        conn = get_db_connection()
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "name TEXT NOT NULL,"
            "email TEXT UNIQUE NOT NULL,"
            "password TEXT NOT NULL)"
        )
        conn.execute(
            "CREATE TABLE IF NOT EXISTS courses ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "title TEXT NOT NULL,"
            "instructor TEXT NOT NULL,"
            "description TEXT,"
            "telegram_link TEXT,"
            "price TEXT,"
            "thumbnail TEXT DEFAULT '',"
            "is_active INTEGER DEFAULT 1,"
            "course_type TEXT DEFAULT 'video',"
            "pdf_file TEXT DEFAULT '')"
        )
        conn.execute(
            "CREATE TABLE IF NOT EXISTS purchases ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "user_id INTEGER NOT NULL,"
            "course_id INTEGER NOT NULL,"
            "receipt TEXT,"
            "status TEXT DEFAULT 'pending')"
        )
        conn.commit()
        conn.close()

    with app.app_context():
        init_db()

# ==============================================================
# CONTEXT PROCESSOR
# ==============================================================
@app.context_processor
def inject_user():
    return {
        'logged_in': 'user_id' in session,
        'username':  session.get('user_name', ''),
        'is_admin':  session.get('is_admin', False),
    }

# ==============================================================
# AUTH DECORATORS
# ==============================================================
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in to continue.")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in to continue.")
            return redirect(url_for('login'))
        if not session.get('is_admin'):
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated

# ==============================================================
# HOME
# ==============================================================
@app.route('/')
def home():
    conn = get_db_connection()
    courses = conn.execute("SELECT * FROM courses WHERE is_active=1").fetchall()
    conn.close()
    return render_template("home.html", courses=courses)

# ==============================================================
# REGISTER
# ==============================================================
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name     = request.form['username']
        email    = request.form['email']
        password = generate_password_hash(request.form['password'])

        conn = get_db_connection()
        try:
            conn.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                (name, email, password)
            )
            conn.commit()
            conn.close()
            flash("Account created! Please log in.")
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            conn.close()
            flash("Email already registered. Please log in.")
            return redirect(url_for('register'))

    return render_template('register.html')

# ==============================================================
# LOGIN
# ==============================================================
ADMIN_EMAILS = ['theseraphicd3signer@gmail.com', 'bellaonyi5@gmail.com']

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email    = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session.permanent = True
            session['user_id']   = user['id']
            session['user_name'] = user['name']
            session['is_admin']  = email in ADMIN_EMAILS
            if session['is_admin']:
                return redirect(url_for('admin_purchases'))
            return redirect(url_for('dashboard'))
        else:
            flash("Invalid email or password.")
            return redirect(url_for('login'))

    return render_template('login.html')

# ==============================================================
# LOGOUT
# ==============================================================
@app.route('/logout')
def logout():
    session.clear()
    flash("You have been logged out.")
    return redirect(url_for('home'))

# ==============================================================
# DASHBOARD
# ==============================================================
@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    conn = get_db_connection()
    courses = conn.execute("""
        SELECT courses.title, purchases.status, courses.id, courses.telegram_link
        FROM purchases
        JOIN courses ON purchases.course_id = courses.id
        WHERE purchases.user_id = ?
    """, (user_id,)).fetchall()
    conn.close()
    return render_template("dashboard.html", courses=courses)

# ==============================================================
# ALL COURSES
# ==============================================================
@app.route('/courses')
def courses():
    conn = get_db_connection()
    courses = conn.execute("SELECT * FROM courses WHERE is_active=1").fetchall()
    conn.close()
    return render_template('courses.html', courses=courses)

# ==============================================================
# COURSE DETAIL
# ==============================================================
@app.route('/course/<int:course_id>')
def course_detail(course_id):
    conn = get_db_connection()
    course = conn.execute(
        "SELECT * FROM courses WHERE id = ?", (course_id,)
    ).fetchone()

    purchased = None
    if 'user_id' in session:
        purchased = conn.execute(
            "SELECT * FROM purchases WHERE user_id = ? AND course_id = ?",
            (session['user_id'], course_id)
        ).fetchone()

    conn.close()
    return render_template("course_detail.html", course=course, purchased=purchased)

# ==============================================================
# BUY COURSE
# ==============================================================
@app.route('/course/<int:course_id>/buy', methods=['GET', 'POST'])
@login_required
def buy_course(course_id):
    if request.method == 'POST':
        receipt  = request.files['receipt']
        filename = secure_filename(receipt.filename)
        os.makedirs('static/receipts', exist_ok=True)
        filepath = os.path.join('static/receipts', filename)
        receipt.save(filepath)

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO purchases (user_id, course_id, receipt) VALUES (?, ?, ?)",
            (session['user_id'], course_id, filename)
        )
        conn.commit()
        conn.close()
        flash("Receipt submitted! We will review and approve your access shortly.")
        return redirect(url_for('dashboard'))

    conn = get_db_connection()
    course = conn.execute(
        "SELECT * FROM courses WHERE id = ?", (course_id,)
    ).fetchone()
    conn.close()
    return render_template('buy_course.html', course=course)

# ==============================================================
# ADMIN: ADD COURSE
# ==============================================================
@app.route('/admin/add-course', methods=['GET', 'POST'])
@admin_required
def add_course():
    if request.method == 'POST':
        title       = request.form['title']
        instructor  = request.form['instructor']
        description = request.form['description']
        price       = request.form['price']
        course_type = request.form.get('course_type', 'video')
        telegram_link = request.form.get('telegram_link', '')

        # Handle thumbnail
        thumbnail_filename = ''
        if 'thumbnail' in request.files:
            thumbnail = request.files['thumbnail']
            if thumbnail and thumbnail.filename != '':
                thumbnail_filename = secure_filename(thumbnail.filename)
                os.makedirs('static/images', exist_ok=True)
                thumbnail.save(os.path.join('static/images', thumbnail_filename))

        # Handle PDF upload
        pdf_filename = ''
        if course_type == 'pdf' and 'pdf_file' in request.files:
            pdf = request.files['pdf_file']
            if pdf and pdf.filename != '':
                pdf_filename = secure_filename(pdf.filename)
                os.makedirs('static/pdfs', exist_ok=True)
                pdf.save(os.path.join('static/pdfs', pdf_filename))

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO courses (title, instructor, description, telegram_link, price, course_type, pdf_file, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (title, instructor, description, telegram_link, price, course_type, pdf_filename, thumbnail_filename)
        )
        conn.commit()
        conn.close()
        flash("Course published successfully!")
        return redirect(url_for('admin_courses'))

    return render_template('add_course.html')

# ==============================================================
# ADMIN: VIEW PURCHASES
# ==============================================================
@app.route('/admin/purchases')
@admin_required
def admin_purchases():
    conn = get_db_connection()
    purchases = conn.execute("""
        SELECT purchases.id, users.email, courses.title,
               purchases.receipt, purchases.status
        FROM purchases
        JOIN users ON purchases.user_id = users.id
        JOIN courses ON purchases.course_id = courses.id
        ORDER BY purchases.id DESC
    """).fetchall()
    conn.close()
    return render_template("admin_purchases.html", purchases=purchases)

# ==============================================================
# ADMIN: APPROVE PURCHASE
# ==============================================================
@app.route('/admin/approve/<int:purchase_id>')
@admin_required
def approve_purchase(purchase_id):
    conn = get_db_connection()
    conn.execute(
        "UPDATE purchases SET status = 'approved' WHERE id = ?", (purchase_id,)
    )
    conn.commit()
    conn.close()
    flash("Purchase approved!")
    return redirect(url_for('admin_purchases'))

# ==============================================================
# ADMIN: MANAGE COURSES
# ==============================================================
@app.route('/admin/courses')
@admin_required
def admin_courses():
    conn = get_db_connection()
    courses = conn.execute("SELECT * FROM courses ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("admin_courses.html", courses=courses)

# ==============================================================
# ADMIN: EDIT COURSE
# ==============================================================
@app.route('/admin/courses/edit/<int:course_id>', methods=['GET', 'POST'])
@admin_required
def edit_course(course_id):
    conn = get_db_connection()

    if request.method == 'POST':
        title         = request.form['title']
        instructor    = request.form['instructor']
        description   = request.form['description']
        telegram_link = request.form['telegram_link']
        price         = request.form['price']
        is_active     = request.form['is_active']

        thumbnail_filename = None
        if 'thumbnail' in request.files:
            thumbnail = request.files['thumbnail']
            if thumbnail and thumbnail.filename != '':
                thumbnail_filename = secure_filename(thumbnail.filename)
                os.makedirs('static/images', exist_ok=True)
                thumbnail.save(os.path.join('static/images', thumbnail_filename))

        # Handle PDF upload
        pdf_filename = None
        course_type = request.form.get('course_type', 'video')
        if course_type == 'pdf' and 'pdf_file' in request.files:
            pdf = request.files['pdf_file']
            if pdf and pdf.filename != '':
                pdf_filename = secure_filename(pdf.filename)
                os.makedirs('static/pdfs', exist_ok=True)
                pdf.save(os.path.join('static/pdfs', pdf_filename))

        if thumbnail_filename and pdf_filename:
            conn.execute("""
                UPDATE courses
                SET title=?, instructor=?, description=?, telegram_link=?, price=?, is_active=?, thumbnail=?, course_type=?, pdf_file=?
                WHERE id=?
            """, (title, instructor, description, telegram_link, price, is_active, thumbnail_filename, course_type, pdf_filename, course_id))
        elif thumbnail_filename:
            conn.execute("""
                UPDATE courses
                SET title=?, instructor=?, description=?, telegram_link=?, price=?, is_active=?, thumbnail=?, course_type=?
                WHERE id=?
            """, (title, instructor, description, telegram_link, price, is_active, thumbnail_filename, course_type, course_id))
        elif pdf_filename:
            conn.execute("""
                UPDATE courses
                SET title=?, instructor=?, description=?, telegram_link=?, price=?, is_active=?, course_type=?, pdf_file=?
                WHERE id=?
            """, (title, instructor, description, telegram_link, price, is_active, course_type, pdf_filename, course_id))
        else:
            conn.execute("""
                UPDATE courses
                SET title=?, instructor=?, description=?, telegram_link=?, price=?, is_active=?, course_type=?
                WHERE id=?
            """, (title, instructor, description, telegram_link, price, is_active, course_type, course_id))

        conn.commit()
        conn.close()
        flash("Course updated successfully!")
        return redirect(url_for('admin_courses'))

    course = conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    conn.close()
    return render_template("edit_course.html", course=course)

# ==============================================================
# ADMIN: TOGGLE COURSE VISIBILITY
# ==============================================================
@app.route('/admin/courses/toggle/<int:course_id>')
@admin_required
def toggle_course(course_id):
    conn = get_db_connection()
    course = conn.execute("SELECT is_active FROM courses WHERE id=?", (course_id,)).fetchone()
    new_status = 0 if course['is_active'] else 1
    conn.execute("UPDATE courses SET is_active=? WHERE id=?", (new_status, course_id))
    conn.commit()
    conn.close()
    flash("Course visibility updated!")
    return redirect(url_for('admin_courses'))

# ==============================================================
# ADMIN: DELETE COURSE
# ==============================================================
@app.route('/admin/courses/delete/<int:course_id>')
@admin_required
def delete_course(course_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM purchases WHERE course_id=?", (course_id,))
    conn.execute("DELETE FROM courses WHERE id=?", (course_id,))
    conn.commit()
    conn.close()
    flash("Course deleted successfully.")
    return redirect(url_for('admin_courses'))

# ==============================================================
# COURSE CONTENT (PDF viewer or Telegram redirect)
# ==============================================================
@app.route('/course/<int:course_id>/content')
@login_required
def course_content(course_id):
    # Check user has approved access
    conn = get_db_connection()
    purchase = conn.execute(
        "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
        (session['user_id'], course_id)
    ).fetchone()
    course = conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    conn.close()

    if not purchase:
        flash("You do not have access to this course yet.")
        return redirect(url_for('dashboard'))

    return render_template('course_content.html', course=course)


@app.route('/course/<int:course_id>/pdf')
@login_required
def serve_pdf(course_id):
    # Serve PDF inline for the iframe viewer
    conn = get_db_connection()
    purchase = conn.execute(
        "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
        (session['user_id'], course_id)
    ).fetchone()
    course = conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    conn.close()

    if not purchase:
        return "Access denied", 403

    from flask import send_from_directory
    return send_from_directory('static/pdfs', course['pdf_file'])


@app.route('/course/<int:course_id>/download')
@login_required
def download_pdf(course_id):
    conn = get_db_connection()
    purchase = conn.execute(
        "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
        (session['user_id'], course_id)
    ).fetchone()
    course = conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    conn.close()

    if not purchase:
        return "Access denied", 403

    from flask import send_from_directory
    return send_from_directory('static/pdfs', course['pdf_file'], as_attachment=True)


# ==============================================================
# RUN
# ==============================================================
if __name__ == "__main__":
    app.run(debug=True)