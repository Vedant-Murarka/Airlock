import ast

def analyze_code(code: str):
    issues = []

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return [{
            "type": "Syntax",
            "message": str(e),
            "line": e.lineno
        }]

    for node in ast.walk(tree):

        # Detect unreachable conditions
        if isinstance(node, ast.If):
            try:
                value = ast.literal_eval(node.test)
                issues.append({
                    "type": "Logic",
                    "message": f"Condition always {value}",
                    "line": node.lineno
                })
            except:
                pass

        # Detect bad loops
        if isinstance(node, ast.While):
            if isinstance(node.test, ast.Compare):
                issues.append({
                    "type": "Loop",
                    "message": "Check loop condition carefully",
                    "line": node.lineno
                })

    return issues