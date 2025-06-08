"""
SERINA LLM Service - Simplified for MVP
Supports OpenAI and OpenRouter only
"""

import openai
import requests
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, provider: str = "openai", api_key: str = None):
        self.provider = provider.lower()
        self.api_key = api_key
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the LLM client based on provider."""
        if self.provider == "openai":
            self.client = openai.OpenAI(api_key=self.api_key)
            self.model = "gpt-3.5-turbo"
        elif self.provider == "openrouter":
            self.client = openai.OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.api_key
            )
            self.model = "anthropic/claude-3-haiku"  # Good balance of speed/cost
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
        
        logger.info(f"Initialized LLM service with {self.provider}")
    
    def generate_email_summary(self, email_content: str) -> str:
        """Generate a concise summary of an email."""
        prompt = f"""
Summarize this email in 2-3 sentences. Focus on:
- Main purpose/request
- Any action needed
- Important details

Email content:
{email_content[:2000]}  # Limit content to avoid token limits
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI assistant that creates concise email summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            logger.info("Generated email summary")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate email summary: {e}")
            return "Unable to generate summary at this time."
    
    def generate_task_description(self, email_content: str, email_subject: str) -> Dict[str, str]:
        """Generate task title and description based on email content."""
        prompt = f"""
Based on this email, create a task title and description:

Subject: {email_subject}
Content: {email_content[:1500]}

Respond with:
Title: [Clear, actionable task title]
Description: [Brief description of what needs to be done]
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI assistant that creates actionable tasks from emails."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse the response
            lines = content.split('\n')
            title = "Follow up on email"
            description = "Review and respond to email"
            
            for line in lines:
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Description:"):
                    description = line.replace("Description:", "").strip()
            
            logger.info("Generated task from email")
            return {"title": title, "description": description}
            
        except Exception as e:
            logger.error(f"Failed to generate task: {e}")
            return {
                "title": f"Follow up: {email_subject}",
                "description": "Review and respond to this email"
            }
    
    def generate_reply_draft(self, email_content: str, user_instruction: str = "") -> str:
        """Generate a draft reply to an email."""
        instruction = user_instruction or "Write a professional, helpful reply"
        
        prompt = f"""
Write a professional email reply based on:

Original email: {email_content[:1500]}

Instructions: {instruction}

Write only the reply body (no subject line, no signature):
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI assistant that writes professional email replies."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.5
            )
            
            reply = response.choices[0].message.content.strip()
            logger.info("Generated email reply draft")
            return reply
            
        except Exception as e:
            logger.error(f"Failed to generate reply: {e}")
            return "Thank you for your email. I'll review this and get back to you soon."
    
    def test_connection(self) -> bool:
        """Test if the LLM service is working."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            return True
        except Exception as e:
            logger.error(f"LLM connection test failed: {e}")
            return False

# Factory function to create LLM service instances
def create_llm_service(provider: str, api_key: str) -> LLMService:
    """Create an LLM service instance."""
    return LLMService(provider=provider, api_key=api_key)