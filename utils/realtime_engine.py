import time
from database import realtime_tick, dashboard_data
from utils.analytics import demand_prediction

def start_realtime_engine(socketio, interval=2):
    def worker():
        while True:
            try:
                realtime_tick()
                payload = dashboard_data()
                payload["demand"] = demand_prediction()
                socketio.emit("dashboard_update", payload)
            except Exception as exc:
                print("Realtime engine:", exc)
            socketio.sleep(interval)
    socketio.start_background_task(worker)
