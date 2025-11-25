import os
from typing import Dict, Any
import anthropic
from dotenv import load_dotenv
from app.services.exercise_prompts import get_exercise_prompt, format_biomechanics_data

load_dotenv()


class ClaudeService:
    """Service for interacting with Claude API"""

    def __init__(self) -> None:
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
        exercise_type = biomechanics_data.get('exerciseType', 'Squat')
        exercise_prompt = get_exercise_prompt(exercise_type)
        formatted_data = format_biomechanics_data(biomechanics_data)

        message = await self.client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=450,
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

        # Extract text from response (first content block is always text for non-tool calls)
        content_block = message.content[0]
        if hasattr(content_block, 'text'):
            return content_block.text
        raise ValueError("Unexpected response format from Claude API")



_claude_service = None


def get_claude_service() -> ClaudeService:
    """Get or create the Claude service instance"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service
