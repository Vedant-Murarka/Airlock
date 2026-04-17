import subprocess
import tempfile
import os
import uuid

def run_code_in_sandbox(code: str) -> dict:
    tmp_dir = tempfile.mkdtemp()
    code_file = os.path.join(tmp_dir, f"{uuid.uuid4().hex}.py")

    with open(code_file, "w") as f:
        f.write(code)

    cmd = [
        "docker", "run",
        "--rm",
        "--network=none",
        "--memory=256m",
        "--memory-swap=256m",
        "--cpus=0.5",
        "--pids-limit=50",
        "--read-only",
        "--tmpfs", "/tmp:size=64m",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--user=1000:1000",
        "-v", f"{code_file}:/sandbox/code.py:ro",
        "solaris-sandbox",
        "python", "/sandbox/code.py"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )

        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode,
            "success": result.returncode == 0
        }

    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution timed out",
            "exit_code": -1,
            "success": False
        }

    finally:
        os.remove(code_file)
        os.rmdir(tmp_dir)