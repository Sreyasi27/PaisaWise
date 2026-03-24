from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from datetime import datetime
import json
import os
from functools import wraps

app = Flask(__name__)
# Tip: Keep this key consistent to avoid being logged out every time you restart
app.secret_key = "paisawise_secret_key_2026" 

DATA_FILE = "expenses.json"
USERS_FILE = "users.json"

# --- Data Utilities ---
def load_json(file, default_type=list):
    if not os.path.exists(file):
        return default_type()
    try:
        with open(file, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, ValueError):
        return default_type()

def save_json(file, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=2)

# --- Auth Decorator ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated_function

# --- Auth Routes ---
@app.route("/login")
def login_page():
    if "user" in session:
        return redirect(url_for("index"))
    return render_template("login.html")

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    # Ensure we load a dictionary for users
    users = load_json(USERS_FILE, dict)
    username = data.get("username", "").strip()
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error": "Fields cannot be empty"}), 400
    if username in users:
        return jsonify({"error": "User already exists"}), 400
    
    users[username] = password 
    save_json(USERS_FILE, users)
    return jsonify({"message": "User created"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    users = load_json(USERS_FILE, dict)
    username = data.get("username")
    password = data.get("password")
    
    if users.get(username) == password:
        session["user"] = username
        return jsonify({"message": "Logged in"})
    return jsonify({"error": "Invalid username or password"}), 401

@app.route("/logout")
def logout():
    session.clear() # Clears entire session for security
    return redirect(url_for("login_page"))

# --- Main App Routes ---
@app.route("/")
@login_required
def index():
    # Matches the 'username' variable used in your template
    return render_template("index.html", username=session["user"])

@app.route("/api/expenses", methods=["GET"])
@login_required
def get_expenses():
    all_expenses = load_json(DATA_FILE, list)
    user_expenses = [e for e in all_expenses if e.get("user") == session["user"]]
    return jsonify(user_expenses)

@app.route("/api/expenses", methods=["POST"])
@login_required
def add_expense():
    data = request.get_json()
    if not data or not data.get("title") or not data.get("amount"):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        amount = float(data["amount"])
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400

    all_expenses = load_json(DATA_FILE, list)
    expense = {
        "id": int(datetime.now().timestamp() * 1000),
        "user": session["user"], 
        "title": data["title"].strip(),
        "amount": round(amount, 2),
        "category": data.get("category", "Other"),
        "date": data.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "note": data.get("note", "").strip()
    }
    all_expenses.append(expense)
    save_json(DATA_FILE, all_expenses)
    return jsonify(expense), 201

@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
@login_required
def delete_expense(expense_id):
    all_expenses = load_json(DATA_FILE, list)
    # Filter to remove only the specific ID belonging to the current user
    new_list = [e for e in all_expenses if not (e.get("id") == expense_id and e.get("user") == session["user"])]
    
    if len(new_list) == len(all_expenses):
        return jsonify({"error": "Expense not found or unauthorized"}), 404
        
    save_json(DATA_FILE, new_list)
    return jsonify({"message": "Deleted successfully"})

@app.route("/api/summary", methods=["GET"])
@login_required
def get_summary():
    all_expenses = load_json(DATA_FILE, list)
    expenses = [e for e in all_expenses if e.get("user") == session["user"]]
    
    total = sum(e["amount"] for e in expenses)
    by_category = {}
    for e in expenses:
        cat = e["category"]
        by_category[cat] = round(by_category.get(cat, 0) + e["amount"], 2)
        
    return jsonify({
        "total": round(total, 2), 
        "by_category": by_category, 
        "count": len(expenses)
    })

if __name__ == "__main__":
    # Ensure server runs on port 5000 as seen in your screenshot
    app.run(debug=True, port=5000)