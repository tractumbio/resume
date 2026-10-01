/* ==========================================================================
   Course data: agendas, quizzes, games, commands, shortcuts, prompts,
   glossary and lab-kit files. Facts verified against code.claude.com/docs
   (1 Oct 2026).
   ========================================================================== */
var COURSE = {};

COURSE.agendas = {
  1: [
    { t: 10, title: "Welcome, objectives & contact", desc: "Who's in the room, how the course works, how progress is saved.", link: "#welcome" },
    { t: 20, title: "1.1 Claude chat vs Claude Code", desc: "The agentic loop, tools, what Claude can reach. Sorting game and live demo.", link: "#m11" },
    { t: 30, title: "1.2 Install: Windows · macOS · VS Code", desc: "Native installers, verify with claude --version and claude doctor, sign in.", link: "#m12" },
    { t: 10, title: "Break", brk: true },
    { t: 20, title: "1.3–1.4 First launch & talking to Claude", desc: "Interface tour, permission prompts, @, !, Esc, rewind, the prompt formula.", link: "#m13" },
    { t: 22, title: "Lab 1: Hello, Claude Code", desc: "Explore, create, edit, rewind, resume.", link: "#lab1" },
    { t: 8, title: "Knowledge check & homework", desc: "Nine questions, then a real-world homework task.", link: "#quiz1" }
  ],
  2: [
    { t: 10, title: "Recap & homework share", desc: "One win and one thing that went wrong.", link: "#day2" },
    { t: 15, title: "2.1 Slash commands that matter", desc: "The essentials, the command drill, key shortcuts.", link: "#m21" },
    { t: 10, title: "2.2 Context & sessions", desc: "/context, /compact, /clear, resuming, checkpoints.", link: "#m22" },
    { t: 25, title: "2.3 Permissions & safety", desc: "Six modes, auto & plan mode, rules, settings files, builder exercise.", link: "#m23" },
    { t: 8, title: "Break", brk: true },
    { t: 17, title: "2.4–2.5 CLAUDE.md & the workflow", desc: "/init, what to include, auto memory; explore → plan → build → verify.", link: "#m24" },
    { t: 27, title: "Lab 2: Real mini use cases", desc: "Lock down secrets, teach conventions, one realistic task.", link: "#lab2" },
    { t: 8, title: "Knowledge check & homework", desc: "Eleven questions.", link: "#quiz2" }
  ],
  3: [
    { t: 8, title: "Recap", desc: "Quick-fire questions on Days 1–2.", link: "#day3" },
    { t: 27, title: "3.1 Connectors (MCP)", desc: "Remote vs local, scopes, connect the docs server, sign-in servers, security.", link: "#m31" },
    { t: 12, title: "3.2 Skills", desc: "SKILL.md anatomy, arguments, bundled skills, skill builder.", link: "#m32" },
    { t: 8, title: "3.3 Subagents, hooks, plugins & styles", desc: "Which extension for which trigger.", link: "#m33" },
    { t: 8, title: "Break", brk: true },
    { t: 12, title: "3.4 Beyond the terminal", desc: "VS Code power moves, Desktop, web, mobile, automation.", link: "#m34" },
    { t: 30, title: "Capstone lab", desc: "Plan, build, verify, skill, guard rails, connector.", link: "#lab3" },
    { t: 15, title: "Final assessment, certificate & next steps", desc: "Fifteen questions, certificate, 30-day plan, Q&A.", link: "#final" }
  ]
};

/* ---------------------------------------------------------------- Quizzes */
COURSE.quizzes = {
  day1: {
    title: "Day 1 knowledge check",
    qs: [
      { q: "What's the biggest difference between Claude chat and Claude Code?",
        o: ["Claude Code uses a special coding-only model", "Claude Code can act on your files and tools — reading, editing and running commands in a loop — with your permission", "Claude Code only works offline", "Claude chat can't write code"],
        a: 1, e: "Both use Claude models. What changes is the harness: tools that act, context management and permissions, running in an agentic loop." },
      { q: "Which three phases make up the agentic loop?",
        o: ["Plan, code, deploy", "Gather context, take action, verify results", "Read, write, commit", "Prompt, answer, forget"],
        a: 1, e: "Claude gathers context, takes action and verifies the result, repeating until the task is done — and you can interrupt at any point." },
      { q: "You ran irm https://claude.ai/install.ps1 | iex and now see 'claude' is not recognized. What should you try first?",
        o: ["Reinstall as administrator", "Open a new terminal window; if it still fails, add %USERPROFILE%\\.local\\bin to your PATH", "Install Node.js", "Use the macOS installer command"],
        a: 1, e: "PATH changes only apply to new terminal windows. The native installer needs neither admin rights nor Node.js." },
      { q: "Which shell command checks your installation without starting a session?",
        o: ["claude --check", "claude doctor", "claude status", "claude update"],
        a: 1, e: "claude doctor prints read-only install and settings diagnostics. Inside a session, /doctor can also offer to fix what it finds." },
      { q: "Is Git for Windows required to run Claude Code natively on Windows?",
        o: ["Yes — it won't start without it", "No — it's recommended because it enables the Bash tool; without it Claude uses PowerShell", "Only for the VS Code extension", "Only on Windows 11"],
        a: 1, e: "Git for Windows became optional in 2026. Without Git Bash, Claude Code runs shell commands through its PowerShell tool." },
      { q: "You installed only the VS Code extension. Why does typing claude in VS Code's integrated terminal fail?",
        o: ["VS Code blocks terminal programs", "The extension bundles a private CLI for its panel and doesn't add claude to your PATH — install the CLI too", "You must restart your computer", "The extension only works in Cursor"],
        a: 1, e: "Install the standalone CLI once and claude works in any terminal. The extension and CLI share settings and conversation history." },
      { q: "Claude is heading in the wrong direction mid-task. What do you press to stop it immediately?",
        o: ["Ctrl+Z", "Esc", "Tab", "Shift+Enter"],
        a: 1, e: "Esc stops the current action and keeps the work so far so you can redirect. Esc Esc on an empty prompt opens the rewind menu." },
      { q: "What does typing ! git status in Claude Code do?",
        o: ["Asks Claude to explain git", "Runs the command directly (shell mode); the output joins the conversation and Claude responds to it", "Negates the command", "Creates a git alias"],
        a: 1, e: "The ! prefix is shell mode: you run the command yourself, and Claude can react to the output." },
      { q: "Why switch to Manual mode for your first lab?",
        o: ["It makes Claude faster", "So you can see and approve each edit and command while you learn", "Auto mode can't edit files", "Manual mode is required to read files"],
        a: 1, e: "Auto mode is a sensible default for experienced users, but Manual mode makes every step visible — ideal while learning how Claude works." }
    ]
  },
  day2: {
    title: "Day 2 knowledge check",
    qs: [
      { q: "Your session has drifted across three unrelated tasks and Claude seems to forget earlier instructions. Best move?",
        o: ["Keep going — it will sort itself out", "/clear and start the next task fresh; put lasting rules in CLAUDE.md", "Exit and reinstall", "Switch to a different model"],
        a: 1, e: "A cluttered context degrades results. /clear between unrelated tasks; anything that should persist belongs in CLAUDE.md." },
      { q: "What does /compact do?",
        o: ["Deletes the conversation", "Summarises the conversation so far to free context, optionally with a focus you give it", "Compresses files on disk", "Shrinks the terminal font"],
        a: 1, e: "Use /compact to keep working on the same task with a lighter context, e.g. /compact keep the list of files changed." },
      { q: "Your rules: allow Bash(git *) and deny Bash(git push *). Claude runs git push origin main. What happens?",
        o: ["Allowed — the allow rule came first", "Denied — deny rules are checked first and win", "Claude asks you", "It depends on which file each rule is in"],
        a: 1, e: "Rules are evaluated deny → ask → allow, and the first match wins regardless of specificity or file." },
      { q: "Which mode lets Claude research and propose changes without editing files until you approve?",
        o: ["Accept edits", "Plan", "Auto", "Don't ask"],
        a: 1, e: "Plan mode separates thinking from doing. Approve the plan to let Claude start editing." },
      { q: "In auto mode, what reviews actions instead of you?",
        o: ["Nothing — everything just runs", "A separate classifier model that blocks risky actions", "Your IT department", "A git hook"],
        a: 1, e: "The classifier allows routine work and blocks things like curl | bash, force pushes, production deploys or sending secrets out. It reduces prompts but doesn't guarantee safety." },
      { q: "Where should permission rules that the whole project team shares live?",
        o: ["~/.claude/settings.json", ".claude/settings.json, committed to the repository", ".claude/settings.local.json", "CLAUDE.md"],
        a: 1, e: ".claude/settings.json is shared via git. settings.local.json is personal to you in that project; ~/.claude/settings.json applies to all your projects." },
      { q: "You want to make sure Claude never reads your .env file. What's the right tool?",
        o: ["Write \"never read .env\" in CLAUDE.md", "A deny rule: Read(./.env)", "Rename the file", "Use plan mode"],
        a: 1, e: "CLAUDE.md is guidance, not enforcement. A deny rule is enforced by Claude Code in every mode, even bypass." },
      { q: "When is bypass permissions mode (--dangerously-skip-permissions) appropriate?",
        o: ["Whenever prompts get annoying", "Only in isolated containers or VMs where Claude can't damage your system", "On client laptops for speed", "For the first session in a new project"],
        a: 1, e: "Bypass mode offers no protection against prompt injection or mistakes. For fewer prompts with safety checks, use auto mode." },
      { q: "What does /init do?",
        o: ["Initialises a git repository", "Analyses the project and writes a starter CLAUDE.md", "Resets all settings", "Installs Claude Code"],
        a: 1, e: "Run /init in any new project, then refine the file with what Claude couldn't discover on its own." },
      { q: "What can checkpoints (Esc Esc or /rewind) undo?",
        o: ["Everything, including deployments", "File edits made by Claude's file-editing tools — not shell commands like rm or mv, and not external systems", "Only git commits", "Nothing once you exit"],
        a: 1, e: "Checkpoints survive resuming a session but only cover Claude's edit tools. Commit often — git is your real undo." },
      { q: "Which is the best line to put in CLAUDE.md?",
        o: ["Write clean, high-quality code", "Run `python -m unittest -v` before committing", "A 500-line copy of the API documentation", "A description of every file in the project"],
        a: 1, e: "Good instructions are concrete and verifiable, and cover what Claude can't work out by reading the files." }
    ]
  },
  day3: {
    title: "Day 3 knowledge check",
    qs: [
      { q: "What is MCP used for?",
        o: ["Compressing models to run offline", "Connecting Claude to external tools and data through an open standard (Model Context Protocol)", "Running several Claude processes at once", "Managing Claude subscriptions"],
        a: 1, e: "MCP servers (\"connectors\") let Claude read and act on systems like issue trackers, wikis, databases and browsers." },
      { q: "What is the default scope of claude mcp add?",
        o: ["user", "local — just you, in the current project", "project", "organisation"],
        a: 1, e: "Local is the default and is stored in ~/.claude.json under the project. Use --scope user for all projects or --scope project to share." },
      { q: "How do you share an MCP server with your team through git?",
        o: ["--scope local", "--scope project, which writes .mcp.json in the project root", "--scope user", "Email everyone the URL"],
        a: 1, e: "Commit .mcp.json. Teammates see an approval prompt the first time Claude Code loads the server." },
      { q: "A remote server shows \"! Needs authentication\". What's next?",
        o: ["Delete and re-add it", "Run /mcp, select it and choose Authenticate (or claude mcp login <name>)", "Restart your computer", "Switch to plan mode"],
        a: 1, e: "OAuth servers like Sentry or Notion need a one-time browser sign-in. Token-based servers take the token with --header when you add them." },
      { q: "In claude mcp add --transport stdio myserver -- npx -y some-server, what is the -- for?",
        o: ["It's a comment", "It separates Claude Code's own options from the command that starts the server", "It's required for HTTP servers", "It makes the server user-scoped"],
        a: 1, e: "Everything after -- is passed to the server untouched, so its flags aren't mistaken for Claude Code options." },
      { q: "Where does a project skill live?",
        o: [".claude/skills/<name>/SKILL.md", "CLAUDE.md", ".mcp.json", "settings.json"],
        a: 0, e: "Personal skills live in ~/.claude/skills/<name>/SKILL.md. Older .claude/commands/*.md files still work too." },
      { q: "You want a /deploy skill that Claude never triggers on its own. Which frontmatter do you use?",
        o: ["user-invocable: false", "disable-model-invocation: true", "allowed-tools: Bash", "context: fork"],
        a: 1, e: "disable-model-invocation: true means only you can run it — right for anything with side effects." },
      { q: "Which feature guarantees an action happens every time, such as formatting after every edit?",
        o: ["A CLAUDE.md instruction", "A hook", "A skill", "An output style"],
        a: 1, e: "Hooks are deterministic: they always fire on their event. Instructions and skills are interpreted by Claude." },
      { q: "What does claude -p \"query\" do?",
        o: ["Starts plan mode", "Runs non-interactively (print mode): answers, then exits — good for scripts and CI", "Opens a project", "Pauses Claude"],
        a: 1, e: "Combine -p with --output-format json, --allowedTools and --max-turns for safe automation." },
      { q: "When do connectors you added at claude.ai/customize/connectors appear in Claude Code?",
        o: ["Always, whatever you sign in with", "When you're signed in to Claude Code with that claude.ai account", "Only when using an API key", "Never — they're chat-only"],
        a: 1, e: "They load only when your active sign-in is a claude.ai subscription — not with an API key or a cloud provider." }
    ]
  },
  final: {
    title: "Final assessment",
    pass: 0.8,
    qs: [
      { q: "A project folder contains 300 exported PDFs that need renaming by the date inside each filename. What's the best approach?",
        o: ["Paste the file names into Claude chat and rename them by hand", "Run Claude Code in the folder, start in plan mode, review the mapping, then let it rename — after making a backup or commit", "Neither tool can help", "Only the VS Code extension can rename files"],
        a: 1, e: "Claude Code can act on the files directly. Renames done by shell commands aren't covered by rewind, so back up or commit first." },
      { q: "On Windows the installer prints \"The token '&&' is not a valid statement separator\". What happened?",
        o: ["Your Windows version is too old", "You ran the CMD install command in PowerShell — use irm https://claude.ai/install.ps1 | iex", "You need administrator rights", "Git for Windows is missing"],
        a: 1, e: "Check the prompt: PS C:\\> means PowerShell; C:\\> without PS means CMD. Each has its own install command." },
      { q: "Which command shows what's filling Claude's context window?",
        o: ["/usage", "/context", "/status", "/memory"],
        a: 1, e: "/context draws a coloured grid with suggestions; /usage is about cost and plan limits." },
      { q: "You need Claude to research a large codebase without bloating your main conversation. What do you do?",
        o: ["Paste every file into the chat", "Ask Claude to use a subagent for the investigation", "Turn on bypass mode", "Use /export first"],
        a: 1, e: "Subagents work in their own context window and return only a summary." },
      { q: "Which file holds a personal allow rule that should apply only to you, in this project?",
        o: ["~/.claude/settings.json", ".claude/settings.json", ".claude/settings.local.json", ".mcp.json"],
        a: 2, e: "settings.local.json is personal and not committed. \"Yes, and don't ask again\" saves command rules there." },
      { q: "In what order are permission rules evaluated?",
        o: ["Allow, ask, deny", "Deny, ask, allow — first match wins", "Most specific first", "By the order of the settings files"],
        a: 1, e: "Deny always wins; an allow rule can't carve an exception out of a deny rule." },
      { q: "Early in a long auto-mode session you told Claude \"don't push\". Is that a guarantee?",
        o: ["Yes, forever", "No — the classifier respects it, but it can be lost when the conversation is compacted; use a deny or ask rule for a guarantee", "Yes, until you restart your computer", "Auto mode ignores instructions entirely"],
        a: 1, e: "Boundaries stated in chat are re-read from the transcript. Rules in settings are enforced every time." },
      { q: "Which task is the best fit for plan mode?",
        o: ["Fixing a typo in a heading", "Restructuring a multi-file reporting workflow you don't fully understand yet", "Asking what time zone a file uses", "Renaming one variable"],
        a: 1, e: "Plan when the change spans several files or the approach is unclear. If you can describe the diff in one sentence, skip the plan." },
      { q: "Where do you define a connector so everyone who clones the repository gets it?",
        o: ["~/.claude.json", ".mcp.json in the project root", "CLAUDE.md", "A skill"],
        a: 1, e: "Use claude mcp add --scope project or edit .mcp.json, then commit it." },
      { q: "A shared .mcp.json needs an API key. How should you handle it?",
        o: ["Paste the key into .mcp.json and commit it", "Reference an environment variable such as ${API_KEY} and keep the real value out of git", "Email the key to the team", "Put it in CLAUDE.md"],
        a: 1, e: ".mcp.json supports ${VAR} and ${VAR:-default} expansion in command, args, env, url and headers." },
      { q: "Every month you paste the same six-step prompt to produce a status report. What should you create?",
        o: ["A hook", "A skill (your own /monthly-report command)", "A new CLAUDE.md for each month", "A plugin marketplace"],
        a: 1, e: "Skills turn repeated prompts and procedures into consistent, shareable slash commands." },
      { q: "Claude keeps using the wrong date format in every new session. Best fix?",
        o: ["Correct it in chat each time", "Add the format to CLAUDE.md", "Switch to a bigger model", "Use /compact"],
        a: 1, e: "CLAUDE.md loads at the start of every session — the place for \"always do X\" rules." },
      { q: "You want every file formatted after Claude edits it, with no exceptions. Which feature?",
        o: ["A CLAUDE.md instruction", "A PostToolUse hook matching Edit|Write", "An output style", "A subagent"],
        a: 1, e: "Hooks run deterministically on lifecycle events; instructions can be forgotten or ignored." },
      { q: "What does pressing Esc twice on an empty prompt do?",
        o: ["Exits Claude Code", "Opens the rewind menu to restore code and/or conversation, or summarise part of it", "Clears your settings", "Switches model"],
        a: 1, e: "With text in the prompt, Esc Esc clears the draft instead (and saves it to history)." },
      { q: "Which statement about the VS Code extension is true?",
        o: ["It doesn't support checkpoints", "It supports checkpoints and /mcp, but not the ! shell shortcut or tab completion", "It's required to use the CLI", "It can only read files, not edit them"],
        a: 1, e: "For CLI-only features, run claude in VS Code's integrated terminal (after installing the CLI)." }
    ]
  }
};

/* ---------------------------------------------------------------- Games */
COURSE.sorter = {
  title: "Chat or Claude Code? Sort these tasks",
  items: [
    { t: "Brainstorm ten names for an internal AI workshop", a: "chat", f: "Pure thinking and writing — no files or tools involved, so chat is simpler." },
    { t: "Rename 300 scanned files in a folder using the date inside each name", a: "code", f: "Needs to see and change many files: Claude Code does it directly (plan first, keep a backup)." },
    { t: "Find out why a test in a repository fails, and fix it", a: "code", f: "Requires running tests, reading code and editing files — the agentic loop in action." },
    { t: "Draft a polite reply to a client email you paste in", a: "chat", f: "A single piece of writing from text you provide — chat is the natural fit." },
    { t: "Combine 12 monthly CSV exports into one summary with a chart", a: "code", f: "Claude Code reads every file, computes, writes the outputs and can verify the totals." },
    { t: "Explain what a \"context window\" is", a: "chat", f: "A knowledge question with no project involved. (Claude Code can answer too, but chat is enough.)" },
    { t: "Update a project's README so it matches the current code", a: "code", f: "Claude Code reads the actual code before editing the README — no copy-paste." },
    { t: "Build a clickable HTML prototype and open it in your browser", a: "code", f: "Claude Code writes the files and can open them; chat can only show code for you to copy." },
    { t: "Summarise one article you've pasted in", a: "chat", f: "One input, one output — chat handles it well." },
    { t: "Turn a folder of meeting notes into a single action tracker", a: "code", f: "Multi-file reading plus writing a new file is classic Claude Code work." }
  ]
};

COURSE.drill = [
  { s: "Your context is filling up but you want to keep working on the same task.", a: "/compact" },
  { s: "You're switching to a completely unrelated task.", a: "/clear" },
  { s: "You want to see what's using Claude's context window.", a: "/context" },
  { s: "Claude's last few edits went the wrong way — undo them.", a: "/rewind" },
  { s: "Pick up yesterday's conversation.", a: "/resume" },
  { s: "Generate a starter CLAUDE.md for a new project.", a: "/init" },
  { s: "Switch to a different model.", a: "/model" },
  { s: "Check how much of your plan usage you've used.", a: "/usage" },
  { s: "Review and edit your allow / ask / deny rules.", a: "/permissions" },
  { s: "Connect or sign in to an MCP connector.", a: "/mcp" },
  { s: "Edit your CLAUDE.md or browse auto memory.", a: "/memory" },
  { s: "Ask a quick question without adding it to the conversation.", a: "/btw" },
  { s: "Have Claude research and propose before touching any file.", a: "/plan" },
  { s: "See every change made so far before committing.", a: "/diff" },
  { s: "Diagnose installation or configuration problems.", a: "/doctor" },
  { s: "Check your changes for bugs before committing.", a: "/code-review" },
  { s: "See your version, account and current model.", a: "/status" },
  { s: "Name this session so you can find it next week.", a: "/rename" },
  { s: "Repeat a check every 5 minutes while you work.", a: "/loop" },
  { s: "Copy Claude's last answer to your clipboard.", a: "/copy" },
  { s: "Discover features through short interactive lessons.", a: "/powerup" },
  { s: "Make Claude think harder on a tricky problem for the rest of the session.", a: "/effort" },
  { s: "Change the theme, editor mode or output style.", a: "/config" },
  { s: "Give Claude access to a second folder for this session.", a: "/add-dir" }
];

/* ---------------------------------------------------------------- Commands */
COURSE.categories = {
  start: "Start & help",
  context: "Context & sessions",
  model: "Model & usage",
  safety: "Permissions & safety",
  config: "Configure & personalise",
  extend: "Memory, MCP & skills",
  review: "Review & quality",
  auto: "Automation & parallel work",
  surfaces: "Other surfaces & integrations"
};

COURSE.commands = [
  // start
  { c: "/help", cat: "start", e: 1, d: "Show help and the commands available to you.", w: "You've forgotten a command." },
  { c: "/powerup", cat: "start", e: 1, d: "Short interactive lessons with animated demos that teach Claude Code features.", w: "Learning or discovering features." },
  { c: "/init", cat: "start", e: 1, d: "Analyse the project and write a starter CLAUDE.md, or suggest improvements to an existing one.", w: "First session in any project." },
  { c: "/doctor", a: "/checkup", cat: "start", e: 1, d: "Setup checkup: install health, PATH, settings errors, unused skills/servers, slow hooks. Reports first and asks before fixing. In your shell, claude doctor is the read-only version.", w: "Something seems broken.", x: "/doctor prompt-audit" },
  { c: "/status", cat: "start", e: 1, d: "Show version, model, account and connectivity. Works while Claude is responding.", w: "Which account or model am I on?" },
  { c: "/login", cat: "start", d: "Sign in to your Anthropic account, or switch accounts.", w: "Changing account or re-authenticating." },
  { c: "/logout", cat: "start", d: "Sign out of your Anthropic account.", w: "Shared or borrowed machine." },
  { c: "/release-notes", cat: "start", d: "Browse the changelog in a version picker.", w: "After an update, to see what's new." },
  { c: "/feedback", cat: "start", d: "Send product feedback to Anthropic (consent screen first).", w: "Reporting false positives or ideas." },
  { c: "/bug", a: "/share", cat: "start", d: "Report a bug, choosing how much session history to include.", w: "Something behaved incorrectly." },
  { c: "/exit", a: "/quit", cat: "start", e: 1, d: "Exit Claude Code (Ctrl+D twice also works).", w: "Done for now — resume later with claude -c." },
  { c: "/import", cat: "start", d: "Bring instruction files, MCP servers, commands and skills over from OpenAI Codex, Gemini CLI or Cursor.", w: "Migrating from another coding agent.", x: "/import cursor --dry-run" },
  { c: "/mobile", a: "/ios, /android", cat: "start", d: "Show a QR code to download the Claude mobile app.", w: "Setting up Remote Control on your phone." },
  // context
  { c: "/clear", a: "/reset, /new", cat: "context", e: 1, d: "Start a new conversation with empty context. The previous one stays available in /resume.", w: "Switching to an unrelated task." },
  { c: "/compact", cat: "context", e: 1, d: "Summarise the conversation so far to free context; optionally say what to focus on.", w: "Long session, same task.", x: "/compact keep the list of files changed" },
  { c: "/context", cat: "context", e: 1, d: "Coloured grid of context usage, with tips about heavy tools and memory bloat.", w: "Claude seems forgetful or slow." },
  { c: "/btw", cat: "context", e: 1, d: "Ask a side question answered from the current context. It never enters the history and uses no tools.", w: "Quick check without derailing.", x: "/btw what was that config file called?" },
  { c: "/rewind", a: "/checkpoint, /undo", cat: "context", e: 1, d: "Restore code and/or conversation to an earlier checkpoint, or summarise part of the conversation. Same as Esc Esc.", w: "Claude went the wrong way." },
  { c: "/resume", a: "/continue", cat: "context", e: 1, d: "Resume an earlier conversation by name or ID, or pick from a list.", w: "Multi-day work.", x: "/resume q3-analysis" },
  { c: "/rename", cat: "context", e: 1, d: "Name the current session (shown on the prompt bar; resume it by name later).", w: "Work you'll come back to.", x: "/rename client-deck-data" },
  { c: "/branch", cat: "context", d: "Branch the conversation at this point to try another direction; the original is preserved.", w: "Exploring an alternative approach." },
  { c: "/diff", cat: "context", e: 1, d: "Review the changes in your working tree, including Claude's edits, per file and per turn.", w: "Before accepting or committing." },
  { c: "/copy", cat: "context", e: 1, d: "Copy the last (or Nth-latest) response; pick individual code blocks; press w to write to a file.", w: "Pasting results elsewhere.", x: "/copy 2" },
  { c: "/export", cat: "context", d: "Export the conversation as plain text to the clipboard or a file.", w: "Keeping a record or sharing a session.", x: "/export session-notes.txt" },
  { c: "/recap", cat: "context", d: "Generate a one-line summary of the session.", w: "Coming back after a break." },
  { c: "/autocompact", cat: "context", d: "Set how full the context gets before Claude Code compacts automatically.", w: "Tuning long sessions.", x: "/autocompact 500k" },
  { c: "/cd", cat: "context", d: "Move the session to another working directory, keeping the conversation.", w: "You started in the wrong folder.", x: "/cd ../reports" },
  // model
  { c: "/model", cat: "model", e: 1, d: "Switch model and save it as your default (press s in the picker for this session only). Left/right arrows adjust effort.", w: "Harder task, or cheaper/faster needed.", x: "/model sonnet" },
  { c: "/effort", cat: "model", e: 1, d: "Set reasoning depth: low, medium, high, xhigh, max (session only) or auto.", w: "Tricky problem vs quick edit.", x: "/effort high" },
  { c: "/usage", a: "/cost, /stats", cat: "model", e: 1, d: "Session cost, plan usage limits, what's driving usage, and activity stats.", w: "Watching your budget." },
  { c: "/fast", cat: "model", d: "Toggle fast mode: Opus responses up to ~2.5× faster at a higher price per token.", w: "Live debugging or rapid iteration." },
  { c: "/advisor", cat: "model", d: "Let Claude consult a second model for guidance at key moments during a task.", w: "Hard tasks where a second opinion helps.", x: "/advisor opus" },
  { c: "/rate-limit-options", cat: "model", d: "Options when a usage limit blocks you: wait and continue automatically, add usage credits, or upgrade.", w: "You've hit a limit." },
  { c: "/usage-credits", cat: "model", d: "Configure usage credits, or request them from your admin on Team/Enterprise.", w: "You need more usage this period." },
  { c: "/upgrade", cat: "model", d: "Open the upgrade page for a higher plan tier.", w: "You regularly hit limits." },
  // safety
  { c: "/permissions", a: "/allowed-tools", cat: "safety", e: 1, d: "Manage allow/ask/deny rules by scope, working directories, and recent auto-mode denials (press r to retry one).", w: "Too many prompts, or not enough control." },
  { c: "/plan", cat: "safety", e: 1, d: "Enter plan mode, optionally starting on a task straight away.", w: "Bigger or riskier changes.", x: "/plan restructure the reports folder" },
  { c: "/add-dir", cat: "safety", e: 1, d: "Give Claude access to an extra folder for this session.", w: "Work spans two folders.", x: "/add-dir ../shared-data" },
  { c: "/sandbox", cat: "safety", d: "Toggle OS-level sandboxing for shell commands (macOS, Linux, WSL 2).", w: "Fewer prompts with hard isolation." },
  { c: "/fewer-permission-prompts", cat: "safety", d: "Scan past sessions for common read-only commands and propose an allow list in project settings.", w: "Prompt fatigue." },
  { c: "/auto-mode-setup", cat: "safety", d: "Draft trusted-infrastructure entries for auto mode from your project and recent sessions.", w: "Auto mode blocks routine work on your systems." },
  // config
  { c: "/config", a: "/settings", cat: "config", e: 1, d: "Open the settings panel (theme, model, output style, editor mode…) or set keys directly.", w: "Personalising Claude Code.", x: "/config theme=dark" },
  { c: "/theme", cat: "config", d: "Change the colour theme, including colour-blind-friendly and custom themes.", w: "Readability." },
  { c: "/output-style", cat: "config", d: "Switch response style: Default, Explanatory, Learning, Concise or Proactive.", w: "Want more explanation, or shorter answers.", x: "/output-style explanatory" },
  { c: "/terminal-setup", cat: "config", d: "Install a Shift+Enter newline binding (VS Code, Cursor, Alacritty, Zed); enables Option+Enter in Apple Terminal.", w: "Shift+Enter doesn't add a new line." },
  { c: "/statusline", cat: "config", d: "Configure a custom status line, e.g. context usage or git branch.", w: "Keeping an eye on context." },
  { c: "/keybindings", cat: "config", d: "Open your keyboard shortcuts file to customise bindings.", w: "Remapping keys." },
  { c: "/color", cat: "config", d: "Colour the prompt bar for this session.", w: "Telling several open sessions apart.", x: "/color purple" },
  { c: "/tui", cat: "config", d: "Switch between the default and the flicker-free fullscreen renderer.", w: "Display flicker, or you want mouse support.", x: "/tui fullscreen" },
  { c: "/focus", cat: "config", d: "Focus view: just your prompt, a one-line tool summary and the answer (fullscreen renderer).", w: "Less noise." },
  { c: "/voice", cat: "config", d: "Toggle voice dictation (hold or tap Space). Needs a claude.ai account.", w: "Dictating long prompts." },
  { c: "/update-config", cat: "config", d: "Describe a settings change in words; Claude edits the right settings.json.", w: "Allowing a command or adding a hook without editing JSON.", x: "/update-config allow python -m unittest without asking" },
  { c: "/privacy-settings", cat: "config", d: "View and update privacy settings (Pro and Max plans).", w: "Checking data-training preferences." },
  // extend
  { c: "/memory", cat: "extend", e: 1, d: "Edit CLAUDE.md files, toggle auto memory and browse what Claude has saved.", w: "Teaching Claude your conventions." },
  { c: "/mcp", cat: "extend", e: 1, d: "Manage MCP connectors: status, OAuth sign-in, enable/disable, reconnect.", w: "Connecting or fixing a connector.", x: "/mcp reconnect sentry" },
  { c: "/skills", cat: "extend", e: 1, d: "List available skills; filter, sort by token cost, change visibility.", w: "Seeing what Claude can do on demand." },
  { c: "/reload-skills", cat: "extend", d: "Pick up skills added or changed on disk during the session.", w: "You just created a skill." },
  { c: "/hooks", cat: "extend", e: 1, d: "View configured hooks by event (read-only browser).", w: "Checking a hook is registered." },
  { c: "/agents", cat: "extend", d: "Reminds you to ask Claude to create or manage subagents, or to edit .claude/agents/ directly.", w: "Setting up specialised helpers." },
  { c: "/plugin", cat: "extend", e: 1, d: "Browse marketplaces and install, enable or disable plugins.", w: "Adding a bundle of skills, hooks and servers.", x: "/plugin install mcp-server-dev@claude-plugins-official" },
  { c: "/reload-plugins", cat: "extend", d: "Apply plugin changes without restarting.", w: "After installing or editing a plugin." },
  { c: "/skill-doctor", cat: "extend", d: "Show what each skill costs in context and how often it's used.", w: "Pruning unused skills." },
  // review
  { c: "/code-review", a: "/review", cat: "review", e: 1, d: "Review the current diff (or a PR, branch or path) for correctness bugs. --fix applies findings, --comment posts to the PR, ultra runs a deep cloud review.", w: "Before committing.", x: "/code-review high --fix" },
  { c: "/security-review", cat: "review", e: 1, d: "Analyse your branch's changes for security vulnerabilities (needs an origin remote).", w: "Before opening a pull request." },
  { c: "/simplify", cat: "review", d: "Four parallel reviewers find and apply clean-ups: reuse, simplification, efficiency.", w: "Tidying working code." },
  { c: "/verify", cat: "review", d: "Build and run your app to confirm a change really does what it should.", w: "Tests pass but you want proof in the real app." },
  { c: "/run", cat: "review", d: "Launch and drive your app to see a change working.", w: "Demoing a change." },
  { c: "/debug", cat: "review", d: "Turn on debug logging for this session and troubleshoot Claude Code itself.", w: "Odd behaviour you can't explain." },
  { c: "/ultrareview", cat: "review", d: "Deep multi-agent code review in a cloud sandbox (alias of /code-review ultra).", w: "High-stakes changes." },
  { c: "/insights", cat: "review", d: "HTML report on your recent sessions: how you use Claude Code, where things go wrong, features to try.", w: "Improving your own habits." },
  // auto
  { c: "/loop", a: "/proactive", cat: "auto", d: "Repeat a prompt while the session stays open; omit the interval to let Claude pace itself.", w: "Polling a long-running job.", x: "/loop 5m check whether the export finished" },
  { c: "/schedule", a: "/routines", cat: "auto", d: "Create cloud routines that run on a schedule or trigger, even when your computer is off.", w: "Recurring reports or reviews." },
  { c: "/goal", cat: "auto", d: "Keep working across turns until a condition is met.", w: "Hands-off completion.", x: "/goal all tests in tests/ pass" },
  { c: "/batch", cat: "auto", d: "Split a large change into 5–30 independent units, each run by a background agent in its own worktree.", w: "Codebase-wide migrations." },
  { c: "/tasks", a: "/bashes", cat: "auto", d: "View and manage background work: shells and subagents.", w: "Checking a dev server or long job." },
  { c: "/background", a: "/bg", cat: "auto", d: "Detach this session to keep running in the background; monitor with claude agents.", w: "Freeing your terminal." },
  { c: "/fork", cat: "auto", d: "Copy the conversation into a new background session and keep working here.", w: "Trying two things at once." },
  { c: "/subtask", cat: "auto", d: "Hand a side task to a forked subagent; its result comes back to this conversation.", w: "Parallel side research." },
  { c: "/deep-research", cat: "auto", d: "Fan out web searches, cross-check sources and synthesise a cited report.", w: "Research questions." },
  // surfaces
  { c: "/ide", cat: "surfaces", d: "Connect to VS Code or JetBrains when Claude runs in an external terminal; show status.", w: "You want diffs in your editor." },
  { c: "/desktop", a: "/app", cat: "surfaces", d: "Continue this session in the Desktop app (macOS / x64 Windows, Claude subscription).", w: "Visual diff review." },
  { c: "/teleport", a: "/tp", cat: "surfaces", d: "Pull a cloud session into this terminal (Claude subscription).", w: "Continuing web work locally." },
  { c: "/remote-control", a: "/rc", cat: "surfaces", d: "Continue this local session from claude.ai or the Claude mobile app.", w: "Stepping away from your desk." },
  { c: "/install-github-app", cat: "surfaces", d: "Set up the Claude GitHub App and Actions so people can @claude on issues and PRs.", w: "Automating reviews and triage." },
  { c: "/install-slack-app", cat: "surfaces", d: "Install the Claude Slack app.", w: "Routing requests from Slack." },
  { c: "/chrome", cat: "surfaces", d: "Configure Claude in Chrome for browser automation and testing.", w: "Testing web pages." },
  { c: "/web-setup", cat: "surfaces", d: "Connect GitHub for cloud sessions using your local gh credentials.", w: "First cloud session." },
  { c: "/autofix-pr", cat: "surfaces", d: "Start a cloud session that watches your PR and pushes fixes for CI failures and review comments.", w: "Getting a PR to green." },
  { c: "/team-onboarding", cat: "surfaces", d: "Generate an onboarding guide for teammates from your last 30 days of usage.", w: "Helping colleagues get set up." },
  { c: "/artifacts", cat: "surfaces", d: "List artifacts (pages published to claude.ai) you own or that are shared with you, where available.", w: "Sharing results as a web page." },
  { c: "/slides", cat: "surfaces", d: "Create a slide-deck artifact from a brief (where available).", w: "Quick presentations.", x: "/slides a quarterly review of the analytics team" },
  { c: "/dataviz", cat: "surfaces", d: "Design guidance for charts and dashboards, with palette and accessibility checks.", w: "Building a chart or dashboard." }
];

/* ---------------------------------------------------------------- Shortcuts */
COURSE.shortcuts = [
  { group: "Control the session", rows: [
    { k: "Esc", d: "Interrupt Claude (work so far is kept); close a dialog; decline a permission prompt" },
    { k: "Esc Esc", d: "Empty prompt: open the rewind menu · with text: clear the draft (saved to history)" },
    { k: "Ctrl+C", d: "Interrupt; on an empty prompt the second press exits" },
    { k: "Ctrl+D", d: "Exit (press twice)" },
    { k: "Shift+Tab", win: "Shift+Tab / Alt+M", d: "Cycle permission modes (Alt+M is a fallback on some Windows terminals)" },
    { k: "Ctrl+Enter", d: "Send queued messages now" },
    { k: "Ctrl+B", d: "Move a running command or agent to the background" },
    { k: "Ctrl+X Ctrl+K", d: "Stop all background subagents (press twice within 3 seconds)" },
    { k: "Ctrl+L", d: "Redraw the screen if it looks garbled" }
  ]},
  { group: "Type and edit prompts", rows: [
    { k: "\\ Enter", d: "New line (works in every terminal)" },
    { k: "Shift+Enter", d: "New line in iTerm2, WezTerm, Ghostty, Kitty, Warp, Apple Terminal, Windows Terminal (others: /terminal-setup)" },
    { k: "Ctrl+J", d: "New line, any terminal" },
    { k: "Ctrl+G", d: "Write the prompt in your default text editor" },
    { k: "Up / Down", d: "Move through prompt history" },
    { k: "Ctrl+R", d: "Search prompt history" },
    { k: "Ctrl+S", d: "Stash the current prompt; press again on an empty prompt to restore it" },
    { k: "Tab", d: "Accept a suggestion; on a permission prompt, add a comment to Yes/No" },
    { k: "Ctrl+_", d: "Undo the last edit to your input" },
    { k: "Ctrl+W", d: "Delete back to the previous space" },
    { k: "Ctrl+U / Ctrl+K", d: "Delete to start / end of line" },
    { mac: "Ctrl+V", win: "Alt+V", d: "Paste an image from the clipboard" }
  ]},
  { group: "Symbols at the start of a prompt", rows: [
    { k: "/", d: "Commands and skills menu" },
    { k: "@", d: "Mention a file, folder or MCP resource" },
    { k: "!", d: "Shell mode — run a command directly" },
    { k: "?", d: "Show the shortcut help panel (empty prompt)" }
  ]},
  { group: "Model, thinking and views", rows: [
    { mac: "Option+P", win: "Alt+P", d: "Switch model without clearing your prompt" },
    { mac: "Option+T", win: "Alt+T", d: "Toggle extended thinking (no effect on models that always think, e.g. Opus 5.5)" },
    { mac: "Option+O", win: "Alt+O", d: "Toggle fast mode" },
    { k: "Ctrl+O", d: "Toggle the detailed transcript view (every tool call)" },
    { k: "Ctrl+T", d: "Show / hide Claude's task checklist" }
  ]},
  { group: "VS Code extension", rows: [
    { mac: "Cmd+Esc", win: "Ctrl+Esc", d: "Toggle focus between the editor and Claude" },
    { mac: "Cmd+Shift+Esc", win: "Ctrl+Shift+Esc", d: "Open a new conversation in a tab" },
    { mac: "Option+K", win: "Alt+K", d: "Insert an @-mention of the current file and selection" },
    { mac: "Ctrl+Option+F", win: "Ctrl+Alt+F", d: "Toggle Focus view" },
    { mac: "Cmd+Shift+T", win: "Ctrl+Shift+T", d: "Reopen the last closed Claude session tab" },
    { mac: "Cmd+Shift+P", win: "Ctrl+Shift+P", d: "Command Palette — type \"Claude Code\" for all extension commands" }
  ]}
];

/* ---------------------------------------------------------------- Prompt library */
COURSE.prompts = [
  { cat: "Understand", p: "give me an overview of this codebase: architecture, key directories, and how the pieces connect", tip: "A great first prompt in any unfamiliar project or folder." },
  { cat: "Understand", p: "explain what {path} does and how data flows through it. write it up as an HTML page with a diagram, then open it in my browser" },
  { cat: "Understand", p: "where do we {validate uploaded file types}?" },
  { cat: "Understand", p: "what would break if I deleted {the retryWithBackoff helper}?" },
  { cat: "Understand", p: "I am a {PM}. walk me through what happens when a user {clicks Export to PDF}, from the UI down to the result", tip: "Ideal for non-developers getting oriented." },
  { cat: "Understand", p: "look through the commit history of {path} and summarize how it evolved and why" },
  { cat: "Plan", p: "plan how to refactor the {payment module} to {support multiple currencies}. list the files you would change, but don't edit anything yet" },
  { cat: "Plan", p: "I want to build {feature}. interview me about implementation, UX, edge cases, and tradeoffs until we have covered everything, then write the spec to SPEC.md" },
  { cat: "Plan", p: "list the error states, empty states, and edge cases for {feature} that the design needs to cover" },
  { cat: "Build", p: "create a {cost calculator} using HTML, CSS, and vanilla JavaScript, then open it in my browser", tip: "Instant prototypes with nothing to install." },
  { cat: "Build", p: "look at how {an existing report} is implemented to understand the pattern, then build {the new one} the same way" },
  { cat: "Build", p: "here is a mockup. build a working prototype I can click through, matching the layout and states shown", tip: "Paste the image first (Ctrl+V on macOS, Alt+V on Windows)." },
  { cat: "Build", p: "find every place we say \"{old wording}\" or a close variant, show me each one in context, then update them all to \"{new wording}\". leave tests and the changelog alone" },
  { cat: "Data", p: "read {sales.csv}, summarize the key patterns, and write the results to {summary.md}" },
  { cat: "Data", p: "read {campaigns.csv}, find the underperforming {headlines}, and generate {5} new variations that stay under {90} characters" },
  { cat: "Data", p: "show me all {failed logins} for {the finance group} over {the last 30 days}. write the query, run it, and tell me what stands out", tip: "Needs a database connector — use read-only credentials." },
  { cat: "Documents", p: "read @meeting-notes.md and write up the action items, then create a {Jira} ticket for each with acceptance criteria", tip: "Creating tickets needs a connector for your tracker." },
  { cat: "Documents", p: "read the {case studies} in {folder} to learn the structure and voice, then draft a new one for {topic}" },
  { cat: "Documents", p: "compare {v1.2} to {v1.3} and draft release notes grouped by feature, fix, and breaking change" },
  { cat: "Documents", p: "review {proposal.md} for {clarity and unsupported claims} and list anything I should fix before it goes to {the partner}" },
  { cat: "Review", p: "review my uncommitted changes and flag anything that looks risky before I commit" },
  { cat: "Review", p: "use a subagent to review {path} for security issues and report what it finds" },
  { cat: "Review", p: "here is my Terraform plan output. what is this going to do, and is anything here going to cause problems?" },
  { cat: "Git", p: "commit these changes with a message that summarizes what I did" },
  { cat: "Git", p: "resolve the merge conflicts in this branch and explain what you kept from each side" },
  { cat: "Debug", p: "the {test_average} test is failing, find out why and fix it" },
  { cat: "Debug", p: "here is a build error. fix the root cause and verify the build succeeds", tip: "Paste the full error — don't paraphrase it." },
  { cat: "Automate", p: "create a /{weekly-report} skill for this project that {collects updates from notes/ and drafts a status report}" },
  { cat: "Automate", p: "write a hook that {runs the formatter} after every {file edit}" },
  { cat: "Automate", p: "set up the {Notion} MCP server so you can read my {project pages} directly" },
  { cat: "Automate", p: "summarize what we did this session and suggest what to add to CLAUDE.md" },
  { cat: "Steer", p: "that is not right: {feedback}. try a different approach" },
  { cat: "Steer", p: "that is too much. keep only the changes to {scope} and undo your other edits" },
  { cat: "Steer", p: "you keep {using US spelling}. add a rule to CLAUDE.md so this stops happening" }
];

/* ---------------------------------------------------------------- Glossary */
COURSE.glossary = [
  ["Agentic loop", "Claude's cycle of gathering context, taking action and verifying results, repeated until the task is done."],
  ["Auto memory", "Notes Claude writes for itself (a per-project MEMORY.md) about your preferences and project context. Browse it with /memory."],
  ["Auto mode", "Permission mode where a separate classifier model reviews actions instead of prompting you, blocking risky ones."],
  ["Bundled skill", "A skill that ships with Claude Code, such as /code-review, /simplify or /loop."],
  ["Checkpoint", "An automatic snapshot taken before each prompt. Restore code and/or conversation with Esc Esc or /rewind."],
  ["Classifier", "The model that judges actions in auto mode."],
  ["CLAUDE.md", "A Markdown file of instructions Claude reads at the start of every session (project, personal, local or organisation level)."],
  ["CLI", "Command-line interface — the claude program you run in a terminal."],
  ["Compaction", "Summarising the conversation to free context, automatically or with /compact."],
  ["Connector", "The claude.ai name for an integration built on MCP."],
  ["Context window", "Everything Claude can see at once: instructions, conversation, files read and command output — the session's working memory."],
  ["Effort", "How much reasoning Claude applies: low, medium, high, xhigh, max. Set with /effort."],
  ["Harness", "The layer around the model that provides tools, context and permissions — Claude Code itself."],
  ["Hook", "Your own command that runs automatically at a lifecycle event, such as after every file edit."],
  ["MCP (Model Context Protocol)", "Open standard for connecting AI tools to external systems and data."],
  ["MCP server", "A program or hosted service that exposes tools and data to Claude through MCP."],
  ["Output style", "A switchable set of instructions for Claude's role, tone and response format (e.g. Explanatory)."],
  ["Permission mode", "The baseline for what runs without asking: Manual, Accept edits, Plan, Auto, Don't ask or Bypass."],
  ["Permission rule", "An allow, ask or deny entry for a specific tool or pattern, e.g. Bash(git push *)."],
  ["Plan mode", "Claude researches and proposes a plan; no file edits until you approve it."],
  ["Plugin", "An installable bundle of skills, subagents, hooks and MCP servers."],
  ["Print mode (headless)", "Running claude -p non-interactively for scripts, scheduled jobs and CI."],
  ["Prompt injection", "Malicious instructions hidden in content Claude reads, such as a web page, document or ticket."],
  ["Protected paths", "Files and folders (.git, .claude, .vscode, shell profiles, .mcp.json…) whose writes are never auto-approved, except in bypass mode."],
  ["Sandbox", "OS-level isolation that restricts what shell commands can read, write and connect to."],
  ["Scope", "Who a configuration applies to: local (you, this project), project (team via git), user (you, all projects) or managed (organisation)."],
  ["Session", "One conversation, saved locally so you can resume it later."],
  ["Skill", "A SKILL.md file with instructions; it becomes a /command and can load automatically when relevant."],
  ["Slash command", "A command typed at the start of a message, beginning with /."],
  ["Subagent", "A helper agent with its own context window that does a side task and returns a summary."],
  ["Token", "The unit models read and write (roughly three-quarters of a word). Context size and cost are measured in tokens."],
  ["Tool", "A capability Claude can call: Read, Edit, Bash, PowerShell, WebFetch, MCP tools and more."],
  ["Working directory", "The folder you started Claude Code in — its default boundary for edits."],
  ["Worktree", "A separate git checkout of the same repository, used to run parallel sessions without collisions (claude -w)."]
];

/* ---------------------------------------------------------------- Lab kit */
COURSE.labkit = (function () {
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var r = rng(20261001);
  var regions = ["NSW", "VIC", "QLD", "WA", "ACT"];
  var products = [["Insight Pro Licence", 1200], ["Data Health Check", 4500], ["AI Readiness Workshop", 9800], ["Analytics Retainer", 15000], ["Training Seat", 650]];
  var channels = ["Online", "Retail"];
  var rows = [];
  for (var i = 0; i < 40; i++) {
    var month = 7 + Math.floor(i / 14);
    if (month > 9) month = 9;
    var day = 1 + Math.floor(r() * 28);
    var p = products[Math.floor(r() * products.length)];
    var units = p[1] >= 9800 ? 1 + Math.floor(r() * 3) : 2 + Math.floor(r() * 18);
    rows.push({ date: "2026-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day, region: regions[Math.floor(r() * regions.length)], product: p[0], channel: channels[Math.floor(r() * 2)], units: units, price: p[1] });
  }
  rows.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  rows[22].units = -14; // planted data error: negative units
  var csv = "date,region,product,channel,units,unit_price,revenue\n" + rows.map(function (x) {
    return [x.date, x.region, x.product, x.channel, x.units, x.price, x.units * x.price].join(",");
  }).join("\n") + "\n";

  var readme = [
    "# Claude Code training lab",
    "",
    "Synthetic practice files for the 3-day Claude Code course. Nothing here is real data.",
    "",
    "| File | Used in |",
    "| --- | --- |",
    "| `sales_q3.csv` | Lab 2 (data insights) and the capstone |",
    "| `meeting-notes.md` | Lab 1 and Lab 2 (meeting to actions) |",
    "| `calculator.py`, `test_calculator.py` | Lab 2 (fix the bugs) - needs Python 3 |",
    "| `inbox/` | Lab 2 (tidy the inbox) |",
    "| `.env` | Lab 2 (permissions) - a dummy value, not a real secret |",
    "",
    "Start Claude Code in this folder with `claude`.",
    "",
    "Facilitator: Adrian Cioanca - Adrian.Cioanca@accenture.com",
    ""
  ].join("\n");

  var notes = [
    "# Steering committee - Project Atlas",
    "Wed 16 Sep 2026, 10:00-11:00, Level 3 Boardroom + Teams",
    "",
    "Present: Priya N (sponsor), Tom W (PMO), Mei L (data lead), Sam O (change), Jordan K (vendor mgr), Alex R (finance)",
    "Apologies: Chris D",
    "",
    "## 1. Status",
    "Overall amber. Data migration is 2 wks behind because the legacy CRM export keeps timing out. Mei thinks splitting it by region fixes it - she'll test that by Fri 25 Sep. Tom reminded everyone the go-live date (3 Nov) is NOT moving.",
    "",
    "## 2. Budget",
    "Alex: spend at 61% vs 55% planned. Mostly the extra vendor days in Aug. Priya asked for a reforecast before the next steerco, Alex to own (by 1 Oct). Also need to confirm whether the training budget sits with us or HR - Jordan to check with HR, no date given but ideally this week??",
    "",
    "## 3. Change & comms",
    "Sam presented the comms plan, mostly agreed. Priya wants the exec briefing pack moved earlier - Sam to draft by 29 Sep. Champions network: 14 nominated, need 20. Everyone to nominate one more person from their area by next Mon.",
    "",
    "## 4. Risks",
    "- R7 vendor key person leaving end Oct -> Jordan to get a named backup from the vendor (due Fri 2 Oct)",
    "- R9 data quality in the WA region file -> Mei, combine with the export fix",
    "",
    "## 5. Decisions",
    "- Go-live stays 3 Nov",
    "- Pilot group = Finance + Ops only",
    "",
    "AOB: next steerco moved to Thu 1 Oct (Tom to send invite).",
    ""
  ].join("\n");

  var calc = [
    "\"\"\"Tiny calculator used in the Claude Code training lab.\"\"\"",
    "",
    "",
    "def add(a, b):",
    "    return a + b",
    "",
    "",
    "def subtract(a, b):",
    "    return a - b",
    "",
    "",
    "def multiply(a, b):",
    "    return a * b",
    "",
    "",
    "def divide(a, b):",
    "    return a / b",
    "",
    "",
    "def average(values):",
    "    \"\"\"Return the arithmetic mean of a list of numbers.\"\"\"",
    "    if not values:",
    "        raise ValueError(\"average() needs at least one value\")",
    "    return sum(values) / (len(values) - 1)",
    "",
    "",
    "def percent_change(old, new):",
    "    \"\"\"Percentage change from old to new, e.g. 100 -> 120 is 20.0.\"\"\"",
    "    if old == 0:",
    "        raise ValueError(\"old value must not be zero\")",
    "    return (new - old) / new * 100",
    ""
  ].join("\n");

  var tests = [
    "import unittest",
    "",
    "from calculator import add, average, divide, multiply, percent_change, subtract",
    "",
    "",
    "class CalculatorTests(unittest.TestCase):",
    "    def test_add(self):",
    "        self.assertEqual(add(2, 3), 5)",
    "",
    "    def test_subtract(self):",
    "        self.assertEqual(subtract(10, 4), 6)",
    "",
    "    def test_multiply(self):",
    "        self.assertEqual(multiply(3, 4), 12)",
    "",
    "    def test_divide(self):",
    "        self.assertEqual(divide(10, 4), 2.5)",
    "",
    "    def test_divide_by_zero(self):",
    "        with self.assertRaises(ZeroDivisionError):",
    "            divide(1, 0)",
    "",
    "    def test_average(self):",
    "        self.assertEqual(average([2, 4, 6]), 4)",
    "",
    "    def test_average_single_value(self):",
    "        self.assertEqual(average([5]), 5)",
    "",
    "    def test_average_empty(self):",
    "        with self.assertRaises(ValueError):",
    "            average([])",
    "",
    "    def test_percent_change_increase(self):",
    "        self.assertAlmostEqual(percent_change(100, 120), 20.0)",
    "",
    "    def test_percent_change_decrease(self):",
    "        self.assertAlmostEqual(percent_change(200, 150), -25.0)",
    "",
    "    def test_percent_change_from_zero(self):",
    "        with self.assertRaises(ValueError):",
    "            percent_change(0, 10)",
    "",
    "",
    "if __name__ == \"__main__\":",
    "    unittest.main()",
    ""
  ].join("\n");

  var env = "# Dummy value for the permissions exercise. This is NOT a real secret.\nFAKE_API_KEY=not-a-real-key-123\n";

  var inbox = [
    ["IMG_2031 notes.txt", "Whiteboard notes from the discovery workshop, 14/08/2026.\nThemes: data ownership, manual reconciliations, reporting lag.\n"],
    ["final_FINAL_v3 budget.txt", "Budget draft v3 (Aug 2026). Total: 412,000 AUD. Contingency 8%.\n"],
    ["Copy of status update (2).txt", "Weekly status update - week ending 29 Aug 2026. Overall: amber.\n"],
    ["client mtg 2026-08-21.txt", "Client meeting 21 Aug 2026 - agreed scope for phase 2, pending SOW.\n"],
    ["untitled.txt", "Interview notes - finance team, 3 Sep 2026. Pain point: month-end close takes 9 days.\n"],
    ["Q3 risks - draft.txt", "Q3 risk register draft, 10 Sep 2026. Top risk: vendor key person dependency.\n"],
    ["scan0007.txt", "Signed NDA scan reference, dated 02/07/2026.\n"]
  ];

  var files = [
    ["claude-lab/README.md", readme],
    ["claude-lab/sales_q3.csv", csv],
    ["claude-lab/meeting-notes.md", notes],
    ["claude-lab/calculator.py", calc],
    ["claude-lab/test_calculator.py", tests],
    ["claude-lab/.env", env]
  ];
  inbox.forEach(function (f) { files.push(["claude-lab/inbox/" + f[0], f[1]]); });
  return { files: files, csv: csv };
})();
