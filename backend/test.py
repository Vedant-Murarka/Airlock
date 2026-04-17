from repair_loop import run_repair_loop

code = """
x = 1/0
print(x)
"""

result = run_repair_loop(code)

print("\n===== FINAL RESULT =====")
print(result)