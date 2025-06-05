import pytest
import json
from unittest.mock import patch, Mock
from openai import OpenAIError
from anthropic import APIError

from llm_service import (
    get_llm_client, generate_summary, generate_reply_draft,
    LLMServiceError, _format_email_for_llm, _parse_llm_response
)

class TestLLMService:
    """Unit tests for llm_service.py"""

    def test_format_email_for_llm(self, sample_email):
        """Test formatting email for LLM processing."""
        formatted = _format_email_for_llm(sample_email)
        
        assert "Subject: Test Email" in formatted
        assert "From: Test Sender <test@example.com>" in formatted
        assert "This is a test email content" in formatted

    def test_parse_llm_response_valid_json(self):
        """Test parsing valid JSON response from LLM."""
        response_text = json.dumps({
            "summary": "Test summary",
            "action_required": True,
            "priority": "high"
        })
        
        result = _parse_llm_response(response_text)
        
        assert result["summary"] == "Test summary"
        assert result["action_required"] is True
        assert result["priority"] == "high"

    def test_parse_llm_response_invalid_json(self):
        """Test parsing invalid JSON response from LLM."""
        response_text = "This is not valid JSON"
        
        with pytest.raises(LLMServiceError, match="Failed to parse LLM response"):
            _parse_llm_response(response_text)

    @patch('llm_service.OpenAI')
    def test_get_llm_client_openai(self, mock_openai_class, sample_config):
        """Test getting OpenAI client."""
        mock_client = Mock()
        mock_openai_class.return_value = mock_client
        
        config = sample_config.copy()
        config["llm"]["provider"] = "openai"
        
        client = get_llm_client(config)
        
        assert client == mock_client
        mock_openai_class.assert_called_once_with(api_key="test-api-key")

    @patch('llm_service.anthropic.Anthropic')
    def test_get_llm_client_anthropic(self, mock_anthropic_class, sample_config):
        """Test getting Anthropic client."""
        mock_client = Mock()
        mock_anthropic_class.return_value = mock_client
        
        config = sample_config.copy()
        config["llm"]["provider"] = "anthropic"
        
        client = get_llm_client(config)
        
        assert client == mock_client
        mock_anthropic_class.assert_called_once_with(api_key="test-api-key")

    def test_get_llm_client_unsupported_provider(self, sample_config):
        """Test getting client for unsupported provider."""
        config = sample_config.copy()
        config["llm"]["provider"] = "unsupported"
        
        with pytest.raises(LLMServiceError, match="Unsupported LLM provider"):
            get_llm_client(config)

    def test_get_llm_client_missing_api_key(self, sample_config):
        """Test getting client with missing API key."""
        config = sample_config.copy()
        del config["llm"]["api_key"]
        
        with pytest.raises(LLMServiceError, match="API key not found"):
            get_llm_client(config)

    @patch('llm_service.load_config')
    @patch('llm_service.get_llm_client')
    def test_generate_summary_openai(self, mock_get_client, mock_load_config, 
                                   sample_email, sample_config, mock_openai_client):
        """Test generating summary with OpenAI."""
        mock_load_config.return_value = sample_config
        mock_get_client.return_value = mock_openai_client
        
        result = generate_summary(sample_email)
        
        assert result["summary"] == "Test summary"
        assert result["action_required"] is True
        mock_openai_client.chat.completions.create.assert_called_once()

    @patch('llm_service.load_config')
    @patch('llm_service.get_llm_client')
    def test_generate_summary_anthropic(self, mock_get_client, mock_load_config,
                                      sample_email, sample_config, mock_anthropic_client):
        """Test generating summary with Anthropic."""
        config = sample_config.copy()
        config["llm"]["provider"] = "anthropic"
        mock_load_config.return_value = config
        mock_get_client.return_value = mock_anthropic_client
        
        result = generate_summary(sample_email)
        
        assert result["summary"] == "Test summary"
        assert result["action_required"] is True
        mock_anthropic_client.messages.create.assert_called_once()

    @patch('llm_service.load_config')
    @patch('llm_service.get_llm_client')
    def test_generate_reply_draft_openai(self, mock_get_client, mock_load_config,
                                       sample_email, sample_config, mock_openai_client):
        """Test generating reply draft with OpenAI."""
        mock_load_config.return_value = sample_config
        mock_get_client.return_value = mock_openai_client
        
        # Mock response for reply generation
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Thank you for your email. I will respond soon."
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        result = generate_reply_draft(sample_email, "Please generate a professional reply")
        
        assert result == "Thank you for your email. I will respond soon."
        mock_openai_client.chat.completions.create.assert_called_once()

    @patch('llm_service.load_config')
    @patch('llm_service.get_llm_client')
    def test_generate_summary_openai_error(self, mock_get_client, mock_load_config,
                                         sample_email, sample_config):
        """Test handling OpenAI API errors."""
        mock_load_config.return_value = sample_config
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = OpenAIError("API Error")
        mock_get_client.return_value = mock_client
        
        with pytest.raises(LLMServiceError, match="OpenAI API error"):
            generate_summary(sample_email)

    @patch('llm_service.load_config')
    @patch('llm_service.get_llm_client')
    def test_generate_summary_anthropic_error(self, mock_get_client, mock_load_config,
                                            sample_email, sample_config):
        """Test handling Anthropic API errors."""
        config = sample_config.copy()
        config["llm"]["provider"] = "anthropic"
        mock_load_config.return_value = config
        
        mock_client = Mock()
        mock_client.messages.create.side_effect = APIError("API Error")
        mock_get_client.return_value = mock_client
        
        with pytest.raises(LLMServiceError, match="Anthropic API error"):
            generate_summary(sample_email)

    @patch('llm_service.load_config')
    def test_generate_summary_no_config(self, mock_load_config, sample_email):
        """Test generating summary with no LLM configuration."""
        mock_load_config.return_value = {}
        
        with pytest.raises(LLMServiceError, match="LLM configuration not found"):
            generate_summary(sample_email)

    @patch('llm_service.load_config')
    @patch('llm_service.get_llm_client')
    def test_generate_summary_malformed_response(self, mock_get_client, mock_load_config,
                                               sample_email, sample_config):
        """Test handling malformed LLM response."""
        mock_load_config.return_value = sample_config
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Not valid JSON"
        mock_client.chat.completions.create.return_value = mock_response
        mock_get_client.return_value = mock_client
        
        with pytest.raises(LLMServiceError, match="Failed to parse LLM response"):
            generate_summary(sample_email)

    def test_llm_service_error_inheritance(self):
        """Test that LLMServiceError inherits from Exception."""
        error = LLMServiceError("Test error")
        assert isinstance(error, Exception)
        assert str(error) == "Test error"