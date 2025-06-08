"""
SERINA Config Service - Simplified for MVP
Basic JSON configuration management
"""

import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Configuration file path
CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".serina")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

# Default configuration
DEFAULT_CONFIG = {
    "llm": {
        "provider": "openai",  # "openai" or "openrouter"
        "api_key": "",
        "model": "gpt-3.5-turbo"
    },
    "email": {
        "check_interval_minutes": 15,
        "max_emails_per_check": 20
    },
    "notifications": {
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "08:00",
        "show_desktop_notifications": True,
        "notification_position": "bottom-right"  # "top-right", "bottom-right", "bottom-left", "top-left"
    },
    "ui": {
        "dark_mode": True,
        "window_width": 1200,
        "window_height": 800
    },
    "reminders": {
        "default_snooze_minutes": 60,
        "snooze_options": [15, 30, 60, 120, 240]  # minutes
    }
}

def ensure_config_dir():
    """Ensure config directory exists."""
    os.makedirs(CONFIG_DIR, exist_ok=True)

def load_config() -> Dict[str, Any]:
    """Load configuration from file, create default if not exists."""
    ensure_config_dir()
    
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
            
            # Merge with defaults to ensure all keys exist
            merged_config = _merge_configs(DEFAULT_CONFIG, config)
            logger.info("Configuration loaded successfully")
            return merged_config
        else:
            # Create default config file
            save_config(DEFAULT_CONFIG)
            logger.info("Created default configuration file")
            return DEFAULT_CONFIG.copy()
            
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return DEFAULT_CONFIG.copy()

def save_config(config: Dict[str, Any]) -> bool:
    """Save configuration to file."""
    ensure_config_dir()
    
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        logger.info("Configuration saved successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save config: {e}")
        return False

def get_config_value(key_path: str, default=None):
    """Get a specific config value using dot notation (e.g., 'llm.provider')."""
    config = load_config()
    keys = key_path.split('.')
    
    current = config
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    
    return current

def set_config_value(key_path: str, value) -> bool:
    """Set a specific config value using dot notation."""
    config = load_config()
    keys = key_path.split('.')
    
    # Navigate to the parent of the final key
    current = config
    for key in keys[:-1]:
        if key not in current:
            current[key] = {}
        current = current[key]
    
    # Set the final key
    current[keys[-1]] = value
    
    return save_config(config)

def _merge_configs(default: Dict, user: Dict) -> Dict:
    """Recursively merge user config with default config."""
    merged = default.copy()
    
    for key, value in user.items():
        if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
            merged[key] = _merge_configs(merged[key], value)
        else:
            merged[key] = value
    
    return merged

def validate_config(config: Dict[str, Any]) -> bool:
    """Basic validation of configuration."""
    required_sections = ['llm', 'email', 'notifications', 'ui', 'reminders']
    
    for section in required_sections:
        if section not in config:
            logger.error(f"Missing required config section: {section}")
            return False
    
    # Validate LLM provider
    if config['llm']['provider'] not in ['openai', 'openrouter']:
        logger.error(f"Invalid LLM provider: {config['llm']['provider']}")
        return False
    
    # Validate check interval
    if config['email']['check_interval_minutes'] < 1:
        logger.error("Check interval must be at least 1 minute")
        return False
    
    return True

def reset_config() -> bool:
    """Reset configuration to defaults."""
    return save_config(DEFAULT_CONFIG)

def backup_config() -> bool:
    """Create a backup of current configuration."""
    try:
        if os.path.exists(CONFIG_FILE):
            backup_file = CONFIG_FILE + ".backup"
            with open(CONFIG_FILE, 'r') as src:
                with open(backup_file, 'w') as dst:
                    dst.write(src.read())
            logger.info(f"Configuration backed up to {backup_file}")
            return True
    except Exception as e:
        logger.error(f"Failed to backup config: {e}")
        return False

# Convenience functions for common config access
def get_llm_config():
    """Get LLM configuration."""
    return get_config_value('llm', {})

def get_email_config():
    """Get email configuration."""
    return get_config_value('email', {})

def get_ui_config():
    """Get UI configuration."""
    return get_config_value('ui', {})

def is_dark_mode():
    """Check if dark mode is enabled."""
    return get_config_value('ui.dark_mode', True)

def get_check_interval():
    """Get email check interval in minutes."""
    return get_config_value('email.check_interval_minutes', 15)