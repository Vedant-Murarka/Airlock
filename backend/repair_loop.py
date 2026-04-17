from sandbox import run_code_in_sandbox
from llm import get_patch
from static_analyzer import analyze_code
from env_analyzer import detect_environment_issues
from optimizer import suggest_improvements

MAX_ATTEMPTS = 5


def is_same_code(a, b):
    return a.strip() == b.strip()


def is_lazy_fix(code):
    return "try:" in code and "except" in code


def is_large_change(old_code, new_code):
    old_lines = old_code.strip().split("\n")
    new_lines = new_code.strip().split("\n")

    if abs(len(old_lines) - len(new_lines)) > 3:
        return True

    changes = sum(1 for o, n in zip(old_lines, new_lines) if o != n)
    return changes > 3


def is_bad_fix(old_code, new_code):
    if len(new_code.strip()) < 3:
        return True

    old_tokens = set(old_code.split())
    new_tokens = set(new_code.split())

    overlap = len(old_tokens.intersection(new_tokens))

    return overlap < 1


def classify_error(stderr: str):
    s = stderr.lower()

    if "zerodivisionerror" in s:
        return "math"
    if "modulenotfounderror" in s:
        return "dependency"
    if "nameerror" in s:
        return "undefined_variable"
    if "typeerror" in s:
        return "type"
    if "indexerror" in s:
        return "index"
    if "syntaxerror" in s:
        return "syntax"

    return "unknown"


def run_repair_loop(code: str):
    attempts = []
    current_code = code
    seen_fixes = set()

    # 🔍 Layer 1: Static Analysis
    static_issues = analyze_code(code)

    for i in range(1, MAX_ATTEMPTS + 1):

        print(f"\n--- Attempt {i} ---")

        result = run_code_in_sandbox(current_code)
        stderr = result["stderr"]

        print("STDERR:", stderr)
        print("CURRENT CODE:\n", current_code)

        # 🌍 Layer 2: Environment Issues
        env_issues = detect_environment_issues(stderr)
        if env_issues:
            return {
                "success": False,
                "type": "environment",
                "issues": env_issues,
                "attempts": attempts,
                "static_analysis": static_issues
            }

        # ✅ SUCCESS
        if result["success"] and stderr.strip() == "":
            if not is_lazy_fix(current_code):
                return {
                    "success": True,
                    "final_code": current_code,
                    "attempts": attempts,
                    "static_analysis": static_issues,
                    "suggestions": suggest_improvements(current_code)
                }

        # 🧠 Classify error
        error_type = classify_error(stderr)
        print(f"🧠 Error Type: {error_type}")

        # 🔥 Ask LLM
        patch = get_patch(current_code, stderr, error_type)
        new_code = patch["patched_code"]
        confidence = patch.get("confidence", 0)

        print(f"🔧 Proposed fix (confidence {confidence}):")
        print(patch["explanation"])

        # ❌ Reject useless fixes
        if is_same_code(current_code, new_code):
            print("⚠️ No change — skipping")
            continue

        if is_bad_fix(current_code, new_code):
            print("⚠️ Bad fix detected — skipping")
            continue

        if is_large_change(current_code, new_code):
            print("⚠️ Large rewrite detected — rejecting")
            continue

        # ❌ Prevent repeated fixes
        fix_signature = (error_type, new_code.strip())
        if fix_signature in seen_fixes:
            print("⚠️ Repeated fix — skipping")
            continue

        seen_fixes.add(fix_signature)

        # ✅ Confidence-based acceptance
        if confidence >= 8:
            print("✅ High confidence fix accepted")
            current_code = new_code
        else:
            print("⚠️ Low confidence — still trying")
            current_code = new_code

        attempts.append({
            "attempt": i,
            "error": stderr,
            "fixed_code": new_code,
            "explanation": patch["explanation"],
            "confidence": confidence
        })

    return {
        "success": False,
        "final_code": current_code,
        "attempts": attempts,
        "static_analysis": static_issues,
        "suggestions": suggest_improvements(current_code)
    }