# PaisaWise - Smart Expense Tracker 💰

**PaisaWise** is a lightweight, web-based personal finance management tool built to help users track their daily expenses, manage budgets, and visualize their spending habits. 

## 🚀 Features
* **User Authentication:** Secure login and signup system to keep your financial data private.
* **Expense Management:** Add, view, and organize expenses with ease.
* **Persistent Storage:** Data is stored locally in JSON format, ensuring your records stay safe even after a restart.
* **Clean UI:** A modern, dark-themed interface for a focused user experience.

## 🛠️ Tech Stack
* **Backend:** Python 3.x, Flask (Web Framework)
* **Frontend:** HTML5, CSS3, JavaScript
* **Data Storage:** JSON (Local File System)
* **Dev Environment:** CodeSandbox / VS Code

## 📂 Project Structure

```text
workspace/
├── .devcontainer/         # Environment configuration
├── myexpense123/          # Main Application Folder
│   ├── static/            # UI Assets
│   │   ├── script.js      # Frontend Logic
│   │   └── style.css      # Dark-themed styling
│   ├── templates/         # HTML Jinja2 Templates
│   │   ├── index.html     # Main Dashboard
│   │   └── login.html     # Authentication portal
│   ├── expenses.json      # Expense records Database
│   └── main.py            # Flask server & Routing logic
├── README.md              # Project Documentation
├── requirements.txt       # Python dependency list
└── users.json             # User credentials Database

## ⚙️ Installation & Setup
To run this project locally, follow these steps:

 **Clone the repository:**
   ```bash
   git clone [https://github.com/Sreyasi27/PaisaWise.git](https://github.com/Sreyasi27/PaisaWise.git)
