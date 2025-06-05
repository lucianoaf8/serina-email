import pytest
import json
import os
import tempfile
from unittest.mock import patch, mock_open
from cryptography.fernet import Fernet

from config_service import (
    load_config, save_config, get_encryption_key, 
    _generate_key, _encrypt_config, _decrypt_config
)

class TestConfigService:
    """Unit tests for config_service.py"""

    def test_generate_key(self):
        """Test key generation."""
        key = _generate_key()
        assert isinstance(key, bytes)
        assert len(key) == 44  # Fernet key length

    def test_get_encryption_key_from_env(self):
        """Test getting encryption key from environment variable."""
        test_key = Fernet.generate_key()
        with patch.dict(os.environ, {'SERINA_ENCRYPTION_KEY': test_key.decode()}):
            key = get_encryption_key()
            assert key == test_key

    def test_get_encryption_key_from_file(self, temp_config_dir):
        """Test getting encryption key from file."""
        test_key = Fernet.generate_key()
        key_file = os.path.join(temp_config_dir, '.encryption_key')
        
        with open(key_file, 'wb') as f:
            f.write(test_key)
        
        with patch('config_service.KEY_FILE_PATH', key_file):
            key = get_encryption_key()
            assert key == test_key

    def test_get_encryption_key_generates_new(self, temp_config_dir):
        """Test generating new key when none exists."""
        key_file = os.path.join(temp_config_dir, '.encryption_key')
        
        with patch('config_service.KEY_FILE_PATH', key_file):
            key = get_encryption_key()
            assert isinstance(key, bytes)
            assert os.path.exists(key_file)

    def test_encrypt_decrypt_config(self):
        """Test config encryption and decryption."""
        test_config = {"test": "value", "nested": {"key": "val"}}
        key = Fernet.generate_key()
        
        encrypted = _encrypt_config(test_config, key)
        assert isinstance(encrypted, bytes)
        
        decrypted = _decrypt_config(encrypted, key)
        assert decrypted == test_config

    def test_save_and_load_config(self, temp_config_dir, sample_config):
        """Test saving and loading configuration."""
        config_file = os.path.join(temp_config_dir, 'config.json')
        schema_file = os.path.join(temp_config_dir, 'settings_schema.json')
        
        # Create minimal schema
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "llm": {"type": "object"},
                "email": {"type": "object"},
                "database": {"type": "object"}
            }
        }
        with open(schema_file, 'w') as f:
            json.dump(schema, f)
        
        with patch('config_service.CONFIG_FILE_PATH', config_file), \
             patch('config_service.SCHEMA_FILE_PATH', schema_file):
            
            # Save config
            save_config(sample_config)
            assert os.path.exists(config_file)
            
            # Load config
            loaded_config = load_config()
            assert loaded_config == sample_config

    def test_load_config_missing_file(self, temp_config_dir):
        """Test loading config when file doesn't exist."""
        config_file = os.path.join(temp_config_dir, 'nonexistent.json')
        
        with patch('config_service.CONFIG_FILE_PATH', config_file), \
             patch('config_service.ENCRYPTED_CONFIG_FILE_PATH', config_file + '.enc'):
            
            config = load_config()
            assert config == {}

    @pytest.mark.parametrize("invalid_config", [
        {"invalid": "structure"},
        {"llm": "should_be_object"},
        None
    ])
    def test_save_config_validation_error(self, temp_config_dir, invalid_config):
        """Test saving invalid configuration."""
        schema_file = os.path.join(temp_config_dir, 'settings_schema.json')
        
        # Create strict schema
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "required": ["llm"],
            "properties": {
                "llm": {"type": "object", "required": ["provider"]}
            }
        }
        with open(schema_file, 'w') as f:
            json.dump(schema, f)
        
        with patch('config_service.SCHEMA_FILE_PATH', schema_file):
            with pytest.raises(Exception):  # Should raise validation error
                save_config(invalid_config)