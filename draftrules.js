// Draft-order detection for the landing page (user, 2026-10-13): before a league is built, match its last real rookie
// draft against the orders the engine supports (engine/tankathon.py parse_rules), and say in plain English what was
// found. Used by sites/hub/index.html (import) and tools/test_draft_detect.mjs (Node, the same file).
//
// How: Sleeper doesn't store a league's draft-order rule, but it keeps last season's league (previous_league_id) and
// this season's completed rookie draft. The draft's round-1 slots (slot_to_roster_id: the team each slot belonged to
// before any trades) are compared with orders computed from last season:
//   non-playoff teams  max_pf (lowest max PF, Sleeper's "ppts"), pf (fewest points for), record (worst record, ties
//                      fewer points), toilet_bowl (the losers bracket, loser advances: the team that lost every game
//                      first), consolation (the losers bracket, winner advances: its champion first; 2026-10-14)
//   playoff teams      finish (round they went out in, worse record first in a round), finish_max_pf (the same,
//                      lowest max PF first), seed (worst seed first); the third-place game when the bracket had one
// Result: { ok, blocking, rules: "<nonplayoff>/<playoff_by>[/3p]" | "none", matched: "full" | "partial" | "none",
//           note: English for the commissioner, facts: one line from Sleeper }

export const API = "https://api.sleeper.app/v1";
const IDP = new Set(["DL", "LB", "DB", "IDP_FLEX", "DE", "DT", "CB", "S"]);
const SLOTS = new Set(["QB", "RB", "WR", "TE", "K", "DEF", "WRRB_FLEX", "REC_FLEX", "FLEX", "SUPER_FLEX", "BN"]);
export const NP_TEXT = { max_pf: "lowest max PF first", pf: "fewest points for first", record: "worst record first",
                         toilet_bowl: "by their toilet bowl (the loser advances; the team that loses every game picks first)",
                         consolation: "by their consolation bracket (the winner advances; its champion picks first)" };
export const PO_TEXT = { finish: "by final finish, worse record first when two go out the same week (further ties: fewer points)",
                         finish_max_pf: "by final finish, lowest max PF first when two go out the same week",
                         finish_pf: "by final finish, fewest points for first when two go out the same week",
                         seed: "worst playoff seed first" };
const CHANGE = "Change it anytime with ⚙ on the league's page.";
// the order in the league page's Options words (2026-10-14: the long sentences were too much text)
const NP_LABEL = { max_pf: "Max Points For", pf: "Points For", record: "Reverse Record", toilet_bowl: "Toilet Bowl", consolation: "Consolation Bracket" };
const PO_LABEL = { finish: "Final Finish", finish_max_pf: "Final Finish, Max PF Ties", finish_pf: "Final Finish, PF Ties", seed: "Seeding" };
const order = (np, po, third) => po === "finalists" ? "Finalists then Max PF"
  : `${NP_LABEL[np]} · ${PO_LABEL[po]}${third ? " · Third-Place Game" : ""}`;

const num = (a, b) => (+a || 0) + (+b || 0) / 100;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sortBy = (ids, key) => [...ids].sort((a, b) => key(a) - key(b) || a - b);

// can the engine build it at all? (engine/profile.py infer refusals) -> English, or null
export function blocker(lg) {
  const st = lg.settings || {}, slots = (lg.roster_positions || []);
  if (st.type === 3) return "Guillotine leagues aren't supported, so this league can't be built.";
  if (slots.some(s => IDP.has(s))) return "Leagues with defensive players (IDP) aren't supported, so this league can't be built.";
  const odd = [...new Set(slots.filter(s => !SLOTS.has(s) && !IDP.has(s)))];
  if (odd.length) return `This league uses lineup spots we don't support (${odd.join(", ")}), so it can't be built.`;
  if (lg.status === "pre_draft" || lg.status === "drafting") return "This league hasn't finished its draft yet. Add it once the draft is done.";
  if ((lg.total_rosters || 0) < 2) return "This league has fewer than 2 teams.";
  if (![0, 1, 2].includes(+st.playoff_round_type || 0) || ![0, 1].includes(+st.playoff_seed_type || 0))
    return "This league's playoff format isn't one we support, so it can't be built.";
  return null;
}

export function facts(lg) {
  const st = lg.settings || {};
  const type = { 0: "Redraft", 1: "Keeper", 2: "Dynasty" }[st.type] || "Unknown type";
  const po = st.playoff_week_start ? `${st.playoff_teams}-team playoffs from week ${st.playoff_week_start}` : "no playoffs";
  return `${type} · ${lg.total_rosters || "?"} teams · ${po}` + (st.type === 1 || st.type === 2 ? ` · ${st.draft_rounds || "?"}-round rookie draft` : "");
}

// last season's results, per roster id: record, points, max PF, playoff exit, placement, seed, toilet bowl order
function lastSeason(rosters, wb, lb) {
  const R = new Map(rosters.map(r => { const s = r.settings || {};
    return [r.roster_id, { wins: +s.wins || 0, pf: num(s.fpts, s.fpts_decimal), max: num(s.ppts, s.ppts_decimal), hasMax: s.ppts != null }]; }));
  const inPO = new Set(), out = new Map();  // out: roster -> round it lost in (no p); placement games set place
  const place = new Map();
  let maxR = 0, third = false;
  for (const m of wb || []) {
    for (const t of [m.t1, m.t2]) if (typeof t === "number") inPO.add(t);
    maxR = Math.max(maxR, m.r || 0);
  }
  for (const m of wb || []) {
    // the round a team first lost (later p-less games of a knocked-out team are consolation games)
    if (m.p == null && m.l != null && !out.has(m.l)) out.set(m.l, m.r);
    if (m.p === 1) { place.set(m.w, 1); place.set(m.l, 2); }
    if (m.p === 3 && m.w != null) { place.set(m.w, 3); place.set(m.l, 4); third = true; }
    if (m.p === 5 && m.w != null) { place.set(m.w, 5); place.set(m.l, 6); }
  }
  const rec = id => R.get(id).wins * 1e5 + R.get(id).pf;
  // the elimination "round": champion past the last round, runner-up the last round; with the third-place game
  // (use3p) 3rd/4th just under it, else the semifinal losers stay in the round they lost
  const exitRound = (id, use3p) => place.get(id) === 1 ? maxR + 1 : place.get(id) === 2 ? maxR
    : use3p && place.get(id) === 3 ? maxR - 1 + 0.2 : use3p && place.get(id) === 4 ? maxR - 1 + 0.1 : out.get(id) ?? 0;
  // seeds: Sleeper's standings (wins, then points for) among the playoff teams
  const seedOrder = sortBy([...inPO], id => -rec(id));
  const seed = new Map(seedOrder.map((id, i) => [id, i + 1]));
  // toilet bowl: the losers bracket played "loser advances": the final's loser lost every game (1.01)
  let toilet = null, consolation = null;
  if (lb && lb.length) {
    const leave = new Map(), lbR = Math.max(...lb.map(m => m.r || 0));
    const fin = lb.find(m => m.r === lbR && (m.p === 1 || m.p == null) && m.w != null);
    for (const m of lb) if (m.w != null && m.p == null && m.r < lbR) leave.set(m.w, m.r);
    if (fin) {
      const teams = new Set(lb.flatMap(m => [m.t1, m.t2]).filter(t => typeof t === "number"));
      toilet = [fin.l, fin.w].concat(sortBy([...teams].filter(t => t !== fin.l && t !== fin.w), id => -(leave.get(id) || 0) * 1e9 + rec(id)));
      // consolation: the winner advances, so a team leaves the round it LOSES; the champion (the final's winner) first
      const lost = new Map();
      for (const m of lb) if (m.l != null && m.p == null && m.r < lbR && !lost.has(m.l)) lost.set(m.l, m.r);
      consolation = [fin.w, fin.l].concat(sortBy([...teams].filter(t => t !== fin.l && t !== fin.w), id => -(lost.get(id) || 0) * 1e9 + rec(id)));
    }
  }
  return { R, inPO, rec, exitRound, seed, third, toilet, consolation, place };
}

function orders(S, np, po) {
  const npC = {
    max_pf: sortBy(np, id => S.R.get(id).max),
    pf: sortBy(np, id => S.R.get(id).pf),
    record: sortBy(np, S.rec),
    toilet_bowl: S.toilet && S.toilet.length === np.length && S.toilet.every(t => np.includes(t)) ? S.toilet : null,
    consolation: S.consolation && S.consolation.length === np.length && S.consolation.every(t => np.includes(t)) ? S.consolation : null,
  };
  const poC = { seed: sortBy(po, id => -S.seed.get(id)) };
  for (const tp of S.third ? [true, false] : [false]) {
    const k = tp ? "/3p" : "";
    poC["finish_max_pf" + k] = sortBy(po, id => S.exitRound(id, tp) * 1e9 + S.R.get(id).max);
    poC["finish" + k] = sortBy(po, id => S.exitRound(id, tp) * 1e9 + S.rec(id));
    poC["finish_pf" + k] = sortBy(po, id => S.exitRound(id, tp) * 1e9 + S.R.get(id).pf);  // (2026-10-15)
  }
  return { npC, poC };
}

export async function detect(leagueId, get = url => fetch(url).then(r => (r.ok ? r.json() : null))) {
  const lg = await get(`${API}/league/${leagueId}`).catch(() => null);
  if (!lg) return { ok: false, blocking: true, note: "We couldn't find a league with that ID." };
  const base = { ok: true, blocking: false, name: lg.name || leagueId, season: lg.season, facts: facts(lg) };
  const stop = blocker(lg);
  if (stop) return { ...base, ok: false, blocking: true, note: stop };
  const st = lg.settings || {};
  if (st.type === 0) return { ...base, rules: "none", matched: "full", redraft: true, note: "Redraft: no rookie draft, so no Tankathon." };
  // couldn't check (the reason stays in `why`, for the logs): the most common order, said briefly
  // `code`: why it's a guess, for the add flow's one line (2026-10-16, user: say "no previous season" only when there is none)
  const guess = (third, why, code) => ({ ...base, rules: `max_pf/finish_max_pf${third ? "/3p" : ""}`, matched: "none", why, code,
    note: `Best guess: ${order("max_pf", "finish_max_pf", third)}. ${CHANGE}` });
  if (!lg.previous_league_id) return guess(false, "This league has no previous season to look at, so we couldn't see how its rookie draft is ordered.", "no_prev");
  const [drafts, nowRosters, rosters, wb, lb] = await Promise.all([
    get(`${API}/league/${leagueId}/drafts`), get(`${API}/league/${leagueId}/rosters`),
    get(`${API}/league/${lg.previous_league_id}/rosters`), get(`${API}/league/${lg.previous_league_id}/winners_bracket`),
    get(`${API}/league/${lg.previous_league_id}/losers_bracket`)].map(p => p.catch(() => null)));
  const draft = (drafts || []).filter(d => String(d.season) === String(lg.season) && d.status === "complete")
    .sort((a, b) => (b.start_time || 0) - (a.start_time || 0))[0];
  const third0 = (wb || []).some(m => m.p === 3);
  if (!draft) return guess(third0, `We couldn't find this league's finished ${lg.season} rookie draft, so we couldn't check its order.`, "no_draft");
  if (!rosters || !wb || !wb.length) return guess(third0, `We couldn't read last season's results for this league.`, "no_results");
  // the league's draft list can leave slot_to_roster_id out; the draft's own record has it (2026-10-16: The Dynasty
  // Idiots, A/C Loungers fell back to a stale user order). Empty keys / null rosters (seen: {"": null}) are dropped
  let s2r = draft.slot_to_roster_id;
  if (!s2r || !Object.keys(s2r).length) s2r = ((await get(`${API}/draft/${draft.draft_id}`).catch(() => null)) || {}).slot_to_roster_id;
  let slots = Object.entries(s2r || {}).filter(([k, r]) => k !== "" && r != null).sort((a, b) => a[0] - b[0]).map(([, r]) => +r);
  if (!slots.length && draft.draft_order) {  // user -> slot: map each user to a roster (this season's owners and
    // co-owners first, then last season's); roster ids carry over from season to season on Sleeper
    const ownerRoster = new Map();
    for (const r of [...(rosters || []), ...(nowRosters || [])])
      for (const u of [r.owner_id, ...(r.co_owners || [])]) if (u) ownerRoster.set(u, r.roster_id);
    slots = Object.entries(draft.draft_order).sort((a, b) => a[1] - b[1]).map(([u]) => ownerRoster.get(u));
  }
  const S = lastSeason(rosters, wb, lb);
  const all = rosters.map(r => r.roster_id);
  if (slots.length !== all.length || slots.some(r => !S.R.has(r)))
    return guess(S.third, `This league's teams changed since last season, so we couldn't line its ${lg.season} rookie draft up with last season's results.`, "teams_changed");
  const np = all.filter(id => !S.inPO.has(id)), po = all.filter(id => S.inPO.has(id));
  const actualNp = slots.slice(0, np.length), actualPo = slots.slice(np.length);
  // "finalists" (2026-10-16, user; The Dynasty Idiots): everyone but the two finalists by lowest max PF, playoff teams
  // included, then the runner-up, then the champion. Checked when the non-playoff / playoff rules don't match
  const champ = [...S.place].find(([, p]) => p === 1)?.[0], runner = [...S.place].find(([, p]) => p === 2)?.[0];
  const finalists = champ != null && runner != null
    ? sortBy(all.filter(id => id !== champ && id !== runner), id => S.R.get(id).max).concat([runner, champ]) : null;
  const finalistsHit = () => finalists && same(finalists, slots) && all.every(id => S.R.get(id).hasMax)
    ? { ...base, rules: "finalists", matched: "full", npHit: ["finalists"], poHit: ["finalists"],
        note: `Matches your ${lg.season} draft: ${order("max_pf", "finalists", false)}.` } : null;
  if (!np.every(id => actualNp.includes(id)) && finalistsHit()) return finalistsHit();
  if (!np.every(id => actualNp.includes(id)))
    return guess(S.third, `In this league's ${lg.season} rookie draft, some playoff teams picked ahead of non-playoff teams. We don't support that kind of order yet.`, "unsupported");
  const { npC, poC } = orders(S, np, po);
  const prefer = ["max_pf", "pf", "record", "toilet_bowl", "consolation"];
  const npHit = prefer.filter(k => npC[k] && same(npC[k], actualNp));
  const poHit = ["finish_max_pf/3p", "finish/3p", "finish_pf/3p", "finish_max_pf", "finish", "finish_pf", "seed"].filter(k => poC[k] && same(poC[k], actualPo));
  const npRule = npHit[0] || "max_pf", [poRule, tp] = (poHit[0] || (S.third ? "finish_max_pf/3p" : "finish_max_pf")).split("/");
  const third = !!tp;
  const rules = `${npRule}/${poRule}${third ? "/3p" : ""}`;
  const said = order(npRule, poRule, third);
  const noMax = npRule === "max_pf" && np.some(id => !S.R.get(id).hasMax);
  if (!(npHit.length && poHit.length) && finalistsHit()) return finalistsHit();
  if (npHit.length && poHit.length)
    return { ...base, rules, matched: "full", npHit, poHit,
             note: `Matches your ${lg.season} draft: ${said}.` + (noMax ? " Please double-check." : "") };
  return { ...base, rules, matched: npHit.length || poHit.length ? "partial" : "none", npHit, poHit, code: "no_rule_match",
           note: `Best guess: ${said}. ${CHANGE}` };
}
