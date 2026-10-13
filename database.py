import sqlite3
import random
from datetime import datetime, timedelta
from config import DATABASE

def get_conn():
    conn = sqlite3.connect(DATABASE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE,
        customer TEXT,
        product TEXT,
        warehouse TEXT,
        quantity INTEGER,
        status TEXT,
        order_time TEXT
    );

    CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id TEXT UNIQUE,
        origin TEXT,
        destination TEXT,
        status TEXT,
        eta TEXT,
        delay_minutes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT UNIQUE,
        warehouse TEXT,
        stock INTEGER,
        reorder_level INTEGER,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        region TEXT,
        utilization INTEGER
    );
    """)

    # Seed only when tables are empty
    if cur.execute("SELECT COUNT(*) FROM orders").fetchone()[0] == 0:
        customers = ["TechMart", "GadgetHub", "MegaStore", "DigitalWorld", "SmartShop"]
        products = ["Laptop", "Monitor", "Keyboard", "Mouse", "Printer", "Tablet"]
        warehouses = ["Chennai", "Bengaluru", "Mumbai", "Delhi", "Kolkata", "Hyderabad"]
        statuses = ["Shipped", "Processing", "Delivered"]
        now = datetime.now()

        for i in range(60):
            oid = f"ORD-{10045+i}"
            cur.execute("""
                INSERT INTO orders
                (order_id, customer, product, warehouse, quantity, status, order_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                oid,
                random.choice(customers),
                random.choice(products),
                random.choice(warehouses),
                random.randint(5, 60),
                random.choice(statuses),
                (now - timedelta(minutes=i*4)).strftime("%H:%M:%S")
            ))

    if cur.execute("SELECT COUNT(*) FROM shipments").fetchone()[0] == 0:
        routes = [
            ("Chennai", "Bengaluru"), ("Mumbai", "Pune"),
            ("Delhi", "Hyderabad"), ("Kolkata", "Guwahati"),
            ("Chennai", "Kochi"), ("Mumbai", "Indore"),
            ("Delhi", "Jaipur"), ("Hyderabad", "Bengaluru")
        ]
        statuses = ["In Transit", "Delivered", "Delayed", "Processing"]
        for i in range(40):
            origin, destination = random.choice(routes)
            status = random.choice(statuses)
            cur.execute("""
                INSERT INTO shipments
                (shipment_id, origin, destination, status, eta, delay_minutes)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                f"SH-{1047+i}",
                origin,
                destination,
                status,
                (datetime.now() + timedelta(hours=random.randint(1, 48))).strftime("%d %b %H:%M"),
                random.randint(0, 180) if status == "Delayed" else 0
            ))

    if cur.execute("SELECT COUNT(*) FROM inventory").fetchone()[0] == 0:
        inv = [
            ("Product P-104", "Chennai", 85, 100),
            ("Product P-205", "Bengaluru", 120, 130),
            ("Product P-302", "Mumbai", 45, 80),
            ("Product P-410", "Delhi", 210, 100),
            ("Product P-512", "Kolkata", 65, 90),
        ]
        for product, wh, stock, reorder in inv:
            status = "Critical" if stock < reorder*0.6 else ("Low Stock" if stock < reorder else "Healthy")
            cur.execute("""
                INSERT INTO inventory(product, warehouse, stock, reorder_level, status)
                VALUES (?, ?, ?, ?, ?)
            """, (product, wh, stock, reorder, status))

    if cur.execute("SELECT COUNT(*) FROM warehouses").fetchone()[0] == 0:
        whs = [
            ("Chennai Warehouse", "South", 82),
            ("Bengaluru Warehouse", "South", 68),
            ("Mumbai Warehouse", "West", 91),
            ("Delhi Warehouse", "North", 55),
            ("Kolkata Warehouse", "East", 47),
            ("Hyderabad Warehouse", "South", 73),
        ]
        cur.executemany(
            "INSERT INTO warehouses(name, region, utilization) VALUES (?, ?, ?)",
            whs
        )

    conn.commit()
    conn.close()

def dashboard_data():
    conn = get_conn()
    cur = conn.cursor()

    total_orders = cur.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    active_shipments = cur.execute(
        "SELECT COUNT(*) FROM shipments WHERE status IN ('In Transit','Processing','Delayed')"
    ).fetchone()[0]
    delayed_orders = cur.execute(
        "SELECT COUNT(*) FROM shipments WHERE status='Delayed'"
    ).fetchone()[0]
    warehouses = cur.execute("SELECT COUNT(*) FROM warehouses").fetchone()[0]

    delivered = cur.execute("SELECT COUNT(*) FROM shipments WHERE status='Delivered'").fetchone()[0]
    on_time = round((delivered / max(1, delivered + delayed_orders)) * 100, 1)

    status_rows = cur.execute("""
        SELECT status, COUNT(*) count
        FROM shipments GROUP BY status
    """).fetchall()
    shipment_status = {r["status"]: r["count"] for r in status_rows}

    routes = cur.execute("""
        SELECT origin || ' → ' || destination route, COUNT(*) count
        FROM shipments GROUP BY origin, destination
        ORDER BY count DESC LIMIT 5
    """).fetchall()

    inventory = cur.execute("""
        SELECT product, warehouse, stock, status
        FROM inventory
        WHERE status != 'Healthy'
        ORDER BY stock ASC LIMIT 4
    """).fetchall()

    wh = cur.execute("""
        SELECT name, utilization FROM warehouses
        ORDER BY utilization DESC
    """).fetchall()

    delayed = cur.execute("""
        SELECT shipment_id, origin || ' → ' || destination route, delay_minutes
        FROM shipments
        WHERE status='Delayed'
        ORDER BY delay_minutes DESC LIMIT 5
    """).fetchall()

    recent = cur.execute("""
        SELECT order_id, customer, product, warehouse, quantity, status, order_time
        FROM orders ORDER BY id DESC LIMIT 6
    """).fetchall()

    conn.close()

    return {
        "total_orders": total_orders,
        "active_shipments": active_shipments,
        "on_time": on_time,
        "delayed_orders": delayed_orders,
        "warehouses": warehouses,
        "logistics_cost": round(18.4 + random.uniform(-0.4, 0.5), 1),
        "shipment_status": shipment_status,
        "routes": [dict(x) for x in routes],
        "inventory": [dict(x) for x in inventory],
        "warehouses_data": [dict(x) for x in wh],
        "delayed": [dict(x) for x in delayed],
        "recent": [dict(x) for x in recent],
    }

def realtime_tick():
    """Small safe updates to make the dashboard genuinely live."""
    conn = get_conn()
    cur = conn.cursor()

    # Randomly change a few shipment statuses
    shipment = cur.execute(
        "SELECT id, status FROM shipments ORDER BY RANDOM() LIMIT 1"
    ).fetchone()
    if shipment:
        transitions = {
            "Processing": ["In Transit", "Processing"],
            "In Transit": ["In Transit", "Delivered", "Delayed"],
            "Delayed": ["Delayed", "In Transit"],
            "Delivered": ["Delivered", "In Transit"]
        }
        new_status = random.choice(transitions.get(shipment["status"], ["In Transit"]))
        delay = random.randint(60, 180) if new_status == "Delayed" else 0
        cur.execute(
            "UPDATE shipments SET status=?, delay_minutes=? WHERE id=?",
            (new_status, delay, shipment["id"])
        )

    # Randomly move inventory slightly
    inv = cur.execute(
        "SELECT id, stock, reorder_level FROM inventory ORDER BY RANDOM() LIMIT 1"
    ).fetchone()
    if inv:
        stock = max(10, inv["stock"] + random.randint(-4, 7))
        status = "Critical" if stock < inv["reorder_level"]*0.6 else (
            "Low Stock" if stock < inv["reorder_level"] else "Healthy"
        )
        cur.execute(
            "UPDATE inventory SET stock=?, status=? WHERE id=?",
            (stock, status, inv["id"])
        )

    # Random warehouse utilization
    wh = cur.execute(
        "SELECT id, utilization FROM warehouses ORDER BY RANDOM() LIMIT 1"
    ).fetchone()
    if wh:
        utilization = min(99, max(30, wh["utilization"] + random.randint(-3, 3)))
        cur.execute(
            "UPDATE warehouses SET utilization=? WHERE id=?",
            (utilization, wh["id"])
        )

    conn.commit()
    conn.close()
