import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "supply_chain.db")
SECRET_KEY = "supply-chain-control-tower-2026"
LIVE_INTERVAL = 2
