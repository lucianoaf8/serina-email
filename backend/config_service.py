# backend/config_service.py
import json
import os
import logging
from cryptography.fernet import Fernet, InvalidToken
from jsonschema import validate, ValidationError

# Setup logger
logger = logging.getLogger(__name__)

# --- Configuration File Paths ---
CONFIG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'config'))
SCHEMA_FILE_PATH = os.path.join(CONFIG_DIR, 'settings_schema.json')
CONFIG_FILE_PATH = os.path.join(CONFIG_DIR, 'config.json') # Plain text, for initial setup or if encryption fails
ENCRYPTED_CONFIG_FILE_PATH = os.path.join(CONFIG_DIR, 'config.json.enc')

# --- Environment Variable for Encryption Key ---
# In a real app, use OS keychain or a more secure secret management system.
# For simplicity, we'll use an environment variable or generate/store one if not found.
ENCRYPTION_KEY_ENV_VAR = 'SERINA_ENCRYPTION_KEY'
KEY_FILE_PATH = os.path.join(CONFIG_DIR, '.encryption_key') # Fallback if env var not set

# --- Helper Functions ---

def _generate_key() -> bytes:
    """Generates a new Fernet key."""
    return Fernet.generate_key()

def get_encryption_key() -> bytes:
    """Retrieves encryption key from env var, a local file, or generates a new one."""
    key_str = os.environ.get(ENCRYPTION_KEY_ENV_VAR)
    if key_str:
        logger.info(f"Loaded encryption key from environment variable {ENCRYPTION_KEY_ENV_VAR}.")
        return key_str.encode()

    if os.path.exists(KEY_FILE_PATH):
        with open(KEY_FILE_PATH, 'rb') as f:
            key = f.read()
        logger.info(f"Loaded encryption key from {KEY_FILE_PATH}.")
        return key
    
    logger.warning(
        f"Encryption key not found in environment variable '{ENCRYPTION_KEY_ENV_VAR}' or file '{KEY_FILE_PATH}'. "
        f"Generating a new key and saving to {KEY_FILE_PATH}. "
        f"IMPORTANT: Backup this key or set the env var for data recovery across installs."
    )
    new_key = _generate_key()
    try:
        os.makedirs(CONFIG_DIR, exist_ok=True)
        with open(KEY_FILE_PATH, 'wb') as f:
            f.write(new_key)
        # Attempt to set read-only for user on the key file (platform dependent)
        # On Windows, this might require more complex ACL handling via pywin32
        # On POSIX, os.chmod(KEY_FILE_PATH, 0o400) would be appropriate
        logger.info(f"Generated and saved new encryption key to {KEY_FILE_PATH}.")
    except IOError as e:
        logger.error(f"Could not save new encryption key to {KEY_FILE_PATH}: {e}", exc_info=True)
        # Fallback: use the key in memory but warn user it's not persisted
        logger.critical("Failed to persist encryption key. Configuration will be insecure if app restarts without manual key setup.")
    return new_key

def encrypt_data(data: dict, key: bytes) -> bytes:
    """Encrypts dictionary data using Fernet."""
    f = Fernet(key)
    json_data = json.dumps(data).encode('utf-8')
    encrypted_token = f.encrypt(json_data)
    return encrypted_token

def decrypt_data(token: bytes, key: bytes) -> dict | None:
    """Decrypts Fernet token back to dictionary data."""
    f = Fernet(key)
    try:
        decrypted_data = f.decrypt(token)
        return json.loads(decrypted_data.decode('utf-8'))
    except InvalidToken:
        logger.error("Failed to decrypt configuration: Invalid token. Key might be incorrect or data corrupted.")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during decryption: {e}", exc_info=True)
        return None

def _load_schema() -> dict | None:
    """Loads the JSON schema for settings validation."""
    try:
        with open(SCHEMA_FILE_PATH, 'r') as f:
            schema = json.load(f)
        return schema
    except FileNotFoundError:
        logger.error(f"Settings schema file not found: {SCHEMA_FILE_PATH}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding settings schema JSON from {SCHEMA_FILE_PATH}: {e}", exc_info=True)
        return None

def _get_defaults_from_schema(schema: dict) -> dict:
    """Extracts default values from the JSON schema."""
    defaults = {}
    for key, prop_schema in schema.get('properties', {}).items():
        if 'default' in prop_schema:
            defaults[key] = prop_schema['default']
        elif prop_schema.get('type') == 'object' and 'properties' in prop_schema: # Nested defaults
            defaults[key] = _get_defaults_from_schema(prop_schema)
    return defaults

def load_config() -> dict:
    """Loads configuration, decrypts if necessary, validates, and returns it."""
    key = get_encryption_key()
    schema = _load_schema()
    if not schema:
        logger.critical("Cannot load configuration without a valid schema. Returning empty config.")
        return {}

    default_settings = _get_defaults_from_schema(schema)
    config_data = None

    if os.path.exists(ENCRYPTED_CONFIG_FILE_PATH):
        logger.info(f"Loading encrypted configuration from {ENCRYPTED_CONFIG_FILE_PATH}")
        try:
            with open(ENCRYPTED_CONFIG_FILE_PATH, 'rb') as f:
                encrypted_token = f.read()
            config_data = decrypt_data(encrypted_token, key)
            if config_data is None:
                logger.warning("Failed to decrypt. Attempting to load plaintext config if available.")
        except Exception as e:
            logger.error(f"Error reading encrypted config file: {e}", exc_info=True)
            config_data = None # Ensure fallback if read fails
    
    if config_data is None and os.path.exists(CONFIG_FILE_PATH):
        logger.warning(f"Encrypted config not found or failed to load. Loading plaintext config from {CONFIG_FILE_PATH}.")
        try:
            with open(CONFIG_FILE_PATH, 'r') as f:
                config_data = json.load(f)
        except Exception as e:
            logger.error(f"Error reading plaintext config file: {e}", exc_info=True)
            config_data = None

    if config_data is None:
        logger.warning("No configuration file found or readable. Using default settings from schema.")
        config_data = default_settings
    else:
        # Merge loaded config with defaults to ensure all keys are present
        merged_config = default_settings.copy()
        merged_config.update(config_data)
        config_data = merged_config

    try:
        validate(instance=config_data, schema=schema)
        logger.info("Configuration loaded and validated successfully.")
        return config_data
    except ValidationError as e:
        logger.error(f"Configuration validation failed: {e.message}. Path: {list(e.path)}. Using default settings.")
        # Consider what to do on validation error: return defaults, or try to fix, or raise?
        # For robustness, returning defaults if validation fails after load.
        return default_settings

def save_config(settings_dict: dict) -> bool:
    """Validates, encrypts, and saves configuration."""
    schema = _load_schema()
    if not schema:
        logger.error("Cannot save configuration without a valid schema.")
        return False

    try:
        validate(instance=settings_dict, schema=schema)
    except ValidationError as e:
        logger.error(f"Configuration validation failed before saving: {e.message}. Path: {list(e.path)}.")
        # Optionally, could provide more detailed error feedback to the caller
        # For example, raise e or return a more descriptive error object
        return False

    key = get_encryption_key()
    try:
        encrypted_token = encrypt_data(settings_dict, key)
        os.makedirs(CONFIG_DIR, exist_ok=True)
        with open(ENCRYPTED_CONFIG_FILE_PATH, 'wb') as f:
            f.write(encrypted_token)
        logger.info(f"Configuration saved and encrypted to {ENCRYPTED_CONFIG_FILE_PATH}")
        
        # Optionally remove the unencrypted config file if it exists, for security
        if os.path.exists(CONFIG_FILE_PATH):
            try:
                os.remove(CONFIG_FILE_PATH)
                logger.info(f"Removed plaintext configuration file: {CONFIG_FILE_PATH}")
            except OSError as e_remove:
                logger.warning(f"Could not remove plaintext config file {CONFIG_FILE_PATH}: {e_remove}")
        return True
    except Exception as e:
        logger.error(f"Failed to save or encrypt configuration: {e}", exc_info=True)
        return False

# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    logger.info("Testing config_service.py...")

    # Ensure schema exists for testing
    if not os.path.exists(SCHEMA_FILE_PATH):
        logger.error(f"Schema file {SCHEMA_FILE_PATH} is needed for testing. Please create it.")
        # As a fallback, create a minimal schema for testing if it's missing
        # This part would ideally not be needed if schema is guaranteed by prior steps
        if not os.path.exists(CONFIG_DIR):
            os.makedirs(CONFIG_DIR)
        temp_schema_for_test = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Test Settings", "type": "object",
            "properties": {"testKey": {"type": "string", "default": "defaultValue"}},
            "required": ["testKey"]
        }
        with open(SCHEMA_FILE_PATH, 'w') as sf:
            json.dump(temp_schema_for_test, sf, indent=2)
        logger.info(f"Created a temporary schema at {SCHEMA_FILE_PATH} for testing.")


    # Test loading (should use defaults or create new if no config exists)
    current_config = load_config()
    logger.info(f"Loaded config: {current_config}")

    # Modify a setting
    current_config['llmProvider'] = 'Anthropic' # Example, assumes llmProvider is in schema
    if 'testKey' in current_config: # From potential temp_schema_for_test
        current_config['testKey'] = 'newTestValue'
    
    # Test saving
    if save_config(current_config):
        logger.info("Config saved successfully.")
        # Test loading again to verify
        reloaded_config = load_config()
        logger.info(f"Reloaded config: {reloaded_config}")
        assert reloaded_config.get('llmProvider') == 'Anthropic' or reloaded_config.get('testKey') == 'newTestValue'
    else:
        logger.error("Failed to save config.")

    # Test decryption failure (optional, by tampering with key or file)
    # For example, if you change the key or corrupt ENCRYPTED_CONFIG_FILE_PATH
    # key = get_encryption_key()
    # with open(ENCRYPTED_CONFIG_FILE_PATH, 'wb') as f:
    #     f.write(b'corrupted_data')
    # logger.info(f"Corrupted encrypted config file for testing decryption failure.")
    # failed_load_config = load_config()
    # logger.info(f"Config after attempting to load corrupted data: {failed_load_config}")

    logger.info("config_service.py tests finished.")
