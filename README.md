# SERINA Email Assistant

## High-Level Overview

SERINA (Smart Email & Reminder Integrated Notification Assistant) is an intelligent desktop application designed to streamline email management and enhance productivity. It leverages Large Language Models (LLMs) to summarize emails, draft replies, manage reminders, and integrate with calendar events, all within a secure, local-first Electron application.

Key features include:
- Secure authentication with Microsoft Graph API (and potentially IMAP/SMTP).
- Local caching of email data in an encrypted SQLite database.
- AI-powered email summarization and reply generation.
- Intelligent reminder system based on email content and user settings.
- Meeting-aware scheduling capabilities.
- Configurable settings for LLM providers, reminder preferences, and more.

## How to Run in Dev Mode

1.  **Prerequisites:**
    *   Node.js (LTS version recommended)
    *   npm (comes with Node.js)
    *   Python (version 3.12 specified in tasks)

2.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd serina-email
    ```

3.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

4.  **Set up Python backend (Navigate to `backend/` directory first):**
    ```bash
    cd backend
    python3.12 -m venv venv
    # Activate virtual environment
    # On Windows (Git Bash or similar):
    source venv/Scripts/activate
    # On macOS/Linux:
    # source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt # (requirements.txt will be created in a later step)
    cd ..
    ```

5.  **Run the application:**
    ```bash
    npm run dev
    ```
    This command will start the Electron application.

6.  **Backend Server:**
    The Python backend (FastAPI) will need to be started separately. Instructions for this will be added as the backend is developed. Typically, it would be something like:
    ```bash
    cd backend
    uvicorn main:app --reload # (Assuming main.py and app instance)
    ```

---

## How to Contribute

We welcome contributions! To get started:
1. Fork the repository and clone it locally.
2. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit with clear messages.
4. Push your branch and open a Pull Request (PR) against the `main` branch.

Please ensure your code follows the coding standards below and includes tests where applicable.

## Folder Structure

```
SERINA/
├── backend/         # Python FastAPI backend
│   ├── services/    # Core backend services (email, llm, scheduler, etc.)
│   ├── main.py      # FastAPI entry point
│   └── ...
├── renderer/        # Electron + React frontend
│   ├── src/
│   │   ├── components/  # React components (Settings, EmailList, etc.)
│   │   └── pages/       # Page-level components
│   └── ...
├── assets/          # Images, icons, static files
├── config/          # Configuration files
├── build_scripts/   # Scripts for building/packaging
├── package.json     # Node/Electron project config
├── main.js          # Electron main process
├── preload.js       # Electron preload script
├── README.md        # Project documentation
└── ...
```

## Coding Standards

- Use clear, descriptive variable and function names.
- Write modular, testable code. Prefer pure functions and stateless components when possible.
- Use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) for JS/React code formatting and linting.
- For Python, follow [PEP8](https://www.python.org/dev/peps/pep-0008/) style guidelines and use type hints.
- Write docstrings/comments for all public functions and modules.
- Add/maintain tests for new features and bugfixes.
- All code should be reviewed via Pull Request before merging to `main`.

---

Further details on configuration (API keys, etc.) will be added as the project progresses.