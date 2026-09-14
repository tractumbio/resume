# Applications

One folder per job you apply to, holding the three things a submission needs: the ad you
responded to, the resume you sent, and the cover letter you wrote for it.

```
applications/
  _template/         copy this to start a new application
    ad.md
    cover.html
  <firm>-<role-slug>/
    ad.md            the job ad, pasted verbatim, plus firm/role/deadline metadata
    resume.pdf        the export this application used — a copy, not a symlink
    cover.html         the cover letter source — this is what you edit
    cover.pdf          rendered, checked output
    cover.checks.json  the check results for that PDF (written by build_cover.sh)
```

## Starting a new application

The fast path, if you have the ad's text (a file, stdin, or a URL):

```bash
python3 pipeline/from_ad.py path/to/ad.txt --name <firm>-<role-slug>
```

This scaffolds the folder for you and prefills `ad.md`'s metadata (firm, role, office,
practice) by guessing from the ad text — read what it guessed, it's heuristic. See
"Building a resume from a job ad" in `BUILDER_INSTRUCTIONS.md` for the full procedure,
including `pipeline/score_for_ad.sh`, which scores the resume against this ad's actual
role/region/route/practice instead of hardcoded defaults.

Otherwise, copy the template directly:

```bash
cp -r applications/_template applications/<firm>-<role-slug>
```

Then, in order:

1. **`ad.md`** — paste the job ad in full, fill in the metadata at the top (firm, role,
   office, practice, deadline, referral if any). Do this first: the cover letter is written
   against this ad, not from memory of it.
2. **`resume.pdf`** — copy in the matching export from `exports/<sector>/`. If the role
   needs different emphasis than an existing variant, build a new draft first (see
   `BUILDER_INSTRUCTIONS.md`) and export it, then copy that export in here. Never hand-edit
   a PDF directly.
3. **`cover.html`** — draft the letter. Follow "Cover-letter standards" in `CLAUDE.md` and
   "Building a cover letter" in `BUILDER_INSTRUCTIONS.md`; the template's HTML comments
   walk through what each paragraph needs to do.
4. Render and check:

   ```bash
   pipeline/build_cover.sh applications/<firm>-<role-slug>
   ```

   This writes `cover.pdf` and `cover.checks.json` in the same folder — there is no
   separate promotion step, because this folder already is the final location.
5. Commit `ad.md`, `resume.pdf`, `cover.html`, `cover.pdf` and `cover.checks.json` together.

## What's checked, and what isn't

`pipeline/verify.py --kind cover` runs the same fonts/page/margins/reading-order/language
checks as a resume, plus a word-count check (MBB guidance: roughly 300-400 words), and
skips the resume-only Profile-section check. It cannot tell you whether the letter is
actually specific to this firm, whether the proof points are the right three, or whether
the hook is a hook and not a restated job title — that's a read-it-yourself judgement, same
as MECE bullets on the resume.

## `resume.pdf` is a copy, deliberately

Applications get sent, then the underlying export can keep evolving. A copy freezes what
was actually submitted; a reference to `exports/` would drift as that file is re-released.
