# SERINA Email Assistant

**Smart Email Reminders & AI-Powered Task Creation**

SERINA is a Windows desktop app that monitors your Outlook inbox, provides AI-powered email summaries, and creates Microsoft TODO tasks from emails - all running seamlessly in the background.

---

## ✨ Features

- **📧 Smart Email Monitoring** - Automatically checks Outlook for new emails
- **🤖 AI Summaries** - Get instant email summaries using OpenAI or OpenRouter
- **✅ Task Creation** - Create Microsoft TODO tasks from emails with AI-generated descriptions
- **⏰ Smart Reminders** - Desktop notifications with snooze options (15m, 1h, dismiss)
- **🌙 Dark Mode** - Beautiful dark theme for night work
- **⚡ Background Operation** - No Outlook windows, everything happens silently

---

## 🖥️ Screenshots

**Main Email Review Interface**
- Email list with AI summaries
- Quick actions: Reply, Create Task, Mark Read, Snooze

**Reminder Popup**
- Small, non-intrusive notification
- Quick snooze options

**Settings Page**
- LLM provider configuration (OpenAI/OpenRouter)
- Notification preferences
- Dark mode toggle

---

## 🔧 Requirements

### System Requirements
- **Windows 10/11** (required for Outlook COM automation)
- **Microsoft Outlook** desktop app installed and configured
- **Work/Personal email** logged into Outlook
- **Node.js 18+** and **Python 3.9+**

### API Keys Needed
- **OpenAI API Key** (recommended) - [Get one here](https://platform.openai.com/api-keys)
- **OpenRouter API Key** (alternative) - [Get one here](https://openrouter.ai/)

---

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Setup Python backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd ..
```

### 2. Install Frontend Dependencies

```bash
cd renderer
npm install
cd ..
```

### 3. Configure API Keys

1. Start SERINA: `npm run dev`
2. Open Settings (gear icon)
3. Enter your OpenAI or OpenRouter API key
4. Set check interval (default: 15 minutes)
5. Configure quiet hours if desired

### 4. First Run

- SERINA will connect to your logged-in Outlook
- Check for new emails automatically
- Show reminder popup when new emails arrive
- Click "View" to see email summaries and take actions

---

## 🎯 How It Works

### Email Monitoring
1. SERINA checks Outlook every 15-30 minutes (configurable)
2. Finds new/unread emails via COM automation
3. Generates AI summaries for each email
4. Shows desktop reminder if new emails found

### Taking Actions
- **View Email** - See AI summary and original content
- **Reply** - Compose and send replies directly from SERINA
- **Create Task** - Generate TODO task with AI-powered description
- **Mark Read** - Mark email as read in Outlook
- **Snooze** - Remind again in 15m, 1h, or custom time

### Background Operation
- No Outlook windows appear during operation
- All COM automation happens silently
- SERINA runs in system tray when minimized

---

## 📁 Project Structure

```
serina/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── package.json         # Electron app configuration
├── renderer/            # React frontend
│   ├── src/
│   └── package.json
└── backend/             # Python FastAPI server
    ├── main.py          # API server
    ├── email_service.py # Outlook COM integration
    ├── llm_service.py   # OpenAI/OpenRouter
    ├── config_service.py# Settings management
    └── requirements.txt
```

---

## 🔑 Configuration

### LLM Providers

**OpenAI (Recommended)**
- Model: `gpt-3.5-turbo`
- Fast, reliable summaries
- Cost: ~$0.001 per email summary

**OpenRouter (Alternative)**
- Access to multiple models
- Backup when OpenAI is down
- Model: `anthropic/claude-3-haiku`

### Email Settings
- **Check Interval**: 15, 30, or 60 minutes
- **Max Emails**: Limit emails per check (default: 20)
- **Quiet Hours**: No notifications during sleep/focus time

### Notifications
- **Desktop Notifications**: Enable/disable system notifications
- **Popup Position**: Corner placement preference
- **Auto-dismiss**: Popup disappears after 10 seconds

---

## 🛠️ Development

### Start Development Environment

```bash
# Terminal 1: Start Python backend
cd backend
venv\Scripts\activate
python main.py

# Terminal 2: Start Electron app
npm run dev
```

### Build for Production

```bash
# Build everything
npm run build

# Output: dist/SERINA Setup.exe
```

---

## 🐛 Troubleshooting

### Common Issues

**"Could not connect to Outlook"**
- Ensure Outlook desktop app is installed
- Make sure you're logged into your email account
- Try restarting Outlook and SERINA

**"LLM service not configured"**
- Add API key in Settings
- Check internet connection
- Verify API key is valid

**"No new emails found"**
- Check Outlook is receiving emails normally
- Verify email account is active in Outlook
- Increase check interval if needed

### Debug Mode

```bash
# Run with debug logging
NODE_ENV=development npm run dev
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

**SERINA** - *Be notified only when it matters. Reply only when you're ready.*