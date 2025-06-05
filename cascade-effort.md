**Focused Implementation Plan for SERINA**  
_(Objective‐oriented, code‐centric tasks; organized by feature areas and development phases)_

* * *

1.  Project Scaffolding & Environment Setup

------------------------------------------

1.  **[x] Initialize Repository Structure**
    *   [x] Create root folder `SERINA/`.
    *   [x] Under `SERINA/`, create subfolders as per documentation:
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
    *   [ ] Populate `README.md` with high‐level overview and “How to run in dev mode.”
2.  **[x] Configure `package.json` for Electron**
    *   [x] Set `"main": "main.js"`.
    *   [x] Add dependencies: `"electron"`, `"react"`, `"react-dom"`, `"tailwindcss"`, `"vite"` (if using Vite), and development scripts:
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
    *   [x] Create `.electronignore` to exclude unnecessary files (e.g., `node_modules`, `venv`, `__pycache__`).
3.  **[x] Initialize Python Virtual Environment & Dependencies**
    *   [x] In `backend/`:
        python3.12 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        touch requirements.txt
    *   [x] Populate `requirements.txt` with:
  
      fastapi
      uvicorn
      msal
      requests
      websockets
      apscheduler
      cryptography
      pydantic 
      # sqlite3     # built-in; no need to pip-install
      openai
      anthropic
      # plus any HTTP-client libs for Mistral, TogetherAI, OpenRouter

    *   [x] Create stub `backend/__init__.py`.
4.  **[x] Initialize Electron & React Renderer**
    *   [x] Create `main.js` with basic Electron app lifecycle and `BrowserWindow` creation.
        *   [x] Set `webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }`.
        *   [x] (Optional) `frame: false` for custom title bar.
    *   [x] Create `preload.js` to expose `ipcRenderer.send` and `ipcRenderer.on` safely.
    *   [x] Setup React app in `renderer/` (e.g., using Vite: `npm create vite@latest renderer -- --template react`).
        *   [x] Install `tailwindcss` and configure `tailwind.config.js`, `postcss.config.js`, and `index.css`.
    *   [x] Modify `renderer/src/App.jsx` to be a basic placeholder.
    *   [x] Ensure `renderer/index.html` loads the React app.
5.  **[x] Basic IPC for Window Controls (Optional)**
    *   [x] In `main.js`, handle IPC messages for minimize, maximize, close.
    *   [x] In `renderer/src/App.jsx`, add buttons to send these IPC messages via `window.electronAPI` (exposed by `preload.js`).

* * *

2.  Core Backend Services (Python/FastAPI)

-------------------------------------------

6.  **[x] Configuration Service (`backend/config_service.py`)**
    *   [x] Define Pydantic models for settings (`LLMSettings`, `EmailAccountSettings`, `SchedulerSettings`, `DatabaseSettings`, `UISettings`, `AppSettings`).
    *   [x] Function to load settings from `config/settings.json`.
    *   [x] Function to save settings to `config/settings.json`.
    *   [x] Implement encryption/decryption for sensitive fields (e.g., API keys) using `cryptography` and an environment variable for the key.
    *   [x] Create `config/settings_schema.json` for validation.
    *   [x] Example usage/self-test block.
7.  **[x] LLM Service (`backend/llm_service.py`)**
    *   [x] Function to initialize LLM client (OpenAI for MVP).
    *   [x] Function to generate email summaries.
    *   [x] Function to draft email replies.
    *   [x] Stubs/placeholders for Anthropic, Mistral, TogetherAI, OpenRouter.
    *   [x] Error handling and logging.
    *   [x] Example usage/self-test block (requires API key).
8.  **[x] Email Fetching Service (`backend/email_service.py`)**
    *   [x] Pydantic models for `EmailMessage`, `EmailAddress`, `EmailAttachment`.
    *   [x] `MSGraphService` class:
        *   [x] Method to get OAuth token (stub for now; full flow in frontend).
        *   [x] Method to fetch emails (list view, limited fields).
        *   [x] Method to fetch single email body (HTML or text).
        *   [ ] Method to send email (stub for now).
    *   [ ] (Optional) `IMAPService` class (similar methods for IMAP).
    *   [x] Factory function `get_email_service(config)` to return appropriate service.
    *   [x] Example usage/self-test block.
9.  **[x] Scheduler Service (`backend/scheduler_service.py`)**
    *   [x] Use `APScheduler` for background tasks.
    *   [x] Job to periodically fetch new emails using `EmailFetchingService`.
    *   [x] Job to periodically check due reminders using `ReminderService`.
    *   [x] Store fetched emails in an in-memory list/cache (for now).
    *   [x] Configurable fetch interval and limit (from `AppSettings`).
    *   [x] Functions to start and stop the scheduler.
    *   [x] Example usage/self-test block.
10. **[x] Reminder Service (`backend/reminder_service.py`)**
    *   [x] Pydantic model for `Reminder` (associated email ID, reminder time, message, snooze count, active status).
    *   [x] In-memory store for reminders (list of `Reminder` objects).
    *   [x] CRUD operations for reminders.
    *   [x] Function to check for due reminders.
    *   [x] Example usage/self-test block.
11. **[x] Calendar Service (`backend/calendar_service.py`)**
    *   [x] Pydantic models for `CalendarEvent`.
    *   [x] `MSGraphCalendarService` to fetch upcoming events (e.g., next 24 hours).
    *   [x] (Optional) `ICSCalendarService` to parse local `.ics` files.
    *   [x] Factory function `get_calendar_service(config)`.
    *   [x] Example usage/self-test block.
12. **[x] Database Service (`backend/database_service.py`)**
    *   [x] Functions to initialize SQLite database (`serina_db.sqlite3`).
    *   [x] Define schema for `emails`, `reminders`, `app_state` tables.
    *   [x] Functions to save/retrieve emails, reminders.
    *   [ ] (Optional) Alembic for schema migrations.
    *   [x] Toggle for database encryption using `sqlcipher` or similar.

* * *

3.  Backend API Endpoints (FastAPI in `backend/main.py`)

---------------------------------------------------------

13. **[x] Config API Endpoints**
    *   [x] `GET /config`: Returns current `AppSettings`.
    *   [x] `POST /config`: Updates `AppSettings`.
14. **[x] LLM WebSocket Endpoint**
    *   [x] `/ws/llm`: WebSocket endpoint for LLM interactions.
    *   [x] Receives JSON messages (e.g., `{ "action": "summarize", "payload": { "email_content": "..." } }`).
    *   [x] Calls `LLMService` functions.
    *   [x] Sends back JSON responses (e.g., `{ "status": "success", "data": { "summary": "..." } }`).
15. **[x] Reminder API Endpoints**
    *   [x] `POST /reminders`: Create a reminder.
    *   [x] `GET /reminders`: List reminders (can filter by active/email_id).
    *   [x] `GET /reminders/{reminder_id}`: Get a specific reminder.
    *   [x] `PUT /reminders/{reminder_id}`: Update a reminder (e.g., snooze, mark done).
    *   [x] `DELETE /reminders/{reminder_id}`: Delete a reminder.
16. **[x] Email API Endpoints**
    *   [x] `GET /emails`: List emails (paginated, from DB or cache).
    *   [x] `GET /emails/{email_id}`: Get full email content.
    *   [x] `POST /emails/{email_id}/action`: Perform actions (reply, archive, delete – stubs calling `EmailFetchingService`).
17. **[ ] Calendar API Endpoints (STUB)**
    *   [ ] `GET /calendar/events`: List upcoming events.

* * *

4.  Renderer (Frontend - React/Vite/TailwindCSS)

-------------------------------------------------

18. **[x] OAuth Flow for MS Graph (Backend API)**
    *   [x] Backend API endpoints for OAuth flow initiation and token exchange.
    *   [x] PKCE-secured OAuth 2.0 implementation with Microsoft Graph.
    *   [x] Secure token storage and automatic refresh functionality.
    *   [ ] UI in Renderer to initiate login.
    *   [ ] Frontend integration with OAuth endpoints.
19. **[x] Basic UI for Settings in Renderer (`renderer/src/components/Settings.jsx`)**
    *   [x] Input fields for LLM provider, API key, model.
    *   [x] Input fields for email account type, MS Graph Client ID/Tenant ID.
    *   [x] Input fields for scheduler interval, fetch limit.
    *   [x] (Optional) Database path, encryption toggle.
    *   [x] UI theme selection (light, dark, system).
20. **[x] Integrate Settings UI with Backend Config Service via HTTP**
    *   [x] Fetch current settings from `GET /config` on component mount.
    *   [x] Save updated settings via `POST /config`.
    *   [x] Handle loading states and error messages.
21. **[x] Integrate `Settings.jsx` into `App.jsx` (e.g., via a new route or conditional rendering)**
22. **[x] Basic styling for `Settings.jsx` using Tailwind CSS**
23. **[x] UI for Email List & Triage (`renderer/src/components/EmailList.jsx`, `EmailItem.jsx`)**
    *   [x] Display list of emails (sender, subject, snippet, date).
    *   [x] Clickable items to view full email.
    *   [x] Basic sorting/filtering options.
    *   [x] Infinite scroll or pagination.
24. **[x] UI for Email Detail View (`renderer/src/components/EmailDetail.jsx`)**
    *   [x] Display full email content (HTML rendering, sanitized).
    *   [x] Show headers (From, To, Cc, Subject, Date).
    *   [x] Attachment handling (list, download).
    *   [x] Buttons for "Summarize," "Draft Reply," "Set Reminder."
25. **[x] UI for Reminder Management (`renderer/src/components/ReminderList.jsx`, `ReminderForm.jsx`)**
    *   [x] Display list of active reminders.
    *   [x] Form to create/edit reminders.
    *   [x] Snooze/dismiss options.
26. **[x] UI for LLM Interaction (Integrated in EmailDetail)**
    *   [x] WebSocket service for real-time LLM communication.
    *   [x] Email summarization with loading indicators.
    *   [x] Reply drafting with custom instructions.
27. **[ ] Desktop Notifications for Reminders (Main Process & Renderer)**
    *   [ ] Scheduler checks due reminders and sends IPC to Main.
    *   [ ] Main process uses Electron `Notification` API.
    *   [ ] Clicking notification focuses app and shows reminder.

* * *

5.  Integration & Core Logic

-----------------------------

28. **[x] Integrate Email Fetching with UI (Displaying emails)**
    *   [x] Renderer calls backend API to get emails.
    *   [x] Update `EmailList` component with fetched data.
29. **[x] Integrate LLM Service with UI (WebSocket communication)**
    *   [x] Renderer establishes WebSocket connection to `/ws/llm`.
    *   [x] Send summarize/draft requests from `EmailDetail`.
    *   [x] Update UI with responses and loading states.
30. **[x] Integrate Reminder Service with UI (Displaying and managing reminders)**
    *   [x] Renderer calls backend API for reminder CRUD.
    *   [x] Update `ReminderList` and `ReminderForm`.
31. **[x] Persistent Storage for Emails (SQLite)**
    *   [x] Database service with complete email storage.
    *   [x] Email API endpoints read from database.
32. **[x] Persistent Storage for Reminders (SQLite)**
    *   [x] Database service integrated with reminder operations.
33. **[ ] Encryption for Database**
    *   [ ] Implement if `DatabaseSettings.encrypt` is true.
34. **[ ] Build & Packaging Scripts**
    *   [ ] Configure `electron-builder` in `package.json`.
    *   [ ] Create `build_scripts/build_python.sh` to bundle Python backend (e.g., using PyInstaller or Nuitka) into `dist/backend`.
    *   [ ] Ensure `extraResources` in `electron-builder` includes the bundled backend.
    *   [ ] Test builds for Windows, macOS, Linux.

* * *

6.  Testing & Refinement

-------------------------

35. **[ ] Unit Tests for Backend Services**
    *   [ ] Use `pytest`.
    *   [ ] Test `ConfigService` load/save/encryption.
    *   [ ] Test `LLMService` with mock API calls.
    *   [ ] Test `EmailFetchingService` logic (mock Graph API).
    *   [ ] Test `SchedulerService` job queuing and execution.
    *   [ ] Test `ReminderService` CRUD and due checks.
36. **[ ] Unit Tests for Frontend Components**
    *   [ ] Use `Jest` & `React Testing Library`.
    *   [ ] Test `Settings` component form interactions.
    *   [ ] Test `EmailList`, `EmailItem`, `EmailDetail` rendering with mock data.
    *   [ ] Test `ReminderList`, `ReminderForm` interactions.
37. **[ ] E2E Tests (Optional)**
    *   [ ] Use Playwright or Spectron for Electron E2E testing.
    *   [ ] Test login flow, email fetching, summarization, reminder setting.
38. **[ ] Documentation (README updates, Onboarding)**
    *   [ ] Update `README.md` with detailed setup, architecture overview, and contribution guidelines.
    *   [ ] Create `ONBOARDING.md` with environment setup, API key requirements, and common troubleshooting.
39. **[ ] Pre‐flight Checks & User Feedback**
    *   [ ] On startup, check for essential configs (API keys if provider selected).
    *   [ ] Guide user to Settings page if setup is incomplete.
    *   [ ] Implement a simple feedback mechanism or link.
40. **[ ] UI Testing**
    *   [ ] Write basic React unit tests using `Jest` & `React Testing Library` in `renderer/src/tests/`:
    *   [ ] Test that `SettingsPage` renders all fields and validations trigger correctly.
    *   [ ] Test that `ReminderPopup` appears when `unreadCount > 0`.
    *   [ ] (Optional) Configure Cypress for end‐to‐end flow: load the app, simulate user interactions, validate calls over WebSocket.

* * *

12. MVP Delivery & Next Steps

-----------------------------

41. **[ ] MVP Feature Checklist**
    *   [x] Settings UI + persistent save & load
    *   [ ] Reminder popup with snooze options
    *   [x] Email fetch via Graph (MSGraph part done, IMAP is [ ])
    *   [x] Simple LLM integration (OpenAI only)
    *   [x] Basic triage UI: email list, email detail, summary display
    *   [ ] Send reply via Graph (Stubbed, not fully functional)
    *   [x] Scheduler running at configured intervals
    *   [x] Encryption toggle for config (Implemented in config service)
42. **[ ] Post‐MVP Enhancements (v1.1)**
    *   [x] Add Anthropic, Mistral, TogetherAI, OpenRouter support in `llm_service.py`.
    *   [x] Implement full meeting‐aware scheduling via `calendar_service`.
    *   [ ] Add slide‐in drawers for secondary actions (labels, flags, archive).
    *   [ ] Implement dark mode toggle and I18N scaffolding.
43. **[ ] Documentation & Onboarding**
    *   [ ] Update `README.md` with “How to contribute,” “Folder Structure,” and “Coding Standards.”
    *   [ ] Write a short “Developer Onboarding” doc listing environment variables (`GRAPH_CLIENT_ID`, etc.), how to obtain API keys, and how to run tests.

* * *

> _This plan breaks down the SERINA requirements into discrete, code‐focused tasks organized by feature area. It’s designed to be parsed by an LLM or engineering team to sequentially implement and verify functionality, with an emphasis on modularity, testing, and precise code output._