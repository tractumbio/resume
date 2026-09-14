#!/usr/bin/env python3
"""Check a rendered PDF against the standards in CLAUDE.md.

    python3 pipeline/verify.py build/mckinsey-associate.pdf [--kind resume|cover] [--json report.json]

Every check prints PASS, WARN or FAIL. Any FAIL exits non-zero, which is what
stops pipeline/release.sh (and pipeline/build_cover.sh) from promoting a PDF.

--kind selects which checks apply. "resume" (default) runs all of them,
including the Profile-section check, which a cover letter does not have.
"cover" runs everything except that one, plus a length check sized for a
cover letter rather than a dense one-page resume.
"""
import argparse
import json
import pathlib
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET

PT_PER_MM = 72 / 25.4
A4_PT = (595.276, 841.89)

# Families a draft is allowed to ask for. Anything else in the PDF means the
# renderer substituted something, which CLAUDE.md treats as an accident.
ALLOWED_FONTS = {"Source Sans 3", "SourceSans3", "Source Serif 4", "SourceSerif4"}
SUBSTITUTE_MARKERS = ("DejaVu", "Arimo", "Tinos", "Liberation", "Nimbus", "Helvetica", "Times")

SELF_LAUDATORY = [
    "top 1%", "top 1 %", "medal-winning", "medal winning", "world-class", "world class",
    "award-winning", "renowned", "elite", "best-in-class", "best in class",
    "highly accomplished", "visionary", "guru", "rockstar", "ninja",
]
VAGUE = ["significant", "substantial", "numerous", "various", "responsible for", "helped to", "assisted with"]

ROLE_LINE = re.compile(r"\S\s+\|\s+\S")
DATE_RANGE = re.compile(r"^\(?(19|20)\d{2}\s*[–—-]\s*((19|20)\d{2}|Present|present|Current|current)\)?\s*$")


class Report:
    def __init__(self):
        self.rows = []

    def add(self, level, name, detail):
        self.rows.append({"level": level, "check": name, "detail": detail})

    def passed(self, name, detail=""):
        self.add("PASS", name, detail)

    def warn(self, name, detail):
        self.add("WARN", name, detail)

    def fail(self, name, detail):
        self.add("FAIL", name, detail)

    @property
    def failures(self):
        return [r for r in self.rows if r["level"] == "FAIL"]

    def render(self):
        width = max(len(r["check"]) for r in self.rows)
        lines = []
        for r in self.rows:
            lines.append(f"  {r['level']:<4}  {r['check']:<{width}}  {r['detail']}")
        return "\n".join(lines)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout


def check_page(pdf, report):
    info = run(["pdfinfo", str(pdf)])
    pages = int(re.search(r"^Pages:\s+(\d+)", info, re.M).group(1))
    if pages == 1:
        report.passed("one page", "1 page")
    else:
        report.fail("one page", f"{pages} pages — consulting resumes run to one page")

    size = re.search(r"^Page size:\s+([\d.]+) x ([\d.]+)", info, re.M)
    w, h = float(size.group(1)), float(size.group(2))
    if abs(w - A4_PT[0]) < 2 and abs(h - A4_PT[1]) < 2:
        report.passed("A4 page size", f"{w:.0f} x {h:.0f} pt")
    else:
        report.fail("A4 page size", f"{w:.0f} x {h:.0f} pt — expected {A4_PT[0]:.0f} x {A4_PT[1]:.0f}")


def check_fonts(pdf, report):
    rows = run(["pdffonts", str(pdf)]).splitlines()[2:]
    seen, problems = [], []
    for row in rows:
        parts = row.split()
        if len(parts) < 6:
            continue
        name = parts[0]
        family = name.split("+", 1)[1] if "+" in name else name
        emb, sub = parts[-5], parts[-4]
        seen.append(f"{family} (emb={emb}, sub={sub})")
        if emb != "yes":
            problems.append(f"{family} is not embedded")
        if sub != "yes":
            problems.append(f"{family} is not subsetted")
        base = re.sub(r"[-,].*$", "", family)
        if base not in ALLOWED_FONTS and any(m in family for m in SUBSTITUTE_MARKERS):
            problems.append(f"{family} looks like a renderer substitute, not a chosen face")
    if not seen:
        report.fail("fonts embedded", "no fonts reported — the PDF has no embedded text")
    elif problems:
        report.fail("fonts embedded", "; ".join(problems))
    else:
        report.passed("fonts embedded", ", ".join(seen))


def check_reading_order(pdf, report):
    # Deliberately NOT -layout: an ATS reads the raw content stream, where a
    # float:right date is pulled out ahead of the role it belongs to. -layout
    # reconstructs columns geometrically and hides exactly that defect.
    raw = run(["pdftotext", str(pdf), "-"])
    lines = [ln.strip() for ln in raw.splitlines()]

    # A right-aligned date extracts onto its own line either way. The defect is
    # the date landing BEFORE the role, which shows up as a date-only line whose
    # next non-empty line is the role line (org | title) it belongs to.
    offenders = []
    for i, ln in enumerate(lines):
        if not DATE_RANGE.match(ln):
            continue
        following = next((n for n in lines[i + 1:] if n), "")
        if ROLE_LINE.search(following):
            offenders.append(f"{ln!r} before {following[:48]!r}")

    if offenders:
        report.fail(
            "reading order",
            f"{len(offenders)} date(s) extracted ahead of their role "
            f"({offenders[0]}) — use display:flex, not float:right",
        )
    else:
        report.passed("reading order", "every date reads after the role it belongs to")


def check_margins(pdf, report, kind="resume"):
    xml = run(["pdftotext", "-bbox", str(pdf), "-"])
    root = ET.fromstring(xml)
    ns = {"h": root.tag.split("}")[0].strip("{")} if "}" in root.tag else {}
    page = root.find(".//h:page", ns) if ns else root.find(".//page")
    words = page.findall(".//h:word", ns) if ns else page.findall(".//word")
    if not words:
        report.fail("margins", "no extractable words")
        return
    page_w, page_h = float(page.get("width")), float(page.get("height"))
    xs0 = min(float(w.get("xMin")) for w in words)
    xs1 = max(float(w.get("xMax")) for w in words)
    ys0 = min(float(w.get("yMin")) for w in words)
    ys1 = max(float(w.get("yMax")) for w in words)

    top, bottom = ys0 / PT_PER_MM, (page_h - ys1) / PT_PER_MM
    left, right = xs0 / PT_PER_MM, (page_w - xs1) / PT_PER_MM
    detail = f"top {top:.1f}mm, bottom {bottom:.1f}mm, left {left:.1f}mm, right {right:.1f}mm"

    # A cover letter is a business letter, not a densely packed one-pager: wider
    # margins (18-25mm) are normal MBB convention, and a page mostly empty
    # below a ~300-400 word letter is expected, not thin content — unlike a
    # resume, a letter is not meant to fill the page. So the dead-space check
    # (below) is resume-only; cover.length (word count) is what stands in
    # for "is there enough here" on a letter.
    if kind == "cover":
        margin_lo, margin_hi, target = 15, 27, "18-25mm"
    else:
        margin_lo, margin_hi, target = 10, 20, "13-15mm"

    problems = []
    if kind == "resume" and bottom > 18:
        problems.append(f"bottom dead space {bottom:.1f}mm — add content back, the page reads as thin")
    if abs(left - right) > 2:
        problems.append(f"left/right asymmetric by {abs(left - right):.1f}mm")
    for label, value in (("left", left), ("right", right), ("top", top)):
        if not margin_lo <= value <= margin_hi:
            problems.append(f"{label} margin {value:.1f}mm outside {target} target")
    if problems:
        report.warn("margins", detail + " — " + "; ".join(problems))
    else:
        report.passed("margins", detail)


def check_language(layout, report):
    head = "\n".join(layout.splitlines()[:6]).lower()
    hits = [p for p in SELF_LAUDATORY if p in head]
    if hits:
        report.fail("header tagline", f"self-laudatory language in the header: {', '.join(hits)}")
    else:
        report.passed("header tagline", "no self-laudatory claims in the header")

    body = layout.lower()
    vague = sorted({v for v in VAGUE if v in body})
    if vague:
        report.warn("quantification", f"vague phrasing present: {', '.join(vague)} — replace with a number or a concrete outcome")
    else:
        report.passed("quantification", "no vague filler phrases")


def check_profile(layout, report):
    if re.search(r"^\s*(profile|summary)\b", layout, re.M | re.I):
        report.passed("profile section", "present")
    else:
        report.fail("profile section", "no Profile/summary section — CLAUDE.md requires one stating the target role and angle")


def check_cover_length(layout, report):
    # MBB guidance converges on roughly 300-400 words, one page — long enough
    # to make the case, short enough that a screener reads all of it. See
    # CLAUDE.md's cover-letter standards. (Paragraph count isn't checked here:
    # -layout extraction breaks lines at column edges, not blank lines, so a
    # reliable paragraph count needs the source HTML, not the rendered PDF.)
    words = len(re.findall(r"\b[\w'-]+\b", layout))
    if words > 450:
        report.warn("cover length", f"{words} words — MBB guidance is ~300-400; trim rather than shrink the font")
    elif words < 180:
        report.warn("cover length", f"{words} words — likely too thin to make the case; see CLAUDE.md cover-letter standards")
    else:
        report.passed("cover length", f"{words} words")


def check_orphans(layout, report):
    orphans = []
    for ln in layout.splitlines():
        stripped = ln.strip()
        if stripped.isupper():
            continue  # section headers are meant to sit alone on a line
        if stripped and len(stripped) <= 8 and " " not in stripped and stripped.isascii() and any(c.isalpha() for c in stripped):
            orphans.append(stripped)
    if orphans:
        report.warn("orphan words", f"short stranded line(s): {', '.join(orphans[:5])}")
    else:
        report.passed("orphan words", "no single short words stranded on a line")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--kind", choices=["resume", "cover"], default="resume")
    parser.add_argument("--json", help="also write the report as JSON to this path")
    args = parser.parse_args()

    for tool in ("pdfinfo", "pdffonts", "pdftotext"):
        if not shutil.which(tool):
            print(f"{tool} not found — install poppler-utils", file=sys.stderr)
            return 2

    pdf = pathlib.Path(args.pdf)
    if not pdf.is_file():
        print(f"No such PDF: {pdf}", file=sys.stderr)
        return 2

    report = Report()
    check_page(pdf, report)
    check_fonts(pdf, report)
    check_reading_order(pdf, report)
    layout = run(["pdftotext", "-layout", str(pdf), "-"])
    check_margins(pdf, report, kind=args.kind)
    check_language(layout, report)
    if args.kind == "resume":
        check_profile(layout, report)
    else:
        check_cover_length(layout, report)
    check_orphans(layout, report)

    print(f"\n  {pdf}\n")
    print(report.render())
    failures = report.failures
    print(f"\n  {len(failures)} failing check(s), "
          f"{len([r for r in report.rows if r['level'] == 'WARN'])} warning(s)\n")

    if args.json:
        pathlib.Path(args.json).parent.mkdir(parents=True, exist_ok=True)
        pathlib.Path(args.json).write_text(json.dumps({"pdf": str(pdf), "checks": report.rows}, indent=2) + "\n")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
