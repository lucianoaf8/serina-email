import pytest
import json
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

class TestConfigAPI:
    """Integration tests for config API endpoints."""

    def test_get_config(self, client, temp_config_dir, sample_config):
        """Test GET /config endpoint."""
        with patch('main.load_config', return_value=sample_config):
            response = client.get("/config")
            
            assert response.status_code == 200
            data = response.json()
            assert data["llm"]["provider"] == "openai"

    def test_save_config(self, client, temp_config_dir):
        """Test POST /config endpoint."""
        config_data = {
            "llm": {
                "provider": "openai",
                "api_key": "new-key",
                "model": "gpt-4"
            }
        }
        
        with patch('main.save_config') as mock_save:
            response = client.post("/config", json=config_data)
            
            assert response.status_code == 200
            mock_save.assert_called_once_with(config_data)

    def test_save_invalid_config(self, client):
        """Test POST /config with invalid data."""
        invalid_config = {"invalid": "structure"}
        
        response = client.post("/config", json=invalid_config)
        
        # Should return validation error
        assert response.status_code in [400, 422]

class TestRemindersAPI:
    """Integration tests for reminders API endpoints."""

    @patch('main.get_all_reminders')
    def test_get_reminders(self, mock_get_all, client, sample_reminder):
        """Test GET /reminders endpoint."""
        mock_get_all.return_value = [sample_reminder]
        
        response = client.get("/reminders")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "test-reminder-1"

    @patch('main.add_reminder')
    def test_create_reminder(self, mock_add, client):
        """Test POST /reminders endpoint."""
        mock_add.return_value = "new-reminder-id"
        
        reminder_data = {
            "email_id": "email-123",
            "reminder_text": "Test reminder",
            "reminder_time": "2024-12-31T10:00:00"
        }
        
        response = client.post("/reminders", json=reminder_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "new-reminder-id"

    @patch('main.get_reminder')
    def test_get_reminder_by_id(self, mock_get, client, sample_reminder):
        """Test GET /reminders/{reminder_id} endpoint."""
        mock_get.return_value = sample_reminder
        
        response = client.get("/reminders/test-reminder-1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-reminder-1"

    @patch('main.get_reminder')
    def test_get_reminder_not_found(self, mock_get, client):
        """Test GET /reminders/{reminder_id} for non-existent reminder."""
        mock_get.return_value = None
        
        response = client.get("/reminders/nonexistent")
        
        assert response.status_code == 404

    @patch('main.update_reminder')
    def test_update_reminder(self, mock_update, client):
        """Test PUT /reminders/{reminder_id} endpoint."""
        mock_update.return_value = True
        
        update_data = {"reminder_text": "Updated text"}
        
        response = client.put("/reminders/test-id", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Reminder updated successfully"

    @patch('main.update_reminder')
    def test_update_reminder_not_found(self, mock_update, client):
        """Test PUT /reminders/{reminder_id} for non-existent reminder."""
        mock_update.return_value = False
        
        update_data = {"reminder_text": "Updated text"}
        
        response = client.put("/reminders/nonexistent", json=update_data)
        
        assert response.status_code == 404

    @patch('main.delete_reminder')
    def test_delete_reminder(self, mock_delete, client):
        """Test DELETE /reminders/{reminder_id} endpoint."""
        mock_delete.return_value = True
        
        response = client.delete("/reminders/test-id")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Reminder deleted successfully"

    @patch('main.get_reminders_for_email')
    def test_get_reminders_for_email(self, mock_get_for_email, client, sample_reminder):
        """Test GET /reminders/email/{email_id} endpoint."""
        mock_get_for_email.return_value = [sample_reminder]
        
        response = client.get("/reminders/email/email-123")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["email_id"] == "test-email-1"

class TestEmailsAPI:
    """Integration tests for emails API endpoints."""

    @patch('main.get_email_service')
    def test_get_emails(self, mock_get_service, client, sample_email, sample_config):
        """Test GET /emails endpoint."""
        mock_service = Mock()
        mock_service.get_emails.return_value = [sample_email]
        mock_get_service.return_value = mock_service
        
        with patch('main.load_config', return_value=sample_config):
            response = client.get("/emails")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["subject"] == "Test Email"

    @patch('main.get_email_service')
    def test_get_emails_no_config(self, mock_get_service, client):
        """Test GET /emails with missing configuration."""
        with patch('main.load_config', return_value={}):
            response = client.get("/emails")
            
            assert response.status_code == 400

    @patch('main.get_email_service')
    def test_send_email(self, mock_get_service, client, sample_config):
        """Test POST /emails/send endpoint."""
        mock_service = Mock()
        mock_service.send_email.return_value = True
        mock_get_service.return_value = mock_service
        
        email_data = {
            "to": ["recipient@example.com"],
            "subject": "Test Subject",
            "body": "Test Body"
        }
        
        with patch('main.load_config', return_value=sample_config):
            response = client.post("/emails/send", json=email_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Email sent successfully"

class TestLLMAPI:
    """Integration tests for LLM API endpoints."""

    @patch('main.generate_summary')
    def test_email_summary(self, mock_generate, client, sample_email, mock_llm_response):
        """Test POST /llm/email-summary endpoint."""
        mock_generate.return_value = mock_llm_response
        
        response = client.post("/llm/email-summary", json=sample_email.dict())
        
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == "Test email summary"
        assert data["action_required"] is True

    @patch('main.generate_reply_draft')
    def test_reply_draft(self, mock_generate, client, sample_email):
        """Test POST /llm/reply-draft endpoint."""
        mock_generate.return_value = "Generated reply text"
        
        request_data = {
            "email": sample_email.dict(),
            "instructions": "Generate a professional reply"
        }
        
        response = client.post("/llm/reply-draft", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["reply"] == "Generated reply text"

class TestWebSocketAPI:
    """Integration tests for WebSocket endpoints."""

    @patch('main.generate_summary')
    async def test_llm_websocket_summary(self, mock_generate, async_client, sample_email, mock_llm_response):
        """Test WebSocket /ws/llm endpoint for email summary."""
        mock_generate.return_value = mock_llm_response
        
        async with async_client.websocket_connect("/ws/llm") as websocket:
            # Send email summary request
            await websocket.send_json({
                "type": "email_summary",
                "data": sample_email.dict()
            })
            
            # Receive response
            response = await websocket.receive_json()
            
            assert response["type"] == "email_summary"
            assert response["data"]["summary"] == "Test email summary"

    @patch('main.generate_reply_draft')
    async def test_llm_websocket_reply(self, mock_generate, async_client, sample_email):
        """Test WebSocket /ws/llm endpoint for reply draft."""
        mock_generate.return_value = "Generated reply"
        
        async with async_client.websocket_connect("/ws/llm") as websocket:
            # Send reply draft request
            await websocket.send_json({
                "type": "reply_draft",
                "data": {
                    "email": sample_email.dict(),
                    "instructions": "Generate reply"
                }
            })
            
            # Receive response
            response = await websocket.receive_json()
            
            assert response["type"] == "reply_draft"
            assert response["data"]["reply"] == "Generated reply"

    async def test_llm_websocket_invalid_message(self, async_client):
        """Test WebSocket with invalid message format."""
        async with async_client.websocket_connect("/ws/llm") as websocket:
            # Send invalid message
            await websocket.send_json({"invalid": "message"})
            
            # Should receive error response
            response = await websocket.receive_json()
            
            assert response["type"] == "error"
            assert "error" in response["data"]

class TestHealthCheck:
    """Integration tests for health check endpoints."""

    def test_health_check(self, client):
        """Test GET / health check endpoint."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_cors_headers(self, client):
        """Test CORS headers are present."""
        response = client.options("/config")
        
        # CORS headers should be present
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers