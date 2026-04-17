import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "deepseek-coder:6.7b"

SYSTEM_PROMPT = """You are a senior Python engineer.

You MUST:
- Fix ROOT CAUSE of the error
- NEVER use try-except to hide errors
- NEVER return unchanged code
- ALWAYS modify faulty logic
- ONLY make minimal necessary changes

Return ONLY JSON:
{
  "patched_code": "...",
  "explanation": "...",
  "confidence": 8
}
"""


def clean_output(text: str) -> str:
    text = re.sub(r"```json|```", "", text)
    return text.strip()


def extract_json(text: str):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    return None


def get_patch(code: str, stderr: str, error_type: str) -> dict:
    prompt = f"""You are a senior Python engineer.

Error Type: {error_type}

Your task: Fix the code with MINIMAL changes.

STRICT RULES:
- Modify ONLY faulty lines
- DO NOT rewrite entire program
- PRESERVE structure and variables
- DO NOT use try-except to hide errors

Guidance:
- math → fix invalid math (e.g., 1/0 → 1/1)
- syntax → fix syntax issues
- type → fix incorrect types
- undefined_variable → define missing variables
- dependency → correct import

Return ONLY JSON:
{{
  "patched_code": "...",
  "explanation": "...",
  "confidence": 8
}}

Code:
{code}

Error:
{stderr}
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "system": SYSTEM_PROMPT,
                "stream": False
            },
            timeout=30
        )

        result = response.json()
        raw_output = result.get("response", "")

        print("\n=== RAW OUTPUT FROM OLLAMA ===")
        print(raw_output)
        print("================================\n")

        cleaned = clean_output(raw_output)
        json_text = extract_json(cleaned)

        if json_text:
            try:
                parsed = json.loads(json_text)

                if all(k in parsed for k in ["patched_code", "explanation", "confidence"]):
                    return parsed

            except json.JSONDecodeError:
                pass

    except Exception as e:
        print("LLM ERROR:", str(e))

    return {
        "patched_code": code,
        "explanation": "LLM output parsing failed or invalid response",
        "confidence": 1
    }