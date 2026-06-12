#!/usr/bin/env python3
"""
Classic Allure report for Playwright (allure-playwright reporter).

Uses allure-commandline (Allure 2) — the sidebar UI with Overview, Suites,
Categories, Graphs, Packages, Timeline, and Behaviors.

Flow:
  npm test  -> allure-results/
  this script -> allure generate + allure open
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS_DIR = ROOT / "allure-results"
REPORT_NAME = "MaithanErp"
REPORT_DIR = ROOT / REPORT_NAME
ALLURE_BIN = ROOT / "node_modules" / "allure-commandline" / "bin" / "allure"

REQUIRED_FILES = (
    "index.html",
    "widgets/summary.json",
    "widgets/suites.json",
)

JAVA_HOME_CANDIDATES = (
  Path(r"C:\Program Files\Eclipse Adoptium"),
  Path(r"C:\Program Files\Java"),
  Path(r"C:\Program Files\Microsoft"),
  Path(r"C:\Program Files (x86)\Java"),
)


def has_results() -> bool:
    return RESULTS_DIR.is_dir() and any(RESULTS_DIR.glob("*-result.json"))


def find_java_home() -> Path | None:
    configured = os.environ.get("JAVA_HOME", "").strip()
    if configured:
        java_exe = Path(configured) / "bin" / ("java.exe" if sys.platform == "win32" else "java")
        if java_exe.is_file():
            return Path(configured)

    for base in JAVA_HOME_CANDIDATES:
        if not base.is_dir():
            continue
        for java_exe in base.rglob("java.exe" if sys.platform == "win32" else "java"):
            if java_exe.parent.name == "bin":
                return java_exe.parent.parent

    return None


def allure_env() -> dict[str, str]:
    env = os.environ.copy()
    java_home = find_java_home()
    if java_home:
        env["JAVA_HOME"] = str(java_home)
        java_bin = java_home / "bin"
        env["PATH"] = f"{java_bin}{os.pathsep}{env.get('PATH', '')}"
    return env


def run_allure(*args: str) -> None:
    if not ALLURE_BIN.is_file():
        print(f"\nMissing {ALLURE_BIN}")
        print("Run:  npm install\n")
        sys.exit(1)

    if not find_java_home():
        print("\nJava JDK is required for the classic Allure report.")
        print("Install Eclipse Temurin 17+, or set JAVA_HOME to your JDK.\n")
        sys.exit(1)

    cmd = ["node", str(ALLURE_BIN), *args]
    subprocess.run(
        cmd,
        cwd=ROOT,
        env=allure_env(),
        check=True,
    )


def verify_report() -> list[str]:
    missing: list[str] = []
    for rel in REQUIRED_FILES:
        if not (REPORT_DIR / rel).is_file():
            missing.append(rel)
    return missing


def rebrand_report() -> None:
    """Replace default Allure sidebar branding with MaithanErp."""
    replacements = (
        ("text:`Allure`", f"text:`{REPORT_NAME}`"),
        ("Allure Report summary mail", f"{REPORT_NAME} summary mail"),
    )

    for path in REPORT_DIR.rglob("*"):
        if not path.is_file() or path.suffix not in {".js", ".html"}:
            continue
        original = path.read_text(encoding="utf-8")
        updated = original
        for old, new in replacements:
            updated = updated.replace(old, new)
        if updated != original:
            path.write_text(updated, encoding="utf-8")


def print_summary() -> None:
    summary_path = REPORT_DIR / "widgets" / "summary.json"
    if not summary_path.is_file():
        return
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    stats = summary.get("statistic", {})
    print(
        "Test summary: "
        f"total={stats.get('total', 0)} "
        f"passed={stats.get('passed', 0)} "
        f"failed={stats.get('failed', 0)} "
        f"broken={stats.get('broken', 0)} "
        f"skipped={stats.get('skipped', 0)}"
    )


def ensure_categories_config() -> None:
    source = ROOT / "config" / "allure-categories.json"
    target = RESULTS_DIR / "categories.json"
    if source.is_file() and RESULTS_DIR.is_dir():
        target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")


def generate() -> Path:
    if not has_results():
        print("\nNo Allure results in allure-results/")
        print("Run tests first:  npm test\n")
        sys.exit(1)

    ensure_categories_config()

    run_allure(
        "generate",
        str(RESULTS_DIR),
        "-o",
        str(REPORT_DIR),
        "--clean",
        "--name",
        REPORT_NAME,
    )

    rebrand_report()

    missing = verify_report()
    if missing:
        print("Report generation incomplete. Missing:")
        for item in missing:
            print(f"  - {item}")
        sys.exit(1)

    print_summary()
    print(f"\n{REPORT_NAME} report ready: {REPORT_DIR / 'index.html'}\n")
    return REPORT_DIR / "index.html"


def serve_report(port: int = 0) -> None:
    missing = verify_report()
    if missing:
        print("Cannot open report. Missing files:")
        for item in missing:
            print(f"  - {item}")
        print("Run:  npm run report:allure\n")
        sys.exit(1)

    args = ["open", str(REPORT_DIR)]
    if port > 0:
        args.extend(["--port", str(port)])

    print(f"Starting {REPORT_NAME} report server...")
    print("Press Ctrl+C to stop.\n")
    run_allure(*args)


def open_report(port: int = 0) -> None:
    generate()
    serve_report(port=port)


def main() -> None:
    parser = argparse.ArgumentParser(description="Classic Allure report for Playwright tests")
    parser.add_argument(
        "--open",
        action="store_true",
        help="Generate the report and open it in the browser",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Open an existing report without regenerating",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=0,
        help="Port for allure open (default: random)",
    )
    args = parser.parse_args()

    if args.serve:
        serve_report(port=args.port)
    elif args.open:
        open_report(port=args.port)
    else:
        generate()
        print("Open in browser:  npm run report:allure:open")
        print("Serve existing:   npm run report:allure:serve\n")


if __name__ == "__main__":
    main()
