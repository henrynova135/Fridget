import os, re, sqlite3, secrets, smtplib, hashlib, hmac, time
from datetime import timedelta, datetime, timezone
from pathlib import Path
from flask import Blueprint, Flask, jsonify, render_template, request, session, g, redirect, url_for, abort
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from dotenv import load_dotenv
from email_validator import validate_email, EmailNotValidError
from email.message import EmailMessage

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DB_PATH = BASE_DIR / "fridget.sqlite3"
app = Flask(__name__, template_folder=str(BASE_DIR / "nav"), static_folder=str(BASE_DIR / "static"))

home_bp = Blueprint(
    'home', __name__,
    template_folder=str(BASE_DIR / "home" / "templates"),
    static_folder=str(BASE_DIR / "home" / "home.static"),
    static_url_path='/home.static'
)

OurTeam_bp = Blueprint(
    'OurTeam', __name__,
    template_folder=str(BASE_DIR / "OurTeam" / "templates"),
    static_folder=str(BASE_DIR / "OurTeam" / "OurTeam.static"),
    static_url_path='/OurTeam.static'
)

recipes_bp = Blueprint(
    'recipes', __name__,
    template_folder=str(BASE_DIR / "recipes" / "templates"),
    static_folder=str(BASE_DIR / "recipes" / "recipes.static"),
    static_url_path='/recipes.static'
)

Myaccount = Blueprint(
    'Myaccount', __name__,
    template_folder=str(BASE_DIR / "Myaccount" / "acctemplate"),
    static_folder=str(BASE_DIR / "Myaccount" / "accstatic"),
    static_url_path='/Myaccount.static'
)

@OurTeam_bp.route('/OurTeam')
def OurTeam():
    return render_template('OurTeam.html')

@recipes_bp.route('/recipes')
def recipes():
    return render_template('recipes.html')

SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "").strip()
if not SECRET_KEY and os.environ.get("FLASK_DEBUG", "0") != "1":
    raise RuntimeError("FLASK_SECRET_KEY must be configured in the environment.")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)

app.config.update(
    SECRET_KEY=SECRET_KEY,
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "1") == "1",
    MAX_CONTENT_LENGTH=3 * 1024 * 1024,
)

# Small in-process throttle for authentication endpoints. For multi-worker production,
# replace this with a shared Redis-backed limiter.
_AUTH_ATTEMPTS = {}
def auth_rate_limited(limit=8, window=300):
    now = time.time()
    ip = request.remote_addr or "unknown"
    key = (request.endpoint, ip)
    attempts = [stamp for stamp in _AUTH_ATTEMPTS.get(key, []) if now - stamp < window]
    if len(attempts) >= limit:
        _AUTH_ATTEMPTS[key] = attempts
        return True
    attempts.append(now)
    _AUTH_ATTEMPTS[key] = attempts
    return False

def send_verification_email(recipient, code):
    host = os.environ.get("SMTP_HOST", "").strip()
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", username).strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    use_ssl = os.environ.get("SMTP_USE_SSL", "0") == "1"
    if not all((host, username, password, sender)):
        raise RuntimeError("Email verification is not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM.")
    msg = EmailMessage()
    msg["Subject"] = "Verify your Fridget account"
    msg["From"] = sender
    msg["To"] = recipient
    msg.set_content(
        "Your Fridget verification code is: " + code +
        "\\n\\nThis code expires in 10 minutes. If you did not request this, you can ignore this email."
    )
    smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
    with smtp_class(host, port, timeout=15) as server:
        if not use_ssl:
            server.starttls()
        server.login(username, password)
        server.send_message(msg)

def valid_email_address(value):
    try:
        result = validate_email(value, check_deliverability=True)
        return result.normalized.lower()
    except EmailNotValidError:
        return None

def issue_verification_code(email):
    code = f"{secrets.randbelow(1_000_000):06d}"
    digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
    expires = int(time.time()) + 600
    db().execute(
        "INSERT INTO email_verifications(email,code_hash,expires_at,attempts) VALUES(?,?,?,0) "
        "ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0",
        (email, digest, expires)
    )
    db().commit()
    try:
        send_verification_email(email, code)
    except Exception:
        db().execute("DELETE FROM email_verifications WHERE email=?", (email,))
        db().commit()
        raise

def send_password_reset_email(recipient, code):
    host = os.environ.get("SMTP_HOST", "").strip()
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("SMTP_FROM", username).strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    use_ssl = os.environ.get("SMTP_USE_SSL", "0") == "1"
    if not all((host, username, password, sender)):
        raise RuntimeError("SMTP is not configured.")
    msg = EmailMessage()
    msg["Subject"] = "Reset your Fridget password"
    msg["From"] = sender
    msg["To"] = recipient
    msg.set_content(
        "Your Fridget password reset code is: " + code +
        "\n\nThis code expires in 10 minutes. If you did not request this, ignore this email."
    )
    smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
    with smtp_class(host, port, timeout=15) as server:
        if not use_ssl:
            server.starttls()
        server.login(username, password)
        server.send_message(msg)

def issue_password_reset_code(email):
    code = f"{secrets.randbelow(1_000_000):06d}"
    digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
    expires = int(time.time()) + 600
    db().execute(
        "INSERT INTO password_resets(email,code_hash,expires_at,attempts) VALUES(?,?,?,0) "
        "ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0",
        (email, digest, expires)
    )
    db().commit()
    try:
        send_password_reset_email(email, code)
    except Exception:
        db().execute("DELETE FROM password_resets WHERE email=?", (email,))
        db().commit()
        raise

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
WEBSITE_CONTEXT = """
You are Fridget, the official AI assistant for the Fridget website.

ABOUT FRIDGET:
Fridget is a cooking and recipe website.
Its purpose is to help users discover and explore recipes.

WEBSITE FEATURES:
- Home page: Main website landing page.
- Recipes: Browse available recipes.
- Search: Search recipes.
- Categories: Breakfast, Lunch, Dinner and Dessert.
- Wishlist: Save favourite recipes, if this feature is enabled.

RULES:
1. You represent Fridget, not a general recipe generator.
2. Only recommend recipes present in the supplied recipe database.
3. Never invent, create, or modify recipes.
4. Never claim a recipe exists unless it appears in the database.
5. If a requested recipe is unavailable, clearly say it is not currently in Fridget.
6. Answer questions about Fridget using the supplied website information.
7. Do not invent website features or claim functionality that is not implemented.
8. You may explain general cooking concepts, but distinguish them from Fridget's actual recipes.
9.Only says recipes name first if the user ask and only tell them about ingredients and other only if user ask
10. Make your own words about receipes and ingredients and don't give formal database and make it natural wording.
11.If user reply sure, go ahead, proceed, yes and other positive calls, proceed to what you said to the user
"""
def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.after_request
def add_security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if request.is_secure:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

@app.teardown_appcontext
def close_db(error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()

def init_db():
    with sqlite3.connect(DB_PATH) as con:
        con.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            display_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            bio TEXT NOT NULL DEFAULT '',
            avatar_data TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
        # Safe migration for databases created by earlier Fridget versions.
        columns = {row[1] for row in con.execute("PRAGMA table_info(users)")}
        if "bio" not in columns:
            con.execute("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''")
        if "avatar_data" not in columns:
            con.execute("ALTER TABLE users ADD COLUMN avatar_data TEXT NOT NULL DEFAULT ''")
        if "email_verified" not in columns:
            con.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0")
        con.execute("""CREATE TABLE IF NOT EXISTS email_verifications (
            email TEXT PRIMARY KEY COLLATE NOCASE,
            code_hash TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0
        )""")
        con.execute("""CREATE TABLE IF NOT EXISTS password_resets (
            email TEXT PRIMARY KEY COLLATE NOCASE,
            code_hash TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0
        )""")

def csrf_token():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    return session["csrf_token"]

def json_body():
    return request.get_json(silent=True) or {}

def require_csrf(data):
    token = data.get("csrf_token", "")
    return bool(token and secrets.compare_digest(token, session.get("csrf_token", "")))

def current_user():
    uid = session.get("user_id")
    if not uid: return None
    return db().execute("SELECT id, display_name, email, username FROM users WHERE id=?", (uid,)).fetchone()

def user_json(user):
    return {"id": user["id"], "display_name": user["display_name"], "email": user["email"], "username": user["username"]}

import json

JSON_PATH = BASE_DIR / "database.json"

def load_recipes():
    with open(JSON_PATH, "r", encoding="utf-8") as file:
        return json.load(file)

@app.get("/")
def index():
    # The real landing page is Home; nav/index.html is only a legacy nav fragment.
    return render_template("home.html")

@app.get("/home")
def home_page():
    return redirect(url_for("index"))

@app.get("/nav")
def nav_preview():
    return redirect(url_for("index"))

@app.get("/wishlist")
def wishlist_page():
    return render_template("wishlist.html")

@app.get("/account")
def account_page():
    if not current_user():
        # Keep the visitor on the page they came from and open its sign-in dialog.
        referrer = request.referrer or ""
        if referrer.startswith(request.host_url):
            parts = urlsplit(referrer)
            query = dict(parse_qsl(parts.query, keep_blank_values=True))
            query["account"] = "login"
            return redirect(urlunsplit(("", "", parts.path or "/", urlencode(query), parts.fragment)))
        return redirect(url_for("index", account="login"))
    return render_template("profile.html")

@app.get("/api/recipes")
def get_recipes():
    return jsonify(load_recipes())

@app.get("/api/me")
def me():
    user = current_user()
    return jsonify(authenticated=bool(user), user=user_json(user) if user else None, csrf_token=csrf_token())

@app.post("/api/register")
def register():
    if auth_rate_limited():
        return jsonify(error="Too many attempts. Please wait a few minutes and try again."), 429
    data = json_body()
    if not require_csrf(data):
        return jsonify(error="Session expired. Refresh the page and try again."), 400
    name = str(data.get("name", "")).strip()
    raw_email = str(data.get("email", data.get("identity", ""))).strip()
    email = valid_email_address(raw_email)
    password = str(data.get("password", ""))
    confirm = str(data.get("confirm_password", ""))
    username = str(data.get("username", "")).strip().lower()

    if not 2 <= len(name) <= 60:
        return jsonify(error="Display name must be 2–60 characters."), 400
    if not email:
        return jsonify(error="Enter a real email address with a working mail domain."), 400
    if len(password) < 8 or len(password) > 128:
        return jsonify(error="Password must be 8–128 characters."), 400
    if password != confirm:
        return jsonify(error="Passwords do not match."), 400
    if not re.fullmatch(r"[a-z0-9._-]{3,30}", username):
        return jsonify(error="Username must be 3–30 characters using lowercase letters, numbers, dots, underscores, or hyphens."), 400
    if db().execute("SELECT 1 FROM users WHERE username=? COLLATE NOCASE", (username,)).fetchone():
        return jsonify(error="That username is already taken."), 409
    if db().execute("SELECT 1 FROM users WHERE email=? COLLATE NOCASE", (email,)).fetchone():
        return jsonify(error="An account with that email already exists."), 409

    # Do not create or authenticate the account until the mailbox owner proves access.
    try:
        issue_verification_code(email)
    except Exception:
        app.logger.exception("Could not send account verification email")
        return jsonify(error="We could not send a verification email. Please try again later."), 503
    session["pending_registration"] = {
        "name": name, "email": email, "username": username,
        "password_hash": generate_password_hash(password)
    }
    return jsonify(message="A verification code has been sent to your email. Enter it to finish creating your account.", verification_required=True), 202

@app.post("/api/verify-email")
def verify_email():
    if auth_rate_limited(limit=6, window=600):
        return jsonify(error="Too many verification attempts. Please wait and try again."), 429
    data = json_body()
    if not require_csrf(data):
        return jsonify(error="Session expired. Refresh the page and try again."), 400
    pending = session.get("pending_registration")
    pending_user_id = session.get("pending_verification_user_id")
    email = pending["email"] if pending else None
    if not email and pending_user_id:
        existing = db().execute("SELECT id,email FROM users WHERE id=?", (pending_user_id,)).fetchone()
        email = existing["email"] if existing else None
    code = str(data.get("code", "")).strip()
    if not re.fullmatch(r"\d{6}", code):
        return jsonify(error="Enter the 6-digit verification code."), 400
    if not email:
        return jsonify(error="Please sign in again to request a verification code."), 400
    row = db().execute("SELECT code_hash,expires_at,attempts FROM email_verifications WHERE email=?", (email,)).fetchone()
    if not row:
        return jsonify(error="Your verification code has expired. Please try again."), 400
    if row["attempts"] >= 5:
        db().execute("DELETE FROM email_verifications WHERE email=?", (email,))
        db().commit()
        session.pop("pending_registration", None)
        session.pop("pending_verification_user_id", None)
        return jsonify(error="Too many incorrect codes. Please try again."), 429
    digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
    if int(time.time()) > row["expires_at"] or not hmac.compare_digest(digest, row["code_hash"]):
        db().execute("UPDATE email_verifications SET attempts=attempts+1 WHERE email=?", (email,))
        db().commit()
        return jsonify(error="That verification code is incorrect or expired."), 400

    try:
        if pending:
            cur = db().execute(
                "INSERT INTO users(display_name,email,username,password_hash,email_verified) VALUES(?,?,?,?,1)",
                (pending["name"], pending["email"], pending["username"], pending["password_hash"])
            )
            user_id = cur.lastrowid
            success_message = "Your Fridget account has been created."
        else:
            db().execute("UPDATE users SET email_verified=1 WHERE id=?", (pending_user_id,))
            user_id = pending_user_id
            success_message = "Your email has been verified. You are now signed in."
        db().execute("DELETE FROM email_verifications WHERE email=?", (email,))
        db().commit()
    except sqlite3.IntegrityError:
        db().rollback()
        return jsonify(error="That email or username is already registered."), 409

    session.clear()
    session.permanent = True
    session["user_id"] = user_id
    csrf_token()
    return jsonify(message=success_message, csrf_token=session["csrf_token"]), 201

@app.post("/api/login")
def login():
    if auth_rate_limited():
        return jsonify(error="Too many login attempts. Please wait a few minutes and try again."), 429
    data = json_body()
    if not require_csrf(data):
        return jsonify(error="Session expired. Refresh the page and try again."), 400
    identity = str(data.get("identity", "")).strip().lower()
    password = str(data.get("password", ""))
    if not identity or not password:
        return jsonify(error="Enter your email/username and password."), 400
    user = db().execute("SELECT * FROM users WHERE email=? COLLATE NOCASE OR username=? COLLATE NOCASE",
                        (identity, identity)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify(error="Incorrect email/username or password."), 401
    if not user["email_verified"]:
        try:
            issue_verification_code(user["email"])
        except Exception:
            app.logger.exception("Could not send sign-in verification email")
            return jsonify(error="We could not send a verification email. Please try again later."), 503
        session["pending_verification_user_id"] = user["id"]
        return jsonify(message="A verification code has been sent to your email. Enter it to finish signing in.", verification_required=True), 202
    session.clear()
    session.permanent = True
    session["user_id"] = user["id"]
    csrf_token()
    return jsonify(message="Welcome back!", csrf_token=session["csrf_token"])

@app.post("/api/forgot-password")
def forgot_password():
    if auth_rate_limited(limit=4, window=900):
        return jsonify(error="Too many requests. Please wait and try again later."), 429
    data = json_body()
    if not require_csrf(data):
        return jsonify(error="Session expired. Refresh the page and try again."), 400
    raw_email = str(data.get("email", "")).strip()
    email = valid_email_address(raw_email)
    # Use the same response whether or not an account exists, to avoid revealing registered addresses.
    generic_message = "If an eligible Fridget account exists for that email, a password reset code has been sent."
    if not email:
        return jsonify(message=generic_message, reset_required=True), 202
    user = db().execute("SELECT id,email,email_verified FROM users WHERE email=? COLLATE NOCASE", (email,)).fetchone()
    if user and user["email_verified"]:
        try:
            issue_password_reset_code(user["email"])
            session["pending_password_reset_email"] = user["email"]
        except Exception:
            app.logger.exception("Could not send password reset email")
            return jsonify(error="We could not send a password reset email. Please try again later."), 503
    else:
        session.pop("pending_password_reset_email", None)
    return jsonify(message=generic_message, reset_required=True), 202

@app.post("/api/reset-password")
def reset_password():
    if auth_rate_limited(limit=6, window=600):
        return jsonify(error="Too many reset attempts. Please wait and try again."), 429
    data = json_body()
    if not require_csrf(data):
        return jsonify(error="Session expired. Refresh the page and try again."), 400
    email = session.get("pending_password_reset_email")
    code = str(data.get("code", "")).strip()
    password = str(data.get("password", ""))
    confirm = str(data.get("confirm_password", ""))
    if not email:
        return jsonify(error="Request a password reset code first."), 400
    if not re.fullmatch(r"\d{6}", code):
        return jsonify(error="Enter the 6-digit reset code."), 400
    if len(password) < 8 or len(password) > 128:
        return jsonify(error="Password must be 8–128 characters."), 400
    if password != confirm:
        return jsonify(error="Passwords do not match."), 400
    row = db().execute("SELECT code_hash,expires_at,attempts FROM password_resets WHERE email=?", (email,)).fetchone()
    if not row:
        return jsonify(error="Your reset code has expired. Please request another."), 400
    if row["attempts"] >= 5:
        db().execute("DELETE FROM password_resets WHERE email=?", (email,)); db().commit()
        session.pop("pending_password_reset_email", None)
        return jsonify(error="Too many incorrect codes. Please request another."), 429
    digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
    if int(time.time()) > row["expires_at"] or not hmac.compare_digest(digest, row["code_hash"]):
        db().execute("UPDATE password_resets SET attempts=attempts+1 WHERE email=?", (email,)); db().commit()
        return jsonify(error="That reset code is incorrect or expired."), 400
    db().execute("UPDATE users SET password_hash=? WHERE email=? COLLATE NOCASE", (generate_password_hash(password), email))
    db().execute("DELETE FROM password_resets WHERE email=?", (email,))
    db().commit()
    session.pop("pending_password_reset_email", None)
    return jsonify(message="Your password has been reset. You can now log in.", password_reset=True), 200

@app.post("/api/logout")
def logout():
    data=json_body()
    if not require_csrf(data): return jsonify(error="Invalid session token."), 400
    session.clear(); csrf_token()
    return jsonify(message="You have been logged out.",csrf_token=session["csrf_token"])


@app.get("/api/profile")
def get_profile():
    user = current_user()
    if not user:
        return jsonify(error="Please log in to view your profile."), 401
    row = db().execute("SELECT display_name,email,username,bio,avatar_data,created_at FROM users WHERE id=?", (user["id"],)).fetchone()
    return jsonify(profile={key: row[key] for key in row.keys()}, csrf_token=csrf_token())

@app.put("/api/profile")
def update_profile():
    user = current_user()
    if not user:
        return jsonify(error="Please log in to update your profile."), 401
    data = json_body()
    if not require_csrf(data):
        return jsonify(error="Session expired. Refresh the page and try again."), 400
    name = str(data.get("display_name", "")).strip()
    bio = str(data.get("bio", "")).strip()
    username = str(data.get("username", "")).strip().lower()
    avatar = str(data.get("avatar_data", ""))
    if not 2 <= len(name) <= 60:
        return jsonify(error="Display name must be 2–60 characters."), 400
    if len(bio) > 280:
        return jsonify(error="Bio must be 280 characters or fewer."), 400
    if not re.fullmatch(r"[a-z0-9._-]{3,30}", username):
        return jsonify(error="Username must be 3–30 characters using lowercase letters, numbers, dots, underscores, or hyphens."), 400
    if db().execute("SELECT 1 FROM users WHERE username=? COLLATE NOCASE AND id<>?", (username, user["id"])).fetchone():
        return jsonify(error="That username is already taken."), 409
    if avatar and (not avatar.startswith("data:image/") or len(avatar) > 2_800_000):
        return jsonify(error="Profile image must be a valid image under 2 MB."), 400
    db().execute("UPDATE users SET display_name=?, username=?, bio=?, avatar_data=? WHERE id=?", (name,username,bio,avatar,user["id"]))
    db().commit()
    return jsonify(message="Profile updated successfully.")

@app.route("/chat", methods=["POST"])
def chat():
    if auth_rate_limited(limit=20, window=60):
        return jsonify({"error": "Too many messages. Please wait a moment and try again."}), 429
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request."}), 400

    user_message = data.get("message", "")
    history = data.get("history", [])
    if not isinstance(user_message, str) or not user_message.strip():
        return jsonify({"error": "No message provided"}), 400
    user_message = user_message.strip()
    if len(user_message) > 2000 or not isinstance(history, list) or len(history) > 12:
        return jsonify({"error": "Message is too long. Please shorten it and try again."}), 400

    safe_history = []
    for item in history:
        if not isinstance(item, dict) or item.get("role") not in ("user", "assistant"):
            continue
        content = item.get("content", "")
        if isinstance(content, str) and len(content) <= 2000:
            safe_history.append({"role": item["role"], "content": content})
    history = safe_history

    recipes = load_recipes()

    system_message = {
        "role": "system",
        "content": (
            WEBSITE_CONTEXT
            + "\n\nFRIDGET RECIPE DATABASE:\n"
            + json.dumps(recipes, ensure_ascii=False)
            + "\n\nOnly recommend recipes that exist in this database."
        )
    }

    messages = [system_message] + history

    if not OPENROUTER_KEY:
        return jsonify({"error": "AI chat is not configured. Add OPENROUTER_API_KEY to your environment."}), 503

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": messages
            },
            timeout=30
        )

        response.raise_for_status()

        answer = response.json()["choices"][0]["message"]["content"]

        return jsonify({"reply": answer})

    except requests.RequestException:
        app.logger.exception("OpenRouter request failed")
        return jsonify({"error": "AI service is unavailable."}), 502

app.register_blueprint(home_bp)
app.register_blueprint(OurTeam_bp)
app.register_blueprint(recipes_bp)
app.register_blueprint(Myaccount)

# Initialize/migrate the database whether launched directly or through a WSGI server.
init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1",port=int(os.environ.get("PORT",5000)),debug=os.environ.get("FLASK_DEBUG","0")=="1")
