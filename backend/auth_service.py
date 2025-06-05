# backend/auth_service.py
import logging
import json
import os
import secrets
import base64
from typing import Optional, Dict, Any
from urllib.parse import urlencode, parse_qs
import requests
from datetime import datetime, timedelta
# from config_service import AppSettings
from config_service import load_config

logger = logging.getLogger(__name__)

class AuthServiceError(Exception):
    """Custom exception for authentication service errors."""
    pass

class MSGraphAuthService:
    """Microsoft Graph OAuth 2.0 authentication service for Electron apps."""
    
    def __init__(self, client_id: str, tenant_id: str = "common", redirect_uri: str = "http://localhost:3000/auth/callback"):
        self.client_id = client_id
        self.tenant_id = tenant_id
        self.redirect_uri = redirect_uri
        self.base_auth_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0"
        
        # Required scopes for email and calendar access
        self.scopes = [
            "https://graph.microsoft.com/Mail.Read",
            "https://graph.microsoft.com/Mail.ReadWrite", 
            "https://graph.microsoft.com/Mail.Send",
            "https://graph.microsoft.com/Calendars.Read",
            "https://graph.microsoft.com/User.Read",
            "offline_access"  # For refresh tokens
        ]
        
        logger.info(f"MS Graph Auth Service initialized for client_id: {client_id}")
    
    def generate_auth_url(self, state: Optional[str] = None) -> Dict[str, str]:
        """
        Generate the OAuth authorization URL for user authentication.
        
        Args:
            state (str, optional): State parameter for CSRF protection
            
        Returns:
            Dict containing auth_url, state, and code_verifier for PKCE
        """
        # Generate PKCE parameters for security
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            code_verifier.encode('utf-8')
        ).decode('utf-8').rstrip('=')
        
        # Generate state if not provided
        if not state:
            state = secrets.token_urlsafe(16)
        
        # Build authorization parameters
        auth_params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'response_mode': 'query'
        }
        
        auth_url = f"{self.base_auth_url}/authorize?{urlencode(auth_params)}"
        
        return {
            'auth_url': auth_url,
            'state': state,
            'code_verifier': code_verifier
        }
    
    def exchange_code_for_tokens(
        self, 
        authorization_code: str, 
        code_verifier: str,
        client_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens.
        
        Args:
            authorization_code (str): Authorization code from OAuth callback
            code_verifier (str): PKCE code verifier
            client_secret (str, optional): Client secret (not needed for public clients)
            
        Returns:
            Dict containing access_token, refresh_token, expires_in, etc.
            
        Raises:
            AuthServiceError: If token exchange fails
        """
        try:
            token_url = f"{self.base_auth_url}/token"
            
            # Prepare token request
            token_data = {
                'client_id': self.client_id,
                'grant_type': 'authorization_code',
                'code': authorization_code,
                'redirect_uri': self.redirect_uri,
                'code_verifier': code_verifier
            }
            
            # Add client secret if provided (for confidential clients)
            if client_secret:
                token_data['client_secret'] = client_secret
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            logger.info("Exchanging authorization code for tokens...")
            response = requests.post(token_url, data=token_data, headers=headers)
            response.raise_for_status()
            
            token_response = response.json()
            
            # Add timestamp for token expiry calculation
            token_response['expires_at'] = (
                datetime.now() + timedelta(seconds=token_response.get('expires_in', 3600))
            ).isoformat()
            
            logger.info("Successfully obtained access tokens")
            return token_response
            
        except requests.RequestException as e:
            logger.error(f"HTTP error during token exchange: {e}", exc_info=True)
            raise AuthServiceError(f"Failed to exchange code for tokens: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token exchange: {e}", exc_info=True)
            raise AuthServiceError(f"Token exchange failed: {e}")
    
    def refresh_access_token(
        self, 
        refresh_token: str, 
        client_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refresh an expired access token using refresh token.
        
        Args:
            refresh_token (str): Refresh token
            client_secret (str, optional): Client secret
            
        Returns:
            Dict containing new access_token, expires_in, etc.
            
        Raises:
            AuthServiceError: If token refresh fails
        """
        try:
            token_url = f"{self.base_auth_url}/token"
            
            token_data = {
                'client_id': self.client_id,
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'scope': ' '.join(self.scopes)
            }
            
            if client_secret:
                token_data['client_secret'] = client_secret
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            logger.info("Refreshing access token...")
            response = requests.post(token_url, data=token_data, headers=headers)
            response.raise_for_status()
            
            token_response = response.json()
            
            # Add timestamp for token expiry calculation
            token_response['expires_at'] = (
                datetime.now() + timedelta(seconds=token_response.get('expires_in', 3600))
            ).isoformat()
            
            logger.info("Successfully refreshed access token")
            return token_response
            
        except requests.RequestException as e:
            logger.error(f"HTTP error during token refresh: {e}", exc_info=True)
            raise AuthServiceError(f"Failed to refresh token: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {e}", exc_info=True)
            raise AuthServiceError(f"Token refresh failed: {e}")
    
    def validate_token(self, access_token: str) -> bool:
        """
        Validate an access token by making a test request to Graph API.
        
        Args:
            access_token (str): Access token to validate
            
        Returns:
            bool: True if token is valid, False otherwise
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Make a simple request to validate token
            response = requests.get(
                'https://graph.microsoft.com/v1.0/me',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.debug("Access token validation successful")
                return True
            else:
                logger.warning(f"Access token validation failed: {response.status_code}")
                return False
                
        except requests.RequestException as e:
            logger.warning(f"Error validating access token: {e}")
            return False
    
    def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information using access token.
        
        Args:
            access_token (str): Valid access token
            
        Returns:
            Dict containing user info, or None if failed
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                'https://graph.microsoft.com/v1.0/me',
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            user_info = response.json()
            logger.info(f"Retrieved user info for: {user_info.get('userPrincipalName', 'unknown')}")
            return user_info
            
        except requests.RequestException as e:
            logger.error(f"Failed to get user info: {e}", exc_info=True)
            return None
    
    def is_token_expired(self, token_data: Dict[str, Any]) -> bool:
        """
        Check if a token is expired based on expires_at timestamp.
        
        Args:
            token_data (Dict): Token data containing expires_at
            
        Returns:
            bool: True if token is expired
        """
        try:
            expires_at_str = token_data.get('expires_at')
            if not expires_at_str:
                # If no expiry info, assume expired
                return True
            
            expires_at = datetime.fromisoformat(expires_at_str)
            # Add 5 minute buffer before actual expiry
            buffer_time = expires_at - timedelta(minutes=5)
            
            return datetime.now() >= buffer_time
            
        except Exception as e:
            logger.warning(f"Error checking token expiry: {e}")
            return True  # Assume expired on error

class TokenManager:
    """Manages OAuth tokens with automatic refresh."""
    
    def __init__(self, auth_service: MSGraphAuthService, storage_path: str = "tokens.json"):
        self.auth_service = auth_service
        self.storage_path = storage_path
        self._tokens: Optional[Dict[str, Any]] = None
        
        # Load existing tokens if available
        self._load_tokens()
    
    def _load_tokens(self):
        """Load tokens from storage."""
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'r') as f:
                    self._tokens = json.load(f)
                logger.info("Loaded existing tokens from storage")
            else:
                logger.info("No existing tokens found")
        except Exception as e:
            logger.warning(f"Failed to load tokens: {e}")
            self._tokens = None
    
    def _save_tokens(self):
        """Save tokens to storage."""
        try:
            if self._tokens:
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(self.storage_path) if os.path.dirname(self.storage_path) else '.', exist_ok=True)
                
                with open(self.storage_path, 'w') as f:
                    json.dump(self._tokens, f, indent=2)
                logger.debug("Tokens saved to storage")
        except Exception as e:
            logger.error(f"Failed to save tokens: {e}")
    
    def set_tokens(self, token_data: Dict[str, Any]):
        """Set and save new tokens."""
        self._tokens = token_data
        self._save_tokens()
    
    def get_valid_access_token(self, client_secret: Optional[str] = None) -> Optional[str]:
        """
        Get a valid access token, refreshing if necessary.
        
        Args:
            client_secret (str, optional): Client secret for token refresh
            
        Returns:
            str: Valid access token, or None if unavailable
        """
        if not self._tokens:
            logger.warning("No tokens available")
            return None
        
        access_token = self._tokens.get('access_token')
        
        # Check if token is expired
        if self.auth_service.is_token_expired(self._tokens):
            logger.info("Access token expired, attempting refresh...")
            
            refresh_token = self._tokens.get('refresh_token')
            if not refresh_token:
                logger.warning("No refresh token available")
                return None
            
            try:
                # Refresh the token
                new_tokens = self.auth_service.refresh_access_token(refresh_token, client_secret)
                
                # Update stored tokens (preserve refresh token if not returned)
                if 'refresh_token' not in new_tokens and refresh_token:
                    new_tokens['refresh_token'] = refresh_token
                
                self.set_tokens(new_tokens)
                access_token = new_tokens.get('access_token')
                
                logger.info("Successfully refreshed access token")
                
            except AuthServiceError as e:
                logger.error(f"Failed to refresh token: {e}")
                return None
        
        return access_token
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated with valid tokens."""
        return self.get_valid_access_token() is not None
    
    def logout(self):
        """Clear stored tokens."""
        self._tokens = None
        try:
            if os.path.exists(self.storage_path):
                os.remove(self.storage_path)
            logger.info("User logged out, tokens cleared")
        except Exception as e:
            logger.warning(f"Failed to remove token file: {e}")

def get_auth_service(config: Dict[str, Any]) -> MSGraphAuthService:
    """
    Factory function to create MS Graph auth service from config.
    
    Args:
        config (Dict[str, Any]): Application configuration
        
    Returns:
        MSGraphAuthService: Configured auth service
        
    Raises:
        AuthServiceError: If required config is missing
    """
    email_settings = getattr(config, 'emailSettings', None)
    if not email_settings:
        raise AuthServiceError("Email settings not found in configuration")
    
    ms_graph_settings = getattr(email_settings, 'msGraphSettings', None)
    if not ms_graph_settings:
        raise AuthServiceError("MS Graph settings not found in configuration")
    
    client_id = getattr(ms_graph_settings, 'clientId', None)
    if not client_id:
        raise AuthServiceError("MS Graph client ID not configured")
    
    tenant_id = getattr(ms_graph_settings, 'tenantId', 'common')
    redirect_uri = getattr(ms_graph_settings, 'redirectUri', 'http://localhost:3000/auth/callback')
    
    return MSGraphAuthService(client_id, tenant_id, redirect_uri)

# --- Example Usage ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    logger.info("Testing auth_service.py...")
    
    # This would require actual client credentials and user interaction
    client_id = os.environ.get("GRAPH_CLIENT_ID")
    if not client_id:
        logger.error("GRAPH_CLIENT_ID environment variable not set. Skipping live tests.")
    else:
        try:
            # Test auth service initialization
            auth_service = MSGraphAuthService(client_id)
            
            # Generate auth URL
            auth_data = auth_service.generate_auth_url()
            logger.info(f"Generated auth URL: {auth_data['auth_url'][:100]}...")
            
            # Note: Actual token exchange would require user to visit URL and provide auth code
            logger.info("To complete OAuth flow, user would visit the auth URL and provide authorization code")
            
        except AuthServiceError as e:
            logger.error(f"Auth service test failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during tests: {e}", exc_info=True)
    
    logger.info("auth_service.py tests finished.")