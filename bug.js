(() => {
  if (window.openBugReport) return;
  const WORKER = "https://league-scheduler.nntay92.workers.dev";
  const css = document.createElement("style");
  css.textContent = `
.bg-card { display: block; text-align: left; width: min(380px, 100%); }  /* block: the landing page's card is a flex row */
.bg-card h2 { text-align: center; }
.bg-card label { display: block; margin: 10px 0 4px; font: 600 12.5px var(--display); color: var(--text-secondary); }
.bg-card textarea, .bg-card input { width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid var(--border, #2a3352);
  background: var(--surface-0, #05091d); color: var(--text-primary); font: 400 14px/1.4 system-ui, sans-serif; padding: 9px 11px; }
.bg-card textarea { min-height: 110px; resize: vertical; }
.bg-card textarea:focus, .bg-card input:focus { outline: 2px solid var(--cyan); outline-offset: 0; border-color: transparent; }
.bg-card .bg-note { margin: 8px 0 0; color: var(--text-muted); font-size: 12px; line-height: 1.4; }
.bg-card .bg-msg { min-height: 18px; margin: 8px 0 0; font-size: 13px; text-align: center; }
.bg-card .bg-msg.err { color: var(--red, #ff8075); }
.bg-card .bg-msg.ok { color: var(--green, #28e757); }
.bg-card .cf-go { margin-top: 10px; border: 0; cursor: pointer; font: 600 14px var(--display); }
.bg-card .cf-go[disabled] { opacity: .5; cursor: default; }
.bg-bug { width: 54px; height: 54px; display: block; margin: 0 auto 2px; color: var(--cyan-text); }`;
  document.head.appendChild(css);
  const sheet = document.createElement("div");
  sheet.className = "cf-sheet"; sheet.id = "bug-sheet"; sheet.hidden = true;
  sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-labelledby", "bug-title");
  sheet.innerHTML = `<div class="cf-back" data-close></div>
  <form class="cf-card bg-card" novalidate><button type="button" class="cf-x" data-close aria-label="Close">&times;</button>
    <svg class="bg-bug" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0z"/><path d="M12 9v9M9 6.5 7.5 4.5M15 6.5l1.5-2M8 11H4.5M8 15H4.5l-1 2M16 11h3.5M16 15h3.5l1 2"/></svg>
    <h2 id="bug-title">Report a bug</h2>
    <label for="bug-text">What went wrong?</label>
    <textarea id="bug-text" maxlength="2000" placeholder="What you did, what happened, and what you expected"></textarea>
    <button type="submit" class="run-btn cf-go" id="bug-send">Send</button>
    <p class="bg-msg" id="bug-msg" aria-live="polite"></p>
  </form>`;
  document.body.appendChild(sheet);
  const $ = s => sheet.querySelector(s), text = $("#bug-text"), send = $("#bug-send"), msg = $("#bug-msg");
  const close = () => { sheet.hidden = true; };
  text.addEventListener("input", () => { if (msg.classList.contains("err")) { msg.textContent = ""; msg.className = "bg-msg"; } });
  sheet.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });
  const deviceId = () => {
    try {
      let d = localStorage.getItem("contendathon-device");
      if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem("contendathon-device", d); }
      return d;
    } catch (e) { return ""; }
  };
  const ctx = () => { try { return (window.bugContext && window.bugContext()) || {}; } catch (e) { return {}; } };
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    const t = text.value.trim();
    if (t.length < 5) { msg.className = "bg-msg err"; msg.textContent = "Please say a little about what went wrong."; text.focus(); return; }
    send.disabled = true; msg.className = "bg-msg"; msg.textContent = "Sending…";
    const c = ctx();
    const body = { text: t, page: c.page || "", league: c.league || "", name: c.name || "", tab: c.tab || "",
      team: c.team || "", user: c.user || "", built: c.built || "", url: location.href.split("#")[0],
      ua: navigator.userAgent, w: innerWidth, h: innerHeight,
      app: (navigator.standalone || matchMedia("(display-mode: standalone)").matches) ? 1 : 0,
      errs: (window.__errs || []).slice(-5), device: deviceId() };
    let ok = false, err = "";
    try {
      const r = await fetch(WORKER + "/bug", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      ok = r.ok; if (!ok) err = ((await r.json().catch(() => ({}))).error) || "";
    } catch (x) {}
    send.disabled = false;
    if (!ok) { msg.className = "bg-msg err"; msg.textContent = err || "Couldn't send it. Please try again in a minute."; return; }
    msg.className = "bg-msg ok"; msg.textContent = "Thanks! Got it.";
    text.value = "";
    setTimeout(close, 1600);
  });
  window.openBugReport = () => {
    msg.textContent = ""; msg.className = "bg-msg";
    sheet.hidden = false;
    setTimeout(() => text.focus(), 50);
  };
})();
