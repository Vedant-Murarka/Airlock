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


def analyze_complexity(code: str) -> dict:
    prompt = f"""You are an expert Python algorithmic optimizer.

Analyze the time complexity (Big O) and space complexity of the following code.
KEEP YOUR EXPLANATION EXTREMELY SHORT. Maximum 2 sentences for Time Complexity and 2 sentences for Space Complexity. Do not write long paragraphs. 
Then provide a heavily optimized version of the code if possible.
Return the optimized code in a markdown block.

Code:
{code}
"""

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "system": "You are a Time Complexity Analyzer. Do NOT output JSON. Return a brief explanation followed by the optimized code in a standard markdown python code block.",
        "stream": False,
        "options": {
            "temperature": 0.0,
            "num_predict": 2048,
            "num_ctx": 4096
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        raw_output = response.json().get("response", "")

        print("\n=== RAW OUTPUT FROM OPTIMIZER ===")
        print(raw_output)
        print("================================\n")

        code_text = extract_code_block(raw_output)

        return {
            "optimized_code": code_text if code_text else code,
            "explanation": raw_output
        }

    except Exception as e:
        print("OPTIMIZER ERROR:", str(e))

    return {
        "optimized_code": code,
        "explanation": "Optimizer failed to respond."
    }

def get_patch_stream(code: str, stderr: str, error_type: str):
    prompt = f"""You are a senior Python engineer.

Error Type: {error_type}

Your task: Fix the code to resolve the error. Feel free to rewrite, add methods, or change architecture if necessary to properly fix the bug. Do NOT use try-except to just hide the error.

Return the full patched code in a markdown block. DO NOT include any explanations or conversational text. Return ONLY the code block.

Code:
{code}

Error:
{stderr}
"""

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.0,
            "num_predict": 1024,
            "num_ctx": 2048
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=120)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                token = chunk.get("response", "")
                if token:
                    yield token
    except Exception as e:
        print("LLM STREAM ERROR:", str(e))
        yield f"\n[LLM Error: {str(e)}]"