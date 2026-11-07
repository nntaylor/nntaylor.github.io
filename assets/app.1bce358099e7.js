
const shellBox = matchMedia("(max-width: 640px)").matches && document.getElementById("app-tabbar") ? (() => {
  const box = document.createElement("div"), main = document.querySelector("main");
  box.id = "shell-box"; main.before(box); box.append(main);
  document.documentElement.classList.add("shell");
  return box;
})() : null;
const pageScroller = shellBox || window;
const shellFix = { on: false };
if (shellBox && (navigator.standalone || matchMedia("(display-mode: standalone)").matches) && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
  const probe = document.body.appendChild(Object.assign(document.createElement("div"), {
    style: "position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none" }));
  const fixHeight = () => {
    const screenH = matchMedia("(orientation: landscape)").matches ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    const gap = screenH - innerHeight, inset = probe.offsetHeight;
    const on = (shellFix.on && gap === 0) || (gap > 0 && inset > 0 && Math.abs(gap - inset) <= 2);
    document.documentElement.style.height = on ? `${screenH}px` : "";
    shellFix.on = on;
  };
  fixHeight();
  addEventListener("resize", fixHeight);
  addEventListener("orientationchange", () => { shellFix.on = false; document.documentElement.style.height = ""; setTimeout(fixHeight, 300); });
  addEventListener("load", () => [0, 250, 1000, 2500].forEach(ms => setTimeout(fixHeight, ms)));
  addEventListener("pageshow", fixHeight);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(fixHeight, 100); });
  if (window.visualViewport) visualViewport.addEventListener("resize", fixHeight);
}
const pageY = () => shellBox ? shellBox.scrollTop : scrollY;
const stuckWhenPast = (el, marker) => {
  const f = () => el.classList.toggle("stuck", marker.getBoundingClientRect().top < 0);
  pageScroller.addEventListener("scroll", f, { passive: true }); f();
};
if (navigator.standalone) document.documentElement.classList.add("standalone");
(() => {
  const vv = window.visualViewport, meta = document.querySelector('meta[name="viewport"]');
  if (!vv || !meta) return;
  const free = meta.content;
  let timer = null;
  document.addEventListener("touchend", e => {
    if (e.touches.length) return;
    setTimeout(() => {
      if (vv.scale <= 1.01) return;
      meta.content = free + ", maximum-scale=1";
      clearTimeout(timer);
      timer = setTimeout(() => { meta.content = free; }, 400);
    }, 80);
  }, { passive: true });
})();
const D0 = window.__D0;
let D = D0;
(() => {
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem("contendathon-ui") || "[]"); } catch (e) {}
  if (!ids.includes(String(D0.league.id))) { document.documentElement.style.visibility = ""; return; }
  const show = html => { document.open(); document.write(html); document.close(); document.documentElement.style.visibility = ""; };
  fetch(`/${Math.random().toString(36).slice(2)}`, { cache: "no-store" }).then(r => r.text())
    .then(show, () => show("<!doctype html><title>Page not found</title><h1>404</h1><p>File not found</p>"));
  throw new Error("404");
})();
const teams = Object.keys(D.series);
const onData = [];
const who = () => {
  try {
    const w = localStorage.getItem("contendathon-who");
    if (w) return w.slice(0, 40);
    const t = localStorage.getItem(`contendathon-${D0.league.id}-me`);
    const n = String((t && (D0.league.ownerNames || {})[t]) || "").slice(0, 40);
    if (n) localStorage.setItem("contendathon-who", n);
    return n;
  } catch (e) { return ""; }
};
const track = (() => {
  const url = "https://league-scheduler.nntay92.workers.dev/e", league = D0.league.key || "";
  const app = navigator.standalone || matchMedia("(display-mode: standalone)").matches, phone = matchMedia("(max-width: 640px)").matches;
  const send = e => {
    if (!league || /^(localhost|127\.|file)/.test(location.hostname || "file")) return;
    try { if (localStorage.getItem("contendathon-nocount")) return; } catch (e) {}
    try { navigator.sendBeacon(url, new Blob([JSON.stringify({ l: league, e, a: app ? 1 : 0, p: phone ? 1 : 0, u: who() })], { type: "text/plain" })); } catch (err) {}
  };
  send("view");
  setTimeout(() => { if (window.__openTab === "tank") send("view_tank"); }, 0);
  try {
    const k = `contendathon-${D0.league.id}-visit`, day = new Date().toDateString();
    if (localStorage.getItem(k) !== day) { localStorage.setItem(k, day); send("visitor"); }
  } catch (err) {}
  const on = el => el.getAttribute("aria-checked") === "true";
  document.addEventListener("click", ev => setTimeout(() => {
    const t = ev.target.closest && ev.target.closest("button, [data-go]");
    if (!t) return;
    const go = t.dataset.go, id = t.id;
    if (id === "tab-btn-contend" || go === "contend") send("tab_contend");
    else if (id === "tab-btn-tank" || go === "tank") send("tab_tank");
    else if ((id === "tr-toggle" || go === "trade") && on(t)) send("trade_on");
    else if (id === "tr-add") send("evaluate");
    else if (t.classList.contains("odds-sw") && on(t)) send("odds_time");
    else if (id === "board-sw") send(on(t) ? "board_1qb" : "board_sf");
    else if (id === "refresh") send("refresh");
    else if (id === "opt-save") send("options");
    else if (id === "share") send("share");
    else if (id === "coffee" || id === "coffee-bar") send("coffee");
    else if (t.hasAttribute("data-bug")) send("bug");
    else if (id === "how-btn" && t.getAttribute("aria-expanded") === "true") send("how");
  }, 0), true);
  return send;
})();
const behave = (() => {
  try {
  const url = "https://league-scheduler.nntay92.workers.dev/v", league = D0.league.key || "";
  let off = !league || /^(localhost|127\.|file)/.test(location.hostname || "file");
  try { off = off || !!localStorage.getItem("contendathon-nocount"); } catch (e) {}
  const app = navigator.standalone || matchMedia("(display-mode: standalone)").matches, phone = matchMedia("(max-width: 640px)").matches;
  let src = "direct";
  try {
    const r = document.referrer ? new URL(document.referrer) : null;
    src = app ? "app" : !r ? "direct" : r.host !== location.host ? "other" : /^\/(index\.html)?$/.test(r.pathname) ? "landing" : "site";
  } catch (e) { src = "other"; }
  const id = (Math.random().toString(36).slice(2, 12) + Date.now().toString(36)).slice(0, 24);
  const facts = new Set(); let changed = false, timer = 0, errs = 0;
  const flush = () => {
    clearTimeout(timer);
    if (off || !changed) return;
    changed = false;
    try { navigator.sendBeacon(url, new Blob([JSON.stringify({ id, l: league, a: app ? 1 : 0, p: phone ? 1 : 0, w: innerWidth, s: src, u: who(), f: [...facts] })], { type: "text/plain" })); } catch (err) {}
  };
  const add = f => {
    f = String(f).toLowerCase().replace(/[^a-z0-9_:.-]+/g, "_").slice(0, 48);
    if (facts.has(f) || facts.size >= 80) return;
    facts.add(f); changed = true; clearTimeout(timer); timer = setTimeout(flush, 4000);
  };
  let howAt = 0, howBest = 0;
  const howDone = () => {
    if (!howAt) return;
    howBest = Math.max(howBest, (Date.now() - howAt) / 1000); howAt = 0;
    for (const f of [...facts]) if (f.indexOf("how:") === 0) facts.delete(f);
    add("how:" + (howBest < 10 ? "in10" : howBest < 30 ? "in30" : howBest < 60 ? "in60" : "all"));
  };
  const hb = document.getElementById("how-btn");
  if (hb) new MutationObserver(() => { if (hb.getAttribute("aria-expanded") === "true") { if (!howAt) howAt = Date.now(); } else howDone(); })
    .observe(hb, { attributes: true, attributeFilter: ["aria-expanded"] });
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { howDone(); flush(); }
    else if (hb && hb.getAttribute("aria-expanded") === "true") howAt = Date.now(); });
  addEventListener("pagehide", () => { howDone(); flush(); });
  const pz = document.getElementById("paused");
  if (pz) new MutationObserver(() => { if (!pz.hidden) add("paused:shown"); }).observe(pz, { attributes: true, attributeFilter: ["hidden"] });
  const tabOf = el => { const p = el.closest && el.closest(".tabpane"); return p ? p.id.replace("tab-", "") : "page"; };
  const secKey = h => { const i = h.querySelector(".info-btn"); return i ? i.getAttribute("aria-describedby").replace(/^info-/, "") : h.id || ""; };
  const heads = () => [...document.querySelectorAll(".tabpane h2, #bands-sec h2")].filter(h => secKey(h));
  setTimeout(() => {
    add("open:" + (window.__openTab === "tank" ? "tank" : "contend")); add("tab:" + (window.__openTab === "tank" ? "tank" : "contend"));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) add("sec:" + tabOf(e.target) + "." + secKey(e.target)); }), { threshold: 1 });
      heads().forEach(h => io.observe(h));
    }
  }, 0);
  const under = t => { let k = ""; for (const h of heads()) { if (tabOf(h) !== tabOf(t)) continue; if (h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING || h.contains(t)) k = secKey(h); } return k || "top"; };
  const on = el => el.getAttribute("aria-checked") === "true";
  let pickAt = 0, picked = false;
  document.addEventListener("click", ev => {
    const t0 = ev.target;
    if (!t0 || !t0.closest) return;
    if (t0.closest("#me-sheet .me-o")) picked = true;
    setTimeout(() => {
      const a = t0.closest("a");
      if (a) { if (a.id === "board-src") add("tool:bigboard"); else if (a.classList.contains("cf-go")) add("tool:paypal"); return; }
      const t = t0.closest("button, [data-go]");
      if (t) {
        const go = t.dataset.go, id = t.id;
        if (id === "tab-btn-contend" || go === "contend") add("tab:contend");
        else if (id === "tab-btn-tank" || go === "tank") add("tab:tank");
        else if ((id === "tr-toggle" || go === "trade") && on(t)) add("tool:trade");
        else if (id === "tr-add") add("tool:evaluate");
        else if (t.classList.contains("info-btn")) add("tip:" + t.getAttribute("aria-describedby").replace(/^info-/, ""));
        else if (t.dataset.v && t.closest(".seg[id]")) add("view:" + t.closest(".seg[id]").id + "." + t.dataset.v);
        else if (t.classList.contains("odds-sw") && on(t)) add("tool:odds_time." + tabOf(t));
        else if (id === "board-sw") add("tool:board");
        else if (id === "sched-scores" && on(t)) add("tool:scores");
        else if (t.closest(".im-row")) add("tool:flip");
        else if (id === "im-reset") add("tool:flip_reset");
        else if (id === "team-run") add("tool:pick_without");
        else if (id === "refresh") add("tool:refresh");
        else if (id === "opt-save") add("tool:options");
        else if (id === "share") add("tool:share");
        else if (id === "coffee" || id === "coffee-bar") add("tool:coffee");
        else if (t.hasAttribute("data-bug")) add("tool:bug");
        else if (id === "how-btn" && t.getAttribute("aria-expanded") === "true") add("tool:how");
        else if (t.closest("#paused")) add("paused:old");
        return;
      }
      if (t0.closest("a, input, select, textarea, label, summary, [tabindex], [data-close], [role=dialog], [role=tooltip], [role=button], [role=switch], " +
        "[role=tab], [role=option], [role=link], [role=checkbox], [role=combobox], [role=slider], [role=menuitem], .info")) return;
      for (let el = t0, i = 0; el && el.nodeType === 1 && i < 6; el = el.parentElement, i++) if (getComputedStyle(el).cursor === "pointer") return;
      add("dead:" + tabOf(t0) + "." + under(t0) + "." + (t0.closest("tr, .im-row") ? "row" : t0.closest("svg, canvas") ? "chart" : "text"));
    }, 0);
  }, true);
  let hov = 0;
  document.addEventListener("mouseover", e => { const b = e.target.closest && e.target.closest(".info-btn"); clearTimeout(hov);
    if (b) hov = setTimeout(() => add("tip:" + b.getAttribute("aria-describedby").replace(/^info-/, "")), 600); });
  const tp = document.getElementById("tr-picked");
  if (tp) new MutationObserver(() => { if (tp.children.length) add("tool:trade_pick"); }).observe(tp, { childList: true });
  const sheet = document.getElementById("me-sheet");
  if (sheet) new MutationObserver(() => {
    if (!sheet.hidden) { pickAt = Date.now(); picked = false; add("pick:shown"); return; }
    if (!pickAt) return;
    const s = (Date.now() - pickAt) / 1000; pickAt = 0;
    if (!picked) { add("pick:later"); return; }
    add("pick:team"); add("pick:" + (s < 3 ? "in3" : s < 10 ? "in10" : s < 30 ? "in30" : "over30"));
  }).observe(sheet, { attributes: true, attributeFilter: ["hidden"] });
  const err = m => { if (errs++ < 3) add("err:" + String(m || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 44)); };
  addEventListener("error", e => err(e.message));
  addEventListener("unhandledrejection", e => err(e.reason && e.reason.message || e.reason));
  return add;
  } catch (e) { return () => {}; }
})();
{
  const c = document.querySelector(".copyright"), text = c.textContent;
  let taps = [];
  c.addEventListener("click", () => {
    taps = taps.filter(t => Date.now() - t < 2500).concat(Date.now());
    if (taps.length < 5) return;
    taps = [];
    let off = false;
    try { off = !localStorage.getItem("contendathon-nocount"); off ? localStorage.setItem("contendathon-nocount", "1") : localStorage.removeItem("contendathon-nocount"); } catch (e) {}
    c.textContent = off ? "This device isn't counted." : "This device is counted again.";
    setTimeout(() => { c.textContent = text; }, 2500);
  });
}
let S = Object.fromEntries(D.standings.map(r => [r.team, r]));
const S0 = Object.fromEntries(D0.standings.map(r => [r.team, r]));
function chg(after, before, good = 1, digits = 1, pct = false) {
  if (D === D0 || after == null || before == null) return "";
  const v = pct ? Math.round((after - before) * 100) : Number((after - before).toFixed(digits));
  if (!v) return "";
  return `<span class="chg ${(v > 0) === (good > 0) ? "good" : "bad"}">(${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(pct ? 0 : digits)})</span>`;
}
const chgP = (after, before, good = 1) => chg(after, before, good, 0, true);
const TEAM_KEY = `contendathon-${D.league.id}-team`, TAB_KEY = `contendathon-${D.league.id}-tab`;
const asTeam = v => teams.includes(v) ? v : (Object.entries(D.league.ownerNames || {}).find(([, n]) => n && n === v) || [])[0] || null;
const saved = (() => {
  try { const h = asTeam(new URLSearchParams(location.hash.slice(1)).get("team")); if (h) return h; } catch (e) {}
  try { const v = localStorage.getItem(TEAM_KEY) || localStorage.getItem(D.league.storageKey); if (asTeam(v)) return asTeam(v); } catch (e) {}
  return null;
})();
const ME_KEY = `contendathon-${D.league.id}-me`;
let me = (() => { try { return asTeam(localStorage.getItem(ME_KEY)); } catch (e) { return null; } })();
if (!me) try {
  const u = localStorage.getItem(`contendathon-${D.league.id}-me-user`);
  const t = u && Object.entries(D.league.owners || {}).find(([, ids]) => ids.includes(u));
  if (t && teams.includes(t[0])) { me = t[0]; localStorage.setItem(ME_KEY, me); }
} catch (e) {}
let hi = me || saved || (teams.includes(D.highlight) ? D.highlight : D.standings[0].team);
const ns = "http://www.w3.org/2000/svg";
const PHONE = matchMedia("(max-width: 640px)").matches;
const phoneW = () => Math.max(300, Math.min(1040, document.querySelector("main").clientWidth - 26));
const el = (n, a = {}, p) => { const e = document.createElementNS(ns, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const f1 = v => v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const NO_PHOTO = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#1f2743"/>' +
  '<circle cx="20" cy="16" r="7" fill="#5b6b85"/><path d="M6 40c1.5-9 7-13.5 14-13.5S32.5 31 34 40z" fill="#5b6b85"/></svg>');
const headshot = pid => !pid ? "" : /^[A-Z]{2,3}$/.test(pid) && D0.logos && D0.logos[pid]
  ? `<img class="hs def" alt="" src="${D0.logos[pid]}">`
  : `<img class="hs" loading="lazy" alt="" src="https://sleepercdn.com/content/nfl/players/thumb/${pid}.jpg" onerror="this.onerror=null;this.src=NO_PHOTO">`;
const short = (t, n = 17) => t && t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
const svgName = (node, t, n) => { node.textContent = short(t, n); if (short(t, n) !== t) el("title", {}, node).textContent = t; return node; };
const fitCtx = document.createElement("canvas").getContext("2d");
const textW = (s, cs, px = parseFloat(cs.fontSize)) => { fitCtx.font = `${cs.fontWeight} ${px}px ${cs.fontFamily}`; return fitCtx.measureText(s).width; };
function fitName(node, t, maxW, minPx) {
  const cs = getComputedStyle(node), base = parseFloat(cs.fontSize), w = textW(t, cs, base);
  const px = w > maxW ? Math.max(minPx, Math.floor(base * maxW / w * 2) / 2) : base;
  let cut = t;
  while (cut.length > 1 && textW(cut === t ? t : cut + "…", cs, px) > maxW) cut = cut.slice(0, -1).trimEnd();
  node.textContent = cut === t ? t : cut + "…";
  if (px !== base) node.style.fontSize = px + "px";
  if (cut !== t) el("title", {}, node).textContent = t;
  return node;
}
const odds = p => p >= 0.995 ? (p >= 1 ? "100%" : ">99%") : p <= 0 ? "—" : p < 0.005 ? "<1%" : Math.round(p * 100) + "%";
const rec = r => `${r.w}–${r.l}${r.t ? "–" + r.t : ""}`;
const projRec = r => { const g = r.games || r.w + r.l + r.t + (D.schedule[r.team] || []).length * (D.gamesPerWeek || 1),
  w = r.w + Math.ceil(Math.round(r.projW * 100) / 100 - 0.5 - (r.w + r.t / 2)); return `${w}–${Math.max(g - r.t - w, 0)}${r.t ? "–" + r.t : ""}`; };
const listeners = [];
const pick = t => {
  hi = t;
  try { localStorage.setItem(TEAM_KEY, t); } catch (e) {}
  try { const h = new URLSearchParams(location.hash.slice(1)); h.set("team", t); history.replaceState(null, "", "#" + h.toString()); } catch (e) {}
  listeners.forEach(fn => fn());
};
const selMe = document.getElementById("sel-me");
selMe.innerHTML = `<option value="" disabled>Pick your team</option>` + [...teams].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  .map(t => `<option value="${t}">${t}</option>`).join("");
const setMe = t => {
  me = t;
  try { localStorage.setItem(ME_KEY, t); } catch (e) {}
  pick(t);
};
selMe.addEventListener("change", () => setMe(selMe.value));
listeners.push(() => { selMe.value = me || ""; });

document.querySelectorAll(".season").forEach(e => e.textContent = D.season);
(() => {
  const hasTank = !!D.tank, hasTrade = !!(D.whatif && D.whatif.available);
  if (!hasTank && !hasTrade) return;
  document.getElementById("title-plain").hidden = true;
  document.getElementById("tabs").hidden = false;
  document.getElementById("tab-btn-tank").hidden = !hasTank;
  document.getElementById("tr-toggle").hidden = !hasTrade;
  const NAME = { contend: "contendathon", tank: "tankathon" };
  const HOME = { contend: "rosters-home", tank: "rosters-tank" };
  const ok = t => t === "contend" || (t === "tank" && hasTank);
  const show = tab => {
    if (!ok(tab)) tab = "contend";
    document.querySelectorAll(".tabs .tab").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
    for (const t of Object.keys(NAME)) document.getElementById("tab-" + t).hidden = t !== tab;
    const hl = document.getElementById("how-label");
    if (hl) hl.textContent = tab === "tank" ? "How Tankathon Works" : "How Contendathon Works";
    document.getElementById(HOME[tab]).after(document.getElementById("rosters-sec"));
    const recRace = D0.tank && (D0.tank.metric === "record" || D0.tank.metric === "bracket");
    document.getElementById(tab === "tank" && recRace ? "sched-tank" : "sched-home").after(document.getElementById("sched-sec"));
    window.dispatchEvent(new Event("rosters-tab"));
    try { localStorage.setItem(TAB_KEY, tab); } catch (e) {}
    const h = new URLSearchParams(location.hash.slice(1));
    h.set("tab", NAME[tab]);
    try { history.replaceState(null, "", "#" + h.toString()); } catch (e) {}
  };
  document.querySelectorAll(".tabs .tab").forEach(b => b.addEventListener("click", () => show(b.dataset.tab)));
  let start = D.league.defaultTab || "contend";
  try { start = localStorage.getItem(TAB_KEY) || start; } catch (e) {}
  try {
    const t = new URLSearchParams(location.hash.slice(1)).get("tab");
    if (t === "trade") { start = "contend"; window.tradeFromLink = true; }
    else if (t) start = Object.keys(NAME).find(k => NAME[k] === t) || "contend";
  } catch (e) {}
  window.__openTab = ok(start) ? start : "contend";
  setTimeout(() => show(start), 0);
  stuckWhenPast(document.getElementById("tabs"), document.getElementById("tabs-top"));
})();
document.getElementById("eyebrow").textContent = D.league.eyebrow;
document.getElementById("eyebrow").title = D.league.eyebrow;
(() => {
  const fallback = D0.historyFallback;
  if (!fallback || !Array.isArray(fallback.missing) || !fallback.missing.length) return;
  const weeks = [...new Set(fallback.missing.map(x => x.week))].sort((a, b) => a - b).join(", ");
  const el = document.getElementById("history-warning");
  el.textContent = `Provisional history: ${fallback.missing.length} missing Sleeper roster-week score(s) counted as 0 (weeks ${weeks}). Standings and draft odds may be inaccurate until verified.`;
  el.hidden = false;
})();
(() => {
  const U = D.updated;
  if (!U || !U.built) return;
  const dateOnly = v => /^\d{4}-\d{2}-\d{2}$/.test(v);
  const when = v => dateOnly(v)
    ? new Date(v + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : new Date(v).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const ago = v => {
    if (dateOnly(v)) return "";
    const m = Math.round((Date.now() - new Date(v)) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
  };
  const built = new Date(U.built);
  document.getElementById("updated-when").textContent = "Updated " + (built.toDateString() === new Date().toDateString()
    ? built.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : when(U.built));
  document.getElementById("info-updated").innerHTML =
    `Updates every day at <b>8am</b> and <b>8pm</b> Eastern. Last update: ${when(U.built)} (${ago(U.built)}).`;
  document.getElementById("updated").hidden = false;
})();
(() => {
  const WORKER = "https://league-scheduler.nntay92.workers.dev";
  const btn = document.getElementById("refresh"), note = document.getElementById("refresh-note");
  const built = D.updated && D.updated.built;
  if (!built || location.protocol !== "https:") return;
  const clock = v => new Date(v).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const newer = async () => {
    try {
      const html = await (await fetch(`${location.pathname}?v=${Date.now()}`, { cache: "no-store" })).text();
      const m = html.match(/"built": "([^"]+)"/);
      return !!m && new Date(m[1]) > new Date(built);
    } catch (e) { return false; }
  };
  const freshReload = async () => {
    try { sessionStorage.setItem("splash-next", "1"); } catch (e) {}
    document.documentElement.classList.add("splash-on");
    try { await fetch(location.pathname, { cache: "reload" }); } catch (e) {}
    location.reload();
  };
  window.freshReload = freshReload;
  const deployedLater = async () => {
    try {
      const r = await fetch(`${location.pathname.replace(/[^/]*$/, "")}built.txt?v=${Date.now()}`, { cache: "no-store" });
      const t = r.ok ? (await r.text()).trim() : "";
      return /^\d{4}-\d\d-\d\dT/.test(t) && new Date(t) > new Date(built);
    } catch (e) { return false; }
  };
  const checkNow = async () => {
    if (!(await deployedLater())) return;
    try {
      if (Date.now() - (+sessionStorage.getItem("fresh-reload") || 0) < 5 * 60e3) return;
      sessionStorage.setItem("fresh-reload", String(Date.now()));
    } catch (e) {}
    freshReload();
  };
  const key = (D.league && D.league.key) || "";
  const seen = key.startsWith("hub:")
    ? fetch(WORKER + "/seen", { method: "POST", headers: { "content-type": "application/json" },
                                body: JSON.stringify({ league: key, built }) }).then(r => r.json()).catch(() => ({}))
    : Promise.resolve({});
  const pausedScreen = () => {
    const el = document.getElementById("paused"), msg = el.querySelector("p");
    const tank = document.querySelector(".run-tank svg");
    if (tank) el.querySelector(".pz-tank").appendChild(tank.cloneNode(true));
    el.hidden = false;
    el.querySelector("button").addEventListener("click", () => { el.hidden = true; });
    const stop = Date.now() + 12 * 60e3;
    const poll = async () => {
      if (await newer()) { msg.textContent = "Updated. Loading it…"; freshReload(); return; }
      if (Date.now() < stop) setTimeout(poll, 20000);
      else msg.textContent = "Still updating. Check back in a few minutes.";
    };
    setTimeout(poll, 45000);
  };
  seen.then(r => { if (r && r.paused) pausedScreen(); else setTimeout(checkNow, 1500); });
  let hiddenAt = 0;
  const resume = checkNow;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 60e3) resume();
  });
  window.addEventListener("pageshow", e => { if (e.persisted) resume(); });
  const wait = (msg, since) => {
    btn.disabled = true; note.textContent = msg;
    const stop = Date.now() + 12 * 60e3;
    const poll = async () => {
      if (await newer()) { note.textContent = "New build is out. Reloading…"; freshReload(); return; }
      if (Date.now() < stop) setTimeout(poll, 20000);
      else { note.textContent = "Still building. Check back in a few minutes."; btn.disabled = false; }
    };
    setTimeout(poll, since ? 20000 : 60000);
  };
  window.awaitNewBuild = msg => wait(msg);
  const PW = "contendathon-refresh-password", form = document.getElementById("refresh-pass"), input = document.getElementById("refresh-pw");
  const stored = () => { try { return localStorage.getItem(PW) || ""; } catch (e) { return ""; } };
  const ask = msg => { form.hidden = false; btn.hidden = true; note.textContent = msg || ""; input.value = ""; input.focus(); };
  form.addEventListener("submit", e => {
    e.preventDefault();
    const pw = input.value.trim();
    if (!pw) return input.focus();
    form.hidden = true; btn.hidden = false; start(pw);
  });
  btn.addEventListener("click", () => { const pw = stored(); if (pw) start(pw); else ask(); });
  const start = async pw => {
    btn.disabled = true; note.textContent = "Starting…";
    try {
      const resp = await fetch(WORKER + "/refresh", { method: "POST", headers: { "content-type": "application/json" },
                                                       body: JSON.stringify({ league: D.league.key || "", password: pw }) });
      const r = await resp.json().catch(() => ({}));
      if (resp.status === 401 && r.password) {
        try { localStorage.removeItem(PW); } catch (e) {}
        btn.disabled = false; return ask("Wrong password.");
      }
      try { localStorage.setItem(PW, pw); } catch (e) {}
      if (resp.ok) return wait("Building, about 2 min. This page reloads itself.");
      if (resp.status === 429 && r.last_build && new Date(r.last_build) > new Date(built))
        return wait(`A build started at ${clock(r.last_build)}. This page reloads when it's out.`, true);
      if (resp.status === 429) {
        note.textContent = `Built recently. Next refresh after ${clock(r.next_at)}.`;
        setTimeout(() => { btn.disabled = false; note.textContent = ""; }, Math.max(0, new Date(r.next_at) - Date.now()));
        return;
      }
      note.textContent = r.error || "Couldn't start a build.";
    } catch (e) { note.textContent = "Couldn't reach the build service."; }
    btn.disabled = false;
  };
  const admin = () => { try { return !!(stored() || localStorage.getItem("contendathon-mn")); } catch (e) { return false; } };
  btn.hidden = !admin();
  let taps = 0, last = 0;
  document.getElementById("updated-when").addEventListener("click", () => {
    const now = Date.now(); taps = now - last < 600 ? taps + 1 : 1; last = now;
    if (taps >= 5) { taps = 0; if (admin()) btn.hidden = false; else ask(); }
  });
})();
(() => { const b = document.getElementById("how-btn"), body = document.getElementById("how-body"), c = body.querySelector("canvas");
  if (!b) return;
  let stop = null, loading = null;
  const load = () => loading || (loading = window.howExplainer ? Promise.resolve() : new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "/how/explainer.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
  b.addEventListener("click", () => { const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); body.hidden = !open;
    if (!open) { if (stop) { stop(); stop = null; } return; }
    load().then(() => { if (b.getAttribute("aria-expanded") === "true" && !stop) stop = window.howExplainer(c); })
      .catch(() => { loading = null; }); }); })();
window.bugContext = () => {
  const pane = document.querySelector(".tabpane:not([hidden])"), tr = document.getElementById("tr-toggle");
  let team = ""; try { team = localStorage.getItem(`contendathon-${D0.league.id}-me`) || ""; } catch (e) {}
  return { page: "league", league: D0.league.key || "", name: D0.league.name || "", built: (D0.updated || {}).built || "", team, user: who(),
           tab: (pane ? pane.id.replace("tab-", "") : "") + (tr && tr.getAttribute("aria-checked") === "true" ? " + trade" : "") };
};
(() => {
  let loading = null;
  const load = () => loading || (loading = window.openBugReport ? Promise.resolve() : new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "/bug.js"; s.onload = res; s.onerror = () => { loading = null; rej(); }; document.head.appendChild(s); }));
  document.addEventListener("click", e => { if (e.target.closest("[data-bug]")) load().then(() => window.openBugReport()).catch(() => {}); });
})();
const WHATS_NEW = [
  { date: "2026-10-21", only: "injuryRisk", label: "Model Update - Injuries", text: "Every simulated game has a small chance a player gets hurt. Injury chances and weeks missed are based on historical data. Lineups are adjusted in each sim week for injuries, so this is more of a roster depth check. Your odds may have shifted slightly as a result." },
  { date: "2026-10-19", label: "New Section - Matchups", text: "Flip your games to win or lose and see how your odds change." },
];
(() => {
  const btn = document.getElementById("whatsnew"), pop = document.getElementById("wn-pop");
  if (!btn || !pop) return;
  const items = WHATS_NEW.filter(n => !n.only || D0[n.only]);
  if (!items.length) { btn.hidden = true; return; }
  const KEY = "contendathon-whatsnew", newest = items[0].date;
  const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  pop.innerHTML = `<h3>What's New</h3><ul>${items.map(n => `<li><b>${fmt(n.date)}</b>${n.label ? `<strong>${n.label}:</strong> ` : ""}${n.text}</li>`).join("")}</ul>`;
  const dot = btn.querySelector(".wn-dot");
  try { dot.hidden = (localStorage.getItem(KEY) || "") >= newest; } catch (e) { dot.hidden = false; }
  const show = on => {
    pop.hidden = !on; btn.setAttribute("aria-expanded", String(on));
    if (on) { dot.hidden = true; try { localStorage.setItem(KEY, newest); } catch (e) {} }
  };
  btn.addEventListener("click", e => { e.stopPropagation(); show(pop.hidden); });
  document.addEventListener("click", e => { if (!pop.hidden && !pop.contains(e.target)) show(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) show(false); });
})();
(() => {
  const WORKER = "https://league-scheduler.nntay92.workers.dev";
  const btn = document.getElementById("inbox"), pop = document.getElementById("inbox-pop");
  if (!btn || !pop || location.protocol !== "https:") return;
  let device = "", user = "";
  try { device = localStorage.getItem("contendathon-device") || ""; user = localStorage.getItem("contendathon-who") || ""; } catch (e) {}
  if (!device && !user) return;
  const fmt = d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  fetch(`${WORKER}/msg?device=${encodeURIComponent(device)}&user=${encodeURIComponent(user)}`).then(r => r.json()).then(({ messages = [] }) => {
    if (!messages.length) return;
    const dot = btn.querySelector(".wn-dot");
    let unread = messages.filter(m => !m.read).map(m => m.id);
    pop.innerHTML = `<h3>Messages</h3><ul>${messages.map(m => `<li><b>${fmt(m.at)} · from Contendathon</b>${esc(m.text)}</li>`).join("")}</ul>`;
    btn.hidden = false; dot.hidden = !unread.length;
    const show = on => {
      pop.hidden = !on; btn.setAttribute("aria-expanded", String(on));
      if (on && unread.length) {
        dot.hidden = true;
        fetch(`${WORKER}/msg/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: unread, device, user }) }).catch(() => {});
        unread = [];
      }
    };
    btn.addEventListener("click", e => { e.stopPropagation(); show(pop.hidden); });
    document.addEventListener("click", e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) show(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) show(false); });
  }).catch(() => {});
})();
(() => {
  const sheet = document.getElementById("cf-sheet"), btn = document.getElementById("coffee");
  if (btn && sheet) {
    btn.addEventListener("click", () => { sheet.hidden = false; });
    const bar = document.getElementById("coffee-bar");
    if (bar) bar.addEventListener("click", () => { sheet.hidden = false; });
    sheet.addEventListener("click", e => { if (e.target.closest("[data-close]")) sheet.hidden = true; });
    addEventListener("keydown", e => { if (e.key === "Escape") sheet.hidden = true; });
  }
  const mark = () => document.documentElement.classList.toggle("scrolled", (pageY() || 0) > 4);
  pageScroller.addEventListener("scroll", mark, { passive: true }); mark();
})();
(() => {
  const btn = document.getElementById("share"), note = document.getElementById("refresh-note");
  if (location.protocol === "file:") return;
  const link = () => {
    const tank = (document.querySelector(".tabs .tab[aria-selected=true]") || {}).dataset?.tab === "tank";
    return `https://contendathon.com/?league=${D.league.id}` + (tank ? "&tab=tankathon" : "");
  };
  let clear;
  const say = msg => { note.textContent = msg; clearTimeout(clear); clear = setTimeout(() => { if (note.textContent === msg) note.textContent = ""; }, 4000); };
  btn.addEventListener("click", async () => {
    const url = link(), title = D.league.eyebrow || document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch (e) {}
      return;
    }
    try { await navigator.clipboard.writeText(url); say("Link copied."); }
    catch (e) { note.textContent = url; }
  });
  btn.hidden = false;
})();
(() => {
  const L = D.league, div = L.divisions.length;
  const seeds = div ? `The ${div} division winners${L.divisions.every(d => !/^Division \d+$/.test(d)) ? ` (${L.divisions.join(", ")})` : ""} take seeds 1${div > 2 ? "–" + div : " and 2"}; everyone else is seeded by record, then total points.`
                    : "Seeds go by record, then total points.";
  const po = !L.playoffs ? " No playoffs: the title goes to the regular-season leader."
    : ` The top ${D.playoffTeams} make the playoffs` + (D.byeTeams ? ` and the top ${D.byeTeams} get byes` : "") +
      (L.reseed ? "; the bracket is reseeded each round (best seed left plays the worst)." : ".");
  const med = L.median ? " Records include the weekly game against the league median (the top half of scores win it)." : "";
  document.querySelectorAll(".seed-rule").forEach(e => e.textContent = (med + " " + seeds + po).trim());
  document.querySelectorAll(".median-rule").forEach(e => e.textContent = L.median ? "; each week counts twice: the head-to-head game and the game against the league median" : "");
  if (L.bestBall) document.querySelectorAll(".bb-note").forEach(e => e.hidden = false);
})();
document.querySelectorAll(".lastweek").forEach(e => e.textContent = D.lastWeek);
document.querySelectorAll(".pteams").forEach(e => e.textContent = D.playoffTeams);
document.querySelectorAll(".byes").forEach(e => e.textContent = D.byeTeams);
document.querySelectorAll(".h-sofar").forEach(e => { e.textContent = "Act."; e.title = D.lastActual ? `Points scored, weeks 1–${D.lastActual}` : "Points scored"; });
document.querySelectorAll(".h-restwk").forEach(e => e.innerHTML = `Proj.<br>Wks ${D.lastActual + 1}–⁠${D.lastWeek}`);
function placeChartTip(tip, r, px) {
  const host = (tip.offsetParent || document.body).getBoundingClientRect(), vw = document.documentElement.clientWidth;
  const w = tip.offsetWidth, ax = r.left + px, pad = 8;
  const left = ax + 16 + w <= vw - pad ? ax + 16 : ax - 16 - w >= pad ? ax - 16 - w : Math.max(pad, vw - pad - w);
  tip.style.left = (left - host.left) + "px";
}

const TRADE_COLORS = ["#ffab0e", "#ff80ad", "#8c64ff", "#28e757", "#ff8075", "#49e8cc", "#f0f2f6"];
function lineChart(boxId, tipId, keyId, get, what, lowFirst, liveWeek) {
  const W = PHONE ? phoneW() : 1040, H = PHONE ? 300 : 520, M = PHONE ? { t: 16, r: 12, b: 36, l: 40 } : { t: 16, r: 172, b: 40, l: 52 };
  const x = w => M.l + (w - 1) / (D.lastWeek - 1) * (W - M.l - M.r);
  let yTop = 1;
  const y = v => H - M.b - v / yTop * (H - M.t - M.b);
  const box = document.getElementById(boxId), tip = document.getElementById(tipId), key = document.getElementById(keyId);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `Cumulative ${what} by team, actual then projected, through week ` + D.lastWeek });
  box.prepend(svg);
  const ax = el("g", { class: "axis" }, svg), today = el("g", {}, svg);
  const lines = el("g", {}, svg), labels = el("g", {}, svg);
  const cross = el("line", { y1: M.t, y2: H - M.b, stroke: "var(--text-muted)", "stroke-width": 1, visibility: "hidden" }, svg);
  const dots = el("g", {}, svg);
  const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[2]).toFixed(1)}`).join("");
  let series = {}, extra = [];

  function axes() {
    const maxY = Math.max(...teams.map(t => series[t].at(-1)[2]), ...extra.map(e => e.series.at(-1)[2]));
    const top = Math.ceil(maxY / 250) * 250;
    if (top === yTop && ax.childNodes.length) return;
    yTop = top;
    ax.replaceChildren(); today.replaceChildren();
    const step = yTop > 2000 ? 500 : 250;
    for (let v = 0; v <= yTop; v += step) {
      el("line", { x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), stroke: "var(--grid)", "stroke-width": 1 }, ax);
      el("text", { x: M.l - 8, y: y(v) + 4, "text-anchor": "end" }, ax).textContent = v.toLocaleString();
    }
    for (let w = 1; w <= D.lastWeek; w++) if (!PHONE || w % 2 === 1 || w === D.lastWeek) el("text", { x: x(w), y: H - M.b + 18, "text-anchor": "middle" }, ax).textContent = w;
    el("text", { x: (M.l + W - M.r) / 2, y: H - 4, "text-anchor": "middle" }, ax).textContent = "Week";
    el("line", { x1: x(D.lastActual), x2: x(D.lastActual), y1: M.t, y2: H - M.b, stroke: "var(--amber)", "stroke-width": 1.5 }, today);
    el("text", { x: x(D.lastActual) + 6, y: M.t + 10, fill: "var(--amber)", "font-size": 11, "font-weight": 600 }, today).textContent = "Today";
  }
  function draw() {
    ({ series, extra } = get());
    axes();
    lines.replaceChildren(); labels.replaceChildren();
    const solidTo = liveWeek ? liveWeek - 1 : D.lastActual;
    const drawLine = (s, stroke, sw, cls, onClick, futureOnly) => {
      const g = el("g", { style: "cursor:pointer", class: cls }, lines);
      g.addEventListener("click", onClick);
      if (!futureOnly) {
        el("path", { d: path(s.filter(p => p[0] <= solidTo)), fill: "none", stroke, "stroke-width": sw, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
        if (liveWeek) el("path", { d: path(s.filter(p => p[0] >= solidTo && p[0] <= liveWeek)), fill: "none", stroke, "stroke-width": sw, "stroke-dasharray": "1.5 4", "stroke-linecap": "round" }, g);
      }
      el("path", { d: path(s.filter(p => p[0] >= D.lastActual)), fill: "none", stroke, "stroke-width": sw, "stroke-dasharray": "5 4", "stroke-linecap": "round" }, g);
      el("path", { d: path(futureOnly ? s.filter(p => p[0] >= D.lastActual) : s), fill: "none", stroke: "transparent", "stroke-width": 12 }, g);
    };
    for (const t of [...teams.filter(t => t !== hi), hi]) {
      const on = t === hi;
      drawLine(series[t], on ? "var(--accent)" : "var(--context)", on ? 2.5 : 2, on ? "hl-line" : "", () => pick(t), false);
    }
    for (const e of extra) drawLine(e.series, e.color, 2.5, "", () => pick(e.team), true);
    key.querySelectorAll(".tk").forEach(n => n.remove());
    for (const e of extra) {
      const sp = document.createElement("span");
      sp.className = "tk";
      sp.innerHTML = `<svg width="26" height="2"><line x1="0" y1="1" x2="26" y2="1" stroke="${e.color}" stroke-width="2.5" stroke-dasharray="5 4"/></svg><b style="color:${e.color}">${e.team}-trade</b>`;
      key.appendChild(sp);
    }
    const ends = [...teams.map(t => ({ t, v: series[t].at(-1)[2], color: null })), ...extra.map(e => ({ t: e.team, v: e.series.at(-1)[2], color: e.color }))];
    if (PHONE) {
      for (const e of ends.filter(e => e.color || (e.t === hi && !extra.some(x => x.team === hi))))
        el("text", { x: x(D.lastWeek) - 4, y: y(e.v) - 8, "text-anchor": "end", class: "lbl on", style: e.color ? `fill:${e.color}` : "" }, labels).textContent = Math.round(e.v).toLocaleString();
      return;
    }
    ends.forEach(e => { e.yy = y(e.v); });
    ends.sort((a, b) => a.yy - b.yy);
    for (let i = 1; i < ends.length; i++) ends[i].yy = Math.max(ends[i].yy, ends[i - 1].yy + 15);
    const over = ends.at(-1).yy - (H - M.b);
    if (over > 0) ends.forEach(e => e.yy -= over);
    for (let i = ends.length - 2; i >= 0; i--) ends[i].yy = Math.min(ends[i].yy, ends[i + 1].yy - 15);
    for (const e of ends) {
      const on = e.t === hi && !e.color;
      const stroke = e.color || (on ? "var(--accent)" : "var(--context)");
      el("line", { x1: x(D.lastWeek) + 3, x2: x(D.lastWeek) + 10, y1: y(e.v), y2: e.yy, stroke, "stroke-width": 1 }, labels);
      const tx = el("text", { x: x(D.lastWeek) + 14, y: e.yy + 4, class: "lbl" + (on ? " on" : ""), style: e.color ? `fill:${e.color};font-weight:700` : "" }, labels);
      tx.textContent = `${short(e.t, e.color ? 13 : 15)}${e.color ? "-trade" : ""} ${Math.round(e.v).toLocaleString()}`;
      if (short(e.t, e.color ? 13 : 15) !== e.t) el("title", {}, tx).textContent = e.t + (e.color ? "-trade" : "");
      tx.addEventListener("click", () => pick(e.t));
    }
  }
  listeners.push(draw);

  const hide = () => { tip.style.display = "none"; cross.setAttribute("visibility", "hidden"); dots.replaceChildren(); };
  svg.addEventListener("pointermove", ev => {
    const r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) * W / r.width;
    if (sx < M.l - 10 || sx > W - M.r + 10) return hide();
    const w = Math.min(D.lastWeek, Math.max(1, Math.round((sx - M.l) / (W - M.l - M.r) * (D.lastWeek - 1) + 1)));
    cross.setAttribute("x1", x(w)); cross.setAttribute("x2", x(w)); cross.setAttribute("visibility", "visible");
    dots.replaceChildren();
    const rows = [...teams.map(t => ({ t, p: series[t][w - 1], color: null })),
                  ...(w >= D.lastActual ? extra.map(e => ({ t: e.team, p: e.series[w - 1], color: e.color })) : [])]
      .sort((a, b) => lowFirst ? a.p[2] - b.p[2] : b.p[2] - a.p[2]);
    for (const o of rows) el("circle", { cx: x(w), cy: y(o.p[2]), r: o.t === hi || o.color ? 5 : 4, fill: o.color || (o.t === hi ? "var(--accent)" : "var(--context)"), stroke: "var(--surface-1)", "stroke-width": 2 }, dots);
    const live = w === liveWeek;
    tip.innerHTML = `<div class="h">Week ${w} · ${live ? "in progress" : w <= D.lastActual ? "actual" : "projected"} · total (that week${live ? ": so far → projected" : ""})</div>` +
      rows.map((o, i) => `<div class="r${o.t === hi && !o.color ? " on" : ""}"${o.color ? ` style="color:${o.color}"` : ""}><span>${i + 1}. ${o.t}${o.color ? "-trade" : ""}</span><span>${f1(o.p[2])} (${live && o.p[3] != null ? `${f1(o.p[3])} → ` : ""}${f1(o.p[1])})</span></div>`).join("");
    tip.style.display = "block";
    const px = x(w) / W * r.width;
    placeChartTip(tip, r, px);
    tip.style.top = "12px";
  });
  svg.addEventListener("pointerleave", hide);
}
const tradeExtra = (base, cur) => D === D0 ? [] : (window.tradeTeams ? window.tradeTeams() : [])
  .map((t, i) => ({ team: t, color: TRADE_COLORS[i % TRADE_COLORS.length], series: cur[t] })).filter(e => e.series);
lineChart("line", "linetip", "line-key", () => ({ series: D0.series, extra: tradeExtra(D0.series, D.series) }), "points scored", false, D.liveWeek);
const RACE = {
  max_pf: { title: "Proj. Max PF", unit: "max PF", final: "Projected Final Max PF", teamCol: "Max PF over Repl.", teamTip: "<b>Max PF over Repl.</b> (over replacement): what your team's max PF loses without him: his points minus the points of whoever fills his spot. Small when your bench is deep.", tile: "Projected Max PF", worst: "Lowest projected max PF",
            worstIn: "lowest", chartTip: "Max PF = the best lineup a team could have started. Solid = so far, dashed = projected. The lowest line leads the race for 1.01.",
            tableTip: "Lowest projected max PF first.", soFar: n => `Max PF, weeks 1–${n} (the weeks that are over)`,
            wk: w => `Week ${w}'s projected max PF: points already scored, plus for a game still going his points so far + his projection times the share of the game left, and projections for games not started (simulated average)` },
  pf: { title: "Proj. Points Scored", unit: "points", final: "Projected Final Points Scored", teamCol: "Pts over Repl.", tile: "Projected Points", worst: "Fewest projected points",
        worstIn: "fewest", chartTip: "Points each team's starting lineup scored. Solid = so far, dashed = projected. The lowest line leads the race for 1.01.",
        tableTip: "Fewest projected points first.", soFar: n => `Points scored, weeks 1–${n} (the weeks that are over)`,
        wk: w => `Week ${w}'s projected points: points already scored, plus projections for the rest of the lineup (simulated average)` },
  record: { title: "Proj. Wins", unit: "wins", final: "Projected Final Record", teamCol: "Wins Added",
            teamTip: "<b>Wins Added</b>: Wins this player is projected to add to your team. Affected by depth of replacement players.", tile: "Projected Record", worst: "Worst projected record",
            worstIn: "worst", sfx: " wins", chartTip: "Dot = projected wins, line = 80% of simulated seasons (a median game counts as a game). The furthest-left dot leads the race for 1.01. Points Scored: each starting lineup's points.",
            tableTip: "Projected record, fewest wins first; a tie goes to fewer points scored. Act. = the record so far; the week column = the projected result of that week's game.", soFar: n => `Record, weeks 1–${n} (the weeks that are over)`,
            wk: w => `Week ${w}'s projected wins (simulated average; a median game counts)` } };
const NPB_KIND = D0.tank && D0.tank.npBracket ? D0.tank.npBracket.kind : null;
const NPB_NAME = NPB_KIND === "toilet_bowl" ? "toilet bowl" : "consolation bracket";
RACE.bracket = { ...RACE.record,
  chartTip: `Dot = projected wins, line = 80% of simulated seasons. The record decides who plays in the ${NPB_NAME} and the seeds; the ${NPB_NAME} decides 1.01. Points Scored: each starting lineup's points.`,
  tableTip: `Projected record, fewest wins first; a tie goes to fewer points scored. It sets the ${NPB_NAME} seeds; 1.01–1.03 come from the ${NPB_NAME}. Act. = the record so far; the week column = the projected result of that week's game.` };
const REC_LIKE = k => k === "record" || k === "bracket";
const RACE_K = D0.tank && RACE[D0.tank.metric] ? D0.tank.metric : "max_pf", RW = RACE[RACE_K];
if (D.tank) {
  const tab = document.getElementById("tab-tank"), t1 = tab.querySelector(".odds-title"), t2 = tab.querySelector(".tt-title");
  t1.dataset.off = t1.textContent = RW.title; t2.dataset.off = t2.textContent = RW.final;
  document.querySelector("#info-t1 .odds-off").textContent = RW.chartTip;
  if (RW.teamTip) { const t5 = document.getElementById("info-t5"); t5.innerHTML = t5.innerHTML.replace(/<b>Pts over Repl\.<\/b>[^<]*/, RW.teamTip); }
  document.querySelector("#info-t2 .tt-off").innerHTML = `${RW.tableTip} <b>1.01–1.03</b>: the chance a team's own pick lands there. Playoff results can shift the order.`;
}
if (D.tank && REC_LIKE(RACE_K)) {
  if (RACE_K === "bracket") {
    const tiles = document.getElementById("tank-tiles");
    tiles.after(document.getElementById("npb-h"), document.getElementById("npb-card"));
  }
  lineChart("tank-line", "tank-linetip", "tank-line-key", () => ({ series: D0.series, extra: tradeExtra(D0.series, D.series) }), "points", false, D0.liveWeek);
  winsBars();
} else if (D.tank) {
  lineChart("tank-line", "tank-linetip", "tank-line-key", () => ({ series: D0.tank.series, extra: tradeExtra(D0.tank.series, D.tank.series) }), RW.unit, true, D.tank.liveWeek);
  raceWins();
}
function raceWins() {
  if (D0.standings[0].projWlo == null) return;
  const box = document.getElementById("tank-bars"), tip = document.getElementById("tank-barstip"), seg = document.getElementById("race-seg");
  const t1 = document.querySelector("#tab-tank .odds-title"), line = document.getElementById("tank-line"), key = document.getElementById("tank-line-key");
  const KEY = `contendathon-${D0.league.id}-t-race`, ptsBtn = seg.querySelector('button[data-v="pf"]');
  ptsBtn.textContent = RACE_K === "max_pf" ? "Max PF" : "Points Scored";
  seg.querySelector(".seg").prepend(ptsBtn);
  const W0 = Object.fromEntries(D0.standings.map(r => [r.team, r.projW]));
  const draw = rangeDots(box, tip, () => [...D.standings].sort((a, b) => a.projW - b.projW || a.final - b.final)
    .map(r => ({ team: r.team, final: r.projW, lo: r.projWlo, hi: r.projWhi, rec: projRec(r), wl: rec(r),
                 games: r.games || r.w + r.l + r.t + (D.schedule[r.team] || []).length * (D.gamesPerWeek || 1) })), t => W0[t], -1);
  const set = v => {
    const wins = v === "wins";
    seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === (wins ? "wins" : "pf"))));
    box.hidden = !wins; line.hidden = key.hidden = wins;
    t1.dataset.off = wins ? "Proj. Wins" : RW.title;
    if (!document.body.classList.contains("odds-time")) t1.textContent = t1.dataset.off;
    if (wins) draw();
  };
  seg.hidden = false;
  let v = "pf";
  try { v = localStorage.getItem(KEY) || v; } catch (e) {}
  set(v);
  seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    try { localStorage.setItem(KEY, b.dataset.v); } catch (e) {}
    set(b.dataset.v);
  });
  onData.push(() => { if (!box.hidden) draw(); }); listeners.push(() => { if (!box.hidden) draw(); });
}
function winsBars() {
  const box = document.getElementById("tank-bars"), tip = document.getElementById("tank-barstip"), seg = document.getElementById("race-seg");
  const t1 = document.querySelector("#tab-tank .odds-title"), line = document.getElementById("tank-line"), key = document.getElementById("tank-line-key");
  seg.hidden = false; box.hidden = false; line.hidden = key.hidden = true;
  const T0W = Object.fromEntries(D0.tank.standings.map(r => [r.team, r.final]));
  const draw = rangeDots(box, tip, () => D.tank.standings.map(r => ({ ...r, games: r.rec.split(/[-–]/).reduce((a, b) => a + +b, 0) })), t => T0W[t], -1);
  seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const wins = b.dataset.v === "wins";
    box.hidden = !wins; line.hidden = key.hidden = wins;
    t1.dataset.off = wins ? RW.title : "Proj. Points Scored";
    if (!document.body.classList.contains("odds-time")) t1.textContent = t1.dataset.off;
    if (wins) draw();
  });
  onData.push(draw); listeners.push(draw);
}
function rangeDots(box, tip, rowsOf, before = null, good = 1) {
  return () => {
    const rows = rowsOf(), games = Math.max(...rows.map(r => r.games)), TR = D !== D0 && before;
    const rowH = PHONE ? 26 : 32, W = PHONE ? phoneW() : 1040, M = PHONE ? { t: 6, r: TR ? 88 : 52, b: 30, l: 104 } : { t: 6, r: TR ? 140 : 90, b: 30, l: 150 };
    const H = M.t + M.b + rows.length * rowH, x = v => M.l + v / games * (W - M.l - M.r);
    const old = box.querySelector("svg"); if (old) old.remove();
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Projected wins by team, with the 80% range" });
    box.prepend(svg);
    const ax = el("g", { class: "axis" }, svg), step = games > 10 ? 2 : 1;
    for (let v = 0; v <= games; v += step) {
      el("line", { x1: x(v), x2: x(v), y1: M.t, y2: H - M.b, stroke: v ? "var(--grid)" : "var(--text-muted)", "stroke-width": 1 }, ax);
      el("text", { x: x(v), y: H - M.b + 18, "text-anchor": "middle" }, ax).textContent = v;
    }
    rows.forEach((r, i) => {
      const on = r.team === hi, cy = M.t + i * rowH + rowH / 2, grp = el("g", { class: "bar" }, svg);
      grp.addEventListener("click", () => pick(r.team));
      el("rect", { x: 0, y: cy - rowH / 2, width: W, height: rowH, fill: "transparent" }, grp);
      svgName(el("text", { x: M.l - 10, y: cy + 4, "text-anchor": "end", class: "lbl" + (on ? " on" : "") }, grp), r.team, PHONE ? 12 : 16);
      const col = on ? "var(--accent)" : "var(--text-secondary)";
      el("line", { x1: x(r.lo), x2: x(r.hi), y1: cy, y2: cy, stroke: on ? "var(--accent)" : "var(--context)", "stroke-width": 6, "stroke-linecap": "round", opacity: on ? 0.55 : 0.9 }, grp);
      const b0 = TR ? before(r.team) : null, dv = b0 == null ? 0 : Number((r.final - b0).toFixed(1));
      if (dv) el("circle", { cx: x(b0), cy, r: on ? 6 : 5, fill: "none", stroke: "var(--text-secondary)", "stroke-width": 1.5, "stroke-dasharray": "2 2" }, grp);
      el("circle", { cx: x(r.final), cy, r: on ? 6.5 : 5.5, fill: col, stroke: "var(--surface)", "stroke-width": 2 }, grp);
      const lbl = el("text", { x: Math.max(x(r.hi), x(r.final), dv ? x(b0) + 6 : 0) + 10, y: cy + 4, class: "lbl" + (on ? " on" : "") }, grp);
      el("tspan", {}, lbl).textContent = r.rec;
      if (dv) el("tspan", { dx: 4, class: "chg-t " + ((dv > 0) === (good > 0) ? "good" : "bad") }, lbl).textContent = `(${dv > 0 ? "+" : "−"}${Math.abs(dv).toFixed(1)})`;
      grp.addEventListener("pointermove", ev => {
        const b = svg.getBoundingClientRect();
        tip.innerHTML = `<b>${r.team}</b><br>Projected ${r.rec} (${r.final.toFixed(1)} wins)` + (dv ? `<br>Before the moves: ${b0.toFixed(1)} wins` : "") + `<br>80% of seasons: ${+r.lo}–${+r.hi} wins<br>So far ${r.wl}`;
        tip.style.display = "block";
        tip.style.left = Math.min(ev.clientX - b.left + 14, b.width - tip.offsetWidth - 4) + "px";
        tip.style.top = (ev.clientY - b.top + 14) + "px";
      });
      grp.addEventListener("pointerleave", () => { tip.style.display = "none"; });
    });
  };
}
(() => {
  const box = document.getElementById("c-bars"), tip = document.getElementById("c-barstip");
  const draw = rangeDots(box, tip, () => [...D.standings].sort((a, b) => b.projW - a.projW || b.final - a.final)
    .map(r => ({ team: r.team, final: r.projW, lo: r.projWlo, hi: r.projWhi, rec: projRec(r), wl: rec(r),
                 games: r.games || r.w + r.l + r.t + (D.schedule[r.team] || []).length * (D.gamesPerWeek || 1) })),
    t => (D0.standings.find(r => r.team === t) || {}).projW);
  window.drawProjWins = draw;
  onData.push(() => { if (!box.hidden) draw(); }); listeners.push(() => { if (!box.hidden) draw(); });
})();

function smoothPath(xy) {
  if (xy.length < 3) return xy.map((q, k) => `${k ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("");
  const n = xy.length, h = [], s = [], m = [];
  for (let i = 0; i < n - 1; i++) { h[i] = xy[i + 1][0] - xy[i][0]; s[i] = (xy[i + 1][1] - xy[i][1]) / h[i]; }
  m[0] = s[0]; m[n - 1] = s[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = s[i - 1] * s[i] <= 0 ? 0 : 3 * (h[i - 1] + h[i]) / ((2 * h[i] + h[i - 1]) / s[i - 1] + (h[i] + 2 * h[i - 1]) / s[i]);
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = xy[i], [x1, y1] = xy[i + 1], c = h[i] / 3;
    d += `C${(x0 + c).toFixed(1)},${(y0 + m[i] * c).toFixed(1)} ${(x1 - c).toFixed(1)},${(y1 - m[i + 1] * c).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}
const OOT_WAIT = `<div class="oot-wait"><svg class="oot-tank" viewBox="16 -4 230 156" aria-hidden="true"><g transform="rotate(-28 108 68)"><rect x="104" y="62" width="80" height="12" rx="6" fill="#1c2546" stroke="var(--cyan)" stroke-width="6"/><rect x="180" y="58" width="12" height="20" rx="4" fill="#1c2546" stroke="var(--cyan)" stroke-width="6"/><g fill="#c6cde6" opacity=".6"><circle cx="207" cy="58" r="7"/><circle cx="216" cy="49" r="5.2"/><circle cx="204" cy="46" r="4"/></g></g><rect x="22" y="96" width="156" height="46" rx="23" fill="#1c2546" stroke="var(--cyan)" stroke-width="6"/><g fill="var(--amber)"><circle cx="50" cy="119" r="8.5"/><circle cx="80" cy="119" r="8.5"/><circle cx="110" cy="119" r="8.5"/><circle cx="140" cy="119" r="8.5"/></g><path d="M46 90a40 38 0 0 1 80 0z" fill="#1c2546" stroke="var(--cyan)" stroke-width="6"/><rect x="40" y="88" width="92" height="10" rx="5" fill="#1c2546" stroke="var(--cyan)" stroke-width="6"/><circle cx="73" cy="68" r="7" fill="var(--cyan-text)"/><circle cx="99" cy="68" r="7" fill="var(--cyan-text)"/><circle cx="75.5" cy="65.5" r="2.4" fill="#fff"/><circle cx="101.5" cy="65.5" r="2.4" fill="#fff"/><circle cx="63" cy="79" r="5" fill="#ff80ad" opacity=".8"/><circle cx="109" cy="79" r="5" fill="#ff80ad" opacity=".8"/><path d="M80 78q6 6 12 0" stroke="var(--cyan-text)" stroke-width="3.6" fill="none" stroke-linecap="round"/></svg><b>Check back tomorrow for odds as of each week!</b>
  <small>I am just a one-man operation, and batching these overnight saves on compute costs.</small></div>`;
function oddsChart(boxId, tipId, field, what) {
  const P = ((D0.oddsHistory || {}).points || []).filter(p => Object.values(p.teams).some(v => v[field] != null));
  const box = document.getElementById(boxId), tip = document.getElementById(tipId);
  if (P.length < 2) {
    if ((D0.currentWeek || 1) >= 2) { box.insertAdjacentHTML("afterbegin", OOT_WAIT); box.firstElementChild.style.aspectRatio = PHONE ? `${phoneW()} / 300` : "1040 / 520"; return; }
    box.insertAdjacentHTML("afterbegin", `<p class="muted" style="margin:8px 4px">Odds Over Time starts once a week's games are over.</p>`); return;
  }
  const W = PHONE ? phoneW() : 1040, H = PHONE ? 300 : 520, M = PHONE ? { t: 16, r: 12, b: 36, l: 40 } : { t: 16, r: 172, b: 40, l: 52 };
  const n = P.length, x = i => M.l + i / (n - 1) * (W - M.l - M.r);
  const val = (p, t) => (p.teams[t] || {})[field];
  const maxV = Math.max(...P.flatMap(p => teams.map(t => val(p, t) || 0)));
  const top = Math.min(1, Math.max(0.1, Math.ceil(maxV * 10 + 0.0001) / 10));
  const y = v => H - M.b - v / top * (H - M.t - M.b);
  const pct = v => v == null ? "—" : v >= 0.995 && v < 1 ? ">99%" : v > 0 && v < 0.005 ? "<1%" : Math.round(v * 100) + "%";
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${what} by team, going into each week played, then today` });
  box.prepend(svg);
  const gid = boxId + "-fill", defs = el("defs", {}, svg), grad = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: "0%", style: "stop-color:var(--accent);stop-opacity:.30" }, grad);
  el("stop", { offset: "100%", style: "stop-color:var(--accent);stop-opacity:.02" }, grad);
  const ax = el("g", { class: "axis" }, svg), area = el("g", {}, svg), lines = el("g", {}, svg), labels = el("g", {}, svg);
  const cross = el("line", { y1: M.t, y2: H - M.b, stroke: "var(--text-muted)", "stroke-width": 1, visibility: "hidden" }, svg);
  const dots = el("g", {}, svg);
  const step = top > 0.5 ? 0.2 : top > 0.2 ? 0.1 : 0.05;
  for (let v = 0; v <= top + 1e-9; v += step) {
    el("line", { x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), stroke: "var(--grid)", "stroke-width": 1 }, ax);
    el("text", { x: M.l - 8, y: y(v) + 4, "text-anchor": "end" }, ax).textContent = Math.round(v * 100) + "%";
  }
  P.forEach((p, i) => {
    if (PHONE && i % 2 && i !== n - 1) return;
    const t = el("text", { x: x(i), y: H - M.b + 18, "text-anchor": "middle" }, ax);
    if (p.live) t.setAttribute("fill", "var(--amber)");
    t.textContent = PHONE ? (p.live ? "Now" : p.week) : p.label;
  });
  el("text", { x: (M.l + W - M.r) / 2, y: H - 4, "text-anchor": "middle" }, ax).textContent = "Going into week";
  function draw() {
    lines.replaceChildren(); labels.replaceChildren(); area.replaceChildren();
    const hp = P.map((p, i) => [i, val(p, hi)]).filter(q => q[1] != null);
    if (hp.length > 1)
      el("path", { d: smoothPath(hp.map(q => [x(q[0]), y(q[1])])) +
                      `L${x(hp.at(-1)[0]).toFixed(1)},${y(0).toFixed(1)}L${x(hp[0][0]).toFixed(1)},${y(0).toFixed(1)}Z`,
                   fill: `url(#${gid})`, stroke: "none" }, area);
    for (const t of [...teams.filter(t => t !== hi), hi]) {
      const on = t === hi, pts = P.map((p, i) => [i, val(p, t)]).filter(q => q[1] != null);
      const g = el("g", { style: "cursor:pointer", class: on ? "hl-line" : "" }, lines);
      g.addEventListener("click", () => pick(t));
      const d = smoothPath(pts.map(q => [x(q[0]), y(q[1])]));
      el("path", { d, fill: "none", stroke: on ? "var(--accent)" : "var(--context)", "stroke-width": on ? 2.5 : 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
      el("path", { d, fill: "none", stroke: "transparent", "stroke-width": 12 }, g);
    }
    const ends = teams.map(t => ({ t, v: val(P[n - 1], t) || 0 }));
    if (PHONE) {
      const e = ends.find(e => e.t === hi), prev = hp.length > 1 ? hp.at(-2)[1] : null;
      if (e) {
        const above = prev == null || prev <= e.v, yy = Math.min(H - M.b - 4, Math.max(M.t + 10, y(e.v) + (above ? -9 : 17)));
        const tx = el("text", { x: x(n - 1) - 2, y: yy, "text-anchor": "end", class: "lbl on halo" }, labels);
        tx.textContent = short(e.t, 18);
      }
      return;
    }
    ends.forEach(e => { e.yy = y(e.v); });
    ends.sort((a, b) => a.yy - b.yy);
    for (let i = 1; i < ends.length; i++) ends[i].yy = Math.max(ends[i].yy, ends[i - 1].yy + 15);
    ends.at(-1).yy = Math.min(ends.at(-1).yy, H - M.b);
    for (let i = ends.length - 2; i >= 0; i--) ends[i].yy = Math.min(ends[i].yy, ends[i + 1].yy - 15);
    if (ends[0].yy < M.t) { const d = M.t - ends[0].yy; ends.forEach(e => e.yy += d); }
    for (const e of ends) {
      const on = e.t === hi;
      el("line", { x1: x(n - 1) + 3, x2: x(n - 1) + 10, y1: y(e.v), y2: e.yy, stroke: on ? "var(--accent)" : "var(--context)", "stroke-width": 1 }, labels);
      const tx = el("text", { x: x(n - 1) + 14, y: e.yy + 4, class: "lbl halo" + (on ? " on" : "") }, labels);
      tx.textContent = `${short(e.t, 15)} ${pct(e.v)}`;
      if (short(e.t, 15) !== e.t) el("title", {}, tx).textContent = e.t;
      tx.addEventListener("click", () => pick(e.t));
    }
  }
  listeners.push(draw);
  const hide = () => { tip.style.display = "none"; cross.setAttribute("visibility", "hidden"); dots.replaceChildren(); };
  svg.addEventListener("pointermove", ev => {
    const r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) * W / r.width;
    if (sx < M.l - 10 || sx > W - M.r + 10) return hide();
    const i = Math.min(n - 1, Math.max(0, Math.round((sx - M.l) / (W - M.l - M.r) * (n - 1))));
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
    dots.replaceChildren();
    const rows = teams.map(t => ({ t, v: val(P[i], t) })).filter(o => o.v != null).sort((a, b) => b.v - a.v);
    for (const o of rows) el("circle", { cx: x(i), cy: y(o.v), r: o.t === hi ? 5 : 4, fill: o.t === hi ? "var(--accent)" : "var(--context)", stroke: "var(--surface-1)", "stroke-width": 2 }, dots);
    tip.innerHTML = `<div class="h">${P[i].live ? "Today" : "Going into week " + P[i].week} · ${what}</div>` +
      rows.map((o, k) => `<div class="r${o.t === hi ? " on" : ""}"><span>${k + 1}. ${o.t}</span><span>${pct(o.v)}</span></div>`).join("");
    tip.style.display = "block";
    const px = x(i) / W * r.width;
    placeChartTip(tip, r, px);
    tip.style.top = "12px";
  });
  svg.addEventListener("pointerleave", hide);
}
(() => {
  const card = document.getElementById("team-card");
  if (!card || !D0.tank || !D0.lineup) return;
  if (D0.tank.npBracket && D0.tank.npBracket.kind === "consolation") {
    document.getElementById("team-h").hidden = card.hidden = true; return;
  }
  const N = 5;
  const TK_TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9.5 17h5"/></svg>';
  let caches = {}, running = null;
  const sigNow = () => window.movesInPlay ? window.movesInPlay() : "[]";
  const answers = (sig = sigNow()) => caches[sig] || (caches[sig] = {});
  const canRun = location.protocol !== "file:";
  const draw = () => {
    const first = (D.liveWeek || D.lastActual) + 1, weeks = [];
    for (let w = Math.max(1, first); w <= D.lastWeek; w++) weeks.push(w);
    const wkOf = w => (window.tradeWeek && window.tradeWeek(hi, w)) || (D.rosters[hi] || {})[w];
    const live = weeks.map(wkOf).filter(Boolean);
    const avatars = D0.avatars || {};
    const av = avatars[hi] ? `<img src="${avatars[hi]}" alt="">` : hi[0].toUpperCase();
    const head = `<div class="team-top"><span class="me-av">${av}</span><div style="min-width:0"><div class="nm">${hi}</div>` +
      `</div></div>`;
    if (!live.length) { card.innerHTML = head + `<p class="team-empty">No regular-season weeks left.</p>`; return; }
    const P = {};
    live.forEach(wk => wk.rows.forEach(r => {
      const e = P[r[0]] || (P[r[0]] = { pid: r[0], pts: 0, inMax: 0, weeks: 0, tag: r[8] || "", nfl: r[2] || "" });
      e.pts += r[3] ? 0 : (r[4] || 0); e.weeks += 1;
      if (RACE_K === "max_pf" ? r[16] && r[16] !== "Bench" : r[1] && r[1] !== "Bench") e.inMax += 1;
    }));
    const ps = Object.values(P).filter(e => D.players[e.pid]);
    const slot = {}, order = [...ps].sort((a, b) => b.pts - a.pts);
    for (const [name, elig, n] of D0.lineup.stages) {
      let taken = 0;
      for (const e of order) { if (taken >= n) break; if (!slot[e.pid] && elig.includes(D.players[e.pid][1]) && e.pts >= D0.lineup.minProj) { slot[e.pid] = name; taken++; } }
    }
    const lineup = ps.filter(e => slot[e.pid]), bench = ps.filter(e => !slot[e.pid]);
    const sum = a => a.reduce((t, e) => t + e.pts, 0);
    const SL = D.league.slotLabels || {};
    const got = answers()[hi] || {}, curOdds = D.tank.draft.odds[hi] || [0, 0, 0];
    const pc = v => v >= 0.995 ? ">99%" : v < 0.005 ? (v > 0.00005 ? "<1%" : "—") : Math.round(v * 100) + "%";
    const dP = (a, b) => { const v = Math.round((a - b) * 100); return v ? `<span class="chg ${v > 0 ? "good" : "bad"}">(${v > 0 ? "+" : "−"}${Math.abs(v)})</span>` : ""; };
    const simCell = pid => !got[pid] ? `<span class="pts adds muted">${pid in got || running === hi ? "…" : "—"}</span>`
      : REC_LIKE(RACE_K) ? `<span class="pts adds" title="How many fewer projected wins the team has without him">+${Math.abs(got[pid][3]).toFixed(2)}<small>wins</small></span>`
      : `<span class="pts adds" title="How much lower the team's simulated final ${RW.unit} is without him">+${f1(Math.abs(got[pid][3]))}<small>+${f1(Math.abs(got[pid][3]) / live.length)}/wk</small></span>`;
    const oddsCell = pid => {
      if (!(pid in got)) return `<span class="wo">${running === hi ? `<span class="muted">…</span>` : ""}</span>`;
      if (!got[pid]) return `<span class="wo muted">—</span>`;
      return `<span class="wo"><span class="wo-l">Pick Odds Without</span>` + [0, 1, 2].map(i =>
        `<span class="wo-i"><b>1.0${i + 1}</b><span class="v">${pc(got[pid][i])}</span>${dP(got[pid][i], curOdds[i])}</span>`).join("") + `</span>`;
    };
    const li = (e, lbl) => {
      const [name, pos] = D.players[e.pid];
      const tag = e.tag ? `<span class="chip${e.tag === "IR" ? " ir" : ""}">${e.tag}</span>` : "";
      return `<li data-pid="${e.pid}"><span class="pos ${lbl}">${SL[lbl] || lbl}</span><span class="who">${headshot(e.pid)}<span class="wt"><span class="pn">${name}${tag}</span>` +
        `<span class="ps"><b class="${pos}">${pos}</b> ${e.nfl || "FA"} · in lineup ${e.inMax}/${live.length} wks</span></span></span>` +
        `<span class="pts">${f1(e.pts)}<small>${f1(e.pts / live.length)}/wk</small></span>` +
        `${simCell(e.pid)}${oddsCell(e.pid)}</li>`;
    };
    const cols = `<div class="team-cols-h"><span></span><span></span><span title="Rest of season: his projections added up over the weeks left">ROS Pts</span>` +
      `<span title="How much lower the team's simulated final ${RW.unit} would be without him over the weeks left (the next best players fill in), from the Run Pick Odds Without runs">${RW.teamCol}</span>` +
      `<span class="wo-h" title="The team's own 1.01-1.03 odds if he were dropped: the season simulated again without him; the change is against the odds shown now"><span class="wo-t">Pick Odds Without</span>` +
      `<span class="wo-g"><span>1.01</span><span>1.02</span><span>1.03</span></span></span></div>`;
    const best = [...bench].sort((a, b) => b.pts - a.pts).slice(0, N);
    const stageAt = Object.fromEntries(D0.lineup.stages.map(([name], i) => [name, i]));
    const starters = [...lineup].sort((a, b) => (stageAt[slot[a.pid]] - stageAt[slot[b.pid]]) || b.pts - a.pts);
    const shown = [...best, ...starters].map(e => e.pid), done = shown.every(pid => pid in got);
    const nDone = shown.filter(pid => pid in got).length;
    const btn = !canRun ? "" : running === hi
      ? `<div class="team-run"><button type="button" class="run-btn running tk-bar" disabled aria-live="polite">` +
        `<span class="tk-sun"></span><span class="tk-hills"></span><span class="tk-trees"></span><span class="run-road"></span><span class="tk-lane"></span>` +
        `<span class="run-tank"><svg viewBox="0 0 24 24" aria-hidden="true" style="overflow: visible"><g transform="translate(-2.47 2.83) scale(0.135)"><g transform="rotate(-28 108 68)"><rect x="104" y="62" width="80" height="12" rx="6" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><rect x="180" y="58" width="12" height="20" rx="4" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><g fill="#c6cde6" opacity=".6"><circle cx="207" cy="58" r="7"/><circle cx="216" cy="49" r="5.2"/><circle cx="204" cy="46" r="4"/></g></g></g><g transform="translate(-2.47 2.83) scale(0.135)"><rect x="22" y="96" width="156" height="46" rx="23" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><g fill="var(--amber)"><circle cx="50" cy="119" r="8.6"/><circle cx="80" cy="119" r="8.6"/><circle cx="110" cy="119" r="8.6"/><circle cx="140" cy="119" r="8.6"/></g><path d="M46 90a40 38 0 0 1 80 0z" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><rect x="40" y="88" width="92" height="10" rx="5" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><circle cx="73" cy="68" r="9" fill="var(--cyan-text)"/><circle cx="99" cy="68" r="9" fill="var(--cyan-text)"/><circle cx="63" cy="79" r="7" fill="#ff80ad" opacity=".75"/><circle cx="109" cy="79" r="7" fill="#ff80ad" opacity=".75"/><path d="M80 78q6 6 12 0" stroke="var(--cyan-text)" stroke-width="7" fill="none" stroke-linecap="round"/></g></svg></span>` +
        `<span class="run-txt">Simulating…</span></button></div>`
      : done ? "" : `<div class="team-run"><button type="button" class="run-btn" id="team-run"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>Run Pick Odds Without Each Player</button></div>`;
    const html = head + btn + `<div class="team-cols">` +
      `<div class="team-col"><h3>Starting lineup <span class="muted">· lineup total ${f1(sum(lineup))}</span></h3>` +
      `${cols}<ul class="team-list">${starters.map(e => li(e, slot[e.pid])).join("")}</ul></div>` +
      `<div class="team-col"><h3>Best bench <span class="muted">· bench total ${f1(sum(bench))}</span></h3>` +
      (best.length ? `${cols}<ul class="team-list">${best.map(e => li(e, D.players[e.pid][1])).join("")}</ul>` : `<p class="team-empty">Nobody on the bench.</p>`) + `</div></div>`;
    const bar = running === hi && card.querySelector(".tk-bar");
    if (!bar) card.innerHTML = html;
    else {
      const keep = bar.closest(".team-run"), tmp = document.createElement("div");
      tmp.innerHTML = html;
      const kids = [...tmp.childNodes], at = kids.findIndex(k => k.classList && k.classList.contains("team-run"));
      [...card.childNodes].forEach(k => k !== keep && k.remove());
      keep.before(...kids.slice(0, at)); keep.after(...kids.slice(at + 1));
    }
    const b = running === hi && card.querySelector(".tk-bar");
    if (b) { b.dataset.done = nDone; b.dataset.n = shown.length; if (!stepT) step(); }
  };
  let vis = 0, stepT = null, finishing = false;
  const step = () => {
    stepT = null;
    const bar = card.querySelector(".tk-bar");
    if (!bar || finishing || vis >= +bar.dataset.done) return;
    vis++;
    const lane = bar.querySelector(".tk-lane"), t = document.createElement("span");
    t.className = "tk-t"; t.innerHTML = TK_TROPHY + "<i></i><i></i><i></i><i></i>";
    lane.append(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("go")));
    setTimeout(() => { t.classList.add("hit"); setTimeout(() => t.classList.add("away"), 420); setTimeout(() => t.remove(), 2600); }, 600);
    stepT = setTimeout(step, +bar.dataset.done - vis > 1 ? 150 : 300);
  };
  card.addEventListener("click", async e => {
    if (!e.target.closest("#team-run") || running || !window.dropOdds) return;
    const team = hi, list = () => [...card.querySelectorAll(".team-list li[data-pid]")].map(li => li.dataset.pid);
    const sig = sigNow(), mine = answers(sig);
    running = team; mine[team] = mine[team] || {}; vis = 0; finishing = false; clearTimeout(stepT); stepT = null; draw();
    const c = mine[team];
    for (let round = 0; round < 3; round++) {
      const pids = hi === team ? list().filter(pid => !(pid in c)) : [];
      if (!pids.length) break;
      let ok = false;
      try { ok = await window.dropOdds(team, pids, (pid, odds) => { c[pid] = odds; if (hi === team) draw(); }); } catch (err) {}
      if (sigNow() !== sig) break;
      if (!ok) { pids.forEach(pid => { if (!(pid in c)) c[pid] = null; }); break; }
    }
    finishing = true;
    if (hi === team) {
      clearTimeout(stepT); stepT = null;
      const bar = card.querySelector(".tk-bar");
      if (bar) bar.querySelectorAll(".tk-t:not(.hit)").forEach(t => t.classList.add("go", "hit"));
      await new Promise(r => setTimeout(r, 450));
    }
    running = null; draw();
  });
  listeners.push(draw);
  onData.push(draw);
  draw();
})();
(() => {
  const fab = document.getElementById("opt-fab"), sheet = document.getElementById("opt-sheet");
  if (!fab || !D0.league.key) { if (fab) fab.hidden = true; return; }
  const WORKER = "https://league-scheduler.nntay92.workers.dev";
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  const note = document.getElementById("opt-note"), save = document.getElementById("opt-save");
  const cur = D0.league.draftOrder || "none";
  const split = v => { if (v === "finalists") return { np: "max_pf", po: "finalists", tp: false, all: false };
    if (v === "max_pf_all") return { np: "max_pf", po: "finish_max_pf", tp: false, all: true };
    const [np, po, tp] = String(v).split("/"); return { np, po: po || "finish_max_pf", tp: tp === "3p", all: false }; };
  const join = p => p.np === "none" ? "none" : p.all ? "max_pf_all" : p.po === "finalists" ? "finalists" : `${p.np}/${p.po}` + (p.tp && p.po !== "seed" ? "/3p" : "");
  let pick = split(cur);
  if (D0.league.type === "redraft") {
    sheet.querySelectorAll(".opt-h, .opt-sw, #opt-set, #opt-save").forEach(el => { el.hidden = true; el.style.display = "none"; });
    document.getElementById("opt-note").textContent = "Redraft league: there's no rookie draft, so there are no draft-order options to set.";
  }
  const say = (t, err) => { note.textContent = t; note.classList.toggle("err", !!err); };
  const type = { redraft: "Redraft", keeper: "Keeper", dynasty: "Dynasty" }[D0.league.type] || "League";
  const teams = (D0.standings || []).length;
  document.getElementById("opt-facts").innerHTML = `From Sleeper: <b>${type}</b> · ${teams} teams · ` +
    (D0.playoffStart ? `${D0.playoffTeams}-team playoffs from week ${D0.playoffStart}` : "no playoffs") +
    (D0.league.divisions.length ? ` · ${D0.league.divisions.length} divisions` : "") + (D0.league.median ? " · median games" : "") +
    (D0.tank ? ` · ${D0.tank.draft.rounds}-round rookie draft` : "");
  let lastNp = pick.np === "none" ? "max_pf" : pick.np;
  const mark = () => {
    const none = pick.np === "none";
    if (!none) lastNp = pick.np;
    document.getElementById("opt-none").setAttribute("aria-checked", String(none));
    document.getElementById("opt-set").hidden = none;
    sheet.querySelectorAll('[data-g="np"] .opt-o').forEach(b => b.setAttribute("aria-checked", String(b.dataset.v === pick.np)));
    sheet.querySelectorAll('[data-g="po"] .opt-o').forEach(b => b.setAttribute("aria-checked", String(b.dataset.v === pick.po)));
    sheet.querySelectorAll('[data-g="tp"] .opt-o').forEach(b => b.setAttribute("aria-checked", String((b.dataset.v === "1") === pick.tp)));
    sheet.querySelector('[data-g="all"] .opt-o').setAttribute("aria-checked", String(!!pick.all));
    document.getElementById("opt-np").hidden = document.getElementById("opt-po").hidden = !!pick.all;
    document.getElementById("opt-tp").hidden = pick.po === "seed" || pick.po === "finalists";
    sheet.querySelectorAll('[data-g="np"] .opt-o').forEach(b => {
      b.disabled = pick.po === "finalists"; b.classList.toggle("forced", pick.po === "finalists" && b.dataset.v === "max_pf"); });
    save.disabled = join(pick) === join(split(cur));
  };
  const redraft = D0.league.type === "redraft";
  const label = v => { const q = split(v), t = g => (sheet.querySelector(`[data-g="${g}"] [data-v="${g === "np" ? q.np : q.po}"] b`) || {}).textContent || "";
    return q.np === "none" ? "No draft order rules" : q.all ? "Max Points For, all picks" : q.po === "finalists" ? t("po")
      : `${t("np")}, ${t("po")}${q.tp && q.po !== "seed" ? ", third-place game" : ""}`; };
  const pend = document.getElementById("opt-pending");
  const nextUpdate = () => {
    const now = Date.now(), top = Math.ceil(now / 3600e3) * 3600e3;
    for (let h = 0; h < 48; h++) {
      const d = new Date(top + h * 3600e3);
      const et = +d.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" });
      if (et === 8 || et === 20) {
        const day = d.toDateString() === new Date(now).toDateString() ? "today" : "tomorrow";
        return `${d.toLocaleTimeString([], { hour: "numeric" })} ${day}`;
      }
    }
    return "the next update";
  };
  const effect = () => `This requires league recalculation, which will take effect at ${nextUpdate()}.`;
  const showPending = p => { pend.hidden = !p; if (p) pend.querySelector("span").textContent = `At ${nextUpdate()}: ${label(p.draft_order)}`; };
  const loadPending = () => fetch(`${WORKER}/options?league=${encodeURIComponent(D0.league.key)}`, { cache: "no-store" })
    .then(r => r.json()).then(r => showPending(r.pending)).catch(() => {});
  document.getElementById("opt-cancel").addEventListener("click", async () => {
    try { await fetch(WORKER + "/options", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ league: D0.league.key, cancel: true }) }); } catch (e) {}
    showPending(null); say("Cancelled.");
  });
  const open = () => {
    pick = split(cur); mark(); document.getElementById("opt-confirm").hidden = true;
    say(redraft ? "Redraft league: no rookie draft." : effect());
    sheet.hidden = false; if (!redraft) loadPending();
  };
  const close = () => { sheet.hidden = true; };
  fab.addEventListener("click", open);
  sheet.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) return close();
    if (e.target.closest("#opt-none")) { pick.np = pick.np === "none" ? lastNp : "none"; return mark(); }
    const o = e.target.closest(".opt-o");
    if (!o) return;
    const g = o.closest("[data-g]").dataset.g;
    if (o.disabled) return;
    if (g === "all") pick.all = !pick.all;
    else if (g === "tp") pick.tp = o.dataset.v === "1";
    else if (g === "po" && o.dataset.v === "finalists" && pick.po !== "finalists") { pick.npKeep = pick.np; pick.np = "max_pf"; pick.po = "finalists"; }
    else if (g === "po" && pick.po === "finalists") { pick.po = o.dataset.v; if (pick.npKeep) pick.np = pick.npKeep; }
    else pick[g] = o.dataset.v;
    mark();
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });
  const cf = document.getElementById("opt-confirm");
  save.addEventListener("click", () => {
    document.getElementById("opt-cf-what").textContent = label(join(pick));
    document.getElementById("opt-cf-when").textContent = effect();
    cf.hidden = false; document.getElementById("opt-cf-yes").focus();
  });
  document.getElementById("opt-cf-no").addEventListener("click", () => { cf.hidden = true; });
  document.getElementById("opt-cf-yes").addEventListener("click", async () => {
    cf.hidden = true; save.disabled = true; say("Saving…");
    try {
      const resp = await fetch(WORKER + "/options", { method: "POST", headers: { "content-type": "application/json" },
                                                      body: JSON.stringify({ league: D0.league.key, draft_order: join(pick) }) });
      const r = await resp.json().catch(() => ({}));
      if (!resp.ok) { save.disabled = false; return say(r.error || `Couldn't save (${resp.status}).`, true); }
      showPending({ draft_order: join(pick) });
      say(`Saved. ${effect()}`);
    } catch (e) { save.disabled = false; say("Couldn't reach the update service.", true); }
  });
})();
(() => {
  const h = document.getElementById("tt-h"), seg = document.getElementById("tt-view");
  if (!h || !seg) return;
  const K = (D0.tank && D0.tank.metric) || "max_pf";
  seg.querySelector('[data-v="race"]').textContent = K === "pf" ? "Points" : K === "record" || K === "bracket" ? "Record" : "Max PF";
  const KEY = `contendathon-${D0.league.id}-tank-table`, t = h.querySelector(".tt-title");
  const set = on => {
    h.classList.toggle("on", on);
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.v === "odds") === on)));
    t.textContent = on ? t.dataset.on : t.dataset.off;
    document.getElementById("tt-maxpf").hidden = on; document.getElementById("tt-slots").hidden = !on;
  };
  let on = false;
  try { on = localStorage.getItem(KEY) === "1"; } catch (e) {}
  set(on);
  seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    const now = b.dataset.v === "odds";
    try { localStorage.setItem(KEY, now ? "1" : ""); } catch (e) {}
    set(now);
  });
})();
oddsChart("odds-line", "odds-linetip", "title", "championship odds");
if (D.tank) oddsChart("odds-tank", "odds-tanktip", "pick1", "1.01 pick odds");
(() => {
  const KEY = `contendathon-${D0.league.id}-odds-time`, sws = document.querySelectorAll(".odds-sw");
  const set = on => {
    document.body.classList.toggle("odds-time", on);
    sws.forEach(b => b.setAttribute("aria-checked", String(on)));
    document.querySelectorAll(".odds-title").forEach(t => { t.textContent = on ? t.dataset.on : t.dataset.off; });
    [["bracket", "bracket", "odds-line"], ["tank-race", "tank-race", "odds-tank"]].forEach(([a, k, b]) => {
      const A = document.getElementById(a), K = document.getElementById(k), B = document.getElementById(b);
      if (a === "bracket" && !D0.bracket.length) return;
      if (A) A.hidden = on;
      if (K) K.hidden = on;
      if (B) B.hidden = !on;
    });
  };
  let on = false;
  try { on = localStorage.getItem(KEY) === "1"; } catch (e) {}
  set(on);
  sws.forEach(b => b.addEventListener("click", () => {
    const now = b.getAttribute("aria-checked") !== "true";
    try { localStorage.setItem(KEY, now ? "1" : ""); } catch (e) {}
    set(now);
  }));
})();




(() => {
  const M = D.model, p0 = v => Math.round(v * 100) + "%", sp = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v * 100)) + "%";
  const bandRange = b => `${b.proj}`;
  let lastPos = null;
  document.getElementById("model-rows").innerHTML = M.bands.map(b => {
    const first = b.pos !== lastPos; lastPos = b.pos;
    return `<tr style="cursor:default" class="${first ? "band-first" : ""}"><td>${first ? `<span class="pos ${b.pos}">${b.pos}</span>` : ""}</td>` +
      `<td class="left">${bandRange(b)}</td><td>${b.weeks.toLocaleString()}</td><td>${p0(b.beat)}</td>` +
      `<td class="neg-v">${sp(b.p10)}</td><td>${sp(b.p25)}</td><td>${sp(b.median)}</td><td>${sp(b.p75)}</td>` +
      `<td class="pos-v">${sp(b.p90)}</td><td>${p0(b.zero)}</td></tr>`;
  }).join("");

})();

(() => {
  const sec = document.getElementById("lines-sec");
  if (!D0.lines || !D0.lines.games.length) { sec.remove(); return; }
  if (D0.league.linesFirst) document.getElementById("tiles").before(sec);
  document.querySelectorAll(".sims").forEach(e => e.textContent = D0.sims.toLocaleString());
  const ml = v => (v > 0 ? "+" : "−") + Math.abs(v);
  const sp = v => v < 0.5 ? "PK" : "−" + v.toFixed(1);
  const body = document.getElementById("lines-rows");
  body.addEventListener("click", e => { const tr = e.target.closest("tr"); if (tr) pick(tr.dataset.fav === hi ? tr.dataset.dog : tr.dataset.fav); });
  const before = {};
  D0.lines.games.forEach(g => { before[g.favorite] = [g.fav_win, g.fav_proj]; before[g.underdog] = [1 - g.fav_win, g.dog_proj]; });
  onData.push(() => {
    const L = D.lines;
    document.getElementById("lines-h").textContent = `Week ${L.week} lines` + (L.live ? " (live)" : "");
    body.innerHTML = L.games.map(g =>
      `<tr data-fav="${g.favorite}" data-dog="${g.underdog}"><td class="team">${g.favorite}<div class="sub">avg ${f1(g.fav_proj)}${chg(g.fav_proj, before[g.favorite][1])}</div></td>` +
      `<td>${Math.round(g.fav_win * 100)}%${chgP(g.fav_win, before[g.favorite][0])}</td><td class="ml fav">${ml(g.fav_ml)}</td><td class="mid">${sp(g.spread)}</td>` +
      `<td class="team">${g.underdog}<div class="sub">avg ${f1(g.dog_proj)}${chg(g.dog_proj, before[g.underdog][1])}</div></td><td class="ml dog">${ml(g.dog_ml)}</td><td>${g.total.toFixed(1)}</td></tr>`).join("");
  });
  listeners.push(() => body.querySelectorAll("tr").forEach(tr => {
    tr.classList.toggle("on", tr.dataset.fav === hi || tr.dataset.dog === hi);
    const [fav, dog] = tr.querySelectorAll("td.team");
    fav.classList.toggle("me", tr.dataset.fav === hi);
    dog.classList.toggle("me", tr.dataset.dog === hi);
  }));
})();

const lwC = D0.liveWeek;
if (lwC) {
  document.getElementById("pf-grp").colSpan = 5;
  document.getElementById("pf-h-sofar").classList.remove("h-sofar");
  document.getElementById("pf-h-sofar").textContent = "Act.";
  document.getElementById("pf-h-sofar").title = lwC > 1 ? `Points scored, weeks 1–${lwC - 1} (the weeks that are over)` : "Points scored (no week is over yet)";
  document.getElementById("pf-h-live").remove();
  document.getElementById("pf-h-liveproj").innerHTML = `<span class="lg">Proj.<br>Wk ${lwC}</span><span class="sm">Proj.<br>Wk ${lwC}</span>`;
  document.getElementById("pf-h-liveproj").title = `Week ${lwC}'s projected score for the lineup each team set: points already scored, plus for a game still going his points so far + his projection times the share of the game left, and projections for games not started (simulated average)`;
} else { document.getElementById("pf-h-live").remove(); document.getElementById("pf-h-liveproj").remove(); }
["pf-rows", "odds-rows"].forEach(id => document.getElementById(id).addEventListener("click", e => {
  const tr = e.target.closest("tr[data-team]"); if (tr) pick(tr.dataset.team);
}));
const F1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f1d = v => {
  const parts = F1.formatToParts(v), i = parts.findIndex(p => p.type === "decimal");
  if (i < 0) return F1.format(v);
  const whole = parts.slice(0, i).map(p => p.value).join(""), dec = parts.slice(i).map(p => p.value).join("");
  const rnd = Math.abs(v) < 0.95 ? F1.format(v) : Math.round(v).toLocaleString();
  return `<span class="full">${whole}<span class="dec">${dec}</span></span><span class="rnd">${rnd}</span>`;
};
onData.push(() => {
  const best = D.standings[0].final;
  document.getElementById("pf-rows").innerHTML = D.standings.map(r => {
    const b = S0[r.team];
    return `<tr data-team="${r.team}"><td><span class="rk r${r.rank}">${r.rank}</span></td><td class="team"><span class="r-nm">${r.team}</span>${ownerSub(r.team)}</td><td class="pt">${f1d(r.final)}${chg(r.final, b.final)}</td>` +
      (lwC ? `<td class="pt pact">${f1d(r.toDateFinal)}</td><td class="pt">${f1d(r.wkProj)}${chg(r.wkProj, b.wkProj)}</td>`
           : `<td class="pt pact">${f1d(r.toDate)}</td>`) +
      `<td class="muted pt px">${Math.round(r.p10).toLocaleString()}–${Math.round(r.p90).toLocaleString()}</td><td class="pt">${r.final === best ? "—" : "−" + f1d(best - r.final)}</td>` +
      `<td class="pt">${odds(r.pfTitle)}${chgP(r.pfTitle, b.pfTitle)}</td><td class="pt">${f1d(r.pa)}</td></tr>`;
  }).join("");
});


const ownerSub = t => {
  const n = String((D0.league.ownerNames || {})[t] || "").trim();
  if (!n) return "";
  return `<span class="own-u">${n.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))}</span>`;
};
const byOdds = () => [...D.standings].sort((a, b) => b.playoff - a.playoff || b.projW - a.projW || b.final - a.final);
const heatCell = (p, before, good) => {
  const a = Math.min(1, Math.max(0, p)) * 0.85;
  const txt = p < 0.005 ? "" : p >= 0.995 ? ">99" : Math.round(p * 100);
  return `<span style="background:rgb(0 225 224 / ${a.toFixed(3)});color:${a > 0.45 ? "#05091d" : "var(--text-secondary)"}">${txt}${chgP(p, before, good)}</span>`;
};
(() => {
  const n = teams.length;
  document.getElementById("odds-head").innerHTML = `<th class="team">Team</th><th><span class="lg">Record</span><span class="sm">W–L</span></th><th class="pw">Proj.<br>wins</th><th class="prec">Proj.<br><span class="lg">record</span><span class="sm">W–L</span></th><th>Playoffs</th>${D0.byeTeams ? "<th>Bye</th>" : ""}<th>#1 seed</th><th>Title</th>` +
    Array.from({ length: n }, (_, i) => `<th class="sd${i === D0.playoffTeams ? " cut" : ""}" style="text-align:center">${i + 1}</th>`).join("");
  onData.push(() => {
    document.getElementById("odds-rows").innerHTML = byOdds().map((r, i) => {
      const b = S0[r.team];
      return `<tr data-team="${r.team}" class="${i === D.playoffTeams - 1 ? "line" : ""}"><td class="team">${r.team}${ownerSub(r.team)}</td><td>${rec(r)}</td><td class="pw">${r.projW.toFixed(1)}${chg(r.projW, b.projW)}</td><td class="prec">${projRec(r)}</td>` +
        `<td class="big">${odds(r.playoff)}${chgP(r.playoff, b.playoff)}</td>${D.byeTeams ? `<td>${odds(r.bye)}${chgP(r.bye, b.bye)}</td>` : ""}<td>${odds(r.top)}${chgP(r.top, b.top)}</td>` +
        `<td>${odds(r.title)}${chgP(r.title, b.title)}</td>` +
        r.seeds.map((p, s) => `<td class="heat${s === D.playoffTeams ? " cut" : ""}">${heatCell(p, b.seeds[s], s < D.playoffTeams ? 1 : -1)}</td>`).join("") + `</tr>`;
    }).join("");
  });
  const KEY = `contendathon-${D0.league.id}-po-view`, seg = document.getElementById("po-view"), tbl = document.getElementById("odds-table");
  const set = v => {
    if (v === "wins" && D0.standings[0].projWlo == null) v = "details";
    tbl.classList.toggle("v-seeds", v === "seeds");
    tbl.hidden = v === "wins"; document.getElementById("c-bars").hidden = v !== "wins";
    if (v === "wins") window.drawProjWins();
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  };
  let v = "details";
  try { v = localStorage.getItem(KEY) || v; } catch (e) {}
  set(v);
  seg.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    try { localStorage.setItem(KEY, b.dataset.v); } catch (e) {}
    set(b.dataset.v);
  });
})();

(() => {
  const KEY = `contendathon-${D0.league.id}-pf-view`, seg = document.getElementById("pf-view");
  if (!seg) return;
  const set = v => {
    document.getElementById("pf-graph").hidden = v !== "graph";
    document.getElementById("pf-table").hidden = v === "graph";
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  };
  let v = "graph";
  try { v = localStorage.getItem(KEY) || v; } catch (e) {}
  set(v);
  seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    try { localStorage.setItem(KEY, b.dataset.v); } catch (e) {}
    set(b.dataset.v);
  });
})();

function bracketChart(host, B, standings, o = {}) {
  const TT = Object.fromEntries(standings.map(r => [r.team, r.title]));
  const G = Object.fromEntries(B.map(g => [g.game, g]));
  const nTitle = standings.filter(r => r.title >= 0.005).length;
  const TR = D !== D0, CW = TR ? (PHONE ? 28 : 36) : 0;
  const G0 = Object.fromEntries((o.before || []).map(g => [g.game, g])), T0 = o.before0 || {};
  const dPts = v => v ? `(${v > 0 ? "+" : "−"}${Math.abs(v)})` : "";
  const BW = (PHONE ? 168 : 236) + CW, RH = PHONE ? 26 : 30, STEP = (PHONE ? 186 : 268) + CW, TY = PHONE ? 17 : 19;
  const R = Math.max(...B.map(g => g.round));
  const col = Array.from({ length: R + 1 }, (_, i) => i * STEP);
  const pos = {}, first = B.filter(g => g.round === 1 && g.game !== "3P").sort((a, b) => a.slot - b.slot);
  const half = Math.max(1, first.length / 2);
  first.forEach((g, i) => { pos[g.game] = [col[0], 20 + i * (PHONE ? 74 : 90) + (first.length >= 4 ? Math.floor(i / half) * (PHONE ? 34 : 60) : 0)]; });
  for (let r = 2; r <= R; r++)
    B.filter(g => g.round === r && g.feeds).forEach(g => {
      pos[g.game] = [col[r - 1], (pos[g.feeds[0]][1] + pos[g.feeds[1]][1]) / 2];
    });
  if (G["3P"]) pos["3P"] = [col[R - 1], pos.F[1] + (PHONE ? 150 : 180)];
  const bottom = Math.max(...Object.values(pos).map(p => p[1])) + RH * 2 + 20;
  const LH = PHONE ? 19 : 22;
  const W = col[R] + BW + 4, H = Math.max(bottom, pos.F[1] + RH * 2 + 40 + 10 + nTitle * LH + 8, 200);
  const weeksLabel = g => g.weeks && g.weeks.length > 1 ? `weeks ${g.weeks[0]}–${g.weeks[g.weeks.length - 1]}` : `week ${g.week}`;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Projected playoff bracket with each game's win chance" });
  if (PHONE) svg.style.cssText = `width:${W}px;min-width:0`;
  host.replaceChildren(svg);
  const conn = el("g", {}, svg), boxes = el("g", {}, svg), side = el("g", {}, svg);

  function teamRow(g, parent, x, y, n) {
    const pct1 = Math.round(g.p1 * 100), team = g["team" + n], seed = g["seed" + n], proj = g["proj" + n];
    const win = g.winner === team, on = team === hi;
    const r = el("g", { style: team ? "cursor:pointer" : "" }, parent);
    if (team) r.addEventListener("click", () => pick(team));
    el("rect", { x, y, width: BW, height: RH, fill: on ? "var(--self-from)" : "transparent" }, r);
    if (on) el("rect", { x, y, width: 3, height: RH, fill: "var(--cyan)" }, r);
    el("text", { x: x + (PHONE ? 8 : 12), y: y + TY, class: "seed-t" }, r).textContent = seed;
    const nameEl = el("text", { x: x + (PHONE ? 22 : 32), y: y + TY, class: "team-t" + (win ? " win" : "") + (on ? " on" : "") }, r);
    const projEl = el("text", { x: x + BW - (PHONE ? 40 : 58) - CW, y: y + TY, "text-anchor": "end", class: "proj-t" }, r);
    projEl.textContent = proj == null ? "" : PHONE ? Math.round(proj) : f1(proj);
    const g0 = G0[g.game];
    if (TR && team && !g.final && g0 && g.team2 && new Set([g0.team1, g0.team2, g.team1, g.team2]).size === 2) {
      const now = n === 1 ? pct1 : 100 - pct1, p0 = Math.round(g0.p1 * 100), was = g0.team1 === team ? p0 : 100 - p0, v = now - was;
      if (v) el("text", { x: x + BW - (PHONE ? 38 : 54), y: y + TY, "text-anchor": "end", class: "chg-t " + (v > 0 ? "good" : "bad") }, r).textContent = dPts(v);
    }
    const pctEl = el("text", { x: x + BW - (PHONE ? 6 : 10), y: y + TY, "text-anchor": "end", class: "pct-t" + (win ? " win" : "") }, r);
    pctEl.textContent = !team ? "—" : g.final ? (win ? "W" : "L") : (n === 1 ? pct1 : 100 - pct1) + "%";
    const stop = proj != null ? +projEl.getAttribute("x") - textW(projEl.textContent, getComputedStyle(projEl)) : +pctEl.getAttribute("x") - textW(pctEl.textContent, getComputedStyle(pctEl));
    fitName(nameEl, team || "BYE", stop - +nameEl.getAttribute("x") - (PHONE ? 7 : 10), PHONE ? 8.5 : 10.5);
    if (win) el("rect", { x: x + BW - 3, y, width: 3, height: RH, fill: "var(--cyan)" }, r);
  }
  function drawGame(id, dim) {
    const g = G[id]; if (!g) return;
    const [x, y] = pos[id];
    el("text", { x, y: y - 8, class: "cap-t" }, boxes).textContent = `${g.label} · ${weeksLabel(g)}${g.final ? " · final" : ""}`;
    const b = el("g", { opacity: dim ? 0.8 : 1 }, boxes);
    el("rect", { x, y, width: BW, height: RH * 2, rx: 8, fill: "var(--surface)", stroke: "var(--border)" }, b);
    const cid = "clip-" + host.id + "-" + id;
    const cp = el("clipPath", { id: cid }, b); el("rect", { x, y, width: BW, height: RH * 2, rx: 8 }, cp);
    const inner = el("g", { "clip-path": `url(#${cid})` }, b);
    teamRow(g, inner, x, y, 1); teamRow(g, inner, x, y + RH, 2);
    el("line", { x1: x, x2: x + BW, y1: y + RH, y2: y + RH, stroke: "var(--border)" }, b);
  }
  function link(from, to, row) {
    const [fx, fy] = pos[from], [tx, ty] = pos[to];
    const sx = fx + BW, sy = fy + RH, ex = tx, ey = ty + RH * (row - 0.5), mx = (sx + ex) / 2;
    el("path", { d: `M${sx},${sy} H${mx} V${ey} H${ex}`, fill: "none", stroke: "var(--divider)", "stroke-width": 1.5 }, conn);
  }
  function draw() {
    conn.replaceChildren(); boxes.replaceChildren(); side.replaceChildren();
    B.forEach(g => { if (g.feeds) { link(g.feeds[0], g.game, 1); link(g.feeds[1], g.game, 2); } });
    B.forEach(g => { if (g.game !== "3P") drawGame(g.game); });
    drawGame("3P", true);
    const champ = G.F.winner, x = col[R], on = champ === hi, fy = pos.F[1];
    el("text", { x, y: fy - 8, class: "cap-t" }, side).textContent = o.champCap || "Projected champion";
    const cb = el("g", { style: "cursor:pointer" }, side);
    cb.addEventListener("click", () => pick(champ));
    el("rect", { x, y: fy, width: BW, height: RH * 2, rx: 8, fill: on ? "var(--self-from)" : "var(--accent-soft)", stroke: "var(--cyan)", "stroke-width": 1.5 }, cb);
    fitName(el("text", { x: x + (PHONE ? 10 : 14), y: fy + (PHONE ? 22 : 27), "font-family": "Poppins, system-ui, sans-serif", "font-size": PHONE ? 15 : 18, "font-weight": 700, fill: "var(--cyan-text)" }, cb), champ, BW - (PHONE ? 20 : 28), PHONE ? 11 : 13);
    el("text", { x: x + (PHONE ? 10 : 14), y: fy + (PHONE ? 41 : 47), "font-size": PHONE ? 11 : 12, fill: "var(--text-secondary)" }, cb).textContent = o.champLine ? o.champLine(champ) : PHONE ? `${odds(TT[champ])} title odds` : `${odds(TT[champ])} title odds across all simulations`;
    el("path", { d: `M${pos.F[0] + BW},${fy + RH} H${x}`, fill: "none", stroke: "var(--cyan)", "stroke-width": 1.5 }, conn);
    const ranked = [...standings].filter(r => r.title >= 0.005).sort((a, b) => b.title - a.title);
    const ty = fy + RH * 2 + 40, maxT = ranked.length ? ranked[0].title : 1;
    if (ranked.length) el("text", { x, y: ty, class: "cap-t" }, side).textContent = o.listCap || "Title odds, all simulations";
    const probe = el("text", { class: "lbl" }, side), pcs = getComputedStyle(probe);
    const longest = Math.max(0, ...ranked.map(r => textW(r.team, pcs)));
    const valRoom = TR ? (PHONE ? 66 : 78) : (PHONE ? 34 : 40);
    const bx = Math.round(Math.min(BW - valRoom - 24, Math.max(PHONE ? 78 : 112, longest + 8)));
    probe.remove();
    ranked.forEach((r, i) => {
      const yy = ty + 10 + i * LH, isOn = r.team === hi, gg = el("g", { style: "cursor:pointer" }, side);
      gg.addEventListener("click", () => pick(r.team));
      el("rect", { x: x + bx, y: yy + 3, width: Math.max(2, (BW - bx - valRoom - 4) * r.title / maxT), height: PHONE ? 10 : 12, rx: 2, fill: isOn ? "var(--accent)" : "var(--context)" }, gg);
      fitName(el("text", { x, y: yy + 14, class: "lbl" + (isOn ? " on" : "") }, gg), r.team, bx - 6, PHONE ? 8.5 : 10);
      const val = el("text", { x: x + BW, y: yy + 14, "text-anchor": "end", class: "lbl" + (isOn ? " on" : "") }, gg);
      const v = TR && r.team in T0 ? Math.round((r.title - T0[r.team]) * 100) : 0;
      if (v) el("tspan", { class: "chg-t " + (v > 0 ? "good" : "bad"), dx: 0 }, val).textContent = dPts(v) + " ";
      el("tspan", {}, val).textContent = odds(r.title);
    });
  }
  draw();
  return draw;
}
(() => {
  const card = document.getElementById("bracket-card"), h = document.getElementById("bracket-h");
  let draw = null;
  onData.push(() => {
    if (!D0.bracket.length) {
      const t = h.querySelector(".odds-title");
      t.dataset.off = t.textContent = t.dataset.on;
      h.querySelector(".odds-sw").hidden = true;
      document.getElementById("bracket").hidden = true; document.getElementById("odds-line").hidden = false;
      document.querySelector("#info-8 .odds-off").innerHTML = document.querySelector("#info-8 .odds-on").innerHTML;
      draw = null; return;
    }
    if (D.bracket.some(g => g.final)) { const t = h.querySelector(".odds-title"); t.dataset.off = "Playoff bracket"; if (!document.body.classList.contains("odds-time")) t.textContent = t.dataset.off; }
    draw = bracketChart(document.getElementById("bracket"), D.bracket, D.standings,
      { before: D0.bracket, before0: Object.fromEntries(D0.standings.map(r => [r.team, r.title])) });
  });
  listeners.push(() => { if (draw) draw(); });
  if (document.fonts) document.fonts.ready.then(() => { if (draw) draw(); });
})();
(() => {
  const h = document.getElementById("npb-h"), card = document.getElementById("npb-card");
  if (!h) return;
  let draw = null;
  onData.push(() => {
    const nb = (D.tank && D.tank.npBracket) || (D0.tank && D0.tank.npBracket), show = !!(nb && nb.rows && nb.rows.length);
    h.hidden = card.hidden = !show;
    if (!show) { draw = null; return; }
    const toilet = nb.kind === "toilet_bowl", odds = D.tank.draft.odds || {};
    document.getElementById("npb-title").textContent = toilet ? "Toilet Bowl" : "Consolation Bracket";
    document.getElementById("info-npb").innerHTML = toilet
      ? "The teams missing the playoffs play a bracket where the <b>loser advances</b>. Each % is that team's chance to advance (to score less). Its \"winner\" picks 1.01."
      : "The teams missing the playoffs play a bracket where the <b>winner advances</b>. Each % is that team's chance to advance. Its champion picks first.";
    const odds0 = (D0.tank.draft || {}).odds || {}, nb0 = D0.tank.npBracket;
    draw = bracketChart(document.getElementById("npbracket"), nb.rows, Object.keys(odds).map(t => ({ team: t, title: odds[t][0] })), {
      champCap: toilet ? "Projected toilet bowl \"winner\"" : "Projected consolation champion",
      champLine: t => `${Math.round(((odds[t] || [0])[0]) * 100)}% chance at 1.01`,
      listCap: "1.01 odds, all simulations", before: nb0 && nb0.rows, before0: Object.fromEntries(Object.keys(odds0).map(t => [t, odds0[t][0]])) });
  });
  listeners.push(() => { if (draw) draw(); });
  if (document.fonts) document.fonts.ready.then(() => { if (draw) draw(); });
})();

(() => {
  const $i = id => document.getElementById(id);
  const sec = $i("im-sec"), host = $i("im-weeks"), sum = $i("im-sum"), reset = $i("im-reset"), note = $i("im-note");
  const gamesOf = t => (D0.schedule[t] || []).filter(x => x[0] <= D0.lastWeek);
  if (!(D0.playoffTeams >= 2) || !(D0.whatif && D0.whatif.available) || !Object.keys(D0.schedule).some(t => gamesOf(t).length)) return;
  sec.hidden = false;
  const pc = p => p >= 0.9995 ? ">99.9%" : p < 0.0005 ? "<0.1%" : (p * 100).toFixed(1) + "%";
  const avs = D0.avatars || {};
  const pic = t => avs[t] ? `<img class="hs" src="${avs[t]}" alt="" loading="lazy">` : `<span class="hs av">${t[0].toUpperCase()}</span>`;
  const game = (t, w) => (D.schedule[t] || []).find(x => x[0] === w);
  const clip = v => Math.min(1, Math.max(0, Math.round(v * 1e4) / 1e4));
  const TANK = `<svg viewBox="0 0 24 24" aria-hidden="true" style="overflow: visible"><g transform="translate(-2.47 2.83) scale(0.135)"><g transform="rotate(-28 108 68)"><rect x="104" y="62" width="80" height="12" rx="6" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><rect x="180" y="58" width="12" height="20" rx="4" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><g fill="#c6cde6" opacity=".6"><circle cx="207" cy="58" r="7"/><circle cx="216" cy="49" r="5.2"/><circle cx="204" cy="46" r="4"/></g></g></g><g transform="translate(-2.47 2.83) scale(0.135)"><rect x="22" y="96" width="156" height="46" rx="23" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><g fill="var(--amber)"><circle cx="50" cy="119" r="8.6"/><circle cx="80" cy="119" r="8.6"/><circle cx="110" cy="119" r="8.6"/><circle cx="140" cy="119" r="8.6"/></g><path d="M46 90a40 38 0 0 1 80 0z" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><rect x="40" y="88" width="92" height="10" rx="5" fill="#1c2546" stroke="var(--cyan)" stroke-width="9"/><circle cx="73" cy="68" r="9" fill="var(--cyan-text)"/><circle cx="99" cy="68" r="9" fill="var(--cyan-text)"/><circle cx="63" cy="79" r="7" fill="#ff80ad" opacity=".75"/><circle cx="109" cy="79" r="7" fill="#ff80ad" opacity=".75"/><path class="sm" d="M80 78q6 6 12 0" stroke="var(--cyan-text)" stroke-width="7" fill="none" stroke-linecap="round"/><path class="fr" d="M74 90q12-13 24 0" stroke="var(--cyan-text)" stroke-width="7" fill="none" stroke-linecap="round"/><path class="fr" d="M60 58l18-7M112 58l-18-7" stroke="var(--cyan-text)" stroke-width="6" fill="none" stroke-linecap="round"/><path class="tear t1" d="M70 76q-12 17 0 27q12-10 0-27z" fill="#8fe3ff"/><path class="tear t2" d="M102 76q-12 17 0 27q12-10 0-27z" fill="#8fe3ff"/></g></svg>`;
  const CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9.5 17h5"/></svg>';
  const picks = {};
  const card = $i("im-card"), gate = $i("im-gate");
  let ready = false, starting = false;
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>';
  const gateIdle = err => {
    gate.innerHTML = `<div class="im-gate-in"><button type="button" class="run-btn" id="im-go">${PLAY}Explore Matchups</button>` +
      `<div class="im-gate-sub">Flip losses to wins to see how your odds change. Takes about 5 seconds.</div>` + (err ? `<div class="err">${err}</div>` : "") + `</div>`;
  };
  function explore() {
    if (starting || ready) return;
    starting = true;
    gate.innerHTML = `<div class="im-bar" aria-live="polite"><span class="run-txt">Running 10,000 seasons…</span><span class="run-road"></span>` +
        `<span class="im-rays"></span><span class="im-cup">${CUP}</span>` +
        `<i class="im-rub"></i><i class="im-rub"></i><i class="im-rub"></i><i class="im-rub"></i>` +
        `<span class="im-me"><span class="im-body">${TANK}<svg class="im-crk" viewBox="0 0 40 40"><path class="c1" d="M12 27.5l-1.6 2.6 2 1.6-1.6 2.6"/><path class="c2" d="M-12.6 18l1.6 2.2-1.6 1.6 1.2 2.6"/><path class="c3" d="M-2.8 27.5l1.4 2.2-1.6 2 1.4 2.6M-16.5 28l1.6 2.2-1 2"/></svg></span></span></div>`;
    let ok = null;
    (window.impactPrepare ? window.impactPrepare() : Promise.resolve(false)).then(r => { ok = !!r; }, () => { ok = false; });
    const bar = gate.querySelector(".im-bar"), txt = bar.querySelector(".run-txt"), CYCLE = 1100, HIT = 0.55 * CYCLE;
    bar.classList.add("bash");
    const t0 = performance.now();
    let ending = 0;
    const tick = () => {
      const t = performance.now() - t0, hits = t < HIT ? 0 : Math.floor((t - HIT) / CYCLE) + 1;
      if (!ending) {
        for (let h = 1; h <= Math.min(hits, 3); h++) bar.classList.add("h" + h);
        if (hits >= 1) bar.classList.add("sad");
        if (ok === false) { starting = false; gateIdle("Couldn't load the seasons. Try again."); return; }
        if (hits >= 6) txt.textContent = "Almost done…";
        if (ok && hits >= 3 && t % CYCLE < 60) { ending = t; bar.classList.remove("bash"); bar.classList.add("end"); }
      } else if (t - ending >= 2000) {
        starting = false; ready = true; card.classList.remove("locked");
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  gate.addEventListener("click", e => { if (e.target.closest("#im-go")) explore(); });
  gateIdle();
  let calc = null, calcKey = null, busy = false, failed = false, seq = 0, lastRows = "", pendingKey = null;
  const mine = () => Object.entries(picks).filter(([k]) => k.split("|")[0] === hi)
    .map(([k, v]) => ({ week: +k.split("|")[1], team: hi, wins: v === "W" })).sort((x, y) => x.week - y.week);
  const movesNow = () => D === D0 ? "[]" : (window.movesInPlay ? window.movesInPlay() : "[]");
  const keyNow = () => movesNow() + JSON.stringify(mine());
  async function update() {
    const list = mine(), key = keyNow();
    if (busy && pendingKey === key) return;
    const my = ++seq;
    failed = false;
    if (!list.length || (calc && calcKey === key)) { busy = false; draw(); return; }
    pendingKey = key;
    busy = true; draw();
    let r = null;
    try { r = window.impactScenario ? await window.impactScenario(list, D !== D0) : null; } catch (e) { r = null; }
    if (my !== seq) return;
    busy = false;
    if (r) { calc = r; calcKey = key; } else failed = true;
    draw();
  }
  function draw() {
    const S = D.standings.find(r => r.team === hi) || {}, list = mine();
    const using = list.length && calc && calcKey === keyNow();
    const cols = [["playoff", "Playoffs"], ...((D0.byeTeams || 0) > 0 ? [["bye", "Bye"]] : []), ["top", "#1 Seed"], ["title", "Champ"]];
    sum.style.setProperty("--n", cols.length);
    const WHAT = { playoff: "to make the playoffs", bye: "to earn a first-round bye", top: "to finish as the #1 seed", title: "to win the title" };
    sum.innerHTML = cols.map(([k, label], j) => {
      const now = S[k] || 0;
      let v = now, c = "";
      if (using) {
        const d = calc.picked[hi][k] - calc.base[hi][k], p = Math.abs(d) < 0.01 ? Math.round(d * 1000) / 10 : Math.round(d * 100);
        v = clip(now + d);
        if (p) c = `<span class="chg ${p > 0 ? "good" : "bad"}">(${p > 0 ? "+" : "−"}${Math.abs(p)})</span>`;
      }
      const wait = list.length && !using && busy ? '<span class="im-wait">…</span>' : "";
      const od = p => p <= 0 ? "0%" : odds(p);
      return `<div class="tile${j % 3 === 0 ? " acc" : j === 1 ? " alt" : ""}"><div class="k">${label}</div><div class="v">${od(v)}${c}${wait}</div>` +
        `<div class="d">${using ? `${od(now)} before your picks` : WHAT[k]}</div></div>`;
    }).join("");
    reset.hidden = !list.length;
    note.hidden = !(failed || D !== D0);
    note.textContent = failed ? "Couldn't work out the odds with those results. Try again." : "Trade analyzer on: the odds with your moves.";
    const G = gamesOf(hi);
    sec.hidden = !G.length;
    const html = G.map(g => {
      const w = g[0], other = g[1], s = game(hi, w), live = w === D0.liveWeek;
      const proj = s ? `${Math.round(s[2])}–${Math.round(s[3])}` : "—", win = s ? `<b class="${s[4] >= 0.5 ? "fav" : "dog"}">${Math.round(s[4] * 100)}%</b>` : "—";
      return `<div class="im-row"><span class="im-wk${live ? " live" : ""}" title="Week ${w}${live ? " (in progress)" : ""}"><span class="lbl">${live ? "LIVE" : "WK"}</span>` +
        `<span class="n">${w}</span></span><span class="im-vs">vs</span>` +
        `${pic(other)}<span class="im-opp"><span class="nm">${other}</span><span class="sub">${proj} proj · ${win} to win</span></span>` +
        `<span class="im-c im-proj">${proj}</span><span class="im-c im-win">${win}</span>` +
        `<button type="button" class="im-sw" data-wk="${w}"><span class="kn"></span><span class="o ow">W</span><span class="o ol">L</span></button></div>`;
    }).join("");
    const head = `<div class="im-head"><span class="im-h-wk">Wk</span><span class="im-h-opp">Opponent</span><span class="im-c">Proj.</span><span class="im-c">Win</span><span class="im-h-res">Result</span></div>`;
    if (head + html !== lastRows) { host.innerHTML = head + html; lastRows = head + html; }
    host.querySelectorAll(".im-sw").forEach(b => {
      const w = +b.dataset.wk, s = game(hi, w), pred = !s || s[4] >= 0.5 ? "W" : "L", set = picks[`${hi}|${w}`], on = set || pred;
      b.className = `im-sw ${on === "W" ? "w" : "l"}${set ? " set" : ""}`;
      b.setAttribute("aria-pressed", String(!!set));
      b.setAttribute("aria-label", `Week ${w}: ${on === "W" ? "win" : "loss"}${set ? " (set by you; tap for our prediction)" : " (our prediction; tap to flip)"}`);
    });
  }
  host.addEventListener("click", e => {
    const b = e.target.closest(".im-sw"); if (!b || !ready) return;
    const k = `${hi}|${b.dataset.wk}`, s = game(hi, +b.dataset.wk), pred = !s || s[4] >= 0.5 ? "W" : "L";
    if (picks[k]) delete picks[k]; else picks[k] = pred === "W" ? "L" : "W";
    update();
  });
  reset.addEventListener("click", () => { for (const k of Object.keys(picks)) if (k.split("|")[0] === hi) delete picks[k]; update(); });
  draw();
  onData.push(update); listeners.push(update);
})();

(() => {
  const P = D.played || {};
  const weeksOf = src => [...new Set(Object.values(src).flat().map(s => s[0]))].sort((a, b) => a - b);
  const past = weeksOf(P), future = weeksOf(D.schedule), weeks = past.concat(future);
  const right = s => s[5] !== s[6] && s[4] !== 0.5 && (s[4] > 0.5) === (s[5] > s[6]);
  const calls = Object.entries(P).flatMap(([t, gs]) => gs.filter(s => t < s[1] && s[4] !== 0.5 && s[5] !== s[6]));
  const nRight = calls.filter(right).length, nCalls = calls.length;
  const split = i => i === past.length && past.length ? " split" : "";
  document.getElementById("sched-head").innerHTML = (past.length ?
    `<tr><th class="team"></th><th colspan="${past.length}" class="grp">Played</th>` +
    (future.length ? `<th colspan="${future.length}" class="grp acc split">Remaining</th>` : "") + `<th colspan="2"></th></tr>` : "") +
    `<tr><th class="team">Team</th>` + weeks.map((w, i) => `<th class="${split(i).trim()}" style="text-align:center">Wk ${w}</th>`).join("") +
    `<th>Avg win %</th><th>Proj. wins left</th></tr>`;
  if (past.length) {
    const sw = c => `<svg width="14" height="14" aria-hidden="true"><rect width="14" height="14" rx="3" fill="${c}"/></svg>`;
    const k = document.getElementById("sched-key");
    k.innerHTML = `<span>Played weeks:</span><span>${sw("rgb(40 231 87 / .32)")}Favorite won</span><span>${sw("rgb(255 128 117 / .38)")}Missed prediction</span>` +
      `<span>Favorite won ${nRight} of ${nCalls}</span>`;
    k.hidden = false;
  }
  const shade = p => {
    const d = (p - 0.5) * 2, a = Math.abs(d) * 0.7;
    return d >= 0 ? `rgb(0 225 224 / ${a.toFixed(3)})` : `rgb(255 128 117 / ${a.toFixed(3)})`;
  };
  const RIGHT = "rgb(40 231 87 / .32)", WRONG = "rgb(255 128 117 / .38)";
  const body = document.getElementById("sched-rows");
  const scoresBtn = document.getElementById("sched-scores"), SCORES = `contendathon-${D0.league.id}-sched-scores`;
  try { scoresBtn.setAttribute("aria-checked", String(localStorage.getItem(SCORES) === "1")); } catch (e) {}
  scoresBtn.addEventListener("click", () => {
    const on = scoresBtn.getAttribute("aria-checked") !== "true";
    scoresBtn.setAttribute("aria-checked", String(on));
    try { localStorage.setItem(SCORES, on ? "1" : ""); } catch (e) {}
    render();
  });
  function render() {
    const scores = scoresBtn.getAttribute("aria-checked") === "true";
    body.innerHTML = byOdds().map(r => {
      const games = Object.fromEntries((D.schedule[r.team] || []).map(s => [s[0], s]));
      const before = Object.fromEntries((D0.schedule[r.team] || []).map(s => [s[0], s]));
      const done = Object.fromEntries((P[r.team] || []).map(s => [s[0], s]));
      const ps = Object.values(games).map(s => s[4]), ps0 = Object.values(before).map(s => s[4]);
      const sum = a => a.reduce((x, y) => x + y, 0);
      const avg = ps.length ? sum(ps) / ps.length : 0, avg0 = ps0.length ? sum(ps0) / ps0.length : 0;
      const r0 = D0.standings.find(x => x.team === r.team) || r, left = x => Math.max(0, x.projW - x.w - x.t / 2);
      return `<tr data-team="${r.team}"><td class="team">${r.team}</td>` + weeks.map((w, i) => {
        const s = i < past.length ? done[w] : games[w];
        if (!s) return `<td class="cell muted${split(i)}">—</td>`;
        const [, opp, me, them, p] = s;
        let bg = shade(p), title = `Week ${w}: ${r.team} ${f1(me)} vs ${opp} ${f1(them)}`, sc = scores ? `<span class="s">${f1(me)}-${f1(them)}</span>` : "";
        if (i < past.length) {
          const [, , , , , pf, opf] = s, decided = pf !== opf && p !== 0.5;
          bg = !decided ? "transparent" : right(s) ? RIGHT : WRONG;
          sc = scores ? `<span class="s">${pf > opf ? "W" : pf < opf ? "L" : "T"} - ${f1(pf)}-${f1(opf)}</span>` : "";
          title = `Week ${w}: ${pf > opf ? "won" : pf < opf ? "lost" : "tied"} ${f1(pf)}–${f1(opf)} vs ${opp}. ` +
            `Before kickoff: projected ${f1(me)}–${f1(them)}, ${Math.round(p * 100)}% to win` +
            (decided ? ` (projection ${right(s) ? "right" : "wrong"})` : "");
        }
        return `<td class="cell${i < past.length ? " past" : ""}${opp === hi ? " opp-hi" : ""}${split(i)}" title="${title}"><div style="background:${bg}">` +
          `<span class="o">${opp}</span><span class="p">${Math.round(p * 100)}%${i < past.length ? "" : chgP(p, (before[w] || [])[4])}</span>${sc}</div></td>`;
      }).join("") + `<td class="sos">${Math.round(avg * 100)}%${chgP(avg, avg0)}</td><td>${left(r).toFixed(1)}${chg(left(r), left(r0))}</td></tr>`;
    }).join("");
    body.querySelectorAll("tr").forEach(tr => {
      tr.classList.toggle("on", tr.dataset.team === hi);
      tr.addEventListener("click", () => pick(tr.dataset.team));
    });
  }
  listeners.push(render);
})();

(() => {
  let L = D.leaders;
  const PAGE = 50;
  const [w0, w1] = D.rosWeeks || [0, 0];
  const COLS = [
    { k: "rank", label: "#", num: true, sortable: false },
    { k: 0, label: "Player", left: true },
    { k: 1, label: "Pos", left: true, fold: true },
    { k: 2, label: "NFL", left: true, fold: true },
    { k: 3, label: "Owner", left: true, fold: true },
    { k: 4, label: `Pts, wks 1–${D.lastFinal}`, sm: "Pts", num: true },
    { k: 6, label: `Projected, wks ${w0}–${w1}`, sm: "Proj.", num: true },
    { k: 8, label: "Per game", sm: "/gm", num: true },
    { k: 14, label: "Weekly range (80%)", num: true, x: true },
    { k: 10, label: "Season", num: true },
    { k: 9, label: "Playoffs", sm: "Plyf", num: true, x: true },
  ];
  const q = document.getElementById("ld-q"), selPos = document.getElementById("ld-pos"),
        selNfl = document.getElementById("ld-nfl"), selOwner = document.getElementById("ld-owner");
  const opts = (vals, all) => `<option value="">${all}</option>` + vals.map(v => `<option value="${v}">${v}</option>`).join("");
  const ci = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });
  selPos.innerHTML = opts(["QB", "RB", "WR", "TE", "K", "DEF"].filter(p => L.some(r => r[1] === p)), "All positions");
  selNfl.innerHTML = opts([...new Set(L.map(r => r[2]))].sort(ci), "All teams");
  selOwner.innerHTML = `<option value="">Everyone</option><option value="__rostered">Rostered only</option><option value="__fa">Free agents</option>` +
    [...teams].sort(ci).map(t => `<option value="${t}">${t}</option>`).join("");
  let sortK = 10, dir = -1, shown = PAGE;
  const head = document.getElementById("ld-head"), body = document.getElementById("ld-rows"),
        count = document.getElementById("ld-count"), more = document.getElementById("ld-more");
  function drawHead() {
    const arrow = k => k === sortK ? (dir > 0 ? " ▲" : " ▼") : "";
    const folded = COLS.filter(c => c.fold);
    head.innerHTML = "<tr>" + COLS.filter(c => !c.fold).map(c => {
      if (c.k === 0)
        return `<th class="left team"${[0, ...folded.map(f => f.k)].includes(sortK) ? ` aria-sort="${dir > 0 ? "ascending" : "descending"}"` : ""}>` +
          [c, ...folded].map((f, j) => `<span class="sortk${f.k === sortK ? " on" : ""}${j ? " fk" : ""}" data-k="${f.k}" tabindex="0" role="button">${f.label}${arrow(f.k)}</span>`)
            .join(`<span class="fk sep"> · </span>`) + `</th>`;
      const cls = [c.sortable === false ? "" : "sort", c.left ? "left" : "", c.x ? "c-x" : ""].filter(Boolean).join(" ");
      const s = (cls ? ` class="${cls}"` : "") + (c.sortable === false ? "" : ` data-k="${c.k}" tabindex="0"` +
        (c.k === sortK ? ` aria-sort="${dir > 0 ? "ascending" : "descending"}"` : ""));
      return `<th${s}>${c.sm ? `<span class="lg">${c.label}</span><span class="sm">${c.sm}</span>` : c.label}</th>`;
    }).join("") + "</tr>";
    head.querySelectorAll("th.sort, .sortk").forEach(th => {
      const go = () => { const k = +th.dataset.k; dir = k === sortK ? -dir : (COLS.find(c => c.k === k).left ? 1 : -1); sortK = k; shown = PAGE; render(); };
      th.addEventListener("click", go);
      th.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }
  function render() {
    L = D.leaders;
    drawHead();
    const term = q.value.trim().toLowerCase(), pos = selPos.value, nfl = selNfl.value, own = selOwner.value;
    const rows = L.filter(r => (!term || r[0].toLowerCase().includes(term)) && (!pos || r[1] === pos) && (!nfl || r[2] === nfl) &&
      (!own || (own === "__rostered" ? r[3] : own === "__fa" ? !r[3] : r[3] === own)));
    const txt = typeof L[0]?.[sortK] === "string";
    rows.sort((a, b) => (txt ? ci(a[sortK] || "~", b[sortK] || "~") : a[sortK] - b[sortK]) * dir || b[10] - a[10]);
    count.textContent = `${rows.length.toLocaleString()} player${rows.length === 1 ? "" : "s"}`;
    body.innerHTML = rows.slice(0, shown).map((r, i) => {
      const lg = t => t && D.logos[t] ? `<img class="tm" src="${D.logos[t]}" alt="">` : "";
      const sub = `<span class="r-sub"><b class="${r[1]}">${r[1]}</b> ${lg(r[2])}${r[2]} · <span class="own">${r[3] || "Free agent"}</span></span>`;
      return `<tr class="${r[3] ? "" : "fa"}${r[3] && r[3] === hi ? " on" : ""}" data-team="${r[3]}"><td>${i + 1}</td><td class="team"><span class="pl">${headshot(r[15])}<span class="pl-t"><span class="r-nm">${r[0]}</span>${sub}</span></span></td>` +
        `<td>${f1(r[4])}</td><td>${f1(r[6])}</td>` +
        `<td>${f1(r[8])}</td><td class="c-x">${r[11] ? `<span class="ld-range" data-i="${L.indexOf(r)}">${f1(r[12])}–${f1(r[14])}</span>` : "—"}</td>` +
        `<td class="big">${f1(r[10])}</td><td class="c-x">${f1(r[9])}</td></tr>`;
    }).join("") || `<tr><td class="left" colspan="${COLS.filter(c => !c.fold).length}">No players match.</td></tr>`;
    body.querySelectorAll("tr[data-team]").forEach(tr => { if (tr.dataset.team) tr.addEventListener("click", () => pick(tr.dataset.team)); });
    body.querySelectorAll(".ld-range").forEach(sp => {
      sp.addEventListener("pointerenter", ev => showTip(L[+sp.dataset.i], ev));
      sp.addEventListener("pointermove", ev => placeTip(ev));
      sp.addEventListener("pointerleave", () => tip.style.display = "none");
    });
    more.hidden = rows.length <= shown;
    more.textContent = `Show ${Math.min(PAGE, rows.length - shown)} more`;
  }
  const tip = document.createElement("div");
  tip.className = "tip"; tip.id = "ld-tip"; document.body.appendChild(tip);
  const pc = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v * 100)) + "%";
  function showTip(r, ev) {
    const b = r[11];
    if (!b) return;
    const pts = v => f1(Math.max(0, r[8] * (1 + v)));
    tip.innerHTML = `<div class="h">${r[0]} · ${r[8].toFixed(1)} projected per game</div>` +
      `<div class="r"><span>Based on</span><span>~${b.weeks.toLocaleString()} weeks of ${r[1]}s projected near him, ${D.model.historySeasons[0]}–${String(D.season).slice(2)}</span></div>` +
      `<div class="r"><span>Beats projection</span><span>${Math.round(b.beat * 100)}% of weeks</span></div>` +
      `<div class="r"><span>Bad week (10th pct)</span><span>${pc(b.p10)} · ${pts(b.p10)}</span></div>` +
      `<div class="r"><span>Typical week (median)</span><span>${pc(b.median)} · ${pts(b.median)}</span></div>` +
      `<div class="r on"><span>Big week (90th pct)</span><span>${pc(b.p90)} · ${pts(b.p90)}</span></div>` +
      `<div class="r"><span>Scored 0 or less</span><span>${Math.round(b.zero * 100)}% of weeks</span></div>`;
    tip.style.display = "block"; placeTip(ev);
  }
  function placeTip(ev) {
    const x = ev.clientX + 16, y = ev.clientY + 16;
    tip.style.left = Math.min(x, window.innerWidth - tip.offsetWidth - 8) + "px";
    tip.style.top = (y + tip.offsetHeight > window.innerHeight ? ev.clientY - tip.offsetHeight - 12 : y) + "px";
  }
  more.addEventListener("click", () => { shown += PAGE; render(); });
  [q, selPos, selNfl, selOwner].forEach(e => e.addEventListener("input", () => { shown = PAGE; render(); }));
  listeners.push(render);
})();

(() => {
  const SLOT_LABEL = D.league.slotLabels;
  const selTeam = document.getElementById("sel-team"), selWeek = document.getElementById("sel-week");
  const byName = [...teams].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  selTeam.innerHTML = byName.map(t => `<option value="${t}">${t}</option>`).join("");
  const weeks = [...Array.from({ length: D.lastWeek }, (_, i) => i + 1), ...(D.playoffWeeks || [])];
  const wkKind = w => w > D.lastWeek ? "playoffs, projected" : w === D.liveWeek ? "in progress" : w <= D.lastActual ? "actual" : "projected";
  selWeek.innerHTML = weeks.map(w => `<option value="${w}">Week ${w} · ${wkKind(w)}</option>`).join("");
  const liveWeek = D.liveWeek;
  const weekByDate = (() => {
    if (!D.seasonStart) return null;
    const t = new Date(D.seasonStart + "T00:00:00");
    t.setDate(t.getDate() - (t.getDay() + 5) % 7);
    return Math.max(1, Math.floor((Date.now() - t) / 6048e5) + 1);
  })();
  selWeek.value = String(weekByDate ? Math.min(weekByDate, weeks[weeks.length - 1]) : D.lastActual);
  if (!selWeek.value) selWeek.value = String(D.lastActual);
  selTeam.addEventListener("change", () => pick(selTeam.value));
  selWeek.addEventListener("change", render);
  const num = v => v == null ? "—" : f1(v);

  const faces = () => [selTeam, selWeek].forEach(s => {
    const o = s.options[s.selectedIndex];
    document.getElementById(s.id + "-face").textContent = o ? o.text : "";
  });
  function render() {
    selTeam.value = hi;
    faces();
    const w = +selWeek.value, wk = (window.tradeWeek && window.tradeWeek(hi, w)) || (D.rosters[hi] || {})[w];
    const head = document.getElementById("roster-head"), body = document.getElementById("roster-rows");
    const summary = document.getElementById("wk-summary");
    if (!wk) { head.innerHTML = ""; body.innerHTML = `<tr><td class="left">No data for this week.</td></tr>`; summary.textContent = ""; return; }
    const actual = wk.kind === "actual";
    const tank = !!document.getElementById("rosters-sec").closest("#tab-tank") && ((D0.tank && D0.tank.metric) || "max_pf") === "max_pf";
    const plain = !!document.getElementById("rosters-sec").closest("#tab-tank") && !tank;
    const tankLive = tank && w === liveWeek;
    document.getElementById("info-7-tank").hidden = !tank;
    document.getElementById("key-sel-txt").textContent = tank ? (actual ? "Max PF lineup" : tankLive ? "Max PF lineup (projections for games not yet played)" : "Best lineup by projections (max PF)")
      : actual || wk.live ? "Started lineup" : "Best lineup by projections";
    const vs = wk.opp ? ` vs ${wk.opp}` : "";
    const game = (D.schedule[hi] || []).find(s => s[0] === w);
    const opp = wk.opp && D.rosters[wk.opp] ? D.rosters[wk.opp][w] : null;
    if (wk.traded && !tank) {
      summary.innerHTML = `Week ${w}${vs} · <b>after the moves</b> · simulated avg <b>${f1(wk.pfAdj)}</b><br>80% of simulations: ${Math.round(wk.rng[0])}–${Math.round(wk.rng[1])}`;
    } else if (tank) {
      const tm = wk.tankMax;
      summary.innerHTML = !tm ? `Week ${w} · playoffs: not part of the max PF race`
        : tankLive && tm.length === 3 ? `Week ${w} · max PF so far <b>${f1(wk.tankSoFar)}</b> → sim avg <b>${f1(tm[0])}</b>`
        : tm.length === 3 ? `Week ${w} · simulated max PF <b>${f1(tm[0])}</b><br>80% of simulations: ${Math.round(tm[1])}–${Math.round(tm[2])}`
        : wk.live || wk.rows.some(r => r[7]) ? `Week ${w} · max PF <b>${f1(tm[0])}</b><br>actual points so far, projections for games not yet played`
        : wk.projMax != null ? `Week ${w} · projected max PF <b>${f1(wk.projMax)}</b> → max PF <b>${f1(tm[0])}</b>`
        : `Week ${w} · max PF <b>${f1(tm[0])}</b>`;
    } else if (actual) {
      const res = opp ? (wk.pfAdj > opp.pfAdj ? "W" : wk.pfAdj < opp.pfAdj ? "L" : "T") + ` ${f1(wk.pfAdj)}–${f1(opp.pfAdj)}` : "";
      const live = wk.rows.some(r => r[7]);
      const pre = ((D.played || {})[hi] || []).find(g => g[0] === w);
      summary.innerHTML = live ? `Week ${w}${vs} · points <b>${f1(wk.pfAdj)}</b><br>includes projections for games not yet played`
        : `Week ${w}${vs}` + (pre ? ` · proj. points <b>${f1(pre[2])}</b>` : "") + ` → points <b>${f1(wk.pfAdj)}</b>`;
    } else if (wk.live && wk.pfSoFar != null) {
      summary.innerHTML = `Week ${w}${vs} · points so far <b>${f1(wk.pfSoFar)}</b> → sim avg <b>${f1(wk.pfAdj)}</b>` +
        (game ? `<br>${Math.round(game[4] * 100)}% to win` : "");
    } else if (wk.kind === "playoff") {
      const where = wk.opp ? `${wk.stage} vs ${wk.opp} · ${Math.round(wk.winP * 100)}% to win`
        : wk.stage ? wk.stage : "not in the projected bracket this week";
      summary.innerHTML = `Week ${w} · simulated avg <b>${f1(wk.pfAdj)}</b><br>${where}`;
    } else {
      summary.innerHTML = `Week ${w}${vs} · simulated avg <b>${f1(wk.pfAdj)}</b><br>Sleeper Lineup Projects ${f1(wk.pfRaw)}` +
        (game ? ` · ${Math.round(game[4] * 100)}% to win` : "");
    }
    head.innerHTML = `<tr><th class="left"><span class="lg">${tank ? "Max PF slot" : actual || wk.live ? "Started" : "Proj. lineup"}</span><span class="sm">Slot</span></th><th class="left stick">Player</th><th class="left c-x">Pos</th><th class="left c-x">NFL</th><th class="ha c-x"></th><th class="left c-x">Opp</th>` +
      (wk.live ? `<th title="Live projection: points so far + his pre-game projection times the share of his game left (game over or not kicked off: his projection before kickoff)"><span class="lg">Projected</span><span class="sm">Proj.</span></th>`
        : `<th><span class="lg">Projected</span><span class="sm">Proj.</span></th>`) + `${actual ? `<th><span class="lg">Actual</span><span class="sm">Pts</span></th>`+"<th title='Where his score was likely to land, from his projection before kickoff (80% of the time)'><span class='lg'>80% range</span><span class='sm'>80%</span></th>"
        : (wk.live ? "<th title='Points so far; — until his game kicks off'><span class='lg'>Actual</span><span class='sm'>Pts</span></th>" : "") +
          "<th title='Where he lands in 80% of simulations'><span class='lg'>80% range</span><span class='sm'>80%</span></th>"}` +
      (tank ? `<th class="mid" title="${actual ? "In the lineup the team actually started" : "In the lineup the team is projected to start"}"><span class="lg">Started</span><span class="sm">Start</span></th>`
        : plain ? `<th class="mid" title="${actual ? "In the best lineup the roster could have started (orange: he sat on the bench)" : "In the best lineup by projections, the whole roster (orange: not in the lineup the team is projected to start)"}"><span class="lg">Best lineup</span><span class="sm">Best</span></th>`
        : `<th class="mid" title="${actual ? "In the max PF lineup: the best lineup the roster could have started (orange: he sat on the bench)" : "In the projected max PF lineup: the best lineup by projections, the whole roster (orange: not in the lineup the team is projected to start)"}"><span class="lg">Max PF</span><span class="sm">Max</span></th>`) + `</tr>`;
    const INJ_LABEL = { Questionable: "Q", Doubtful: "D", Out: "Out", Sus: "SUS" };
    let benchStarted = false;
    const ORDER = ["QB", "RB", "WR", "TE", "WRRB_FLEX", "REC_FLEX", "FLEX", "SUPER_FLEX", "K", "DEF", "Bench"];
    const slotOf = r => tank ? (r[16] || "Bench") : r[1];
    const rank = r => { const i = ORDER.indexOf(slotOf(r)); return i < 0 ? ORDER.length - 1.5 : i; };
    const rows = tank ? [...wk.rows].sort((a, b) => rank(a) - rank(b) || ((actual ? b[5] - a[5] : b[4] - a[4]) || 0)) : wk.rows;
    const projOf = r => wk.live && r[18] != null && !r[19] ? r[18] : r[4];
    const rowsHtml = rows.map(r => {
      const [pid, startSlot, nfl, bye, , act, optimal, est, tag, sMean, sLo, sHi, opp, home, inj, injPast] = r;
      const proj = projOf(r);
      const slot = slotOf(r);
      const logo = t => t && D.logos[t] ? `<img class="tm" src="${D.logos[t]}" alt="">` : "";
      const vs = opp ? (home ? "vs" : "@") : "";
      const oppCell = opp ? `${logo(opp)}${opp}` : bye ? `<span class="muted">Bye</span>` : "—";
      const [name, pos] = D.players[pid];
      const sel = slot !== "Bench";
      let cls = sel ? "sel" : "";
      if (!sel && !benchStarted) { cls += " first-bench"; benchStarted = true; }
      const injChip = inj ? `<span class="chip inj${/^(Questionable|Doubtful)$/.test(inj) ? " q" : ""}" title="${injPast ? `Didn't play this week${inj === "Out" ? "" : ` (${inj} at kickoff)`}` : `NFL injury report: ${inj}`}">${INJ_LABEL[inj] || inj}</span>` : "";
      const chips = (tag ? `<span class="chip${tag === "IR" ? " ir" : ""}" title="${tag === "IR" ? "In the team's IR slot" : "On the taxi squad"}">${tag} slot</span>` : "") + injChip + (bye ? `<span class="chip bye">Bye</span>` : "") +
        (est ? `<span class="chip">est.</span>` : "");
      const inMax = actual ? optimal : !!r[16] && r[16] !== "Bench";
      const lu = plain ? "the best lineup" : "the max PF lineup";
      const opt = inMax ? (sel ? "✓" : `<span class="miss" title="${actual ? `In ${lu}, but he sat on the bench` : `In ${lu}, but not in the lineup the team is projected to start`}">✓</span>`) : "";
      const startedCell = tank ? `<td class="mid">${r[17] ? "✓" : ""}</td>` : `<td class="mid">${opt}</td>`;
      const sub = `<span class="r-sub"><b class="${pos}">${pos}</b> ${nfl ? `${logo(nfl)}${nfl}` : `<span title="Not on an NFL team">FA</span>`}` +
        `${opp ? ` <span class="ha">${vs}</span> ${logo(opp)}${opp}` : bye ? " · Bye" : ""}</span>`;
      return `<tr class="${cls.trim()}"><td class="slot"><span class="pos ${slot}">${SLOT_LABEL[slot] || slot}</span></td><td class="left stick"><span class="pl">${headshot(pid)}<span class="pl-t"><span class="r-nm">${name}${chips}</span>${sub}</span></span></td>` +
        `<td class="left c-x"><span class="pos ${pos}">${pos}</span></td><td class="left c-x">${nfl ? `${logo(nfl)}${nfl}` : `<span class="muted" title="Not on an NFL team">FA</span>`}</td><td class="ha c-x">${vs}</td><td class="left c-x">${oppCell}</td><td>${bye ? "—" : num(proj)}</td>` +
        (actual ? `<td>${num(act)}</td><td class="muted">${bye || sMean == null ? "—" : `${Math.round(sLo)}–${Math.round(sHi)}`}</td>`
          : (wk.live ? `<td>${num(act)}</td>` : "") +
            `<td class="muted">${bye || sMean == null ? "—" : `${Math.round(sLo)}–${Math.round(sHi)}`}</td>`) + startedCell + `</tr>`;
    });
    const lineup = rows.filter(r => slotOf(r) !== "Bench");
    const shown = v => v == null ? 0 : Math.sign(v) * Math.round(Math.abs(v) * 10 + 1e-9) / 10;
    const sum = i => lineup.reduce((s, r) => s + ((i === 4 ? (r[3] ? 0 : shown(projOf(r))) : r[i]) || 0), 0);
    const rngOf = tank ? wk.tankLineup : wk.rng;
    const teamRange = rngOf ? `${Math.round(rngOf[0])}–${Math.round(rngOf[1])}` : "—";
    const totalRow = `<tr class="total"><td class="slot"></td><td class="left stick">${actual ? (tank ? "Max PF lineup total" : "Lineup total") : "Proj. Total"}</td><td class="c-x" colspan="4"></td><td>${f1(sum(4))}</td>` +
      (actual ? `<td>${f1(sum(5))}</td><td title="${tank ? "Max PF 80% range before kickoff: the whole roster simulated from its projections, the best lineup picked in each simulation" : "The team's own 80% range before kickoff"}">${teamRange}</td>`
        : (wk.live ? `<td>${f1(sum(5))}</td>` : "") + `<td title="${tank ? "Max PF 80% range before kickoff: the whole roster simulated from its projections, the best lineup picked in each simulation"
          : wk.live ? "The team's own 80% range before kickoff" : "The team's own 80% range in the simulations"}">${teamRange}</td>`) +
      "<td></td></tr>";
    let empties = 0;
    const emptyRows = [];
    if ((actual || wk.live) && D.lineup && D.lineup.stages) {
      const set = tank ? wk.rows.filter(r => r[17]) : lineup, used = {};
      set.forEach(r => { used[r[1]] = (used[r[1]] || 0) + 1; });
      const missing = [];
      D.lineup.stages.forEach(([sl, , n]) => { for (let k = (used[sl] || 0); k < n; k++) missing.push(sl); });
      missing.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).forEach(sl => {
        const html = `<tr class="sel empty" title="Left empty: no player was started in this spot"><td class="slot"><span class="pos ${sl}">${SLOT_LABEL[sl] || sl}</span></td>` +
          `<td class="left stick"><span class="pl"><img class="hs" alt="" src="${NO_PHOTO}"><span class="pl-t"><span class="r-nm muted">Empty</span>` +
          `<span class="r-sub">No player started</span></span></span></td><td class="c-x" colspan="4"></td><td>—</td>` +
          `<td>${num(0)}</td><td class="muted">—</td><td class="mid">${tank ? "✓" : ""}</td></tr>`;
        if (tank) emptyRows.push(html);
        else rowsHtml.splice(lineup.filter(r => ORDER.indexOf(r[1]) <= ORDER.indexOf(sl)).length + empties, 0, html);
        empties++;
      });
    }
    if (tank) rowsHtml.splice(lineup.length, 0, totalRow, ...emptyRows);
    else rowsHtml.splice(lineup.length + empties, 0, totalRow);
    const cols = head.querySelectorAll("th").length;
    if (rows.length > lineup.length) rowsHtml.splice(lineup.length + empties + 1, 0, `<tr class="grp"><td colspan="${cols}">Bench</td></tr>`);
    body.innerHTML = rowsHtml.join("");
  }
  listeners.push(render);
  window.addEventListener("rosters-tab", render);
})();
listeners.push(() => {
  const me = S[hi], b = S0[hi], top = D.standings[0], fav = [...D.standings].sort((a, b) => b.top - a.top)[0];
  const gap = me.team === top.team ? `Leads by ${f1(me.final - D.standings[1].final)}` : `${f1(top.final - me.final)} behind #1`;
  document.getElementById("tiles").innerHTML =
    `<div class="tile acc"><div class="k">Projected Points For</div><div class="v">#${me.rank}</div><div class="d">${f1(me.final)}${chg(me.final, b.final)} - ${gap}</div></div>` +
    `<div class="tile alt"><div class="k">Playoff Chance</div><div class="v">${odds(me.playoff)}${chgP(me.playoff, b.playoff)}</div><div class="d">${projRec(me)}${chg(me.projW, b.projW)} proj. record</div></div>` +
    `<div class="tile"><div class="k">Likeliest #1 seed</div><div class="v name${fav.team === hi ? " me" : ""}">${fav.team}</div><div class="d">${odds(fav.top)}${chgP(fav.top, S0[fav.team].top)} to finish #1</div></div>` +
    `<div class="tile acc"><div class="k">Projected points leader</div><div class="v name${top.team === hi ? " me" : ""}">${top.team}</div><div class="d">${f1(top.final)}${chg(top.final, S0[top.team].final)} projected points</div></div>`;
  document.querySelectorAll(".hiname").forEach(e => e.textContent = hi);
  document.querySelectorAll("#pf-rows tr, #odds-rows tr").forEach(tr => tr.classList.toggle("on", tr.dataset.team === hi));
  const hit = new Set(window.tradeTeams ? window.tradeTeams() : []);
  document.querySelectorAll("#pf-rows tr, #odds-rows tr, #sched-rows tr, #tank-rows tr, #slot-rows tr").forEach(tr => tr.classList.toggle("tr-hit", hit.has(tr.dataset.team)));
});
(() => {
  if (!D0.tank) return;
  const Dr0 = D0.tank.draft, n = Dr0.order.length, T0S = Object.fromEntries(D0.tank.standings.map(r => [r.team, r]));
  const share = p => p >= 0.995 ? ">99%" : p < 0.005 ? (p > 0.00005 ? "<1%" : "—") : Math.round(p * 100) + "%";
  const lw = D0.tank.liveWeek;
  const lastA = lw ? lw - 1 : D0.lastActual, hd = (id, lg, sm, tip) => { const h = document.getElementById(id); h.innerHTML = `<span class="lg">${lg}</span><span class="sm">${sm}</span>`; if (tip) h.title = tip; };
  hd("tank-h-sofar", "Act.", "Act.", lastA > 0 ? RW.soFar(lastA) : "No week is over yet");
  if (lw) hd("tank-h-wk", `Proj.<br>Wk ${lw}`, `Proj.<br>Wk ${lw}`, RW.wk(lw));
  else document.getElementById("tank-h-wk").remove();
  const tankRows = document.getElementById("tank-rows"), slotRows = document.getElementById("slot-rows");
  [tankRows, slotRows].forEach(tb => tb.addEventListener("click", e => { const tr = e.target.closest("tr[data-team]"); if (tr) pick(tr.dataset.team); }));
  const nf = RW.sfx ? v => v == null ? "—" : v.toFixed(1) : f1d, recK = REC_LIKE(RACE_K);
  if (recK) { document.getElementById("tank-h-projw").hidden = false; document.getElementById("maxpf-table").classList.add("rec");
    document.getElementById("tank-h-final").innerHTML = "Proj.<br>W–L"; }
  const wkWL = t => { const g = (D.schedule[t] || []).find(x => x[0] === lw); return !g ? "—" : g[4] >= 0.5 ? '<span class="wl-w">W</span>' : '<span class="wl-l">L</span>'; };
  onData.push(() => {
    const T = D.tank, lowest = T.standings[0].final;
    tankRows.innerHTML = T.standings.map(r => {
      const b = T0S[r.team];
      return `<tr data-team="${r.team}"><td><span class="rk r${r.rank}">${r.rank}</span></td><td class="team">${r.team}${ownerSub(r.team)}</td><td class="big prec">${recK ? r.rec : nf(r.final) + chg(r.final, b.final, -1)}</td>` + (recK ? `<td class="projw">${nf(r.final)}${chg(r.final, b.final, -1)}</td>` : "") +
        `<td class="back">${recK ? (r.recW === T.standings[0].recW ? "—" : "+" + (r.recW - T.standings[0].recW)) : r.final === lowest ? "—" : "+" + nf(r.final - lowest)}</td><td class="brk">${r.wl != null ? r.wl : f1d(r.toDate)}</td>` + (lw ? `<td>${recK ? wkWL(r.team) : nf(r.wkProj) + chg(r.wkProj, b.wkProj, -1)}</td>` : "") +
        [0, 1, 2].map(i => `<td class="${i ? "" : "brk"}">${share(T.draft.odds[r.team][i])}${chgP(T.draft.odds[r.team][i], Dr0.odds[r.team][i])}</td>`).join("") + `</tr>`;
    }).join("");
  });

  const board = document.getElementById("board"), avatars = D0.avatars || {};
  board.style.setProperty("--cols", n);
  const av = (t, cls = "") => avatars[t] ? `<img class="${cls}" src="${avatars[t]}" alt="">` : `<span class="av ${cls}">${t[0].toUpperCase()}</span>`;
  const mixed = Dr0.rookieSources.length > 1;
  const nRanked = Dr0.rows.filter(r => r.rookie).length;
  const tag = src => !mixed ? "" : /honorable/i.test(src || "") ? `<span class="tag" title="${src}">HM</span>` : "";
  const BKEY = `contendathon-${D0.league.id}-board`, bsw = document.getElementById("board-sw");
  let one = (() => { try { return (localStorage.getItem(BKEY) || Dr0.boardDefault) === "1qb"; } catch (e) { return Dr0.boardDefault === "1qb"; } })();
  if (Dr0.has1qb) {
    bsw.hidden = false; bsw.setAttribute("aria-checked", String(one));
    bsw.addEventListener("click", () => {
      one = !one; bsw.setAttribute("aria-checked", String(one));
      try { localStorage.setItem(BKEY, one ? "1qb" : "sf"); } catch (e) {}
      renderBoard();
    });
  } else one = false;
  document.getElementById("draft-h").textContent = `Projected ${Dr0.season}${Dr0.rookieSources.length ? " SF" : ""} rookie draft`;
  document.getElementById("board-src").hidden = !Dr0.rookieSources.length;
  if (Dr0.rookieAsOf) {
    const [, mo, dd] = Dr0.rookieAsOf.split("-").map(Number);
    const M = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][mo - 1];
    const th = dd % 100 >= 11 && dd % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][dd % 10] || "th";
    document.querySelector("#board-src .src-date").textContent = ` as of ${M} ${dd}${th}`;
  }
  const finishers = ["the champion", "runner-up", "3rd place", "4th place"].slice(0, Dr0.finishers).reverse().join(", ");
  {
    const NP = { max_pf: "lowest max PF", pf: "fewest points", record: "worst record", toilet_bowl: "toilet bowl result", consolation: "consolation bracket result" };
    const PO = { seed: "by seed, worst first", finish: "by the round they go out", finish_max_pf: "by the round they go out (ties: lowest max PF)", finish_pf: "by the round they go out (ties: fewest points for)" };
    const order = Dr0.rule === "elimination"
      ? `Non-playoff teams pick first (${NP[Dr0.nonplayoff] || NP.max_pf} first), then playoff teams ${PO[Dr0.playoffBy] || PO[Dr0.firstRoundBy === "max_pf" ? "finish_max_pf" : "finish"]}; the champion picks last.`
      : Dr0.rule === "first_round" ? "Non-playoff teams and first-round losers pick first (lowest max PF first); the champion picks last."
      : Dr0.finishers ? `Lowest max PF picks first; the top ${Dr0.finishers} finishers pick last.` : "Lowest max PF picks first.";
    document.getElementById("info-t3").textContent = `The most likely draft order. ${order}` +
      (Dr0.rookieSources.length ? " Players go in ranking order, not predictions." : "") +
      (Dr0.has1qb ? " 1QB switch: the same list with QBs moved down (about a round)." : "");
  }
  document.getElementById("board-key").innerHTML =
    (Dr0.rookieSources.length ? ["QB", "RB", "WR", "TE"].map(p => `<span><svg width="14" height="10"><rect width="14" height="10" rx="2" fill="var(--pos-${p.toLowerCase()})"/></svg>${p}</span>`).join("") : "") +
    (mixed && Dr0.rookieSources.some(s => /honorable/i.test(s)) ? `<span><b class="tag-k">HM</b> honorable mention (random order)</span>` : "") +
    `<span><svg width="14" height="10"><rect x="1" y="1" width="12" height="8" rx="2" fill="none" stroke="var(--text-primary)" stroke-width="2"/></svg>Owned by <b class="hiname"></b></span>`;
  board.addEventListener("click", e => { const h = e.target.closest(".bh"); if (h) pick(h.dataset.team); });
  function renderBoard() {
    const Dr = D.tank.draft, cell = Object.fromEntries(Dr.rows.map(r => [`${r.round}-${r.slot}`, r]));
    let html = `<div></div>` + Dr.order.map((t, i) =>
      `<div class="bh${t === hi ? " on" : ""}" data-team="${t}">${av(t)}<span class="nm">${t}</span><span class="sub">Slot ${i + 1} · ${share(Dr.odds[t][i])}</span></div>`).join("");
    for (let r = 1; r <= Dr.rounds; r++) {
      html += `<div class="rl">R${r}</div>`;
      for (let k = 1; k <= n; k++) {
        const c0 = cell[`${r}-${k}`];
        const c = one ? { ...c0, rookie: c0.rookie1, rookie_pos: c0.rookie1_pos, rookie_school: c0.rookie1_school, rookie_source: "" } : c0;
        const parts = (c.rookie || "").split(" "), first = parts[0], last = parts.slice(1).join(" ") || first;
        const own = c.traded ? `<div class="own tr" title="${c.pick}: ${c.original}'s pick, owned by ${c.owner}">${av(c.owner)}<span class="nm">${c.owner}</span></div>` : "";
        html += c.rookie
          ? `<div class="pk ${c.rookie_pos}${tag(c.rookie_source) ? " tagged" : ""}${c.owner === hi ? " mine" : ""}" title="${c.pick} ${c.rookie} (${c.rookie_pos}, ${c.rookie_school}) — ${c.owner}${c.traded ? ` via ${c.original}` : ""}\n${c.rookie_source}">` +
            `<span class="no">${c.pick}</span><span class="fn">${last === first ? "" : first}</span><span class="ln">${last}</span>` +
            `<span class="mt">${tag(c.rookie_source)}${c.rookie_pos} · ${c.rookie_school}</span>${own}</div>`
          : Dr0.rookieSources.length
            ? `<div class="pk empty${c.owner === hi ? " mine" : ""}" title="No ranked prospect for this pick"><span class="no">${c.pick}</span><span class="ln">—</span><span class="mt">Past top ${nRanked}</span>${own}</div>`
            : `<div class="pk empty${c.owner === hi ? " mine" : ""}"><span class="no">${c.pick}</span><span class="ln">—</span>${own}</div>`;
      }
    }
    board.innerHTML = html;
  }
  listeners.push(renderBoard);

  const cut = D0.playoffTeams && D0.playoffTeams < n ? n - D0.playoffTeams : null;
  document.getElementById("slot-head").innerHTML = `<tr><th class="team">Team</th>` +
    Array.from({ length: n }, (_, i) => `<th style="text-align:center"${i === cut ? ' class="cut"' : ""}>${i + 1}</th>`).join("") + `<th class="avg"><span class="lg">Avg slot</span><span class="sm">Avg</span></th></tr>`;
  const early = i => i < (cut === null ? n / 2 : cut);
  onData.push(() => {
    const Dr = D.tank.draft;
    slotRows.innerHTML = Dr.order.map((t, r) => `<tr data-team="${t}"${r === cut - 1 ? ' class="line"' : ""}><td class="team">${t}${ownerSub(t)}</td>` +
      Dr.odds[t].map((p, i) => `<td class="heat${i === cut ? " cut" : ""}">${heatCell(p, Dr0.odds[t][i], early(i) ? 1 : -1)}</td>`).join("") +
      `<td class="avg">${Dr.expSlot[t].toFixed(1)}${chg(Dr.expSlot[t], Dr0.expSlot[t], -1)}</td></tr>`).join("");
  });

  listeners.push(() => {
    const T = D.tank, Dr = T.draft, TS = Object.fromEntries(T.standings.map(r => [r.team, r]));
    const me = TS[hi], b = T0S[hi], top = T.standings[0], slot = Dr.order.indexOf(hi) + 1, pick = `1.${String(slot).padStart(2, "0")}`,
          po = slot ? (Dr.odds[hi] || [])[slot - 1] : null;
    const fav = [...Dr.order].sort((a, b) => Dr.odds[b][0] - Dr.odds[a][0])[0];
    const sx = RW.sfx || "";
    const rk = REC_LIKE(RACE_K), gw = n => `${n} ${n === 1 ? "win" : "wins"}`;
    const gap = rk ? (me.team === top.team ? `Leads by ${gw(T.standings[1].recW - me.recW)}` : `${gw(me.recW - top.recW)} behind #1`)
      : me.team === top.team ? `Leads by ${f1(T.standings[1].final - me.final)}${sx}` : `${f1(me.final - top.final)}${sx} behind #1`;
    document.getElementById("tank-tiles").innerHTML =
      `<div class="tile acc"><div class="k">${RW.tile}</div><div class="v">#${me.rank}</div><div class="d">${rk ? me.rec : f1(me.final) + sx}${chg(me.final, b.final, -1)} - ${gap}</div></div>` +
      `<div class="tile alt"><div class="k">Projected own pick</div><div class="v">${pick}</div>${po == null ? "" : `<div class="d">${share(po)}${chgP(po, ((Dr0.odds || {})[hi] || [])[slot - 1])} chance for ${pick} pick</div>`}</div>` +
      `<div class="tile"><div class="k">Likeliest 1.01</div><div class="v name${fav === hi ? " me" : ""}">${fav}</div><div class="d">${share(Dr.odds[fav][0])}${chgP(Dr.odds[fav][0], Dr0.odds[fav][0])} to pick first</div></div>` +
      `<div class="tile acc"><div class="k">${RW.worst}</div><div class="v name${top.team === hi ? " me" : ""}">${top.team}</div>` +
        `<div class="d">${rk ? `${top.rec} proj. record` : f1(top.final) + sx}${chg(top.final, T0S[top.team].final, -1)}</div></div>`;
    document.querySelectorAll("#tank-rows tr, #slot-rows tr").forEach(tr => tr.classList.toggle("on", tr.dataset.team === hi));
  });
})();
function applyData(next) {
  D = next;
  S = Object.fromEntries(D.standings.map(r => [r.team, r]));
  onData.forEach(fn => fn());
  listeners.forEach(fn => fn());
}

(() => {
  if (!D0.whatif || !D0.whatif.available) return;
  const $ = id => document.getElementById(id);
  const toggle = $("tr-toggle"), box = $("tr-box"), status = $("tr-status");
  const KEY = `contendathon-${D0.league.id}-trades`, ON = `contendathon-${D0.league.id}-trade-on`;
  const OLD_KEY = D0.league.storageKey + "-trades", OLD_ON = D0.league.storageKey + "-trade-on";
  let K = null, worker = null, base = null, cur = null, trades = [], busy = false, loading = null, kitLoading = null;
  let target = 0, picked = [], owners = {}, gone = 0;
  const FA = -1;
  const tav = (t, small) => t === FA ? `<span class="tav fa${small ? " s" : ""}">FA</span>`
    : (D0.avatars || {})[K.teams[t]] ? `<span class="tav${small ? " s" : ""}"><img src="${D0.avatars[K.teams[t]]}" alt=""></span>`
    : `<span class="tav${small ? " s" : ""}">${K.teams[t][0].toUpperCase()}</span>`;
  try {
    const mine = localStorage.getItem(KEY);
    trades = JSON.parse(mine !== null ? mine : localStorage.getItem(OLD_KEY) || "[]");
    if (mine === null && localStorage.getItem(ON) === null && localStorage.getItem(OLD_ON) === "1") localStorage.setItem(ON, "1");
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(trades)); } catch (e) {} };
  const isOn = () => toggle.getAttribute("aria-checked") === "true";
  window.movesInPlay = () => isOn() ? JSON.stringify(trades) : "[]";

  let nextId = 0;
  const waiting = new Map();
  const call = msg => new Promise((ok, fail) => { const id = ++nextId; waiting.set(id, { ok, fail }); worker.postMessage({ ...msg, id }); });
  const off = text => { $("tr-off").hidden = false; $("tr-off").textContent = text; $("tr-body").hidden = true; };
  function unpackKit(K) {
    if (!K || !K.packed) return K;
    const f64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return Array.from(new Float64Array(u.buffer)); };
    const model = {};
    for (const [pos, [lp, rr]] of Object.entries(K.model)) model[pos] = [f64(lp), f64(rr)];
    const out = { ...K, model };
    delete out.packed;
    return out;
  }
  function loadKit() {
    if (kitLoading) return kitLoading;
    return kitLoading = (async () => {
      status.textContent = "";
      try {
        const resp = await fetch("whatif.json", { cache: "no-cache" });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        K = unpackKit(await resp.json());
      } catch (err) {
        off(location.protocol === "file:" ? "The trade analyzer runs on the published page (its data can't load from a local file)."
          : "Couldn't load the trade analyzer's data (" + err.message + "). Try Refresh.");
        return false;
      }
      const pageBuilt = D0.updated && D0.updated.built;
      if (K.built && pageBuilt && K.built !== pageBuilt) {
        const newer = new Date(K.built) > new Date(pageBuilt);
        let again = true;
        try {
          again = Date.now() - (+sessionStorage.getItem("fresh-reload") || 0) >= 5 * 60e3;
          if (newer && again) sessionStorage.setItem("fresh-reload", String(Date.now()));
        } catch (e) {}
        if (newer && again && window.freshReload) { off("A newer build is out. Loading it…"); K = null; window.freshReload(); return false; }
        off(newer ? "A newer build is out: reload the page to use the trade analyzer."
          : "The trade analyzer's data is still updating. Try again in a minute.");
        K = null;
        return false;
      }
      if (K.unavailable) { off(K.unavailable); return false; }
      const wsrc = $("whatif-src");
      worker = new Worker(wsrc.dataset.src || URL.createObjectURL(new Blob([wsrc.textContent], { type: "text/javascript" })));
      worker.onmessage = e => { const w = waiting.get(e.data.id); waiting.delete(e.data.id); if (!w) return; e.data.error ? w.fail(new Error(e.data.error)) : w.ok(e.data); };
      const had = trades.length;
      trades = trades.filter(tr => tr && Array.isArray(tr.moves)).map(tr => ({ ...tr, week: Math.max(tr.week, weeks()[0]) }));
      trades = byWeek(trades);
      trades = trades.filter(tr => tr.moves.every(m =>
        (m.to === FA || m.to in K.rosters) && (m.from === FA ? ownerAt(tr.week, trades.slice(0, trades.indexOf(tr)))[m.pid] === FA
          : m.from in K.rosters && rosterAt(trades.slice(0, trades.indexOf(tr)), m.from, tr.week).includes(m.pid))));
      save();
      window.tradeSig = JSON.stringify(trades);
      gone = had - trades.length;
      setupBuilder();
      renderTrades();
      try { await call({ kit: K }); }
      catch (err) { status.textContent = "The simulation failed: " + err.message.split("\n")[0]; return false; }
      return true;
    })().then(ok => { if (!ok) kitLoading = null; return ok; });
  }
  function load() {
    if (loading) return loading;
    return loading = (async () => {
      if (!(await loadKit())) return false;
      busy = true; refreshButtons();
      const nP = trades.reduce((n, tr) => n + tr.moves.length, 0);
      const savedLine = trades.length ? `Simulating ${K.sims.toLocaleString()} seasons with your saved moves (${nP} player${nP === 1 ? "" : "s"})…` : "";
      try {
        status.textContent = savedLine;
        base = (await call({ trades: [] })).result;
        busy = false;
        status.textContent = gone ? `${gone} saved move${gone > 1 ? "s" : ""} no longer appl${gone > 1 ? "y" : "ies"} (players moved for real since) and ${gone > 1 ? "were" : "was"} removed.` : "";
        return true;
      } catch (err) { busy = false; refreshButtons(); status.textContent = "The simulation failed: " + err.message.split("\n")[0]; return false; }
    })();
  }
  function savedNote() {
    $("tr-saved").hidden = isOn() || !trades.length;
    const n = trades.reduce((a, tr) => a + tr.moves.length, 0);
    $("tr-saved-txt").textContent = `${trades.length} saved trade move${trades.length === 1 ? "" : "s"} (${n} player${n === 1 ? "" : "s"})`;
  }
  $("tr-saved-show").addEventListener("click", () => { setOn(true); toTop(); });
  $("tr-saved-clear").addEventListener("click", () => { trades = []; save(); savedNote(); if (K) { renderTrades(); renderBuilder(); } });
  async function setOn(on) {
    toggle.setAttribute("aria-checked", String(on));
    box.hidden = !on;
    savedNote();
    document.body.classList.toggle("trade-on", on);
    try { localStorage.setItem(ON, on ? "1" : ""); } catch (e) {}
    if (!on) { if (D !== D0) applyData(D0); return; }
    try { localStorage.setItem("contendathon-trade-used", "1"); } catch (e) {}
    if (await load()) await run();
  }
  const toTop = () => { if (!shellBox) scrollTo({ top: 0, behavior: "instant" }); };
  toggle.addEventListener("click", () => { const on = !isOn(); setOn(on); if (on) toTop(); });
  let animateRun = false;
  async function run(animate = false) {
    animateRun = animate;
    busy = true; refreshButtons();
    status.textContent = trades.length ? `Simulating ${K.sims.toLocaleString()} seasons with ${trades.length === 1 ? "the move" : trades.length + " moves"}…` : "";
    const note = gone ? status.textContent : ""; gone = 0;
    let next = note;
    try { cur = trades.length ? (await call({ trades })).result : base; }
    catch (err) { next = "The simulation failed: " + err.message.split("\n")[0]; cur = null; }
    busy = false; save(); savedNote();
    window.tradeSig = JSON.stringify(trades);
    const reveal = revealNew; revealNew = false;
    renderBuilder();
    const anim = $("tr-add").classList.contains("running");
    if (!(reveal && anim)) renderTrades();
    if (isOn()) applyData(trades.length && cur ? after(base, cur) : D0);
    if (anim) await animDone();
    status.textContent = next;
    if (reveal && anim) { renderTrades(); const c = $("tr-trades").lastElementChild; if (c) c.classList.add("tr-new"); }
  }

  const weeks = () => [...(K.partialWeek && K.partialWeek <= K.weekEnd ? [K.partialWeek] : []), ...K.futureWeeks.filter(w => w <= K.weekEnd)];
  const byWeek = list => list.map((tr, i) => [tr, i]).sort((a, b) => a[0].week - b[0].week || a[1] - b[1]).map(x => x[0]);
  function rosterAt(list, t, w) {
    const rs = K.rosters.map(r => r.map(x => x[0]));
    for (const tr of byWeek(list)) if (w >= tr.week) for (const m of tr.moves) {
      if (m.from === FA) { if (m.to !== FA && !rs.some(r => r.includes(m.pid))) rs[m.to].push(m.pid); continue; }
      const i = rs[m.from].indexOf(m.pid);
      if (i >= 0) { rs[m.from].splice(i, 1); if (m.to !== FA) rs[m.to].push(m.pid); }
    }
    return rs[t];
  }
  const P = pid => K.players[pid] || [pid, null, "?"];
  const restPts = (pid, from) => weeks().filter(w => w >= from).reduce((s, w) => s + (((K.proj[w] || {})[pid] || [0])[0]), 0);
  const ownerAt = (w, list = trades) => {
    const o = Object.fromEntries(Object.keys(K.players).map(pid => [pid, FA]));
    K.teams.forEach((_, t) => rosterAt(list, t, w).forEach(pid => { o[pid] = t; }));
    return o;
  };
  const ownerName = t => t === FA ? "Free agent" : K.teams[t];
  const teamsInMoves = () => {
    const seen = [];
    trades.forEach(tr => tr.moves.forEach(m => [m.to, m.from].forEach(t => { if (t !== FA && !seen.includes(K.teams[t])) seen.push(K.teams[t]); })));
    return seen;
  };
  window.tradeTeams = () => D === D0 || !K ? [] : teamsInMoves();

  function setupBuilder() {
    $("tr-week").innerHTML = weeks().map(w => `<option value="${w}">Week ${w}${w === K.partialWeek ? " (now)" : w === K.futureWeeks[0] ? " (next)" : ""}</option>`).join("");
    target = Math.max(0, K.teams.indexOf(hi));
    $("tr-team").innerHTML = [FA, ...K.teams.map((_, j) => j)].map(j =>
      `<button type="button" class="tr-tm" role="radio" aria-checked="false" data-t="${j}">${tav(j)}<span class="nm">${j === FA ? "Free agency" : K.teams[j]}</span></button>`).join("");
    $("tr-team").addEventListener("click", e => {
      const b = e.target.closest(".tr-tm"); if (!b) return;
      target = +b.dataset.t; renderBuilder();
    });
    $("tr-week").addEventListener("change", renderBuilder);
    $("tr-add").addEventListener("click", addMove);
    $("tr-clear").addEventListener("click", () => { if (busy) return; trades = []; run(); });
    const input = $("tr-q"), drop = box.querySelector(".tr-drop");
    let act = 0, opts = [];
    const close = () => { drop.hidden = true; input.setAttribute("aria-expanded", "false"); };
    const open = () => {
      opts = search(input.value);
      act = 0;
      drop.innerHTML = opts.map((o, j) => `<div class="tr-opt${j === act ? " act" : ""}" role="option" data-j="${j}">` +
        `<span class="pos ${o.pos}">${o.pos}</span><span class="who"><span class="nm">${o.name}</span>` +
        `<span class="sub">${o.nfl || "FA"} · ${tav(o.owner, true)}${ownerName(o.owner)}</span></span><span class="pts">${f1(o.pts)}</span></div>`).join("") ||
        `<div class="tr-none-opt">No players match.</div>`;
      drop.hidden = false; input.setAttribute("aria-expanded", "true");
      drop.querySelectorAll(".tr-opt").forEach(el => el.addEventListener("mousedown", ev => { ev.preventDefault(); add(opts[+el.dataset.j].pid); }));
    };
    const mark = () => drop.querySelectorAll(".tr-opt").forEach((el, j) => { el.classList.toggle("act", j === act); if (j === act) el.scrollIntoView({ block: "nearest" }); });
    input.addEventListener("focus", open);
    input.addEventListener("input", open);
    input.addEventListener("blur", close);
    input.addEventListener("keydown", ev => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); if (drop.hidden) open(); act = Math.max(0, Math.min(opts.length - 1, act + (ev.key === "ArrowDown" ? 1 : -1))); mark(); }
      else if (ev.key === "Enter") { ev.preventDefault(); if (opts[act]) add(opts[act].pid); }
      else if (ev.key === "Escape") { close(); input.blur(); }
    });
    const add = pid => {
      if (owners[pid] === target) target = target === FA ? Math.max(0, K.teams.indexOf(hi)) : FA;
      if (!picked.includes(pid)) picked.push(pid);
      input.value = "";
      renderBuilder();
      close();
      input.blur();
    };
    $("tr-picked").addEventListener("click", e => {
      const b = e.target.closest(".x"); if (!b) return;
      picked = picked.filter(p => p !== b.dataset.pid); renderBuilder();
    });
    $("tr-trades").addEventListener("click", e => {
      const b = e.target.closest("button[data-i]"); if (!b || busy) return;
      const i = +b.dataset.i;
      const dropped = new Set([i]);
      trades.forEach((tr, j) => { if (j > i && tr.moves.some(m => trades[i].moves.some(x => x.pid === m.pid))) dropped.add(j); });
      trades = trades.filter((_, j) => !dropped.has(j));
      renderTrades();
      run(true).then(() => { if (dropped.size > 1) status.textContent = `Also removed ${dropped.size - 1} later move${dropped.size > 2 ? "s" : ""} of the same player${dropped.size > 2 ? "s" : ""}.`; });
    });
    renderBuilder();
  }
  function search(text) {
    const w = +$("tr-week").value, q = text.trim().toLowerCase();
    let list = Object.keys(owners).filter(pid => !picked.includes(pid))
      .map(pid => ({ pid, name: P(pid)[0], nfl: P(pid)[1], pos: P(pid)[2], owner: owners[pid], pts: restPts(pid, w) }));
    if (q) list = list.filter(o => o.name.toLowerCase().includes(q) || (o.nfl || "").toLowerCase() === q || o.pos.toLowerCase() === q ||
                                   ownerName(o.owner).toLowerCase().includes(q));
    const starts = o => o.name.toLowerCase().split(" ").some(part => part.startsWith(q));
    return list.sort((x, y) => (q ? starts(y) - starts(x) : 0) || y.pts - x.pts).slice(0, 40);
  }
  function renderBuilder() {
    if (!K) return;
    owners = ownerAt(+$("tr-week").value);
    picked = picked.filter(pid => pid in owners);
    $("tr-team").querySelectorAll(".tr-tm").forEach(b => b.setAttribute("aria-checked", String(+b.dataset.t === target)));
    $("tr-picked").innerHTML = picked.map(pid => {
      const [name, , pos] = P(pid), same = owners[pid] === target;
      return `<li class="tr-pick${same ? " same" : ""}"><span class="pos ${pos}">${pos}</span><span class="nm">${name}</span><span class="sub">${same ? "already on this team"
        : `from ${tav(owners[pid], true)}${owners[pid] === FA ? "Free agency" : K.teams[owners[pid]]}`}</span>` +
        `<button type="button" class="x" data-pid="${pid}" aria-label="Remove ${name}">×</button></li>`;
    }).join("");
    refreshButtons();
  }
  const TANK_CYCLE = 1600;
  let animStart = 0, animStop = null, animWaiters = [];
  const animDone = () => new Promise(ok => { if (!$("tr-add").classList.contains("running")) ok(); else animWaiters.push(ok); });
  function setRunning(on) {
    const b = $("tr-add");
    if (on) {
      if (animStop) { clearTimeout(animStop); animStop = null; }
      if (!b.classList.contains("running")) { animStart = performance.now(); b.classList.add("running"); }
      return;
    }
    if (!b.classList.contains("running") || animStop) return;
    const wait = TANK_CYCLE - ((performance.now() - animStart) % TANK_CYCLE);
    animStop = setTimeout(() => {
      animStop = null; b.classList.remove("running"); refreshButtons();
      const w = animWaiters; animWaiters = []; w.forEach(ok => ok());
    }, wait);
  }
  function refreshButtons() {
    $("tr-add").disabled = busy || !K || !movable().length;
    setRunning(busy && animateRun && trades.length > 0);
    $("tr-add").querySelector(".lbl").textContent = $("tr-add").classList.contains("running") ? "Simulating…" : "Evaluate move";
    $("tr-clear").hidden = !$("tr-trades").children.length;
    $("tr-clear").disabled = busy;
    document.querySelectorAll("#tr-trades button").forEach(b => { b.disabled = busy; });
  }
  const movesHold = list => byWeek(list).every((tr, k, sorted) => tr.moves.every(m => m.from === FA
    ? ownerAt(tr.week, sorted.slice(0, k))[m.pid] === FA : rosterAt(sorted.slice(0, k), m.from, tr.week).includes(m.pid)));
  function movable() { return picked.filter(pid => owners[pid] !== target); }
  function addMove() {
    if (busy || !movable().length) return;
    const add = { week: +$("tr-week").value, moves: movable().map(pid => ({ pid, from: owners[pid], to: target })) };
    if (!movesHold([...trades, add])) {
      const later = trades.filter(tr => tr.week > add.week && tr.moves.some(m => add.moves.some(n => n.pid === m.pid)));
      const who = add.moves.filter(n => later.some(tr => tr.moves.some(m => m.pid === n.pid))).map(n => P(n.pid)[0]);
      status.textContent = `${who.join(", ") || "A player"} already moves in week ${later.length ? Math.min(...later.map(tr => tr.week)) : "a later week"}. ` +
        "Remove that move first, or make this one from that week.";
      return;
    }
    box.querySelector(".tr-drop").hidden = true;
    trades.push(add);
    picked = [];
    revealNew = true;
    run(true);
  }
  let revealNew = false;
  function renderTrades() {
    const tname = t => t === FA ? "Free agency" : K.teams[t];
    const side = (t, cls) => `<span class="tc-team ${cls}">${tav(t, true)}<span class="tn">${tname(t)}</span></span>`;
    $("tr-trades").innerHTML = trades.map((tr, i) => {
      const rows = tr.moves.map(m => {
        const [name, , pos] = P(m.pid);
        return `<div class="tc-row">${headshot(m.pid)}<div class="tc-main"><div class="tc-name">${name}` +
          `${pos && pos !== "?" ? ` <span class="pos ${pos}">${pos}</span>` : ""}</div>` +
          `<div class="tc-path">${side(m.from, "from")}<span class="arrow" aria-label="to">→</span>${side(m.to, "to")}</div></div></div>`;
      }).join("");
      return `<li class="tr-card"><div class="tc-top"><span class="tc-wk">${tr.week === K.partialWeek ? `Week ${tr.week} (now) on` : `Week ${tr.week} on`}</span>` +
        `<span class="tc-n">${tr.moves.length} player${tr.moves.length > 1 ? "s" : ""}</span>` +
        `<button type="button" class="x" data-i="${i}" title="Remove this move" aria-label="Remove move ${i + 1}">×</button></div>${rows}</li>`;
    }).join("");
    $("tr-clear").hidden = !trades.length;
  }

  function after(B, C) {
    const by = rows => Object.fromEntries(rows.map(r => [r.team, r]));
    const bp = by(B.page.teams), cp = by(C.page.teams), ti = Object.fromEntries(K.teams.map((t, i) => [t, i]));
    const hit = new Set(teamsInMoves());
    const odd = v => Math.min(1, Math.max(0, v));
    const shifted = (series, cw, bw, live) => {
      let shift = 0;
      return series.map(p => {
        const dv = p[0] in cw ? cw[p[0]] - bw[p[0]] : 0;
        shift += dv;
        return [p[0], p[1] + dv, p[2] + shift, ...p.slice(3)];
      });
    };
    const out = { ...D0 };
    out.series = Object.fromEntries(teams.map(t => [t, shifted(D0.series[t], cp[t].wk, bp[t].wk, D0.liveWeek)]));
    const st = D0.standings.map(r => {
      const t = r.team, d = f => cp[t][f] - bp[t][f], x = { ...r }, dF = d("final");
      const dNow = D0.liveWeek in cp[t].wk ? cp[t].wk[D0.liveWeek] - bp[t].wk[D0.liveWeek] : 0;
      Object.assign(x, { final: r.final + dF, p10: r.p10 + d("p10"), p90: r.p90 + d("p90"), rest: r.rest + dF - dNow, projW: r.projW + d("projW") });
      if (r.projWlo != null) { x.projWlo = r.projWlo + d("winsLo"); x.projWhi = r.projWhi + d("winsHi"); }
      if (r.wkProj != null) { x.wkProj = r.wkProj + dNow; x.toDate = r.toDate + dNow; }
      if (r.restAfter != null) x.restAfter = r.restAfter + dF - dNow;
      for (const k of ["playoff", "bye", "top", "title", "pfTitle"]) x[k] = odd(r[k] + d(k));
      x.seeds = r.seeds.map((p, i) => odd(p + cp[t].seeds[i] - bp[t].seeds[i]));
      return x;
    }).sort((a, b) => b.final - a.final);
    st.forEach(x => { x.rank = 1 + st.filter(y => y.final > x.final).length; });
    out.standings = st;
    const wkD = (t, w) => (w in cp[t].wk ? cp[t].wk[w] - bp[t].wk[w] : 0);
    out.schedule = Object.fromEntries(Object.entries(D0.schedule).map(([t, games]) => [t, games.map(([w, opp, pr, opr, p]) => {
      const cs = C.page.sched[w], bs = B.page.sched[w];
      return [w, opp, pr + wkD(t, w), opr + wkD(opp, w), cs && bs && cs[ti[t]] != null ? odd(p + cs[ti[t]] - bs[ti[t]]) : p];
    })]));
    if (D0.lines && C.page.lines && C.page.lines.week === D0.lines.week) {
      const same = (g, y) => (y.favorite === g.favorite && y.underdog === g.underdog) || (y.favorite === g.underdog && y.underdog === g.favorite);
      out.lines = { ...D0.lines, games: D0.lines.games.map(g => hit.has(g.favorite) || hit.has(g.underdog) ? C.page.lines.games.find(y => same(g, y)) || g : g)
        .sort((a, b) => b.fav_win - a.fav_win) };
    }
    if (D0.bracket.length && !D0.bracket.some(g => g.final)) out.bracket = C.bracket;
    if (D0.tank && C.page.tank && B.page.tank) {
      const bt = by(B.page.tank), ct = by(C.page.tank), Dr0 = D0.tank.draft;
      const rk = (D0.tank.metric || "max_pf"), pick_ = x => rk === "pf" ? x.pf : rk === "record" || rk === "bracket" ? x.wins : x;
      const cw = rk === "pf" ? by(C.page.teams) : null, bw = rk === "pf" ? by(B.page.teams) : null;
      const recR = rk === "record" || rk === "bracket";
      const wkC = t => rk === "pf" ? cw[t].wk : recR ? ct[t].winsWk || {} : ct[t].wk, wkB = t => rk === "pf" ? bw[t].wk : recR ? bt[t].winsWk || {} : bt[t].wk;
      const series = rk === "max_pf" ? Object.fromEntries(teams.map(t => [t, shifted(D0.tank.series[t], ct[t].wk, bt[t].wk, D0.tank.liveWeek)]))
        : rk === "pf" && out.series ? out.series : recR ? Object.fromEntries(teams.map(t => [t, shifted(D0.tank.series[t], wkC(t), wkB(t), D0.tank.liveWeek)]))
        : D0.tank.series;
      const tst = D0.tank.standings.map(r => {
        const t = r.team, c = pick_(ct[t]), b = pick_(bt[t]), dF = c.final - b.final;
        const lw_ = D0.tank.liveWeek, dNow = lw_ in wkC(t) && lw_ in wkB(t) ? wkC(t)[lw_] - wkB(t)[lw_] : 0;
        const x = { ...r, final: r.final + dF, rest: r.rest + dF - dNow, ...(r.wkProj != null && dNow ? { wkProj: r.wkProj + dNow } : {}), lo: r.lo + c.lo - b.lo, hi: r.hi + c.hi - b.hi,
                    lowest: odd(r.lowest + c.lowest - b.lowest) };
        if (r.rec) {
          const games = r.rec.split(/[-–]/).reduce((a, n) => a + +n, 0);
          const w = r.w + Math.ceil(Math.round(x.final * 100) / 100 - 0.5 - (r.w + r.t / 2));
          x.recW = w + r.t / 2; x.rec = `${w}–${Math.max(games - r.t - w, 0)}${r.t ? "–" + r.t : ""}`; x.pf = r.pf + ct[t].pf.final - bt[t].pf.final;
        }
        return x;
      }).sort((a, b) => a.rec ? (a.recW - b.recW || a.pf - b.pf || (a.team < b.team ? -1 : 1)) : a.final - b.final);
      tst.forEach((x, i) => { x.rank = x.rec ? i + 1 : 1 + tst.filter(y => y.final < x.final).length; });
      const oddsA = Object.fromEntries(teams.map(t => [t, Dr0.odds[t].map((p, i) => odd(p + ct[t].slots[i] - bt[t].slots[i]))]));
      const exp = Object.fromEntries(teams.map(t => [t, Dr0.expSlot[t] + ct[t].expSlot - bt[t].expSlot]));
      const playoff = Object.fromEntries(teams.map(t => [t, odd(Dr0.playoff[t] + ct[t].playoff - bt[t].playoff)]));
      const order = [...K.teams].sort((a, b) => exp[a] - exp[b] || ti[a] - ti[b]);
      const byOrig = Object.fromEntries(Dr0.rows.map(r => [r.round + "|" + r.original, r]));
      const bySlot = Object.fromEntries(Dr0.rows.map(r => [r.round + "|" + r.slot, r]));
      const rows = [];
      for (let r = 1; r <= Dr0.rounds; r++) order.forEach((t, k) => {
        const o = byOrig[r + "|" + t], sl = bySlot[r + "|" + (k + 1)];
        rows.push({ ...sl, original: t, owner: o.owner, traded: o.traded });
      });
      out.tank = { ...D0.tank, series, standings: tst, draft: { ...Dr0, order, rows, odds: oddsA, expSlot: exp, playoff } };
      if (D0.tank.npBracket && C.npBracket && !D0.bracket.some(g => g.final)) out.tank.npBracket = C.npBracket;
    }
    const last = Math.max(...weeks()), endOwner = ownerAt(last), moved = new Map();
    trades.forEach(tr => tr.moves.forEach(m => {
      const from = K.rosters.findIndex(r => r.some(x => x[0] === m.pid));
      if (from >= 0) moved.set(P(m.pid)[0] + "|" + K.teams[from], endOwner[m.pid] >= 0 ? K.teams[endOwner[m.pid]] : "");
    }));
    out.leaders = D0.leaders.map(r => moved.has(r[0] + "|" + r[3]) ? [...r.slice(0, 3), moved.get(r[0] + "|" + r[3]), ...r.slice(4)] : r);
    return out;
  }

  const rowIdx = {};
  const rowOf = (w, pid) => {
    if (!rowIdx[w]) { rowIdx[w] = {}; for (const t in D0.rosters) for (const r of ((D0.rosters[t] || {})[w] || { rows: [] }).rows) rowIdx[w][r[0]] = r; }
    return rowIdx[w][pid];
  };
  const SLOTS = ["QB", "RB", "WR", "TE", "WRRB_FLEX", "REC_FLEX", "FLEX", "SUPER_FLEX", "K", "DEF"];
  let nowState = null;
  const maxSlots = (pids, w) => {
    if (!nowState) { nowState = {}; (K.partial || []).forEach(Pt => Pt && Pt.players.forEach(e => { nowState[e[0]] = e; })); }
    const pjOf = p => ((K.proj[w] || {})[p] || [0])[0];
    const val = p => { const e = w === K.partialWeek && nowState[p]; return !e ? pjOf(p) : e[2] === "final" ? e[3] : Math.max(e[3], pjOf(p)); };
    const proj = pids.map(val), pos = pids.map(p => P(p)[2]);
    const idx = pids.map((_, j) => j).sort((a, b) => proj[b] - proj[a] || a - b), slot = {};
    for (const [name, elig, n] of K.lineup.stages) {
      let taken = 0;
      for (const j of idx) { if (taken >= n) break; if (!slot[pids[j]] && elig.includes(pos[j]) && proj[j] >= K.minProj) { slot[pids[j]] = name; taken++; } }
    }
    return slot;
  };
  window.dropOdds = async (team, pids, onEach) => {
    if (!(await load())) return false;
    const t = K.teams.indexOf(team), w = weeks().find(x => x !== K.partialWeek) || weeks()[0];
    if (t < 0 || !w) return false;
    const tk = r => r.page.tank.find(x => x.team === team) || {};
    const rk = (D0.tank.metric || "max_pf"), race = x => rk === "pf" ? x.pf.final : rk === "record" || rk === "bracket" ? x.wins.final : x.final;
    const list = isOn() ? trades.slice() : [];
    const shown = !list.length ? base : cur && window.tradeSig === JSON.stringify(list) ? cur : (await call({ trades: list })).result;
    const bs = tk(base).slots, bf = race(tk(shown)), Dr0 = D0.tank.draft.odds[team];
    for (const pid of pids) {
      if (!rosterAt(list, t, w).includes(pid)) { onEach(pid, null); continue; }
      const r = (await call({ trades: [...list, { week: w, moves: [{ pid, from: t, to: FA }] }] })).result;
      const cs = tk(r).slots;
      onEach(pid, [...[0, 1, 2].map(i => Math.min(1, Math.max(0, Dr0[i] + cs[i] - bs[i]))), bf - race(tk(r))]);
    }
    return true;
  };
  window.impactPrepare = async () => {
    if (!(await loadKit())) return false;
    await call({ scenario: [], trades: D !== D0 && isOn() ? trades.slice() : [] });
    return true;
  };
  window.impactScenario = async (picks, withMoves) => {
    if (!(await loadKit())) return null;
    return (await call({ scenario: picks, trades: withMoves && isOn() ? trades.slice() : [] })).result;
  };
  window.tradeWeek = (team, w) => {
    if (D === D0 || !cur || !trades.length) return null;
    const e = (cur.weeks[team] || {})[w];
    if (!e) return null;
    const b = (D0.rosters[team] || {})[w] || {}, ms = maxSlots(e.roster, w);
    const rows = e.roster.map(pid => {
      const r = rowOf(w, pid), x = r ? [...r] : [pid, null, P(pid)[1], false, (((K.proj[w] || {})[pid]) || [null])[0], null, false, false, null, null, null, null, null, null, null, null, null, null];
      x[1] = (e.slots && e.slots[pid]) || "Bench"; x[6] = false; x[16] = ms[pid] || "Bench";
      x[17] = w === K.partialWeek ? +(x[1] !== "Bench") : null;
      return x;
    });
    const rank = x => x[1] === "Bench" ? 99 : SLOTS.indexOf(x[1]);
    rows.sort((x, y) => rank(x) - rank(y) || (y[4] || 0) - (x[4] || 0));
    return { ...b, kind: b.kind || "projected", live: w === K.partialWeek ? !!b.live : false, traded: true, rows, pfAdj: Math.round(e.mean * 10) / 10, rng: [e.lo, e.hi],
             tankMax: e.max || null, tankLineup: e.max ? [e.max[1], e.max[2]] : null };
  };

  let wasOn = false;
  try { wasOn = localStorage.getItem(ON) === "1"; } catch (e) {}
  if (wasOn || window.tradeFromLink) setTimeout(() => setOn(true), 0);
  else {
    savedNote();
    let used = false;
    try { used = localStorage.getItem("contendathon-trade-used") === "1"; } catch (e) {}
    if (used && location.protocol !== "file:") {
      if (window.requestIdleCallback) window.requestIdleCallback(() => { load(); }, { timeout: 4000 }); else setTimeout(() => { load(); }, 1500);
    }
  }
})();

(() => {
  const FIT = [[".league-name", 16], [".tile .v.name", 11], [".odds td.team", 9], ["#pf-table .r-nm", 9], ["#rosters-sec .sel-face", 10], ["#maxpf-table td.team", 9], [".slots td.team", 9],
               [".board .bh .nm", 7.5], ["#roster-rows .r-nm", 10], [".leaders .r-nm", 10], [".team-list .pn", 10], [".board .pk .ln", 8.5], [".board .pk .fn", 7.5], [".board .pk .mt", 7]];
  const phone = matchMedia("(max-width: 640px)");
  const fit = () => FIT.forEach(([sel, m]) => { const min = phone.matches ? m : Math.max(m, 9.5); document.querySelectorAll(sel).forEach(el => {
    el.style.fontSize = "";
    if (!el.clientWidth || el.scrollWidth <= el.clientWidth) return;
    let px = Math.max(min, Math.floor(parseFloat(getComputedStyle(el).fontSize) * el.clientWidth / el.scrollWidth));
    el.style.fontSize = px + "px";
    while (px > min && el.scrollWidth > el.clientWidth) el.style.fontSize = (px -= 0.5) + "px";
  }); });
  let queued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; fit(); }); } };
  const main = document.querySelector("main");
  new MutationObserver(later).observe(main, { childList: true, subtree: true, characterData: true });
  if ("ResizeObserver" in window) new ResizeObserver(later).observe(main); else addEventListener("resize", later);
  if (document.fonts) document.fonts.ready.then(later);
  later();
})();
(() => {
  const tabs = document.getElementById("tabs"), head = document.createElement("div"), chips = document.createElement("div");
  head.className = "app-head"; chips.className = "app-chips"; chips.setAttribute("role", "navigation"); chips.setAttribute("aria-label", "Sections");
  tabs.before(head); head.append(tabs, chips);
  stuckWhenPast(head, document.getElementById("tabs-top"));
  const NAMES = [[/^Draft Pick Odds/, "Pick Odds"], [/^Proj\. points scored/, "Points"], [/^Projected playoff bracket|^Playoff bracket|^Championship Odds/, "Bracket"], [/final max PF/i, "Max PF"], [/Final Points/, "Points"], [/Final Record/, "Record"], [/toilet bowl/i, "Toilet Bowl"], [/consolation/i, "Consolation"], [/lines/i, "Lines"], [/Points Scored|Championship Odds/, "Trend"], [/Playoff picture/, "Playoffs"],
    [/final points/, "Standings"], [/bracket/i, "Bracket"], [/^Schedule/, "Schedule"], [/^Rosters/, "Rosters"], [/top scorers/, "Leaders"],
    [/Max PF|Pick Odds|Proj\. Wins/, "Trend"], [/rookie draft/i, "Draft"], [/Draft pick odds/i, "Max PF"], [/^Team$/, "Team"]];
  const title = h => { const c = h.cloneNode(true); c.querySelectorAll(".info, .seg, button").forEach(x => x.remove()); return c.textContent.trim(); };
  const label = t => (NAMES.find(([re]) => re.test(t)) || [0, t.split(" ").slice(0, 2).join(" ")])[1];
  let hs = [], cur = -1;
  const spy = () => {
    const y = head.getBoundingClientRect().bottom + 24;
    let i = -1;
    hs.forEach((h, k) => { if (h.getBoundingClientRect().top <= y) i = k; });
    const atEnd = shellBox ? shellBox.clientHeight + shellBox.scrollTop >= shellBox.scrollHeight - 4
      : innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    if (hs.length && atEnd) i = hs.length - 1;
    if (i === cur) return;
    cur = i;
    [...chips.children].forEach((c, k) => c.setAttribute("aria-current", String(k === i)));
    const c = chips.children[i];
    chips.scrollTo({ left: c ? c.offsetLeft - chips.clientWidth / 2 + c.offsetWidth / 2 : 0, behavior: "smooth" });
  };
  const build = () => {
    hs = [...document.querySelectorAll("main h2")].filter(h => h.offsetParent && !h.closest("#bands-sec"));
    chips.replaceChildren(...hs.map(h => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "app-chip"; b.textContent = label(title(h));
      b.addEventListener("click", () => h.scrollIntoView({ behavior: "smooth", block: "start" }));
      return b;
    }));
    document.documentElement.style.setProperty("--head-h", head.offsetHeight + 8 + "px");
    cur = -1; spy();
  };
  let raf = 0;
  pageScroller.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; spy(); }); }, { passive: true });
  addEventListener("resize", build);
  addEventListener("rosters-tab", () => setTimeout(build, 0));
  setTimeout(build, 50);

  const avs = D0.avatars || {}, sel = document.getElementById("sel-me"), app = document.getElementById("app-me");
  const pic = t => !t ? `<img src="${NO_PHOTO}" alt="">` : avs[t] ? `<img src="${avs[t]}" alt="">` : t[0].toUpperCase();
  app.innerHTML = `<option value="" disabled hidden></option>` + sel.innerHTML.replace(/<option value="" disabled>[^<]*<\/option>/, "");
  app.addEventListener("pointerdown", () => { app.value = ""; });
  app.addEventListener("blur", () => { if (!app.value) app.value = me || ""; });
  app.addEventListener("change", () => { if (app.value) setMe(app.value); });
  listeners.push(() => {
    if (document.activeElement !== app) app.value = me || "";
    document.getElementById("me-av").innerHTML = pic(me);
    document.getElementById("app-me-av").innerHTML = pic(me);
    document.getElementById("app-me-nm").textContent = me || "Your team";
  });

  (() => {
    const sheet = document.getElementById("me-sheet"), list = document.getElementById("me-list");
    const names = D.league.ownerNames || {};
    let whoName = "";
    try { whoName = (localStorage.getItem("contendathon-who") || "").toLowerCase(); } catch (e) {}
    const own = t => !!whoName && String(names[t] || "").toLowerCase() === whoName;
    const close = () => { sheet.hidden = true; };
    const ask = () => {
      if (me || !document.getElementById("paused").hidden) return;
      list.textContent = "";
      [...teams].sort((a, b) => (own(b) - own(a)) || a.localeCompare(b, undefined, { sensitivity: "base" })).forEach(t => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "me-o" + (own(t) ? " guess" : ""); b.dataset.t = t;
        b.innerHTML = `<span class="me-av">${pic(t)}</span><span class="nm"></span><span class="ow"></span>`;
        b.querySelector(".nm").textContent = t; b.querySelector(".ow").textContent = String(names[t] || "").toLowerCase() === t.toLowerCase() ? "" : names[t] || "";
        list.appendChild(b);
      });
      sheet.hidden = false;
    };
    if (matchMedia("(max-width: 640px)").matches)
      document.getElementById("me-where").textContent = "The page opens on your team. You can change it any time in the bottom right.";
    window.askMyTeam = ask;
    list.addEventListener("click", e => { const b = e.target.closest(".me-o"); if (b) { setMe(b.dataset.t); close(); } });
    sheet.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(); });
    setTimeout(ask, 1200);
  })();

  const bar = document.getElementById("app-tabbar"), tb = id => document.getElementById(id), go = g => bar.querySelector(`[data-go="${g}"]`);
  bar.hidden = false;
  const barH = () => document.documentElement.style.setProperty("--bar-h", (bar.offsetParent ? Math.round(bar.getBoundingClientRect().height) : 0) + "px");
  barH(); addEventListener("resize", barH); setTimeout(barH, 600);
  const sync = () => {
    go("contend").hidden = tabs.hidden;
    go("tank").hidden = tabs.hidden || tb("tab-btn-tank").hidden;
    go("trade").hidden = tabs.hidden || tb("tr-toggle").hidden;
    go("trade").setAttribute("aria-checked", tb("tr-toggle").getAttribute("aria-checked"));
    ["contend", "tank"].forEach(t => go(t).setAttribute("aria-selected", tb("tab-btn-" + t).getAttribute("aria-selected")));
    go("opt").hidden = !tb("opt-fab") || tb("opt-fab").hidden;
  };
  new MutationObserver(sync).observe(tabs, { subtree: true, attributes: true, attributeFilter: ["aria-selected", "aria-checked", "hidden"] });
  sync();
  const sheet = tb("app-sheet"), body = tb("sheet-body"), box = tb("tr-box"), home = document.createComment("tr-box");
  box.before(home);
  const phone = matchMedia("(max-width: 640px)");
  const place = () => { if (phone.matches) body.append(box); else home.after(box); };
  phone.addEventListener("change", place); place();
  const nMoves = () => tb("tr-trades").children.length;
  const badge = () => {
    const n = tb("tr-toggle").getAttribute("aria-checked") === "true" ? nMoves() : 0;
    tb("app-trade-n").hidden = !n; tb("app-trade-n").textContent = n;
    go("trade").classList.toggle("has-moves", n > 0);
  };
  new MutationObserver(badge).observe(tb("tr-trades"), { childList: true });
  new MutationObserver(badge).observe(tb("tr-toggle"), { attributes: true, attributeFilter: ["aria-checked"] });
  badge();
  const vv = window.visualViewport, typing = () => /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName);
  const fit = () => {
    if (!vv) return;
    bar.classList.toggle("kb", typing() && innerHeight - vv.height > 120);
    sheet.style.cssText = sheet.hidden ? "" : `top:${vv.offsetTop}px;height:${vv.height}px;bottom:auto`;
  };
  let queued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; fit(); }); } };
  if (vv) { vv.addEventListener("resize", later); vv.addEventListener("scroll", later); }
  pageScroller.addEventListener("scroll", later, { passive: true });
  document.addEventListener("focusout", () => setTimeout(() => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName)) return;
    bar.classList.remove("kb"); fit(); scrollTo(scrollX, scrollY);
    setTimeout(fit, 400);
  }, 120));
  const openSheet = () => {
    if (tb("tr-toggle").getAttribute("aria-checked") !== "true") tb("tr-toggle").click();
    sheet.hidden = false; document.body.classList.add("sheet-open"); fit();
  };
  const closeSheet = () => {
    [60, 350, 900].forEach(ms => setTimeout(fit, ms));
    sheet.hidden = true; document.body.classList.remove("sheet-open"); fit();
    box.querySelector(".tr-drop").hidden = true;
    if (!nMoves() && tb("tr-toggle").getAttribute("aria-checked") === "true") tb("tr-toggle").click();
  };
  sheet.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeSheet(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });
  tb("tr-saved").addEventListener("click", e => { if (phone.matches && e.target.id === "tr-saved-txt") openSheet(); });
  bar.addEventListener("click", e => {
    const b = e.target.closest("button.app-tab");
    if (!b) return;
    if (b.dataset.go === "trade") { openSheet(); return; }
    if (b.dataset.go === "opt") { tb("opt-fab").click(); return; }
    const t = tb("tab-btn-" + b.dataset.go), was = t.getAttribute("aria-selected") === "true";
    if (!was) t.click();
    pageScroller.scrollTo({ top: 0, behavior: was ? "smooth" : "instant" });
  });
})();
onData.forEach(fn => fn());
listeners.forEach(fn => fn());
(() => {
  const root = document.documentElement, sp = document.getElementById("splash");
  if (!root.classList.contains("splash-on")) return;
  const C = 3400, ball = sp.querySelector(".sp-ball");
  const clock = () => { const a = ball.getAnimations()[0]; return a ? a.currentTime : 0; };
  const leave = () => { sp.classList.add("out"); setTimeout(() => { root.classList.remove("splash-on"); sp.classList.remove("out"); }, 500); };
  const loaded = new Promise(r => document.readyState === "complete" ? r() : addEventListener("load", r, { once: true }));
  const drawn = new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  Promise.race([Promise.all([loaded, drawn]), new Promise(r => setTimeout(r, 12000))]).then(() => {
    const e = clock();
    let at;
    if (e < .9 * C) at = .9 * C;
    else { const ph = e % C; at = ph >= .56 * C && ph <= .88 * C ? e : e - ph + (ph > .88 * C ? C : 0) + .56 * C; }
    setTimeout(leave, at - e);
  });
})();
