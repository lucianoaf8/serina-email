# backend/calendar_service.py
import logging
import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import requests
# from config_service import AppSettings
from config_service import load_config

logger = logging.getLogger(__name__)

class CalendarEvent(BaseModel):
    """Pydantic model for calendar events."""
    id: str
    subject: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: List[str] = Field(default_factory=list)
    organizer: Optional[str] = None
    description: Optional[str] = None
    is_all_day: bool = False
    status: str = "busy"  # busy, free, tentative, out_of_office
    source: str = "unknown"  # msgraph, ics, etc.

class CalendarServiceError(Exception):
    """Custom exception for calendar service errors."""
    pass

class MSGraphCalendarService:
    """Microsoft Graph Calendar service for fetching calendar events."""
    
    def __init__(self, access_token: str, base_url: str = "https://graph.microsoft.com/v1.0"):
        self.access_token = access_token
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        })
    
    def get_upcoming_events(
        self, 
        hours_ahead: int = 24, 
        limit: int = 50
    ) -> List[CalendarEvent]:
        """
        Fetch upcoming calendar events from Microsoft Graph.
        
        Args:
            hours_ahead (int): How many hours ahead to look for events
            limit (int): Maximum number of events to return
            
        Returns:
            List[CalendarEvent]: List of upcoming calendar events
            
        Raises:
            CalendarServiceError: If fetching events fails
        """
        try:
            now = datetime.now(timezone.utc)
            end_time = now + timedelta(hours=hours_ahead)
            
            # Format dates for Graph API (ISO 8601)
            start_filter = now.isoformat()
            end_filter = end_time.isoformat()
            
            # Build query parameters
            params = {
                "$filter": f"start/dateTime ge '{start_filter}' and start/dateTime le '{end_filter}'",
                "$orderby": "start/dateTime",
                "$top": limit,
                "$select": "id,subject,start,end,location,attendees,organizer,bodyPreview,isAllDay,showAs"
            }
            
            url = f"{self.base_url}/me/events"
            logger.info(f"Fetching calendar events from: {url}")
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            events = []
            
            for event_data in data.get("value", []):
                try:
                    event = self._parse_graph_event(event_data)
                    events.append(event)
                except Exception as e:
                    logger.warning(f"Failed to parse event {event_data.get('id', 'unknown')}: {e}")
                    continue
            
            logger.info(f"Successfully fetched {len(events)} calendar events")
            return events
            
        except requests.RequestException as e:
            logger.error(f"HTTP error fetching calendar events: {e}", exc_info=True)
            raise CalendarServiceError(f"Failed to fetch calendar events: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching calendar events: {e}", exc_info=True)
            raise CalendarServiceError(f"Unexpected error fetching calendar events: {e}")
    
    def _parse_graph_event(self, event_data: Dict[str, Any]) -> CalendarEvent:
        """
        Parse a Microsoft Graph event into our CalendarEvent model.
        
        Args:
            event_data (Dict): Raw event data from Graph API
            
        Returns:
            CalendarEvent: Parsed calendar event
        """
        # Parse start and end times
        start_info = event_data.get("start", {})
        end_info = event_data.get("end", {})
        
        start_time = self._parse_graph_datetime(start_info)
        end_time = self._parse_graph_datetime(end_info)
        
        # Parse attendees
        attendees = []
        for attendee in event_data.get("attendees", []):
            email_address = attendee.get("emailAddress", {})
            if email_address.get("address"):
                attendees.append(email_address["address"])
        
        # Parse organizer
        organizer = None
        organizer_info = event_data.get("organizer", {})
        if organizer_info:
            email_address = organizer_info.get("emailAddress", {})
            organizer = email_address.get("address")
        
        # Parse location
        location = None
        location_info = event_data.get("location", {})
        if location_info:
            location = location_info.get("displayName")
        
        # Map showAs to our status
        show_as_mapping = {
            "free": "free",
            "tentative": "tentative", 
            "busy": "busy",
            "oof": "out_of_office",
            "workingElsewhere": "busy"
        }
        status = show_as_mapping.get(event_data.get("showAs", "busy"), "busy")
        
        return CalendarEvent(
            id=event_data.get("id", ""),
            subject=event_data.get("subject", "No Subject"),
            start_time=start_time,
            end_time=end_time,
            location=location,
            attendees=attendees,
            organizer=organizer,
            description=event_data.get("bodyPreview", ""),
            is_all_day=event_data.get("isAllDay", False),
            status=status,
            source="msgraph"
        )
    
    def _parse_graph_datetime(self, datetime_info: Dict[str, Any]) -> datetime:
        """
        Parse Microsoft Graph datetime format.
        
        Args:
            datetime_info (Dict): Datetime info from Graph API
            
        Returns:
            datetime: Parsed datetime object
        """
        date_time_str = datetime_info.get("dateTime")
        timezone_str = datetime_info.get("timeZone", "UTC")
        
        if not date_time_str:
            raise ValueError("Missing dateTime in datetime info")
        
        # Parse the datetime string (Graph returns ISO format without timezone)
        dt = datetime.fromisoformat(date_time_str.replace('Z', '+00:00'))
        
        # If timezone is specified and not UTC, we should handle it
        # For simplicity, we'll assume UTC for now
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        return dt

class ICSCalendarService:
    """Local ICS file calendar service (for future implementation)."""
    
    def __init__(self, ics_file_path: str):
        self.ics_file_path = ics_file_path
        logger.info(f"ICS Calendar Service initialized with file: {ics_file_path}")
    
    def get_upcoming_events(
        self, 
        hours_ahead: int = 24, 
        limit: int = 50
    ) -> List[CalendarEvent]:
        """
        Fetch upcoming events from ICS file.
        
        Args:
            hours_ahead (int): How many hours ahead to look for events
            limit (int): Maximum number of events to return
            
        Returns:
            List[CalendarEvent]: List of upcoming calendar events
            
        Raises:
            CalendarServiceError: If parsing ICS file fails
        """
        # Placeholder implementation - would need icalendar library
        logger.warning("ICS Calendar Service not fully implemented yet")
        raise CalendarServiceError("ICS Calendar Service is not implemented yet. Use Microsoft Graph instead.")

def get_calendar_service(config: Dict[str, Any], access_token: Optional[str] = None):
    """
    Factory function to get appropriate calendar service based on configuration.
    
    Args:
        config (Dict[str, Any]): Application configuration
        access_token (str, optional): OAuth access token for Graph API
        
    Returns:
        Calendar service instance
        
    Raises:
        CalendarServiceError: If service cannot be created
    """
    calendar_provider = getattr(config, 'calendarProvider', 'MSGraph')
    
    if calendar_provider == 'MSGraph':
        if not access_token:
            raise CalendarServiceError("Access token required for Microsoft Graph calendar service")
        return MSGraphCalendarService(access_token)
    
    elif calendar_provider == 'ICS':
        ics_path = getattr(config, 'icsFilePath', None)
        if not ics_path:
            raise CalendarServiceError("ICS file path required for ICS calendar service")
        return ICSCalendarService(ics_path)
    
    else:
        raise CalendarServiceError(f"Unsupported calendar provider: {calendar_provider}")

def is_time_available(
    events: List[CalendarEvent], 
    start_time: datetime, 
    end_time: datetime,
    buffer_minutes: int = 15
) -> bool:
    """
    Check if a time slot is available (no conflicting events).
    
    Args:
        events (List[CalendarEvent]): List of calendar events to check against
        start_time (datetime): Start of the time slot to check
        end_time (datetime): End of the time slot to check
        buffer_minutes (int): Buffer time in minutes before/after events
        
    Returns:
        bool: True if time slot is available, False otherwise
    """
    buffer_delta = timedelta(minutes=buffer_minutes)
    
    for event in events:
        # Skip free/tentative events
        if event.status in ["free", "tentative"]:
            continue
        
        # Check for overlap with buffer
        event_start = event.start_time - buffer_delta
        event_end = event.end_time + buffer_delta
        
        # Check if there's any overlap
        if start_time < event_end and end_time > event_start:
            logger.debug(f"Time conflict found with event: {event.subject} ({event.start_time} - {event.end_time})")
            return False
    
    return True

def find_next_available_slot(
    events: List[CalendarEvent],
    preferred_start: datetime,
    duration_minutes: int = 30,
    max_search_hours: int = 72,
    business_hours_only: bool = True
) -> Optional[datetime]:
    """
    Find the next available time slot after a preferred start time.
    
    Args:
        events (List[CalendarEvent]): List of calendar events
        preferred_start (datetime): Preferred start time
        duration_minutes (int): Duration of the meeting in minutes
        max_search_hours (int): Maximum hours to search ahead
        business_hours_only (bool): Only search during business hours (9 AM - 5 PM)
        
    Returns:
        Optional[datetime]: Next available start time, or None if not found
    """
    duration = timedelta(minutes=duration_minutes)
    search_end = preferred_start + timedelta(hours=max_search_hours)
    current_time = preferred_start
    
    # Search in 15-minute increments
    increment = timedelta(minutes=15)
    
    while current_time + duration <= search_end:
        # Check business hours if required
        if business_hours_only:
            hour = current_time.hour
            # Skip weekends and non-business hours
            if current_time.weekday() >= 5 or hour < 9 or hour >= 17:
                current_time += increment
                continue
        
        # Check if this slot is available
        if is_time_available(events, current_time, current_time + duration):
            logger.info(f"Found available slot: {current_time}")
            return current_time
        
        current_time += increment
    
    logger.warning(f"No available slot found within {max_search_hours} hours")
    return None

# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    import os
    logging.basicConfig(level=logging.INFO)
    logger.info("Testing calendar_service.py...")
    
    # Test would require a valid access token
    test_token = os.environ.get("GRAPH_ACCESS_TOKEN")
    if not test_token:
        logger.error("GRAPH_ACCESS_TOKEN environment variable not set. Skipping live API tests.")
    else:
        try:
            # Test Graph service
            logger.info("Testing Microsoft Graph calendar service...")
            graph_service = MSGraphCalendarService(test_token)
            events = graph_service.get_upcoming_events(hours_ahead=48)
            logger.info(f"Fetched {len(events)} events")
            
            for event in events[:3]:  # Show first 3 events
                logger.info(f"Event: {event.subject} at {event.start_time}")
            
            # Test availability checking
            if events:
                now = datetime.now(timezone.utc)
                future_time = now + timedelta(hours=1)
                is_available = is_time_available(events, future_time, future_time + timedelta(minutes=30))
                logger.info(f"Is {future_time} available for 30 min meeting? {is_available}")
                
                # Test finding next slot
                next_slot = find_next_available_slot(events, now, duration_minutes=30)
                logger.info(f"Next available 30-min slot: {next_slot}")
        
        except CalendarServiceError as e:
            logger.error(f"Calendar service test failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during tests: {e}", exc_info=True)
    
    logger.info("calendar_service.py tests finished.")
