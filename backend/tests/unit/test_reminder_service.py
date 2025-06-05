import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, Mock

from reminder_service import (
    Reminder, add_reminder, get_reminder, get_all_reminders,
    update_reminder, delete_reminder, check_due_reminders,
    get_reminders_for_email, mark_reminder_completed
)

class TestReminderService:
    """Unit tests for reminder_service.py"""

    def test_reminder_model_creation(self):
        """Test Reminder model creation."""
        reminder = Reminder(
            id="test-id",
            email_id="email-123",
            reminder_text="Test reminder",
            reminder_time="2024-12-31T10:00:00",
            is_completed=False,
            created_at="2024-01-01T00:00:00"
        )
        
        assert reminder.id == "test-id"
        assert reminder.email_id == "email-123"
        assert reminder.reminder_text == "Test reminder"
        assert not reminder.is_completed

    def test_reminder_model_validation(self):
        """Test Reminder model validation."""
        # Test invalid datetime format
        with pytest.raises(ValueError):
            Reminder(
                id="test-id",
                email_id="email-123",
                reminder_text="Test",
                reminder_time="invalid-date",
                is_completed=False,
                created_at="2024-01-01T00:00:00"
            )

    @patch('reminder_service.get_database')
    def test_add_reminder(self, mock_get_db):
        """Test adding a reminder."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.add_reminder.return_value = "new-reminder-id"
        
        reminder_data = {
            "email_id": "email-123",
            "reminder_text": "Test reminder",
            "reminder_time": "2024-12-31T10:00:00"
        }
        
        result = add_reminder(reminder_data)
        
        assert result == "new-reminder-id"
        mock_db.add_reminder.assert_called_once()

    @patch('reminder_service.get_database')
    def test_get_reminder(self, mock_get_db, sample_reminder):
        """Test getting a reminder by ID."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_reminder.return_value = sample_reminder
        
        result = get_reminder("test-reminder-1")
        
        assert result == sample_reminder
        mock_db.get_reminder.assert_called_once_with("test-reminder-1")

    @patch('reminder_service.get_database')
    def test_get_reminder_not_found(self, mock_get_db):
        """Test getting a non-existent reminder."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_reminder.return_value = None
        
        result = get_reminder("nonexistent")
        
        assert result is None

    @patch('reminder_service.get_database')
    def test_get_all_reminders(self, mock_get_db, sample_reminder):
        """Test getting all reminders."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_all_reminders.return_value = [sample_reminder]
        
        result = get_all_reminders()
        
        assert len(result) == 1
        assert result[0] == sample_reminder

    @patch('reminder_service.get_database')
    def test_update_reminder(self, mock_get_db):
        """Test updating a reminder."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.update_reminder.return_value = True
        
        update_data = {"reminder_text": "Updated text"}
        result = update_reminder("test-id", update_data)
        
        assert result is True
        mock_db.update_reminder.assert_called_once_with("test-id", update_data)

    @patch('reminder_service.get_database')
    def test_delete_reminder(self, mock_get_db):
        """Test deleting a reminder."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.delete_reminder.return_value = True
        
        result = delete_reminder("test-id")
        
        assert result is True
        mock_db.delete_reminder.assert_called_once_with("test-id")

    @patch('reminder_service.get_database')
    def test_get_reminders_for_email(self, mock_get_db, sample_reminder):
        """Test getting reminders for a specific email."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_reminders_for_email.return_value = [sample_reminder]
        
        result = get_reminders_for_email("email-123")
        
        assert len(result) == 1
        assert result[0] == sample_reminder
        mock_db.get_reminders_for_email.assert_called_once_with("email-123")

    @patch('reminder_service.get_database')
    def test_mark_reminder_completed(self, mock_get_db):
        """Test marking a reminder as completed."""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.update_reminder.return_value = True
        
        result = mark_reminder_completed("test-id")
        
        assert result is True
        mock_db.update_reminder.assert_called_once_with("test-id", {"is_completed": True})

    @patch('reminder_service.get_database')
    @patch('reminder_service.datetime')
    def test_check_due_reminders(self, mock_datetime, mock_get_db, sample_reminder):
        """Test checking for due reminders."""
        # Set up mock current time
        current_time = datetime(2024, 12, 31, 11, 0, 0)  # After reminder time
        mock_datetime.now.return_value = current_time
        mock_datetime.fromisoformat = datetime.fromisoformat
        
        # Make sample reminder due
        due_reminder = sample_reminder.copy()
        due_reminder.reminder_time = "2024-12-31T10:00:00"  # 1 hour ago
        due_reminder.is_completed = False
        
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_all_reminders.return_value = [due_reminder]
        
        result = check_due_reminders()
        
        assert len(result) == 1
        assert result[0] == due_reminder

    @patch('reminder_service.get_database')
    @patch('reminder_service.datetime')
    def test_check_due_reminders_none_due(self, mock_datetime, mock_get_db, sample_reminder):
        """Test checking for due reminders when none are due."""
        # Set up mock current time
        current_time = datetime(2024, 12, 31, 9, 0, 0)  # Before reminder time
        mock_datetime.now.return_value = current_time
        mock_datetime.fromisoformat = datetime.fromisoformat
        
        # Make sample reminder not due yet
        future_reminder = sample_reminder.copy()
        future_reminder.reminder_time = "2024-12-31T10:00:00"  # 1 hour in future
        future_reminder.is_completed = False
        
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_all_reminders.return_value = [future_reminder]
        
        result = check_due_reminders()
        
        assert len(result) == 0

    @patch('reminder_service.get_database')
    def test_check_due_reminders_completed_ignored(self, mock_get_db, sample_reminder):
        """Test that completed reminders are ignored when checking due reminders."""
        # Make sample reminder completed
        completed_reminder = sample_reminder.copy()
        completed_reminder.is_completed = True
        
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        mock_db.get_all_reminders.return_value = [completed_reminder]
        
        result = check_due_reminders()
        
        assert len(result) == 0