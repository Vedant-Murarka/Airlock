import ast
from sandbox import run_code_in_sandbox
from llm import get_patch
from static_analyzer import analyze_code
from env_analyzer import detect_environment_issues
from optimizer import suggest_improvements

MAX_ATTEMPTS = 5

COMMON_TYPOS = {
    "pritn": "print",
    "improt": "import",
    "reutrn": "return",
}


# =========================
# 🔧 PREPROCESSING
# =========================

def quick_fix_typos(code: str):
    for wrong, correct in COMMON_TYPOS.items():
        code = code.replace(wrong, correct)
    return code


def detect_syntax_errors(code: str):
    try:
        ast.parse(code)
        return None
    except SyntaxError as e:
        return str(e)


# =========================
# 🛡️ SAFETY FILTERS
# =========================

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

    if not new_code.strip():
        return True

    old_len = len(old_code.strip())
    new_len = len(new_code.strip())

    if new_len < old_len * 0.5 and old_len > 10:
        return True

    if old_code.strip() == new_code.strip():
        return True

    return False


# =========================
# 🧠 ERROR CLASSIFIER
# =========================

def classify_error(stderr: str):
    s = stderr.lower()

    if "syntaxerror" in s or "invalid syntax" in s:
        return "syntax"
    if "indentationerror" in s:
        return "syntax"
    if "zerodivisionerror" in s:
        return "math"
    if "modulenotfounderror" in s:
        return "dependency"
    if "nameerror" in s:
        return "undefined_variable"
    if "attributeerror" in s:
        return "attribute"
    if "typeerror" in s:
        return "type"
    if "indexerror" in s:
        return "index"

    return "unknown"


# =========================
# 🔁 MAIN LOOP
# =========================

def run_repair_loop(code: str):
    attempts = []
    original_code = code

    # 🔹 Step 0: Typo Fix
    code = quick_fix_typos(code)

    # 🔹 Step 1: Pre-execution Syntax Fix
    syntax_error = detect_syntax_errors(code)
    if syntax_error:
        print("⚠️ Pre-execution syntax error detected")

        patch = get_patch(code, syntax_error, "syntax")
        fixed_code = patch["patched_code"]
        
        # Add pre-execution fix to attempts so frontend can display it
        attempts.append({
            "attempt": 0,
            "error": syntax_error,
            "fixed_code": fixed_code,
            "explanation": patch["explanation"],
            "confidence": patch.get("confidence", 0)
        })
        
        code = fixed_code

    current_code = code
    seen_fixes = set()

    # 🔍 Static Analysis
    static_issues = analyze_code(code)

    for i in range(1, MAX_ATTEMPTS + 1):

        print(f"\n--- Attempt {i} ---")

        result = run_code_in_sandbox(current_code)

        print("=== SANDBOX RESULT ===")
        print("STDOUT:", result["stdout"])
        print("STDERR:", result["stderr"])
        print("EXIT CODE:", result["exit_code"])
        print("SUCCESS:", result["success"])
        print("======================")

        stderr = result["stderr"]

        print("CURRENT CODE:\n", current_code)

        # 🌍 Environment Issues
        env_issues = detect_environment_issues(stderr)
        if env_issues:
            return {
                "success": False,
                "type": "environment",
                "issues": env_issues,
                "attempts": attempts,
                "static_analysis": static_issues
            }

        # ✅ Success
        if result["success"] and stderr.strip() == "":
            if not is_lazy_fix(current_code):
                return {
                    "success": True,
                    "final_code": current_code,
                    "attempts": attempts,
                    "static_analysis": static_issues,
                    "suggestions": suggest_improvements(current_code)
                }

        # 🧠 Classify Error
        error_type = classify_error(stderr)
        print(f"🧠 Error Type: {error_type}")

        # 🔧 LLM Fix
        patch = get_patch(current_code, stderr, error_type)
        new_code = patch["patched_code"]
        confidence = patch.get("confidence", 0)

        print(f"🔧 Proposed fix (confidence {confidence}):")
        print(patch["explanation"])

        # ❌ Reject bad fixes
        if is_same_code(current_code, new_code):
            print("⚠️ No change — skipping")
            continue

        if is_bad_fix(current_code, new_code):
            print("⚠️ Bad fix detected — skipping")
            continue

        if is_large_change(current_code, new_code):
            print("⚠️ Large rewrite detected — rejecting")
            continue

        # ❌ Prevent repeats
        fix_signature = (error_type, new_code.strip())
        if fix_signature in seen_fixes:
            print("⚠️ Repeated fix — skipping")
            continue

        seen_fixes.add(fix_signature)

        # ✅ Accept fix
        if confidence >= 8:
            print("✅ High confidence fix accepted")
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