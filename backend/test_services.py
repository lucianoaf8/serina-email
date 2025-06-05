# backend/test_services.py
"""
Unit test scaffolding for backend services in SERINA Email Assistant.
Run with: pytest
"""
import pytest
from email_service import MSGraphService, IMAPService, get_email_service
from database_service import DatabaseService

# --- MSGraphService Tests ---
def test_msgraphservice_stub_send_email():
    service = MSGraphService()
    # This is a stub, so just check it logs and returns NotImplementedError
    with pytest.raises(NotImplementedError):
        service.send_email(to="test@example.com", subject="Test", body="Hello")

def test_imapservice_stub_send_email():
    service = IMAPService()
    with pytest.raises(NotImplementedError):
        service.send_email(to="test@example.com", subject="Test", body="Hello")

# --- DatabaseService Tests ---
def test_database_stub_run_alembic_migrations():
    db = DatabaseService(db_path=":memory:")
    # Should log and return False as a stub
    result = db.run_alembic_migrations()
    assert result is False

# --- Factory Function Test ---
def test_get_email_service_returns_imap_for_type(monkeypatch):
    # Patch config to force imap_smtp type
    class DummyConfig:
        EMAIL_ACCOUNT_TYPE = "imap_smtp"
    monkeypatch.setattr("email_service.config", DummyConfig)
    service = get_email_service()
    assert isinstance(service, IMAPService)

# --- More tests can be added as implementation progresses ---
