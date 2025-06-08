# SERINA Email Assistant - MVP Task List

## Project Status Overview
Based on comprehensive frontend and backend analysis, here are the essential tasks to get SERINA MVP ready for launch.

---

## 🔴 HIGH PRIORITY (Launch Blockers)

### Backend Critical Issues

1. **Database Integration Missing**
   - **Issue**: No database schema or ORM setup found
   - **Impact**: Can't persist emails, tasks, or user data between sessions
   - **Action**: Implement SQLite database with basic tables (emails, tasks, config)
   - **Estimate**: 4-6 hours

2. **Windows COM Dependencies**
   - **Issue**: Backend relies on `pywin32` and Outlook desktop app
   - **Impact**: Only works on Windows with Outlook installed and configured
   - **Action**: Ensure robust error handling for missing Outlook, add setup documentation
   - **Estimate**: 2-3 hours

3. **LLM API Error Handling**
   - **Issue**: Basic error handling in LLM service, no retry logic or rate limiting
   - **Impact**: Service fails completely on API errors or rate limits
   - **Action**: Add retry logic, rate limiting, and graceful degradation
   - **Estimate**: 3-4 hours

4. **Configuration Security**
   - **Issue**: API keys stored in plain text JSON files
   - **Impact**: Security vulnerability for sensitive credentials
   - **Action**: Implement basic encryption for stored API keys
   - **Estimate**: 2-3 hours

### Frontend-Backend Integration

5. **Tauri Backend Communication**
   - **Issue**: Frontend uses Tauri `invoke()` but backend is FastAPI REST
   - **Impact**: Complete communication breakdown between frontend and backend
   - **Action**: Create Tauri commands that proxy to FastAPI backend OR switch to direct HTTP calls
   - **Estimate**: 6-8 hours

6. **Email Search Implementation**
   - **Issue**: Search input exists but no backend endpoint or functionality
   - **Impact**: Non-functional user feature
   - **Action**: Implement basic email search by subject/sender/content
   - **Estimate**: 3-4 hours

---

## 🟡 MEDIUM PRIORITY (Should Address Soon)

### Backend Improvements

7. **Background Email Polling**
   - **Issue**: No automated email checking - only manual refresh
   - **Impact**: Users must manually check for new emails
   - **Action**: Implement background task to poll emails at configured intervals
   - **Estimate**: 4-5 hours

8. **Email State Persistence**
   - **Issue**: Email read/unread status only in Outlook, not tracked in app
   - **Impact**: Inconsistent state between app and email client
   - **Action**: Track email states in local database with sync logic
   - **Estimate**: 3-4 hours

9. **Task Management Integration**
   - **Issue**: Creates Outlook tasks but no local task management
   - **Impact**: Tasks created outside of app ecosystem
   - **Action**: Implement local task storage and management
   - **Estimate**: 4-6 hours

10. **Snooze Functionality**
    - **Issue**: Snooze endpoint exists but only marks as read
    - **Impact**: No actual snoozing behavior
    - **Action**: Implement timer-based snooze with re-notification
    - **Estimate**: 5-6 hours

### Frontend Polish

11. **Loading States & Error Handling**
    - **Issue**: Some operations lack proper loading indicators
    - **Impact**: Poor user experience during slow operations
    - **Action**: Add loading states for all async operations
    - **Estimate**: 2-3 hours

12. **Email Content Rendering**
    - **Issue**: Basic text rendering only - no HTML email support
    - **Impact**: Poorly formatted email display
    - **Action**: Add safe HTML rendering for rich email content
    - **Estimate**: 3-4 hours

---

## 🟢 LOW PRIORITY (Nice to Have)

### Enhanced Features

13. **Notification System**
    - **Issue**: Desktop notifications not implemented
    - **Impact**: Users miss new emails when app not in focus
    - **Action**: Implement Tauri-based desktop notifications
    - **Estimate**: 3-4 hours

14. **Keyboard Shortcuts**
    - **Issue**: No keyboard navigation or hotkeys
    - **Impact**: Power users can't use app efficiently
    - **Action**: Add common email hotkeys (reply, delete, next/prev)
    - **Estimate**: 2-3 hours

15. **Email Attachment Support**
    - **Issue**: No attachment viewing or downloading
    - **Impact**: Limited email functionality
    - **Action**: Add attachment list and download capability
    - **Estimate**: 4-5 hours

16. **Multi-Account Support**
    - **Issue**: Only supports default Outlook account
    - **Impact**: Users with multiple email accounts can't use all accounts
    - **Action**: Add account selection and management
    - **Estimate**: 6-8 hours

17. **Advanced AI Features**
    - **Issue**: Basic LLM integration only
    - **Impact**: Missing advanced AI capabilities
    - **Action**: Add email classification, priority detection, auto-categorization
    - **Estimate**: 8-10 hours

### Quality of Life

18. **Configuration UI Improvements**
    - **Issue**: Basic settings interface
    - **Impact**: User experience could be smoother
    - **Action**: Add validation, better help text, connection testing
    - **Estimate**: 2-3 hours

19. **Email List Virtualization**
    - **Issue**: Performance issues with large email lists
    - **Impact**: Slow rendering with many emails
    - **Action**: Implement virtual scrolling for email list
    - **Estimate**: 4-5 hours

20. **Offline Mode**
    - **Issue**: No offline functionality
    - **Impact**: App unusable without internet
    - **Action**: Cache emails and enable offline reading
    - **Estimate**: 6-8 hours

---

## 🎯 MVP Launch Recommendations

### Critical Path (Must Complete):
- Tasks #1, #2, #3, #4, #5 (Backend foundation and integration)
- Task #6 (Search functionality)

### Nice to Have for Launch:
- Tasks #7, #8 (Background polling and state management)
- Task #11 (Loading states)

### Post-Launch:
- All other tasks can be addressed based on user feedback

### Estimated Timeline:
- **High Priority**: 20-30 hours of development
- **Medium Priority**: 25-35 hours additional
- **Minimum MVP**: Focus on high priority tasks only (~1-2 weeks)

### Key Success Metrics:
- Users can successfully connect to Outlook
- Emails load and display correctly
- AI summarization works reliably
- Basic email actions (reply, mark read) function
- Configuration persists between sessions

---

## ⚠️ Critical Dependencies

1. **Windows Environment**: App currently Windows-only due to Outlook COM
2. **Outlook Desktop**: Requires Outlook installed and configured
3. **LLM API Access**: Requires valid OpenAI or OpenRouter API key
4. **Python Environment**: Backend requires Python 3.8+ with specific dependencies

## 🚀 Launch Readiness Checklist

- [ ] Database schema implemented and tested
- [ ] Tauri-FastAPI communication working
- [ ] LLM service with proper error handling
- [ ] Configuration encryption implemented
- [ ] Email search functionality working
- [ ] Basic email operations (read, reply) functional
- [ ] User documentation for setup
- [ ] Error handling for missing dependencies