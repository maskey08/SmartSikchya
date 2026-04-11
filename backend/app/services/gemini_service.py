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
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3-flash-preview:generateContent"
)


async def get_explanation(question_text: str, correct_answer: str) -> str | None:
    """
    Generate a 1-2 sentence explanation for why an answer is correct.
    Returns None if API key not configured or request fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    print(api_key);
    if not api_key:
        return None

    prompt = f"""
                You are a helpful tutor.

                Question: {question_text}
                Correct answer: {correct_answer}

                Explain clearly in 2-3 short sentences:
                - Why this answer is correct
                - Keep it simple and direct
                DO NOT repeat the question or answer — just explain the concept.
                DO NOT be incomplete.
            """

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": 1000,
                        "temperature": 0.3,  # low temperature = more factual, less creative
                        "candidateCount": 1
                    },
                },
            )
            data = resp.json()
            print("Response:", resp.text) # Debug log
            candidates = data.get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print("Gemini error:", e)
    return None
