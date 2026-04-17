from llm import get_patch

result = get_patch(
    "print(1/0)",
    "ZeroDivisionError: division by zero"
)

print(result)
