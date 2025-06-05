SERINA — Smart Email Review & Intelligent Notification Agent
============================================================

* * *

Table of Contents
-----------------

1. [Project Overview](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#project-overview)

2. [Branding & Positioning](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#branding--positioning)

3. [Core Objectives](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#core-objectives)

4. [High-Level Architecture](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#high-level-architecture)
   
   * 4.1 [Component Diagram](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#component-diagram)
   
   * 4.2 [Technology Stack](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#technology-stack)
   
   * 4.3 [Data Flow & IPC](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#data-flow--ipc)

5. [User Interface & UX](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#user-interface--ux)
   
   * 5.1 [Settings Page](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#settings-page)
   
   * 5.2 [Reminder Popup](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#reminder-popup)
   
   * 5.3 [Main Triage Interface](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#main-triage-interface)
   
   * 5.4 [Usability Considerations](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#usability-considerations)

6. [State Management & Persistence](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#state-management--persistence)
   
   * 6.1 [Configuration Schema](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#configuration-schema)
   
   * 6.2 [Email Tracking Schema](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#email-tracking-schema)
   
   * 6.3 [Logs & History](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#logs--history)

7. [Electron + Python Integration](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#electron--python-integration)
   
   * 7.1 [Project File Structure](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#project-file-structure)
   
   * 7.2 [Main & Renderer Processes](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#main--renderer-processes)
   
   * 7.3 [Backend Python Service](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#backend-python-service)
   
   * 7.4 [IPC Patterns](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#ipc-patterns)

8. [LLM Integration Layer](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#llm-integration-layer)
   
   * 8.1 [Supported Providers](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#supported-providers)
   
   * 8.2 [API Key Management](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#api-key-management)
   
   * 8.3 [Error Handling & Rate Limits](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#error-handling--rate-limits)
   
   * 8.4 [Prompt Templates & Validation](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#prompt-templates--validation)

9. [Email & Calendar Integration](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#email--calendar-integration)
   
   * 9.1 [Email Fetching & Monitoring](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#email-fetching--monitoring)
   
   * 9.2 [Calendar Awareness](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#calendar-awareness)
   
   * 9.3 [Reply & Send Mechanisms](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#reply--send-mechanisms)

10. [Notification & Scheduling Engine](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#notification--scheduling-engine)
    
    * 10.1 [Scheduler Implementation](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#scheduler-implementation)
    
    * 10.2 [Snooze Logic](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#snooze-logic)
    
    * 10.3 [Meeting Detection](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#meeting-detection)

11. [Security & Privacy](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#security--privacy)
    
    * 11.1 [Encryption & Secure Storage](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#encryption--secure-storage)
    
    * 11.2 [Authentication & Auth Flows](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#authentication--auth-flows)
    
    * 11.3 [User Data & Logs Handling](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#user-data--logs-handling)
    
    * 11.4 [Privacy by Design](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#privacy-by-design)

12. [Build & Packaging](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#build--packaging)
    
    * 12.1 [Development Setup](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#development-setup)
    
    * 12.2 [Building for Production](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#building-for-production)
    
    * 12.3 [Distribution & Auto-Update](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#distribution--auto-update)

13. [Next Steps & Roadmap](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#next-steps--roadmap)

14. [Appendices](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#appendices)
    
    * 14.1 [Glossary](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#glossary)
    
    * 14.2 [References & Resources](https://chatgpt.com/c/683f77d1-a2c4-800b-9fea-6b8963e1a5ec#references--resources)

* * *

1. Project Overview

-------------------

**SERINA** (pronounced “Seh-REE-nah”) stands for **Smart Email Review & Intelligent Notification Agent**. It is an Electron-based desktop application with a Python backend, powered by large language models (LLMs), designed to:

* Proactively monitor a user’s inbox and detect new/unassessed emails.

* Integrate with calendar data to prevent interruptions during meetings or focus sessions.

* Provide concise, AI-generated summaries and draft replies.

* Offer a non-intrusive reminder system with configurable schedules and snooze options.

* Maintain local, secure storage of user preferences, email state, and logs.

The target audience includes professionals with high email volumes who require streamlined triage, quick responses, and minimal context switching.

* * *

2. Branding & Positioning

-------------------------

### **SERINA**

**Smart Email Review & Intelligent Notification Agent**

#### Overview

SERINA transforms your inbox from a source of stress into an efficient workflow. By combining calendar awareness, AI-powered summarization, and context-sensitive reminders, SERINA helps users stay focused, respond promptly, and never miss critical correspondence.

#### Core Features

* **Smart Triage Interface**: A three-panel layout to prioritize, preview, and classify new emails.

* **LLM-Powered Summaries & Replies**: Instantly generate and refine drafts using OpenAI, Anthropic, Mistral, TogetherAI, or OpenRouter.

* **Meeting-Aware Notifications**: Integrated with Microsoft Graph API to avoid reminders during busy calendar slots.

* **Adaptive Reminders**: Quiet-time and focus-mode aware scheduling.

* **Secure Configuration & Logs**: Local encryption, optional PIN protection, and obfuscated logs.

#### Powered By

* **LLMs**: OpenAI, Anthropic (Claude), Mistral, TogetherAI, OpenRouter

* **Calendar API**: Microsoft Graph (primary), [optionally] Google Calendar API

* **Data Persistence**: SQLite or JSON (local file system)

#### UI Highlights

* **Three-Panel Layout**: Email List • HTML Email View • LLM Assistant

* **Hotkey Support & Dark Mode**

* **Slide-In Drawers for Secondary Actions**

* **Fully Configurable Settings UI**: Manage tray behavior, snooze logic, API keys, and email clients.

#### Ideal For

* High-volume email professionals

* Teams requiring SLA-driven response workflows or triage rotations

* Remote workers needing calendar-integrated, quiet notifications

#### Privacy by Design

* No cloud storage of email content

* Direct LLM communication from the user’s machine (no third-party server hops)

* Encrypted logs and configuration with optional PIN protection

> **SERINA** — _Be notified only when it matters. Reply only when you’re ready._

* * *

3. Core Objectives

------------------

1. **Context-Aware Reminders**: Only show reminders within user-defined active hours, excluding quiet hours and meeting times.

2. **Seamless User Workflow**: Provide quick email summaries and draft replies without forcing users to switch applications.

3. **Configurable, Non-Intrusive UI**: Let users control what, when, and how they are notified — including tray behaviors and snooze options.

4. **Secure & Local Data Storage**: Keep all user data (config, email state, logs) on the local machine, encrypted at rest.

5. **Scalable LLM Integration**: Abstract API calls to multiple LLM providers, allowing fallbacks and preference order.

* * *

4. High-Level Architecture

--------------------------

### 4.1 Component Diagram

    +---------------------------------+         +---------------------+
    |           Electron UI           |         | Python Backend      |
    |  (renderer process: React + JS) | <-----> | (LLM orchestrator,  |
    |      (main process: Node.js)    |         |  email & calendar   |
    +---------------------------------+         |  handlers, SQLite)  |
             ^          |   IPC (JSON)    +---------------------+
             |          v
    +----------------------+     +----------------------+     +-----------------+
    | System Tray & Notifier|    | Scheduler & Meeting  |     | LLM Providers   |
    | (Node.js)             |    | Detector (Python)    |     | (OpenAI,        |
    +----------------------+     +----------------------+     |  Anthropic, etc.)|
                                                                  +-----------------+

* **Electron UI** (Renderer): Renders React-based settings page, popup notifications, and main triage UI.

* **Electron Main Process (Node.js)**: Manages window creation, system tray, app lifecycle, and spawns / supervises the Python backend.

* **Python Backend Service**: A long-running process handling:
  
  * Email fetching (IMAP/Graph API/comIntercept)
  
  * Calendar checks (Graph API)
  
  * LLM API orchestration (sending prompts & receiving completions)
  
  * Persistent state (SQLite or JSON)
  
  * Scheduling logic & snooze management

* **LLM Providers**: Third-party APIs for generating summaries and replies.

### 4.2 Technology Stack

| Layer                 | Technology                                                                                           | Rationale                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| UI Framework          | React (JSX) + Tailwind                                                                               | Component-based, scalable, fast styling, widely used in Electron.       |
| Desktop Container     | Electron                                                                                             | Full Node.js support, easy Python integration, rich ecosystem.          |
| Backend Language      | Python 3.12+                                                                                         | Mature libraries for IMAP, Graph API, SQLite, and LLM client libs.      |
| IPC / Bridging        | child_process / WebSocket / REST                                                                     | Flexible communication between Node and Python.                         |
| Persistence           | SQLite (via `sqlite3`) or JSON (via `json` lib)                                                      | Lightweight, file-based, fast.                                          |
| LLM Integration       | `openai` Python SDK, `anthropic` Python SDK, custom HTTP clients for TogetherAI, Mistral, OpenRouter | Unified abstraction for prompts & completions.                          |
| Email Fetching        | Microsoft Graph SDK (`msal` + `requests`) or `imaplib`                                               | Secure, enterprise-compliant email access; fallback to IMAP if allowed. |
| Calendar Integration  | Microsoft Graph SDK                                                                                  | Detect busy/free slots, avoid notifications.                            |
| Build & Packaging     | `electron-builder`                                                                                   | Cross-platform packaging, auto-updates, code signing support.           |
| Logging               | Python `logging` + custom frontend logger                                                            | Consistent logs for debug, file-based.                                  |
| Security / Encryption | `cryptography` for config + logs encryption                                                          | Prevent unauthorized read of keys and history.                          |

### 4.3 Data Flow & IPC

1. **Initialization**:
   
   * Electron main spawns Python backend as a child process (or absolutely as a daemon).
   
   * Main listens on a local `WebSocket` server started by Python or uses simple `stdin/stdout` JSON-RPC IPC.
   
   * UI (renderer) communicates with main process via `Electron.ipcRenderer`, which forwards requests to Python.

2. **Settings Change**:
   
   * User updates settings in React UI.
   
   * React state --> `ipcRenderer.send('update-settings', newConfig)` --> Electron main --> write to SQLite/JSON via Python IPC.

3. **Email Polling Cycle**:
   
   * Python scheduler triggers at configured intervals.
   
   * Python checks calendar (Microsoft Graph) for current meeting status.
     
     * If busy, reschedules next check.
     
     * If free, Python fetches unread/unassessed emails using Graph API or IMAP.
   
   * Python updates local state and notifies Electron main of new/unassessed email count via IPC.
   
   * Main triggers system tray notification popup.

4. **User Interaction (Triage UI)**:
   
   * User clicks `View` on popup --> Electron opens Triage Window.
   
   * Renderer requests email content for selected `email_id` (`ipcRenderer.send('fetch-email', id)`).
   
   * Python returns full email HTML, LLM summary, and reply suggestion.
   
   * User edits reply and clicks `Send Reply`: Renderer sends `ipcRenderer.send('send-reply', {id, draftText})`.
   
   * Python uses either Outlook COM or Graph API to send reply and marks email as assessed.
   
   * On success, Python updates state and notifies renderer to refresh list.

5. **Logging**:
   
   * All significant events (email fetched, LLM call success/failure, reply sent) are logged to local file.
   
   * Logs can be viewed or cleared via Settings UI (using Python to read/write files).

* * *

5. User Interface & UX

----------------------

### 5.1 Settings Page

#### Sections and Fields

1. **General Schedule**
   
   * **Active Days**: Mon, Tue, Wed, Thu, Fri, Sat, Sun (checkbox group)
   
   * **Active Time Range**: From [HH:MM] to [HH:MM]
   
   * **Quiet Hours**: From [HH:MM] to [HH:MM] (optional)
   
   * **Reminder Interval**: Dropdown (15 / 30 / 60 / Custom)
   
   * **Skip Reminders During Meetings**: Toggle switch (on/off)

2. **Behavior & Notifications**
   
   * **Default Snooze Behavior**: Dropdown (15m / 30m / Next Reminder)
   
   * **Start on System Boot**: Checkbox
   
   * **Minimize to Tray on Close**: Checkbox
   
   * **Hide App from Tray**: Checkbox
   
   * **Log File Path**: Input field + file picker button

3. **LLM Configuration**
   
   * Section header: “LLM Providers”
     
     * **OpenAI API Key**: Text input (masked)
     
     * **Anthropic API Key**: Text input (masked)
     
     * **OpenRouter API Key**: Text input (masked)
     
     * **TogetherAI API Key**: Text input (masked)
     
     * **Mistral API Key**: Text input (masked)
     
     * For each: connectivity test button ("Test Connection") + status indicator.

4. **Email & Calendar Settings**
   
   * **Email Client**: Dropdown (Outlook, Gmail, Custom)
   
   * **Email Address to Monitor**: Text input (pre-filled from local OS account)
   
   * **Calendar Auth Status**: Read-only label ("Connected: [Account Name]" or "Not Connected") + “Reconnect” button.

5. **Security & Persistence (Optional)**
   
   * **Encrypt Settings at Rest**: Checkbox
   
   * **Lock Settings with PIN**: Checkbox + two inputs for new PIN and confirm PIN
   
   * **Obfuscate Sensitive Logs**: Checkbox (toggles between plain-text vs obfuscated)

6. **Actions**
   
   * **Save**: Primary button
   
   * **Reset to Defaults**: Secondary button

#### Example Wireframe Layout

    +------------------------------------------------------+
    |          SERINA Settings                             |
    +------------------------------------------------------+
    |  [■■] General Schedule                               |
    |    Active Days: [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]
    |    Active Time Range: __:__  –  __:__                 |
    |    Quiet Hours: __:__  –  __:__ (optional)            |
    |    Reminder Interval: [ 15 min ▼ ]                    |
    |    Skip During Meetings: [✔]                          |
    |                                                      |
    |  [■■] Behavior & Notifications                         |
    |    Default Snooze: [ 15 min ▼ ]                       |
    |    Start on Boot: [✔]                                 |
    |    Minimize to Tray: [✔]                              |
    |    Hide from Tray: [ ]                                |
    |    Log File Path: [C:\Users\luca\...\serina.log] [Browse]
    |                                                      |
    |  [■■] LLM Configuration                                |
    |    OpenAI Key: [**************] (Test) [✔️]           |
    |    Anthropic Key: [**************] (Test) [⚠️]         |
    |    OpenRouter Key: [**************] (Test) [—]         |
    |    TogetherAI Key: [**************] (Test) [—]         |
    |    Mistral Key: [**************] (Test) [—]            |
    |                                                      |
    |  [■■] Email & Calendar Settings                        |
    |    Email Client: [ Outlook ▼ ]                        |
    |    Email to Monitor: [luca@example.com]               |
    |    Calendar Status: Connected as luca@example.com (Reconnect)
    |                                                      |
    |  [■■] Security & Persistence                           |
    |    Encrypt Settings: [ ]                              |
    |    Lock with PIN: [ ]  PIN: [__]  Confirm: [__]        |
    |    Obfuscate Logs: [ ]                                |
    |                                                      |
    |  [ Save ]  [ Reset to Defaults ]                      |
    +------------------------------------------------------+

##### Notes:

* Use collapsible panels or accordions for each major section.

* Display connectivity status icons next to test buttons.

* Show inline validation errors (e.g., invalid time ranges or missing API keys).

* * *

### 5.2 Reminder Popup

#### Purpose

A lightweight, non-intrusive tray/desktop notification that informs the user of pending emails and offers quick snooze or view options.

#### Trigger Conditions

* Within active hours.

* Not in a meeting (based on calendar check).

* At least one new or unassessed email exists.

#### Contents

* **Header**: "You have X new emails, Y unassessed emails"

* **Buttons**:
  
  * **View** (opens main triage UI)
  
  * **Snooze 15m**
  
  * **Snooze 30m**
  
  * **Snooze until next reminder**

#### Design & Behavior

* Position: Bottom-right corner (Windows) or top-right (macOS) by default.

* No forced focus steal; subtle banner or toast notification.

* Automatically disappears after user-defined duration (e.g., 10 seconds) if no interaction.

##### Example Markup (React/Tailwind)

    <div className="bg-white border rounded-lg shadow-lg p-4 flex flex-col w-64">
      <div className="font-semibold text-lg">New: {newCount}  Unassessed: {unassessedCount}</div>
      <div className="mt-2 flex justify-between">
        <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={openTriage}>View</button>
        <button className="px-2 py-1 text-gray-700" onClick={() => snooze(15)}>Snooze 15m</button>
        <button className="px-2 py-1 text-gray-700" onClick={() => snooze(30)}>Snooze 30m</button>
        <button className="px-2 py-1 text-gray-700" onClick={() => snoozeUntilNext()}>Snooze</button>
      </div>
    </div>

* * *

### 5.3 Main Triage Interface

#### Overall Structure

1. **Window Title & Toolbar**
   
   * App icon, title "SERINA" and minimize/close buttons.
   
   * Settings gear icon, user avatar (optional).

2. **Left Panel: Email List & Folders**
   
   * **Folders Section**: Inbox, Sent, Drafts, Starred, Custom folders.
   
   * **Email List**: Scrollable list showing each email’s sender, subject, preview snippet, and status icons (unread/assessed/priority). Highlighted selected item.
   
   * Search/filter bar at top (optional MVP).

3. **Center Panel: Full Email View**
   
   * **Header**: Sender avatar, name, email address, timestamp, subject.
   
   * **Body**: Rendered HTML/CSS of email content.
   
   * **Attachment Preview**: If present, small icons or links.

4. **Right Panel: LLM Assistant**
   
   * **Summary Box**: LLM-generated summary (collapsible/expandable).
   
   * **Reply Box**: Editable text area with larger height for draft reply.
   
   * **Provider Selector**: Dropdown to select which LLM to use (OpenAI, Claude, Mistral).
   
   * **Generate/Refresh** button to re-run summary or reply suggestion.

5. **Bottom Action Bar**
   
   * **Primary Actions**: [Send Reply] (blue), [Create Task], [Flag], [Snooze]
   
   * **Secondary Actions** (Drawer): [Assign Label], [Archive], [Mark as Important], etc., in slide-in drawer or modal when user clicks an ellipsis menu.

#### Wireframe Example

    +------------------------------------------------------------------------------+
    | SERINA           [🔍] [⚙️] [👤]            [—] [□] [✕]                       |
    |------------------------------------------------------------------------------|
    | Folders        |                       | LLM Assistant                             |
    | + Inbox        |  Full Email View      | + Summary                                 |
    | |_ Sent        |  + Sender Avatar      | | LLM says this email invites review...    |
    | |  Drafts      |  + Sender Name        | + Reply Suggestion                        |
    | |  Starred     |  + Timestamp          | | Sure, I’ll review and get back with any...|
    | |  Custom      |  + HTML-rendered body | | [Generate/Refresh]  [OpenAI ▼]           |
    | |              |  + Attachments        |                                            |
    |--------------- | --------------------- |                                            |
    |               Bottom Action Bar: [Send Reply] [Create Task] [Flag] [Snooze]   |
    +------------------------------------------------------------------------------+

##### Notes:

* Make panels resizable: allow horizontal drag to give more space to email or LLM assistant.

* For small screens or docks, collapse right panel into a tabbed view.

* Provide keyboard shortcuts: Arrow keys to navigate email list, `R` to focus Reply Box, `S` to Snooze.

* * *

### 5.4 Usability Considerations

* **Dark Mode**: Toggle in settings; swap color schemes via Tailwind’s dark variants.

* **Accessibility**: Ensure high-contrast text, keyboard navigation, ARIA labels for buttons.

* **Localization/I18N**: Use a JSON-based i18n library (React-i18next) for strings.

* **Error States**: Show toast notifications for failures (e.g., LLM API key missing, Graph API auth expired).

* * *

6. State Management & Persistence

---------------------------------

### 6.1 Configuration Schema

SERINA stores user configuration in a local file (`config.json`) or SQLite table (`settings`):
    {
      "generalSchedule": {
        "activeDays": ["Mon","Tue","Wed","Thu","Fri"],
        "activeHours": {"start": "09:00","end": "17:00"},
        "quietHours": {"start": "12:00","end": "13:00"},
        "reminderIntervalMins": 15,
        "skipDuringMeetings": true
      },
      "behavior": {
        "defaultSnooze": 15,
        "startOnBoot": true,
        "minimizeToTray": true,
        "hideFromTray": false,
        "logFilePath": "C:\\Users\\luca\\SERINA\\logs\\serina.log"
      },
      "llmConfig": {
        "openaiApiKey": "sk-...",
        "anthropicApiKey": "...",
        "openrouterApiKey": "...",
        "togetherApiKey": "...",
        "mistralApiKey": "..."
      },
      "emailSettings": {
        "emailClient": "Outlook",
        "monitorAddress": "luca@example.com",
        "calendarConnected": true
      },
      "security": {
        "encryptConfig": true,
        "pinLockEnabled": false,
        "pinHash": "...",
        "obfuscateLogs": true
      }
    }

* **Encryption**: If `encryptConfig` is true, the entire file is AES-encrypted with a user-provided master key (derived from PIN or OS keychain).

* **Persistent Defaults**: If `config.json` missing or invalid, populate with defaults.

### 6.2 Email Tracking Schema

Use a local SQLite database (`serina.db`) with tables:
    -- Table: emails
    CREATE TABLE IF NOT EXISTS emails (
      email_id TEXT PRIMARY KEY,
      folder TEXT,
      sender TEXT,
      subject TEXT,
      received_at DATETIME,
      is_read BOOLEAN DEFAULT FALSE,
      is_assessed BOOLEAN DEFAULT FALSE,
      snoozed_until DATETIME,
      thread_id TEXT,
      summary TEXT,
      reply_draft TEXT
    );

    -- Table: actions
    CREATE TABLE IF NOT EXISTS actions (
      action_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id TEXT,
      action_type TEXT,         -- e.g., "sent_reply", "snooze", "flag"
      action_timestamp DATETIME,
      metadata JSON            -- any associated data
    );

    -- Table: logs (optional)
    CREATE TABLE IF NOT EXISTS logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME,
      level TEXT,
      message TEXT
    );

* **Inflight State**: Python maintains in-memory caches of recently fetched emails and action queues (persisted on shutdown).

* **Startup**: On app launch, load `emails` table to populate UI; update any `snoozed_until` that has expired.

### 6.3 Logs & History

* Use Python’s built-in `logging` module to write to both file (path from config) and an in-memory ring buffer.

* Log format: `[YYYY-MM-DD HH:MM:SS] [LEVEL] [MODULE] Message`

* UI can display last N lines of logs or provide a “Save Logs” button.

* If `obfuscateLogs` is enabled, mask email addresses and personal content before saving.

* * *

7. Electron + Python Integration

--------------------------------

### 7.1 Project File Structure

    SERINA/
    ├─ .electronignore
    ├─ package.json
    ├─ main.js                     # Electron main process
    ├─ preload.js                  # Secure IPC bridge to renderer
    ├─ renderer/                   # Frontend code (React + Tailwind)
    │   ├─ public/                 # Static assets (index.html, favicon)
    │   ├─ src/
    │   │   ├─ components/         # React components (Settings, Popup, Triage)
    │   │   ├─ pages/              # React pages (SettingsPage, TriagePage)
    │   │   ├─ utils/              # Helper functions, IPC wrappers
    │   │   ├─ App.jsx             # Main React App
    │   │   ├─ index.jsx           # Entry point
    │   │   └─ styles/             # Tailwind CSS files
    │   └─ vite.config.js          # If using Vite for dev
    ├─ backend/                    # Python backend source
    │   ├─ __init__.py
    │   ├─ main.py                  # Python entrypoint (starts scheduler & server)
    │   ├─ services/
    │   │   ├─ email_service.py     # Email fetch/send logic
    │   │   ├─ calendar_service.py  # Calendar checks (Graph API)
    │   │   ├─ llm_service.py       # Abstracted LLM client calls
    │   │   ├─ scheduler.py         # Scheduling & snooze logic
    │   │   ├─ storage.py           # SQLite/JSON read/write wrappers
    │   │   ├─ security.py          # Encrypt/decrypt config & logs
    │   │   └─ ipc_server.py        # WebSocket or JSON-RPC server for IPC
    │   ├─ models/                  # Database models (if using an ORM like SQLAlchemy)
    │   └─ requirements.txt         # Python dependencies
    ├─ assets/                      # Images, logos, icons
    │   └─ serina_logo.png
    ├─ build_scripts/               # Scripts for building/bundling both Electron & Python
    │   ├─ build_electron.sh
    │   ├─ build_python.sh
    │   └─ package_config.json      # electron-builder config
    ├─ config/                      # Default config templates
    │   ├─ default_config.json
    │   └─ default_settings_schema.json
    └─ README.md

### 7.2 Main & Renderer Processes

* **main.js (Electron Main)**
  
  * Create main BrowserWindow and load `index.html`.
  
  * Initialize system tray icon and context menu.
  
  * Spawn Python backend subprocess and listen for IPC messages.
  
  * Handle global shortcuts (e.g., toggle settings window).
  
  * Expose secure IPC channels to renderer via `preload.js`.

* **preload.js**
  
  * Define `contextBridge.exposeInMainWorld('ipc', { send: ..., receive: ... })` for safe communication.
  
  * Only expose necessary channels (`getSettings`, `updateSettings`, `notifyNewEmails`, `fetchEmail`, `sendReply`, etc.).

* **renderer/**
  
  * React application with pages and components.
  
  * Uses exposed `window.ipc` to:
    
    * Load and display configuration.
    
    * Send updated config to backend.
    
    * Receive email count updates for popup notifications.
    
    * Request email data and send replies.

### 7.3 Backend Python Service

* **main.py**:
  
  * Initialize logging, load configuration (decrypt if needed).
  
  * Connect to SQLite or read JSON state.
  
  * Start a local `WebSocket` (or JSON-RPC) server (`ipc_server.py`) on `ws://127.0.0.1:PORT`.
  
  * Start the scheduler (`scheduler.py`) to check for emails and meetings at configured intervals.
  
  * Continuously listen for IPC requests from Electron (e.g., fetch email content, send reply, update settings).

* **ipc_server.py**:
  
  * Launch a `websockets` server or HTTP server (Flask/FastAPI) for IPC.
  
  * Define message routes:
    
    * `get-settings`, `update-settings`
    
    * `check-calendar`
    
    * `fetch-unassessed-count`
    
    * `fetch-email-detail` (returns HTML, summary, draft)
    
    * `send-reply` (with email_id, reply_text)
    
    * `create-task`, `flag-email`, `snooze-email`
  
  * Authenticate requests if needed (use a simple token or socket file permissions).

### 7.4 IPC Patterns

* **Pattern A: JSON-RPC over WebSocket**
  
  * Frontend sends: `{ "jsonrpc": "2.0", "method": "fetchEmailDetail", "params": {"email_id": "..."}, "id": 1 }`
  
  * Backend responds: `{ "jsonrpc": "2.0", "result": { /* email HTML, summary, draft */ }, "id": 1 }`
  
  * Advantages: Bi-directional, real-time, lightweight.

* **Pattern B: RESTful HTTP (Flask/FastAPI)**
  
  * Frontend `fetch('/api/email/DETAIL?email_id=...')`
  
  * Backend returns JSON.
  
  * Simpler but potential cold-start overhead for HTTP server.

* **Pattern C: Child Process STDIN/STDOUT**
  
  * Electron main spawns `python main.py`.
  
  * Use `subprocess.stdin.write(JSON.stringify(msg))` and parse `stdout` lines.
  
  * Fast, no network, but slightly more complex to implement JSON parsing robustly.

* * *

8. LLM Integration Layer

------------------------

### 8.1 Supported Providers

| Provider       | SDK/Client           | Endpoint                       | Fallback Behavior         |
| -------------- | -------------------- | ------------------------------ | ------------------------- |
| **OpenAI**     | `openai` (Python)    | `https://api.openai.com/v1`    | None; Fail on missing key |
| **Anthropic**  | `anthropic` (Python) | `https://api.anthropic.com/v1` | Use OpenAI if unavailable |
| **OpenRouter** | Custom HTTP client   | Auto-detect via API key config | Alternate to OpenAI       |
| **TogetherAI** | Custom HTTP client   | Managed by Together.ai API     | Alternate to OpenRouter   |
| **Mistral**    | Custom HTTP client   | `https://api.mistral.ai`       | Alternate to TogetherAI   |

* API key presence determines availability. Use priority: 1. OpenAI, 2. Anthropic, 3. Mistral, 4. TogetherAI, 5. OpenRouter.

* Each provider integration encapsulated in `llm_service.py` with a common interface:
  
      class LLMClient:
          def summarize(self, email_text: str) -> str: ...
          def generate_reply(self, email_text: str, config: Dict) -> str: ...
  
  

### 8.2 API Key Management

* Keys loaded from configuration (decrypted in memory).

* Validate format at startup: basic regex or test request.

* UI connectivity test: call a lightweight `ping` or minimal query (e.g., small `chat.completions` request).

* On failure, log error and mark provider as unavailable.

### 8.3 Error Handling & Rate Limits

* Catch HTTP errors, inspect status codes (401 unauthorized => bad key; 429 => rate limit).

* Implement exponential backoff for retries (use `time.sleep` in Python or `retry` library).

* If primary provider fails, fallback to next in priority.

* Surface failures to user via a warning icon in UI.

### 8.4 Prompt Templates & Validation

* Store core prompts in a JSON or Python dictionary:
  
      {
        "summarize": "Summarize the following email in 2-3 sentences: {email_text}",
        "reply": "Generate a professional reply for the following email, considering the user’s preferences: {email_text}"
      }

* Validate that `email_text` length does not exceed provider’s token limit; truncate older content if needed.

* Optionally implement a templating engine (e.g., Jinja2) for prompt flexibility.

* * *

9. Email & Calendar Integration

-------------------------------

### 9.1 Email Fetching & Monitoring

#### 9.1.1 Microsoft Graph API (Preferred)

* **Authentication**: Use MSAL for Python with OAuth 2.0 Device Code flow or Interactive Browser with delegated permissions.

* **Scopes**: `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.Read`, `offline_access`.

* **Fetching Unread Emails**:
  
      from msal import PublicClientApplication
      import requests
      
      def get_unread_emails():
          token = acquire_token()
          headers = {"Authorization": f"Bearer {token['access_token']}"}
          query = "$filter=isRead eq false and receivedDateTime ge {sinceDateTime}"  # RFC3339 formatted
          url = f"https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?{query}&$top=50"
          resp = requests.get(url, headers=headers).json()
          return resp['value']

* **Marking as Read/Assessed**:
  
      url = f"https://graph.microsoft.com/v1.0/me/messages/{email_id}"
      data = {"isRead": True}
      requests.patch(url, headers=headers, json=data)

* **Sending Reply**:
  
      url = "https://graph.microsoft.com/v1.0/me/sendMail"
      payload = {
          "message": {
              "subject": f"Re: {subject}",
              "body": {"contentType": "Text", "content": reply_text},
              "toRecipients": [{"emailAddress": {"address": to_address}}]
          }
      }
      requests.post(url, headers=headers, json=payload)
  
  

#### 9.1.2 IMAP/SMTP Fallback (If Graph API Not Available)

* **IMAP**: Use `imaplib` to connect to an Exchange server or generic IMAP endpoint.
  
      import imaplib, email
      
      mail = imaplib.IMAP4_SSL('imap.example.com')
      mail.login(username, password)
      mail.select('inbox')
      status, data = mail.search(None, '(UNSEEN)')
      for num in data[0].split():
          status, msg_data = mail.fetch(num, '(RFC822)')
          msg = email.message_from_bytes(msg_data[0][1])
          # process msg, store in SQLite

* **SMTP**: Use `smtplib` to send replies.
  
      import smtplib
      from email.mime.text import MIMEText
      
      msg = MIMEText(reply_text)
      msg['Subject'] = f"Re: {original_subject}"
      msg['From'] = username
      msg['To'] = to_address
      
      server = smtplib.SMTP('smtp.example.com', 587)
      server.starttls()
      server.login(username, password)
      server.sendmail(username, [to_address], msg.as_string())
      server.quit()
  
  

### 9.2 Calendar Awareness

* **Microsoft Graph**: Check current/free/busy status.
  
      url = "https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={start}&endDateTime={end}"
      resp = requests.get(url, headers=headers).json()
      busy_slots = [event for event in resp['value'] if event['showAs'] == 'busy']

* **Logic**: If current time falls within any busy slot or an event is ongoing with `showAs: busy`, suppress notification.

* **Fallback**: If Graph API not accessible, skip meeting check and rely solely on user’s active hours.

### 9.3 Reply & Send Mechanisms

* **Outlook COM (Windows Only)**: Use `win32com.client` to reply directly without Graph API.
  
      import win32com.client
      
      outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
      inbox = outlook.Folders.Item("Mailbox Name").Folders.Item("Inbox")
      msg = inbox.Items.Find(f"[EntryID] = '{email_id}'")
      reply = msg.Reply()
      reply.Body = reply_text + "\n\n" + reply.Body
      reply.Send()
      msg.UnRead = False

* **Graph API**: Preferred for cross-platform and enterprise compliance.

* After sending, update local state: `is_assessed = True`, `reply_draft` cleared or archived.

* * *

10. Notification & Scheduling Engine

------------------------------------

### 10.1 Scheduler Implementation

* Use Python’s `apscheduler` or `schedule` to run periodic tasks.
  
      from apscheduler.schedulers.background import BackgroundScheduler
      
      def check_cycle():
          if within_active_hours() and not in_meeting():
              new_emails = fetch_unassessed_emails()
              update_local_state(new_emails)
              notify_renderer(new_emails)
      
      scheduler = BackgroundScheduler()
      scheduler.add_job(check_cycle, 'interval', minutes=config['generalSchedule']['reminderIntervalMins'])
      scheduler.start()

* On application shutdown, call `scheduler.shutdown()` gracefully.

### 10.2 Snooze Logic

* **Snooze Fields**: `snoozed_until` per email in DB.

* **User Snooze Action**: When user clicks snooze, update `emails.snoozed_until = datetime.now() + snooze_minutes`.

* **Scheduler Check**: Before notifying, filter out emails where `snoozed_until` > now.

* **Global Snooze**: User can snooze all reminders until next cycle — implement a global flag `global_snooze_until` in config.

### 10.3 Meeting Detection

* As part of `check_cycle`, call `calendar_service.is_currently_busy()`.

* If busy, set next scheduler run at `meeting_end_time + 1 minute`.

* Provide fallback: if Graph API fails, log error and proceed using active hours only.

* * *

11. Security & Privacy

----------------------

### 11.1 Encryption & Secure Storage

* Use Python’s `cryptography` library for AES-256 encryption of `config.json` and optional log files.
  
      from cryptography.fernet import Fernet
      
      def encrypt_data(data: bytes, key: bytes) -> bytes:
          f = Fernet(key)
          return f.encrypt(data)
      
      def decrypt_data(token: bytes, key: bytes) -> bytes:
          f = Fernet(key)
          return f.decrypt(token)

* **Key Management**: Derive `Fernet` key from user PIN or OS secure keystore.

* If `encryptConfig` is disabled, store as plain text but warn user.

### 11.2 Authentication & Auth Flows

* **Graph API**: Use MSAL Device Code or Interactive login. Store refresh token securely.

* **OAuth State Storage**: Save tokens in encrypted `auth.json` file.

* **Email Credentials** (IMAP/SMTP fallback): Prompt user once and store encrypted.

### 11.3 User Data & Logs Handling

* Only store minimal email metadata (ID, sender, subject, timestamps) to power UI.

* **Do not store full email bodies** unless summary or reply draft is needed.

* If `obfuscateLogs` is true, mask email addresses in logs: e.g., replace `user@domain.com` with `u***@d***.com`.

* Allow user to clear logs via UI: delete or overwrite with empty content.

### 11.4 Privacy by Design

* **No Cloud Storage**: Email content and user preferences remain on the local machine.

* **Direct LLM Calls**: All API calls originate from the user’s device; SERINA does not proxy or store LLM completions.

* **Opt-In Analytics** (Optional): If adding telemetry, it must be anonymized, and user must explicitly enable.

* * *

12. Build & Packaging

---------------------

### 12.1 Development Setup

1. **Prerequisites**:
   
   * Node.js >= 18.x, npm or yarn
   
   * Python >= 3.12, pip
   
   * Git

2. **Clone Repository**:
      git clone https://github.com/your-org/serina.git
      cd serina

3. **Install Dependencies**:
   
   * Frontend (in `renderer/`): `npm install` or `yarn`
   
   * Backend (in `backend/`): `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`

4. **Environmental Setup**:
   
   * Copy `config/default_config.json` to `config/config.json` and fill in required API keys, email credentials.
   
   * (Optional) Place `serina_logo.png` in `assets/`.

5. **Run in Development Mode**:
   
   * Start Python backend: `cd backend && python main.py`
   
   * Start Electron app: `npm run dev` (launches Vite + Electron).

### 12.2 Building for Production

1. **Build Frontend**: `npm run build` (outputs to `dist/`)

2. **Bundle Python**:
   
   * Use `pyinstaller` or `nuitka` to create a standalone executable for `backend/main.py`.
   
   * Example: `pyinstaller --onefile --name serina-backend main.py`
   
   * Generate `serina-backend.exe` (Windows) or `serina-backend` (macOS/Linux).

3. **Configure `electron-builder`**:
   
   * In `build_scripts/package_config.json`, specify:
        {
     
          "appId": "com.yourorg.serina",
          "productName": "SERINA",
          "files": ["dist/**/*", "assets/**/*", "serina-backend*"],
          "directories": {"output": "release-builds"},
          "win": {"target": "nsis"},
          "mac": {"target": "dmg"},
          "linux": {"target": ["AppImage", "deb"]}
     
        }

4. **Package**: `npm run dist` (electron-builder will generate installers for each platform).

### 12.3 Distribution & Auto-Update

* Use `electron-builder`’s auto-update feed:
  
  * Host update files on GitHub Releases or a private server.
  
  * Configure `publish` section in `package_config.json` with provider (`github`) and repo details.

* On app launch, main process checks for updates and downloads/apply silently or prompt user.

* * *

13. Next Steps & Roadmap

------------------------

1. **MVP Implementation** (Target: 2–3 weeks)
   
   * Settings UI + persistence
   
   * Reminder popup + scheduling engine
   
   * Email fetch via Graph or IMAP fallback
   
   * Simple LLM integration (OpenAI only)
   
   * Basic main triage UI (readonly email view + summary)
   
   * Reply-send via Outlook COM or SMTP fallback

2. **Enhancements for v1.1**
   
   * Add multiple LLM providers and fallback logic
   
   * Calendar integration for meeting-awareness (Graph API)
   
   * Slide-in drawers for secondary actions
   
   * Dark mode, i18n support

3. **v1.2–1.5**
   
   * Task creation integration (e.g., Notion, Trello)
   
   * Analytics & usage telemetry (opt-in)
   
   * User profiles & multi-account support
   
   * Improved threading view (group email threads)
   
   * Advanced AI features (fine-tuning, personal prompt templates)

4. **Long-Term Vision (v2.x+)**
   
   * Mobile companion app (React Native)
   
   * Personal custom LLM models on-device
   
   * Collaboration features: shared triage queues for teams
   
   * Integration with other productivity tools (Slack, Teams, Jira)
   
   * Plugin architecture for extending with custom actions or data sources

* * *

14. Appendices

--------------

### 14.1 Glossary

* **LLM**: Large Language Model, used for summarization and reply generation.

* **IPC**: Inter-Process Communication, mechanism to send messages between Electron and Python.

* **Graph API**: Microsoft’s RESTful API for accessing Office 365 services (Mail, Calendar, etc.).

* **MVP**: Minimum Viable Product, minimal feature set to ship a functional product.

* **IMAP**: Internet Message Access Protocol, a standard email retrieval protocol.

### 14.2 References & Resources

* [Electron Documentation](https://www.electronjs.org/docs)

* [React Documentation](https://reactjs.org/docs/getting-started.html)

* [Tailwind CSS Documentation](https://tailwindcss.com/docs)

* [MSAL Python](https://github.com/AzureAD/microsoft-authentication-library-for-python)

* [OpenAI Python SDK](https://github.com/openai/openai-python)

* [Anthropic Python SDK](https://github.com/Anthropic/anthropic-sdk-python)

* [Mistral API Docs](https://docs.mistral.ai/)

* [TogetherAI API Docs](https://docs.together.ai/)

* [OpenRouter API Docs](https://docs.openrouter.ai/)

* [SQLite Documentation](https://www.sqlite.org/docs.html)

* [apscheduler Documentation](https://apscheduler.readthedocs.io/)

* [cryptography Python Package](https://cryptography.io/en/latest/)

* * *

_End of SERINA Comprehensive Project Documentation_
