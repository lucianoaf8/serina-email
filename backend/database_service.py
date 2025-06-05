# backend/database_service.py
import logging
import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Union
from pathlib import Path
from contextlib import contextmanager
from email_service import EmailMessage
from reminder_service import Reminder

logger = logging.getLogger(__name__)

class DatabaseServiceError(Exception):
    """Custom exception for database service errors."""
    pass

class DatabaseService:
    """SQLite database service for SERINA application."""

    # --- Alembic Migration Stub ---
    def run_alembic_migrations(self):
        """
        Stub for running Alembic migrations. Not yet implemented.
        """
        logger.info("run_alembic_migrations called (stub). Alembic integration not yet implemented.")
        # TODO: Integrate Alembic for schema migrations
        return False
    
    def __init__(self, db_path: str = "serina_db.sqlite3", encrypt: bool = False):
        self.db_path = db_path
        self.encrypt = encrypt
        
        # Ensure directory exists
        db_dir = Path(db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize database
        self._init_database()
        
        logger.info(f"Database service initialized: {db_path} (encrypt={encrypt})")
    
    def _init_database(self):
        """Initialize database schema."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Create emails table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS emails (
                        id TEXT PRIMARY KEY,
                        message_id TEXT UNIQUE,
                        subject TEXT,
                        sender_email TEXT,
                        sender_name TEXT,
                        recipient_emails TEXT, -- JSON array
                        cc_emails TEXT, -- JSON array
                        bcc_emails TEXT, -- JSON array
                        body_preview TEXT,
                        body_content TEXT,
                        is_read BOOLEAN DEFAULT FALSE,
                        is_flagged BOOLEAN DEFAULT FALSE,
                        is_important BOOLEAN DEFAULT FALSE,
                        received_date_time TEXT, -- ISO format
                        sent_date_time TEXT, -- ISO format
                        conversation_id TEXT,
                        folder_name TEXT DEFAULT 'Inbox',
                        categories TEXT, -- JSON array
                        attachments TEXT, -- JSON array of attachment info
                        web_link TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create reminders table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS reminders (
                        id TEXT PRIMARY KEY,
                        email_id TEXT,
                        reminder_time TEXT, -- ISO format
                        message TEXT,
                        is_active BOOLEAN DEFAULT TRUE,
                        snooze_count INTEGER DEFAULT 0,
                        snooze_until TEXT, -- ISO format
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (email_id) REFERENCES emails (id)
                    )
                """)
                
                # Create app_state table for general app data
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS app_state (
                        key TEXT PRIMARY KEY,
                        value TEXT, -- JSON serialized value
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create indexes for better query performance
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_emails_received_date ON emails (received_date_time)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails (sender_email)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_emails_subject ON emails (subject)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_emails_conversation ON emails (conversation_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders (reminder_time)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders (is_active)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_email ON reminders (email_id)")
                
                conn.commit()
                logger.info("Database schema initialized successfully")
                
        except sqlite3.Error as e:
            logger.error(f"Failed to initialize database: {e}", exc_info=True)
            raise DatabaseServiceError(f"Database initialization failed: {e}")
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = None
        try:
            if self.encrypt:
                # For encryption, would need sqlcipher or similar
                # This is a placeholder - actual encryption would require different setup
                logger.warning("Database encryption requested but not implemented - using standard SQLite")
            
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Enable column access by name
            yield conn
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            logger.error(f"Database error: {e}", exc_info=True)
            raise DatabaseServiceError(f"Database operation failed: {e}")
        finally:
            if conn:
                conn.close()
    
    # --- Email Operations ---
    
    def save_email(self, email: EmailMessage) -> bool:
        """
        Save an email to the database.
        
        Args:
            email (EmailMessage): Email to save
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Convert email to database format
                email_data = self._email_to_db_format(email)
                
                # Use INSERT OR REPLACE to handle duplicates
                cursor.execute("""
                    INSERT OR REPLACE INTO emails (
                        id, message_id, subject, sender_email, sender_name,
                        recipient_emails, cc_emails, bcc_emails, body_preview, body_content,
                        is_read, is_flagged, is_important, received_date_time, sent_date_time,
                        conversation_id, folder_name, categories, attachments, web_link,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, email_data)
                
                conn.commit()
                logger.debug(f"Saved email: {email.id}")
                return True
                
        except sqlite3.Error as e:
            logger.error(f"Failed to save email {email.id}: {e}", exc_info=True)
            return False
    
    def get_email(self, email_id: str) -> Optional[EmailMessage]:
        """
        Retrieve a single email by ID.
        
        Args:
            email_id (str): Email ID
            
        Returns:
            Optional[EmailMessage]: Email if found, None otherwise
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM emails WHERE id = ?", (email_id,))
                row = cursor.fetchone()
                
                if row:
                    return self._db_row_to_email(row)
                return None
                
        except sqlite3.Error as e:
            logger.error(f"Failed to get email {email_id}: {e}", exc_info=True)
            return None
    
    def get_emails(
        self, 
        limit: int = 50, 
        offset: int = 0, 
        folder: Optional[str] = None,
        unread_only: bool = False
    ) -> List[EmailMessage]:
        """
        Retrieve multiple emails with pagination and filtering.
        
        Args:
            limit (int): Maximum number of emails to return
            offset (int): Number of emails to skip
            folder (str, optional): Filter by folder name
            unread_only (bool): Only return unread emails
            
        Returns:
            List[EmailMessage]: List of emails
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Build query with filters
                query = "SELECT * FROM emails WHERE 1=1"
                params = []
                
                if folder:
                    query += " AND folder_name = ?"
                    params.append(folder)
                
                if unread_only:
                    query += " AND is_read = FALSE"
                
                query += " ORDER BY received_date_time DESC LIMIT ? OFFSET ?"
                params.extend([limit, offset])
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                emails = []
                for row in rows:
                    try:
                        email = self._db_row_to_email(row)
                        emails.append(email)
                    except Exception as e:
                        logger.warning(f"Failed to parse email row {row['id']}: {e}")
                        continue
                
                logger.debug(f"Retrieved {len(emails)} emails")
                return emails
                
        except sqlite3.Error as e:
            logger.error(f"Failed to get emails: {e}", exc_info=True)
            return []
    
    def search_emails(self, query: str, limit: int = 50) -> List[EmailMessage]:
        """
        Search emails by subject, sender, or content.
        
        Args:
            query (str): Search query
            limit (int): Maximum number of results
            
        Returns:
            List[EmailMessage]: Matching emails
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Search in subject, sender name, sender email, and body preview
                search_query = """
                    SELECT * FROM emails 
                    WHERE subject LIKE ? OR sender_name LIKE ? OR sender_email LIKE ? OR body_preview LIKE ?
                    ORDER BY received_date_time DESC 
                    LIMIT ?
                """
                
                search_term = f"%{query}%"
                cursor.execute(search_query, (search_term, search_term, search_term, search_term, limit))
                rows = cursor.fetchall()
                
                emails = []
                for row in rows:
                    try:
                        email = self._db_row_to_email(row)
                        emails.append(email)
                    except Exception as e:
                        logger.warning(f"Failed to parse email row {row['id']}: {e}")
                        continue
                
                logger.debug(f"Found {len(emails)} emails matching '{query}'")
                return emails
                
        except sqlite3.Error as e:
            logger.error(f"Failed to search emails: {e}", exc_info=True)
            return []
    
    def update_email_status(
        self, 
        email_id: str, 
        is_read: Optional[bool] = None,
        is_flagged: Optional[bool] = None,
        is_important: Optional[bool] = None
    ) -> bool:
        """
        Update email status flags.
        
        Args:
            email_id (str): Email ID
            is_read (bool, optional): Read status
            is_flagged (bool, optional): Flagged status
            is_important (bool, optional): Important status
            
        Returns:
            bool: True if successful
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                updates = []
                params = []
                
                if is_read is not None:
                    updates.append("is_read = ?")
                    params.append(is_read)
                
                if is_flagged is not None:
                    updates.append("is_flagged = ?")
                    params.append(is_flagged)
                
                if is_important is not None:
                    updates.append("is_important = ?")
                    params.append(is_important)
                
                if not updates:
                    return True  # Nothing to update
                
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(email_id)
                
                query = f"UPDATE emails SET {', '.join(updates)} WHERE id = ?"
                cursor.execute(query, params)
                
                conn.commit()
                logger.debug(f"Updated email status: {email_id}")
                return True
                
        except sqlite3.Error as e:
            logger.error(f"Failed to update email status {email_id}: {e}", exc_info=True)
            return False
    
    def delete_email(self, email_id: str) -> bool:
        """
        Delete an email from database.
        
        Args:
            email_id (str): Email ID
            
        Returns:
            bool: True if successful
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM emails WHERE id = ?", (email_id,))
                conn.commit()
                
                logger.debug(f"Deleted email: {email_id}")
                return True
                
        except sqlite3.Error as e:
            logger.error(f"Failed to delete email {email_id}: {e}", exc_info=True)
            return False
    
    # --- Reminder Operations ---
    
    def save_reminder(self, reminder: Reminder) -> bool:
        """Save a reminder to the database."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                reminder_data = (
                    reminder.id,
                    reminder.email_id,
                    reminder.reminder_time.isoformat() if reminder.reminder_time else None,
                    reminder.message,
                    reminder.is_active,
                    reminder.snooze_count,
                    reminder.snooze_until.isoformat() if reminder.snooze_until else None,
                    datetime.now().isoformat()  # updated_at
                )
                
                cursor.execute("""
                    INSERT OR REPLACE INTO reminders (
                        id, email_id, reminder_time, message, is_active, 
                        snooze_count, snooze_until, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, reminder_data)
                
                conn.commit()
                logger.debug(f"Saved reminder: {reminder.id}")
                return True
                
        except sqlite3.Error as e:
            logger.error(f"Failed to save reminder {reminder.id}: {e}", exc_info=True)
            return False
    
    def get_reminder(self, reminder_id: str) -> Optional[Reminder]:
        """Get a single reminder by ID."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,))
                row = cursor.fetchone()
                
                if row:
                    return self._db_row_to_reminder(row)
                return None
                
        except sqlite3.Error as e:
            logger.error(f"Failed to get reminder {reminder_id}: {e}", exc_info=True)
            return None
    
    def get_reminders(
        self, 
        active_only: bool = False, 
        email_id: Optional[str] = None
    ) -> List[Reminder]:
        """Get multiple reminders with filtering."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                query = "SELECT * FROM reminders WHERE 1=1"
                params = []
                
                if active_only:
                    query += " AND is_active = TRUE"
                
                if email_id:
                    query += " AND email_id = ?"
                    params.append(email_id)
                
                query += " ORDER BY reminder_time ASC"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                reminders = []
                for row in rows:
                    try:
                        reminder = self._db_row_to_reminder(row)
                        reminders.append(reminder)
                    except Exception as e:
                        logger.warning(f"Failed to parse reminder row {row['id']}: {e}")
                        continue
                
                return reminders
                
        except sqlite3.Error as e:
            logger.error(f"Failed to get reminders: {e}", exc_info=True)
            return []
    
    def update_reminder(self, reminder: Reminder) -> bool:
        """Update an existing reminder."""
        return self.save_reminder(reminder)  # INSERT OR REPLACE handles updates
    
    def delete_reminder(self, reminder_id: str) -> bool:
        """Delete a reminder."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
                conn.commit()
                
                logger.debug(f"Deleted reminder: {reminder_id}")
                return True
                
        except sqlite3.Error as e:
            logger.error(f"Failed to delete reminder {reminder_id}: {e}", exc_info=True)
            return False
    
    # --- App State Operations ---
    
    def set_app_state(self, key: str, value: Any) -> bool:
        """Set an application state value."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                json_value = json.dumps(value)
                cursor.execute("""
                    INSERT OR REPLACE INTO app_state (key, value, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (key, json_value))
                
                conn.commit()
                return True
                
        except (sqlite3.Error, json.JSONEncodeError) as e:
            logger.error(f"Failed to set app state {key}: {e}", exc_info=True)
            return False
    
    def get_app_state(self, key: str, default: Any = None) -> Any:
        """Get an application state value."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM app_state WHERE key = ?", (key,))
                row = cursor.fetchone()
                
                if row:
                    return json.loads(row['value'])
                return default
                
        except (sqlite3.Error, json.JSONDecodeError) as e:
            logger.error(f"Failed to get app state {key}: {e}", exc_info=True)
            return default
    
    # --- Helper Methods ---
    
    def _email_to_db_format(self, email: EmailMessage) -> tuple:
        """Convert EmailMessage to database tuple format."""
        return (
            email.id,
            email.message_id,
            email.subject,
            email.sender.email if email.sender else None,
            email.sender.name if email.sender else None,
            json.dumps([addr.email for addr in email.to_recipients]) if email.to_recipients else "[]",
            json.dumps([addr.email for addr in email.cc_recipients]) if email.cc_recipients else "[]",
            json.dumps([addr.email for addr in email.bcc_recipients]) if email.bcc_recipients else "[]",
            email.body_preview,
            email.body_content,
            email.is_read,
            email.is_flagged,
            email.importance == "high" if email.importance else False,
            email.received_date_time.isoformat() if email.received_date_time else None,
            email.sent_date_time.isoformat() if email.sent_date_time else None,
            email.conversation_id,
            getattr(email, 'folder_name', 'Inbox'),
            json.dumps(getattr(email, 'categories', [])),
            json.dumps([{"name": att.name, "size": att.size} for att in email.attachments]) if email.attachments else "[]",
            email.web_link,
            datetime.now().isoformat()  # updated_at
        )
    
    def _db_row_to_email(self, row: sqlite3.Row) -> EmailMessage:
        """Convert database row to EmailMessage."""
        from email_service import EmailAddress, EmailAttachment
        
        # Parse JSON fields
        try:
            to_emails = json.loads(row['recipient_emails'] or "[]")
            cc_emails = json.loads(row['cc_emails'] or "[]")
            bcc_emails = json.loads(row['bcc_emails'] or "[]")
            categories = json.loads(row['categories'] or "[]")
            attachments_data = json.loads(row['attachments'] or "[]")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON in email row {row['id']}: {e}")
            to_emails = cc_emails = bcc_emails = categories = attachments_data = []
        
        # Create EmailAddress objects
        sender = EmailAddress(email=row['sender_email'], name=row['sender_name']) if row['sender_email'] else None
        to_recipients = [EmailAddress(email=email) for email in to_emails]
        cc_recipients = [EmailAddress(email=email) for email in cc_emails]
        bcc_recipients = [EmailAddress(email=email) for email in bcc_emails]
        
        # Create EmailAttachment objects
        attachments = [
            EmailAttachment(
                name=att.get('name', ''), 
                size=att.get('size', 0)
            ) for att in attachments_data
        ]
        
        return EmailMessage(
            id=row['id'],
            message_id=row['message_id'],
            subject=row['subject'],
            sender=sender,
            to_recipients=to_recipients,
            cc_recipients=cc_recipients,
            bcc_recipients=bcc_recipients,
            body_preview=row['body_preview'],
            body_content=row['body_content'],
            is_read=bool(row['is_read']),
            is_flagged=bool(row['is_flagged']),
            importance="high" if row['is_important'] else "normal",
            received_date_time=datetime.fromisoformat(row['received_date_time']) if row['received_date_time'] else None,
            sent_date_time=datetime.fromisoformat(row['sent_date_time']) if row['sent_date_time'] else None,
            conversation_id=row['conversation_id'],
            attachments=attachments,
            web_link=row['web_link']
        )
    
    def _db_row_to_reminder(self, row: sqlite3.Row) -> Reminder:
        """Convert database row to Reminder."""
        return Reminder(
            id=row['id'],
            email_id=row['email_id'],
            reminder_time=datetime.fromisoformat(row['reminder_time']) if row['reminder_time'] else None,
            message=row['message'],
            is_active=bool(row['is_active']),
            snooze_count=row['snooze_count'] or 0,
            snooze_until=datetime.fromisoformat(row['snooze_until']) if row['snooze_until'] else None
        )
    
    # --- Database Management ---
    
    def get_stats(self) -> Dict[str, int]:
        """Get database statistics."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                stats = {}
                
                # Email counts
                cursor.execute("SELECT COUNT(*) FROM emails")
                stats['total_emails'] = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM emails WHERE is_read = FALSE")
                stats['unread_emails'] = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM emails WHERE is_flagged = TRUE")
                stats['flagged_emails'] = cursor.fetchone()[0]
                
                # Reminder counts
                cursor.execute("SELECT COUNT(*) FROM reminders")
                stats['total_reminders'] = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM reminders WHERE is_active = TRUE")
                stats['active_reminders'] = cursor.fetchone()[0]
                
                return stats
                
        except sqlite3.Error as e:
            logger.error(f"Failed to get database stats: {e}", exc_info=True)
            return {}
    
    def cleanup_old_data(self, days_to_keep: int = 90) -> bool:
        """Remove old emails and reminders beyond specified days."""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            cutoff_iso = cutoff_date.isoformat()
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Delete old emails
                cursor.execute(
                    "DELETE FROM emails WHERE received_date_time < ? AND is_flagged = FALSE", 
                    (cutoff_iso,)
                )
                deleted_emails = cursor.rowcount
                
                # Delete old inactive reminders
                cursor.execute(
                    "DELETE FROM reminders WHERE created_at < ? AND is_active = FALSE", 
                    (cutoff_iso,)
                )
                deleted_reminders = cursor.rowcount
                
                conn.commit()
                
                logger.info(f"Cleanup completed: deleted {deleted_emails} emails, {deleted_reminders} reminders")
                return True
                
        except sqlite3.Error as e:
            logger.error(f"Failed to cleanup old data: {e}", exc_info=True)
            return False

# Global database instance
_db_instance: Optional[DatabaseService] = None

def get_database(db_path: str = "serina_db.sqlite3", encrypt: bool = False) -> DatabaseService:
    """Get or create global database instance."""
    global _db_instance
    
    if _db_instance is None:
        _db_instance = DatabaseService(db_path, encrypt)
    
    return _db_instance

# --- Example Usage ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    logger.info("Testing database_service.py...")
    
    try:
        # Test database initialization
        db = DatabaseService("test_serina.db")
        
        # Test stats
        stats = db.get_stats()
        logger.info(f"Database stats: {stats}")
        
        # Test app state
        db.set_app_state("test_key", {"value": 123, "timestamp": datetime.now().isoformat()})
        retrieved_value = db.get_app_state("test_key")
        logger.info(f"App state test: {retrieved_value}")
        
        logger.info("Database service tests completed successfully")
        
    except Exception as e:
        logger.error(f"Database service test failed: {e}", exc_info=True)