# backend/reminder_service.py
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# --- Pydantic Model for Reminder ---
class Reminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email_id: Optional[str] = None # ID of the email this reminder is associated with
    reminder_time: datetime # When the reminder is due (UTC)
    message: Optional[str] = None # Custom reminder message
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True # False if dismissed or completed
    snooze_until: Optional[datetime] = None # If snoozed, new time for reminder (UTC)
    # Add other relevant fields like recurrence, priority etc. later if needed

# --- In-memory store for reminders ---
# Stores Reminder objects, keyed by their unique ID.
_reminders_store: Dict[str, Reminder] = {}

# --- Reminder Service Functions ---

def add_reminder(
    reminder_time: datetime,
    email_id: Optional[str] = None,
    message: Optional[str] = None
) -> Reminder:
    """Adds a new reminder to the store."""
    if reminder_time.tzinfo is None:
        logger.warning("Reminder time is naive. Assuming UTC.")
        reminder_time = reminder_time.replace(tzinfo=timezone.utc)
    
    new_reminder = Reminder(
        email_id=email_id,
        reminder_time=reminder_time,
        message=message
    )
    _reminders_store[new_reminder.id] = new_reminder
    logger.info(f"Added new reminder ID: {new_reminder.id} for time: {reminder_time.isoformat()}")
    return new_reminder

def get_reminder(reminder_id: str) -> Optional[Reminder]:
    """Retrieves a specific reminder by its ID."""
    return _reminders_store.get(reminder_id)

def get_all_reminders(active_only: bool = False) -> List[Reminder]:
    """Retrieves all reminders, optionally filtering for active ones."""
    if active_only:
        return [r for r in _reminders_store.values() if r.is_active]
    return list(_reminders_store.values())

def get_reminders_for_email(email_id: str, active_only: bool = False) -> List[Reminder]:
    """Retrieves all reminders associated with a specific email ID."""
    reminders = [r for r in _reminders_store.values() if r.email_id == email_id]
    if active_only:
        return [r for r in reminders if r.is_active]
    return reminders

def update_reminder(
    reminder_id: str,
    reminder_time: Optional[datetime] = None,
    message: Optional[str] = None,
    is_active: Optional[bool] = None,
    snooze_until: Optional[datetime] = None # Pass specific time or None to unsnooze
) -> Optional[Reminder]:
    """Updates an existing reminder."""
    reminder = _reminders_store.get(reminder_id)
    if not reminder:
        logger.warning(f"Update failed: Reminder ID {reminder_id} not found.")
        return None

    update_data = {}
    if reminder_time is not None:
        if reminder_time.tzinfo is None:
            logger.warning(f"Update reminder_time is naive for {reminder_id}. Assuming UTC.")
            reminder_time = reminder_time.replace(tzinfo=timezone.utc)
        update_data['reminder_time'] = reminder_time
    if message is not None:
        update_data['message'] = message
    if is_active is not None:
        update_data['is_active'] = is_active
    
    # Snoozing logic: if snooze_until is provided, reminder_time should also be updated to snooze_until
    # and is_active should remain true. If snooze_until is explicitly None, it clears snoozing.
    if snooze_until is not None:
        if snooze_until.tzinfo is None:
            logger.warning(f"Update snooze_until is naive for {reminder_id}. Assuming UTC.")
            snooze_until = snooze_until.replace(tzinfo=timezone.utc)
        update_data['snooze_until'] = snooze_until
        update_data['reminder_time'] = snooze_until # Snoozing effectively changes the reminder_time
        update_data['is_active'] = True # A snoozed reminder is still active, just due later
    elif 'snooze_until' not in reminder.model_fields_set or reminder.snooze_until is not None:
        # This handles explicitly clearing snooze_until by passing snooze_until=None
        # or if snooze_until was not part of the update request but was previously set.
        # However, Pydantic's update mechanism might require explicit None to clear.
        # For safety, if snooze_until is part of the call and is None, we clear it.
        if snooze_until is None and 'snooze_until' in locals(): # Check if snooze_until was explicitly passed as None
             update_data['snooze_until'] = None

    if update_data:
        updated_reminder = reminder.model_copy(update=update_data)
        _reminders_store[reminder_id] = updated_reminder
        logger.info(f"Updated reminder ID: {reminder_id}. Changes: {update_data}")
        return updated_reminder
    
    logger.info(f"No update performed for reminder ID: {reminder_id} as no new data provided.")
    return reminder

def delete_reminder(reminder_id: str) -> bool:
    """Deletes a reminder from the store. Returns True if deleted, False otherwise."""
    if reminder_id in _reminders_store:
        del _reminders_store[reminder_id]
        logger.info(f"Deleted reminder ID: {reminder_id}")
        return True
    logger.warning(f"Delete failed: Reminder ID {reminder_id} not found.")
    return False

def check_due_reminders() -> List[Reminder]:
    """Checks for and returns a list of active reminders that are currently due."""
    now = datetime.now(timezone.utc)
    due_reminders = []
    for reminder in _reminders_store.values():
        if reminder.is_active and reminder.reminder_time <= now:
            due_reminders.append(reminder)
            logger.info(f"Reminder due: ID {reminder.id}, Time: {reminder.reminder_time.isoformat()}, Message: {reminder.message}")
            # Optionally, mark as inactive or handle notification logic here/elsewhere
            # For now, just returns them. The caller (e.g., scheduler) can decide next steps.
    return due_reminders

# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("Testing reminder_service.py...")

    # Add a few reminders
    r1_time = datetime.now(timezone.utc) + timedelta(seconds=10) # Due in 10 seconds
    r1 = add_reminder(email_id="email123", reminder_time=r1_time, message="Follow up on email123")

    r2_time = datetime.now(timezone.utc) + timedelta(minutes=1) # Due in 1 minute
    r2 = add_reminder(reminder_time=r2_time, message="General reminder")
    
    r3_time_past = datetime.now(timezone.utc) - timedelta(minutes=1) # Already due
    r3 = add_reminder(email_id="email456", reminder_time=r3_time_past, message="This was due already!")

    logger.info(f"Total reminders in store: {len(get_all_reminders())}")

    # Test getting a specific reminder
    fetched_r1 = get_reminder(r1.id)
    if fetched_r1:
        logger.info(f"Fetched R1: {fetched_r1.message} due at {fetched_r1.reminder_time.isoformat()}")

    # Test updating a reminder
    update_reminder(r2.id, message="Updated general reminder message", is_active=True)
    fetched_r2_updated = get_reminder(r2.id)
    if fetched_r2_updated:
        logger.info(f"Fetched R2 (updated): {fetched_r2_updated.message}")

    # Test snoozing a reminder
    snooze_time = datetime.now(timezone.utc) + timedelta(minutes=5)
    update_reminder(r1.id, snooze_until=snooze_time)
    fetched_r1_snoozed = get_reminder(r1.id)
    if fetched_r1_snoozed:
        logger.info(f"Fetched R1 (snoozed): due at {fetched_r1_snoozed.reminder_time.isoformat()}, snooze until {fetched_r1_snoozed.snooze_until.isoformat() if fetched_r1_snoozed.snooze_until else 'N/A'}")

    # Test checking for due reminders (wait a bit for r1 to become due if not snoozed first)
    logger.info("Checking for due reminders in a few seconds...")
    # time.sleep(12) # Wait for r1 if it wasn't snoozed
    
    due = check_due_reminders()
    if due:
        logger.info(f"Found {len(due)} due reminders:")
        for item in due:
            logger.info(f"  - ID: {item.id}, Message: {item.message}, Due: {item.reminder_time.isoformat()}")
            # Example: Mark as inactive after processing
            # update_reminder(item.id, is_active=False)
    else:
        logger.info("No reminders currently due.")

    # Test deleting a reminder
    delete_reminder(r2.id)
    logger.info(f"Total reminders after deleting R2: {len(get_all_reminders())}")

    logger.info("reminder_service.py tests finished.")
