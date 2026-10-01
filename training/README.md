# Claude Code: Zero to Functional

An interactive 3-day beginner course on Claude Code, delivered as three 2-hour sessions.
Facilitated by Adrian Cioanca, PhD (Data & AI Consultant, Accenture,
[Adrian.Cioanca@accenture.com](mailto:Adrian.Cioanca@accenture.com)).

This folder is training material. It is not part of the resume pipeline, and nothing in
`pipeline/` builds or checks it.

```
claude-code-3-day-course.html   the course: one self-contained page. Open this.
src/                            the sources it is built from. Edit these, never the page.
```

## Opening it

Double-click `claude-code-3-day-course.html`. It opens in Chrome, Edge, Firefox or Safari,
works offline, and loads nothing from the network: styles, scripts and the lab files are
all inside the page. Attendees can be sent this one file.

Progress (checklists, quiz scores, the certificate name) is saved in the browser that
opened the page, on that machine only. **Reset my progress** at the foot of the sidebar
clears it.

## What it covers

| Session | Modules | Hands-on |
|---|---|---|
| **Before Day 1** | Outcomes, how the page works, setup checklist | Download the lab kit |
| **Day 1 · Foundations** | 1.1 Claude chat vs Claude Code · 1.2 Install on Windows, macOS and VS Code · 1.3 First launch and the interface · 1.4 Talking to Claude Code | Lab 1: Hello, Claude Code · 9-question check |
| **Day 2 · Working well** | 2.1 Slash commands that matter · 2.2 Context and sessions · 2.3 Permissions and safety · 2.4 CLAUDE.md and memory · 2.5 Explore → plan → build → verify | Lab 2: Real mini use cases · 11-question check |
| **Day 3 · Extend & automate** | 3.1 Connectors (MCP) · 3.2 Skills · 3.3 Subagents, hooks, plugins and output styles · 3.4 Beyond the terminal · 3.5 Use-case playbook | Capstone lab · 10-question check · 15-question final assessment |
| **Reference** | Slash command explorer (92 commands), keyboard shortcuts, CLI cheat sheet, where files live, troubleshooting, glossary, facilitator guide, resources | |

Each day opens with a timed agenda that adds up to 120 minutes, breaks included.

## Interactive parts

- **Windows / macOS switch** in the top bar: install steps, paths and shortcuts follow it.
- **Practice terminal**: a simulated Claude Code session for rehearsing prompts, slash
  commands, permission prompts, `Esc`, `Shift+Tab` and rewind before touching a real one.
- **Builders**: a prompt builder, a permission-rule builder that tests what Claude Code
  would do with a given command in each permission mode, and CLAUDE.md, MCP and skill
  builders that output files and commands to copy.
- **Games and drills**: chat-vs-Claude-Code sorter, a 24-scenario command drill, the
  permission-mode cycle.
- **Lab kit**: a zip of 13 synthetic files (a sales CSV with a planted data error, a Python
  module with failing tests, meeting notes, a dummy `.env`, a messy inbox), generated in the
  page. No client data.
- **Knowledge checks and final assessment**, with a printable certificate at 80% or more.
- **Use-case playbook**: 34 copy-ready prompts; a 34-term glossary; search with `Ctrl+K` /
  `Cmd+K`.

## Running a session

- Switch on **Present** (larger text, no sidebar) and **Facilitator** (timings, talking
  points, common pitfalls under each module) in the top bar.
- Start the **session clock** in that day's agenda; clicking an agenda row jumps to it.
- Lab 2's answer key sits behind a click inside its facilitator notes, so it stays hidden
  on the projector. Facilitator notes are also left out of the page search.
- The **Facilitator guide** in the Reference section has the week-before checklist
  (licences, corporate proxy, managed settings) and teaching tips.

## Keeping it accurate

The content was checked against the official documentation at
[code.claude.com/docs](https://code.claude.com/docs) on 1 October 2026, Claude Code
v2.1.28x. Claude Code ships updates almost weekly, so before each delivery skim
`/release-notes` and re-check the install commands, the permission modes and the
slash-command list.

To change the course, edit `src/` and rebuild:

```bash
python3 training/src/build.py                      # writes training/claude-code-3-day-course.html
NODE_PATH=$(npm root -g) node training/src/test.js # headless checks: widgets, quizzes, rule evaluator, zip, layout
```

`build.py` concatenates the five HTML parts and inlines `styles.css`, `data.js` (agendas,
quizzes, commands, prompts, glossary, lab kit) and `app.js` (everything interactive).
`test.js` needs Node and a global Playwright with Chromium (`npm install -g playwright`,
then `npx playwright install chromium`), so nothing is installed into the repo. It writes
screenshots, the downloaded lab kit and a print PDF to a temporary folder, or to
`$COURSE_SHOTS` if set.

Claude, Claude Code and Anthropic are trademarks of Anthropic, PBC. This is independent
training material.
