def suggest_improvements(code: str):
    suggestions = []

    if "for i in range(len(" in code:
        suggestions.append("Use enumerate() instead of range(len())")

    if "except:" in code:
        suggestions.append("Avoid bare except — catch specific exceptions")

    if "eval(" in code:
        suggestions.append("Avoid eval() — security risk")

    if "open(" in code and "with open" not in code:
        suggestions.append("Use 'with open()' to safely handle files")

    return suggestions