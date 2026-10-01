#!/usr/bin/env python3
"""Assemble the course sources into one self-contained, offline HTML file."""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
# Build output lives one level up, next to the README. Never edit it by hand: edit these sources.
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "claude-code-3-day-course.html"

parts = ["01-shell-start.html", "02-day1.html", "03-day2.html", "04-day3.html", "05-reference.html"]
css = (HERE / "styles.css").read_text(encoding="utf-8")
data_js = (HERE / "data.js").read_text(encoding="utf-8")
app_js = (HERE / "app.js").read_text(encoding="utf-8")
body = "\n".join((HERE / p).read_text(encoding="utf-8") for p in parts)

for name, src in (("data.js", data_js), ("app.js", app_js)):
    if "</script" in src.lower():
        raise SystemExit(f"{name} contains a literal </script> sequence; escape it before inlining")

favicon = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
    "%3Crect width='64' height='64' rx='14' fill='%23000'/%3E"
    "%3Cpath d='M22 14 L44 32 L22 50' stroke='%23A100FF' stroke-width='9' fill='none' "
    "stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
)

early = (
    "try{var s=JSON.parse(localStorage.getItem('ccc-course-v1')||'{}');"
    "if(s.theme)document.documentElement.setAttribute('data-theme',s.theme);"
    "var os=s.os||(/mac|iphone|ipad/i.test(navigator.platform||navigator.userAgent||'')?'mac':'win');"
    "document.documentElement.classList.add('os-'+os);}catch(e){}"
)

html = f"""<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude Code Course</title>
<meta name="description" content="Interactive 3-day beginner course (3 x 2-hour sessions) on Claude Code: installation on Windows, macOS and VS Code, essential slash commands, permissions, CLAUDE.md, MCP connectors, skills and automation. Facilitated by Adrian Cioanca.">
<meta name="author" content="Adrian Cioanca">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#000000">
<link rel="icon" href="{favicon}">
<script>{early}</script>
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{data_js}
</script>
<script>
{app_js}
</script>
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({len(html.encode('utf-8')) / 1024:.0f} KB)")
