#!/usr/bin/env python3
"""Print a one-paragraph summary of a FitSignal scorecard.

Used by pipeline/release.sh for the console line and the provenance file.

    python3 pipeline/summarise.py <scorecard.json> [--provenance]
"""
import argparse
import json


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scorecard")
    parser.add_argument("--provenance", action="store_true", help="format for the provenance file")
    args = parser.parse_args()

    payload = json.load(open(args.scorecard))
    result = payload.get("result", payload)
    meta = result["meta"]
    provider = meta.get("provider", "unknown")
    coverage = round(meta.get("weight_coverage", 0) * 100)

    if args.provenance:
        print(f"fitsignal: rubric v{meta['rubric_version']} — overall {result['overall']}/100 "
              f"({result['verdict']}, {result['recommendation']}), provider={provider}")
        if provider == "mock":
            print("           NOTE: mock provider — placeholder findings, not an assessment.")
            print("           Re-run with ANTHROPIC_API_KEY set before relying on this number.")
    else:
        print(f"  overall {result['overall']}/100 — {result['verdict']} — {result['recommendation']}")
        print(f"  rubric v{meta['rubric_version']}, {meta['scored_rules']} rules scored, "
              f"{coverage}% of weight resolved, provider={provider}")
        if provider == "mock":
            print("  ! placeholder findings — set ANTHROPIC_API_KEY for a real assessment")
        for warning in result.get("warnings", []):
            print(f"  ! {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
