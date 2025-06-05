import json
import sqlite3
import os
from cryptography.fernet import Fernet

CONFIG_PATH = os.path.join(os.getcwd(), "config", "config.json")
DB_PATH = os.path.join(os.getcwd(), "serina.db")

def load_config(master_key: bytes = None) -> dict:
    if not os.path.exists(CONFIG_PATH):
        with open(os.path.join(os.getcwd(), "config", "default_config.json")) as f:
            defaults = json.load(f)
        save_config(defaults, master_key)
        return defaults
    with open(CONFIG_PATH, "rb") as f:
        data = f.read()
    if master_key:
        fernet = Fernet(master_key)
        decrypted = fernet.decrypt(data).decode()
        return json.loads(decrypted)
    return json.loads(data)

def save_config(config: dict, master_key: bytes = None):
    data = json.dumps(config, indent=2).encode()
    if master_key:
        f = Fernet(master_key)
        data = f.encrypt(data)
    with open(CONFIG_PATH, "wb") as f:
        f.write(data)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Create emails table
    c.execute("""CREATE TABLE IF NOT EXISTS emails (
                    email_id TEXT PRIMARY KEY,
                    folder TEXT,
                    sender TEXT,
                    subject TEXT,
                    received_at DATETIME,
                    is_read INTEGER DEFAULT 0,
                    is_assessed INTEGER DEFAULT 0,
                    snoozed_until DATETIME,
                    thread_id TEXT,
                    summary TEXT,
                    reply_draft TEXT
                 )""")
    # Create actions table
    c.execute("""CREATE TABLE IF NOT EXISTS actions (
                    action_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email_id TEXT,
                    action_type TEXT,
                    action_timestamp DATETIME,
                    metadata JSON
                 )""")
    # Create logs table
    c.execute("""CREATE TABLE IF NOT EXISTS logs (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    level TEXT,
                    message TEXT
                 )""")
    conn.commit()
    conn.close()
