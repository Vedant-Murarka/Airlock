import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5-coder:1.5b"

SYSTEM_PROMPT = """You are a Python error-fixing bot.
Do NOT output JSON. You must provide a brief explanation, and then provide the full fixed code inside a standard markdown python code block.

Example:
I fixed the division by zero error.
```python
x = 1 / 1
print(x)
```
"""


def extract_code_block(text: str):
    """Extracts python code from markdown block."""
    match = re.search(r'```(?:\s*python)?\s*(.*?)```', text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    

        
    return None

def get_patch(code: str, stderr: str, error_type: str) -> dict:
    prompt = f"""You are a senior Python engineer.

Error Type: {error_type}

Your task: Fix the code to resolve the error. Feel free to rewrite, add methods, or change architecture if necessary to properly fix the bug. Do NOT use try-except to just hide the error.

Return the full patched code in a markdown block.
Example:
```python
# your fixed code here
```

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
                "stream": False,
                "options": {
                    "temperature": 0.0,
                    "num_predict": 2048,
                    "num_ctx": 4096
                }
            },
            timeout=120
        )

        result = response.json()
        raw_output = result.get("response", "")

        print("\n=== RAW OUTPUT FROM OLLAMA ===")
        print(raw_output)
        print("================================\n")

        code_text = extract_code_block(raw_output)

        if code_text:
            return {
                "patched_code": code_text,
                "explanation": "Extracted from markdown response.",
                "confidence": 8
            }

    except Exception as e:
        print("LLM ERROR:", str(e))

    return {
        "patched_code": code,
        "explanation": "LLM output parsing failed or invalid response",
        "confidence": 1
    }