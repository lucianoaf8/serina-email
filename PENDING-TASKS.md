# Pending Tasks for SERINA Email Assistant

This list includes all tasks from the implementation plan that have not yet been marked as completed as of 2025-06-04.

---

## Project Scaffolding & Environment Setup
- [ ] Populate `README.md` with high‐level overview and “How to run in dev mode.”

## Core Backend Services (Python/FastAPI)
- [ ] Method to send email (stub for now) in `backend/email_service.py`.
- [ ] (Optional) `IMAPService` class in `backend/email_service.py`.
- [ ] (Optional) Alembic for schema migrations in `backend/database_service.py`.

## Backend API Endpoints (FastAPI in `backend/main.py`)
- [ ] Calendar API Endpoints (STUB)
  - [ ] `GET /calendar/events`: List upcoming events.

## Renderer (Frontend - React/Vite/TailwindCSS)
- [ ] UI in Renderer to initiate login (OAuth).
- [ ] Frontend integration with OAuth endpoints.

## Desktop Notifications for Reminders
- [ ] Desktop Notifications for Reminders (Main Process & Renderer)
  - [ ] Scheduler checks due reminders and sends IPC to Main.
  - [ ] Main process uses Electron `Notification` API.
  - [ ] Clicking notification focuses app and shows reminder.

## Integration & Core Logic
- [ ] Encryption for Database
  - [ ] Implement if `DatabaseSettings.encrypt` is true.
- [ ] Build & Packaging Scripts
  - [ ] Configure `electron-builder` in `package.json`.
  - [ ] Create `build_scripts/build_python.sh` to bundle Python backend (e.g., using PyInstaller or Nuitka) into `dist/backend`.
  - [ ] Ensure `extraResources` in `electron-builder` includes the bundled backend.
  - [ ] Test builds for Windows, macOS, Linux.

## Testing & Refinement
- [ ] Unit Tests for Backend Services
  - [ ] Use `pytest`.
  - [ ] Test `ConfigService` load/save/encryption.
  - [ ] Test `LLMService` with mock API calls.
  - [ ] Test `EmailFetchingService` logic (mock Graph API).
  - [ ] Test `SchedulerService` job queuing and execution.
  - [ ] Test `ReminderService` CRUD and due checks.
- [ ] Unit Tests for Frontend Components
  - [ ] Use `Jest` & `React Testing Library`.
  - [ ] Test `Settings` component form interactions.
  - [ ] Test `EmailList`, `EmailItem`, `EmailDetail` rendering with mock data.
  - [ ] Test `ReminderList`, `ReminderForm` interactions.
- [ ] E2E Tests (Optional)
  - [ ] Use Playwright or Spectron for Electron E2E testing.
  - [ ] Test login flow, email fetching, summarization, reminder setting.
- [ ] Documentation (README updates, Onboarding)
  - [ ] Update `README.md` with detailed setup, architecture overview, and contribution guidelines.
  - [ ] Create `ONBOARDING.md` with environment setup, API key requirements, and common troubleshooting.
- [ ] Pre‐flight Checks & User Feedback
  - [ ] On startup, check for essential configs (API keys if provider selected).
  - [ ] Guide user to Settings page if setup is incomplete.
  - [ ] Implement a simple feedback mechanism or link.
- [ ] UI Testing
  - [ ] Write basic React unit tests using `Jest` & `React Testing Library` in `renderer/src/tests/`:
  - [ ] Test that `SettingsPage` renders all fields and validations trigger correctly.
  - [ ] Test that `ReminderPopup` appears when `unreadCount > 0`.
  - [ ] (Optional) Configure Cypress for end‐to‐end flow: load the app, simulate user interactions, validate calls over WebSocket.

## MVP Delivery & Next Steps
- [ ] Reminder popup with snooze options
- [ ] Send reply via Graph (Stubbed, not fully functional)

## Post‐MVP Enhancements (v1.1)
- [ ] Add slide‐in drawers for secondary actions (labels, flags, archive).
- [ ] Implement dark mode toggle and I18N scaffolding.

## Documentation & Onboarding
- [ ] Update `README.md` with “How to contribute,” “Folder Structure,” and “Coding Standards.”
- [ ] Write a short “Developer Onboarding” doc listing environment variables (`GRAPH_CLIENT_ID`, etc.), how to obtain API keys, and how to run tests.
