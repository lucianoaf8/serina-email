// SERINA Tauri Library
// Additional utilities and shared code

pub mod utils {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct EmailData {
        pub id: String,
        pub subject: String,
        pub sender: String,
        pub sender_email: String,
        pub body: String,
        pub received_time: String,
        pub is_unread: bool,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct NotificationData {
        pub title: String,
        pub body: String,
        pub count: u32,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct AppConfig {
        pub llm: LLMConfig,
        pub email: EmailConfig,
        pub notifications: NotificationConfig,
        pub ui: UIConfig,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct LLMConfig {
        pub provider: String,
        pub api_key: String,
        pub model: String,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct EmailConfig {
        pub check_interval_minutes: u32,
        pub max_emails_per_check: u32,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct NotificationConfig {
        pub quiet_hours_start: String,
        pub quiet_hours_end: String,
        pub show_desktop_notifications: bool,
        pub notification_position: String,
    }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct UIConfig {
        pub dark_mode: bool,
        pub window_width: f64,
        pub window_height: f64,
    }

    /// Check if the current time is within quiet hours
    pub fn is_quiet_hours(start: &str, end: &str) -> bool {
        use chrono::{Local, NaiveTime};

        let now = Local::now().time();
        
        if let (Ok(start_time), Ok(end_time)) = (
            NaiveTime::parse_from_str(start, "%H:%M"),
            NaiveTime::parse_from_str(end, "%H:%M"),
        ) {
            if start_time <= end_time {
                // Same day range (e.g., 09:00 to 17:00)
                now >= start_time && now <= end_time
            } else {
                // Overnight range (e.g., 22:00 to 08:00)
                now >= start_time || now <= end_time
            }
        } else {
            false
        }
    }

    /// Format email count for display
    pub fn format_email_count(count: u32) -> String {
        match count {
            0 => "No new emails".to_string(),
            1 => "1 new email".to_string(),
            n => format!("{} new emails", n),
        }
    }

    /// Validate API key format (basic check)
    pub fn is_valid_api_key(key: &str, provider: &str) -> bool {
        if key.is_empty() {
            return false;
        }

        match provider {
            "openai" => key.starts_with("sk-"),
            "openrouter" => key.starts_with("sk-or-"),
            _ => key.len() > 10, // Basic length check for unknown providers
        }
    }

    /// Sanitize file paths for logging
    pub fn sanitize_path(path: &str) -> String {
        path.chars()
            .map(|c| if c.is_alphanumeric() || c == '/' || c == '\\' || c == '.' { c } else { '_' })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::utils::*;

    #[test]
    fn test_quiet_hours_same_day() {
        // This would need proper mocking for real tests
        // Just basic structure for now
        assert!(!is_quiet_hours("25:00", "26:00")); // Invalid times
    }

    #[test]
    fn test_format_email_count() {
        assert_eq!(format_email_count(0), "No new emails");
        assert_eq!(format_email_count(1), "1 new email");
        assert_eq!(format_email_count(5), "5 new emails");
    }

    #[test]
    fn test_api_key_validation() {
        assert!(is_valid_api_key("sk-1234567890", "openai"));
        assert!(is_valid_api_key("sk-or-1234567890", "openrouter"));
        assert!(!is_valid_api_key("", "openai"));
        assert!(!is_valid_api_key("invalid", "openai"));
    }
}