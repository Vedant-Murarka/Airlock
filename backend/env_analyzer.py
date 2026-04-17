import re

def detect_environment_issues(stderr: str):
    issues = []

    # Missing package
    match = re.search(r"No module named '(.+)'", stderr)
    if match:
        pkg = match.group(1)
        issues.append({
            "type": "MissingPackage",
            "message": f"Missing package: {pkg}",
            "fix": f"pip install {pkg}"
        })

    # File not found
    if "FileNotFoundError" in stderr:
        issues.append({
            "type": "File",
            "message": "File not found. Check path."
        })

    # CORS (for APIs)
    if "CORS" in stderr or "Cross-Origin" in stderr:
        issues.append({
            "type": "CORS",
            "message": "CORS issue detected",
            "fix": "Enable CORSMiddleware in backend"
        })

    return issues