import os
from typing import List
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class ClaudeService:
    """Service for interacting with Claude API"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def analyze_form(self, frames: List[str], exercise_type: str) -> str:
        """
        Analyze workout form using Claude's vision capabilities

        Args:
            frames: List of base64 encoded image frames from the video
            exercise_type: Type of exercise being performed

        Returns:
            Detailed form analysis from Claude
        """

        # Construct the prompt for form analysis
        prompt = f"""You are an expert personal trainer and movement coach. Analyze the {exercise_type} form in these video frames.

Please provide:
1. Overall form assessment (good, needs improvement, or poor)
2. Specific observations about key movement points (setup, execution, completion)
3. Safety concerns if any
4. Concrete recommendations for improvement
5. Positive aspects of the form

Be encouraging but honest. Focus on actionable feedback."""

        # Build the message content with images
        content = [{"type": "text", "text": prompt}]

        # Add frames as images (Claude supports multiple images)
        for frame in frames:
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": frame,
                },
            })

        # Make the API call (async)
        message = await self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": content,
                }
            ],
        )

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
