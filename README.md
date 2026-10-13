# Real-Time Supply Chain Control Tower

A Flask + Flask-SocketIO real-time data visualization dashboard.

## Demo login
- Username: `admin`
- Password: `admin123`

## Run on Windows PowerShell

```powershell
cd Real_Time_Supply_Chain_Control_Tower
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py app.py
```

Open: http://127.0.0.1:5000

## Real-time features
- KPI cards update every 2 seconds
- Shipment status changes live
- Inventory stock changes live
- Warehouse utilization changes live
- Delayed shipment list updates
- Recent orders and charts refresh through Socket.IO
