from flask import Flask, request, jsonify
from flask_cors import CORS  
import mysql.connector
import bcrypt
import uuid
import base64
import jwt, smtplib
import re
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
app.config["SECRET_KEY"] = "duck"
CORS(app)

# Access to the Mysql database
database = mysql.connector.connect (
    host="localhost",
    user="root",
    port=3306,
    password="",
    database="travelcore"
)
db = database.cursor(dictionary=True)

# Signup
@app.route('/signup', methods=["POST"])
def signup(): 
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    isvalidgmail = re.match(r"^[a-zA-Z0-9._%+-]+@gmail\.com$", email)

    if not isvalidgmail: 
        return jsonify({'errormsg': 'Invalid gmail!'})
    try:
        db.execute("INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)", (name, email, hashed_pw))
        database.commit()

        return jsonify({"message": "User registered Successfully!"})
    except mysql.connector.Error as err:
        if err.errno == 1062:
            return jsonify({'errormsg': 'Email already registered!'})
        return jsonify({'errormsg': str(err)}), 400

# Login
@app.route('/login', methods=["POST"])
def get_message():
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    db.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = db.fetchone()

    if user and bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        session_id = str(uuid.uuid4())
        db.execute("INSERT INTO sessions (user_id, session_id) VALUES (%s, %s)", (user["id"], session_id))
        database.commit()

        return jsonify({'message': 'Logged In Successfully! Welcome to Travel Core!', "session_id": session_id})
    else: 
        return jsonify({'errormsg': 'Invalid Inputs / User not Found, Please try again'}), 401
    
@app.route('/logout', methods=['POST'])
def logout():
    data = request.json
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"error": "Session ID required"}), 400

    # Delete session from database
    db.execute("DELETE FROM sessions WHERE session_id = %s", (session_id,))
    database.commit()

    return jsonify({"message": "Logged out successfully"})

# For creating journals
@app.route('/create', methods=['POST'])
def create_journal():
    try:
        session_id = request.form.get("session_id")
        if not session_id:
            return jsonify({"errormsg": "Session ID required"}), 400

        # verify session → get user_id
        db.execute("SELECT user_id FROM sessions WHERE session_id = %s", (session_id,))
        session = db.fetchone()
        if not session:
            return jsonify({"errormsg": "Invalid session"}), 401
        user_id = session["user_id"]

        # form data
        title = request.form.get('title')
        date = request.form.get('date')
        description = request.form.get('description')
        address = request.form.get('address')
        position = request.form.get('position')

        files = request.files.getlist("images")
        image_datas = [file.read() for file in files]

        # Insert journal with user_id
        db.execute(
            "INSERT INTO journals (user_id, title, date, description, address, position) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, title, date, description, address, position)
        )
        database.commit()
        journal_id = db.lastrowid  

        # Insert each image
        for img_data in image_datas:
            db.execute(
                "INSERT INTO journal_images (journal_id, images) VALUES (%s, %s)",
                (journal_id, img_data)
            )
        database.commit()

        return jsonify({"message": "Journal Uploaded Successfully!"})

    except Exception as e:
        return jsonify({'errormsg': str(e)}), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Server error", "details": str(e)}), 500

# Main menu
@app.route("/main_menu", methods=["POST", "GET"])
def main_menu():
    session_id = request.headers.get("Authorization")

    db.execute("""
        SELECT journals.id, journals.title, journals.date, journals.description,
               journals.address, journals.position
        FROM sessions
        INNER JOIN journals ON sessions.user_id = journals.user_id
        WHERE sessions.session_id = %s
    """, (session_id,))
    journals = db.fetchall()

    # Images
    journal_ids = [j['id'] for j in journals]
    journal_images = []
    if journal_ids:
        format_strings = ','.join(['%s'] * len(journal_ids))
        db.execute(f"SELECT * FROM journal_images WHERE journal_id IN ({format_strings})", tuple(journal_ids))
        journal_images = db.fetchall()

    # Attach images
    for journal in journals:
        imgs = [img for img in journal_images if img['journal_id'] == journal['id']]
        for img in imgs:
            img['images'] = base64.b64encode(img['images']).decode('utf-8')
        journal['images'] = imgs

    return jsonify({"journals": journals})

# 
@app.route('/journal/<int:id>', methods=['DELETE'])
def delete_journal(id):
    session_id = request.headers.get("Authorization")
    
    # Get the user from session
    db.execute("SELECT user_id FROM sessions WHERE session_id = %s", (session_id,))
    session = db.fetchone()
    if not session:
        return jsonify({"errormsg": "Invalid session"}), 401

    user_id = session["user_id"]

    # Delete images for this journal
    db.execute("DELETE FROM journal_images WHERE journal_id = %s", (id,))

    # Delete the journal itself
    db.execute("DELETE FROM journals WHERE id = %s AND user_id = %s", (id, user_id))
    database.commit()
    
    return jsonify({"message": "Journal deleted successfully"})

# Verify session
@app.route('/verify-session', methods=['POST'])
def verify_session():
    data = request.json
    session_id = data.get("session_id")

    db.execute("SELECT * FROM sessions WHERE session_id = %s", (session_id,))
    session = db.fetchone()

    if session:
        return jsonify({"valid": True, "user_id": session["user_id"]})
    else:
        return jsonify({"valid": False}), 401
    
@app.route("/update/<int:journal_id>", methods=["POST"])
def update_journal(journal_id):
    try:
        cursor = database.cursor(dictionary=True)

        title = request.form.get("title")
        date = request.form.get("date")
        description = request.form.get("description")
        address = request.form.get("address")
        position = request.form.get("position")
        session_id = request.form.get("session_id")

        files = request.files.getlist("images")
        image_datas = [file.read() for file in files]

        keep_images = request.form.getlist("keep_images")
        keep_images = [int(i) for i in keep_images] if keep_images else []

        # Verify session
        cursor.execute("SELECT user_id FROM sessions WHERE session_id=%s", (session_id,))
        session = cursor.fetchone()
        if not session:
            return jsonify({"errormsg": "Invalid session"}), 403

        user_id = session["user_id"]

        # Check journal existence first
        cursor.execute("SELECT * FROM journals WHERE id=%s AND user_id=%s", (journal_id, user_id))
        journal = cursor.fetchone()
        if not journal:
            return jsonify({"errormsg": "Journal not found or unauthorized"}), 404

        # Update journal (rowcount might be 0 if nothing changed, which is fine)
        cursor.execute("""
            UPDATE journals
            SET title=%s, date=%s, description=%s, address=%s, position=%s
            WHERE id=%s AND user_id=%s
        """, (title, date, description, address, position, journal_id, user_id))

        # Delete removed images
        if keep_images:
            format_strings = ','.join(['%s'] * len(keep_images))
            cursor.execute(f"""
                DELETE FROM journal_images
                WHERE journal_id=%s AND id NOT IN ({format_strings})
            """, [journal_id] + keep_images)
        else:
            cursor.execute("DELETE FROM journal_images WHERE journal_id=%s", (journal_id,))

        # Insert new images
        for img_data in image_datas:
            cursor.execute(
                "INSERT INTO journal_images (journal_id, images) VALUES (%s, %s)",
                (journal_id, img_data)
            )

        database.commit()
        cursor.close()
        return jsonify({"message": "Journal updated successfully!"})

    except Exception as e:
        database.rollback()
        return jsonify({"errormsg": str(e)}), 500


    
@app.route('/journal/<int:journal_id>', methods=['GET'])
def get_journal(journal_id):
    session_id = request.headers.get("Authorization")

    # Verify session
    db.execute("SELECT user_id FROM sessions WHERE session_id = %s", (session_id,))
    session = db.fetchone()
    if not session:
        return jsonify({"errormsg": "Invalid session"}), 401

    user_id = session["user_id"]

    # Get journal (only if it belongs to this user)
    db.execute("SELECT * FROM journals WHERE id = %s AND user_id = %s", (journal_id, user_id))
    journal = db.fetchone()
    if not journal:
        return jsonify({"errormsg": "Journal not found"}), 404

    # Get images for this journal
    db.execute("SELECT * FROM journal_images WHERE journal_id = %s", (journal_id,))
    images = db.fetchall()
    for img in images:
        img['images'] = base64.b64encode(img['images']).decode('utf-8')

    journal["images"] = images

    return jsonify(journal)

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get("email")

    # Check user
    db.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = db.fetchone()
    if not user:
        return jsonify({"message": "No account found from that gmail address, please try again."})

    # Generate JWT token (15 min expiry)
    token = jwt.encode(
        {"user_id": user["id"], "exp": datetime.utcnow() + timedelta(minutes=15)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )


    # Save token in DB
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.execute("INSERT INTO password_reset (user_id, token, expiration) VALUES (%s, %s, %s)",
               (user["id"], token, expires_at))
    database.commit()

    reset_link = f"http://localhost:3000/reset-password/{token}"

    # Send email
    try:
        msg = MIMEText(f"Click to reset your password: {reset_link}")
        msg["Subject"] = "Password Reset"
        msg["From"] = "testtravelcore@gmail.com"
        msg["To"] = email

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("testtravelcore@gmail.com", "jvtn lova pbhv ivpc")
            server.sendmail("testtravelcore@gmail.com", email,  msg.as_string())
    except Exception as e:
        print("Email send error:", e)

    return jsonify({"message": "If your email exists, a reset link has been sent."})

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get("token")
    new_password = data.get("password")

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_id = decoded["user_id"]

        # Validate token exists in DB
        db.execute("SELECT * FROM password_reset WHERE user_id=%s AND token=%s", (user_id, token))
        reset_entry = db.fetchone()
        if not reset_entry:
            return jsonify({"errormsg": "Invalid token"}), 400

        if reset_entry["expiration"] < datetime.utcnow():
            return jsonify({"errormsg": "Token expired, Please try again!"}), 400

        # Update password
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        db.execute("UPDATE users SET password_hash=%s WHERE id=%s", (hashed_pw, user_id))
        db.execute("DELETE FROM password_reset WHERE user_id=%s", (user_id,))
        database.commit()

        return jsonify({"message": "Password updated successfully!"})

    except jwt.ExpiredSignatureError:
        return jsonify({"errormsg": "Token expired"}), 400
    except Exception:
        return jsonify({"errormsg": "Invalid token"}), 400

    
if __name__ == '__main__':
    app.run(debug=True)
