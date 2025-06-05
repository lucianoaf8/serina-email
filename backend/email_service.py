# backend/email_service.py
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
import requests
from msal import ConfidentialClientApplication, PublicClientApplication

# Import configuration loading
from config_service import load_config # To get email account details, client_id, tenant_id etc.

logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class EmailAddress(BaseModel):
    name: Optional[str] = None
    address: EmailStr

class EmailAttachment(BaseModel):
    id: str
    name: str
    content_type: Optional[str] = None
    size_in_bytes: int
    is_inline: bool = False
    # content_bytes: Optional[bytes] = None # Potentially large, handle carefully

class EmailMessage(BaseModel):
    id: str # Provider's unique ID for the email
    conversation_id: Optional[str] = None
    subject: Optional[str] = None
    body_preview: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None # Plain text version of the body
    sender: Optional[EmailAddress] = None
    from_address: Optional[EmailAddress] = Field(alias="from") # 'from' is a keyword
    to_recipients: List[EmailAddress] = []
    cc_recipients: List[EmailAddress] = []
    bcc_recipients: List[EmailAddress] = []
    received_date_time: datetime
    sent_date_time: datetime
    has_attachments: bool = False
    attachments: Optional[List[EmailAttachment]] = None # Populated if fetched
    is_read: bool = False
    is_draft: bool = False
    importance: str = "normal" # low, normal, high
    web_link: Optional[str] = None # Link to open email in web browser
    raw: Optional[Any] = None # Store the raw provider-specific message object if needed

    class Config:
        populate_by_name = True # Allows using 'from' field name

# --- Microsoft Graph Specifics ---
GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"
# Default scopes needed for reading mail
DEFAULT_SCOPES = ["Mail.ReadWrite", "Mail.Send", "User.Read", "offline_access"]

class MSGraphService:
    """Service class for interacting with Microsoft Graph API for emails."""

    def __init__(self, app_config: dict):
        self.app_config = app_config
        self.email_config = app_config.get('emailAccount', {})
        self.client_id = self.email_config.get('microsoftGraphClientId') # Expected from config
        self.tenant_id = self.email_config.get('microsoftGraphTenantId', 'common') # Expected from config
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.access_token: Optional[str] = None
        self.msal_app = None # Will be PublicClientApplication or ConfidentialClientApplication

        if not self.client_id:
            logger.error("Microsoft Graph Client ID not configured in emailAccount settings.")
            raise ValueError("MS Graph Client ID is missing.")
        
        # For now, assuming PublicClientApplication flow (device code or interactive)
        # Later, could support ConfidentialClientApplication for server-side auth if needed.
        self.msal_app = PublicClientApplication(
            client_id=self.client_id,
            authority=self.authority
        )
        logger.info(f"MSGraphService initialized for client_id: {self.client_id} and tenant: {self.tenant_id}")

    def _get_access_token(self) -> Optional[str]:
        """Retrieves an access token using MSAL. Handles token caching and refresh."""
        if not self.msal_app:
            logger.error("MSAL application not initialized.")
            return None

        accounts = self.msal_app.get_accounts()
        if accounts:
            logger.info(f"Found cached MSAL accounts: {accounts[0]['username']}")
            result = self.msal_app.acquire_token_silent(scopes=DEFAULT_SCOPES, account=accounts[0])
            if result and "access_token" in result:
                self.access_token = result["access_token"]
                logger.info("Access token acquired silently from cache.")
                return self.access_token
            else:
                logger.info("Failed to acquire token silently or token expired. Need interactive login.")
        
        # If no cached token or silent acquisition fails, initiate device flow or interactive login
        # This part is tricky for a backend service. For an Electron app, the renderer
        # would typically handle the interactive part of OAuth and send the token to the backend.
        # For now, this function will just indicate that interactive login is needed.
        logger.warning("No cached MSAL token. Interactive login required. This backend service cannot perform it directly.")
        # In a real scenario, the frontend would call an endpoint to get the auth URL/code
        # and then another endpoint to send back the auth code for token acquisition.
        return None # Placeholder - actual token acquisition flow is more complex

    def _make_graph_api_call(self, method: str, endpoint_suffix: str, params: Optional[Dict] = None, data: Optional[Dict] = None, headers_extra: Optional[Dict] = None) -> Optional[Dict]:
        """Makes a call to the Microsoft Graph API."""
        token = self._get_access_token()
        if not token:
            logger.error("Cannot make Graph API call: No access token.")
            # Could raise an exception here to be handled by the caller
            return None

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        if headers_extra:
            headers.update(headers_extra)

        url = f"{GRAPH_API_ENDPOINT}{endpoint_suffix}"
        try:
            logger.debug(f"Making Graph API {method.upper()} request to: {url} with params: {params}")
            response = requests.request(method, url, headers=headers, params=params, json=data)
            response.raise_for_status() # Raises HTTPError for bad responses (4XX or 5XX)
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error during Graph API call to {url}: {e.response.status_code} - {e.response.text}", exc_info=True)
        except requests.exceptions.RequestException as e:
            logger.error(f"Request exception during Graph API call to {url}: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Unexpected error during Graph API call: {e}", exc_info=True)
        return None

    def fetch_emails(self, top: int = 25, folder_id: Optional[str] = None) -> List[EmailMessage]:
        """Fetches emails from the user's mailbox (default: Inbox)."""
        endpoint = "/me/mailFolders/inbox/messages" if not folder_id else f"/me/mailFolders/{folder_id}/messages"
        # Select specific fields to reduce payload size; expand as needed
        # Note: body and uniqueBody are mutually exclusive with bodyPreview. Request one or the other.
        query_params = {
            "$top": top,
            "$select": (
                "id,conversationId,subject,bodyPreview,sender,from,toRecipients,ccRecipients,bccRecipients,"
                "receivedDateTime,sentDateTime,hasAttachments,isRead,isDraft,importance,webLink"
            ),
            "$orderby": "receivedDateTime desc" # Get newest first
        }
        
        logger.info(f"Fetching up to {top} emails from {endpoint}...")
        response_data = self._make_graph_api_call("GET", endpoint, params=query_params)
        
        if response_data and "value" in response_data:
            emails = []
            for item_data in response_data["value"]:
                try:
                    # Map Graph API response to EmailMessage Pydantic model
                    # Need to handle 'from' vs 'from_address' and other potential discrepancies
                    # For example, Graph 'from' is an object with 'emailAddress' sub-object
                    mapped_data = item_data.copy()
                    if 'from' in mapped_data and isinstance(mapped_data['from'], dict):
                        mapped_data['from_address'] = mapped_data.pop('from')['emailAddress']
                    if 'sender' in mapped_data and isinstance(mapped_data['sender'], dict):
                        mapped_data['sender'] = mapped_data['sender']['emailAddress']
                    
                    # Convert recipient lists
                    for rec_type in ['toRecipients', 'ccRecipients', 'bccRecipients']:
                        if rec_type in mapped_data and isinstance(mapped_data[rec_type], list):
                            mapped_data[rec_type] = [r['emailAddress'] for r in mapped_data[rec_type]]

                    email = EmailMessage(**mapped_data)
                    emails.append(email)
                except Exception as e_parse: # Catch Pydantic validation errors or other parsing issues
                    logger.error(f"Error parsing email item (ID: {item_data.get('id')}): {e_parse}", exc_info=True)
                    logger.debug(f"Problematic email item data: {item_data}")
            logger.info(f"Successfully fetched and parsed {len(emails)} emails.")
            return emails
        else:
            logger.warning(f"Failed to fetch emails or no emails found. Response: {response_data}")
            return []

    # Placeholder for other methods like get_email_details, send_email, etc.
    def send_email(self, to: list, subject: str, body: str, attachments: Optional[list] = None) -> bool:
        """
        Stub for sending email using Microsoft Graph API.
        Not yet implemented.
        """
        logger.info("send_email called (stub): to=%s, subject=%s", to, subject)
        # TODO: Implement actual send via Graph API
        return False

    def get_email_body(self, message_id: str) -> Optional[Dict[str, str]]:
        """Fetches the full body (HTML and Text) of a specific email."""
        endpoint = f"/me/messages/{message_id}"
        query_params = {"$select": "body,uniqueBody"} # Requesting full body (HTML and Text)
        
        logger.info(f"Fetching full body for email ID: {message_id}")
        response_data = self._make_graph_api_call("GET", endpoint, params=query_params)
        
        if response_data:
            # Graph API returns body in 'body' (HTML) and 'uniqueBody' (Text if different)
            # For consistency, we might prefer to explicitly ask for HTML and Text content types.
            # The 'body' field itself has 'contentType' and 'content'.
            return {
                "html": response_data.get("body", {}).get("content"),
                "text": response_data.get("uniqueBody", {}).get("content", response_data.get("bodyPreview")) # Fallback for text
            }
        return None

# --- IMAPService Stub ---
class IMAPService:
    """
    Stub for IMAP/SMTP email service. Not yet implemented.
    """
    def __init__(self, app_config: dict):
        self.app_config = app_config
        logger.info("IMAPService initialized (stub). Not functional.")

    def send_email(self, to: list, subject: str, body: str, attachments: Optional[list] = None) -> bool:
        """
        Stub for sending email via IMAP/SMTP. Not implemented.
        """
        logger.info("IMAPService.send_email called (stub): to=%s, subject=%s", to, subject)
        return False

# --- Global function to get email service based on config ---
def get_email_service(): # -> MSGraphService | OtherEmailService | None:
    """Factory function to get an email service instance based on configuration."""
    app_config = load_config()
    email_settings = app_config.get('emailAccount', {})
    account_type = email_settings.get('type')

    if account_type == 'microsoft_graph':
        try:
            logger.info("Initializing Microsoft Graph email service.")
            return MSGraphService(app_config)
        except ValueError as e:
            logger.error(f"Failed to initialize MSGraphService: {e}")
            return None
    # elif account_type == 'imap_smtp':
    #     logger.warning("IMAP/SMTP email service not yet implemented.")
    #     return None # Placeholder for IMAP/SMTP service
    elif account_type == 'imap_smtp':
        logger.warning("IMAP/SMTP email service stub is returned. Not functional.")
        return IMAPService(app_config)
    else:
        logger.warning(f"Unsupported email account type: {account_type} or not configured.")
        return None

# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG) # Use DEBUG for more verbose output during testing
    logger.info("Testing email_service.py...")

    # This test requires: 
    # 1. config/settings_schema.json to exist and be valid.
    # 2. config/config.json.enc (or config.json) to exist with valid settings, including:
    #    emailAccount.type = "microsoft_graph"
    #    emailAccount.microsoftGraphClientId = "YOUR_ACTUAL_CLIENT_ID"
    #    emailAccount.microsoftGraphTenantId = "YOUR_TENANT_ID" (or 'common', 'organizations')
    # 3. An environment variable SERINA_ENCRYPTION_KEY if config is encrypted.
    # 4. An interactive MSAL login flow to have occurred previously for the specified client ID,
    #    so that a cached token exists. This direct test CANNOT perform interactive login.

    email_service_instance = get_email_service()

    if email_service_instance and isinstance(email_service_instance, MSGraphService):
        logger.info("MSGraphService instance created. Attempting to fetch emails...")
        # This will likely fail if no cached token is available from a previous interactive login.
        # The _get_access_token method needs to be adapted for a real backend flow
        # or the frontend needs to handle the OAuth dance and pass the token.
        try:
            # First, try to get a token to see if auth is working at all
            token = email_service_instance._get_access_token()
            if token:
                logger.info(f"Successfully obtained an access token (first 20 chars): {token[:20]}...")
                fetched_emails = email_service_instance.fetch_emails(top=5)
                if fetched_emails:
                    logger.info(f"Successfully fetched {len(fetched_emails)} emails:")
                    for i, email in enumerate(fetched_emails):
                        logger.info(f"  {i+1}. Subject: {email.subject} (From: {email.from_address.address if email.from_address else 'N/A'}, Received: {email.received_date_time})")
                        # Test fetching full body for the first email
                        if i == 0 and email.id:
                            logger.info(f"    Fetching body for email ID: {email.id}")
                            body_content = email_service_instance.get_email_body(email.id)
                            if body_content:
                                logger.info(f"    HTML Body Preview (first 100 chars): {body_content.get('html', '')[:100]}...")
                                logger.info(f"    Text Body Preview (first 100 chars): {body_content.get('text', '')[:100]}...")
                            else:
                                logger.warning(f"    Could not fetch body for email ID: {email.id}")
                else:
                    logger.warning("No emails fetched or an error occurred during fetch.")
            else:
                logger.error("Failed to obtain access token. Cannot fetch emails. Interactive login might be required.")
        except Exception as e_test:
            logger.error(f"An error occurred during email_service testing: {e_test}", exc_info=True)
    else:
        logger.error("Failed to get a valid email service instance. Check configuration and logs.")

    logger.info("email_service.py tests finished.")
