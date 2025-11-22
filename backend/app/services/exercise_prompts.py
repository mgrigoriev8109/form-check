"""
Exercise-specific prompts for form analysis
Each exercise has unique biomechanical standards, injury risks, and correction cues
"""

SQUAT_PROMPT = """Analyze squat form as biomechanics expert. OPTIMAL: Hip 80-100°, Knee 70-110°, Torso 30-45°, Rise ratio 0.9-1.1. RISKS: Lean >45° or ratio >1.2 = spine injury; depth <100° hip = incomplete.

FORMAT:
1. Overall: Good/Needs Improvement/Poor
2. Issues: specific problems with data
3. Risks: HIGH/MED/LOW + structures
4. Fixes: actionable cues

Be direct."""

# Future exercises can be added here
DEADLIFT_PROMPT = """[Future implementation]"""
BENCH_PRESS_PROMPT = """[Future implementation]"""

# Exercise prompt mapping
EXERCISE_PROMPTS = {
    "squat": SQUAT_PROMPT,
    "deadlift": DEADLIFT_PROMPT,
    "bench": BENCH_PRESS_PROMPT,
}


def get_exercise_prompt(exercise_type: str) -> str:
    """
    Get the exercise-specific prompt for form analysis

    Args:
        exercise_type: Type of exercise (e.g., 'squat', 'deadlift')

    Returns:
        Detailed exercise-specific prompt string
    """
    # Normalize exercise type to lowercase
    normalized = exercise_type.lower().strip()

    # Return exercise-specific prompt, default to squat if not found
    return EXERCISE_PROMPTS.get(normalized, SQUAT_PROMPT)


def format_biomechanics_data(data: dict) -> str:
    """
    Format biomechanics data into a concise text format for the LLM

    Args:
        data: Biomechanics data dictionary from frontend

    Returns:
        Formatted string representation of the data
    """
    key_positions = data.get('keyPositions', {})
    temporal = data.get('temporalAnalysis', {})
    risk_flags = data.get('riskFlags', [])

    bottom = key_positions.get('bottomPosition', {})

    formatted = f"""SQUAT DATA ({data.get('frameCount', 0)} frames):

BOTTOM POSITION: Hip {bottom.get('hipAngle', 'N/A')}° | Knee {bottom.get('kneeAngle', 'N/A')}° | Torso {bottom.get('torsoLean', 'N/A')}° | Neck {bottom.get('neckAngle', 'N/A')}°

MOVEMENT PATTERNS: Rise ratio {temporal.get('riseRateRatio', 'N/A')} | Max lean {temporal.get('maxTorsoLean', 'N/A')}° | Min hip angle {temporal.get('minHipAngle', 'N/A')}°

RISK FLAGS: {', '.join(risk_flags) if risk_flags else 'None detected'}"""

    return formatted
