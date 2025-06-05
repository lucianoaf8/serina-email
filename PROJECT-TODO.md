**Focused Implementation Plan for SERINA**  
_(Objective‐oriented, code‐centric tasks; organized by feature areas and development phases)_

* * *

1. Project Scaffolding & Environment Setup

------------------------------------------

1. **Initialize Repository Structure**
   
   * Create root folder `SERINA/`.
   
   * Under `SERINA/`, create subfolders as per documentation:
        SERINA/
        ├─ backend/
        ├─ renderer/
        ├─ assets/
        ├─ config/
        ├─ build_scripts/
        ├─ .electronignore
        ├─ package.json
        ├─ main.js
        ├─ preload.js
        └─ README.md
* Populate `README.md` with high‐level overview and “How to run in dev mode.”
2. **Configure `package.json` for Electron**
   
   * Set `"main": "main.js"`.
   
   * Add dependencies: `"electron"`, `"react"`, `"react-dom"`, `"tailwindcss"`, `"vite"` (if using Vite), and development scripts:
        {
     
          "scripts": {
            "dev": "electron .",
            "build": "npm run build:renderer && npm run build:backend && electron-builder",
            "build:renderer": "cd renderer && npm run build",
            "build:backend": "bash build_scripts/build_python.sh"
          },
          "devDependencies": {
            "electron-builder": "^X.Y.Z"
          }
          // …other fields…
     
        }
* Create `.electronignore` to exclude unnecessary files (e.g., `node_modules`, `venv`, `__pycache__`).
3. **Initialize Python Virtual Environment & Dependencies**
   
   * In `backend/`:
        python3.12 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        touch requirements.txt
* Populate `requirements.txt` with:
  
      fastapi
      uvicorn
      msal
      requests
      websockets
      apscheduler
      cryptography
      sqlite3     # built-in; no need to pip-install
      openai
      anthropic
      # plus any HTTP-client libs for Mistral, TogetherAI, OpenRouter

* Create stub `backend/__init__.py`.
4. **Set Up Build Scripts**
   
   * In `build_scripts/build_electron.sh`: stub for packaging React and Electron.
   
   * In `build_scripts/build_python.sh`: create a PyInstaller command:
        #!/usr/bin/env bash
        cd backend
        pyinstaller --onefile --name serina_backend main.py
* Add execute permissions (`chmod +x`) to both scripts.

* * *

2. Configuration & State Management

-----------------------------------

5. **Define Configuration Schema & Defaults**
   
   * Under `config/`, create `default_config.json` with the schema from documentation:
        {
     
          "generalSchedule": {
            "activeDays": ["Mon","Tue","Wed","Thu","Fri"],
            "activeHours": {"start":"09:00","end":"17:00"},
            "quietHours": {"start":"12:00","end":"13:00"},
            "reminderIntervalMins": 15,
            "skipDuringMeetings": true
          },
          "behavior": {
            "defaultSnooze": 15,
            "startOnBoot": true,
            "minimizeToTray": true,
            "hideFromTray": false,
            "logFilePath": ""
          },
          "llmConfig": {
            "openaiApiKey": "",
            "anthropicApiKey": "",
            "openrouterApiKey": "",
            "togetherApiKey": "",
            "mistralApiKey": ""
          },
          "emailSettings": {
            "emailClient": "Outlook",
            "monitorAddress": "",
            "calendarConnected": false
          },
          "security": {
            "encryptConfig": false,
            "pinLockEnabled": false,
            "pinHash": "",
            "obfuscateLogs": false
          }
     
        }
* Under `config/`, add `default_settings_schema.json` if needed for UI validation.
6. **Implement `storage.py` Wrapper**
   
   * In `backend/services/storage.py`, write functions:
        import json, sqlite3, os
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
* Add functions to read/write entries and manage in‐memory caches as needed.
7. **Implement `security.py` for Encryption**
   
   * In `backend/services/security.py`, provide:
        from cryptography.fernet import Fernet
        import hashlib
        def derive_key_from_pin(pin: str) -> bytes:
     
            # Example: use SHA256 of PIN to derive a 32-byte key then base64 encode
            h = hashlib.sha256(pin.encode()).digest()
            return Fernet.generate_key() if not pin else base64.urlsafe_b64encode(h)
     
        def encrypt_bytes(data: bytes, key: bytes) -> bytes:
     
            f = Fernet(key); return f.encrypt(data)
     
        def decrypt_bytes(token: bytes, key: bytes) -> bytes:
     
            f = Fernet(key); return f.decrypt(token)
* Integrate with `storage.py` for encrypted config/log actions.

* * *

3. Backend: Email & Calendar Integration

----------------------------------------

8. **Implement `email_service.py`**
   
   * Create `backend/services/email_service.py`. Define functions:
     
     * `acquire_token_graph()`: MSAL device‐code or interactive flow.
     
     * `get_unread_emails_graph(since: datetime) -> List[dict]`: fetch unread via Graph API.
     
     * `mark_email_read_graph(email_id: str) -> None`.
     
     * `send_reply_graph(email_id: str, reply_text: str) -> bool`.
     
     * Fallback IMAP functions: `connect_imap()`, `fetch_unread_imap()`, `send_reply_smtp()`.
   
   * Validate RSSI: test Graph API calls on local Office 365 account (unit test stub).

9. **Implement `calendar_service.py`**
   
   * Create `backend/services/calendar_service.py`. Define:
     
     * `is_currently_busy() -> Tuple[bool, Optional[datetime]]`: query Graph API calendarView for current free/busy.
     
     * `get_next_free_time() -> datetime`: return next time outside busy slots.
   
   * Handle token refresh if expired; surface errors to logs.

* * *

4. Backend: LLM Integration Layer

---------------------------------

10. **Define `llm_service.py` Interface**
    
    * Create `backend/services/llm_service.py` with class `LLMClient`:
        from typing import Dict
        class LLMClient:
      
            def __init__(self, config: Dict):
                # Store API keys & init each provider client
                self.openai_key = config.get("openaiApiKey")
                self.anthropic_key = config.get("anthropicApiKey")
                # …and so on…
          
            def summarize(self, email_text: str) -> str:
                # Priority: OpenAI → Anthropic → Mistral → TogetherAI → OpenRouter
                if self.openai_key:
                    return self._call_openai_summary(email_text)
                if self.anthropic_key:
                    return self._call_anthropic_summary(email_text)
                # …implement each fallback…
                return "No LLM provider configured."
          
            def generate_reply(self, email_text: str, preferences: Dict) -> str:
                # Similar priority logic; build prompt with templates
                prompt = f"Generate a professional reply to:\n\n{email_text}"
                if self.openai_key:
                    return self._call_openai_reply(prompt)
                # …other providers…
                return ""
* Implement private methods `_call_openai_summary`, `_call_openai_reply`, using `openai` Python SDK.

* For other providers, implement minimal HTTP clients following their API docs.
11. **Create Prompt Templates & Validation**
    
    * Under `backend/services`, add `prompt_templates.json` with keys `"summarize"` and `"reply"`.
    
    * In `llm_service.py`, read templates and perform string substitution.
    
    * Validate input length: truncate email text if token count > provider limit (e.g., 3000 tokens) before sending.

* * *

5. Backend: Notification & Scheduling

-------------------------------------

12. **Implement `scheduler.py`**
    
    * In `backend/services/scheduler.py`, write:
        from apscheduler.schedulers.background import BackgroundScheduler
        from datetime import datetime
        from .email_service import get_unread_emails_graph
        from .calendar_service import is_currently_busy
        from .storage import init_db, save_email_entries
        from .ipc_server import notify_frontend_unread_count
        def check_cycle(config: dict):
      
            now = datetime.now()
            if not within_active_hours(config["generalSchedule"], now):
                return
            busy, end_time = is_currently_busy()
            if busy:
                # Reschedule next check just after meeting end
                return
            unread = get_unread_emails_graph(since=compute_since_timestamp())
            # Persist unread into DB, update summaries via LLM
            save_email_entries(unread)
            # Notify frontend of counts
            notify_frontend_unread_count()
      
        def start_scheduler(config: dict):
      
            init_db()
            scheduler = BackgroundScheduler()
            interval = config["generalSchedule"]["reminderIntervalMins"]
            scheduler.add_job(lambda: check_cycle(config), 'interval', minutes=interval)
            scheduler.start()
* Add helper `within_active_hours(schedule: dict, now: datetime) -> bool`.
13. **Implement Snooze Logic**
    
    * In `scheduler.py` and DB helper:
    
    * Before notifying, filter out emails where `snoozed_until > now`.
    
    * On global snooze, set `global_snooze_until` in a lightweight table or in config.

* * *

6. Backend: IPC Server

----------------------

14. **Choose IPC Mechanism**
    
    * **Proposal**: Use **FastAPI+WebSocket** for bi‐directional communication.
    
    * Pros: easy JSON routing, asyncio support, real‐time push.
    
    * Cons: minor startup overhead; acceptable.

15. **Implement `ipc_server.py`**
    
    * In `backend/services/ipc_server.py`, set up FastAPI with WebSocket endpoints:
        from fastapi import FastAPI, WebSocket
        import uvicorn
        from .storage import load_config, save_config
        from .email_service import fetch_email_detail_graph, send_reply_graph
        from .scheduler import start_scheduler
        app = FastAPI()
        clients = set()
        @app.websocket("/ws")
        async def websocket_endpoint(ws: WebSocket):
      
            await ws.accept()
            clients.add(ws)
            try:
                while True:
                    data = await ws.receive_json()
                    method = data.get("method")
                    params = data.get("params", {})
                    if method == "get-settings":
                        cfg = load_config(master_key=None)
                        await ws.send_json({"method":"settings-response","result":cfg})
                    elif method == "update-settings":
                        save_config(params["newConfig"], master_key=None)
                        await ws.send_json({"method":"update-settings-response","result":"ok"})
                    elif method == "fetch-email-detail":
                        email_id = params["email_id"]
                        detail = fetch_email_detail_graph(email_id)
                        await ws.send_json({"method":"fetch-email-detail-response","result":detail})
                    elif method == "send-reply":
                        success = send_reply_graph(params["email_id"], params["replyText"])
                        await ws.send_json({"method":"send-reply-response","result": success})
                    # …other methods: snooze-email, flag-email…
            except Exception:
                clients.remove(ws)
      
        def notify_frontend_unread_count():
      
            count = get_unassessed_count_from_db()
            for ws in clients:
                try:
                    ws.send_json({"method":"unread-count","result":count})
                except:
                    pass
      
        if __name__ == "__main__":
      
            cfg = load_config(master_key=None)
            start_scheduler(cfg)
            uvicorn.run(app, host="127.0.0.1", port=8000)
* **Tasks**:
  
  * Implement helper `fetch_email_detail_graph(email_id)` to return `{html, summary, draft}`.
  
  * Implement `get_unassessed_count_from_db()`.
  
  * Test WebSocket handshake and simple JSON round‐trip in a Python REPL.
16. **Integrate Scheduler Startup**
    
    * In `main.py`, import `ipc_server` and run both the scheduler and FastAPI concurrently:
        import asyncio
        from .services.ipc_server import app, start_scheduler, load_config
        def main():
      
            config = load_config(master_key=None)
            start_scheduler(config)
            # Run FastAPI
            import uvicorn
            uvicorn.run(app, host="127.0.0.1", port=8000)
      
        if __name__ == "__main__":
      
            main()
      
      

* * *

7. Electron Main Process

------------------------

17. **Implement `main.js`**
    
    * **Tasks**:
    
    * Launch Python backend as child process (use `spawn` from Node.js).
    
    * Wait until backend’s WebSocket (port 8000) is reachable; then create BrowserWindow.
    
    * Manage system tray icon & context menu.
    
    * Expose IPC to renderer (via `preload.js`).
    
    * Forward frontend requests to WebSocket server and relay responses.
    
    * **Sample Stub**:
        const { app, BrowserWindow, Menu, Tray } = require("electron");
        const path = require("path");
        const { spawn } = require("child_process");
        const WebSocket = require("ws");
        let mainWindow, tray, pythonProcess, ws;
        function startPythonBackend() {
      
          const scriptPath = path.join(__dirname, "backend", "serina_backend" + (process.platform === "win32" ? ".exe" : ""));
          pythonProcess = spawn(scriptPath, [], { cwd: __dirname });
          pythonProcess.stdout.on("data", data => {
            console.log(`[PYTHON]: ${data}`);
          });
          pythonProcess.stderr.on("data", data => {
            console.error(`[PYTHON-ERR]: ${data}`);
          });
      
        }
        function connectWebSocket() {
      
          ws = new WebSocket("ws://127.0.0.1:8000/ws");
          ws.on("open", () => {
            createMainWindow();
          });
          ws.on("message", (message) => {
            // Broadcast to renderer via IPC (e.g., “unread-count”)
            mainWindow.webContents.send("backend-message", JSON.parse(message));
          });
      
        }
        function createMainWindow() {
      
          mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
              contextIsolation: true,
              preload: path.join(__dirname, "preload.js")
            }
          });
          mainWindow.loadFile(path.join(__dirname, "renderer", "dist", "index.html"));
          // Optionally: open DevTools if in dev mode
      
        }
        app.whenReady().then(() => {
      
          startPythonBackend();
          // Poll until WebSocket is ready (retry every second)
          const attempt = setInterval(() => {
            try {
              connectWebSocket();
              clearInterval(attempt);
            } catch {
              // wait and retry
            }
          }, 1000);
          // Setup tray
          tray = new Tray(path.join(__dirname, "assets", "serina_logo.png"));
          const contextMenu = Menu.buildFromTemplate([
            { label: "Settings", click: () => mainWindow.show() },
            { label: "Quit", click: () => app.quit() }
          ]);
          tray.setContextMenu(contextMenu);
          tray.setToolTip("SERINA");
      
        });
        app.on("window-all-closed", () => {
      
          // Prevent app from quitting because of tray usage
      
        });
        app.on("before-quit", () => {
      
          if (pythonProcess) pythonProcess.kill();
      
        });

18. **Implement `preload.js`**
    
    * Expose a safe API for renderer:
        const { contextBridge, ipcRenderer } = require("electron");
        contextBridge.exposeInMainWorld("ipc", {
      
          send: (channel, data) => {
            // Only allow certain channels
            const validChannels = ["to-backend"];
            if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
            }
          },
          receive: (channel, callback) => {
            const validChannels = ["backend-message"];
            if (validChannels.includes(channel)) {
              ipcRenderer.on(channel, (event, ...args) => callback(...args));
            }
          }
      
        });
* The renderer will use `window.ipc.send("to-backend", { method, params })`.

* In `main.js`, set up `ipcMain.on("to-backend", …)` to translate into `ws.send(JSON.stringify(msg))`.
19. **Bridge IPC Between Electron & Backend**
    
    * In `main.js`, after WebSocket `ws` is connected:
        const { ipcMain } = require("electron");
        ipcMain.on("to-backend", (event, msg) => {
      
          // msg: { method: string, params: object }
          ws.send(JSON.stringify(msg));
      
        });
        ws.on("message", message => {
      
          const parsed = JSON.parse(message);
          mainWindow.webContents.send("backend-message", parsed);
      
        });
      
      

* * *

8. Renderer (React + Tailwind)

------------------------------

### A. Project & Tooling

20. **Initialize React + Tailwind in `renderer/`**
    
    * `cd renderer`
    
    * `npm init -y`
    
    * `npm install react react-dom react-scripts tailwindcss postcss autoprefixer`
    
    * `npx tailwindcss init -p`
    
    * Configure `tailwind.config.js` to purge `./src/**/*.{js,jsx}`, set dark mode.
    
    * Create `src/index.jsx`, `src/App.jsx`.

### B. Settings UI (MVP)

21. **Implement Settings Page Component**
    
    * Under `renderer/src/pages/SettingsPage.jsx`, build form matching schema:
    
    * Controls for **General Schedule** (checkboxes, time pickers).
    
    * Controls for **Behavior & Notifications**.
    
    * Controls for **LLM Configuration** (masked inputs + “Test Connection” buttons).
    
    * Controls for **Email & Calendar Settings**.
    
    * Controls for **Security & Persistence**.
    
    * “Save” and “Reset to Defaults” buttons.
    
    * Use Tailwind classes per design (collapsible panels, dark mode variants).

22. **Form State & Validation**
    
    * Use React’s `useState` for form data, initialize by sending `{ method: "get-settings" }` over WebSocket via `window.ipc.send("to-backend", {...})`.
    
    * On WebSocket `message` with `method === "settings-response"`, populate form state.
    
    * Add client‐side validation: ensure `activeHours.start < activeHours.end`, time formats valid, API key lengths > 0 when test requested.
    
    * On “Save”, send `{ method: "update-settings", params: { newConfig: formState } }`.
    
    * On “Reset”, reload defaults by sending “get-settings” again or load `default_config.json` stub for UI.

23. **Implement “Test Connection” Buttons**
    
    * For each LLM key input: when clicked, send a `{ method: "llm-test", params: { provider: "openai" } }` over WebSocket.
    
    * In backend, add endpoint to quickly call the provider with a minimal query (e.g., `ping`); return success/failure.
    
    * On UI, show green check or red warning icon beside each provider.

24. **Persist & Reflect Save Status**
    
    * After backend responds to `update-settings`, display a toast: “Settings saved” or an inline indicator.
    
    * On failure, highlight offending fields (e.g., invalid JSON or encryption error).

### C. Reminder Popup

25. **Create Popup Component**
    
    * Under `renderer/src/components/ReminderPopup.jsx`, build a tailwind card matching markup: header with counts, buttons “View”, “Snooze 15m”, “Snooze 30m”, “Snooze”.
    
    * Style: white/gray background, drop shadow, rounded corners.

26. **Popup Trigger Logic**
    
    * In `App.jsx`, maintain state `unreadCount` and `unassessedCount`.
    
    * On WebSocket `message` with `method === "unread-count"`, update these counts.
    
    * If `unreadCount + unassessedCount > 0` and in active hours, show `<ReminderPopup />` for 10 seconds or until interaction.
    
    * On “View”, navigate to Triage Page; on “Snooze”, send `{ method: "snooze-all", params: { minutes: 15 } }` or 30 to backend.

### D. Main Triage Interface

27. **Implement Page Layout**
    
    * Under `renderer/src/pages/TriagePage.jsx`, create three‐column grid:
    
    * **Left Panel**: folder list and email list.
    
    * **Center Panel**: email detail viewer (render HTML safely; use `dangerouslySetInnerHTML`).
    
    * **Right Panel**: LLM Assistant (Summary + Reply Draft + “Generate/Refresh” + provider selector).
    
    * Use Tailwind for responsive width. Allow resizing via CSS `resize` attributes or React libraries (optional for MVP).

28. **Email List Component**
    
    * `renderer/src/components/EmailList.jsx`: fetch list of emails from backend by sending `{ method: "fetch-email-list" }`.
    
    * Display each item: sender, subject, preview snippet (first 50 chars), status icons for unread/assessed/snoozed.
    
    * Highlight selected; on click, send `fetch-email-detail`.

29. **Email Detail Component**
    
    * `renderer/src/components/EmailDetail.jsx`: display email header (avatar placeholder, sender, timestamp) and HTML body.
    
    * Show attachments section (if any) with icons and “Download” if clickable (out of MVP scope; stub disabled).

30. **LLM Assistant Component**
    
    * `renderer/src/components/LLMAssistant.jsx`:
    
    * Text area for “Summary”: initially collapsed; “Show Summary” toggles.
    
    * Text area for “Reply Draft”: editable; “Generate/Refresh” button.
    
    * Provider dropdown.
    
    * On mount or on “Generate” click: send `{ method: "summarize-email", params: { email_id } }` and `{ method: "generate-reply", params: { email_id, provider } }`.
    
    * Render results into respective areas.

31. **Action Buttons**
    
    * At bottom of `TriagePage`:
    
    * **[Send Reply]**: on click, read reply draft, send `{ method: "send-reply", params: { email_id, replyText } }`. On success, refresh email list and clear draft.
    
    * **[Create Task]** & **[Flag]**: stub UI buttons; send respective methods (`create-task`, `flag-email`).
    
    * **[Snooze]**: show dropdown for durations; send `{ method: "snooze-email", params: { email_id, minutes } }`.

32. **Keyboard Shortcuts & Accessibility**
    
    * Use React `useEffect` to bind keys: arrow keys → navigate email list; `R` → focus reply box; `S` → snooze.
    
    * Add `aria-label` to all buttons and ensure color contrast for dark mode.

* * *

9. Security & Privacy Implementation

------------------------------------

33. **Store & Retrieve Encrypted Config**
    
    * Modify `ipc_server.py`’s `load_config` to accept a `"master_key"` from frontend when `encryptConfig` is true. UI must prompt PIN on startup if encryption enabled.
    
    * In `SettingsPage.jsx`, if user toggles “Encrypt Settings,” prompt for PIN creation; derive key via `derive_key_from_pin` and send to backend via `{ method: "update-settings", params: { newConfig, masterKey } }`.

34. **Implement Log Obfuscation**
    
    * In `backend/services/logging.py`, wrap Python’s `logging` to check `config["security"]["obfuscateLogs"]` before writing.
    
    * Replace email addresses with `re.sub(r'(\S)@(\S)', r'\1***@\2***', message)` if obfuscation enabled.

* * *

10. Build & Packaging

---------------------

35. **Configure `electron-builder`**
    
    * Create `build_scripts/package_config.json` as specified: include `"files": ["dist/**/*", "assets/**/*", "serina_backend*"]`.
    
    * In `package.json`, under `"build"`, reference that config:
        "build": {
      
          "appId": "com.luca.serina",
          "productName": "SERINA",
          "files": ["dist/**/*", "assets/**/*", "serina_backend*"],
          "directories": { "output": "release-builds" },
          "win": { "target": "nsis" },
          "mac": { "target": "dmg" },
          "linux": { "target": ["AppImage", "deb"] }
      
        }

36. **Bundle Python Backend**
    
    * Run `bash build_scripts/build_python.sh`. Verify that `dist/serina_backend` exists for each platform.
    
    * Update `main.js` to point to packaged binary when in production.

* * *

11. Testing & Quality Assurance

-------------------------------

37. **Unit Tests for Backend Services**
    
    * Under `backend/tests/`, create `test_email_service.py`, `test_calendar_service.py`, `test_llm_service.py`.
    
    * Use `pytest` fixtures to mock API calls (e.g., using `responses` for HTTP mocks).
    
    * Validate: Graph API queries assemble correct URLs and parameters; fallback IMAP works with dummy server.

38. **Integration Test: Scheduler & IPC**
    
    * Write a Python script (outside main code) to:
    
    * Start backend, simulate a “fake” new email in SQLite.
    
    * Verify that `notify_frontend_unread_count()` pushes correct JSON over WebSocket.
    
    * Confirm that snooze logic filters out snoozed emails.

39. **End‐to‐End Test: Electron + Backend**
    
    * In dev mode, launch Electron; confirm WebSocket handshake; open devtools; send a test `{ method: "get-settings" }` from console via `window.ipc.send`.
    
    * In renderer console, verify reception of `"settings-response"`.
    
    * Simulate “Send Reply”: have an actual test email in Outlook (or mock); press UI button; validate `send-reply` endpoint updates DB and triggers Graph API stub.

40. **UI Testing**
    
    * Write basic React unit tests using `Jest` & `React Testing Library` in `renderer/src/tests/`:
    
    * Test that `SettingsPage` renders all fields and validations trigger correctly.
    
    * Test that `ReminderPopup` appears when `unreadCount > 0`.
    
    * (Optional) Configure Cypress for end‐to‐end flow: load the app, simulate user interactions, validate calls over WebSocket.

* * *

12. MVP Delivery & Next Steps

-----------------------------

41. **MVP Feature Checklist**
    
    * Settings UI + persistent save & load
    
    * Reminder popup with snooze options
    
    * Email fetch via Graph (or IMAP fallback)
    
    * Simple LLM integration (OpenAI only)
    
    * Basic triage UI: email list, email detail, summary display
    
    * Send reply via Graph (or SMTP/Outlook COM)
    
    * Scheduler running at configured intervals
    
    * Encryption toggle for config

42. **Post‐MVP Enhancements (v1.1)**
    
    * Add Anthropic, Mistral, TogetherAI, OpenRouter support in `llm_service.py`.
    
    * Implement full meeting‐aware scheduling via `calendar_service`.
    
    * Add slide‐in drawers for secondary actions (labels, flags, archive).
    
    * Implement dark mode toggle and I18N scaffolding.

43. **Documentation & Onboarding**
    
    * Update `README.md` with “How to contribute,” “Folder Structure,” and “Coding Standards.”
    
    * Write a short “Developer Onboarding” doc listing environment variables (`GRAPH_CLIENT_ID`, etc.), how to obtain API keys, and how to run tests.

* * *

> _This plan breaks down the SERINA requirements into discrete, code‐focused tasks organized by feature area. It’s designed to be parsed by an LLM or engineering team to sequentially implement and verify functionality, with an emphasis on modularity, testing, and precise code output._
