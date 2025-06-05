# SERINA - Master Task List (Prioritized)

This document consolidates all pending tasks required for the SERINA project, categorized by priority to guide focused execution. It is based on the latest project status as of 2025-06-05.

---

## High Priority - Immediate Focus for Progress & Improvement

*Tasks to complete next to see tangible project progress and core functionality improvements.*

- **OAuth & Core Frontend Setup for Microsoft Graph**
  - [ ] Develop the User Interface (UI) in the Renderer to initiate the OAuth login flow.
  - [ ] Integrate the frontend with the backend OAuth endpoints for token exchange and management.
- **Core Email Sending Functionality**
  - [ ] Implement the method to send emails (backend - `backend/email_service.py`).
  - [ ] Implement functionality to send replies via Microsoft Graph (frontend/integration - MVP Delivery).
- **Core Reminder & Notification Functionality**
  - [ ] Implement the reminder popup UI with snooze options (MVP Delivery).
  - [ ] Implement scheduler checks for due reminders and send Inter-Process Communication (IPC) messages to the Main process.
  - [ ] Utilize Electron's `Notification` API in the Main process to display desktop notifications.
  - [ ] Ensure that clicking a notification focuses the application window and displays the relevant reminder.
- **Calendar Integration for Meeting Awareness**
  - [ ] Implement `GET /calendar/events` endpoint to list upcoming calendar events (Backend API).

## Medium Priority - Essential Next Steps

*Relevant tasks to complete once the high-priority items are addressed, focusing on stability, usability, and build processes.*

- **Integration & Core Logic Enhancements**
  - [ ] Implement database encryption if `DatabaseSettings.encrypt` is enabled in the configuration.
- **Build & Packaging**
  - [ ] Configure `electron-builder` within `package.json` for application packaging.
  - [ ] Create/Finalize `build_scripts/build_python.sh` to bundle the Python backend (e.g., using PyInstaller or Nuitka) into the `dist/backend` directory.
  - [ ] Ensure the bundled Python backend is correctly included via `extraResources` in the `electron-builder` configuration.
  - [ ] Conduct thorough testing of builds for Windows, macOS, and Linux platforms.
- **Initial User Guidance & Setup**
  - [ ] Populate `README.md` with a high-level project overview and instructions on how to run SERINA in development mode (Project Scaffolding).
  - [ ] Implement startup checks for essential configurations (e.g., API keys if an LLM provider is selected).
  - [ ] Guide users to the Settings page if the initial setup is incomplete.

## Low Priority - Testing, Documentation & Future Enhancements

*Tasks focused on comprehensive testing, detailed documentation, and additional functionalities or improvements for future versions.*

- **Backend Service Enhancements**
  - [ ] (Optional) Develop `IMAPService` class for broader email server compatibility (`backend/email_service.py`).
  - [ ] (Optional) Implement Alembic for managing database schema migrations (`backend/database_service.py`).
- **Comprehensive Testing**
  - **Backend Unit Tests (`pytest`)**
    - [ ] `ConfigService`: Test loading, saving, and encryption/decryption of configurations.
    - [ ] `LLMService`: Test with mock API calls to LLM providers.
    - [ ] `EmailFetchingService`: Test core logic with a mock Graph API.
    - [ ] `SchedulerService`: Test job queuing, execution, and scheduling logic.
    - [ ] `ReminderService`: Test CRUD operations and due reminder checks.
  - **Frontend Unit Tests (`Jest` & `React Testing Library`)**
    - [ ] `Settings` component: Test form interactions, data binding, and validation.
    - [ ] `EmailList`, `EmailItem`, `EmailDetail`: Test rendering with mock data and user interactions.
    - [ ] `ReminderList`, `ReminderForm`: Test interactions and data handling.
    - [ ] Verify `SettingsPage` renders all fields and validation logic triggers correctly (`renderer/src/tests/`).
    - [ ] Verify `ReminderPopup` appears correctly when `unreadCount > 0` (`renderer/src/tests/`).
  - **End-to-End (E2E) Tests (Optional - Playwright or Spectron)**
    - [ ] Test user login flow.
    - [ ] Test email fetching and display.
    - [ ] Test LLM-based summarization feature.
    - [ ] Test setting and receiving reminders.
  - **UI Testing (Optional - Cypress)**
    - [ ] (Optional) Configure Cypress for E2E flow testing: load the app, simulate user interactions, and validate WebSocket calls.
- **Detailed Documentation & Onboarding**
  - **README Updates**
    - [ ] Update `README.md` with detailed setup instructions, an architecture overview, and contribution guidelines.
    - [ ] Add sections on "How to contribute," "Folder Structure," and "Coding Standards" to `README.md`.
  - **Developer Onboarding**
    - [ ] Create `ONBOARDING.md` detailing environment setup, required API keys (e.g., `GRAPH_CLIENT_ID`), how to obtain them, and instructions for running tests.
    - [ ] Write a short "Developer Onboarding" document listing necessary environment variables.
- **User Feedback Mechanism**
  - [ ] Implement a simple mechanism for users to provide feedback or report issues.
- **Post-MVP Enhancements (v1.1+)**
  - **UI Enhancements**
    - [ ] Add slide-in drawers for secondary email actions (e.g., applying labels, flagging, archiving).
    - [ ] Implement a dark mode toggle and prepare for Internationalization (I18N) scaffolding.

---
This master list will serve as the central point for tracking project progress.
