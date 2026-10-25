# Altis — Senior Consultant, Data Engineer

<!--
Paste the job ad verbatim below the rule, plus the metadata above it. Keep the
ad text even after applying — cover.html is drafted against it, and if the ad
is later pulled from the firm's site this is the only remaining copy of what
you responded to.
-->

- **Firm:** Altis
- **Role:** Senior Consultant – Data Engineer
- **Office / location:** Canberra, Australian Capital Territory (Hybrid)
- **Practice / group:** Consulting — Data & Analytics
- **Application deadline:**
- **Ad URL:**
- **Referral / contact:** (name of anyone you have a warm connection through, if any)
- **Applied on:**

---

Senior Consultant – Data Engineer | Canberra

Consulting - Canberra, Australian Capital Territory (Hybrid)
Department: Consulting
Employment Type: Permanent Full-Time
Minimum Experience: Mid-level

Take complex data challenges and turn them into solutions people can actually use.

We're looking for an experienced Data & Analytics consultant who combines strong technical
foundations with the ability to lead clients through complex decisions.
You'll own engagements from discovery and solution design through delivery, working with
stakeholders to understand the problem behind the requirement and turning it into practical,
scalable data solutions.

What you'll do
- Lead Data & Analytics projects across the full delivery lifecycle.
- Shape technical solutions based on client outcomes rather than technology alone.
- Design data warehouse, integration, BI, analytics and data engineering solutions.
- Translate complex requirements for both technical and non-technical stakeholders.
- Lead project teams and mentor developing consultants.
- Maintain strong delivery, governance, risk and quality standards.
- Provide trusted advice to clients.
- Contribute to proposals, solution development and the continued growth of Altis.

What you'll bring
You'll bring broad Data & Analytics experience with depth in one or more areas such as:
- Data engineering
- Data architecture
- Data warehousing and modelling
- Analytics and BI
- Cloud data platforms
- Data integration and ETL/ELT

You'll also be confident leading conversations, navigating ambiguity and balancing technical
quality with real-world client constraints.

Please note you must be an Australian Citizen to apply for this role.

Why Altis?
For more than 25 years, Altis has focused on one thing: helping organisations create better
outcomes through data. We're Australian-owned and technology-agnostic, which means our
consultants can focus on solving the right problem rather than selling a particular platform.
At Altis you'll have the opportunity to:
- Work across varied and challenging Data & AI engagements
- Learn from experienced specialists across consulting, engineering, analytics and AI
- Build your capability through ongoing learning and career development
- Work in a collaborative environment where you're encouraged to challenge ideas and
  contribute your own
- Work flexibly through our hybrid model
- Access health and wellbeing support for you and your family
- Access paid parental leave and our reward and recognition program

Our values — Be Curious, Own It, Lead with Heart and Discover a Way — shape how we work with
our clients and with each other.

Your next move doesn't need to tick every box
If the role sounds like the direction you want your career to take but you don't meet every
requirement listed, we'd still encourage you to apply. Different experiences and perspectives
make our teams stronger. If you need adjustments or support at any stage of our recruitment
process, let our Talent Acquisition team know and we'll work with you.

Ready to see your career differently? We'd love to hear from you.

---

⚠ FLAGS FOR ADRIAN — before submitting

1. **R16 date overlap — partially resolved.** You confirmed Accenture started January 2026,
   which is now on the resume and cut this finding's cost roughly in half (~22pts → ~11pts of
   `overall`). What's left: ErythroSIGHT (2023–Present) and the ANU postdoc (2022–2026) are
   still year-only, and the postdoc's overlap with Accenture (and whether it's concluded) is
   still unconfirmed. Please give month-level dates for both, and confirm whether the postdoc
   has ended — see the matching item now in the knowledge base's Open Items. Not filled in with
   a guess, same reason as before: CLAUDE.md's standard is reconcile-or-flag, never invent.
2. **Citizenship.** The ad hard-requires Australian citizenship. The resume/cover letter
   reference the NV1 security clearance (which requires citizenship) as circumstantial
   evidence, but nothing in the knowledge base explicitly states citizenship as a confirmed
   fact, so neither document asserts it directly. Confirm you're comfortable with that framing,
   or state it explicitly if you'd rather.

Real scorecard (via the local `claude` CLI, no mock): 89/100, "Strong fit" — see
resume.scorecard.json (score moved up again after the Profile headline, relevance-ordered
bullets and the new bullet-point cover letter). Minor items also flagged and left as-is
(diminishing returns against the one-page limit): a few unglossed technical terms (BM25,
pgvector, AlloyDB, Dataproc, non-dilutive), and the Defence PoC bullet has no scale/volume
figure.

This run also caught and fixed three real defects affecting all three resume drafts/exports in
this repo (all corrected, all exports re-released):
- The Accenture start date was wrong everywhere (said "2026" in drafts, "2025" in the
  knowledge base's narrative — both wrong; you've now confirmed January 2026).
- The Defence engagement bullet had the wrong project's detail attached to it — it described
  "led 3 analysts... Azure DevOps", which actually belongs to the AGL engagement per the
  knowledge base, while the real Defence GDC PoC detail was missing. Fixed using the detail
  you gave; the AGL bullet now correctly carries the 3-person team-lead detail instead.
  **Then generalised for OPSEC** (see below) — the resume bullet does not name the vendor or
  the in-environment tool stack; those live only in the knowledge base's private record.
- `letter-spacing` on section headers was high enough that WeasyPrint split "EDUCATION" into
  separate characters in PDF text extraction ("E D U C AT I O N") — invisible on the page, but
  exactly what an ATS parses. `pipeline/verify.py` now checks for this.

3. **OPSEC review on the Defence content (requested, now done, re-confirm before sending).**
   The Defence PoC bullet previously named a specific commercial cloud product alongside
   "air-gapped" and a full client-side tool stack — the pattern a security officer flags
   regardless of formal classification, since together it describes the architecture of a
   secure government system. Generalised to "a Defence client... a secure, air-gapped cloud
   environment" with no vendor name and no in-environment tool list; the tool names (AlloyDB,
   Dataproc, Elastic, Tableau) now sit in the general Capabilities list instead, decoupled from
   the Defence context. The score actually moved up (86→89) after this change, and FitSignal's
   own independent recommendation on the McKinsey APD re-run literally said "keep the Defence
   engagement description generic" — unprompted agreement with the same fix. CLAUDE.md now
   documents this as a standing content standard. **This is not a substitute for your own
   employer/Defence security sign-off** — please have your actual security officer review the
   Defence bullet (and the equivalent one in the McKinsey drafts) before anything is submitted.
