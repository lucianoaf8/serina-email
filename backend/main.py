from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from typing import Dict

# Import config service functions
from config_service import load_config, save_config, SCHEMA_FILE_PATH
# Removed _load_schema as it's an internal detail of config_service

# Import LLM service functions and custom error
from llm_service import get_llm_client, generate_summary, generate_reply_draft, LLMServiceError
from openai import OpenAIError # For specific error handling if needed

# Import Scheduler service functions
from scheduler_service import start_scheduler_tasks, stop_scheduler_tasks

# Import Reminder service functions and model
from reminder_service import (
    Reminder as ReminderModel, # Alias to avoid conflict if FastAPI uses Reminder internally
    add_reminder,
    get_reminder,
    get_all_reminders,
    get_reminders_for_email,
    update_reminder,
    delete_reminder
)

# Import Email and Database services
from email_service import EmailMessage, get_email_service
from database_service import get_database, DatabaseServiceError

# Import Auth service
from auth_service import get_auth_service, AuthServiceError, TokenManager

from pydantic import BaseModel # For request body models
from datetime import datetime # For type hinting in request models
from typing import List, Optional # For type hinting

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure config directory and schema exist for ConfigService to init correctly on first run
# This is a bit of a workaround for dev; ideally, setup scripts ensure this.
import os
from config_service import CONFIG_DIR
if not os.path.exists(CONFIG_DIR):
    os.makedirs(CONFIG_DIR)
if not os.path.exists(SCHEMA_FILE_PATH):
    logger.warning(f"Schema file {SCHEMA_FILE_PATH} not found. Attempting to create a placeholder for API to run.")
    # Create a minimal placeholder if it's missing, so the app can start.
    # The actual schema should be created by Task 9.
    # This is primarily to allow the API to load without crashing if schema is missing during dev.
    try:
        with open(SCHEMA_FILE_PATH, 'w') as f:
            json.dump({
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "Placeholder Settings", "type": "object",
                "properties": {},
            }, f, indent=2)
        logger.info(f"Created placeholder schema at {SCHEMA_FILE_PATH}.")
    except Exception as e_schema:
        logger.error(f"Could not create placeholder schema: {e_schema}")
import json # for placeholder schema creation and WebSocket message parsing

app = FastAPI(
    title="SERINA Backend",
    version="0.1.0",
    description="Backend services for SERINA Electron application, including LLM interaction via WebSockets.",
    lifespan=None # Will be replaced by startup/shutdown events if needed, or a context manager for lifespan
)

# --- Application Lifecycle Events (Startup/Shutdown) ---
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup: Initializing services...")
    # Start background tasks like the email fetch scheduler
    try:
        start_scheduler_tasks()
        logger.info("Scheduler tasks initiated.")
    except Exception as e_scheduler_start:
        logger.error(f"Failed to start scheduler tasks on application startup: {e_scheduler_start}", exc_info=True)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown: Cleaning up services...")
    # Stop background tasks
    try:
        stop_scheduler_tasks()
        logger.info("Scheduler tasks stopped.")
    except Exception as e_scheduler_stop:
        logger.error(f"Failed to stop scheduler tasks gracefully on application shutdown: {e_scheduler_stop}", exc_info=True)


# CORS (Cross-Origin Resource Sharing) middleware
# Allow all origins for now, tighten this in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Or specify origins like "http://localhost:5173" for Vite dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
async def read_root():
    """Root endpoint to check if the backend is online."""
    logger.info("Root endpoint accessed.")
    return {"message": "SERINA Backend Online"}


@app.get("/config", response_model=Dict)
async def get_config_endpoint():
    """Endpoint to retrieve the current application configuration."""
    logger.info("GET /config endpoint called.")
    config_data = load_config()
    if not config_data:
        # This case should ideally be handled by load_config returning defaults
        logger.warning("load_config() returned empty or None, serving empty dict.")
        return {}
    return config_data


@app.post("/config")
async def save_config_endpoint(settings: Dict = Body(...)):
    """Endpoint to save the application configuration."""
    logger.info(f"POST /config endpoint called with data: {settings}")
    # The `settings: Dict` will be automatically parsed from the JSON body.
    # The `config_service.save_config` function already includes validation.
    if save_config(settings):
        logger.info("Configuration saved successfully via POST /config.")
        return {"message": "Configuration saved successfully."}
    else:
        # save_config logs errors internally. We might want to provide a more specific error based on its return.
        # For now, a generic 500 for save failure is okay, but could be refined.
        logger.error("Failed to save configuration via POST /config.")
        raise HTTPException(status_code=500, detail="Failed to save configuration. Check backend logs for details.")


# WebSocket Manager (simple in-memory for now)
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connection established: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket connection closed: {websocket.client}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/llm")
async def websocket_llm_endpoint(websocket: WebSocket):
    """WebSocket endpoint for LLM interactions."""
    await manager.connect(websocket)
    
    # Load configuration once when client connects, or consider reloading if config can change live
    # For now, simple load on connect. If config can be updated live via /config POST,
    # this might need to be reloaded per request or use a shared, updatable config state.
    app_config = load_config()
    llm_provider = app_config.get('llmProvider', 'OpenAI') # Default to OpenAI if not set
    api_key = app_config.get('apiKey')
    base_url = app_config.get('apiBaseUrl')
    default_model = app_config.get('selectedModel', 'gpt-3.5-turbo') # Default model from config

    llm_client = None
    if api_key: # Only try to initialize client if API key is present
        try:
            llm_client = get_llm_client(provider_name=llm_provider, api_key=api_key, base_url=base_url)
            logger.info(f"LLM client ({llm_provider}) initialized for WebSocket session.")
        except LLMServiceError as e:
            logger.error(f"Failed to initialize LLM client for WebSocket: {e}")
            # Send error to client and close connection or keep open but non-functional?
            # For now, send error and keep connection open, subsequent requests will fail if client not init.
            await manager.send_personal_message(json.dumps({"type": "error", "message": f"LLM Client Error: {str(e)}"}), websocket)
        except Exception as e_client_init: # Catch any other unexpected error during client init
            logger.error(f"Unexpected error initializing LLM client for WebSocket: {e_client_init}", exc_info=True)
            await manager.send_personal_message(json.dumps({"type": "error", "message": f"Unexpected LLM Client Init Error: {str(e_client_init)}"}), websocket)
    else:
        logger.warning("API key not found in configuration. LLM functionalities will be unavailable.")
        await manager.send_personal_message(json.dumps({"type": "status", "message": "API key not configured. LLM features disabled."}), websocket)

    try:
        while True:
            raw_data = await websocket.receive_text()
            logger.info(f"Received LLM request via WebSocket: {raw_data}")
            
            if not llm_client:
                await manager.send_personal_message(json.dumps({"type": "error", "message": "LLM client not available. Check API key and backend configuration."}), websocket)
                continue # Skip processing if client isn't initialized

            try:
                message_data = json.loads(raw_data)
                action = message_data.get('action')
                payload = message_data.get('payload', {})
                request_id = message_data.get('requestId') # Optional, for client to track responses

                response_payload = {"type": "response", "requestId": request_id, "success": False, "data": None, "error": None}

                if action == 'summarize':
                    text_to_summarize = payload.get('text')
                    model_override = payload.get('model', default_model)
                    if not text_to_summarize:
                        response_payload["error"] = "'text' field is required for summarize action."
                    else:
                        try:
                            summary = await generate_summary(text_to_summarize, llm_client, model_name=model_override)
                            response_payload["success"] = True
                            response_payload["data"] = {"summary": summary}
                        except LLMServiceError as e:
                            logger.error(f"LLMServiceError during summarize: {e}", exc_info=True)
                            response_payload["error"] = str(e)
                        except Exception as e_sum:
                            logger.error(f"Unexpected error during summarize: {e_sum}", exc_info=True)
                            response_payload["error"] = f"Unexpected error: {str(e_sum)}"
                
                elif action == 'draft_reply':
                    email_context = payload.get('context')
                    instructions = payload.get('instructions')
                    model_override = payload.get('model', default_model)
                    if not email_context or not instructions:
                        response_payload["error"] = "'context' and 'instructions' fields are required for draft_reply action."
                    else:
                        try:
                            draft = await generate_reply_draft(email_context, instructions, llm_client, model_name=model_override)
                            response_payload["success"] = True
                            response_payload["data"] = {"draft": draft}
                        except LLMServiceError as e:
                            logger.error(f"LLMServiceError during draft_reply: {e}", exc_info=True)
                            response_payload["error"] = str(e)
                        except Exception as e_draft:
                            logger.error(f"Unexpected error during draft_reply: {e_draft}", exc_info=True)
                            response_payload["error"] = f"Unexpected error: {str(e_draft)}"
                else:
                    response_payload["error"] = f"Unknown action: {action}"
                
                await manager.send_personal_message(json.dumps(response_payload), websocket)

            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from WebSocket message: {raw_data}")
                await manager.send_personal_message(json.dumps({"type": "error", "message": "Invalid JSON format."}), websocket)
            except Exception as e_inner_loop: # Catch errors within the message processing loop
                logger.error(f"Error processing WebSocket message: {e_inner_loop}", exc_info=True)
                await manager.send_personal_message(json.dumps({"type": "error", "message": f"Error processing request: {str(e_inner_loop)}"}), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client {websocket.client} disconnected from LLM WebSocket.")
    except Exception as e_outer_loop: # Catch errors in the main WebSocket connection loop (e.g., initial setup)
        logger.error(f"Error in LLM WebSocket connection handler: {e_outer_loop}", exc_info=True)
        # Try to send a final error message if possible, then ensure disconnect
        try:
            await manager.send_personal_message(json.dumps({"type": "error", "message": f"WebSocket Error: {str(e_outer_loop)}"}), websocket)
        except Exception as e_send_final_error:
            logger.error(f"Could not send final error message on WebSocket: {e_send_final_error}")
        finally:
            manager.disconnect(websocket) # Ensure disconnect on any major error


# --- Reminder API Endpoints ---
class ReminderCreateRequest(BaseModel):
    reminder_time: datetime
    email_id: Optional[str] = None
    message: Optional[str] = None

class ReminderUpdateRequest(BaseModel):
    reminder_time: Optional[datetime] = None
    message: Optional[str] = None
    is_active: Optional[bool] = None
    snooze_until: Optional[datetime] = None

@app.post("/reminders", response_model=ReminderModel, status_code=201)
async def create_new_reminder(reminder_data: ReminderCreateRequest):
    """Create a new reminder."""
    try:
        new_reminder = add_reminder(
            reminder_time=reminder_data.reminder_time,
            email_id=reminder_data.email_id,
            message=reminder_data.message
        )
        return new_reminder
    except Exception as e:
        logger.error(f"Error creating reminder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create reminder: {str(e)}")

@app.get("/reminders", response_model=List[ReminderModel])
async def list_all_reminders(active_only: bool = False):
    """List all reminders, optionally filtering for active ones."""
    return get_all_reminders(active_only=active_only)

@app.get("/reminders/{reminder_id}", response_model=ReminderModel)
async def get_specific_reminder(reminder_id: str):
    """Get a specific reminder by its ID."""
    reminder = get_reminder(reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder

@app.put("/reminders/{reminder_id}", response_model=ReminderModel)
async def update_existing_reminder(reminder_id: str, reminder_data: ReminderUpdateRequest):
    """Update an existing reminder."""
    updated_reminder = update_reminder(
        reminder_id=reminder_id,
        reminder_time=reminder_data.reminder_time,
        message=reminder_data.message,
        is_active=reminder_data.is_active,
        snooze_until=reminder_data.snooze_until
    )
    if not updated_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found or update failed")
    return updated_reminder

@app.delete("/reminders/{reminder_id}", status_code=204)
async def delete_specific_reminder(reminder_id: str):
    """Delete a specific reminder by its ID."""
    if not delete_reminder(reminder_id):
        raise HTTPException(status_code=404, detail="Reminder not found")
    return # No content response for successful deletion

@app.get("/emails/{email_id}/reminders", response_model=List[ReminderModel])
async def list_reminders_for_email(email_id: str, active_only: bool = False):
    """List all reminders associated with a specific email ID."""
    # This assumes email_id is a string that can be directly used.
    # If email_id needs validation or if emails are fetched first, this might change.
    return get_reminders_for_email(email_id=email_id, active_only=active_only)

# --- Calendar API Endpoints (Stub) ---
from fastapi import APIRouter

@app.get("/calendar/events", tags=["calendar"])
def get_calendar_events():
    """
    Stub endpoint for listing upcoming calendar events.
    """
    return {"events": [], "message": "Calendar event listing not yet implemented."}

# --- Email API Endpoints ---

@app.get("/emails", response_model=List[EmailMessage])
async def list_emails(
    limit: int = 50, 
    offset: int = 0, 
    folder: Optional[str] = None,
    unread_only: bool = False
):
    """List emails with pagination and filtering."""
    try:
        db = get_database()
        emails = db.get_emails(limit=limit, offset=offset, folder=folder, unread_only=unread_only)
        return emails
    except DatabaseServiceError as e:
        logger.error(f"Database error listing emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve emails")
    except Exception as e:
        logger.error(f"Unexpected error listing emails: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/emails/{email_id}", response_model=EmailMessage)
async def get_email_detail(email_id: str):
    """Get detailed information about a specific email."""
    try:
        db = get_database()
        email = db.get_email(email_id)
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        return email
    except DatabaseServiceError as e:
        logger.error(f"Database error getting email {email_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve email")
    except Exception as e:
        logger.error(f"Unexpected error getting email {email_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/emails/search", response_model=List[EmailMessage])
async def search_emails(q: str, limit: int = 50):
    """Search emails by subject, sender, or content."""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    try:
        db = get_database()
        emails = db.search_emails(q.strip(), limit=limit)
        return emails
    except DatabaseServiceError as e:
        logger.error(f"Database error searching emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to search emails")
    except Exception as e:
        logger.error(f"Unexpected error searching emails: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

class EmailStatusUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_flagged: Optional[bool] = None
    is_important: Optional[bool] = None

@app.patch("/emails/{email_id}/status")
async def update_email_status(email_id: str, status_update: EmailStatusUpdate):
    """Update email status flags (read, flagged, important)."""
    try:
        db = get_database()
        
        # Check if email exists first
        email = db.get_email(email_id)
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        success = db.update_email_status(
            email_id,
            is_read=status_update.is_read,
            is_flagged=status_update.is_flagged,
            is_important=status_update.is_important
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update email status")
        
        return {"message": "Email status updated successfully"}
        
    except DatabaseServiceError as e:
        logger.error(f"Database error updating email status {email_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update email status")
    except Exception as e:
        logger.error(f"Unexpected error updating email status {email_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

class EmailActionRequest(BaseModel):
    action: str  # "reply", "forward", "archive", "delete"
    content: Optional[str] = None  # For reply/forward content
    recipient: Optional[str] = None  # For forward recipient

@app.post("/emails/{email_id}/action")
async def perform_email_action(email_id: str, action_request: EmailActionRequest):
    """Perform actions on an email (reply, forward, archive, delete)."""
    try:
        db = get_database()
        
        # Check if email exists first
        email = db.get_email(email_id)
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        action = action_request.action.lower()
        
        if action == "delete":
            success = db.delete_email(email_id)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to delete email")
            return {"message": "Email deleted successfully"}
        
        elif action == "archive":
            # For now, just mark as read - actual archive would need email service integration
            success = db.update_email_status(email_id, is_read=True)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to archive email")
            return {"message": "Email archived successfully"}
        
        elif action in ["reply", "forward"]:
            # These would need integration with email service to actually send
            # For now, return a stub response
            app_config = load_config()
            logger.info(f"Email {action} action requested for {email_id}")
            return {
                "message": f"Email {action} action queued successfully",
                "note": f"Actual {action} functionality requires email service integration"
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported action: {action}")
            
    except DatabaseServiceError as e:
        logger.error(f"Database error performing email action {email_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform email action")
    except Exception as e:
        logger.error(f"Unexpected error performing email action {email_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/emails/stats")
async def get_email_stats():
    """Get email statistics."""
    try:
        db = get_database()
        stats = db.get_stats()
        return stats
    except DatabaseServiceError as e:
        logger.error(f"Database error getting email stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve email statistics")
    except Exception as e:
        logger.error(f"Unexpected error getting email stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# --- OAuth/Authentication API Endpoints ---

@app.get("/auth/login")
async def initiate_oauth_login():
    """Initiate OAuth login flow for Microsoft Graph."""
    try:
        config = load_config()
        auth_service = get_auth_service(config)
        
        auth_data = auth_service.generate_auth_url()
        
        # Store state and code_verifier for later verification
        # In production, this should be stored securely (Redis, database, etc.)
        # For now, we'll return them to the client to handle
        return {
            "auth_url": auth_data["auth_url"],
            "state": auth_data["state"],
            "code_verifier": auth_data["code_verifier"],
            "message": "Visit the auth_url to authorize the application"
        }
        
    except AuthServiceError as e:
        logger.error(f"Auth service error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during OAuth initiation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to initiate OAuth flow")

class OAuthCallbackRequest(BaseModel):
    authorization_code: str
    state: str
    code_verifier: str

@app.post("/auth/callback")
async def handle_oauth_callback(callback_data: OAuthCallbackRequest):
    """Handle OAuth callback and exchange code for tokens."""
    try:
        config = load_config()
        auth_service = get_auth_service(config)
        
        # Exchange authorization code for tokens
        tokens = auth_service.exchange_code_for_tokens(
            callback_data.authorization_code,
            callback_data.code_verifier
        )
        
        # Initialize token manager and save tokens
        token_manager = TokenManager(auth_service)
        token_manager.set_tokens(tokens)
        
        # Get user info to verify authentication
        access_token = tokens.get("access_token")
        user_info = auth_service.get_user_info(access_token)
        
        if user_info:
            logger.info(f"User authenticated: {user_info.get('userPrincipalName', 'unknown')}")
            return {
                "message": "Authentication successful",
                "user": {
                    "name": user_info.get("displayName"),
                    "email": user_info.get("userPrincipalName"),
                    "id": user_info.get("id")
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to retrieve user information")
        
    except AuthServiceError as e:
        logger.error(f"Auth service error during callback: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during OAuth callback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication failed")

@app.get("/auth/status")
async def get_auth_status():
    """Check if user is currently authenticated."""
    try:
        config = load_config()
        auth_service = get_auth_service(config)
        token_manager = TokenManager(auth_service)
        
        if token_manager.is_authenticated():
            # Get current user info
            access_token = token_manager.get_valid_access_token()
            user_info = auth_service.get_user_info(access_token)
            
            return {
                "authenticated": True,
                "user": {
                    "name": user_info.get("displayName", "Unknown") if user_info else "Unknown",
                    "email": user_info.get("userPrincipalName", "Unknown") if user_info else "Unknown",
                    "id": user_info.get("id", "Unknown") if user_info else "Unknown"
                }
            }
        else:
            return {"authenticated": False}
            
    except AuthServiceError as e:
        logger.error(f"Auth service error checking status: {e}")
        return {"authenticated": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error checking auth status: {e}", exc_info=True)
        return {"authenticated": False, "error": "Failed to check authentication status"}

@app.post("/auth/logout")
async def logout():
    """Logout user and clear stored tokens."""
    try:
        config = load_config()
        auth_service = get_auth_service(config)
        token_manager = TokenManager(auth_service)
        
        token_manager.logout()
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Error during logout: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Logout failed")

@app.post("/auth/refresh")
async def refresh_token():
    """Manually refresh the access token."""
    try:
        config = load_config()
        auth_service = get_auth_service(config)
        token_manager = TokenManager(auth_service)
        
        access_token = token_manager.get_valid_access_token()
        
        if access_token:
            return {"message": "Token refreshed successfully"}
        else:
            raise HTTPException(status_code=401, detail="No valid refresh token available")
            
    except AuthServiceError as e:
        logger.error(f"Auth service error during token refresh: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Token refresh failed")

# --- Main execution for development ---
if __name__ == "__main__":
    # This is for running the backend directly for development/testing
    # In production, a proper ASGI server like Uvicorn with Gunicorn workers would be used.
    logger.info("Starting SERINA Backend FastAPI server with Uvicorn...")
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True, 
        log_level="info"
    )
