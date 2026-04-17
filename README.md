# 🛡️ Airlock: Autonomous Offline Code Repair

**Airlock** is a privacy-first, autonomous debugging engine designed for secure development. It captures runtime errors, classifies them using AST (Abstract Syntax Trees), and utilizes a local Large Language Model (DeepSeek-Coder) to iteratively patch code within a **hardened, air-gapped Docker sandbox.**

---

## ✨ Key Features

* **🔒 Zero-Leak Environment:** Entirely local execution via Ollama and Docker. Your code never leaves your machine—perfect for proprietary or sensitive projects.
* **🧪 Hardened Sandbox:** Executes untrusted code fixes in a restricted Docker container with **no network access**, read-only file systems, and strict resource limits (256MB RAM).
* **🔄 Autonomous Repair Loop:** Automatically classifies errors (Syntax, Logic, Math, etc.) and retries fixes up to 5 times using a "Verify-then-Accept" logic.
* **🧐 Heuristic Analysis:** Uses AST to detect unreachable code, infinite loops, and "code smells" before the AI even starts.
* **📜 Audit Trail:** Provides a full reasoning trace for every attempt, explaining *why* the AI made specific logic decisions.

---

## 🏗️ Technical Architecture

Airlock follows a **Multi-Stage Repair Loop** to ensure code is not just fixed, but verified.

1.  **Preprocessing:** Sanitizes common typos and validates basic syntax.
2.  **Static Analysis:** The `ast` module scans for structural issues and logic flaws (like unreachable `if` statements).
3.  **Secure Execution:** Code is deployed to a **Dockerized Sandbox** (non-root user, no network) to capture real-time `stderr`.
4.  **Error Classification:** `stderr` is parsed and mapped to specific error categories to guide the LLM.
5.  **Local LLM Repair:** If the code fails, `llm.py` sends the context to **DeepSeek-Coder-6.7b** via **Ollama**.
6.  **Safety Filters:** Patches are rejected if they are "lazy" (empty `except` blocks) or too large of a rewrite.
7.  **Validation:** The new patch is re-run in the sandbox. If it passes with `exit_code 0`, it's returned to the user.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Lucide Icons, React Resizable Panels |
| **Backend** | Python 3.11, Flask, Docker Engine API |
| **AI Engine** | DeepSeek-Coder-6.7b via Ollama |
| **Security** | Docker (Non-root user, `no-new-privileges`, `cap-drop=ALL`, `--network=none`) |
| **Analysis** | Python `ast` (Abstract Syntax Tree), Heuristic Regex Analyzers |

---

## 🚀 Getting Started

### **Prerequisites**
* **Docker Desktop** (Must be running)
* **Ollama** (Pulled with `deepseek-coder:6.7b`)
* **Python 3.11+**
* **Node.js & npm**

### **Setup Instructions**

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/airlock.git](https://github.com/your-username/airlock.git)
    cd airlock
    ```

2.  **Build the Sandbox Image:**
    ```bash
    cd backend
    docker build -t solaris-sandbox .
    ```

3.  **Start the Backend:**
    ```bash
    # It is recommended to use a virtual environment
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    python api.py
    ```

4.  **Start the Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

---

## 💡 Why "Airlock"?

In high-security software engineering, an "air-gapped" system is one that is physically isolated from unsecure networks. **Airlock** brings that same philosophy to AI debugging. By containing the "contamination" (bugs) and the "cure" (AI fixes) inside a secure vessel, we ensure total developer privacy and system safety.

---

**Developed by Team Raftel**
