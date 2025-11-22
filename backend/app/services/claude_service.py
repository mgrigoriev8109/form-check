import os
from typing import Dict, Any
import anthropic
from dotenv import load_dotenv
from app.services.exercise_prompts import get_exercise_prompt, format_biomechanics_data
import time
import logging

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)


class ClaudeService:
    """Service for interacting with Claude API"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def analyze_form(self, biomechanics_data: Dict[str, Any]) -> str:
        """
        Analyze workout form using biomechanical keypoint data

        Args:
            biomechanics_data: Dictionary containing:
                - exerciseType: Type of exercise
                - keyPositions: Key positions in movement
                - temporalAnalysis: Temporal movement patterns
                - riskFlags: Automatically detected risk flags
                - allFramesData: Frame-by-frame metrics

        Returns:
            Detailed form analysis from Claude focused on injury prevention
        """
        start_time = time.time()

        exercise_type = biomechanics_data.get('exerciseType', 'Squat')

        # Get exercise-specific prompt
        exercise_prompt = get_exercise_prompt(exercise_type)

        # Format biomechanics data into readable text
        formatted_data = format_biomechanics_data(biomechanics_data)

        prep_time = time.time() - start_time
        logger.info(f"[TIMING] Prompt preparation: {prep_time:.3f}s")
        logger.info(f"[TIMING] System prompt: {len(exercise_prompt)} chars, Data: {len(formatted_data)} chars")

        # Make the API call (async) with prompt caching
        # The exercise prompt is cached (static), the data changes each request
        api_start = time.time()
        message = await self.client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=450,  # Optimized for concise analysis
            system=[
                {
                    "type": "text",
                    "text": exercise_prompt,
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": formatted_data,
                }
            ],
        )
        api_time = time.time() - api_start

        total_time = time.time() - start_time

        # Log cache performance
        usage = message.usage
        cache_read = getattr(usage, 'cache_read_input_tokens', 0)
        cache_creation = getattr(usage, 'cache_creation_input_tokens', 0)

        logger.info(f"[TIMING] Claude API call: {api_time:.3f}s")
        logger.info(f"[TIMING] Total backend analysis: {total_time:.3f}s")
        logger.info(f"[TOKENS] Input: {usage.input_tokens} | Output: {usage.output_tokens} | Cache read: {cache_read} | Cache created: {cache_creation}")

        # Extract the text response
        return message.content[0].text


# Singleton instance
_claude_service = None


def get_claude_service() -> ClaudeService:
    """Get or create the Claude service instance"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service
