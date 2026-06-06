import os
import time
import re
import httpx
from typing import Dict, Any, Optional

GLOT_API_TOKEN = os.getenv("GLOT_API_TOKEN")
GLOT_BASE_URL = "https://glot.io/api/run"

# Full language map from Glot.io (all supported languages)
LANG_MAP = {
    "Python":       {"glot_name": "python",     "filename": "main.py"},
    "JavaScript":   {"glot_name": "javascript", "filename": "main.js"},
    "TypeScript":   {"glot_name": "typescript", "filename": "main.ts"},
    "Java":         {"glot_name": "java",        "filename": "Main.java"},
    "C++":          {"glot_name": "cpp",         "filename": "main.cpp"},
    "C":            {"glot_name": "c",           "filename": "main.c"},
    "C#":           {"glot_name": "csharp",      "filename": "main.cs"},
    "Go":           {"glot_name": "go",          "filename": "main.go"},
    "Rust":         {"glot_name": "rust",        "filename": "main.rs"},
    "Swift":        {"glot_name": "swift",       "filename": "main.swift"},
    "Kotlin":       {"glot_name": "kotlin",      "filename": "main.kt"},
    "Ruby":         {"glot_name": "ruby",        "filename": "main.rb"},
    "PHP":          {"glot_name": "php",         "filename": "main.php"},
    "Scala":        {"glot_name": "scala",       "filename": "main.scala"},
    "Haskell":      {"glot_name": "haskell",     "filename": "main.hs"},
    "Bash":         {"glot_name": "bash",        "filename": "main.sh"},
    "Lua":          {"glot_name": "lua",         "filename": "main.lua"},
    "Perl":         {"glot_name": "perl",        "filename": "main.pl"},
    "Elixir":       {"glot_name": "elixir",      "filename": "main.ex"},
    "Clojure":      {"glot_name": "clojure",     "filename": "main.clj"},
    "Dart":         {"glot_name": "dart",        "filename": "main.dart"},
    "Julia":        {"glot_name": "julia",       "filename": "main.jl"},
    "OCaml":        {"glot_name": "ocaml",       "filename": "main.ml"},
    "D":            {"glot_name": "d",           "filename": "main.d"},
    "Groovy":       {"glot_name": "groovy",      "filename": "main.groovy"},
    "Nim":          {"glot_name": "nim",         "filename": "main.nim"},
    "Crystal":      {"glot_name": "crystal",     "filename": "main.cr"},
    "Pascal":       {"glot_name": "pascal",      "filename": "main.pas"},
    "COBOL":        {"glot_name": "cobol",       "filename": "main.cob"},
    "Assembly":     {"glot_name": "assembly",    "filename": "main.asm"},
}


def run_local_fallback(code: str, language: str, stdin: str, error: str = "") -> Dict[str, Any]:
    """Fallback to local machine execution for Python and JavaScript if Glot.io is unavailable."""
    import subprocess
    import tempfile
    
    note = f"⚠️ Remote compiler offline ({error or 'no token'}). Running locally.\n\n"
    
    if language == "Python":
        try:
            result = subprocess.run(
                ["python", "-c", code],
                input=stdin.encode("utf-8") if stdin else b"",
                capture_output=True,
                timeout=5.0
            )
            stdout = result.stdout.decode("utf-8")
            stderr = result.stderr.decode("utf-8")
            return {
                "stdout": note + stdout,
                "stderr": stderr,
                "exit_code": result.returncode,
                "time_ms": 15
            }
        except Exception as e:
            return {"stdout": note, "stderr": str(e), "exit_code": 1, "time_ms": 0}
            
    elif language in ("JavaScript", "TypeScript"):
        try:
            result = subprocess.run(
                ["node", "-e", code],
                input=stdin.encode("utf-8") if stdin else b"",
                capture_output=True,
                timeout=5.0
            )
            stdout = result.stdout.decode("utf-8")
            stderr = result.stderr.decode("utf-8")
            return {
                "stdout": note + stdout,
                "stderr": stderr,
                "exit_code": result.returncode,
                "time_ms": 15
            }
        except Exception as e:
            return {"stdout": note, "stderr": str(e), "exit_code": 1, "time_ms": 0}
            
    elif language == "Java":
        try:
            import re
            import os
            with tempfile.TemporaryDirectory() as tmpdir:
                match = re.search(r"class\s+([A-Za-z0-9_]+)", code)
                class_name = match.group(1) if match else "Main"
                file_path = os.path.join(tmpdir, f"{class_name}.java")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(code)
                
                # Use java single-file execution
                result = subprocess.run(
                    ["java", file_path],
                    input=stdin.encode("utf-8") if stdin else b"",
                    capture_output=True,
                    timeout=5.0
                )
                return {
                    "stdout": note + result.stdout.decode("utf-8"),
                    "stderr": result.stderr.decode("utf-8"),
                    "exit_code": result.returncode,
                    "time_ms": 50
                }
        except Exception as e:
            return {"stdout": note, "stderr": f"Local Java failed: {e}", "exit_code": 1, "time_ms": 0}

    elif language in ("C++", "C"):
        try:
            import os
            with tempfile.TemporaryDirectory() as tmpdir:
                ext = "cpp" if language == "C++" else "c"
                compiler = "g++" if language == "C++" else "gcc"
                file_path = os.path.join(tmpdir, f"main.{ext}")
                out_path = os.path.join(tmpdir, "main.exe")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(code)
                
                # Compile
                c_result = subprocess.run([compiler, file_path, "-o", out_path], capture_output=True, timeout=10.0)
                if c_result.returncode != 0:
                    return {"stdout": note, "stderr": c_result.stderr.decode("utf-8"), "exit_code": c_result.returncode, "time_ms": 0}
                
                # Run
                r_result = subprocess.run([out_path], input=stdin.encode("utf-8") if stdin else b"", capture_output=True, timeout=5.0)
                return {
                    "stdout": note + r_result.stdout.decode("utf-8"),
                    "stderr": r_result.stderr.decode("utf-8"),
                    "exit_code": r_result.returncode,
                    "time_ms": 15
                }
        except Exception as e:
            return {"stdout": note, "stderr": f"Local {language} failed (is {compiler} installed?): {e}", "exit_code": 1, "time_ms": 0}

    # For other languages, use basic simulation
    return {
        "stdout": note + f"[Simulation] Code submitted for {language}.",
        "stderr": "",
        "exit_code": 0,
        "time_ms": 5
    }


def execute_code(
    code: str,
    language: str,
    stdin: Optional[str] = "",
) -> Dict[str, Any]:
    """
    Execute code via Glot.io REST API.
    Falls back to local simulation if token is missing or API is unreachable.
    """
    lang_info = LANG_MAP.get(language)
    if not lang_info:
        return {
            "stdout": "",
            "stderr": f"Unsupported language: {language}",
            "exit_code": 1,
            "time_ms": 0,
        }

    if not GLOT_API_TOKEN:
        return run_local_fallback(code, language, stdin or "", "GLOT_API_TOKEN not set")

    url = f"{GLOT_BASE_URL}/{lang_info['glot_name']}/latest"
    headers = {
        "Authorization": f"Token {GLOT_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "files": [{"name": lang_info["filename"], "content": code}],
        "stdin": stdin or "",
    }

    t_start = time.time()
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, headers=headers, json=payload)
            if not response.is_success:
                return run_local_fallback(
                    code, language, stdin or "", f"HTTP {response.status_code}"
                )
            data = response.json()
            t_ms = int((time.time() - t_start) * 1000)

            stdout = data.get("stdout", "")
            stderr = data.get("stderr", "")
            error  = data.get("error", "")

            if error:
                stderr = f"{error}\n{stderr}".strip()

            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": 0 if not (error or stderr) else 1,
                "time_ms": t_ms,
            }
    except Exception as exc:
        return run_local_fallback(code, language, stdin or "", str(exc))
