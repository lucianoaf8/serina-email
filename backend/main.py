"""
SERINA Backend - Simplified FastAPI Server
MVP Version with Outlook COM integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import uvicorn

from email_service import email_service
from llm_service import create_llm_service
from config_service import load_config, save_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SERINA Email Assistant", version="1.0.0")

# Add CORS middleware for Electron renderer communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global LLM service instance
llm_service = None

# Pydantic models for API requests/responses
class EmailResponse(BaseModel):
    id: str
    subject: str
    sender: str
    sender_email: str
    body: str
    received_time: str
    is_unread: bool

class ReplyRequest(BaseModel):
    reply_text: str

class TaskRequest(BaseModel):
    title: str
    description: str

class LLMRequest(BaseModel):
    email_content: str
    instruction: Optional[str] = ""

class ConfigRequest(BaseModel):
    config: dict

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global llm_service
    try:
        # Load configuration
        config = load_config()
        
        # Initialize LLM service if configured
        if config.get("llm", {}).get("api_key"):
            llm_service = create_llm_service(
                provider=config.get("llm", {}).get("provider", "openai"),
                api_key=config["llm"]["api_key"]
            )
            logger.info("LLM service initialized")
        
        logger.info("SERINA backend started successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "SERINA Backend"}

# Email endpoints
@app.get("/emails", response_model=List[EmailResponse])
async def get_emails(limit: int = 20):
    """Get new emails from Outlook."""
    try:
        emails = email_service.get_new_emails(limit=limit)
        return emails
    except Exception as e:
        logger.error(f"Error fetching emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch emails")

@app.get("/emails/{email_id}")
async def get_email(email_id: str):
    """Get specific email by ID."""
    email = email_service.get_email_by_id(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@app.post("/emails/{email_id}/reply")
async def send_reply(email_id: str, request: ReplyRequest):
    """Send reply to an email."""
    success = email_service.send_reply(email_id, request.reply_text)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send reply")
    return {"message": "Reply sent successfully"}

@app.post("/emails/{email_id}/mark-read")
async def mark_email_read(email_id: str):
    """Mark email as read."""
    success = email_service.mark_as_read(email_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to mark email as read")
    return {"message": "Email marked as read"}

@app.post("/emails/{email_id}/create-task")
async def create_task_from_email(email_id: str, request: TaskRequest):
    """Create a TODO task from an email."""
    success = email_service.create_todo_task(
        title=request.title,
        description=request.description,
        email_id=email_id
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create task")
    return {"message": "Task created successfully"}

@app.post("/emails/{email_id}/snooze")
async def snooze_email(email_id: str, minutes: int = 60):
    """Snooze an email for specified minutes."""
    success = email_service.snooze_email(email_id, minutes)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to snooze email")
    return {"message": f"Email snoozed for {minutes} minutes"}

@app.get("/emails/unread-count")
async def get_unread_count():
    """Get count of unread emails."""
    count = email_service.get_unread_count()
    return {"count": count}

# LLM endpoints
@app.post("/llm/summarize")
async def summarize_email(request: LLMRequest):
    """Generate email summary using LLM."""
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not configured")
    
    summary = llm_service.generate_email_summary(request.email_content)
    return {"summary": summary}

@app.post("/llm/generate-task")
async def generate_task(request: LLMRequest):
    """Generate task from email using LLM."""
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not configured")
    
    # Extract subject from email content (simplified)
    subject = "Email Task"
    if request.email_content:
        lines = request.email_content.split('\n')
        for line in lines:
            if line.strip():
                subject = line.strip()[:50] + "..."
                break
    
    task = llm_service.generate_task_description(request.email_content, subject)
    return task

@app.post("/llm/generate-reply")
async def generate_reply(request: LLMRequest):
    """Generate reply draft using LLM."""
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not configured")
    
    reply = llm_service.generate_reply_draft(request.email_content, request.instruction)
    return {"reply": reply}

@app.get("/llm/test")
async def test_llm():
    """Test LLM service connection."""
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not configured")
    
    success = llm_service.test_connection()
    return {"connected": success}

# Configuration endpoints
@app.get("/config")
async def get_config():
    """Get current configuration."""
    config = load_config()
    # Remove sensitive data before sending
    if "llm" in config and "api_key" in config["llm"]:
        config["llm"]["api_key"] = "***" if config["llm"]["api_key"] else ""
    return config

@app.post("/config")
async def update_config(request: ConfigRequest):
    """Update configuration."""
    global llm_service
    
    success = save_config(request.config)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save configuration")
    
    # Reinitialize LLM service if config changed
    if request.config.get("llm", {}).get("api_key"):
        try:
            llm_service = create_llm_service(
                provider=request.config.get("llm", {}).get("provider", "openai"),
                api_key=request.config["llm"]["api_key"]
            )
            logger.info("LLM service reinitialized")
        except Exception as e:
            logger.error(f"Failed to reinitialize LLM service: {e}")
    
    return {"message": "Configuration updated successfully"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )