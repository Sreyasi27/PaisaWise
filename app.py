from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

DATA_FILE = "expenses.json"

def load_expenses():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_expenses(expenses):
    with open(DATA_FILE, "w") as f:
        json.dump(expenses, f, indent=2)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    expenses = load_expenses()
    return jsonify(expenses)

@app.route("/api/expenses", methods=["POST"])
def add_expense():
    data = request.get_json()
    if not data or not data.get("title") or not data.get("amount") or not data.get("category"):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        amount = float(data["amount"])
        if amount <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400

    expenses = load_expenses()
    expense = {
        "id": int(datetime.now().timestamp() * 1000),
        "title": data["title"].strip(),
        "amount": round(amount, 2),
        "category": data["category"],
        "date": data.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "note": data.get("note", "").strip()
    }
    expenses.append(expense)
    save_expenses(expenses)
    return jsonify(expense), 201

@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    expenses = load_expenses()
    updated = [e for e in expenses if e["id"] != expense_id]
    if len(updated) == len(expenses):
        return jsonify({"error": "Expense not found"}), 404
    save_expenses(updated)
    return jsonify({"message": "Deleted successfully"})

@app.route("/api/summary", methods=["GET"])
def get_summary():
    expenses = load_expenses()
    total = sum(e["amount"] for e in expenses)
    by_category = {}
    for e in expenses:
        cat = e["category"]
        by_category[cat] = round(by_category.get(cat, 0) + e["amount"], 2)
    return jsonify({"total": round(total, 2), "by_category": by_category, "count": len(expenses)})

if __name__ == "__main__":
    app.run(debug=True)
