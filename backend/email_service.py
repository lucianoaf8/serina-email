"""
SERINA Email Service - Outlook COM Integration
Simplified for MVP - Windows only, requires Outlook desktop app
"""

import win32com.client
import pythoncom
from datetime import datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class OutlookEmailService:
    def __init__(self):
        self.outlook = None
        self.namespace = None
        self._initialize_outlook()
    
    def _initialize_outlook(self):
        """Initialize connection to Outlook via COM."""
        try:
            pythoncom.CoInitialize()
            self.outlook = win32com.client.Dispatch("Outlook.Application")
            self.namespace = self.outlook.GetNamespace("MAPI")
            logger.info("Successfully connected to Outlook via COM")
        except Exception as e:
            logger.error(f"Failed to initialize Outlook COM: {e}")
            raise Exception("Could not connect to Outlook. Make sure Outlook is installed and you're logged in.")
    
    def get_new_emails(self, limit: int = 20) -> List[Dict]:
        """Get new/unread emails from Inbox."""
        try:
            inbox = self.namespace.GetDefaultFolder(6)  # 6 = Inbox
            messages = inbox.Items
            messages.Sort("[ReceivedTime]", True)  # Sort by newest first
            
            emails = []
            count = 0
            
            for message in messages:
                if count >= limit:
                    break
                    
                # Only get unread emails
                if hasattr(message, 'UnRead') and message.UnRead:
                    email_data = {
                        'id': message.EntryID,
                        'subject': getattr(message, 'Subject', 'No Subject'),
                        'sender': getattr(message, 'SenderName', 'Unknown Sender'),
                        'sender_email': getattr(message, 'SenderEmailAddress', ''),
                        'body': getattr(message, 'Body', ''),
                        'received_time': getattr(message, 'ReceivedTime', datetime.now()),
                        'is_unread': message.UnRead,
                        'importance': getattr(message, 'Importance', 1)  # 0=Low, 1=Normal, 2=High
                    }
                    emails.append(email_data)
                    count += 1
            
            logger.info(f"Retrieved {len(emails)} new emails")
            return emails
            
        except Exception as e:
            logger.error(f"Failed to get emails: {e}")
            return []
    
    def get_email_by_id(self, email_id: str) -> Optional[Dict]:
        """Get specific email by ID."""
        try:
            message = self.namespace.GetItemFromID(email_id)
            return {
                'id': message.EntryID,
                'subject': getattr(message, 'Subject', 'No Subject'),
                'sender': getattr(message, 'SenderName', 'Unknown Sender'),
                'sender_email': getattr(message, 'SenderEmailAddress', ''),
                'body': getattr(message, 'Body', ''),
                'received_time': getattr(message, 'ReceivedTime', datetime.now()),
                'is_unread': message.UnRead
            }
        except Exception as e:
            logger.error(f"Failed to get email {email_id}: {e}")
            return None
    
    def send_reply(self, email_id: str, reply_text: str) -> bool:
        """Send reply to an email."""
        try:
            original_message = self.namespace.GetItemFromID(email_id)
            reply = original_message.Reply()
            
            # Preserve original body and add new reply
            reply.Body = reply_text + "\n\n" + reply.Body
            reply.Send()
            
            # Mark original as read
            original_message.UnRead = False
            original_message.Save()
            
            logger.info(f"Reply sent for email {email_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send reply: {e}")
            return False
    
    def mark_as_read(self, email_id: str) -> bool:
        """Mark email as read."""
        try:
            message = self.namespace.GetItemFromID(email_id)
            message.UnRead = False
            message.Save()
            logger.info(f"Email {email_id} marked as read")
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark email as read: {e}")
            return False
    
    def create_todo_task(self, title: str, description: str, email_id: str = None) -> bool:
        """Create a task in Microsoft TODO via Outlook."""
        try:
            task = self.outlook.CreateItem(3)  # 3 = Task item
            task.Subject = title
            task.Body = description
            
            # If related to an email, add reference
            if email_id:
                task.Body += f"\n\nRelated Email ID: {email_id}"
            
            task.Save()
            logger.info(f"Task created: {title}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            return False
    
    def snooze_email(self, email_id: str, snooze_minutes: int) -> bool:
        """Move email to a snooze folder (implementation depends on Outlook setup)."""
        try:
            message = self.namespace.GetItemFromID(email_id)
            
            # For MVP, just mark as read and we'll handle snooze logic in the app
            # In a full implementation, you might move to a "Snoozed" folder
            message.UnRead = False
            message.Save()
            
            logger.info(f"Email {email_id} snoozed for {snooze_minutes} minutes")
            return True
            
        except Exception as e:
            logger.error(f"Failed to snooze email: {e}")
            return False
    
    def get_unread_count(self) -> int:
        """Get count of unread emails."""
        try:
            inbox = self.namespace.GetDefaultFolder(6)
            return inbox.UnReadItemCount
        except Exception as e:
            logger.error(f"Failed to get unread count: {e}")
            return 0

# Global instance for the service
email_service = OutlookEmailService()