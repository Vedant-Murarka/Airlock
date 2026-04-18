import re

def parse_line_number(stderr: str):
    """Extracts the line number from the standard Python traceback."""
    # Look for the typical Traceback line indicator
    match = re.search(r'line (\d+)', stderr)
    if match:
        return int(match.group(1))
    return None

def attempt_fast_path(code: str, stderr: str, error_type: str):
    """Attempts to instantly fix common trivial errors without an LLM."""
    line_num = parse_line_number(stderr)
    if not line_num:
        return None
        
    lines = code.split("\n")
    if line_num > len(lines) or line_num <= 0:
        return None
        
    faulty_line_idx = line_num - 1
    faulty_line = lines[faulty_line_idx]
    
    # Heuristic 1: ZeroDivisionError
    if error_type == "math" and "ZeroDivisionError" in stderr:
        if "/0" in faulty_line.replace(" ", "") or "//0" in faulty_line.replace(" ", ""):
            fixed_line = re.sub(r'//?\s*0', '/ 1', faulty_line)
            lines[faulty_line_idx] = fixed_line
            return {
                "patched_code": "\n".join(lines),
                "explanation": "Fast-Path: Auto-fixed ZeroDivisionError by changing 0 to 1.",
                "confidence": 10
            }

    # Heuristic 2: Missing Colon
    if error_type == "syntax" and "expected ':'" in stderr:
        fixed_line = faulty_line.rstrip() + ":"
        lines[faulty_line_idx] = fixed_line
        return {
             "patched_code": "\n".join(lines),
             "explanation": "Fast-Path: Auto-added missing colon.",
             "confidence": 10
        }

    return None
