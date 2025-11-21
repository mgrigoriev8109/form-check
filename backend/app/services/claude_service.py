import os
import json
from typing import List, Dict, Any
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

    async def analyze_form(self, frames: List[str], exercise_type: str) -> Dict[str, Any]:
        """
        Analyze workout form using Claude's vision capabilities

        Args:
            frames: List of base64 encoded image frames from the video
            exercise_type: Type of exercise being performed

        Returns:
            Structured form analysis as a dictionary
        """

        # Construct the prompt for form analysis
        prompt = f"""You are an expert personal trainer analyzing {exercise_type} form from video frames.

Provide your analysis as valid JSON with this exact structure:
{{
  "keyObservations": ["observation 1", "observation 2", "observation 3"],
  "safetyConcerns": ["concern 1", "concern 2"] or [],
  "recommendations": ["recommendation 1", "recommendation 2"],
}}

Be concise - limit each point to 1-2 sentences. Focus on actionable feedback.
Return ONLY the JSON, no additional text."""


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

        # Make the API call (async) using Haiku for speed
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
        response_text = message.content[0].text

        # Strip markdown code fences if present (Claude sometimes wraps JSON in ```json ... ```)
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]  # Remove ```json
        elif response_text.startswith("```"):
            response_text = response_text[3:]  # Remove ```

        if response_text.endswith("```"):
            response_text = response_text[:-3]  # Remove trailing ```

        response_text = response_text.strip()

        # Parse JSON response
        try:
            analysis_data = json.loads(response_text)
            return analysis_data
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return a structured error with the raw response
            raise ValueError(
                f"Failed to parse Claude response as JSON: {str(e)}. "
                f"Raw response: {response_text[:200]}"
            )


# Singleton instance
_claude_service = None


def get_claude_service() -> ClaudeService:
    """Get or create the Claude service instance"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service
