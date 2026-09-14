#!/usr/bin/env python3
"""Render a resume HTML draft to PDF with WeasyPrint.

Fonts are taken from assets/fonts.css (vendored TTFs) so that the output
embeds the same typefaces on every machine — never a renderer fallback.

    python3 pipeline/render.py drafts/consulting/mckinsey-associate.html -o build/mckinsey-associate.pdf
"""
import argparse
import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
FONT_CSS = REPO / "assets" / "fonts.css"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="HTML draft to render")
    parser.add_argument("-o", "--output", help="PDF path (default: build/<name>.pdf)")
    args = parser.parse_args()

    try:
        from weasyprint import CSS, HTML
        from weasyprint.text.fonts import FontConfiguration
    except ImportError:
        print("WeasyPrint is not installed. Run: pip install -r pipeline/requirements.txt", file=sys.stderr)
        return 2

    source = pathlib.Path(args.source).resolve()
    if not source.is_file():
        print(f"No such draft: {source}", file=sys.stderr)
        return 2

    output = pathlib.Path(args.output) if args.output else REPO / "build" / (source.stem + ".pdf")
    output.parent.mkdir(parents=True, exist_ok=True)

    # @font-face only takes effect when the same FontConfiguration is handed to
    # both the stylesheet and the writer; without it WeasyPrint silently falls
    # back to whatever fontconfig offers, which is the failure CLAUDE.md calls out.
    font_config = FontConfiguration()
    stylesheets = [CSS(filename=str(FONT_CSS), font_config=font_config)] if FONT_CSS.is_file() else []
    HTML(filename=str(source)).write_pdf(
        str(output), stylesheets=stylesheets, font_config=font_config, optimize_images=True
    )
    print(f"rendered {source.relative_to(REPO) if source.is_relative_to(REPO) else source} -> {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
