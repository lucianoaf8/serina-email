# Developer Onboarding: SERINA Email Assistant

Welcome to the SERINA project! This document will help you get your development environment set up quickly.

---

## 1. Environment Variables

The following environment variables may be required for full functionality:

- `GRAPH_CLIENT_ID` – Microsoft Graph API Client ID
- `GRAPH_TENANT_ID` – Microsoft Graph API Tenant ID
- `GRAPH_CLIENT_SECRET` – (If using confidential client flow)
- `OPENAI_API_KEY` – For OpenAI LLM integration
- `ANTHROPIC_API_KEY` – For Anthropic LLM integration (if used)
- `TOGETHER_API_KEY` – For TogetherAI integration (if used)
- `LLM_PROVIDER` – Selects the LLM provider (e.g., `openai`, `anthropic`, `togetherai`, etc.)

Set these in a `.env` file in the root or backend/config directory, or configure as system environment variables.

## 2. Obtaining API Keys

- **Microsoft Graph:**
  - Register an app at https://portal.azure.com → Azure Active Directory → App registrations.
  - Add required permissions (Mail.Read, Mail.Send, offline_access, etc.).
  - Copy the Application (client) ID and Directory (tenant) ID.
  - Generate a client secret if needed.
- **OpenAI:**
  - Sign up at https://platform.openai.com/ and create an API key.
- **Anthropic:**
  - Sign up at https://www.anthropic.com/ and generate an API key.
- **TogetherAI:**
  - Register at https://www.together.ai/ and obtain an API key.

## 3. Running the Application

See the `README.md` for detailed setup and run instructions for both frontend and backend.

## 4. Running Tests

### Backend (Python)
- Make sure your virtual environment is activated and dependencies are installed.
- Run tests using:
  ```bash
  pytest
  ```

### Frontend (React)
- From the `renderer/` directory:
  ```bash
  npm run test
  ```
  or, if using Vite:
  ```bash
  npm run test:unit
  ```

## 5. Troubleshooting

- Double-check that all required environment variables are set.
- Ensure Node.js, npm, and Python versions match those listed in the README.
- For common errors, check the Issues section or open a new issue if you’re stuck.

---

Happy coding! If you have questions, open an issue or contact the core maintainers.
