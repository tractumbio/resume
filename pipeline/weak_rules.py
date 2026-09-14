#!/usr/bin/env python3
"""Rank a FitSignal scorecard's findings by how much overall score each one
is costing, so a refinement pass fixes the highest-impact thing first
instead of the first thing noticed.

    python3 pipeline/weak_rules.py applications/<slug>/resume.scorecard.json
    python3 pipeline/weak_rules.py applications/<slug>/resume.scorecard.json --top 3

Impact is weight x (3 - score): a rule's weighted share of the total, times
how many points out of 3 it's short. A high-weight rule scored 1 costs more
than a low-weight rule scored 0 — this ranks by the actual lever, not by the
rawest-looking number.
"""
import argparse
import json


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("scorecard")
    parser.add_argument("--top", type=int, default=5)
    args = parser.parse_args()

    payload = json.load(open(args.scorecard))
    result = payload.get("result", payload)

    scored = [f for f in result["findings"] if f.get("state") == "scored" and f.get("score") is not None]
    ranked = sorted(scored, key=lambda f: f["weight"] * (3 - f["score"]), reverse=True)
    ranked = [f for f in ranked if f["score"] < 3][: args.top]

    print(f"  overall {result['overall']}/100 — {result['verdict']}\n")
    if not ranked:
        print("  Every scored rule is already at 3/3 — nothing left to improve.")
        return

    print(f"  Highest-impact gaps (weighted score lost, highest first):\n")
    for f in ranked:
        cost = f["weight"] * (3 - f["score"])
        print(f"  {f['score']}/3  {f['id']} {f['name']}  (~{cost*100:.1f} pts of overall)")
        if f.get("note"):
            print(f"        {f['note']}")
        for span in f.get("evidence", [])[:1]:
            print(f"        evidence cited: “{span[:90]}{'…' if len(span) > 90 else ''}”")
        print()

    unresolved = [f for f in result["findings"] if f.get("state") == "unknown"]
    if unresolved:
        names = ", ".join(f["id"] for f in unresolved)
        print(f"  Unresolved (not scored — usually needs a different input mode): {names}")

    if result.get("recs"):
        print("\n  FitSignal's own recommendations:")
        for rec in result["recs"]:
            print(f"  - {rec}")


if __name__ == "__main__":
    main()
