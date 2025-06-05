import pytest
import asyncio
import tempfile
import os
import json
from typing import Dict, Any, Generator
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from config_service import CONFIG_DIR, SCHEMA_FILE_PATH, CONFIG_FILE_PATH
from reminder_service import Reminder
from email_service import EmailMessage, EmailAddress

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)

@pytest.fixture
async def async_client():
    """Create an async test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def temp_config_dir():
    """Create a temporary directory for config files during tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Patch the config directory to use temp directory
        with patch('config_service.CONFIG_DIR', tmpdir), \
             patch('config_service.SCHEMA_FILE_PATH', os.path.join(tmpdir, 'settings_schema.json')), \
             patch('config_service.CONFIG_FILE_PATH', os.path.join(tmpdir, 'config.json')):
            
            # Create minimal schema file
            schema_path = os.path.join(tmpdir, 'settings_schema.json')
            with open(schema_path, 'w') as f:
                json.dump({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "Test Settings",
                    "type": "object",
                    "properties": {
                        "llm": {
                            "type": "object",
                            "properties": {
                                "provider": {"type": "string"},
                                "api_key": {"type": "string"}
                            }
                        }
                    }
                }, f)
            
            yield tmpdir

@pytest.fixture
def sample_config() -> Dict[str, Any]:
    """Sample configuration for testing."""
    return {
        "llm": {
            "provider": "openai",
            "api_key": "test-api-key",
            "model": "gpt-3.5-turbo"
        },
        "email": {
            "provider": "graph",
            "client_id": "test-client-id",
            "tenant_id": "test-tenant-id"
        },
        "database": {
            "connection_string": ":memory:"
        }
    }

@pytest.fixture
def sample_reminder() -> Reminder:
    """Sample reminder for testing."""
    return Reminder(
        id="test-reminder-1",
        email_id="test-email-1",
        reminder_text="Test reminder",
        reminder_time="2024-12-31T10:00:00",
        is_completed=False,
        created_at="2024-01-01T00:00:00"
    )

@pytest.fixture
def sample_email() -> EmailMessage:
    """Sample email for testing."""
    return EmailMessage(
        id="test-email-1",
        subject="Test Email",
        body_preview="This is a test email",
        body_content="<p>This is a test email content</p>",
        sender=EmailAddress(name="Test Sender", address="test@example.com"),
        recipients=[EmailAddress(name="Test Recipient", address="recipient@example.com")],
        received_date="2024-01-01T12:00:00Z",
        importance="normal",
        is_read=False,
        has_attachments=False,
        categories=[]
    )

@pytest.fixture
def mock_llm_response():
    """Mock LLM response for testing."""
    return {
        "summary": "Test email summary",
        "action_required": True,
        "suggested_reply": "Thank you for your email.",
        "priority": "medium"
    }

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message.content = json.dumps({
        "summary": "Test summary",
        "action_required": True
    })
    mock_client.chat.completions.create.return_value = mock_response
    return mock_client

@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client for testing."""
    mock_client = Mock()
    mock_response = Mock()
    mock_response.content = [Mock()]
    mock_response.content[0].text = json.dumps({
        "summary": "Test summary",
        "action_required": True
    })
    mock_client.messages.create.return_value = mock_response
    return mock_client