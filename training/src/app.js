/* ==========================================================================
   Claude Code course — interactive behaviour (no dependencies, works offline)
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------ helpers */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function slug(s) { return String(s).toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function copyText(text, btn) {
    function done() {
      if (btn) { var old = btn.getAttribute("data-label") || btn.textContent; btn.setAttribute("data-label", old); btn.textContent = "Copied ✓"; btn.classList.add("copied");
        setTimeout(function () { btn.textContent = old; btn.classList.remove("copied"); }, 1600); }
      toast("Copied to clipboard");
    }
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "-1000px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("Copy failed — select the text manually"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); } else { fallback(); }
  }

  // Inside the claude.ai artifact viewer, files go through its downloads capability
  // (plain download links are blocked there); opened as a local file, a normal link works.
  var dlCap = null;
  try { if (window.claude && typeof window.claude.use === "function") window.claude.use("downloads").then(function (d) { dlCap = d; }, function () {}); } catch (e) {}
  function download(name, content, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type || "text/plain;charset=utf-8" });
    if (dlCap) {
      dlCap.save({ filename: name, data: blob }).catch(function (err) {
        if (err && err.code !== "declined") toast("Couldn't save " + name + " here. Open the course file directly to download it.");
      });
      return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  /* ------------------------------------------------------------ state */
  var KEY = "ccc-course-v1";
  var state = { os: null, theme: null, fac: false, pres: false, checks: {}, quizzes: {}, cert: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") { for (var k in parsed) state[k] = parsed[k]; } }
  } catch (e) { /* storage unavailable: run without persistence */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ------------------------------------------------------------ keys (OS aware) */
  function kbdHTML(str) {
    str = String(str);
    if (str.trim().length <= 2) return "<kbd>" + esc(str.trim()) + "</kbd>";
    return str.split(" ").filter(Boolean).map(function (chord) {
      if (chord === "/") return '<span class="muted"> / </span>';
      return chord.split("+").map(function (k) { return "<kbd>" + esc(k) + "</kbd>"; }).join("+");
    }).join(" ");
  }
  function renderKeys() {
    var os = state.os;
    $$(".k[data-mac]").forEach(function (s) { s.innerHTML = kbdHTML(os === "mac" ? s.getAttribute("data-mac") : s.getAttribute("data-win")); });
  }

  /* ------------------------------------------------------------ OS + theme + modes */
  function detectOS() {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "";
    return /mac|iphone|ipad/i.test(p) ? "mac" : "win";
  }
  function applyOS(os, user) {
    state.os = os;
    [document.documentElement, document.body].forEach(function (n) { n.classList.toggle("os-mac", os === "mac"); n.classList.toggle("os-win", os !== "mac"); });
    $$(".seg [data-os]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-os") === os)); });
    renderKeys();
    $$(".tabs[data-os-default]").forEach(function (t) {
      var btn = $(':scope > .tab-list > [data-os-tab="' + os + '"]', t);
      if (btn) activateTab(t, btn.getAttribute("data-tab"));
    });
    renderShortcuts();
    if (permBuilder) permBuilder.refresh();
    if (skillBuilder) skillBuilder.refresh();
    save();
    if (user) toast(os === "mac" ? "Showing macOS commands & shortcuts" : "Showing Windows commands & shortcuts");
  }
  function effectiveTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
    state.theme = t || null; save();
  }
  function applyFac(on) { state.fac = !!on; document.body.classList.toggle("show-facilitator", !!on); $("#facBtn").setAttribute("aria-pressed", String(!!on)); save(); }
  function applyPres(on) { state.pres = !!on; document.body.classList.toggle("presenter", !!on); $("#presBtn").setAttribute("aria-pressed", String(!!on)); save(); }

  /* ------------------------------------------------------------ code blocks */
  function enhanceCode(root) {
    $$("pre.cb", root).forEach(function (pre) {
      if (pre.parentNode && pre.parentNode.classList && pre.parentNode.classList.contains("code")) return;
      var wrap = el("div", "code" + (pre.hasAttribute("data-prompt") ? " prompt-code" : ""));
      var head = el("div", "code-head", '<span class="code-label">' + esc(pre.getAttribute("data-label") || "Code") + '</span><button class="copy-btn" type="button" aria-label="Copy code to clipboard">Copy</button>');
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(head); wrap.appendChild(pre);
    });
  }

  /* ------------------------------------------------------------ tabs */
  function tabParts(t) {
    var list = $(":scope > .tab-list", t);
    return { btns: list ? $$(":scope > .tab-btn", list) : [], panels: $$(":scope > .tab-panel", t) };
  }
  function activateTab(t, name) {
    var p = tabParts(t);
    p.btns.forEach(function (b) { var on = b.getAttribute("data-tab") === name; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    p.panels.forEach(function (pn) { pn.hidden = pn.getAttribute("data-panel") !== name; });
  }
  var tabCounter = 0;
  function initTabs(t) {
    var p = tabParts(t); if (!p.btns.length) return;
    p.btns.forEach(function (b) {
      tabCounter++;
      var name = b.getAttribute("data-tab");
      var panel = p.panels.filter(function (x) { return x.getAttribute("data-panel") === name; })[0];
      b.id = "tab-" + tabCounter;
      if (panel) { panel.id = "panel-" + tabCounter; b.setAttribute("aria-controls", panel.id); panel.setAttribute("aria-labelledby", b.id); }
      b.addEventListener("click", function () { activateTab(t, name); });
      b.addEventListener("keydown", function (e) {
        var i = p.btns.indexOf(b);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          var n = p.btns[(i + (e.key === "ArrowRight" ? 1 : -1) + p.btns.length) % p.btns.length];
          n.focus(); activateTab(t, n.getAttribute("data-tab"));
        }
      });
    });
    activateTab(t, p.btns[0].getAttribute("data-tab"));
  }

  /* ------------------------------------------------------------ checklists + progress */
  function initChecklists() {
    $$(".checklist[data-checklist]").forEach(function (list) {
      var key = list.getAttribute("data-checklist");
      $$('input[type="checkbox"]', list).forEach(function (cb) {
        var id = key + ":" + cb.getAttribute("data-id");
        cb.checked = !!state.checks[id];
        cb.addEventListener("change", function () { state.checks[id] = cb.checked; save(); updateProgress(); });
      });
    });
  }
  function checklistStatus(key) {
    var boxes = $$('.checklist[data-checklist="' + key + '"] input[type="checkbox"]');
    var done = boxes.filter(function (b) { return b.checked; }).length;
    return { done: done, total: boxes.length };
  }
  function quizStatus(key) {
    var q = COURSE.quizzes[key]; var st = state.quizzes[key];
    var total = q ? q.qs.length : 0; var answered = st && st.answers ? Object.keys(st.answers).length : 0;
    return { answered: answered, total: total, complete: total > 0 && answered >= total };
  }
  var CHECK_KEYS = ["prereqs", "install", "lab1", "lab2", "lab3"];
  var QUIZ_KEYS = ["day1", "day2", "day3", "final"];
  function updateProgress() {
    var total = 0, done = 0;
    CHECK_KEYS.forEach(function (k) { var s = checklistStatus(k); total += s.total; done += s.done; });
    QUIZ_KEYS.forEach(function (k) { var s = quizStatus(k); total += 4; done += s.total ? 4 * s.answered / s.total : 0; });
    var pct = total ? Math.round(done / total * 100) : 0;
    var pctEl = $("#progressPct"); if (pctEl) pctEl.textContent = pct + "%";
    var ring = $("#ringFg"); if (ring) ring.setAttribute("stroke-dashoffset", String(75.4 * (1 - pct / 100)));
    $$("[data-count-for]").forEach(function (c) { var s = checklistStatus(c.getAttribute("data-count-for")); c.textContent = s.done + " / " + s.total + " done"; });
    $$(".nav-link[data-track]").forEach(function (a) {
      var t = a.getAttribute("data-track"), ok = false;
      if (t.indexOf("quiz-") === 0) ok = quizStatus(t.slice(5)).complete;
      else { var s = checklistStatus(t); ok = s.total > 0 && s.done === s.total; }
      a.classList.toggle("done", ok);
    });
    var days = { 1: [["c", "install"], ["c", "lab1"], ["q", "day1"]], 2: [["c", "lab2"], ["q", "day2"]], 3: [["c", "lab3"], ["q", "day3"], ["q", "final"]] };
    Object.keys(days).forEach(function (d) {
      var tt = 0, dd = 0;
      days[d].forEach(function (p) {
        if (p[0] === "c") { var s = checklistStatus(p[1]); tt += s.total; dd += s.done; }
        else { var q = quizStatus(p[1]); tt += 4; dd += q.total ? 4 * q.answered / q.total : 0; }
      });
      var bar = $('[data-daybar="' + d + '"]'); if (bar) bar.style.width = (tt ? Math.round(dd / tt * 100) : 0) + "%";
    });
  }

  /* ------------------------------------------------------------ agenda + session clock */
  function fmt(sec) { sec = Math.max(0, Math.floor(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function hm(min) { var h = Math.floor(min / 60), m = min % 60; return h + ":" + (m < 10 ? "0" : "") + m; }
  function initAgenda(box) {
    var day = box.getAttribute("data-agenda"); var items = COURSE.agendas[day]; if (!items) return;
    var total = items.reduce(function (s, x) { return s + x.t; }, 0);
    var html = '<div class="agenda-head"><h4>Session plan · ' + (total / 60) + ' hours</h4><div class="timer no-print">' +
      '<span class="timer-display" aria-live="off">00:00 / ' + fmt(total * 60) + '</span>' +
      '<button class="btn btn-dark btn-sm" type="button" data-t="toggle">▶ Start clock</button>' +
      '<button class="btn btn-ghost btn-sm" type="button" data-t="reset">Reset</button>' +
      '<span class="timer-status">Click a row to jump the clock to it.</span></div></div>';
    var start = 0;
    items.forEach(function (x, i) {
      html += '<div class="agenda-row' + (x.brk ? " break" : "") + '" data-i="' + i + '" data-start="' + start + '" data-len="' + x.t + '" title="Jump the session clock to this block">' +
        '<div class="ar-time">' + hm(start) + "–" + hm(start + x.t) + '</div><div><div class="ar-title">' + (x.link ? '<a href="' + x.link + '">' + esc(x.title) + "</a>" : esc(x.title)) + "</div>" +
        (x.desc ? '<div class="ar-desc">' + esc(x.desc) + "</div>" : "") + '</div><div class="ar-min">' + x.t + ' min</div><div class="ar-prog"></div></div>';
      start += x.t;
    });
    box.innerHTML = html;
    var elapsed = 0, timer = null;
    var disp = $(".timer-display", box), status = $(".timer-status", box), toggle = $('[data-t="toggle"]', box);
    function render() {
      disp.textContent = fmt(elapsed) + " / " + fmt(total * 60);
      var cur = null;
      $$(".agenda-row", box).forEach(function (r) {
        var s = +r.getAttribute("data-start") * 60, l = +r.getAttribute("data-len") * 60;
        var isCur = elapsed >= s && elapsed < s + l, past = elapsed >= s + l;
        r.classList.toggle("current", isCur && (timer || elapsed > 0)); r.classList.toggle("past", past);
        $(".ar-prog", r).style.width = isCur ? ((elapsed - s) / l * 100) + "%" : "0";
        if (isCur) cur = { r: r, left: s + l - elapsed };
      });
      if (elapsed >= total * 60) status.textContent = "Session time is up — wrap up and thank everyone.";
      else if (cur && (timer || elapsed > 0)) status.textContent = "Now: " + $(".ar-title", cur.r).textContent + " · " + fmt(cur.left) + " left";
    }
    toggle.addEventListener("click", function () {
      if (timer) { clearInterval(timer); timer = null; toggle.textContent = "▶ Resume"; }
      else { timer = setInterval(function () { elapsed++; render(); if (elapsed >= total * 60) { clearInterval(timer); timer = null; toggle.textContent = "▶ Start clock"; } }, 1000); toggle.textContent = "⏸ Pause"; }
      render();
    });
    $('[data-t="reset"]', box).addEventListener("click", function () { if (timer) clearInterval(timer); timer = null; elapsed = 0; toggle.textContent = "▶ Start clock"; status.textContent = "Click a row to jump the clock to it."; render(); });
    box.addEventListener("click", function (e) {
      var row = e.target.closest(".agenda-row"); if (!row || e.target.closest("a")) return;
      elapsed = +row.getAttribute("data-start") * 60; render(); toast("Clock moved to " + hm(+row.getAttribute("data-start")));
    });
    render();
  }

  /* ------------------------------------------------------------ quizzes */
  function quizState(key, reset) {
    var q = COURSE.quizzes[key];
    var st = state.quizzes[key];
    if (!st || reset || !st.perm || st.perm.length !== q.qs.length) {
      st = { answers: {}, perm: q.qs.map(function (x) { return shuffle(range(x.o.length)); }) };
      state.quizzes[key] = st; save();
    }
    return st;
  }
  function renderQuiz(box, reset) {
    var key = box.getAttribute("data-quiz"); var q = COURSE.quizzes[key]; if (!q) return;
    var st = quizState(key, reset);
    var letters = "ABCDEFG";
    var html = '<div class="quiz-head"><h4>' + esc(q.title) + ' · ' + q.qs.length + ' questions</h4><span class="quiz-score" aria-live="polite"></span></div><div class="quiz-body">';
    q.qs.forEach(function (item, i) {
      html += '<div class="q" data-i="' + i + '"><div class="q-text"><span class="q-num">' + (i + 1) + '.</span>' + esc(item.q) + '</div><div class="q-opts">';
      st.perm[i].forEach(function (orig, pos) {
        html += '<button class="q-opt" type="button" data-orig="' + orig + '"><span class="q-letter">' + letters[pos] + '</span><span>' + esc(item.o[orig]) + "</span></button>";
      });
      html += '</div><div class="q-explain" aria-live="polite"><strong>Why:</strong> ' + esc(item.e) + "</div></div>";
    });
    html += '</div><div class="quiz-foot"><span class="quiz-result"></span><button class="btn btn-ghost btn-sm" type="button" data-quiz-reset>↺ Retake</button></div>';
    box.innerHTML = html;
    $$(".q", box).forEach(function (qe) {
      var i = +qe.getAttribute("data-i"); var ans = st.answers[i];
      if (ans != null) markQuestion(qe, q.qs[i], ans);
    });
    updateQuizScore(box, key);
  }
  function markQuestion(qe, item, chosen) {
    qe.classList.add("answered");
    $$(".q-opt", qe).forEach(function (b) {
      var o = +b.getAttribute("data-orig"); b.disabled = true;
      if (o === item.a) b.classList.add("correct");
      else if (o === chosen) b.classList.add("wrong");
    });
  }
  function updateQuizScore(box, key) {
    var q = COURSE.quizzes[key], st = state.quizzes[key];
    var answered = Object.keys(st.answers).length;
    var correct = Object.keys(st.answers).filter(function (i) { return st.answers[i] === q.qs[i].a; }).length;
    $(".quiz-score", box).textContent = "Score: " + correct + " / " + q.qs.length + (answered < q.qs.length ? " · " + (q.qs.length - answered) + " to go" : "");
    var res = $(".quiz-result", box);
    if (answered >= q.qs.length) {
      var pct = Math.round(correct / q.qs.length * 100);
      if (key === "final") {
        var pass = pct >= (q.pass || 0.8) * 100;
        res.innerHTML = pass ? "🎉 " + pct + "% — passed! Claim your certificate below." : pct + "% — you need 80% to pass. Review the explanations and retake.";
        res.style.color = pass ? "var(--ok)" : "var(--danger)";
        if (pass) { state.cert.passed = true; state.cert.score = pct; if (!state.cert.date) state.cert.date = new Date().toISOString(); save(); }
        showCert();
      } else {
        res.innerHTML = pct >= 80 ? "✅ " + pct + "% — great work." : pct + "% — check the explanations, then retake when ready.";
        res.style.color = pct >= 80 ? "var(--ok)" : "var(--text-soft)";
      }
    } else { res.textContent = ""; }
  }
  function initQuizzes() {
    $$(".quiz[data-quiz]").forEach(function (box) {
      renderQuiz(box);
      box.addEventListener("click", function (e) {
        var key = box.getAttribute("data-quiz");
        if (e.target.closest("[data-quiz-reset]")) {
          if (key === "final") { state.cert = {}; save(); }
          renderQuiz(box, true); updateProgress(); showCert(); return;
        }
        var b = e.target.closest(".q-opt"); if (!b || b.disabled) return;
        var qe = b.closest(".q"); var i = +qe.getAttribute("data-i"); var st = state.quizzes[key];
        if (st.answers[i] != null) return;
        var chosen = +b.getAttribute("data-orig"); st.answers[i] = chosen; save();
        markQuestion(qe, COURSE.quizzes[key].qs[i], chosen);
        updateQuizScore(box, key); updateProgress();
      });
    });
  }

  /* ------------------------------------------------------------ certificate */
  function showCert() {
    var wrap = $("#certWrap"); if (!wrap) return;
    var on = !!(state.cert && state.cert.passed);
    wrap.classList.toggle("show", on);
    if (!on) return;
    var name = state.cert.name || "";
    $("#certName").value = name;
    $("#certNameOut").textContent = name || "Your name";
    $("#certScore").textContent = (state.cert.score || 0) + "%";
    var d = state.cert.date ? new Date(state.cert.date) : new Date();
    $("#certDate").textContent = d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  }
  function initCert() {
    var input = $("#certName"); if (!input) return;
    input.addEventListener("input", function () { state.cert.name = input.value.slice(0, 80); $("#certNameOut").textContent = input.value || "Your name"; save(); });
    $("#printCert").addEventListener("click", function () {
      if (!input.value.trim()) { input.focus(); toast("Add your name first"); return; }
      document.body.classList.add("print-cert");
      window.print();
    });
    window.addEventListener("afterprint", function () { document.body.classList.remove("print-cert"); });
    showCert();
  }

  /* ------------------------------------------------------------ mini games */
  function initSorter(box) {
    var data = COURSE.sorter; var score = 0, answered = 0;
    var html = '<div class="game-head"><h4>🎯 ' + esc(data.title) + '</h4><span class="drill-stats"><span>Score: <strong class="s-score">0</strong> / ' + data.items.length + '</span><button class="btn btn-ghost btn-sm" type="button" data-sort-reset>Reset</button></span></div>';
    data.items.forEach(function (it, i) {
      html += '<div class="sort-item" data-i="' + i + '"><div>' + esc(it.t) + '</div><div class="sort-btns"><button class="chip-btn" type="button" data-pick="chat">💬 Chat</button><button class="chip-btn" type="button" data-pick="code">⌨ Claude Code</button></div><div class="sort-feedback">' + esc(it.f) + "</div></div>";
    });
    box.innerHTML = html;
    box.addEventListener("click", function (e) {
      if (e.target.closest("[data-sort-reset]")) { initSorterReset(); return; }
      var b = e.target.closest("[data-pick]"); if (!b) return;
      var row = b.closest(".sort-item"); if (row.classList.contains("done")) return;
      var it = data.items[+row.getAttribute("data-i")]; var ok = b.getAttribute("data-pick") === it.a;
      row.classList.add("done", ok ? "right" : "wrongans"); b.setAttribute("aria-pressed", "true");
      answered++; if (ok) score++;
      $(".s-score", box).textContent = score;
      if (answered === data.items.length) toast("Sorted! " + score + " / " + data.items.length);
    });
    function initSorterReset() { box.innerHTML = ""; box.replaceWith(box.cloneNode(false)); var nb = $('[data-game="sorter"]'); initSorter(nb); }
  }

  function initDrill(box) {
    var pool = COURSE.drill; var answers = pool.map(function (x) { return x.a; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var cur = null, score = 0, seen = 0, streak = 0, order = shuffle(range(pool.length)), pos = 0, locked = false;
    box.innerHTML = '<div class="game-head"><h4>⚡ Command drill: which command would you use?</h4><span class="drill-stats"><span>Correct: <strong class="d-score">0</strong>/<strong class="d-seen">0</strong></span><span>Streak: <strong class="d-streak">0</strong></span></span></div>' +
      '<div class="drill-card"><div class="drill-scenario" aria-live="polite"></div><div class="drill-opts"></div><div class="drill-msg" aria-live="polite"></div>' +
      '<div class="inline-actions mb0"><button class="btn btn-dark btn-sm" type="button" data-drill-next>Next scenario →</button></div></div>';
    function next() {
      if (pos >= order.length) { order = shuffle(range(pool.length)); pos = 0; }
      cur = pool[order[pos++]]; locked = false;
      var opts = shuffle([cur.a].concat(shuffle(answers.filter(function (a) { return a !== cur.a; })).slice(0, 3)));
      $(".drill-scenario", box).textContent = cur.s;
      $(".drill-opts", box).innerHTML = opts.map(function (o) { return '<button class="chip-btn" type="button" data-cmd="' + esc(o) + '">' + esc(o) + "</button>"; }).join("");
      $(".drill-msg", box).textContent = "";
    }
    box.addEventListener("click", function (e) {
      if (e.target.closest("[data-drill-next]")) { next(); return; }
      var b = e.target.closest("[data-cmd]"); if (!b || locked) return;
      locked = true; seen++;
      var ok = b.getAttribute("data-cmd") === cur.a;
      if (ok) { score++; streak++; b.style.background = "var(--ok-bg)"; b.style.borderColor = "var(--ok)"; }
      else { streak = 0; b.style.background = "var(--danger-bg)"; b.style.borderColor = "var(--danger)";
        $$("[data-cmd]", box).forEach(function (x) { if (x.getAttribute("data-cmd") === cur.a) { x.style.background = "var(--ok-bg)"; x.style.borderColor = "var(--ok)"; } }); }
      var info = COURSE.commands.filter(function (c) { return c.c === cur.a; })[0];
      $(".drill-msg", box).innerHTML = (ok ? "✅ Correct! " : "❌ It's <code>" + esc(cur.a) + "</code>. ") + (info ? esc(info.d) : "");
      $(".d-score", box).textContent = score; $(".d-seen", box).textContent = seen; $(".d-streak", box).textContent = streak;
      if (ok) setTimeout(function () { if (locked) next(); }, 1700);
    });
    next();
  }

  var MODE_INFO = {
    "default": ["⏸ manual mode on", "Manual", "Claude asks before file edits, most shell commands and network requests. Reads run freely."],
    acceptEdits: ["⏵⏵ accept edits on", "Accept edits", "Edits and common file commands in your folder run without asking; other commands still prompt."],
    plan: ["⏸ plan mode on", "Plan", "Read-only exploration and a written plan — no file edits until you approve it."],
    auto: ["⏵⏵ auto mode on", "Auto", "A background classifier reviews actions instead of you and blocks risky ones."],
    bypassPermissions: ["⏵⏵ bypass permissions on", "Bypass permissions", "Almost no checks. Only for isolated containers or VMs — appears in the cycle only if you started with it enabled."]
  };
  function initCycle(box) {
    var auto = true, bypass = false, mode = "auto";
    box.innerHTML = '<div class="game-head"><h4>⇧⇥ Shift+Tab simulator</h4><span class="drill-stats">' +
      '<label><input type="checkbox" data-c="auto" checked> auto mode available</label>' +
      '<label><input type="checkbox" data-c="bypass"> started with bypass enabled</label></span></div>' +
      '<div class="cycle" aria-live="polite"></div><div class="mock-term" style="margin-bottom:10px"><span class="cy-status mt-acc"></span> <span class="mt-dim">(shift+tab to cycle)</span></div>' +
      '<p class="cy-desc mb0"></p><div class="inline-actions mb0" style="margin-top:12px"><button class="btn btn-primary btn-sm" type="button" data-c="press">Press Shift+Tab</button><button class="btn btn-ghost btn-sm" type="button" data-c="restart">New session</button></div>';
    function cycleList() { var c = ["default", "acceptEdits", "plan"]; if (bypass) c.push("bypassPermissions"); if (auto) c.push("auto"); return c; }
    function render() {
      var list = cycleList();
      $(".cycle", box).innerHTML = list.map(function (m) { return '<span class="cy' + (m === mode ? " on" : "") + '">' + esc(MODE_INFO[m][1]) + "</span>"; }).join('<span class="cy-arrow">›</span>') + '<span class="cy-arrow">↺</span>';
      $(".cy-status", box).textContent = MODE_INFO[mode][0];
      $(".cy-desc", box).innerHTML = "<strong>" + esc(MODE_INFO[mode][1]) + ":</strong> " + esc(MODE_INFO[mode][2]);
    }
    function restart() { mode = auto ? "auto" : "default"; render(); }
    box.addEventListener("click", function (e) {
      var c = e.target.getAttribute && e.target.getAttribute("data-c");
      if (c === "press") { var l = cycleList(); var i = l.indexOf(mode); mode = l[(i + 1) % l.length]; render(); }
      if (c === "restart") restart();
    });
    box.addEventListener("change", function (e) {
      var c = e.target.getAttribute("data-c");
      if (c === "auto") auto = e.target.checked; if (c === "bypass") bypass = e.target.checked;
      if (cycleList().indexOf(mode) < 0) mode = "default";
      render();
    });
    restart();
  }

  /* ------------------------------------------------------------ builders: shared */
  function builderShell(title, sub) {
    return '<div class="builder-head"><h4>' + title + '</h4>' + (sub ? '<span class="muted" style="font-size:13px">' + sub + "</span>" : "") + '</div><div class="builder-body"><div class="builder-form"></div><div class="builder-out"></div></div>';
  }
  function codeBlock(label, text, extraBtn) {
    return '<div class="code"><div class="code-head"><span class="code-label">' + esc(label) + '</span><span>' + (extraBtn || "") + '<button class="copy-btn" type="button">Copy</button></span></div><pre><code>' + esc(text) + "</code></pre></div>";
  }

  /* ---- prompt builder ---- */
  function initPromptBuilder(box) {
    box.innerHTML = builderShell("🧩 Prompt builder", "fill in what you know — the prompt assembles itself");
    var form = $(".builder-form", box), out = $(".builder-out", box);
    var fields = [
      ["goal", "1 · Goal", "Analyse Q3 sales and summarise the key insights"],
      ["context", "2 · Context", "Use @sales_q3.csv; follow the style of reports/q2-summary.md"],
      ["constraints", "3 · Constraints", "Don't modify the CSV; no external libraries; Australian spelling"],
      ["verify", "4 · Verification", "Recompute the grand total two ways and show they match"],
      ["output", "5 · Output", "Write reports/q3-insights.md with a 5-bullet exec summary first"]
    ];
    form.innerHTML = fields.map(function (f) { return '<div class="field"><label for="pb-' + f[0] + '">' + f[1] + '</label><input type="text" id="pb-' + f[0] + '" data-f="' + f[0] + '" placeholder="e.g. ' + esc(f[2]) + '"></div>'; }).join("") +
      '<div class="field"><div class="radio-row"><label><input type="checkbox" data-f="ask" checked> Ask me questions first if anything is unclear</label></div></div>' +
      '<div class="inline-actions mb0"><button class="btn btn-dark btn-sm" type="button" data-pb="example">Fill an example</button><button class="btn btn-ghost btn-sm" type="button" data-pb="clear">Clear</button></div>';
    function val(k) { var i = $('[data-f="' + k + '"]', form); return i.type === "checkbox" ? i.checked : i.value.trim(); }
    function clean(s) { return s.replace(/[.\s]+$/, ""); }
    function render() {
      var parts = [], n = 0, missing = [];
      if (val("goal")) { parts.push(clean(val("goal")) + "."); n++; } else missing.push("a goal");
      if (val("context")) { parts.push("Context: " + clean(val("context")) + "."); n++; } else missing.push("context (which files to look at)");
      if (val("constraints")) { parts.push("Constraints: " + clean(val("constraints")) + "."); n++; } else missing.push("constraints");
      if (val("verify")) { parts.push("Before you finish, verify: " + clean(val("verify")) + "."); n++; } else missing.push("a way to verify");
      if (val("output")) { parts.push("Output: " + clean(val("output")) + "."); n++; } else missing.push("where the output goes");
      if (val("ask")) parts.push("If anything is unclear, ask me before you start.");
      var text = parts.join("\n") || "(start typing on the left)";
      var dots = ""; for (var i = 0; i < 5; i++) dots += i < n ? "●" : "○";
      out.innerHTML = '<div class="field"><span class="label">Your prompt</span></div>' + codeBlock("Type in Claude Code", text) +
        '<p style="margin:6px 0 4px"><strong>Prompt strength:</strong> <span style="color:var(--accent-ink);letter-spacing:2px">' + dots + "</span> " + n + "/5</p>" +
        (missing.length ? '<p class="muted mb0" style="font-size:13.5px">Consider adding: ' + esc(missing.join(", ")) + ".</p>" : '<p class="mb0" style="color:var(--ok);font-size:13.5px">Excellent — specific, scoped and verifiable.</p>');
    }
    form.addEventListener("input", render); form.addEventListener("change", render);
    form.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-pb");
      if (a === "example") fields.forEach(function (f) { $('[data-f="' + f[0] + '"]', form).value = f[2]; });
      if (a === "clear") fields.forEach(function (f) { $('[data-f="' + f[0] + '"]', form).value = ""; });
      if (a) render();
    });
    render();
  }

  /* ---- permission rule builder + evaluator ---- */
  var permBuilder = null;
  var READ_ONLY = ["ls", "cat", "echo", "pwd", "head", "tail", "grep", "find", "wc", "which", "diff", "stat", "du", "cd", "tree", "file", "sort", "uniq", "less", "more"];
  var GIT_RO = ["status", "log", "diff", "show", "branch", "remote", "blame", "rev-parse"];
  var FS_CMDS = ["mkdir", "touch", "rm", "rmdir", "mv", "cp", "sed"];
  var PS_ALIASES = { gci: "get-childitem", ls: "get-childitem", dir: "get-childitem", cat: "get-content", gc: "get-content", type: "get-content", rm: "remove-item", del: "remove-item", ri: "remove-item", erase: "remove-item", rmdir: "remove-item", echo: "write-output", pwd: "get-location", sls: "select-string", cp: "copy-item", copy: "copy-item", mv: "move-item", move: "move-item", sc: "set-content", ac: "add-content", ni: "new-item", md: "mkdir", mkdir: "new-item" };
  var PS_RO = ["get-childitem", "get-content", "get-location", "select-string", "test-path", "get-item", "write-output", "get-date", "resolve-path"];
  var PS_FS = ["set-content", "add-content", "clear-content", "remove-item"];
  var PROTECTED = /(^|\/)(\.git|\.claude|\.vscode|\.idea|\.husky|\.cargo|\.devcontainer|\.yarn|\.mvn|\.config\/git)(\/|$)|(^|\/)(\.gitconfig|\.gitmodules|\.bashrc|\.bash_profile|\.bash_login|\.bash_aliases|\.bash_logout|\.zshrc|\.zprofile|\.zshenv|\.zlogin|\.zlogout|\.profile|\.envrc|\.npmrc|\.yarnrc|\.yarnrc\.yml|\.pre-commit-config\.yaml|\.devcontainer\.json|\.mcp\.json|\.claude\.json|\.ripgreprc|pyrightconfig\.json)$/;
  var RISKY = [
    [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b|\birm\b[^|]*\|\s*iex\b/i, "Downloading and executing code"],
    [/\bgit\s+push\b.*(\s--force\b|\s-f\b|\s--force-with-lease\b)/i, "Force push"],
    [/\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s+\.|restore\s+\.|stash\s+(drop|clear))/i, "Discarding uncommitted work"],
    [/\b(terraform|pulumi|cdk|terragrunt)\s+destroy\b/i, "Destroying infrastructure"],
    [/\b(deploy|kubectl\s+apply|helm\s+(upgrade|install))\b.*\b(prod|production)\b/i, "Production deploy"],
    [/\b(aws\s+s3\s+rm|gsutil\s+(-m\s+)?rm|az\s+storage\s+blob\s+delete-batch)\b.*(--recursive|-r\b)/i, "Mass deletion on cloud storage"],
    [/--insecure\b/i, "Disarming a safety guard"],
    [/--dangerously-skip-permissions/i, "Launching an unsupervised agent loop"],
    [/\b(printenv|env)\b\s*$|echo\s+\$\w*(KEY|TOKEN|SECRET|PASSWORD)/i, "Printing a live credential"],
    [/\b(curl|scp|rsync)\b.*(\.env\b|id_rsa|credentials)/i, "Sending sensitive data externally"],
    [/\brm\s+-[a-z]*r[a-z]*\b/i, "Irreversibly destroying files that existed before the session"]
  ];

  function splitCompound(cmd) { return cmd.split(/\s*(?:&&|\|\||\|&|;|\||&|\n)\s*/).map(function (s) { return s.trim(); }).filter(Boolean); }
  function stripWrappers(cmd) {
    var c = cmd.trim(), prev;
    do {
      prev = c;
      c = c.replace(/^[A-Za-z_][A-Za-z0-9_]*=("[^"]*"|'[^']*'|\S*)\s+/, "");
      c = c.replace(/^(timeout\s+\S+|time|nice(\s+-n\s+\S+)?|nohup|stdbuf(\s+-\S+)*|command|builtin|noglob)\s+/, "");
      c = c.replace(/^xargs\s+(?!-)/, "");
    } while (c !== prev);
    return c;
  }
  function globToRegex(pat) { return pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*"); }
  function bashMatch(spec, cmd, ci) {
    var s = spec.trim();
    if (s === "" || s === "*") return true;
    if (/:\*$/.test(s)) s = s.replace(/:\*$/, " *");
    var flags = ci ? "i" : "";
    var re = new RegExp("^" + globToRegex(s) + "$", flags);
    if (re.test(cmd)) return true;
    var stars = (s.match(/\*/g) || []).length;
    if (stars === 1 && / \*$/.test(s)) { return new RegExp("^" + globToRegex(s.slice(0, -2)) + "$", flags).test(cmd); }
    return false;
  }
  function psCanon(cmd) {
    var parts = cmd.trim().split(/\s+/); if (!parts[0]) return cmd;
    var first = parts[0].toLowerCase(); if (PS_ALIASES[first]) parts[0] = PS_ALIASES[first];
    return parts.join(" ").toLowerCase();
  }
  function normPath(p) {
    p = String(p).trim().replace(/\\/g, "/");
    var m = p.match(/^([A-Za-z]):\/(.*)$/); if (m) p = "/" + m[1].toLowerCase() + "/" + m[2];
    if (p.indexOf("./") === 0) p = p.slice(2);
    return p;
  }
  function gitGlob(p) {
    var out = "", i = 0;
    while (i < p.length) {
      if (p.substr(i, 3) === "**/") { out += "(?:.*/)?"; i += 3; }
      else if (p.substr(i, 2) === "**") { out += ".*"; i += 2; }
      else if (p[i] === "*") { out += "[^/]*"; i++; }
      else if (p[i] === "?") { out += "[^/]"; i++; }
      else { out += p[i].replace(/[.+^${}()|[\]\\]/g, "\\$&"); i++; }
    }
    return out;
  }
  function isAbsPath(p) { return p.indexOf("/") === 0 || p.indexOf("~/") === 0; }
  function pathMatch(spec, path, list) {
    var s = spec.trim(); var p = normPath(path);
    if (s === "" || s === "**") return true;
    if (s.indexOf("./") === 0) s = s.slice(2);
    if (s.indexOf("//") === 0) { var abs = s.slice(1); return isAbsPath(p) && new RegExp("^" + gitGlob(abs) + "(?:/.*)?$").test(p); }
    if (s.indexOf("~/") === 0) { return p.indexOf("~/") === 0 && new RegExp("^" + gitGlob(s) + "(?:/.*)?$").test(p); }
    if (isAbsPath(p)) return false;
    var anchored = s.indexOf("/") === 0; if (anchored) s = s.slice(1);
    var hasSlash = s.replace(/\/\*\*$/, "").indexOf("/") >= 0 || /\/\*\*$/.test(s) && s.split("/").length > 2;
    var core = gitGlob(s);
    if (!anchored && s.indexOf("/") < 0) return new RegExp("^(?:.*/)?" + core + "(?:/.*)?$").test(p);
    var singleDir = !anchored && /^[^/]+\/\*\*$/.test(s);
    if (singleDir && list !== "allow") return new RegExp("^(?:.*/)?" + core + "$").test(p);
    if (hasSlash || anchored || singleDir) return new RegExp("^" + core + "$").test(p);
    return new RegExp("^" + core + "$").test(p);
  }
  function hostOf(v) { var s = String(v).trim(); try { if (!/^[a-z]+:\/\//i.test(s)) s = "https://" + s; return new URL(s).hostname.toLowerCase().replace(/\.$/, ""); } catch (e) { return String(v).toLowerCase(); } }
  function domainMatch(spec, host) {
    var s = spec.trim().replace(/^domain:/i, "").toLowerCase().replace(/\.$/, "");
    if (s === "*" || s === "") return true;
    if (s.indexOf("*.") === 0) { var base = s.slice(2); return host.length > base.length && host.slice(-base.length - 1) === "." + base; }
    var re = new RegExp("^" + s.split(".").map(function (seg) { return seg === "*" ? "[^.]+" : seg.replace(/[.+^${}()|[\]\\]/g, "\\$&"); }).join("\\.") + "$");
    return re.test(host);
  }
  function mcpMatch(rule, tool) {
    var r = rule.trim(); if (r.indexOf("mcp__") !== 0) return false;
    if (r.indexOf("*") >= 0) return new RegExp("^" + r.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(tool);
    if (r.split("__").length === 2) return tool === r || tool.indexOf(r + "__") === 0;
    return tool === r;
  }

  function ruleString(r) {
    if (r.tool === "MCP") return r.spec;
    return r.spec ? r.tool + "(" + r.spec + ")" : r.tool;
  }

  function initPermBuilder(box) {
    var rules = [];
    var scope = "project";
    box.innerHTML = builderShell("🛡 Permission rule builder &amp; tester", "write rules, then test what Claude Code would do");
    var form = $(".builder-form", box), out = $(".builder-out", box);
    form.innerHTML =
      '<div class="field"><span class="label">1 · Add a rule</span><div class="radio-row" role="radiogroup" aria-label="Rule list">' +
      '<label><input type="radio" name="pb-list" value="allow" checked> allow</label><label><input type="radio" name="pb-list" value="ask"> ask</label><label><input type="radio" name="pb-list" value="deny"> deny</label></div></div>' +
      '<div class="field"><label for="pb-tool">Tool</label><select id="pb-tool"><option>Bash</option><option>PowerShell</option><option>Read</option><option>Edit</option><option>WebFetch</option><option value="MCP">MCP tool</option></select></div>' +
      '<div class="field"><label for="pb-spec">Pattern</label><input type="text" id="pb-spec" placeholder="npm run test *" autocomplete="off"><div class="hint" id="pb-hint"></div></div>' +
      '<div class="inline-actions"><button class="btn btn-primary btn-sm" type="button" data-p="add">+ Add rule</button><button class="btn btn-dark btn-sm" type="button" data-p="starter">Load starter rules</button><button class="btn btn-ghost btn-sm" type="button" data-p="clear">Clear all</button></div>' +
      '<ul class="warn-list" id="pb-warn"></ul>' +
      '<div class="field" style="margin-top:10px"><span class="label">Your rules</span><div class="rule-chips" id="pb-chips"></div></div>' +
      '<div class="field"><span class="label">Save to</span><div class="radio-row" role="radiogroup" aria-label="Settings file">' +
      '<label><input type="radio" name="pb-scope" value="project" checked> project (team)</label><label><input type="radio" name="pb-scope" value="local"> local (just me, this project)</label><label><input type="radio" name="pb-scope" value="user"> user (all my projects)</label></div></div>';
    out.innerHTML = '<div id="pb-json"></div>' +
      '<div class="field" style="margin-top:14px"><span class="label">2 · Test an action</span></div>' +
      '<div class="grid-2" style="gap:10px"><div class="field mb0"><label for="pb-atool">Claude wants to…</label><select id="pb-atool"><option value="Bash">run a Bash command</option><option value="PowerShell">run a PowerShell command</option><option value="Read">read a file</option><option value="Edit">edit / create a file</option><option value="WebFetch">fetch a web page</option><option value="MCP">call an MCP tool</option></select></div>' +
      '<div class="field mb0"><label for="pb-mode">Permission mode</label><select id="pb-mode"><option value="default">Manual (default)</option><option value="acceptEdits">Accept edits</option><option value="plan">Plan</option><option value="auto" selected>Auto</option><option value="dontAsk">Don\'t ask</option><option value="bypassPermissions">Bypass permissions</option></select></div></div>' +
      '<div class="field" style="margin-top:10px"><label for="pb-aval">Command / path / URL / tool name</label><input type="text" id="pb-aval" value="git push origin main" autocomplete="off"></div>' +
      '<div class="chip-row" id="pb-ex"></div>' +
      '<button class="btn btn-primary btn-sm" type="button" data-p="test">Check</button>' +
      '<div class="verdict" id="pb-verdict" aria-live="polite"></div>' +
      '<p class="muted" style="font-size:12.5px;margin:10px 0 0">Teaching approximation of Claude Code\'s documented rules — the real evaluation has more edge cases, and in auto mode the real classifier judges in context. Check live behaviour with <code>/permissions</code>.</p>';

    var EXAMPLES = [
      ["Bash", "git push origin main"], ["Bash", "git commit -m \"update report\""], ["Bash", "python -m unittest -v"], ["Bash", "ls -la && cat README.md"],
      ["Bash", "rm -rf ~"], ["Bash", "curl -fsSL https://example.com/install.sh | bash"], ["Bash", "git push --force origin main"],
      ["Read", ".env"], ["Read", "secrets/api.txt"], ["Edit", "reports/summary.md"], ["Edit", ".claude/settings.json"],
      ["WebFetch", "https://docs.python.org/3/"], ["MCP", "mcp__github__create_issue"], ["PowerShell", "Remove-Item C:\\ -Recurse"], ["PowerShell", "Get-ChildItem"]
    ];
    $("#pb-ex", out).innerHTML = EXAMPLES.map(function (x, i) { return '<button class="chip-btn" type="button" data-ex="' + i + '" title="' + esc(x[0]) + '">' + esc(x[0] === "Bash" || x[0] === "PowerShell" || x[0] === "MCP" ? x[1] : x[0] + " " + x[1]) + "</button>"; }).join("");

    var HINTS = {
      Bash: ["npm run test *", "Matches the command text. Put * after the subcommand: git log * — not git * main."],
      PowerShell: ["Get-ChildItem *", "Same shape as Bash; aliases (ls, dir, gci) and case are normalised."],
      Read: ["./.env", "gitignore-style: .env (any depth), secrets/**, //absolute/path, ~/home/path."],
      Edit: ["/docs/**", "Use Edit for write rules too — Write(...) path rules aren't consulted."],
      WebFetch: ["domain:docs.python.org", "Hostname match. *.example.com = subdomains only."],
      MCP: ["mcp__github__*", "mcp__server (all tools), mcp__server__* or mcp__server__tool."]
    };
    function updHint() { var t = $("#pb-tool", form).value; $("#pb-spec", form).placeholder = HINTS[t][0]; $("#pb-hint", form).textContent = HINTS[t][1]; }

    function lint(r) {
      var w = [];
      var s = r.spec.trim();
      if ((r.tool === "Bash" || r.tool === "PowerShell")) {
        if (r.list === "allow" && (s === "" || s === "*")) w.push("This allows every " + r.tool + " command without asking. In auto mode Claude Code drops blanket rules like this.");
        if (r.list === "allow" && /\*\s+\S/.test(s)) w.push("The * comes before the rest of the command — put * after the subcommand (e.g. git log * rather than git * main). Claude Code warns about this at startup.");
        if (/^[A-Za-z0-9_-]+\*$/.test(s)) w.push("No space before * — \"" + s + "\" also matches longer command names (ls* matches lsof). Use \"" + s.slice(0, -1) + " *\" to match only that command.");
        if (r.list !== "allow" && /^(curl|wget|rm)\b/.test(s)) w.push("Deny/ask rules match the command as written; /usr/bin/" + s.split(" ")[0] + " or sh -c '…' would slip past. For hard boundaries use /sandbox or a PreToolUse hook.");
        if (r.list === "allow" && /^(python|node|bash|sh|npx|pwsh|powershell)\s*\*/.test(s)) w.push("A wildcarded interpreter allows arbitrary code. Auto mode drops rules like this; prefer exact commands (python -m unittest *).");
      }
      if ((r.tool === "Read" || r.tool === "Edit") && /^\/[^/]/.test(s) && /^\/(Users|home|c|C:|etc|var)\//.test(s)) w.push("A single leading / is relative to the settings file's project, not the filesystem root. Use //" + s.slice(1) + " for an absolute path.");
      if (r.tool === "WebFetch" && s && !/^domain:/i.test(s)) w.push("WebFetch rules use the domain: prefix — converted to domain:" + s.replace(/^https?:\/\//, "").split("/")[0] + ".");
      if (r.tool === "MCP") {
        if (s.indexOf("mcp__") !== 0) w.push("MCP rules start with mcp__<server>, e.g. mcp__github__*.");
        else if (r.list === "allow" && /^mcp__\*/.test(s)) w.push("Allow globs need a literal server name (mcp__github__*). An unanchored allow like mcp__* is skipped with a warning.");
      }
      if (r.list === "deny" && r.tool === "Read") w.push("Good practice: a Read deny also blocks Edit/Write on the same path.");
      return w;
    }

    function renderChips() {
      $("#pb-chips", form).innerHTML = rules.length ? rules.map(function (r, i) {
        return '<span class="rule-chip"><span class="rc-list rc-' + r.list + '">' + r.list + "</span>" + esc(ruleString(r)) + '<button type="button" data-rm="' + i + '" aria-label="Remove rule">×</button></span>';
      }).join("") : '<span class="muted" style="font-size:13px">No rules yet — add one or load the starter set.</span>';
    }
    function settingsPath() {
      if (scope === "project") return ".claude/settings.json";
      if (scope === "local") return ".claude/settings.local.json";
      return state.os === "mac" ? "~/.claude/settings.json" : "%USERPROFILE%\\.claude\\settings.json";
    }
    function renderJSON() {
      var perm = {};
      ["allow", "ask", "deny"].forEach(function (l) { var a = rules.filter(function (r) { return r.list === l; }).map(ruleString); if (a.length) perm[l] = a; });
      var obj = { "$schema": "https://json.schemastore.org/claude-code-settings.json", permissions: perm };
      $("#pb-json", out).innerHTML = '<div class="field"><span class="label">Paste into <code>' + esc(settingsPath()) + "</code></span></div>" + codeBlock(settingsPath(), JSON.stringify(obj, null, 2)) +
        '<p class="muted mb0" style="font-size:12.5px">Or add each rule interactively with <code>/permissions</code>. ' + (scope === "project" ? "Commit this file so the team shares it." : scope === "local" ? "Keep this file out of git." : "Applies to every project on this machine.") + "</p>";
    }
    function refresh() { renderChips(); renderJSON(); }

    function addRule(list, tool, spec) {
      spec = (spec || "").trim();
      if (tool === "WebFetch" && spec && !/^domain:/i.test(spec)) spec = "domain:" + spec.replace(/^https?:\/\//, "").split("/")[0];
      if (tool === "MCP" && !spec) { toast("Enter an MCP tool pattern, e.g. mcp__github__*"); return; }
      var r = { list: list, tool: tool, spec: spec };
      var warns = lint({ list: list, tool: tool, spec: spec });
      rules.push(r); refresh();
      $("#pb-warn", form).innerHTML = warns.length ? warns.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") : '<li class="ok">Added ' + esc(list) + " rule " + esc(ruleString(r)) + "</li>";
    }

    function evaluate(atool, aval, mode) {
      var steps = [], v;
      aval = aval.trim();
      if (!aval) return { kind: "ask", big: "Enter an action to test", steps: [] };
      function find(list, pred) { for (var i = 0; i < rules.length; i++) { if (rules[i].list === list && pred(rules[i])) return rules[i]; } return null; }
      var isShell = atool === "Bash" || atool === "PowerShell";
      var subs = isShell ? splitCompound(aval).map(stripWrappers) : [aval];
      var canon = function (s) { return atool === "PowerShell" ? psCanon(s) : s; };
      function ruleHits(r, s) {
        if (atool === "Bash" || atool === "PowerShell") return r.tool === atool && bashMatch(atool === "PowerShell" ? psCanonPattern(r.spec) : r.spec, canon(s), atool === "PowerShell");
        if (atool === "Read") return r.tool === "Read" && pathMatch(r.spec, s, r.list);
        if (atool === "Edit") return (r.tool === "Edit" && pathMatch(r.spec, s, r.list)) || (r.list === "deny" && r.tool === "Read" && pathMatch(r.spec, s, "deny"));
        if (atool === "WebFetch") return r.tool === "WebFetch" && (r.spec === "" || domainMatch(r.spec, hostOf(s)));
        if (atool === "MCP") return r.tool === "MCP" && mcpMatch(r.spec, s);
        return false;
      }
      function psCanonPattern(spec) { return spec ? psCanon(spec) : spec; }
      var label = isShell && subs.length > 1 ? "Compound command split into " + subs.length + " parts: " + subs.map(function (s) { return "\"" + s + "\""; }).join(", ") : null;
      if (label) steps.push(label);

      // 1. deny rules
      for (var i = 0; i < subs.length; i++) {
        var d = find("deny", function (r) { return ruleHits(r, subs[i]); });
        if (d) { steps.push("Deny rule " + ruleString(d) + " matches \"" + subs[i] + "\". Deny is checked first and applies in every mode — even bypass."); return { kind: "deny", big: "⛔ Blocked by a deny rule", steps: steps }; }
      }
      steps.push("No deny rule matches.");

      // 2. built-in hard checks
      if (atool === "PowerShell") {
        for (i = 0; i < subs.length; i++) {
          var cs = psCanon(subs[i]);
          if (/^remove-item\b/.test(cs) && (/\s(['"]?)[a-z]:[\\/]?\1(\s|$)/i.test(" " + subs[i] + " ") || /[\\/]\*\s*$|\s\*\s*$/.test(subs[i]) || /\s(~|\$home)\s*($|\s)/i.test(" " + subs[i] + " "))) {
            steps.push("Remove-Item on a system path (drive root, home) or a bare wildcard is denied outright in every mode.");
            return { kind: "deny", big: "⛔ Always denied", steps: steps };
          }
        }
      }
      if (atool === "Bash") {
        for (i = 0; i < subs.length; i++) {
          if (/^(rm|rmdir)\b/.test(subs[i]) && /(\s|^)(\/|~|~\/|\.|\.\/|\$HOME|"\$HOME"|\/\*|~\/\*|\.\/\*)(\s|$)/.test(" " + subs[i].replace(/^(rm|rmdir)/, "") + " ")) {
            steps.push("\"" + subs[i] + "\" removes a critical path (filesystem root, home or working folder). No allow rule can approve this.");
            if (mode === "dontAsk") return { kind: "deny", big: "⛔ Denied (critical path, don't-ask mode)", steps: steps };
            if (mode === "auto") steps.push("In auto mode the terminal shows a prompt with a two-minute countdown; elsewhere it's denied.");
            return { kind: "ask", big: "❓ Claude Code asks you (critical path)", steps: steps };
          }
        }
      }

      // 3. ask rules
      for (i = 0; i < subs.length; i++) {
        var a = find("ask", function (r) { return ruleHits(r, subs[i]); });
        if (a) {
          steps.push("Ask rule " + ruleString(a) + " matches. Explicit ask rules prompt in every mode, including auto and bypass.");
          if (mode === "dontAsk") { steps.push("Don't-ask mode never prompts, so the call is denied instead."); return { kind: "deny", big: "⛔ Denied (ask rule in don't-ask mode)", steps: steps }; }
          return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
        }
      }
      steps.push("No ask rule matches.");

      // plan-mode edit block
      var p = normPath(aval);
      var outside = isAbsPath(p) || p.indexOf("../") === 0;
      var prot = (atool === "Edit") && PROTECTED.test(p.replace(/^~\//, ""));
      if (atool === "Edit" && mode === "plan") { steps.push("Plan mode: Claude writes a plan instead of editing. Edits wait until you approve the plan."); return { kind: "classifier", big: "📝 Waits for plan approval", steps: steps }; }

      // 4. protected paths skip allow rules
      if (prot) {
        steps.push("\"" + aval + "\" is a protected path (repo state or Claude/editor config). Allow rules don't pre-approve protected-path writes.");
        if (mode === "bypassPermissions") { steps.push("Bypass mode allows it."); return { kind: "allow", big: "✅ Runs without asking (bypass)", steps: steps }; }
        if (mode === "auto") { steps.push("Auto mode routes it to the classifier for review."); return { kind: "classifier", big: "🔍 Reviewed by the auto-mode classifier", steps: steps }; }
        if (mode === "dontAsk") return { kind: "deny", big: "⛔ Denied (would need a prompt)", steps: steps };
        return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
      }

      // 5. allow rules
      // Auto mode sets aside allow rules that amount to arbitrary code execution: blanket shell
      // rules, wildcarded interpreters and package-manager run commands.
      var broad = function (r) {
        return (r.tool === "Bash" || r.tool === "PowerShell") && (r.spec === "" || r.spec === "*" ||
          /^(python[\d.]*|py|node|bash|sh|zsh|pwsh|powershell|ruby|perl|deno|npx|bunx)\s*\*/i.test(r.spec) ||
          /^(npm|pnpm|yarn|bun|uv)\s+run\s*\*/i.test(r.spec));
      };
      var allSubsAllowed = true, usedRules = [], droppedBroad = false;
      for (i = 0; i < subs.length; i++) {
        var al = find("allow", function (r) { if (mode === "auto" && broad(r)) { if (ruleHits(r, subs[i])) droppedBroad = true; return false; } return ruleHits(r, subs[i]); });
        if (al) { usedRules.push(ruleString(al)); continue; }
        if (isShell && isReadOnly(atool, subs[i])) { usedRules.push("built-in read-only: " + subs[i]); continue; }
        allSubsAllowed = false;
      }
      if (droppedBroad) steps.push("Auto mode drops broad allow rules that grant arbitrary code execution (e.g. Bash(*), python *, npm run *); the classifier reviews instead.");
      if (allSubsAllowed && usedRules.some(function (u) { return u.indexOf("built-in") !== 0; }) && mode !== "bypassPermissions") {
        steps.push("Allowed by " + usedRules.join(" + ") + ".");
        return { kind: "allow", big: "✅ Runs without asking (allow rule)", steps: steps };
      }
      if (!allSubsAllowed && usedRules.length && isShell) steps.push("Some parts are allowed (" + usedRules.join(", ") + ") but every part of a compound command must be allowed on its own.");
      else steps.push("No allow rule covers it — the permission mode decides.");

      // 6. mode baseline
      return baseline(atool, subs, mode, steps, outside);
    }

    function isReadOnly(atool, s) {
      if (atool === "PowerShell") { var c = psCanon(s).split(" ")[0]; return PS_RO.indexOf(c) >= 0; }
      var w = s.split(/\s+/); var first = w[0];
      if (first === "git") return GIT_RO.indexOf(w[1]) >= 0;
      if (first === "find" && /-exec|-delete/.test(s)) return false;
      return READ_ONLY.indexOf(first) >= 0 && !/>\s*\S/.test(s);
    }
    function classify(text) { for (var i = 0; i < RISKY.length; i++) { if (RISKY[i][0].test(text)) return RISKY[i][1]; } return null; }

    function baseline(atool, subs, mode, steps, outside) {
      var name = MODE_INFO[mode] ? MODE_INFO[mode][1] : mode;
      if (mode === "bypassPermissions") { steps.push("Bypass mode skips prompts (deny rules, ask rules and critical-path removals still apply)."); return { kind: "allow", big: "✅ Runs without asking (bypass)", steps: steps }; }
      if (atool === "Read") {
        if (!outside) { steps.push("Reading inside the working folder never needs approval."); return { kind: "allow", big: "✅ Runs without asking", steps: steps }; }
        if (mode === "auto") { steps.push("Auto mode asks once the first time Claude reads outside the working folders, then remembers your answer."); return { kind: "ask", big: "❓ Asks the first time", steps: steps }; }
        if (mode === "dontAsk") return { kind: "deny", big: "⛔ Denied (would need a prompt)", steps: steps };
        steps.push("Reads outside the working folder prompt in " + name + " mode (or add the folder with /add-dir).");
        return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
      }
      if (atool === "Edit") {
        if (mode === "acceptEdits" && !outside) { steps.push("Accept-edits mode auto-approves edits inside the working folder."); return { kind: "allow", big: "✅ Runs without asking", steps: steps }; }
        if (mode === "auto" && !outside) { steps.push("Auto mode auto-approves edits inside the working folder (outside protected paths)."); return { kind: "allow", big: "✅ Runs without asking", steps: steps }; }
        if (mode === "auto") { steps.push("Edits outside the working folder go to the classifier."); return { kind: "classifier", big: "🔍 Reviewed by the auto-mode classifier", steps: steps }; }
        if (mode === "dontAsk") return { kind: "deny", big: "⛔ Denied (would need a prompt)", steps: steps };
        steps.push(name + " mode asks before file edits" + (outside ? " — and this path is outside the working folder" : "") + ".");
        return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
      }
      if (atool === "Bash" || atool === "PowerShell") {
        var allRO = subs.every(function (s) { return isReadOnly(atool, s); });
        if (allRO) { steps.push("Every part is a built-in read-only command (ls, cat, grep, git status…), which runs without a prompt in every mode."); return { kind: "allow", big: "✅ Runs without asking", steps: steps }; }
        if (mode === "acceptEdits") {
          var fsOnly = subs.every(function (s) { var f = atool === "PowerShell" ? psCanon(s).split(" ")[0] : s.split(/\s+/)[0]; return isReadOnly(atool, s) || (atool === "PowerShell" ? PS_FS : FS_CMDS).indexOf(f) >= 0; });
          if (fsOnly) { steps.push("Accept-edits mode auto-approves common file commands (mkdir, touch, rm, mv, cp, sed…) on paths inside the working folder."); return { kind: "allow", big: "✅ Runs without asking", steps: steps }; }
        }
        if (mode === "dontAsk") { steps.push("Don't-ask mode denies anything that would prompt."); return { kind: "deny", big: "⛔ Denied (would need a prompt)", steps: steps }; }
        if (mode === "auto" || mode === "plan") {
          var risk = classify(subs.join(" ; ")) || classify(subs.join(" | "));
          if (mode === "plan") steps.push("In plan mode, when auto mode is available, the classifier reviews exploratory commands (otherwise they prompt).");
          if (risk) { steps.push("Matches a default block category: \"" + risk + "\"."); return { kind: "deny", big: "🔍⛔ Likely blocked by the classifier", steps: steps }; }
          steps.push("Looks like routine work in your project, which the classifier normally allows.");
          return { kind: "classifier", big: "🔍✅ Likely allowed by the classifier", steps: steps };
        }
        steps.push(name + " mode asks before shell commands that aren't read-only.");
        return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
      }
      if (atool === "WebFetch") {
        if (mode === "dontAsk") return { kind: "deny", big: "⛔ Denied (would need a prompt)", steps: steps };
        if (mode === "auto") { steps.push("Read-only web requests are allowed by default in auto mode."); return { kind: "classifier", big: "🔍✅ Likely allowed by the classifier", steps: steps }; }
        steps.push("Web fetches prompt (a small set of documentation domains is pre-approved). \"Yes, and don't ask again\" saves a domain rule.");
        return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
      }
      if (atool === "MCP") {
        if (mode === "dontAsk") return { kind: "deny", big: "⛔ Denied (would need a prompt)", steps: steps };
        if (mode === "auto") { steps.push("MCP tool calls go to the classifier (unless your organisation set the tool to ask)."); return { kind: "classifier", big: "🔍 Reviewed by the auto-mode classifier", steps: steps }; }
        steps.push("MCP tools prompt on first use; pre-approve trusted ones with mcp__server__* allow rules.");
        return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
      }
      return { kind: "ask", big: "❓ Claude Code asks you", steps: steps };
    }

    function runTest() {
      var r = evaluate($("#pb-atool", out).value, $("#pb-aval", out).value, $("#pb-mode", out).value);
      var vd = $("#pb-verdict", out);
      vd.className = "verdict " + r.kind;
      vd.innerHTML = '<div class="v-big">' + esc(r.big) + '</div><div class="v-why"><ol>' + r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>";
    }

    form.addEventListener("change", function (e) {
      if (e.target.id === "pb-tool") updHint();
      if (e.target.name === "pb-scope") { scope = e.target.value; renderJSON(); }
    });
    form.addEventListener("keydown", function (e) { if (e.target.id === "pb-spec" && e.key === "Enter") { e.preventDefault(); $('[data-p="add"]', form).click(); } });
    box.addEventListener("click", function (e) {
      var t = e.target.closest("[data-p],[data-rm],[data-ex]"); if (!t) return;
      var p = t.getAttribute("data-p");
      if (p === "add") { addRule($('input[name="pb-list"]:checked', form).value, $("#pb-tool", form).value, $("#pb-spec", form).value); $("#pb-spec", form).value = ""; runTest(); }
      if (p === "starter") {
        rules = [];
        [["allow", "Bash", "git add *"], ["allow", "Bash", "git commit *"], ["allow", "Bash", "python -m unittest *"], ["allow", "WebFetch", "domain:code.claude.com"], ["ask", "Bash", "git push *"], ["deny", "Read", "./.env"], ["deny", "Read", "./secrets/**"]]
          .forEach(function (x) { rules.push({ list: x[0], tool: x[1], spec: x[2] }); });
        refresh(); $("#pb-warn", form).innerHTML = '<li class="ok">Loaded the starter rules from the example settings file.</li>'; runTest();
      }
      if (p === "clear") { rules = []; refresh(); $("#pb-warn", form).innerHTML = ""; runTest(); }
      if (p === "test") runTest();
      if (t.hasAttribute("data-rm")) { rules.splice(+t.getAttribute("data-rm"), 1); refresh(); runTest(); }
      if (t.hasAttribute("data-ex")) { var ex = EXAMPLES[+t.getAttribute("data-ex")]; $("#pb-atool", out).value = ex[0]; $("#pb-aval", out).value = ex[1]; runTest(); }
    });
    out.addEventListener("change", function (e) { if (e.target.id === "pb-mode" || e.target.id === "pb-atool") runTest(); });
    out.addEventListener("keydown", function (e) { if (e.target.id === "pb-aval" && e.key === "Enter") { e.preventDefault(); runTest(); } });
    updHint(); refresh(); runTest();
    permBuilder = { refresh: refresh, evaluate: evaluate, setRules: function (r) { rules = r; refresh(); runTest(); } };
  }

  /* ---- CLAUDE.md builder ---- */
  function initClaudeMdBuilder(box) {
    box.innerHTML = builderShell("📘 CLAUDE.md builder", "draft a concise project briefing");
    var form = $(".builder-form", box), out = $(".builder-out", box);
    form.innerHTML =
      '<div class="field"><label for="cm-name">Project name</label><input type="text" id="cm-name" placeholder="Q3 sales insights"></div>' +
      '<div class="field"><label for="cm-purpose">What it is (one line)</label><input type="text" id="cm-purpose" placeholder="Monthly sales analysis and client-ready reports"></div>' +
      '<div class="field"><label for="cm-cmds">Commands (one per line)</label><textarea id="cm-cmds" placeholder="Run tests: python -m unittest -v&#10;Build the dashboard: python build.py"></textarea></div>' +
      '<div class="field"><label for="cm-conv">Conventions (one per line)</label><textarea id="cm-conv" placeholder="Dates as DD Mon YYYY&#10;Money in AUD with thousands separators"></textarea></div>' +
      '<div class="field"><label for="cm-avoid">Never touch (one per line)</label><textarea id="cm-avoid" placeholder="data/raw/&#10;.env"></textarea></div>' +
      '<div class="field"><label for="cm-lang">Spelling</label><select id="cm-lang"><option value="">(no preference)</option><option>Australian English</option><option>British English</option><option>US English</option></select></div>' +
      '<div class="field"><span class="label">Workflow rules</span><div class="radio-row">' +
      '<label><input type="checkbox" data-w="plan" checked> Plan first for multi-file changes</label>' +
      '<label><input type="checkbox" data-w="tests" checked> Run tests after editing code</label>' +
      '<label><input type="checkbox" data-w="pkg"> Ask before installing packages</label>' +
      '<label><input type="checkbox" data-w="summary"> End with a short summary of changes</label>' +
      '<label><input type="checkbox" data-w="compact"> Keep files-changed list when compacting</label></div></div>' +
      '<div class="inline-actions mb0"><button class="btn btn-dark btn-sm" type="button" data-cm="example">Fill an example</button></div>';
    function lines(id) { return $(id, form).value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); }
    function render() {
      var name = $("#cm-name", form).value.trim() || "Project name";
      var md = ["# " + name, ""];
      var purpose = $("#cm-purpose", form).value.trim(); if (purpose) md.push(purpose, "");
      var cmds = lines("#cm-cmds"); if (cmds.length) { md.push("## Commands"); cmds.forEach(function (c) { var m = c.match(/^([^:]+):\s*(.+)$/); md.push(m ? "- " + m[1].trim() + ": `" + m[2].trim() + "`" : "- `" + c + "`"); }); md.push(""); }
      var conv = lines("#cm-conv"); var lang = $("#cm-lang", form).value;
      if (conv.length || lang) { md.push("## Conventions"); if (lang) md.push("- " + lang + " spelling"); conv.forEach(function (c) { md.push("- " + c); }); md.push(""); }
      var avoid = lines("#cm-avoid"); if (avoid.length) { md.push("## Don't touch"); avoid.forEach(function (c) { md.push("- Never modify `" + c + "`"); }); md.push(""); }
      var wf = [];
      if ($('[data-w="plan"]', form).checked) wf.push("- For changes touching more than two files, propose a plan first");
      if ($('[data-w="tests"]', form).checked) wf.push("- After editing code, run the tests and show me the result");
      if ($('[data-w="pkg"]', form).checked) wf.push("- Ask before installing or upgrading packages");
      if ($('[data-w="summary"]', form).checked) wf.push("- End each task with a 2-3 line summary of what changed");
      if ($('[data-w="compact"]', form).checked) wf.push("- When compacting, keep the list of files changed and the test command");
      if (wf.length) { md.push("## Workflow"); md = md.concat(wf); md.push(""); }
      var text = md.join("\n").replace(/\n+$/, "\n");
      var n = text.split("\n").length;
      var vague = /\b(clean|properly|good|nice|best practices?|high[- ]quality)\b/i.test($("#cm-conv", form).value);
      var warn = [];
      if (n > 200) warn.push("Over 200 lines — long files reduce adherence. Move detail into skills or .claude/rules/.");
      if (vague) warn.push("Vague wording detected (\"clean\", \"properly\"…). Make each rule concrete and checkable.");
      if (avoid.some(function (a) { return /\.env/.test(a); })) warn.push("CLAUDE.md is guidance only — also add a deny rule Read(./.env) to enforce it.");
      out.innerHTML = codeBlock("CLAUDE.md · " + n + " lines", text, '<button class="copy-btn" type="button" data-dl="1" style="margin-right:6px">Download</button>') +
        (warn.length ? '<ul class="warn-list">' + warn.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" : '<ul class="warn-list"><li class="ok">Concise and specific. Save it as CLAUDE.md in your project root, then run /context to confirm it loads.</li></ul>');
      out.setAttribute("data-text", text);
    }
    form.addEventListener("input", render); form.addEventListener("change", render);
    form.addEventListener("click", function (e) {
      if (e.target.getAttribute("data-cm") === "example") {
        $("#cm-name", form).value = "Q3 sales insights (training lab)";
        $("#cm-purpose", form).value = "Synthetic sales data and meeting notes used for Claude Code training.";
        $("#cm-cmds", form).value = "Run tests: python -m unittest -v";
        $("#cm-conv", form).value = "Dates as DD Mon YYYY (e.g. 01 Oct 2026)\nMoney in AUD with thousands separators\nWrite outputs to reports/";
        $("#cm-avoid", form).value = "data/raw/\n.env";
        $("#cm-lang", form).value = "Australian English";
        render();
      }
    });
    out.addEventListener("click", function (e) { if (e.target.getAttribute("data-dl")) { download("CLAUDE.md", out.getAttribute("data-text"), "text/markdown;charset=utf-8"); toast("Downloaded CLAUDE.md"); } });
    render();
  }

  /* ---- MCP builder ---- */
  function initMcpBuilder(box) {
    box.innerHTML = builderShell("🔌 MCP command builder", "generate the exact claude mcp add command");
    var form = $(".builder-form", box), out = $(".builder-out", box);
    var PRESETS = {
      docs: { t: "http", name: "claude-code-docs", url: "https://code.claude.com/docs/mcp", note: "No sign-in needed — great first test." },
      notion: { t: "http", name: "notion", url: "https://mcp.notion.com/mcp", note: "OAuth: after adding, run /mcp → Authenticate." },
      sentry: { t: "http", name: "sentry", url: "https://mcp.sentry.dev/mcp", note: "OAuth: after adding, run /mcp → Authenticate." },
      github: { t: "http", name: "github", url: "https://api.githubcopilot.com/mcp/", headers: "Authorization: Bearer YOUR_GITHUB_PAT", note: "Replace YOUR_GITHUB_PAT with a fine-grained personal access token. In a shared .mcp.json write Bearer ${GITHUB_PAT} instead and set the variable on each machine." },
      playwright: { t: "stdio", name: "playwright", cmd: "npx -y @playwright/mcp@latest", note: "Local browser automation. Needs Node.js 18+." },
      airtable: { t: "stdio", name: "airtable", cmd: "npx -y airtable-mcp-server", env: "AIRTABLE_API_KEY=YOUR_KEY", note: "Local server that needs an API key in its environment. Replace YOUR_KEY with your own key." }
    };
    form.innerHTML =
      '<div class="field"><span class="label">Start from a preset</span><div class="chip-row" style="margin:0">' +
      Object.keys(PRESETS).map(function (k) { return '<button class="chip-btn" type="button" data-preset="' + k + '">' + esc(PRESETS[k].name) + "</button>"; }).join("") + "</div></div>" +
      '<div class="field"><span class="label">Transport</span><div class="radio-row"><label><input type="radio" name="mb-t" value="http" checked> Remote (HTTP URL)</label><label><input type="radio" name="mb-t" value="stdio"> Local (stdio command)</label></div></div>' +
      '<div class="field"><label for="mb-name">Server name</label><input type="text" id="mb-name" value="claude-code-docs" autocomplete="off"></div>' +
      '<div class="field" data-for="http"><label for="mb-url">URL</label><input type="text" id="mb-url" value="https://code.claude.com/docs/mcp" autocomplete="off"></div>' +
      '<div class="field" data-for="http"><label for="mb-headers">Headers (optional, one per line)</label><textarea id="mb-headers" placeholder="Authorization: Bearer ${API_TOKEN}"></textarea></div>' +
      '<div class="field" data-for="stdio" hidden><label for="mb-cmd">Command that starts the server</label><input type="text" id="mb-cmd" placeholder="npx -y @playwright/mcp@latest" autocomplete="off"></div>' +
      '<div class="field" data-for="stdio" hidden><label for="mb-env">Environment variables (optional, KEY=value per line)</label><textarea id="mb-env" placeholder="API_KEY=${API_KEY}"></textarea></div>' +
      '<div class="field"><span class="label">Scope</span><div class="radio-row"><label><input type="radio" name="mb-s" value="local" checked> local (default)</label><label><input type="radio" name="mb-s" value="project"> project (.mcp.json)</label><label><input type="radio" name="mb-s" value="user"> user</label></div></div>';
    var note = PRESETS.docs.note;
    function q(s) { return /[\s"'$&|<>()]/.test(s) ? '"' + s.replace(/"/g, '\\"') + '"' : s; }
    function splitArgs(s) { var m = s.match(/"[^"]*"|'[^']*'|\S+/g) || []; return m.map(function (x) { return x.replace(/^["']|["']$/g, ""); }); }
    function render() {
      var t = $('input[name="mb-t"]:checked', form).value, sc = $('input[name="mb-s"]:checked', form).value;
      $$("[data-for]", form).forEach(function (f) { f.hidden = f.getAttribute("data-for") !== t; });
      var name = $("#mb-name", form).value.trim(), warns = [];
      if (!/^[A-Za-z0-9_-]+$/.test(name)) warns.push("Server names may contain only letters, numbers, hyphens and underscores.");
      var cmd = "claude mcp add", json = {};
      if (t === "http") {
        var url = $("#mb-url", form).value.trim();
        var headers = $("#mb-headers", form).value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
        cmd += " --transport http" + (sc !== "local" ? " --scope " + sc : "") + " " + (name || "<name>") + " " + (url || "<url>");
        headers.forEach(function (h) { cmd += " --header " + q(h); });
        json = { type: "http", url: url };
        if (headers.length) { json.headers = {}; headers.forEach(function (h) { var i = h.indexOf(":"); if (i > 0) json.headers[h.slice(0, i).trim()] = h.slice(i + 1).trim(); }); }
        if (url && !/^https:\/\//i.test(url)) warns.push("Remote servers should use an https:// URL.");
        if (headers.some(function (h) { return !/\$\{/.test(h) && /bearer\s+\S{8,}|key|token/i.test(h); })) warns.push(sc === "project" ? "This looks like a literal secret in a project-scoped server — it would be committed to git. Use ${VAR} in .mcp.json instead." : "Pasting a literal token works, but prefer an environment variable so it doesn't leak into screenshots or shared files.");
      } else {
        var c = $("#mb-cmd", form).value.trim();
        var env = $("#mb-env", form).value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
        env.forEach(function (e) { cmd += " --env " + q(e); });
        cmd += " --transport stdio" + (sc !== "local" ? " --scope " + sc : "") + " " + (name || "<name>") + " -- " + (c || "<command>");
        var parts = splitArgs(c);
        json = { type: "stdio", command: parts[0] || "", args: parts.slice(1) };
        if (env.length) { json.env = {}; env.forEach(function (e) { var i = e.indexOf("="); if (i > 0) json.env[e.slice(0, i)] = e.slice(i + 1); }); }
        if (/\bnpx\b/.test(c)) warns.push("npx-based servers need Node.js installed. The first start can time out while the package downloads — retry, or raise MCP_TIMEOUT.");
        if (env.length) warns.push("The --env pairs come before --transport so the server name isn't read as another KEY=value pair.");
      }
      var mcpjson = { mcpServers: {} }; mcpjson.mcpServers[name || "name"] = json;
      var next = ["claude mcp list", (t === "http" ? "# if it shows \"! Needs authentication\": start claude, run /mcp → Authenticate" : "# if it shows \"✘ Failed to connect\": run the command on its own to see the error"), "claude mcp get " + (name || "<name>")];
      out.innerHTML = '<div class="field"><span class="label">1 · Run in your terminal (not inside Claude)</span></div>' + codeBlock("Terminal", cmd) +
        '<div class="field"><span class="label">2 · Check it</span></div>' + codeBlock("Terminal", next.join("\n")) +
        '<div class="field"><span class="label">Equivalent ' + (sc === "project" ? ".mcp.json (commit this)" : "JSON entry") + "</span></div>" + codeBlock(sc === "project" ? ".mcp.json" : sc === "user" ? "~/.claude.json → mcpServers" : "~/.claude.json → projects → <this project> → mcpServers", JSON.stringify(mcpjson, null, 2)) +
        '<ul class="warn-list">' + (note ? '<li class="ok">' + esc(note) + "</li>" : "") + warns.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>";
    }
    form.addEventListener("input", function () { note = ""; render(); }); form.addEventListener("change", render);
    form.addEventListener("click", function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-preset"); if (!k) return;
      var p = PRESETS[k];
      $('input[name="mb-t"][value="' + p.t + '"]', form).checked = true;
      $("#mb-name", form).value = p.name; $("#mb-url", form).value = p.url || ""; $("#mb-headers", form).value = p.headers || "";
      $("#mb-cmd", form).value = p.cmd || ""; $("#mb-env", form).value = p.env || ""; note = p.note; render();
    });
    render();
  }

  /* ---- skill builder ---- */
  var skillBuilder = null;
  function initSkillBuilder(box) {
    box.innerHTML = builderShell("🛠 Skill builder", "turn a repeated task into /your-command");
    var form = $(".builder-form", box), out = $(".builder-out", box);
    form.innerHTML =
      '<div class="field"><label for="sk-name">Command name</label><input type="text" id="sk-name" value="meeting-actions" autocomplete="off"><div class="hint">Lowercase letters, numbers and hyphens. You\'ll type /<span id="sk-n2">meeting-actions</span>.</div></div>' +
      '<div class="field"><label for="sk-desc">Description — when should it be used?</label><input type="text" id="sk-desc" value="Turns meeting notes into an action table and a follow-up email. Use when the user shares meeting notes or asks for action items."></div>' +
      '<div class="field"><span class="label">Who can run it?</span><div class="radio-row">' +
      '<label><input type="radio" name="sk-inv" value="both" checked> you and Claude</label><label><input type="radio" name="sk-inv" value="user"> only you (side effects)</label><label><input type="radio" name="sk-inv" value="model"> only Claude (background knowledge)</label></div></div>' +
      '<div class="field"><div class="radio-row"><label><input type="checkbox" id="sk-args" checked> Takes arguments ($ARGUMENTS)</label></div></div>' +
      '<div class="field"><label for="sk-steps">Steps (one per line)</label><textarea id="sk-steps" style="min-height:120px">Read the meeting notes file given in the arguments\nExtract every action item with owner, due date and status\nWrite a table to reports/actions-YYYY-MM-DD.md\nDraft a short follow-up email below the table\nFlag anything ambiguous instead of guessing</textarea></div>' +
      '<div class="field"><label for="sk-tools">Pre-approved tools (optional)</label><input type="text" id="sk-tools" placeholder="Bash(git add *) Bash(git commit *)"></div>' +
      '<div class="field"><span class="label">Save as</span><div class="radio-row"><label><input type="radio" name="sk-scope" value="project" checked> project skill (share via git)</label><label><input type="radio" name="sk-scope" value="personal"> personal skill</label></div></div>';
    function render() {
      var name = $("#sk-name", form).value.trim(); $("#sk-n2", form).textContent = name || "name";
      var desc = $("#sk-desc", form).value.trim(); var inv = $('input[name="sk-inv"]:checked', form).value;
      var args = $("#sk-args", form).checked; var tools = $("#sk-tools", form).value.trim();
      var steps = $("#sk-steps", form).value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      var personal = $('input[name="sk-scope"]:checked', form).value === "personal";
      var fm = ["---", "name: " + (name || "my-skill"), "description: " + (desc || "Describe what it does. Use when …")];
      if (inv === "user") fm.push("disable-model-invocation: true");
      if (inv === "model") fm.push("user-invocable: false");
      if (tools) fm.push("allowed-tools: " + tools);
      fm.push("---", "");
      var body = [];
      body.push(args ? "Run this workflow for: $ARGUMENTS" : "Follow these steps:", "");
      steps.forEach(function (s, i) { body.push((i + 1) + ". " + s); });
      var text = fm.concat(body).join("\n") + "\n";
      var mac = state.os === "mac";
      var dir = personal ? (mac ? "~/.claude/skills/" + (name || "my-skill") : "$HOME\\.claude\\skills\\" + (name || "my-skill")) : (mac ? ".claude/skills/" + (name || "my-skill") : ".claude\\skills\\" + (name || "my-skill"));
      var mk = mac ? "mkdir -p " + dir : "New-Item -ItemType Directory -Force \"" + dir + "\"";
      var warns = [];
      if (!/^[a-z0-9-]+$/.test(name)) warns.push("Use lowercase letters, numbers and hyphens only for the name.");
      if (!/use when|use this when|when the user/i.test(desc)) warns.push("Say when to use it (\"Use when…\") so Claude can load it automatically at the right moment.");
      if (inv !== "user" && /\b(deploy|send|email|commit|push|publish|delete)\b/i.test(steps.join(" ") + desc)) warns.push("This skill has side effects (send/commit/deploy…). Consider \"only you\" so Claude never triggers it on its own.");
      if (tools && /Bash\(\*\)|Bash\s*$/.test(tools)) warns.push("allowed-tools with every Bash command is risky — list exact commands.");
      out.innerHTML = '<div class="field"><span class="label">1 · Create the folder</span></div>' + codeBlock(mac ? "Terminal" : "PowerShell", mk) +
        '<div class="field"><span class="label">2 · Save this as SKILL.md in that folder</span></div>' + codeBlock(dir.replace(/\\/g, "/") + "/SKILL.md", text, '<button class="copy-btn" type="button" data-dl="1" style="margin-right:6px">Download</button>') +
        '<div class="field"><span class="label">3 · Use it</span></div>' + codeBlock("Type in Claude Code", "/reload-skills\n/" + (name || "my-skill") + (args ? " meeting-notes.md" : "")) +
        '<ul class="warn-list">' + (warns.length ? warns.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") : '<li class="ok">Looks good. Tip: or just ask Claude — "create a /' + esc(name) + ' skill that …".</li>') + "</ul>";
      out.setAttribute("data-text", text);
    }
    form.addEventListener("input", render); form.addEventListener("change", render);
    out.addEventListener("click", function (e) { if (e.target.getAttribute("data-dl")) { download("SKILL.md", out.getAttribute("data-text"), "text/markdown;charset=utf-8"); toast("Downloaded SKILL.md"); } });
    render();
    skillBuilder = { refresh: render };
  }

  /* ------------------------------------------------------------ explorer, shortcuts, prompts, glossary */
  function initExplorer(box) {
    var cats = COURSE.categories; var cat = "all", ess = false, query = "";
    box.innerHTML = '<div class="explorer-controls"><div class="field"><label for="ex-q" class="sr-only">Search commands</label><input type="search" id="ex-q" placeholder="Search: e.g. context, undo, connector, review…" autocomplete="off"></div>' +
      '<button class="chip-btn" type="button" id="ex-ess" aria-pressed="false">★ Essentials only</button><span class="explorer-count" aria-live="polite"></span></div>' +
      '<div class="chip-row" id="ex-cats"><button class="chip-btn" type="button" data-cat="all" aria-pressed="true">All</button>' +
      Object.keys(cats).map(function (k) { return '<button class="chip-btn" type="button" data-cat="' + k + '" aria-pressed="false">' + esc(cats[k]) + "</button>"; }).join("") + '</div><div class="cmd-grid" id="ex-grid"></div>';
    function render() {
      var q = query.toLowerCase();
      var list = COURSE.commands.filter(function (c) {
        if (cat !== "all" && c.cat !== cat) return false;
        if (ess && !c.e) return false;
        if (!q) return true;
        return (c.c + " " + (c.a || "") + " " + c.d + " " + (c.w || "") + " " + (c.x || "") + " " + cats[c.cat]).toLowerCase().indexOf(q) >= 0;
      });
      $(".explorer-count", box).textContent = list.length + " of " + COURSE.commands.length + " commands";
      $("#ex-grid", box).innerHTML = list.length ? list.map(function (c) {
        return '<div class="cmd-card"><div class="cmd-top"><span class="cmd-name">' + esc(c.c) + "</span>" + (c.a ? '<span class="cmd-alias">aka ' + esc(c.a) + "</span>" : "") + (c.e ? '<span class="cmd-ess">essential</span>' : "") + '<span class="cmd-cat">' + esc(cats[c.cat]) + "</span></div>" +
          '<div class="cmd-desc">' + esc(c.d) + "</div>" + (c.w ? '<div class="cmd-when"><strong>Use when:</strong> ' + esc(c.w) + "</div>" : "") + (c.x ? '<div class="cmd-ex">' + esc(c.x) + "</div>" : "") + "</div>";
      }).join("") : '<div class="no-results" style="grid-column:1/-1">No commands match. Try a different word — or type <code>/</code> in Claude Code to see what\'s available to you.</div>';
    }
    $("#ex-q", box).addEventListener("input", function (e) { query = e.target.value; render(); });
    $("#ex-ess", box).addEventListener("click", function (e) { ess = !ess; e.currentTarget.setAttribute("aria-pressed", String(ess)); render(); });
    $("#ex-cats", box).addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]"); if (!b) return; cat = b.getAttribute("data-cat");
      $$("#ex-cats [data-cat]", box).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render();
    });
    render();
  }

  function renderShortcuts() {
    var box = $("[data-shortcuts]"); if (!box) return;
    var mac = state.os === "mac";
    box.innerHTML = COURSE.shortcuts.map(function (g) {
      return "<h3>" + esc(g.group) + '</h3><div class="table-wrap"><table class="kbd-table"><thead><tr><th style="width:34%">Shortcut</th><th>Action</th></tr></thead><tbody>' +
        g.rows.map(function (r) { var k = mac ? (r.mac || r.k) : (r.win || r.k); return "<tr><td>" + kbdHTML(k) + "</td><td>" + esc(r.d) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    }).join("");
  }

  function initPrompts(box) {
    var cats = ["All"].concat(COURSE.prompts.map(function (p) { return p.cat; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var cur = "All";
    box.innerHTML = '<div class="chip-row">' + cats.map(function (c) { return '<button class="chip-btn" type="button" data-pc="' + esc(c) + '" aria-pressed="' + (c === "All") + '">' + esc(c) + "</button>"; }).join("") + '</div><div class="prompt-grid"></div>';
    function hl(s) { return esc(s).replace(/\{([^}]+)\}/g, '<span class="ph">{$1}</span>'); }
    function render() {
      $(".prompt-grid", box).innerHTML = COURSE.prompts.filter(function (p) { return cur === "All" || p.cat === cur; }).map(function (p) {
        return '<div class="prompt-card"><div class="pc-top"><span class="pc-cat">' + esc(p.cat) + '</span><button class="copy-btn" type="button" data-copy-text="' + esc(p.p) + '">Copy</button></div><div class="pc-text">' + hl(p.p) + "</div>" + (p.tip ? '<div class="pc-tip">💡 ' + esc(p.tip) + "</div>" : "") + "</div>";
      }).join("");
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pc]"); if (!b) return; cur = b.getAttribute("data-pc");
      $$("[data-pc]", box).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render();
    });
    render();
  }

  function initGlossary(box) {
    box.innerHTML = '<dl class="gloss">' + COURSE.glossary.map(function (g) { return '<div class="gloss-item"><dt>' + esc(g[0]) + "</dt><dd>" + esc(g[1]) + "</dd></div>"; }).join("") + "</dl>";
  }

  /* ------------------------------------------------------------ practice terminal */
  function initSim(root) {
    root.innerHTML = '<div class="term-bar"><span class="term-dot"></span><span class="term-dot"></span><span class="term-dot"></span><span class="term-title">claude — ~/claude-lab · practice simulation</span><button class="term-reset" type="button">↺ Reset</button></div>' +
      '<div class="term-screen" role="log" aria-live="polite" tabindex="0"></div>' +
      '<div class="term-input-row"><span class="t-caret">&gt;</span><input class="term-input" type="text" spellcheck="false" autocomplete="off" aria-label="Practice terminal input: type a request or a slash command" placeholder="Try /help — or ask: what\'s in this folder?"></div>' +
      '<div class="term-status"><span><span class="term-mode"></span> <span class="t-dim">(shift+tab to cycle)</span></span><span class="t-dim">? shortcuts · / commands · esc to interrupt</span></div>' +
      '<div class="term-hints"></div>';
    var screen = $(".term-screen", root), input = $(".term-input", root), modeEl = $(".term-mode", root);
    var MODES = { auto: ["⏵⏵ auto mode on", "m-auto"], "default": ["⏸ manual mode on", "m-default"], acceptEdits: ["⏵⏵ accept edits on", "m-acceptEdits"], plan: ["⏸ plan mode on", "m-plan"] };
    var CYCLE = ["default", "acceptEdits", "plan", "auto"];
    var sim, queue = [], qTimer = null;
    var HINTS = ["/help", "what's in this folder?", "create hello.html", "run the tests", "fix the bugs", "read the meeting notes", "/context", "/model", "! ls", "/plan tidy the inbox folder", "delete everything", "/rewind", "/btw what have we changed?", "/usage"];
    $(".term-hints", root).innerHTML = HINTS.map(function (h) { return '<button type="button" data-h="' + esc(h) + '">' + esc(h) + "</button>"; }).join("");

    function reset() {
      sim = { mode: "auto", created: [], fixed: false, hist: [], hi: -1, pending: null, model: "opus", prompts: 0, allowEdits: false, allowBash: [], ended: false, claudeMd: false };
      clearQueue(); screen.innerHTML = ""; setMode("auto");
      line('<span class="t-hdr"><span class="t-acc">✻</span> Welcome to Claude Code <span class="t-dim">(practice simulation)</span>\n  <span class="t-dim">opus · medium effort · ~/claude-lab</span></span>');
      line('<span class="t-dim">Scripted for practice — not connected to Claude, nothing touches your computer.\nTry the suggestions below, or type /help. Press Shift+Tab in the input to change mode.</span>');
    }
    function setMode(m) { sim.mode = m; modeEl.textContent = MODES[m][0]; modeEl.className = "term-mode " + MODES[m][1]; }
    function line(html, cls) { var d = el("div", cls || "", html); screen.appendChild(d); screen.scrollTop = screen.scrollHeight; return d; }
    function say(text) { return line('<span class="t-acc">●</span> ' + text); }
    function tool(name, arg) { return line('  <span class="t-dim">⎿</span> <span class="t-tool">' + esc(name) + "</span><span class=\"t-dim\">(" + esc(arg) + ")</span>"); }
    function box(text) { return line('<span class="t-box">' + text + "</span>"); }
    function clearQueue() { queue = []; if (qTimer) { clearTimeout(qTimer); qTimer = null; } }
    function run(steps) { queue = queue.concat(steps); if (!qTimer) tick(); }
    function tick() { var f = queue.shift(); if (!f) { qTimer = null; return; } f(); qTimer = setTimeout(tick, 380); }
    function busy() { return !!qTimer || !!sim.pending; }

    function prompt(title, body, options) {
      var d = line('<span class="t-box"><span class="t-warn">' + esc(title) + "</span>" + (body ? "\n" + body : "") + "\n" +
        options.map(function (o, i) { return '<span class="t-choice"><button type="button" data-opt="' + i + '">' + (i + 1) + ". " + esc(o[0]) + "</button></span>"; }).join("") + "\n<span class=\"t-dim\">Click an option, or type its number and press Enter · Esc = No</span></span>");
      sim.pending = { el: d, options: options };
    }
    function resolve(i) {
      var p = sim.pending; if (!p) return; sim.pending = null;
      var o = p.options[Math.max(0, Math.min(p.options.length - 1, i))];
      $$("button", p.el).forEach(function (b) { b.disabled = true; });
      line('<span class="t-dim">→ ' + esc(o[0]) + "</span>");
      o[1]();
    }

    function createFile(file, preview, after) {
      function doIt() { tool("Write", file); if (sim.created.indexOf(file) < 0) sim.created.push(file); line('    <span class="t-ok">✓ Created ' + esc(file) + "</span>"); if (after) after(); }
      if (sim.mode === "plan") { say("I'm in plan mode, so I won't edit files. Here's what I'd do:"); box(preview); say("Approve a plan (or press Shift+Tab to leave plan mode) and I'll make the change."); return; }
      if (sim.mode === "acceptEdits" || sim.mode === "auto" || sim.allowEdits) {
        if (sim.mode === "auto") line('  <span class="t-dim">(auto mode: edits inside the working folder are auto-approved)</span>');
        doIt(); return;
      }
      prompt("Claude wants to create " + file, '<span class="t-dim">' + preview + "</span>", [
        ["Yes", doIt],
        ["Yes, allow all edits during this session", function () { sim.allowEdits = true; doIt(); }],
        ["No, and tell Claude what to do differently", function () { say("OK — I won't create it. What should I do instead?"); }]
      ]);
    }
    function bash(cmd, outputFn) {
      var prefix = cmd.split(" ").slice(0, 3).join(" ");
      function doIt() { tool("Bash", cmd); outputFn(); }
      if (sim.mode === "auto" || sim.mode === "plan") { line('  <span class="t-dim">(' + (sim.mode === "plan" ? "plan mode: " : "") + "classifier reviewed: routine project command → allowed)</span>"); doIt(); return; }
      if (sim.allowBash.indexOf(prefix) >= 0) { doIt(); return; }
      prompt("Bash command", '<span class="t-tool">' + esc(cmd) + '</span>\n<span class="t-dim">Run the unit tests</span>\nDo you want to proceed?', [
        ["Yes", doIt],
        ["Yes, and don't ask again for " + prefix + " commands in this project", function () { sim.allowBash.push(prefix); doIt(); }],
        ["No, and tell Claude what to do differently", function () { say("Understood — I won't run it. How would you like to proceed?"); }]
      ]);
    }
    function files() { return ["README.md", "calculator.py", "inbox/", "meeting-notes.md", "sales_q3.csv", "test_calculator.py", ".env"].concat(sim.created); }

    function testOutput() {
      if (sim.fixed) { line('<span class="t-dim">...........\n----------------------------------------------------------------------\nRan 11 tests in 0.002s\n\n</span><span class="t-ok">OK</span>'); say("All 11 tests pass. ✅"); return; }
      line('<span class="t-dim">FAIL: test_average (test_calculator.CalculatorTests)\nAssertionError: 6.0 != 4\nERROR: test_average_single_value\nZeroDivisionError: division by zero\nFAIL: test_percent_change_increase\nAssertionError: 16.666666666666664 != 20.0\nFAIL: test_percent_change_decrease\nAssertionError: -33.33333333333333 != -25.0\n----------------------------------------------------------------------\nRan 11 tests · </span><span class="t-err">FAILED (failures=3, errors=1)</span>');
      run([function () { say("Two root causes:\n  1. <code>average()</code> divides by <code>len(values) - 1</code> instead of <code>len(values)</code>.\n  2. <code>percent_change()</code> divides by the <em>new</em> value; it should divide by the <em>old</em> one.\nWant me to fix them? (try: <span class=\"t-acc\">fix the bugs</span>)"); }]);
    }

    function handle(text) {
      var t = text.trim(); if (!t) return;
      sim.hist.push(t); sim.hi = sim.hist.length;
      if (sim.ended) { sim.ended = false; line('<span class="t-dim">(new session started)</span>'); }
      line('<span class="t-user">' + esc(t) + "</span>");
      var low = t.toLowerCase();
      if (t[0] === "!") return shell(t.slice(1).trim());
      if (t[0] === "/") return command(t);
      sim.prompts++;
      if (/(what('|’)?s in|what is in|explain|summar|overview|what does).*(folder|project|this|files|repo)|^what('|’)?s here/.test(low)) {
        return run([function () { say("I'll take a look at the files first."); }, function () { tool("Glob", "**/*"); }, function () { tool("Read", "README.md"); }, function () { tool("Read", "meeting-notes.md"); }, function () { tool("Read", "sales_q3.csv"); },
          function () { say("This folder is the training lab kit:\n  • <b>sales_q3.csv</b> — 40 rows of synthetic Q3 sales (one row has negative units — a data error)\n  • <b>meeting-notes.md</b> — steering-committee notes with ~8 action items\n  • <b>calculator.py</b> + <b>test_calculator.py</b> — a tiny calculator with failing tests\n  • <b>inbox/</b> — messy files to organise · <b>.env</b> — a dummy secret\n<span class=\"t-dim\">Notice: reading files didn't need your approval in any mode.</span>"); }]);
      }
      if (/(create|make|build|write).*(html|page|website|web page)/.test(low)) {
        return run([function () { say("I'll create a simple page with a purple heading."); }, function () {
          createFile("hello.html", '&lt;h1 style="color:#A100FF"&gt;Hello from you&lt;/h1&gt;\n&lt;p&gt;Made with Claude Code&lt;/p&gt;', function () { say("Done — open <b>hello.html</b> in your browser (double-click it in your file explorer)."); });
        }]);
      }
      if (/(fix|repair|correct).*(bug|test|calc|average|percent)/.test(low) || /^fix (it|them|the bugs?)/.test(low)) {
        return run([function () { tool("Read", "calculator.py"); }, function () {
          var doFix = function () { tool("Edit", "calculator.py"); line('<span class="t-err">-    return sum(values) / (len(values) - 1)</span>\n<span class="t-ok">+    return sum(values) / len(values)</span>\n<span class="t-err">-    return (new - old) / new * 100</span>\n<span class="t-ok">+    return (new - old) / old * 100</span>'); sim.fixed = true; if (sim.created.indexOf("calculator.py (edited)") < 0) sim.created.push("calculator.py (edited)"); run([function () { say("Fixed both. Re-running the tests to verify…"); }, function () { bash("python -m unittest -v", testOutput); }]); };
          if (sim.mode === "plan") { say("Plan: change the divisor in average() to len(values) and divide by old in percent_change(), then re-run the tests. Approve the plan to proceed."); return; }
          if (sim.mode === "default" && !sim.allowEdits) { prompt("Claude wants to edit calculator.py", '<span class="t-err">- return sum(values) / (len(values) - 1)</span>\n<span class="t-ok">+ return sum(values) / len(values)</span>\n<span class="t-err">- return (new - old) / new * 100</span>\n<span class="t-ok">+ return (new - old) / old * 100</span>', [["Yes", doFix], ["Yes, allow all edits during this session", function () { sim.allowEdits = true; doFix(); }], ["No, and tell Claude what to do differently", function () { say("No problem — what would you like me to change instead?"); }]]); return; }
          doFix();
        }]);
      }
      if (/(run|execute).*(test)|^tests?$|unittest/.test(low)) {
        return run([function () { say("Running the test suite."); }, function () { bash("python -m unittest -v", testOutput); }]);
      }
      if (/(meeting|action item|actions)/.test(low)) {
        return run([function () { tool("Read", "meeting-notes.md"); }, function () {
          box("| Owner  | Action                                   | Due      |\n|--------|------------------------------------------|----------|\n| Mei    | Test splitting the CRM export by region  | Fri 25 Sep |\n| Alex   | Budget reforecast                        | 1 Oct    |\n| Sam    | Draft exec briefing pack                 | 29 Sep   |\n| Jordan | Named backup from vendor (risk R7)       | Fri 2 Oct |\n| Jordan | Confirm training budget owner with HR    | <span class=\"t-warn\">no date</span> |\n| Tom    | Send invite for next steerco             | before Thu 1 Oct |\n| All    | Nominate one more champion each          | Mon 21 Sep |");
          say("Mei and Jordan each own two items. I flagged one item with no due date rather than guessing.");
        }]);
      }
      if (/(delete|remove|wipe|rm -rf|erase).*(everything|all|files|folder|\*)|rm -rf/.test(low)) {
        return run([function () { say("You asked me to delete everything in this folder."); }, function () {
          if (sim.mode === "auto") { line('<span class="t-err">⛔ Blocked by auto mode:</span> <span class="t-dim">Irreversibly destroying files that existed before the session.\nClaude will ask you to name the exact paths, or to do it yourself.</span>'); say("I can't do that in auto mode without your explicit confirmation of exactly what to delete. Which files did you mean?"); return; }
          if (sim.mode === "plan") { say("Plan mode: I'd propose removing files, but I won't run anything destructive. Tell me which files and why."); return; }
          prompt("Bash command", '<span class="t-err">rm -rf ./*</span>\n<span class="t-warn">⚠ This permanently deletes files. Checkpoints cannot undo shell deletions.</span>\nDo you want to proceed?', [["Yes", function () { line('<span class="t-dim">(simulation: nothing was actually deleted)</span>'); say("In real life this would be gone for good — git or a backup would be your only way back."); }], ["No, and tell Claude what to do differently", function () { say("Good call. Want me to list the files first so you can choose?"); }]]);
        }]);
      }
      if (/\.env|secret|api key|password/.test(low)) {
        return run([function () { say("<span class=\"t-warn\">⚠</span> .env holds secrets. In the lab you'll add a deny rule <b>Read(./.env)</b> with /permissions — then Claude can't read it in any mode. (Instructions in CLAUDE.md alone aren't enforcement.)"); }]);
      }
      if (/\b(commit|push|git)\b/.test(low)) {
        return run([function () { tool("Bash", "git status"); }, function () { line('<span class="t-err">fatal: not a git repository (or any of the parent directories): .git</span>'); say("This folder isn't a git repository yet. Want me to run <b>git init</b> first? Committing often gives you a real undo button."); }]);
      }
      if (/^(hi|hello|hey|g'day)\b/.test(low)) return run([function () { say("Hi! I'm a practice simulation of Claude Code. Try: <span class=\"t-acc\">what's in this folder?</span> or <span class=\"t-acc\">/help</span>"); }]);
      return run([function () { say("<span class=\"t-dim\">(simulation)</span> In real Claude Code I'd now explore the files and work on: “" + esc(t) + "”.\nThis practice terminal understands: <span class=\"t-acc\">what's in this folder?</span> · <span class=\"t-acc\">create hello.html</span> · <span class=\"t-acc\">run the tests</span> · <span class=\"t-acc\">fix the bugs</span> · <span class=\"t-acc\">read the meeting notes</span> · <span class=\"t-acc\">delete everything</span> · plus /help, /context, /model, /init, /plan, /rewind, /permissions…"); }]);
    }

    function shell(cmd) {
      var c = cmd.toLowerCase();
      line('<span class="t-dim">$ ' + esc(cmd) + "</span>");
      if (/^(ls|dir|ls -la|ls -l|gci|get-childitem)\b/.test(c)) { line('<span class="t-dim">' + files().map(esc).join("\n") + "</span>"); return run([function () { say("That's the lab kit" + (sim.created.length ? " plus what we've made (" + sim.created.map(esc).join(", ") + ")" : "") + ". Shell-mode output is now part of the conversation, so I can respond to it."); }]); }
      if (/^git\b/.test(c)) { line('<span class="t-err">fatal: not a git repository (or any of the parent directories): .git</span>'); return run([function () { say("This isn't a git repository yet — <b>git init</b> would start one."); }]); }
      if (/^(pwd|cd)\b/.test(c)) { line('<span class="t-dim">~/claude-lab</span>'); return; }
      if (/^(cat|type|get-content)\s+\.env/.test(c)) { line('<span class="t-dim">FAKE_API_KEY=not-a-real-key-123</span>'); return run([function () { say("Note: shell mode runs commands as <b>you</b>, so permission rules don't apply to it — they govern what <b>Claude</b> may do."); }]); }
      line('<span class="t-dim">(simulated output)</span>'); run([function () { say("Shell mode ran your command directly; I can see its output and respond."); }]);
    }

    function command(t) {
      var parts = t.split(/\s+/), cmd = parts[0].toLowerCase(), arg = t.slice(parts[0].length).trim();
      var ctxPct = Math.min(95, 3 + sim.prompts * 4 + sim.created.length * 3);
      switch (cmd) {
        case "/help":
          return line('<span class="t-acc">Common commands</span>\n  /init         create a CLAUDE.md for this project\n  /context      see what\'s using the context window\n  /compact      summarise the conversation to free space\n  /clear        start a fresh conversation\n  /model        switch model        /effort  reasoning depth\n  /permissions  allow / ask / deny rules\n  /plan         plan before editing\n  /rewind       restore an earlier checkpoint\n  /usage        cost and plan limits\n  /mcp          manage connectors   /memory  CLAUDE.md &amp; auto memory\n  /status       version, model, account\n  /btw          side question       /exit    leave\n<span class="t-dim">Also try: ! ls · what\'s in this folder? · create hello.html · run the tests · fix the bugs · delete everything</span>');
        case "/status":
          return box("Version: 2.1.2xx <span class=\"t-dim\">(simulation)</span>\nModel: " + esc(sim.model) + " · effort: medium\nAccount: signed in <span class=\"t-dim\">(simulated)</span>\nWorking directory: ~/claude-lab\nPermission mode: " + esc(MODES[sim.mode][0]) + "\nMCP servers: none configured");
        case "/model":
          if (arg) { var m = arg.toLowerCase(); if (["opus", "sonnet", "haiku", "fable", "default", "best", "opusplan"].indexOf(m) < 0) return line('<span class="t-err">Unknown model "' + esc(arg) + '"</span> <span class="t-dim">— try opus, sonnet, haiku or fable</span>'); sim.model = m; return line('<span class="t-ok">✓ Set model to ' + esc(m) + '</span> <span class="t-dim">(saved as your default for new sessions)</span>'); }
          return box("<span class=\"t-acc\">Select model</span>\n❯ Default (recommended)\n  Opus   — complex reasoning\n  Sonnet — everyday coding\n  Haiku  — fast, simple tasks\n  Fable  — hardest, longest tasks (may use usage credits)\n<span class=\"t-dim\">Type /model sonnet to switch. In the real picker, ←/→ adjusts effort and s switches for this session only.</span>");
        case "/effort":
          return line(arg ? '<span class="t-ok">✓ Effort set to ' + esc(arg) + "</span>" : '<span class="t-dim">Effort: low · <b>medium</b> · high · xhigh · max — e.g. /effort high</span>');
        case "/context":
          var bars = Math.round(ctxPct / 5), fill = ""; for (var i = 0; i < 20; i++) fill += i < bars ? "▓" : "░";
          return box("<span class=\"t-acc\">Context usage</span>  " + fill + "  ~" + ctxPct + "% used\n  System prompt &amp; tools   ▓▓\n  Memory files            " + (sim.claudeMd ? "▓  CLAUDE.md" : "<span class=\"t-dim\">none yet — run /init</span>") + "\n  Messages &amp; file reads   " + (sim.prompts ? Array(Math.min(12, sim.prompts + 1)).join("▓") : "▓") + "\n  Free space              " + Array(Math.max(2, 20 - bars)).join("░") + "\n<span class=\"t-dim\">Tip: /compact to summarise · /clear to start fresh</span>");
        case "/clear": case "/reset": case "/new":
          screen.innerHTML = ""; sim.prompts = 0;
          return line('<span class="t-dim">(conversation cleared — the previous one is saved; find it with /resume)</span>');
        case "/compact":
          return run([function () { line('<span class="t-dim">Compacting conversation' + (arg ? " (focus: " + esc(arg) + ")" : "") + "…</span>"); }, function () { sim.prompts = Math.ceil(sim.prompts / 3); line('<span class="t-ok">✓ Conversation compacted.</span> <span class="t-dim">Key decisions and files kept; older tool output summarised.</span>'); }]);
        case "/usage": case "/cost": case "/stats":
          return box("<span class=\"t-acc\">Usage</span> <span class=\"t-dim\">(simulated numbers)</span>\nThis session: " + sim.prompts + " prompts\nPlan usage:   ▓▓░░░░░░░░ 18% of the current session limit · resets in 3h 12m\nWeekly:       ▓░░░░░░░░░ 9%");
        case "/permissions": case "/allowed-tools":
          return box("<span class=\"t-acc\">Permissions</span>  Allow · Ask · Deny · Recently denied · Auto mode\n  Allow: " + (sim.allowBash.length ? sim.allowBash.map(function (b) { return "Bash(" + esc(b) + " *)"; }).join(", ") : "<span class=\"t-dim\">none</span>") + "\n  Ask:   <span class=\"t-dim\">none</span>\n  Deny:  <span class=\"t-dim\">none — add Read(./.env) in the lab!</span>\n<span class=\"t-dim\">In the real dialog you add/remove rules and choose which settings file they go in.</span>");
        case "/mcp":
          return box("No MCP servers configured.\n<span class=\"t-dim\">Add one from your terminal (not inside Claude), e.g.</span>\n  claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp");
        case "/memory":
          return box("<span class=\"t-acc\">Memory</span>\n  Project:  ./CLAUDE.md " + (sim.claudeMd ? "<span class=\"t-ok\">✓</span>" : "<span class=\"t-dim\">(not created — try /init)</span>") + "\n  User:     ~/.claude/CLAUDE.md\n  Auto memory: on <span class=\"t-dim\">· 0 memories saved</span>");
        case "/init":
          return run([function () { say("I'll analyse the project to write a CLAUDE.md."); }, function () { tool("Glob", "**/*"); }, function () { tool("Read", "README.md"); }, function () { tool("Read", "test_calculator.py"); },
            function () { createFile("CLAUDE.md", "# Claude Code training lab\n## Commands\n- Run tests: python -m unittest -v\n## Notes\n- Synthetic data only; .env holds a dummy key", function () { sim.claudeMd = true; say("CLAUDE.md is ready. It loads at the start of every session — refine it with /memory."); }); }]);
        case "/plan":
          setMode("plan");
          if (!arg) return line('<span class="t-dim">Plan mode on — I\'ll research and propose before editing. Press Shift+Tab to leave.</span>');
          return run([function () { say("Researching before proposing a plan for: “" + esc(arg) + "”"); }, function () { tool("Glob", "inbox/*"); }, function () { tool("Read", "inbox/untitled.txt"); },
            function () { box("<span class=\"t-acc\">Plan</span>\n1. Create folders: notes/, finance/, status/, risks/, legal/\n2. Rename files to YYYY-MM-DD_topic.txt using the date inside each file\n3. Copy (not move) into organised/ so nothing is lost\n4. List the result and flag files with unclear dates"); prompt("Would you like to proceed?", "", [["Yes, and use auto mode", function () { setMode("auto"); say("Starting the work in auto mode. <span class=\"t-dim\">(simulation ends here)</span>"); }], ["Yes, manually approve edits", function () { setMode("default"); say("Starting — I'll ask before each edit. <span class=\"t-dim\">(simulation ends here)</span>"); }], ["No, keep planning", function () { say("Sure — what should change in the plan?"); }]]); }]);
        case "/rewind": case "/checkpoint": case "/undo":
          if (!sim.created.length) return box("<span class=\"t-acc\">Rewind</span> — no file changes to restore yet.\nOptions you'll see: Restore code and conversation · Restore conversation · Restore code · Summarize from here · Summarize up to here · Never mind\n<span class=\"t-dim\">Tip: Esc Esc on an empty prompt opens this menu.</span>");
          var last = sim.created[sim.created.length - 1];
          return prompt("Rewind to before the last change?", '<span class="t-dim">Most recent change: ' + esc(last) + "</span>", [["Restore code", function () { var f = sim.created.pop(); if (f === "calculator.py (edited)") sim.fixed = false; if (f === "CLAUDE.md") sim.claudeMd = false; line('<span class="t-ok">✓ Restored the code</span> <span class="t-dim">— ' + esc(f) + " reverted. The conversation is unchanged.</span>"); }], ["Restore code and conversation", function () { var f = sim.created.pop(); if (f === "calculator.py (edited)") sim.fixed = false; if (f === "CLAUDE.md") sim.claudeMd = false; line('<span class="t-ok">✓ Restored code and conversation</span> <span class="t-dim">— ' + esc(f) + " reverted; your earlier prompt is back in the input.</span>"); }], ["Never mind", function () { line('<span class="t-dim">No changes.</span>'); }]]);
        case "/diff":
          if (!sim.created.length) return line('<span class="t-dim">No changes in the working tree yet.</span>');
          return box(sim.created.map(function (f) { return '<span class="t-ok">+ ' + esc(f) + "</span>"; }).join("\n") + "\n<span class=\"t-dim\">In the real app you can open each file's diff.</span>");
        case "/resume": case "/continue":
          return box("<span class=\"t-acc\">Resume a session</span> <span class=\"t-dim\">(simulated)</span>\n❯ lab1 · 2 hours ago\n  q3-analysis · yesterday\n  install-check · 3 days ago\n<span class=\"t-dim\">↑/↓ and Enter in the real picker · or claude -r lab1 from your shell</span>");
        case "/doctor": case "/checkup":
          return run([function () { line('<span class="t-ok">✓</span> Installation: native, auto-updates on'); }, function () { line('<span class="t-ok">✓</span> PATH: ~/.local/bin'); }, function () { line('<span class="t-ok">✓</span> Settings files: valid'); }, function () { line((sim.claudeMd ? '<span class="t-ok">✓</span> CLAUDE.md present' : '<span class="t-warn">!</span> No CLAUDE.md in this project — run /init')); }, function () { line('<span class="t-ok">✓</span> Up to date on the latest channel'); }]);
        case "/btw":
          if (!arg) return line('<span class="t-dim">Usage: /btw your question</span>');
          return box("<span class=\"t-dim\">(side question — not added to the conversation)</span>\n" + (/(chang|creat|file|edit)/i.test(arg) ? (sim.created.length ? "So far: " + sim.created.map(esc).join(", ") + "." : "Nothing has changed yet.") : "Side questions answer from what's already in context, without using tools."));
        case "/powerup":
          return line('<span class="t-dim">In the real app, /powerup opens short interactive lessons with animated demos.</span>');
        case "/exit": case "/quit":
          sim.ended = true; return line('<span class="t-dim">Goodbye! Resume this conversation later with:</span> claude -c');
        default:
          var known = COURSE.commands.filter(function (c) { return c.c === cmd || (c.a && c.a.split(/,\s*/).indexOf(cmd) >= 0); })[0];
          if (known) return line('<span class="t-acc">' + esc(known.c) + "</span> — " + esc(known.d) + ' <span class="t-dim">(not simulated here — try it in the real app)</span>');
          return line('<span class="t-err">Unknown command: ' + esc(cmd) + '</span> <span class="t-dim">— type /help</span>');
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); var i = CYCLE.indexOf(sim.mode); setMode(CYCLE[(i + 1) % CYCLE.length]); line('<span class="t-dim">mode → ' + esc(MODES[sim.mode][0]) + "</span>"); return; }
      if (e.key === "Tab" && input.value[0] === "/" && input.value.indexOf(" ") < 0) {
        var m = COURSE.commands.filter(function (c) { return c.c.indexOf(input.value.toLowerCase()) === 0; })[0];
        if (m) { e.preventDefault(); input.value = m.c + " "; } return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (sim.pending) { resolve(sim.pending.options.length - 1); return; }
        if (qTimer) { clearQueue(); line('<span class="t-warn">⏹ Interrupted</span> <span class="t-dim">· What should Claude do instead?</span>'); }
        return;
      }
      if (e.key === "ArrowUp" && sim.hist.length) { e.preventDefault(); sim.hi = Math.max(0, sim.hi - 1); input.value = sim.hist[sim.hi] || ""; return; }
      if (e.key === "ArrowDown" && sim.hist.length) { e.preventDefault(); sim.hi = Math.min(sim.hist.length, sim.hi + 1); input.value = sim.hist[sim.hi] || ""; return; }
      if (e.key === "Enter") {
        e.preventDefault(); var v = input.value; input.value = "";
        if (sim.pending) { var n = parseInt(v, 10); if (n >= 1) resolve(n - 1); else line('<span class="t-dim">Choose an option first (1–' + sim.pending.options.length + ") or press Esc.</span>"); return; }
        if (qTimer) { line('<span class="t-dim">(queued) ' + esc(v) + "</span>"); run([function () { handle(v); }]); return; }
        handle(v);
      }
    });
    root.addEventListener("click", function (e) {
      var o = e.target.closest("[data-opt]"); if (o && sim.pending && !o.disabled) { resolve(+o.getAttribute("data-opt")); return; }
      var h = e.target.closest("[data-h]"); if (h) { if (sim.pending) { toast("Answer the prompt in the terminal first"); return; } if (qTimer) return; handle(h.getAttribute("data-h")); input.focus({ preventScroll: true }); return; }
      if (e.target.closest(".term-reset")) { reset(); input.focus({ preventScroll: true }); }
    });
    reset();
  }

  /* ------------------------------------------------------------ zip (lab kit) */
  var CRC_TABLE = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(entries) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    entries.forEach(function (e) {
      var name = enc.encode(e[0]), isDir = e[1] == null, data = isDir ? new Uint8Array(0) : enc.encode(e[1]), crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true);
      ch.setUint32(38, isDir ? 0x10 : 0, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, a) { return s + a.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true); end.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
  }
  function downloadLabKit() {
    var entries = [["claude-lab/", null], ["claude-lab/inbox/", null]].concat(COURSE.labkit.files);
    download("claude-lab.zip", makeZip(entries));
    state.checks["prereqs:labkit"] = true; save();
    var cb = $('.checklist[data-checklist="prereqs"] input[data-id="labkit"]'); if (cb) cb.checked = true;
    updateProgress(); toast("Downloaded claude-lab.zip");
  }

  /* ------------------------------------------------------------ search */
  var index = [];
  // Facilitator notes stay out of search, so learners don't get answer keys in result snippets.
  function visibleText(node) {
    if (node.classList && node.classList.contains("facilitator")) return "";
    var t = node.textContent;
    if (node.querySelectorAll) $$(".facilitator", node).forEach(function (f) { t = t.replace(f.textContent, ""); });
    return t;
  }
  function buildIndex() {
    index = [];
    $$("main .section[id]").forEach(function (sec) {
      var title = sec.getAttribute("data-title") || ($("h2", sec) ? $("h2", sec).textContent : sec.id);
      title = title.replace(/&amp;/g, "&");
      var h3s = $$("h3", sec);
      var firstText = "";
      var node = sec.firstElementChild;
      while (node && node.tagName !== "H3") { firstText += " " + visibleText(node); node = node.nextElementSibling; }
      index.push({ id: sec.id, title: title, path: "", text: firstText.replace(/\s+/g, " ") });
      h3s.forEach(function (h) {
        if (!h.id) h.id = sec.id + "-" + slug(h.textContent);
        var txt = h.textContent, n = h.nextElementSibling;
        while (n && n.tagName !== "H3" && n.tagName !== "H2") { txt += " " + visibleText(n); n = n.nextElementSibling; }
        index.push({ id: h.id, title: h.textContent.trim(), path: title, text: txt.replace(/\s+/g, " ") });
      });
    });
  }
  function initSearch() {
    var input = $("#searchInput"), res = $("#searchResults"), wrap = $("#searchWrap"), active = -1;
    function close() { res.classList.remove("open"); input.setAttribute("aria-expanded", "false"); active = -1; }
    function search(q) {
      q = q.trim().toLowerCase(); if (q.length < 2) { close(); return; }
      var toks = q.split(/\s+/).filter(Boolean);
      var hits = index.map(function (e) {
        var hay = (e.title + " " + e.text).toLowerCase();
        if (!toks.every(function (t) { return hay.indexOf(t) >= 0; })) return null;
        var score = toks.reduce(function (s, t) { return s + (e.title.toLowerCase().indexOf(t) >= 0 ? 10 : 0) + (e.text.toLowerCase().split(t).length - 1); }, 0);
        return { e: e, score: score };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
      if (!hits.length) { res.innerHTML = '<div class="search-empty">No matches for “' + esc(q) + '”. Try the <a href="#ref-commands">command explorer</a>.</div>'; res.classList.add("open"); return; }
      res.innerHTML = hits.map(function (h, i) {
        var t = h.e.text, low = t.toLowerCase(), at = low.indexOf(toks[0]); var start = Math.max(0, at - 50);
        var snip = (start > 0 ? "…" : "") + t.substr(start, 140) + "…";
        var hl = esc(snip); toks.forEach(function (tk) { if (tk.length > 1) hl = hl.replace(new RegExp("(" + tk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
        return '<a href="#' + esc(h.e.id) + '" role="option" data-i="' + i + '"><div class="sr-title">' + esc(h.e.title) + "</div>" + (h.e.path ? '<div class="sr-path">' + esc(h.e.path) + "</div>" : "") + '<div class="sr-snip">' + hl + "</div></a>";
      }).join("");
      res.classList.add("open"); input.setAttribute("aria-expanded", "true"); active = -1;
    }
    input.addEventListener("input", function () { search(input.value); });
    input.addEventListener("focus", function () { if (input.value.trim().length >= 2) search(input.value); });
    input.addEventListener("keydown", function (e) {
      var items = $$("a", res);
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(items.length - 1, active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); }
      else if (e.key === "Enter") { e.preventDefault(); var a = items[active >= 0 ? active : 0]; if (a) { a.click(); } return; }
      else if (e.key === "Escape") { close(); input.blur(); wrap.classList.remove("mobile-open"); return; }
      else return;
      items.forEach(function (a, i) { a.classList.toggle("active", i === active); });
      if (items[active]) items[active].scrollIntoView({ block: "nearest" });
    });
    res.addEventListener("click", function (e) { if (e.target.closest("a")) { close(); wrap.classList.remove("mobile-open"); input.value = ""; } });
    document.addEventListener("click", function (e) { if (!e.target.closest("#searchWrap") && !e.target.closest("#searchToggle")) { close(); } });
    $("#searchToggle").addEventListener("click", function () { wrap.classList.toggle("mobile-open"); if (wrap.classList.contains("mobile-open")) input.focus(); });
    document.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); wrap.classList.add("mobile-open"); input.focus(); input.select(); } });
  }

  /* ------------------------------------------------------------ scrollspy */
  function initScrollSpy() {
    var links = {}; $$(".nav-link").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    if (!("IntersectionObserver" in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$(".nav-link.active").forEach(function (a) { a.classList.remove("active"); });
          links[en.target.id].classList.add("active");
          var sb = $("#sidebar"), a = links[en.target.id];
          if (sb && a && window.innerWidth > 1020) { var top = a.offsetTop - sb.clientHeight / 2; if (Math.abs(sb.scrollTop - top) > sb.clientHeight / 3) sb.scrollTo({ top: top, behavior: "smooth" }); }
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("main .section[id]").forEach(function (s) { obs.observe(s); });
  }

  /* ------------------------------------------------------------ boot */
  function boot() {
    document.body.classList.add("js");
    enhanceCode(document);
    $$(".tabs").forEach(initTabs);
    applyOS(state.os || detectOS());
    if (state.theme) applyTheme(state.theme);
    applyFac(state.fac); applyPres(state.pres);

    $$(".seg [data-os]").forEach(function (b) { b.addEventListener("click", function () { applyOS(b.getAttribute("data-os"), true); }); });
    $("#themeBtn").addEventListener("click", function () { applyTheme(effectiveTheme() === "dark" ? "light" : "dark"); });
    $("#facBtn").addEventListener("click", function () { applyFac(!state.fac); toast(state.fac ? "Facilitator notes shown" : "Facilitator notes hidden"); });
    $("#presBtn").addEventListener("click", function () { applyPres(!state.pres); });
    $("#menuBtn").addEventListener("click", function () { var open = !document.body.classList.contains("nav-open"); document.body.classList.toggle("nav-open", open); $("#menuBtn").setAttribute("aria-expanded", String(open)); });
    $("#navScrim").addEventListener("click", function () { document.body.classList.remove("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "false"); });
    $$(".nav-link").forEach(function (a) { a.addEventListener("click", function () { document.body.classList.remove("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "false"); }); });
    $("#resetProgress").addEventListener("click", function () {
      if (!window.confirm("Reset all checklists, quiz answers and certificate data saved in this browser?")) return;
      state.checks = {}; state.quizzes = {}; state.cert = {}; save(); window.location.reload();
    });

    initChecklists();
    $$(".agenda[data-agenda]").forEach(initAgenda);
    initQuizzes(); initCert();
    var s = $('[data-game="sorter"]'); if (s) initSorter(s);
    var d = $('[data-game="drill"]'); if (d) initDrill(d);
    var c = $('[data-game="cycle"]'); if (c) initCycle(c);
    var b;
    if ((b = $('[data-builder="prompt"]'))) initPromptBuilder(b);
    if ((b = $('[data-builder="perm"]'))) initPermBuilder(b);
    if ((b = $('[data-builder="claudemd"]'))) initClaudeMdBuilder(b);
    if ((b = $('[data-builder="mcp"]'))) initMcpBuilder(b);
    if ((b = $('[data-builder="skill"]'))) initSkillBuilder(b);
    var ex = $("[data-explorer]"); if (ex) initExplorer(ex);
    renderShortcuts();
    var pr = $("[data-prompts]"); if (pr) initPrompts(pr);
    var gl = $("[data-glossary]"); if (gl) initGlossary(gl);
    $$(".term[data-sim]").forEach(initSim);

    document.addEventListener("click", function (e) {
      var cb = e.target.closest(".copy-btn");
      if (cb && !cb.hasAttribute("data-dl")) {
        var txt = cb.getAttribute("data-copy-text");
        if (txt == null) { var code = cb.closest(".code"); var pre = code && $("pre", code); txt = pre ? pre.innerText.replace(/\n$/, "") : ""; }
        copyText(txt, cb); return;
      }
      var ct = e.target.closest("[data-copy-text]");
      if (ct && !ct.classList.contains("copy-btn")) { copyText(ct.getAttribute("data-copy-text"), null); return; }
      if (e.target.closest('[data-action="download-labkit"]')) { e.preventDefault(); downloadLabKit(); }
    });

    var bt = $("#backTop");
    window.addEventListener("scroll", function () { bt.classList.toggle("show", window.scrollY > 900); }, { passive: true });
    bt.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    buildIndex(); initSearch(); initScrollSpy(); updateProgress();
    window.__course = { state: state, evaluate: function (t, v, m) { return permBuilder && permBuilder.evaluate(t, v, m); }, setRules: function (r) { if (permBuilder) permBuilder.setRules(r); }, makeZip: makeZip, labkit: COURSE.labkit };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
