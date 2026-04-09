"""
gemini_service.py — AI explanation generation using Google Gemini 1.5 Flash.

WHY Gemini over Claude/OpenAI?
- Gemini 1.5 Flash: FREE tier = 1500 requests/day, 15 requests/min
- No credit card required for free tier
- Fast response (~0.5-1s for short completions)
- Claude API and OpenAI both require paid accounts

HOW TO GET YOUR FREE API KEY:
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to backend/.env:  GEMINI_API_KEY=your_key_here
"""
import httpx
import os

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
)


async def get_explanation(question_text: str, correct_answer: str) -> str | None:
    """
    Generate a 1-2 sentence explanation for why an answer is correct.
    Returns None if API key not configured or request fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return None

    prompt = (
        f"Question: {question_text}\n"
        f"Correct answer: {correct_answer}\n\n"
        "In 1-2 sentences, explain why this answer is correct. "
        "Be clear, concise, and student-friendly. "
        "Do not repeat the question or answer — just explain the concept."
    )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": 100,
                        "temperature": 0.3,  # low temperature = more factual, less creative
                    },
                },
            )
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"].strip()
    except Exception:
        pass
    return None
