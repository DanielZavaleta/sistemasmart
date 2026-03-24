import subprocess

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout, result.stderr

with open("git_output.txt", "w", encoding="utf-8") as f:
    f.write("--- Git Status Porcelain ---\n")
    out, err = run_cmd("git status --porcelain")
    f.write(out)
    if err:
        f.write("\nStderr (Status):\n")
        f.write(err)
    f.write("\n\n--- Git Diff Stat ---\n")
    out, err = run_cmd("git diff --stat")
    f.write(out)
    if err:
        f.write("\nStderr (Diff):\n")
        f.write(err)
