# Exports — ready to submit

Every PDF in here passed all nine checks in `pipeline/verify.py` at the moment it was
built. That is the whole meaning of this directory: if a file is here, it can be attached
to an application without further inspection.

## What that guarantees

One A4 page. Fonts embedded and subsetted, from the typefaces vendored in `assets/`, never
a renderer substitute. Reading order that survives text extraction — every date reads after
the role it belongs to, the way an ATS parses it. Symmetric margins with no dead space at
the foot. No self-laudatory language in the header. A Profile section present. No orphaned
words.

## What ships alongside each PDF

| File | What it is |
|---|---|
| `<name>.pdf` | the document to attach |
| `<name>.checks.json` | every check and its result, as run |
| `<name>.scorecard.json` | the FitSignal scorecard for this exact PDF |
| `<name>.provenance.txt` | source draft, render time, commit, scoring provider |

Read `provenance.txt` before relying on a scorecard. When it says `provider=mock`, the
score is a placeholder from an offline run, not an assessment.

## Rules

- **Never edit a file in here.** These are build output. Edit `drafts/`, then re-run
  `pipeline/release.sh`; it overwrites the export and its artefacts together.
- **Nothing arrives here by hand.** `pipeline/release.sh` is the only way in, and it
  refuses to promote a PDF with a failing check.
- **Superseded exports go to `archive/`**, not back to `drafts/`. Archived renders are kept
  for diffing and are not submittable — some predate the current standards.
