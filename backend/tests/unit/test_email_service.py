import pytest
from unittest.mock import patch, Mock
from datetime import datetime

from email_service import (
    EmailAddress, EmailAttachment, EmailMessage,
    GraphEmailService, IMAPEmailService, get_email_service
)

class TestEmailModels:
    """Unit tests for email data models."""

    def test_email_address_creation(self):
        """Test EmailAddress model creation."""
        addr = EmailAddress(name="John Doe", address="john@example.com")
        assert addr.name == "John Doe"
        assert addr.address == "john@example.com"

    def test_email_address_validation(self):
        """Test EmailAddress email validation."""
        # Valid email
        addr = EmailAddress(name="Test", address="test@example.com")
        assert addr.address == "test@example.com"
        
        # Invalid email should raise validation error
        with pytest.raises(ValueError):
            EmailAddress(name="Test", address="invalid-email")

    def test_email_attachment_creation(self):
        """Test EmailAttachment model creation."""
        attachment = EmailAttachment(
            id="att1",
            name="document.pdf",
            content_type="application/pdf",
            size=1024,
            is_inline=False
        )
        assert attachment.name == "document.pdf"
        assert attachment.size == 1024
        assert not attachment.is_inline

    def test_email_message_creation(self, sample_email):
        """Test EmailMessage model creation."""
        assert sample_email.subject == "Test Email"
        assert sample_email.sender.address == "test@example.com"
        assert len(sample_email.recipients) == 1
        assert not sample_email.is_read
        assert not sample_email.has_attachments

    def test_email_message_with_attachments(self):
        """Test EmailMessage with attachments."""
        attachment = EmailAttachment(
            id="att1",
            name="file.txt",
            content_type="text/plain",
            size=100,
            is_inline=False
        )
        
        email = EmailMessage(
            id="email1",
            subject="Test",
            body_preview="Preview",
            body_content="Content",
            sender=EmailAddress(name="Sender", address="sender@example.com"),
            recipients=[EmailAddress(name="Recipient", address="recipient@example.com")],
            received_date="2024-01-01T12:00:00Z",
            importance="normal",
            is_read=False,
            has_attachments=True,
            categories=[],
            attachments=[attachment]
        )
        
        assert email.has_attachments
        assert len(email.attachments) == 1
        assert email.attachments[0].name == "file.txt"

class TestGraphEmailService:
    """Unit tests for Microsoft Graph email service."""

    def test_init(self):
        """Test GraphEmailService initialization."""
        service = GraphEmailService(
            client_id="test-client",
            tenant_id="test-tenant",
            access_token="test-token"
        )
        assert service.client_id == "test-client"
        assert service.tenant_id == "test-tenant"
        assert service.access_token == "test-token"

    @patch('email_service.requests.get')
    def test_get_emails_success(self, mock_get):
        """Test successful email retrieval from Graph API."""
        mock_response_data = {
            "value": [
                {
                    "id": "email1",
                    "subject": "Test Email",
                    "bodyPreview": "Preview text",
                    "body": {"content": "<p>Email content</p>"},
                    "sender": {
                        "emailAddress": {
                            "name": "Sender Name",
                            "address": "sender@example.com"
                        }
                    },
                    "toRecipients": [
                        {
                            "emailAddress": {
                                "name": "Recipient",
                                "address": "recipient@example.com"
                            }
                        }
                    ],
                    "receivedDateTime": "2024-01-01T12:00:00Z",
                    "importance": "normal",
                    "isRead": False,
                    "hasAttachments": False,
                    "categories": []
                }
            ]
        }
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_response_data
        mock_get.return_value = mock_response
        
        service = GraphEmailService("client", "tenant", "token")
        emails = service.get_emails()
        
        assert len(emails) == 1
        assert emails[0].subject == "Test Email"
        assert emails[0].sender.address == "sender@example.com"

    @patch('email_service.requests.get')
    def test_get_emails_api_error(self, mock_get):
        """Test handling Graph API errors."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_get.return_value = mock_response
        
        service = GraphEmailService("client", "tenant", "token")
        
        with pytest.raises(Exception):  # Should raise appropriate error
            service.get_emails()

    @patch('email_service.requests.post')
    def test_send_email_success(self, mock_post):
        """Test successful email sending via Graph API."""
        mock_response = Mock()
        mock_response.status_code = 202
        mock_post.return_value = mock_response
        
        service = GraphEmailService("client", "tenant", "token")
        
        result = service.send_email(
            to=["recipient@example.com"],
            subject="Test Subject",
            body="Test Body"
        )
        
        assert result is True
        mock_post.assert_called_once()

    @patch('email_service.requests.post')
    def test_send_email_failure(self, mock_post):
        """Test failed email sending via Graph API."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_post.return_value = mock_response
        
        service = GraphEmailService("client", "tenant", "token")
        
        with pytest.raises(Exception):
            service.send_email(
                to=["recipient@example.com"],
                subject="Test Subject",
                body="Test Body"
            )

class TestIMAPEmailService:
    """Unit tests for IMAP email service."""

    def test_init(self):
        """Test IMAPEmailService initialization."""
        service = IMAPEmailService(
            imap_server="imap.example.com",
            imap_port=993,
            username="user@example.com",
            password="password"
        )
        assert service.imap_server == "imap.example.com"
        assert service.imap_port == 993
        assert service.username == "user@example.com"

    @patch('email_service.imaplib.IMAP4_SSL')
    def test_connect_success(self, mock_imap):
        """Test successful IMAP connection."""
        mock_connection = Mock()
        mock_connection.login.return_value = ('OK', [b'Logged in'])
        mock_imap.return_value = mock_connection
        
        service = IMAPEmailService("imap.example.com", 993, "user", "pass")
        result = service.connect()
        
        assert result is True
        mock_connection.login.assert_called_once_with("user", "pass")

    @patch('email_service.imaplib.IMAP4_SSL')
    def test_connect_failure(self, mock_imap):
        """Test failed IMAP connection."""
        mock_connection = Mock()
        mock_connection.login.side_effect = Exception("Login failed")
        mock_imap.return_value = mock_connection
        
        service = IMAPEmailService("imap.example.com", 993, "user", "pass")
        result = service.connect()
        
        assert result is False

    def test_get_emails_not_implemented(self):
        """Test that get_emails raises NotImplementedError."""
        service = IMAPEmailService("server", 993, "user", "pass")
        
        with pytest.raises(NotImplementedError):
            service.get_emails()

class TestEmailServiceFactory:
    """Unit tests for email service factory function."""

    def test_get_email_service_graph(self, sample_config):
        """Test getting Graph email service."""
        config = sample_config.copy()
        config["email"]["provider"] = "graph"
        
        service = get_email_service(config, access_token="test-token")
        
        assert isinstance(service, GraphEmailService)
        assert service.client_id == "test-client-id"

    def test_get_email_service_imap(self, sample_config):
        """Test getting IMAP email service."""
        config = sample_config.copy()
        config["email"] = {
            "provider": "imap",
            "imap_server": "imap.example.com",
            "imap_port": 993,
            "username": "user@example.com",
            "password": "password"
        }
        
        service = get_email_service(config)
        
        assert isinstance(service, IMAPEmailService)
        assert service.imap_server == "imap.example.com"

    def test_get_email_service_unsupported(self, sample_config):
        """Test getting unsupported email service."""
        config = sample_config.copy()
        config["email"]["provider"] = "unsupported"
        
        with pytest.raises(ValueError, match="Unsupported email provider"):
            get_email_service(config)

    def test_get_email_service_missing_config(self):
        """Test getting email service with missing configuration."""
        config = {}
        
        with pytest.raises(ValueError, match="Email configuration not found"):
            get_email_service(config)