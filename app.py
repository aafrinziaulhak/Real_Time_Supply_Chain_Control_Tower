from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_socketio import SocketIO
from database import init_db, dashboard_data
from utils.realtime_engine import start_realtime_engine
from utils.analytics import demand_prediction
from config import SECRET_KEY, LIVE_INTERVAL

app = Flask(__name__)
app.secret_key = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

init_db()

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if username == "admin" and password == "admin123":
            session["user"] = "Admin User"
            return redirect(url_for("dashboard"))
        return render_template("login.html", error="Invalid username or password")
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html", user=session["user"])

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/api/dashboard")
def api_dashboard():
    data = dashboard_data()
    data["demand"] = demand_prediction()
    return jsonify(data)

# Simple working pages for the sidebar
PAGE_NAMES = ["orders", "shipments", "inventory", "warehouses", "analytics", "alerts", "reports", "settings"]

@app.route("/<page>")
def simple_page(page):
    if "user" not in session:
        return redirect(url_for("login"))
    if page not in PAGE_NAMES:
        return redirect(url_for("dashboard"))
    return render_template(f"{page}.html", page_title=page.title(), user=session["user"])

@socketio.on("connect")
def on_connect():
    print("Client connected")

if __name__ == "__main__":
    print("Real-Time Supply Chain Control Tower")
    print("Login: admin / admin123")
    start_realtime_engine(socketio, LIVE_INTERVAL)
    socketio.run(app, host="127.0.0.1", port=5000, debug=True, allow_unsafe_werkzeug=True)
