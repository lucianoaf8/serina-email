# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Renderer)
- `cd renderer && npm run dev` - Start Vite development server (port 5173)
- `cd renderer && npm run build` - Build React frontend for production
- `cd renderer && npm run lint` - Lint frontend code (placeholder - not implemented)

### Backend (Python FastAPI)
- `cd backend && source venv/bin/activate && python main.py` - Start FastAPI development server (port 8000)
- `cd backend && source venv/Scripts/activate` - Activate virtual environment (Windows)
- `cd backend && pip install -r requirements.txt` - Install Python dependencies

### Full Application
- `npm run dev` - Start Electron application (loads from localhost:5173 in dev)
- `npm run build` - Build entire application (frontend + backend + Electron)
- `npm run build:renderer` - Build only frontend
- `npm run build:backend` - Run Python build script

## Architecture Overview

SERINA is an Electron-based email assistant with a hybrid architecture:

### Main Process (main.js)
- Electron main process handling window management and IPC
- Loads React frontend from Vite dev server (development) or built files (production)
- Custom window controls (minimize, maximize, close) via IPC

### Renderer Process (React + Vite)
- Frontend built with React, Vite, and Tailwind CSS
- Component structure: App.jsx orchestrates Settings, RemindersPage, and other views
- Uses window.electronAPI for IPC communication with main process

### Backend (Python FastAPI)
- Independent FastAPI server (backend/main.py) on port 8000
- WebSocket endpoint (/ws/llm) for real-time LLM interactions
- REST APIs for configuration (/config) and reminders (/reminders)
- Services: LLM integration, email processing, reminders, scheduling
- SQLite database for local data storage

### Key Service Modules
- `llm_service.py` - LLM provider abstraction (OpenAI, Anthropic, etc.)
- `config_service.py` - Application configuration management with JSON schema validation
- `reminder_service.py` - Reminder CRUD operations and data models
- `scheduler_service.py` - Background task scheduling
- `email_service.py` - Email integration (Microsoft Graph, IMAP/SMTP)
- `calendar_service.py` - Calendar integration

## Development Setup

1. Install Node.js dependencies: `npm install`
2. Setup Python backend:
   ```bash
   cd backend
   python3.12 -m venv venv
   source venv/bin/activate  # or venv/Scripts/activate on Windows
   pip install -r requirements.txt
   ```
3. Run development: Start backend manually, then `npm run dev`

## Important Notes

- Backend runs independently and must be started separately in development
- Frontend communicates with backend via HTTP/WebSocket on localhost:8000
- Configuration stored in JSON with schema validation
- LLM interactions are asynchronous via WebSocket for better UX
- Uses encrypted SQLite for local data storage