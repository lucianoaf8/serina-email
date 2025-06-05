# backend/scheduler_service.py
import logging
import time
from typing import List, Dict, Set
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from email_service import get_email_service, EmailMessage
from config_service import load_config
from reminder_service import check_due_reminders, update_reminder as update_reminder_status, Reminder

logger = logging.getLogger(__name__)

# --- In-memory store for emails ---
# This is a simple in-memory store. For a production app, consider a persistent database.
# Stores EmailMessage objects, keyed by their unique ID to avoid duplicates.
_fetched_emails_store: Dict[str, EmailMessage] = {}
_processed_email_ids: Set[str] = set() # To keep track of IDs already processed/seen

# --- Scheduler Instance ---
scheduler = BackgroundScheduler(daemon=True)
scheduler.add_jobstore('memory') # Default job store

# --- Job Function ---
def _periodic_email_fetch_job():
    """Job function to be executed by the scheduler to fetch emails and check reminders."""
    logger.info("Scheduler: Running periodic tasks (email fetch & reminder check)...")
    
    # --- Part 1: Fetch Emails ---
    email_service = get_email_service()
    if not email_service:
        logger.warning("Scheduler: Email service not available. Skipping email fetch part.")
    else:
        try:
            config = load_config()
            fetch_limit = config.get('scheduler', {}).get('fetchLimit', 25)
            
            logger.info(f"Scheduler: Attempting to fetch up to {fetch_limit} emails.")
            newly_fetched_emails: List[EmailMessage] = email_service.fetch_emails(top=fetch_limit)
            
            if newly_fetched_emails:
                added_count = 0
                for email in newly_fetched_emails:
                    if email.id not in _processed_email_ids:
                        _fetched_emails_store[email.id] = email
                        _processed_email_ids.add(email.id)
                        added_count += 1
                        logger.debug(f"Scheduler: Added new email - ID: {email.id}, Subject: {email.subject}")
                    else:
                        logger.debug(f"Scheduler: Email ID {email.id} already processed. Skipping add.")
                if added_count > 0:
                    logger.info(f"Scheduler: Successfully fetched and added {added_count} new emails.")
                else:
                    logger.info("Scheduler: No new, unprocessed emails found in this fetch.")
            else:
                logger.info("Scheduler: No emails fetched or email service returned empty.")
            logger.info(f"Scheduler: Total unique emails in store: {len(_fetched_emails_store)}")
        except Exception as e_fetch:
            logger.error(f"Scheduler: Error during periodic email fetch: {e_fetch}", exc_info=True)

    # --- Part 2: Check for Due Reminders ---
    logger.info("Scheduler: Checking for due reminders...")
    try:
        due_reminders: List[Reminder] = check_due_reminders()
        if due_reminders:
            logger.info(f"Scheduler: Found {len(due_reminders)} due reminders.")
            for reminder in due_reminders:
                logger.info(f"Scheduler: Processing due reminder - ID: {reminder.id}, Message: {reminder.message}")
                # TODO: Implement actual notification mechanism (e.g., WebSocket to frontend)
                # For now, mark as inactive to prevent re-triggering immediately.
                update_reminder_status(reminder.id, is_active=False)
                logger.info(f"Scheduler: Marked reminder ID {reminder.id} as inactive after processing.")
        else:
            logger.info("Scheduler: No reminders currently due.")
    except Exception as e_reminder:
        logger.error(f"Scheduler: Error during reminder check: {e_reminder}", exc_info=True)
    
    logger.info("Scheduler: Periodic tasks finished.")

# --- Control Functions ---
_EMAIL_FETCH_JOB_ID = "email_fetch_job"

def start_scheduler_tasks():
    """Starts the scheduler and adds the periodic email fetch job."""
    if scheduler.running:
        logger.info("Scheduler is already running.")
        # Ensure job is there if scheduler is running but job might have been removed
        if not scheduler.get_job(_EMAIL_FETCH_JOB_ID):
            logger.info("Scheduler running but email fetch job not found. Adding job.")
        else:
            return # Already running and job exists
    
    config = load_config()
    # Default to 15 minutes if not specified in config.json under scheduler.intervalMinutes
    interval_minutes = config.get('scheduler', {}).get('intervalMinutes', 15)
    
    try:
        if not scheduler.get_job(_EMAIL_FETCH_JOB_ID):
            scheduler.add_job(
                _periodic_email_fetch_job, 
                trigger=IntervalTrigger(minutes=interval_minutes), 
                id=_EMAIL_FETCH_JOB_ID,
                name="Periodic Email Fetch",
                replace_existing=True
            )
            logger.info(f"Scheduler: Added periodic email fetch job with interval: {interval_minutes} minutes.")
        else:
            # If job exists, maybe update its interval if config changed? For now, it's set on add.
            # To update, remove and re-add, or use scheduler.reschedule_job()
            logger.info(f"Scheduler: Email fetch job already exists. Interval: {interval_minutes} minutes.")

        if not scheduler.running:
            scheduler.start()
            logger.info("Scheduler started.")
            
    except Exception as e:
        logger.error(f"Scheduler: Failed to start scheduler or add job: {e}", exc_info=True)

def stop_scheduler_tasks():
    """Stops the scheduler if it is running."""
    if scheduler.running:
        try:
            # scheduler.remove_job(_EMAIL_FETCH_JOB_ID) # Optionally remove job before shutdown
            scheduler.shutdown(wait=False) # wait=False to not block, True to wait for jobs to complete
            logger.info("Scheduler stopped.")
        except Exception as e:
            logger.error(f"Scheduler: Error stopping scheduler: {e}", exc_info=True)
    else:
        logger.info("Scheduler is not running.")

# --- Accessor for Fetched Emails (optional) ---
def get_all_fetched_emails() -> List[EmailMessage]:
    """Returns a list of all unique emails fetched so far."""
    return list(_fetched_emails_store.values())

def get_email_by_id(email_id: str) -> EmailMessage | None:
    """Returns a specific email by its ID if found."""
    return _fetched_emails_store.get(email_id)

# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("Testing scheduler_service.py...")

    # This test requires email_service to be functional and configured.
    # It will attempt to fetch emails periodically.
    # Ensure config/settings_schema.json and config/config.json.enc (or .json) are set up.
    # Especially emailAccount details for MS Graph and optionally scheduler settings.
    # Example config for scheduler in config.json:
    # "scheduler": {
    #   "intervalMinutes": 1, 
    #   "fetchLimit": 5 
    # }

    try:
        logger.info("Starting scheduler tasks...")
        start_scheduler_tasks() # Uses interval from config or default 15 mins
        
        # Keep the main thread alive to let the scheduler run for a bit
        # In a real app, the FastAPI server or Electron app would keep it alive.
        logger.info("Scheduler running. Press Ctrl+C to stop.")
        count = 0
        while count < 5: # Run for a few cycles or a short time
            time.sleep(10) # Check every 10 seconds for new emails in store for this test
            all_emails = get_all_fetched_emails()
            logger.info(f"[Test Main] Current fetched emails in store: {len(all_emails)}")
            if all_emails:
                logger.debug(f"[Test Main] First email subject: {all_emails[0].subject if all_emails else 'N/A'}")
            count +=1
            if not scheduler.running:
                logger.warning("[Test Main] Scheduler unexpectedly stopped.")
                break

    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received. Stopping scheduler...")
    except Exception as e:
        logger.error(f"Error in test execution: {e}", exc_info=True)
    finally:
        logger.info("Stopping scheduler tasks...")
        stop_scheduler_tasks()
        logger.info("Scheduler test finished.")
