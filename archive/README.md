# Archive

Superseded renders, kept so a current export can be diffed against what came before.

**Nothing in here is submittable.** Both files predate the current pipeline and fail the
checks in `pipeline/verify.py`:

```
FAIL  fonts embedded   Arimo / Tinos — renderer substitutes for Arial and Times, not chosen faces
FAIL  reading order    4 dates extracted ahead of their role (float:right)
FAIL  header tagline   self-laudatory language ("Top 1%", "Medal-Winning")
FAIL  profile section  absent
WARN  margins          37.6mm of dead space at the foot
```

They are useful as a regression fixture: `python3 pipeline/verify.py
archive/Adrian_Cioanca_McKinsey_Associate_Elegant.pdf` should keep reporting those
failures. A verifier that passes this file has stopped working.

The current version of this resume is in `exports/consulting/`.
