# backend/llm_service.py
import logging
import os
from openai import OpenAI, OpenAIError
try:
    from anthropic import Anthropic, AnthropicError
except ImportError:
    Anthropic = None
    AnthropicError = Exception

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ["OpenAI", "Anthropic", "Mistral", "TogetherAI", "OpenRouter"]

class LLMServiceError(Exception):
    """Custom exception for LLM service errors."""
    pass

def get_llm_client(provider_name: str, api_key: str, base_url: str | None = None):
    """
    Initializes and returns an LLM client based on the provider name.
    For MVP, only OpenAI is supported.

    Args:
        provider_name (str): The name of the LLM provider (e.g., "OpenAI").
        api_key (str): The API key for the provider.
        base_url (str, optional): Custom base URL for API calls (e.g., for proxies or self-hosted).

    Returns:
        An instance of the LLM client (e.g., openai.OpenAI).

    Raises:
        LLMServiceError: If the provider is not supported or API key is missing.
    """
    if not api_key:
        raise LLMServiceError(f"API key is required for {provider_name} but was not provided.")

    if provider_name == "OpenAI":
        try:
            if base_url:
                logger.info(f"Initializing OpenAI client with custom base URL: {base_url}")
                client = OpenAI(api_key=api_key, base_url=base_url)
            else:
                logger.info("Initializing OpenAI client with default base URL.")
                client = OpenAI(api_key=api_key)
            return client
        except OpenAIError as e:
            logger.error(f"Failed to initialize OpenAI client: {e}", exc_info=True)
            raise LLMServiceError(f"OpenAI client initialization failed: {e}")
    
    elif provider_name == "Anthropic":
        if not Anthropic:
            raise LLMServiceError("Anthropic library not installed. Install with: pip install anthropic")
        try:
            logger.info("Initializing Anthropic client.")
            client = Anthropic(api_key=api_key)
            return client
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {e}", exc_info=True)
            raise LLMServiceError(f"Anthropic client initialization failed: {e}")
    
    elif provider_name == "Mistral":
        # Mistral AI uses OpenAI-compatible API
        try:
            mistral_base_url = base_url or "https://api.mistral.ai/v1"
            logger.info(f"Initializing Mistral client with base URL: {mistral_base_url}")
            client = OpenAI(api_key=api_key, base_url=mistral_base_url)
            return client
        except Exception as e:
            logger.error(f"Failed to initialize Mistral client: {e}", exc_info=True)
            raise LLMServiceError(f"Mistral client initialization failed: {e}")
    
    elif provider_name == "TogetherAI":
        # Together AI uses OpenAI-compatible API
        try:
            together_base_url = base_url or "https://api.together.xyz/v1"
            logger.info(f"Initializing TogetherAI client with base URL: {together_base_url}")
            client = OpenAI(api_key=api_key, base_url=together_base_url)
            return client
        except Exception as e:
            logger.error(f"Failed to initialize TogetherAI client: {e}", exc_info=True)
            raise LLMServiceError(f"TogetherAI client initialization failed: {e}")
    
    elif provider_name == "OpenRouter":
        # OpenRouter uses OpenAI-compatible API
        try:
            openrouter_base_url = base_url or "https://openrouter.ai/api/v1"
            logger.info(f"Initializing OpenRouter client with base URL: {openrouter_base_url}")
            client = OpenAI(api_key=api_key, base_url=openrouter_base_url)
            return client
        except Exception as e:
            logger.error(f"Failed to initialize OpenRouter client: {e}", exc_info=True)
            raise LLMServiceError(f"OpenRouter client initialization failed: {e}")
    
    else:
        logger.error(f"Unsupported LLM provider: {provider_name}")
        raise LLMServiceError(f"Unsupported LLM provider: {provider_name}. Supported: {SUPPORTED_PROVIDERS}")

async def generate_summary(
    text_to_summarize: str,
    client,
    model_name: str = "gpt-3.5-turbo", # Default model for summarization
    max_tokens: int = 150,
    temperature: float = 0.5
) -> str:
    """
    Generates a summary for the given text using the provided LLM client (OpenAI for MVP).

    Args:
        text_to_summarize (str): The text content to summarize.
        client: The initialized LLM client instance (e.g., from get_llm_client).
        model_name (str): The specific model to use (e.g., "gpt-3.5-turbo", "gpt-4-turbo-preview").
        max_tokens (int): Maximum number of tokens for the summary.
        temperature (float): Sampling temperature for generation.

    Returns:
        str: The generated summary.

    Raises:
        LLMServiceError: If summary generation fails.
    """
    if not text_to_summarize.strip():
        logger.warning("generate_summary called with empty or whitespace-only text.")
        return "(No content to summarize)"

    # Support multiple client types - OpenAI and OpenAI-compatible clients
    if not (isinstance(client, OpenAI) or (Anthropic and isinstance(client, Anthropic))):
        if not hasattr(client, 'chat') and not hasattr(client, 'messages'):
            raise LLMServiceError("Invalid client type for generate_summary. Expected OpenAI or Anthropic client.")

    try:
        logger.info(f"Generating summary with model: {model_name}, max_tokens: {max_tokens}")
        # Using await for client.chat.completions.create for async compatibility if client is async
        # If OpenAI client is synchronous, this would be: response = client.chat.completions.create(...)
        # The current OpenAI Python SDK v1.x.x uses synchronous calls by default.
        # For an async version, you'd use `AsyncOpenAI` client.
        # For simplicity with FastAPI, we'll assume sync client for now, but structure for async.
        # If this function is called from an async FastAPI endpoint, it will run in a thread pool.
        
        # System prompt for summarization
        system_prompt = (
            "You are a highly skilled AI assistant specialized in summarizing emails concisely. "
            "Focus on the key information, action items, and main topics. "
            "Keep the summary brief and to the point. Aim for 2-3 sentences unless the email is very long."
        )
        
        user_prompt = f"Please summarize the following email content:\n\n---\n{text_to_summarize}\n---"

        # Handle different client types
        if Anthropic and isinstance(client, Anthropic):
            # Anthropic API format
            response = client.messages.create(
                model=model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            summary = response.content[0].text.strip()
        else:
            # OpenAI/OpenAI-compatible API format
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                n=1,
                stop=None
            )
            summary = response.choices[0].message.content.strip()
        logger.info(f"Successfully generated summary. Length: {len(summary)} chars.")
        return summary
    except (OpenAIError, AnthropicError) as e:
        logger.error(f"LLM API error during summary generation: {e}", exc_info=True)
        raise LLMServiceError(f"Failed to generate summary due to LLM API error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during summary generation: {e}", exc_info=True)
        raise LLMServiceError(f"An unexpected error occurred while generating summary: {e}")

async def generate_reply_draft(
    email_thread_context: str, # Could be a string concatenation of messages, or a list of dicts
    user_instructions: str,
    client,
    model_name: str = "gpt-3.5-turbo", # Default model for drafting
    max_tokens: int = 300,
    temperature: float = 0.7
) -> str:
    """
    Generates a draft reply for an email thread based on context and instructions.
    (Stubbed for MVP - OpenAI implementation to be added)

    Args:
        email_thread_context (str): The context of the email thread (e.g., previous messages).
        user_instructions (str): Specific instructions from the user for the reply.
        client: The initialized LLM client instance.
        model_name (str): The specific model to use.
        max_tokens (int): Maximum number of tokens for the draft.
        temperature (float): Sampling temperature.

    Returns:
        str: The generated reply draft.

    Raises:
        LLMServiceError: If draft generation fails.
    """
    # Support multiple client types - OpenAI and OpenAI-compatible clients
    if not (isinstance(client, OpenAI) or (Anthropic and isinstance(client, Anthropic))):
        if not hasattr(client, 'chat') and not hasattr(client, 'messages'):
            raise LLMServiceError("Invalid client type for generate_reply_draft. Expected OpenAI or Anthropic client.")

    logger.info(f"Generating reply draft with model: {model_name} for instructions: '{user_instructions}'")
    
    system_prompt = (
        "You are an AI assistant helping a user draft replies to emails. "
        "Your goal is to write a clear, concise, and professional email reply based on the provided email thread context and user instructions. "
        "Adhere to the user's instructions precisely. If the instruction is to be brief, keep it short. "
        "Do not add any sign-off like 'Best regards' unless explicitly asked or it's part of the instruction. "
        "Focus solely on generating the body of the reply."
    )

    user_prompt = (
        f"Here is the email thread context:\n" 
        f"<email_thread_start>\n{email_thread_context}\n</email_thread_start>\n\n" 
        f"My instructions for the reply are:\n" 
        f"<user_instructions_start>\n{user_instructions}\n</user_instructions_start>\n\n" 
        f"Please generate ONLY the reply draft body based on these instructions and context."
    )

    try:
        # Handle different client types
        if Anthropic and isinstance(client, Anthropic):
            # Anthropic API format
            response = client.messages.create(
                model=model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            draft = response.content[0].text.strip()
        else:
            # OpenAI/OpenAI-compatible API format
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                n=1,
                stop=None
            )
            draft = response.choices[0].message.content.strip()
        logger.info(f"Successfully generated reply draft. Length: {len(draft)} chars.")
        return draft
    except (OpenAIError, AnthropicError) as e:
        logger.error(f"LLM API error during reply draft generation: {e}", exc_info=True)
        raise LLMServiceError(f"Failed to generate reply draft due to LLM API error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during reply draft generation: {e}", exc_info=True)
        raise LLMServiceError(f"An unexpected error occurred while generating reply draft: {e}")


# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    import asyncio
    logging.basicConfig(level=logging.INFO)
    logger.info("Testing llm_service.py...")

    # IMPORTANT: Set your OpenAI API key as an environment variable for this test to work
    # export OPENAI_API_KEY='your_key_here'
    test_api_key = os.environ.get("OPENAI_API_KEY")
    if not test_api_key:
        logger.error("OPENAI_API_KEY environment variable not set. Skipping live API tests.")
    else:
        try:
            # Test client creation
            logger.info("Testing OpenAI client creation...")
            # Use a dummy base_url for testing that path, or remove if not needed
            # test_base_url = "http://localhost:1234/v1" # Example for a local proxy
            # openai_client = get_llm_client("OpenAI", test_api_key, base_url=test_base_url)
            openai_client = get_llm_client("OpenAI", test_api_key)
            logger.info("OpenAI client created successfully.")

            # Test summary generation
            sample_email_text = (
                "Subject: Project Update & Next Steps\n\n"
                "Hi Team,\n\n"
                "Just a quick update on the Phoenix project. We've successfully completed Phase 1, and all deliverables are on track. "
                "Client feedback has been overwhelmingly positive, especially regarding the new UI mockups.\n\n"
                "For Phase 2, we need to focus on backend integration. Alice, please coordinate with Bob on the API specs. "
                "Charlie, can you start drafting the test cases for the new payment module? "
                "We have a deadline of EOW next Friday for the initial integration tests.\n\n"
                "Let's schedule a sync-up call for Monday AM to discuss any blockers. "
                "Please come prepared with your updates.\n\n"
                "Thanks,\nEve"
            )
            logger.info("\nTesting summary generation...")
            summary = asyncio.run(generate_summary(sample_email_text, openai_client, model_name="gpt-3.5-turbo"))
            logger.info(f"Generated Summary:\n{summary}")

            # Test reply draft generation
            email_context_for_reply = (
                "From: user@example.com\nTo: me@example.com\nSubject: Quick question\n\n"
                "Hi,\nCan you send me the report from last week's meeting?\nThanks!"
            )
            user_reply_instructions = "Tell them I'll send it by end of day today."
            logger.info("\nTesting reply draft generation...")
            draft = asyncio.run(generate_reply_draft(email_context_for_reply, user_reply_instructions, openai_client, model_name="gpt-3.5-turbo"))
            logger.info(f"Generated Draft:\n{draft}")

        except LLMServiceError as e:
            logger.error(f"LLM Service test failed: {e}")
        except OpenAIError as e:
            logger.error(f"OpenAI specific error during tests: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during tests: {e}", exc_info=True)

    logger.info("llm_service.py tests finished.")
