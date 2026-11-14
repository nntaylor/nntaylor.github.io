
const WhatIf = (() => {
  "use strict";
  const GOLDEN = 0x9E3779B9;

  const pyRound = (x, d) => {
    if (!isFinite(x)) return x;
    const ex = Math.abs(x).toFixed(Math.min(100, d + 60));
    const cut = ex.indexOf(".") + 1 + d, tail = ex.slice(cut);
    let r = Number(ex.slice(0, cut));
    const step = 10 ** -d;
    if (tail[0] > "5" || (tail[0] === "5" && /[1-9]/.test(tail.slice(1)))) r += step;
    else if (tail[0] === "5") { const last = Number(ex.slice(0, cut).replace(".", "").slice(-1)); if (last % 2) r += step; }
    return (x < 0 ? -1 : 1) * Number(r.toFixed(d));
  };

  const fmix = h => {
    h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16;
    return h >>> 0;
  };
  const enc = new TextEncoder();
  const fnv1a = s => { let h = 0x811C9DC5; for (const b of enc.encode(String(s))) h = Math.imul(h ^ b, 0x01000193) >>> 0; return h; };
  function drawKey(seed, season, week, pid) {
    let h = fmix((seed ^ GOLDEN) >>> 0);
    for (const part of [season, week, fnv1a(pid)]) h = fmix((h ^ part) >>> 0);
    return h;
  }
  function uniforms(seed, season, week, pid, n, out = new Float64Array(n)) {
    const key = drawKey(seed, season, week, pid);
    for (let i = 0; i < n; i++) out[i] = (fmix(fmix((key + Math.imul(i, GOLDEN)) >>> 0)) + 0.5) / 4294967296;
    return out;
  }

  function npSum(a, i0 = 0, n = a.length) {
    if (n < 8) { let r = 0; for (let i = 0; i < n; i++) r += a[i0 + i]; return r; }
    if (n <= 128) {
      const r = [a[i0], a[i0 + 1], a[i0 + 2], a[i0 + 3], a[i0 + 4], a[i0 + 5], a[i0 + 6], a[i0 + 7]];
      let i = 8;
      for (; i < n - (n % 8); i += 8) for (let j = 0; j < 8; j++) r[j] += a[i0 + i + j];
      let res = ((r[0] + r[1]) + (r[2] + r[3])) + ((r[4] + r[5]) + (r[6] + r[7]));
      for (; i < n; i++) res += a[i0 + i];
      return res;
    }
    let n2 = Math.floor(n / 2); n2 -= n2 % 8;
    return npSum(a, i0, n2) + npSum(a, i0 + n2, n - n2);
  }

  function makeModel(K, inj = null) {
    const data = {}, cache = new Map();
    for (const [pos, [lp0, rr0]] of Object.entries(K.model)) {
      const gone = inj ? new Set((inj.drop || {})[pos] || []) : null;
      const lp = gone ? lp0.filter((_, i) => !gone.has(i)) : lp0, rr = gone ? rr0.filter((_, i) => !gone.has(i)) : rr0;
      const order = Array.from(rr.keys()).sort((a, b) => rr[a] - rr[b]);
      const bw = new Map(((inj ? inj.bandwidth : K.bandwidth)[pos] || []).map(([k, h]) => [k, h]));
      data[pos] = { lp: Float64Array.from(lp), rr: Float64Array.from(rr), order, bw };
    }
    function dist(pos, k) {
      const ck = pos + "|" + k;
      let d = cache.get(ck);
      if (d) return d;
      const P = data[pos], n = P.lp.length, lk = Math.log(k);
      let h = P.bw.get(k);
      const w = new Float64Array(n), tmp = new Float64Array(n);
      const weights = hh => {
        for (let i = 0; i < n; i++) { const z = (P.lp[i] - lk) / hh; w[i] = Math.exp(-0.5 * (z * z)); }
        const s = 0 + npSum(w);
        for (let i = 0; i < n; i++) w[i] /= s;
        for (let i = 0; i < n; i++) tmp[i] = w[i] * w[i];
        return 1 / (0 + npSum(tmp));
      };
      if (h === undefined) {
        h = K.kernelH;
        for (;;) { const ess = weights(h); if (ess >= K.minWeeks || h > 5) break; h *= 1.02; }
      } else weights(h);
      for (let i = 0; i < n; i++) tmp[i] = w[i] * P.rr[i];
      const S = 0 + npSum(tmp);
      const r = new Float64Array(n), cw = new Float64Array(n);
      let c = 0;
      for (let i = 0; i < n; i++) { const j = P.order[i]; r[i] = P.rr[j] / S; c = i ? c + w[j] : w[j]; cw[i] = c; }
      const G = 4096, guide = new Int32Array(G + 1);
      for (let b = 0, i = 0; b <= G; b++) { const t = b / G; while (i < n && cw[i] < t) i++; guide[b] = i; }
      d = { r, cw, guide, G };
      cache.set(ck, d);
      return d;
    }
    function draws(pid, pos, proj, k, week, out) {
      if (proj < K.minProj || !data[pos]) return out.fill(0);
      const { r, cw, guide, G } = dist(pos, k), n = cw.length;
      uniforms(K.seed, K.season, week, pid, out.length, out);
      for (let i = 0; i < out.length; i++) {
        const u = out[i];
        const b = Math.min(G - 1, (u * G) | 0);
        let lo = guide[b], hi = guide[b + 1];
        if (hi < n) hi++; else hi = n;
        while (lo < hi) { const m = (lo + hi) >> 1; if (cw[m] < u) lo = m + 1; else hi = m; }
        out[i] = proj * r[Math.min(lo, n - 1)];
      }
      return out;
    }
    return { draws };
  }

  function makeLineup(K) {
    const stages = K.lineup.stages.map(([slot, elig, n]) => ({ slot, elig: new Set(elig), n }));
    const orders = K.lineup.orders.map(o => o.map(i => stages[i]));
    function select(pos, proj) {
      const idx = Array.from(proj.keys()).sort((a, b) => proj[b] - proj[a] || a - b);
      const slot = new Array(proj.length).fill(null);
      for (const st of stages) {
        let taken = 0;
        for (const j of idx) { if (taken >= st.n) break; if (slot[j] === null && st.elig.has(pos[j])) { slot[j] = st.slot; taken++; } }
      }
      return slot;
    }
    function maxPoints(pos, cols, n) {
      const out = new Float64Array(n), m = cols.length;
      if (!m) return out;
      const idx = new Int32Array(m), v = new Float64Array(m), used = new Uint8Array(m);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          const x = cols[j][i];
          let p = j;
          while (p > 0 && v[p - 1] < x) { v[p] = v[p - 1]; idx[p] = idx[p - 1]; p--; }
          v[p] = x; idx[p] = j;
        }
        let best = -Infinity;
        for (const st of orders) {
          used.fill(0);
          for (const s of st) {
            let taken = 0;
            for (let q = 0; q < m && taken < s.n; q++) if (!used[q] && s.elig.has(pos[idx[q]])) { used[q] = 1; taken++; }
          }
          let t = 0;
          for (let q = 0; q < m; q++) if (used[q]) t += v[q];
          if (t > best) best = t;
        }
        out[i] = best;
      }
      return out;
    }
    function pick(pos, ord, can, sel) {
      sel.fill(0);
      for (const st of stages) {
        let taken = 0;
        for (const j of ord) { if (taken >= st.n) break; if (can[j] && !sel[j] && st.elig.has(pos[j])) { sel[j] = 1; taken++; } }
      }
      return sel;
    }
    return { select, maxPoints, pick };
  }

  function order(n) {
    let o = [1, 2];
    while (o.length < n) { const m = 2 * o.length + 1; o = o.flatMap(s => [s, m - s]); }
    return n >= 2 ? o.slice(0, n) : [1];
  }
  const fieldSize = k => { let n = 2; while (n < k) n *= 2; return n; };
  const nRounds = k => k >= 2 ? Math.round(Math.log2(fieldSize(k))) : 0;

  function playBracket(seedTeam, k, reseed, beats) {
    const size = fieldSize(k), rounds = nRounds(k), seedOf = [];
    seedTeam.forEach((t, s) => { seedOf[t] = s + 1; });
    let slots = order(size).map(s => s <= k ? seedTeam[s - 1] : -1);
    const out = { rounds: [], third: null, fourth: null, champion: -1, runnerUp: -1 };
    let semi = null;
    for (let r = 1; r <= rounds; r++) {
      out.rounds.push(slots);
      const nxt = [], losers = [];
      for (let i = 0; i < slots.length; i += 2) {
        const a = slots[i], b = slots[i + 1], bye = a < 0 || b < 0;
        const aw = bye ? b < 0 : beats(r, a, b);
        nxt.push(aw ? a : b);
        losers.push(bye ? -1 : aw ? b : a);
      }
      if (r === rounds - 1) semi = losers;
      slots = nxt;
      if (r === rounds) { out.champion = slots[0]; out.runnerUp = losers[0]; }
      else if (reseed) {
        const ranked = [...slots].sort((x, y) => seedOf[x] - seedOf[y]);
        slots = order(slots.length).map(s => ranked[s - 1]);
      }
    }
    if (semi && semi.length === 2) {
      out.semi = semi;
      if (semi[0] >= 0 && semi[1] >= 0) {
        const aw = beats(rounds, semi[0], semi[1]);
        out.third = aw ? semi[0] : semi[1]; out.fourth = aw ? semi[1] : semi[0];
      }
    }
    return out;
  }

  function f64(s) {
    const b = atob(s), u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return Array.from(new Float64Array(u.buffer));
  }
  function unpack(K) {
    if (!K || !K.packed) return K;
    const model = {};
    for (const [pos, [lp, rr]] of Object.entries(K.model)) model[pos] = [f64(lp), f64(rr)];
    const out = { ...K, model };
    delete out.packed;
    return out;
  }

  function create(K) {
    K = unpack(K);
    const N = K.sims, T = K.teams.length, model = makeModel(K), lu = makeLineup(K);
    const pos = pid => K.players[pid][2];
    const projOf = (w, pid) => (K.proj[w] || {})[pid] || null;
    const INJ = K.injury || null, simModel = INJ ? makeModel(K, INJ) : model;
    const injCache = new Map();
    function injuryStates(pid, p) {
      let st = injCache.get(pid);
      if (st) return st;
      const W = K.futureWeeks.length, h = INJ.hazard[p] || 0;
      st = new Int8Array(W * N);
      if (h) {
        const left = new Int32Array(N), uh = buf(), ul = buf(), cdf = INJ.cdf, L = INJ.lengths;
        K.futureWeeks.forEach((w, t) => {
          if (!projOf(w, pid)) { for (let i = 0; i < N; i++) if (left[i] > 0) left[i]--; return; }
          uniforms((K.seed ^ INJ.hurtTag) >>> 0, K.season, w, pid, N, uh);
          let lens = false;
          for (let i = 0; i < N; i++) {
            if (left[i] > 0) { st[t * N + i] = 2; left[i]--; }
            else if (uh[i] < h) {
              if (!lens) { uniforms((K.seed ^ INJ.lengthTag) >>> 0, K.season, w, pid, N, ul); lens = true; }
              st[t * N + i] = 1;
              let k = 0;
              while (k < cdf.length - 1 && cdf[k] < ul[i]) k++;
              left[i] = L[k];
            }
          }
        });
      }
      injCache.set(pid, st);
      return st;
    }
    const futureIdx = new Map(K.futureWeeks.map((w, t) => [w, t]));
    const regWeeks = K.futureWeeks.filter(w => w <= K.weekEnd);
    const buf = () => new Float64Array(N);

    function teamWeek(roster, w) {
      const pids = roster.map(r => r[0]), ps = pids.map(pos);
      const pj = pids.map(p => projOf(w, p));
      const proj = pj.map(x => x ? x[0] : 0);
      const ok = roster.map(r => r[1]);
      const wantMax = K.tank && !K.tank.noMax && !liteRun && w <= K.weekEnd;
      const t = INJ ? futureIdx.get(w) : -1;
      const draw = j => {
        const d = simModel.draws(pids[j], ps[j], proj[j], pj[j] ? pj[j][1] : 0, w, buf());
        const f = INJ && INJ.healthy[ps[j]];
        if (f !== undefined && f !== null && INJ) {
          const st = injuryStates(pids[j], ps[j]);
          for (let i = 0; i < N; i++) {
            const c = st[t * N + i];
            d[i] = c === 2 ? 0 : c === 1 ? (d[i] * f) * INJ.hurtGame : d[i] * f;
          }
        }
        return d;
      };
      const cols = K.bestBall || wantMax || INJ ? pids.map((_, j) => draw(j)) : pids.map(() => null);
      let score;
      let slots = null;
      if (K.bestBall) {
        const keep = ok.map((o, j) => o ? j : -1).filter(j => j >= 0);
        score = lu.maxPoints(keep.map(j => ps[j]), keep.map(j => cols[j]), N);
      } else {
        slots = lu.select(ps, proj.map((p, j) => p >= K.minProj && ok[j] ? p : 0))
          .map((s, j) => s && proj[j] >= K.minProj && ok[j] ? s : null);
        score = buf();
        for (let j = 0; j < cols.length; j++) if (slots[j]) { const c = cols[j] || (cols[j] = draw(j)); for (let i = 0; i < N; i++) score[i] += c[i]; }
        if (INJ) {
          const sts = pids.map((p, j) => (INJ.healthy[ps[j]] !== undefined ? injuryStates(p, ps[j]) : null));
          const m = pids.length, base = proj.map((p, j) => p >= K.minProj && !!ok[j]);
          const ord = Array.from(proj.keys()).sort((a, b) => (proj[b] >= K.minProj ? proj[b] : 0) - (proj[a] >= K.minProj ? proj[a] : 0) || a - b);
          const can = new Uint8Array(m), sel = new Uint8Array(m);
          for (let i = 0; i < N; i++) {
            let starterOut = false;
            for (let j = 0; j < m; j++) {
              const gone = sts[j] !== null && sts[j][t * N + i] === 2;
              can[j] = base[j] && !gone ? 1 : 0;
              if (gone && slots[j]) starterOut = true;
            }
            if (!starterOut) continue;
            lu.pick(ps, ord, can, sel);
            let v = 0;
            for (let j = 0; j < m; j++) v += sel[j] ? cols[j][i] : 0;
            score[i] = v;
          }
        }
      }
      const max = wantMax ? lu.maxPoints(ps, cols, N) : null;
      return { score, max, slots: slots && Object.fromEntries(pids.map((p, j) => [p, slots[j]]).filter(e => e[1])) };
    }

    function partialWeek(t) {
      const P = K.partial[t], w = K.partialWeek;
      if (!P) return { score: buf(), max: K.tank && !K.tank.noMax && !liteRun ? buf() : null };
      const by = new Map();
      for (const e of P.pool) {
        if (e[2] !== null) by.set(e[0], buf().fill(e[2]));
        else {
          const d = model.draws(e[0], e[1], e[4], e[5], w, buf());
          for (let i = 0; i < N; i++) d[i] = e[3] + d[i] * e[6];
          by.set(e[0], d);
        }
      }
      const posOf = new Map(P.pool.map(e => [e[0], e[1]]));
      const cols = P.cols.filter(p => by.has(p));
      let score = buf();
      if (cols.length) {
        if (K.bestBall) score = lu.maxPoints(cols.map(p => posOf.get(p)), cols.map(p => by.get(p)), N);
        else for (const p of cols) { const c = by.get(p); for (let i = 0; i < N; i++) score[i] += c[i]; }
      }
      const all = [...by.keys()];
      const max = K.tank && !K.tank.noMax && !liteRun && w <= K.weekEnd ? (all.length ? lu.maxPoints(all.map(p => posOf.get(p)), all.map(p => by.get(p)), N) : buf()) : null;
      const roster = P.players ? P.players.map(e => e[0]) : null;
      const slots = P.starters ? Object.fromEntries(P.starters.map((pid, i) => [pid, K.starterSlots[i]]).filter(e => e[0])) : null;
      return { score, max, roster, slots };
    }

    const PW = K.partialWeek;
    const pinfo = new Map();
    if (PW) K.partial.forEach((P, t) => P && P.players.forEach(e => pinfo.set(e[0], { t, pos: e[1], state: e[2], pts: e[3], left: e[4] })));
    const slotElig = Object.fromEntries(K.lineup.stages.map(([slot, elig]) => [slot, new Set(elig)]));
    const canStartNow = new Map(K.rosters.flatMap(r => r.map(x => [x[0], x[1]])));
    const lockedNow = pid => {
      const x = pinfo.get(pid);
      if (x) return x.state !== "open";
      return (K.partialStatus || {})[K.players[pid] ? K.players[pid][1] : null] !== "scheduled";
    };
    function partialTraded(trades) {
      const vals = new Map();
      const val = pid => {
        if (!vals.has(pid)) {
          const x = pinfo.get(pid) || { pos: pos(pid), state: "open", pts: 0, left: 1 };
          if (x.state === "final") vals.set(pid, buf().fill(x.pts));
          else {
            const pj = projOf(PW, pid), d = model.draws(pid, x.pos, pj ? pj[0] : 0, pj ? pj[1] : 0, PW, buf());
            for (let i = 0; i < N; i++) d[i] = x.pts + d[i] * x.left;
            vals.set(pid, d);
          }
        }
        return vals.get(pid);
      };
      const owner = new Map([...pinfo].map(([pid, x]) => [pid, x.t]));
      for (const tr of trades) if (tr.week <= PW) for (const m of tr.moves) {
        if (lockedNow(m.pid)) continue;
        if (m.from < 0) { if (m.to >= 0 && !owner.has(m.pid)) owner.set(m.pid, m.to); continue; }
        if (owner.get(m.pid) !== m.from) continue;
        if (m.to >= 0) owner.set(m.pid, m.to); else owner.delete(m.pid);
      }
      const pj = pid => (projOf(PW, pid) || [0])[0];
      return K.teams.map((_, t) => {
        const P = K.partial[t];
        const members = [...owner].filter(([, o]) => o === t).map(([pid]) => pid);
        if (members.length === (P ? P.players.length : 0) && members.every(pid => (pinfo.get(pid) || {}).t === t)) return null;
        let score = buf(), slots = null;
        if (K.bestBall) {
          if (members.length) score = lu.maxPoints(members.map(pos), members.map(val), N);
        } else {
          const set = (P ? P.starters : []).map(pid => (pid && owner.get(pid) === t ? pid : null));
          const holes = (P ? P.starters : []).map((pid, i) => !!pid && !set[i]);
          const inLineup = new Set(set.filter(Boolean));
          const incoming = new Set(members.filter(pid => !(pinfo.get(pid) && pinfo.get(pid).t === t)));
          let bench = members.filter(pid => !inLineup.has(pid) && !lockedNow(pid) && (incoming.has(pid) || canStartNow.get(pid) !== false) && pj(pid) >= K.minProj);
          const fits = (i, pid) => slotElig[K.starterSlots[i]] && slotElig[K.starterSlots[i]].has(pos(pid));
          holes.forEach((h, i) => {
            if (!h) return;
            const c = bench.filter(pid => fits(i, pid)).sort((a, b) => pj(b) - pj(a))[0];
            if (c) { set[i] = c; bench = bench.filter(p => p !== c); }
          });
          for (const c of bench.filter(pid => incoming.has(pid)).sort((a, b) => pj(b) - pj(a))) {
            let at = -1;
            set.forEach((pid, i) => {
              if (pid && !lockedNow(pid) && fits(i, c) && pj(pid) < pj(c) && (at < 0 || pj(pid) < pj(set[at]))) at = i;
            });
            if (at >= 0) set[at] = c;
          }
          slots = {};
          set.forEach((pid, i) => { if (pid) { slots[pid] = K.starterSlots[i]; const c = val(pid); for (let k = 0; k < N; k++) score[k] += c[k]; } });
        }
        const max = K.tank && !K.tank.noMax && !liteRun && PW <= K.weekEnd ? (members.length ? lu.maxPoints(members.map(pos), members.map(val), N) : buf()) : null;
        return { score, max, slots, roster: members };
      });
    }

    const byWeek = list => list.map((tr, i) => [tr, i]).sort((a, b) => a[0].week - b[0].week || a[1] - b[1]).map(x => x[0]);
    function rosterAt(trades, t, w) {
      let rs = K.rosters.map(r => r.map(x => [...x]));
      for (const tr of byWeek(trades)) {
        if (w < tr.week) continue;
        for (const m of tr.moves) {
          if (m.from < 0) {
            if (m.to >= 0 && !rs.some(r => r.some(x => x[0] === m.pid))) rs[m.to].push([m.pid, true]);
            continue;
          }
          const i = rs[m.from].findIndex(x => x[0] === m.pid);
          if (i < 0) continue;
          const [entry] = rs[m.from].splice(i, 1);
          if (m.to >= 0) rs[m.to].push([entry[0], true]);
        }
      }
      return rs[t];
    }

    let base = null, baseLite = null;
    let liteRun = false;

    function scores(trades, lite = false) {
      liteRun = lite;
      try { return scoresWith(trades, lite ? baseLite : base); } finally { liteRun = false; }
    }
    function scoresWith(trades, base) {
      const touched = new Set(trades.flatMap(tr => tr.moves.flatMap(m => [m.from, m.to])));
      const out = [];
      let now = null;
      for (let t = 0; t < T; t++) {
        if (base && !touched.has(t)) { out.push(base[t]); continue; }
        const weeks = {};
        const first = Math.min(...trades.map(tr => tr.week));
        if (K.partialWeek) weeks[K.partialWeek] = !base ? partialWeek(t) : first <= K.partialWeek ? (now || (now = partialTraded(trades)))[t] || base[t][K.partialWeek] : base[t][K.partialWeek];
        for (const w of K.futureWeeks)
          weeks[w] = base && w < first ? base[t][w] : teamWeek(rosterAt(trades, t, w), w);
        out.push(weeks);
      }
      return out;
    }

    function season(TW) {
      const wins = new Float64Array(N * T), pf = new Float64Array(N * T), col = new Float64Array(T);
      const wkWins = {};
      for (let i = 0; i < N; i++) for (let t = 0; t < T; t++) { wins[i * T + t] = K.baseWins[t]; pf[i * T + t] = K.basePf[t]; }
      for (const w of K.simWeeks) {
        const opp = K.schedule[w], ww = wkWins[w] = new Float64Array(T);
        for (let i = 0; i < N; i++) {
          for (let t = 0; t < T; t++) col[t] = TW[t][w].score[i];
          for (let t = 0; t < T; t++) {
            pf[i * T + t] += col[t];
            const o = opp[t];
            if (o >= 0) { const v = (col[t] > col[o] ? 1 : 0) + 0.5 * (col[t] === col[o] ? 1 : 0); wins[i * T + t] += v; ww[t] += v; }
          }
          if (K.median) {
            const s = Array.from(col).sort((a, b) => a - b), h = T >> 1;
            const med = T % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
            for (let t = 0; t < T; t++) { const v = (col[t] > med ? 1 : 0) + 0.5 * (col[t] === med ? 1 : 0); wins[i * T + t] += v; ww[t] += v; }
          }
        }
      }
      const { seeds, order: order_, divWin } = seedOrder(wins, pf);
      return { wins, pf, seeds, order: order_, divWin: Array.from(divWin, x => x / N), wkWins };
    }

    function seedOrder(wins, pf) {
      const seeds = new Int32Array(N * T), divWin = new Float64Array(T);
      const order_ = new Int32Array(N * T);
      const key = new Float64Array(T), idx = Array.from({ length: T }, (_, t) => t);
      for (let i = 0; i < N; i++) {
        for (let t = 0; t < T; t++) key[t] = wins[i * T + t] * 1e5 + pf[i * T + t];
        const v = Float64Array.from(key);
        if (K.division) {
          const best = {};
          for (let t = 0; t < T; t++) { const d = K.division[t]; if (best[d] === undefined || key[t] > key[best[d]]) best[d] = t; }
          for (const t of Object.values(best)) { v[t] = key[t] + 1e12; divWin[t]++; }
        }
        idx.sort((a, b) => v[b] - v[a]);
        for (let s = 0; s < T; s++) { order_[i * T + s] = idx[s]; seeds[i * T + idx[s]] = s + 1; }
      }
      return { seeds, order: order_, divWin };
    }

    function replay(A, wins) {
      const k = K.playoffTeams, byes = fieldSize(k) - k, so = seedOrder(wins, A.S.pf), champ = new Int32Array(N);
      const title = new Array(T).fill(0), po = new Array(T).fill(0), bye = new Array(T).fill(0), top = new Array(T).fill(0);
      for (let i = 0; i < N; i++) {
        const seedTeam = Array.from(so.order.subarray(i * T, i * T + T));
        champ[i] = playBracket(seedTeam, k, K.reseed, (rd, a, b) => A.roundScore[rd - 1][a][i] >= A.roundScore[rd - 1][b][i]).champion;
        title[champ[i]]++; top[so.order[i * T]]++;
        for (let s = 0; s < k; s++) po[so.order[i * T + s]]++;
        for (let s = 0; s < byes; s++) bye[so.order[i * T + s]]++;
      }
      return { champ, title: title.map(c => c / N), po: po.map(c => c / N), bye: bye.map(c => c / N), top: top.map(c => c / N) };
    }
    const hasPlayoffs = () => K.playoffTeams >= 2 && K.roundsWeeks.length;
    function simWin(A, w, a, b) {
      const sa = A.TW[a][w].score, sb = A.TW[b][w].score, wa = new Float64Array(N);
      for (let i = 0; i < N; i++) wa[i] = (sa[i] > sb[i] ? 1 : 0) + 0.5 * (sa[i] === sb[i] ? 1 : 0);
      return wa;
    }
    function forceWins(A, forced) {
      const w2 = Float64Array.from(A.S.wins);
      for (const f of forced) {
        const wa = simWin(A, f.week, f.a, f.b);
        for (let i = 0; i < N; i++) { w2[i * T + f.a] += f.aWins - wa[i]; w2[i * T + f.b] -= f.aWins - wa[i]; }
      }
      return w2;
    }

    function impact(A) {
      const out = [];
      if (!hasPlayoffs()) return out;
      const champNow = replay(A, A.S.wins).champ;
      const by = v => Object.fromEntries(K.teams.map((name, t) => [name, v[t]]));
      for (const w of K.simWeeks) {
        if (w > K.weekEnd) continue;
        const opp = K.schedule[w], done = new Set();
        for (let a = 0; a < T; a++) {
          const b = opp[a];
          if (b < 0 || done.has(a) || done.has(b)) continue;
          done.add(a); done.add(b);
          const wa = simWin(A, w, a, b);
          let pA = 0;
          for (let i = 0; i < N; i++) pA += wa[i];
          const side = [1, 0].map(aWins => replay(A, forceWins(A, [{ week: w, a, b, aWins }])));
          for (let i = 0; i < N; i++)
            if ((wa[i] === 1 && side[0].champ[i] !== champNow[i]) || (wa[i] === 0 && side[1].champ[i] !== champNow[i]))
              throw new Error(`impact check failed: week ${w} ${K.teams[a]} v ${K.teams[b]}`);
          out.push({ week: w, a: K.teams[a], b: K.teams[b], pA: pA / N, titleA: by(side[0].title), titleB: by(side[1].title), poA: by(side[0].po), poB: by(side[1].po),
                    byeA: by(side[0].bye), byeB: by(side[1].bye), topA: by(side[0].top), topB: by(side[1].top) });
        }
      }
      return out;
    }

    function scenario(A, picks) {
      if (!hasPlayoffs()) return null;
      const forced = [];
      for (const p of picks) {
        const a = K.teams.indexOf(p.team), b = a >= 0 && K.schedule[p.week] ? K.schedule[p.week][a] : -1;
        if (a < 0 || b < 0 || !K.simWeeks.includes(p.week) || p.week > K.weekEnd) continue;
        forced.push({ week: p.week, a, b, aWins: p.wins ? 1 : 0 });
      }
      const by = r => Object.fromEntries(K.teams.map((name, t) => [name, { playoff: r.po[t], bye: r.bye[t], top: r.top[t], title: r.title[t] }]));
      return { base: by(replay(A, A.S.wins)), picked: by(replay(A, forceWins(A, forced))), n: forced.length };
    }

    function analyze(trades = [], opts = {}) {
      trades = byWeek(trades);
      const lite = !!opts.lite;
      if (lite) { if (!baseLite) baseLite = scores([], true); }
      else if (!base) base = scores([]);
      const TW = trades.length ? scores(trades, lite) : lite ? baseLite : base;
      const S = season(TW);
      const k = K.playoffTeams, rounds = K.roundsWeeks.length;
      const seedCounts = Array.from({ length: T }, () => new Array(T).fill(0));
      for (let i = 0; i < N; i++) for (let t = 0; t < T; t++) seedCounts[t][S.seeds[i * T + t] - 1]++;
      const roundScore = K.roundsWeeks.map(ws => TW.map(weeks => {
        const s = new Float64Array(N);
        for (const w of ws) { const x = weeks[w].score; for (let i = 0; i < N; i++) s[i] = s[i] + x[i]; }
        return s;
      }));
      const title = new Array(T).fill(0);
      const res = [];
      let thirdOk = true;
      if (k >= 2 && rounds) {
        for (let i = 0; i < N; i++) {
          const seedTeam = Array.from(S.order.subarray(i * T, i * T + T));
          const r = playBracket(seedTeam, k, K.reseed, (rd, a, b) => roundScore[rd - 1][a][i] >= roundScore[rd - 1][b][i]);
          if (r.semi && !(r.semi[0] >= 0 && r.semi[1] >= 0)) thirdOk = false;
          title[r.champion]++;
          res.push(r);
        }
        if (!thirdOk) res.forEach(r => { r.third = r.fourth = null; });
      } else for (let i = 0; i < N; i++) title[S.order[i * T]]++;
      let slotCounts = null, simMax = null;
      if (K.tank && !lite) {
        slotCounts = Array.from({ length: T }, () => new Array(T).fill(0));
        const maxWeeks = [...(K.partialWeek && K.partialWeek <= K.weekEnd ? [K.partialWeek] : []), ...regWeeks];
        simMax = new Float64Array(N * T);
        for (let t = 0; t < T; t++) {
          const acc = new Float64Array(N);
          maxWeeks.forEach((w, j) => { const x = TW[t][w].max; if (!x) return; for (let i = 0; i < N; i++) acc[i] = j ? acc[i] + x[i] : 0 + x[i]; });
          for (let i = 0; i < N; i++) simMax[i * T + t] = K.baseMax[t] + acc[i];
        }
        const rule = K.tank.order, idx = Array.from({ length: T }, (_, t) => t), key = new Float64Array(T);
        const toiletRank = (i, last, rec, loserAdv = true) => {
          const np = [];
          for (let t = 0; t < T; t++) if (last[t] === 0) np.push(t);
          const out = new Float64Array(T), k = np.length;
          if (!k) return out;
          const seed = np.map((t, j) => [rec(t), t, j]).sort((a, b) => (loserAdv ? a[0] - b[0] : b[0] - a[0]) || a[1] - b[1]).map(x => x[1]);
          const size = k >= 2 ? fieldSize(k) : 1;
          let cur = order(size).map(s => s <= k ? seed[s - 1] : -1);
          const left = new Float64Array(T);
          let rd = 0;
          while (cur.length > 1 && rd < roundScore.length) {
            const nxt = [];
            for (let j = 0; j < cur.length; j += 2) {
              const a = cur[j], b = cur[j + 1];
              let adv;
              if (b < 0) adv = a; else if (a < 0) adv = b;
              else {
                const sa = roundScore[rd][a][i], sb = roundScore[rd][b][i];
                adv = (loserAdv ? sa <= sb : sa >= sb) ? a : b; left[adv === a ? b : a] = rd + 1;
              }
              nxt.push(adv);
            }
            cur = nxt; rd++;
          }
          const stay = new Set(cur.filter(t => t >= 0));
          const kk = np.map(t => [(stay.has(t) ? 1e3 : left[t]) * -1e9 + rec(t), t]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
          kk.forEach(([, t], j) => { out[t] = j + 1; });
          return out;
        };
        for (let i = 0; i < N; i++) {
          const r = res.length ? res[i] : null, slot = new Array(T);
          if ((rule === "elimination" || rule === "first_round") && r) {
            const first = rule === "first_round", last = new Float64Array(T);
            r.rounds.forEach((sl, j) => sl.forEach(t => { if (t >= 0) last[t] = j + 1; }));
            last[r.champion] = r.rounds.length + 1;
            if ((first || K.tank.thirdPlace) && r.third !== null) { last[r.fourth] = r.rounds.length - 1 + 0.1; last[r.third] = r.rounds.length - 1 + 0.2; }
            const rec = t => S.wins[i * T + t] * 1e5 + S.pf[i * T + t];
            if (first) {
              for (let t = 0; t < T; t++) {
                const byMax = last[t] <= 1;
                key[t] = (byMax ? 0 : last[t]) * 1e9 + (byMax ? simMax[i * T + t] : rec(t));
              }
            } else {
              const np = K.tank.nonplayoff || "max_pf", tb = np === "toilet_bowl" || np === "consolation" ? toiletRank(i, last, rec, np === "toilet_bowl") : null;
              const by = K.tank.playoffBy || null;
              for (let t = 0; t < T; t++) {
                const first = np === "record" ? rec(t) : np === "pf" ? S.pf[i * T + t] : tb ? tb[t] : simMax[i * T + t];
                if (by === "seed") { key[t] = last[t] === 0 ? first : 1e9 - S.seeds[i * T + t]; continue; }
                const tie = by === "finish_max_pf" ? simMax[i * T + t] : by === "finish_pf" ? S.pf[i * T + t] : by === "finish" ? rec(t)
                  : last[t] === 1 && K.tank.firstRoundBy === "max_pf" ? simMax[i * T + t] : rec(t);
                key[t] = last[t] * 1e9 + (last[t] === 0 ? first : tie);
              }
            }
            idx.sort((a, b) => key[a] - key[b]).forEach((t, s) => { slot[t] = s + 1; });
          } else {
            const fin = r ? [r.champion, r.runnerUp, r.third, r.fourth].slice(0, K.tank.finishers).filter(x => x !== null && x !== undefined) : [];
            for (let t = 0; t < T; t++) key[t] = simMax[i * T + t];
            fin.forEach((t, j) => { slot[t] = T - j; key[t] = Infinity; });
            idx.sort((a, b) => key[a] - key[b]).slice(0, T - fin.length).forEach((t, s) => { slot[t] = s + 1; });
          }
          for (let t = 0; t < T; t++) slotCounts[t][slot[t] - 1]++;
        }
      }
      return { seedCounts, title, slotCounts, TW, S, roundScore, simMax };
    }

    const mean = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
    function pctl(a, qs) {
      const s = Float64Array.from(a).sort();
      return qs.map(q => { const x = (s.length - 1) * q, lo = Math.floor(x), f = x - lo; return lo + 1 < s.length ? s[lo] + f * (s[lo + 1] - s[lo]) : s[lo]; });
    }
    function summary(A, trades) {
      const share = c => c / N, k = K.playoffTeams;
      const teams = K.teams.map((name, t) => {
        const seeds = A.seedCounts[t].map(share);
        let w = 0; for (let i = 0; i < N; i++) w += A.S.wins[i * T + t];
        return { team: name, seeds, playoff: k ? seeds.slice(0, k).reduce((a, b) => a + b, 0) : 0, top: seeds[0],
                 bye: 0, title: share(A.title[t]), projW: w / N,
                 slots: A.slotCounts ? A.slotCounts[t].map(share) : null };
      });
      const byes = k >= 2 ? fieldSize(k) - k : 0;
      teams.forEach(r => { r.bye = r.seeds.slice(0, byes).reduce((a, b) => a + b, 0); });
      let bracket = [], npBracket = null;
      if (k >= 2 && K.roundsWeeks.length) {
        const exp = A.seedCounts.map(c => c.reduce((a, n, s) => a + n * (s + 1), 0));
        let pred = exp.map((_, t) => t).sort((a, b) => exp[a] - exp[b] || a - b);
        if (K.division) {
          const winners = [...new Set(K.division)].map(d => {
            const ts = K.division.map((x, t) => x === d ? t : -1).filter(t => t >= 0);
            return ts.reduce((a, b) => A.S.divWin[b] > A.S.divWin[a] ? b : a);
          }).sort((a, b) => exp[a] - exp[b] || a - b);
          pred = [...winners, ...pred.filter(t => !winners.includes(t))];
        }
        const pBeat = (r, a, b) => {
          const s = A.roundScore[r - 1]; let c = 0;
          for (let i = 0; i < N; i++) c += s[a][i] > s[b][i] ? 1 : s[a][i] === s[b][i] ? 0.5 : 0;
          return c / N;
        };
        const probs = {}, seedOf = {}; pred.forEach((t, s) => { seedOf[t] = s + 1; });
        const r = playBracket(pred, k, K.reseed, (rd, a, b) => { const p = pBeat(rd, a, b); probs[[rd, a, b]] = p; return p >= 0.5; });
        const rounds = K.roundsWeeks.length, hasByes = fieldSize(k) > k;
        const label = rd => { const left = rounds - rd; return left === 0 ? "Championship" : left === 1 ? "Semifinal" : left === 2 && !(rd === 1 && hasByes) ? "Quarterfinal" : `Round ${rd}`; };
        const projOfTeam = (t, ws) => pyRound(ws.reduce((s, w) => s + mean(A.TW[t][w].score), 0), 1);
        r.rounds.forEach((sl, j) => {
          const rd = j + 1, ws = K.roundsWeeks[j];
          for (let gi = 0; gi < sl.length / 2; gi++) {
            const a = sl[2 * gi], b = sl[2 * gi + 1];
            const base = { game: rd === rounds ? "F" : `R${rd}G${gi + 1}`, round: rd, slot: gi, label: label(rd), week: ws[0], weeks: ws,
                           feeds: rd === 1 ? null : [`R${rd - 1}G${2 * gi + 1}`, `R${rd - 1}G${2 * gi + 2}`], final: false };
            if (a < 0 || b < 0) {
              const t = a < 0 ? b : a;
              bracket.push({ ...base, kind: "bye", team1: K.teams[t], seed1: seedOf[t], proj1: null, team2: null, seed2: null, proj2: null, p1: 1, winner: K.teams[t] });
              continue;
            }
            const p1 = probs[[rd, a, b]];
            bracket.push({ ...base, kind: "game", team1: K.teams[a], seed1: seedOf[a], proj1: projOfTeam(a, ws), team2: K.teams[b], seed2: seedOf[b],
                           proj2: projOfTeam(b, ws), p1: pyRound(p1, 3), winner: K.teams[p1 >= 0.5 ? a : b] });
          }
        });
        if (r.third !== null) {
          const [a, b] = r.semi, ws = K.roundsWeeks[rounds - 1], p1 = probs[[rounds, a, b]];
          bracket.push({ game: "3P", round: rounds, slot: null, label: "3rd place", week: ws[0], weeks: ws, feeds: null, kind: "game", final: false,
                         team1: K.teams[a], seed1: seedOf[a], proj1: projOfTeam(a, ws), team2: K.teams[b], seed2: seedOf[b], proj2: projOfTeam(b, ws),
                         p1: pyRound(p1, 3), winner: K.teams[p1 >= 0.5 ? a : b] });
        }
        const npRule = K.tank && K.tank.nonplayoff, kNp = T - k;
        if ((npRule === "toilet_bowl" || npRule === "consolation") && kNp >= 2 && rounds >= nRounds(kNp)) {
          const toilet = npRule === "toilet_bowl", outT = pred.slice(k), glob = toilet ? [...outT].reverse() : outT;
          const npR = nRounds(kNp), npByes = fieldSize(kNp) > kNp, nprobs = {};
          const npLabel = rd => { const left = npR - rd; return left === 0 ? "Final" : left === 1 ? "Semifinal" : left === 2 && !(rd === 1 && npByes) ? "Quarterfinal" : `Round ${rd}`; };
          const rr = playBracket(glob.map((_, i) => i), kNp, false, (rd, a, b) => {
            const p = pBeat(rd, glob[a], glob[b]), q = toilet ? 1 - p : p;
            nprobs[[rd, a, b]] = q; return q >= 0.5;
          });
          const rows = [];
          rr.rounds.forEach((sl, j) => {
            const rd = j + 1, ws = K.roundsWeeks[j];
            for (let gi = 0; gi < sl.length / 2; gi++) {
              const a = sl[2 * gi], b = sl[2 * gi + 1];
              const base = { game: rd === npR ? "F" : `R${rd}G${gi + 1}`, round: rd, label: npLabel(rd), week: ws[0], weeks: ws, slot: gi,
                             feeds: rd === 1 ? null : [`R${rd - 1}G${2 * gi + 1}`, `R${rd - 1}G${2 * gi + 2}`] };
              if (a < 0 || b < 0) {
                const t = a < 0 ? b : a;
                rows.push({ ...base, kind: "bye", team1: K.teams[glob[t]], seed1: t + 1, proj1: null, team2: null, seed2: null, proj2: null, p1: 1, winner: K.teams[glob[t]], final: false });
                continue;
              }
              const p1 = nprobs[[rd, a, b]];
              rows.push({ ...base, kind: "game", team1: K.teams[glob[a]], seed1: a + 1, proj1: projOfTeam(glob[a], ws), team2: K.teams[glob[b]], seed2: b + 1,
                          proj2: projOfTeam(glob[b], ws), p1: pyRound(p1, 3), winner: K.teams[glob[p1 >= 0.5 ? a : b]], final: false });
            }
          });
          npBracket = { kind: npRule, rows };
        }
      }
      const touched = new Set(trades.flatMap(tr => tr.moves.flatMap(m => [m.from, m.to])).filter(t => t >= 0));
      const weeks = {};
      for (const t of touched) {
        weeks[K.teams[t]] = {};
        const inNow = K.partialWeek && trades.some(tr => tr.week <= K.partialWeek);
        for (const w of [...(inNow ? [K.partialWeek] : []), ...K.futureWeeks]) {
          const x = A.TW[t][w], [lo, hi] = pctl(x.score, [0.1, 0.9]);
          const e = { roster: x.roster || rosterAt(trades, t, w).map(r => r[0]), slots: x.slots, mean: mean(x.score), lo, hi };
          if (x.max) { const [mlo, mhi] = pctl(x.max, [0.1, 0.9]); e.max = [mean(x.max), mlo, mhi]; }
          weeks[K.teams[t]][w] = e;
        }
      }
      return { teams, bracket, npBracket, weeks, page: pageData(A) };
    }

    const roundHalfEven = v => { const f = Math.floor(v), d = v - f; return d > 0.5 ? f + 1 : d < 0.5 ? f : (f % 2 === 0 ? f : f + 1); };
    const median = a => { const s = Float64Array.from(a).sort(), n = s.length, h = n >> 1; return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
    const moneyline = p => {
      p = Math.min(Math.max(p, 0.01), 0.99);
      const ml = p >= 0.5 ? -100 * p / (1 - p) : 100 * (1 - p) / p;
      return Math.trunc(roundHalfEven(ml / 5) * 5);
    };
    const half = v => roundHalfEven(v * 2) / 2;
    function pBeat(sa, sb) {
      let c = 0, e = 0;
      for (let i = 0; i < N; i++) { if (sa[i] > sb[i]) c++; else if (sa[i] === sb[i]) e++; }
      return c / N + 0.5 * (e / N);
    }
    function pageData(A) {
      const k = K.playoffTeams, byes = k >= 2 ? fieldSize(k) - k : 0;
      const col = (arr, t) => { const a = new Float64Array(N); for (let i = 0; i < N; i++) a[i] = arr[i * T + t]; return a; };
      const out = { teams: [], sched: {}, lines: null, tank: null };
      const best = new Float64Array(N).fill(-Infinity);
      for (let i = 0; i < N; i++) for (let t = 0; t < T; t++) best[i] = Math.max(best[i], A.S.pf[i * T + t]);
      for (let t = 0; t < T; t++) {
        const pf = col(A.S.pf, t), [lo, hi] = pctl(pf, [0.1, 0.9]);
        const [winsLo, winsHi] = pctl(col(A.S.wins, t), [0.1, 0.9]);
        const seeds = A.seedCounts[t];
        let w = 0, most = 0;
        for (let i = 0; i < N; i++) { w += A.S.wins[i * T + t]; if (pf[i] === best[i]) most++; }
        const wk = {};
        for (const wkN of [...(K.partialWeek ? [K.partialWeek] : []), ...K.futureWeeks]) wk[wkN] = mean(A.TW[t][wkN].score);
        out.teams.push({ team: K.teams[t], wk, final: mean(pf), p10: lo, p90: hi, projW: w / N, winsLo, winsHi,
                         playoff: k ? seeds.slice(0, k).reduce((a, b) => a + b, 0) / N : 0,
                         bye: seeds.slice(0, byes).reduce((a, b) => a + b, 0) / N, top: seeds[0] / N,
                         title: A.title[t] / N, pfTitle: most / N, seeds: seeds.map(c => c / N) });
      }
      for (const w of K.simWeeks) {
        const opp = K.schedule[w];
        out.sched[w] = K.teams.map((_, t) => opp[t] < 0 ? null : pBeat(A.TW[t][w].score, A.TW[opp[t]][w].score));
      }
      const lw = K.simWeeks[0];
      if (lw !== undefined) {
        const games = [], seen = new Set(), opp = K.schedule[lw];
        for (let t = 0; t < T; t++) {
          const o = opp[t];
          if (o < 0 || seen.has(o + "," + t)) continue;
          seen.add(t + "," + o);
          const a = A.TW[t][lw].score, b = A.TW[o][lw].score, p = pBeat(a, b);
          const [fav, dog, pfav] = p >= 0.5 ? [t, o, p] : [o, t, 1 - p];
          const margin = new Float64Array(N), tot = new Float64Array(N);
          for (let i = 0; i < N; i++) { margin[i] = fav === t ? a[i] - b[i] : b[i] - a[i]; tot[i] = a[i] + b[i]; }
          games.push({ week: lw, favorite: K.teams[fav], underdog: K.teams[dog], fav_win: pfav, fav_ml: moneyline(pfav), dog_ml: moneyline(1 - pfav),
                       spread: half(median(margin)), total: half(median(tot)), fav_proj: mean(A.TW[fav][lw].score), dog_proj: mean(A.TW[dog][lw].score) });
        }
        games.sort((x, y) => y.fav_win - x.fav_win);
        out.lines = { week: lw, games };
      }
      if (K.tank && A.simMax) {
        const low = new Float64Array(N).fill(Infinity);
        for (let i = 0; i < N; i++) for (let t = 0; t < T; t++) low[i] = Math.min(low[i], A.simMax[i * T + t]);
        const lowPf = new Float64Array(N).fill(Infinity), lowKey = new Float64Array(N).fill(Infinity), key = new Float64Array(N * T);
        for (let i = 0; i < N; i++) for (let t = 0; t < T; t++) {
          const j = i * T + t; key[j] = A.S.wins[j] * 1e5 + A.S.pf[j];
          lowPf[i] = Math.min(lowPf[i], A.S.pf[j]); lowKey[i] = Math.min(lowKey[i], key[j]);
        }
        const maxWeeks = [...(K.partialWeek && K.partialWeek <= K.weekEnd ? [K.partialWeek] : []), ...regWeeks];
        out.tank = K.teams.map((name, t) => {
          const m = col(A.simMax, t), [lo, hi] = pctl(m, [0.1, 0.9]);
          let lowest = 0; for (let i = 0; i < N; i++) if (m[i] === low[i]) lowest++;
          const wk = {}; for (const w of maxWeeks) wk[w] = A.TW[t][w].max ? mean(A.TW[t][w].max) : 0;
          const slots = A.slotCounts[t].map(c => c / N);
          const pf = col(A.S.pf, t), wn = col(A.S.wins, t), [pfLo, pfHi] = pctl(pf, [0.1, 0.9]), [wLo, wHi] = pctl(wn, [0.1, 0.9]);
          let pfLowest = 0, wWorst = 0;
          for (let i = 0; i < N; i++) { if (pf[i] === lowPf[i]) pfLowest++; if (key[i * T + t] === lowKey[i]) wWorst++; }
          const winsWk = {}; for (const w in A.S.wkWins) winsWk[w] = A.S.wkWins[w][t] / N;
          return { team: name, wk, winsWk, final: mean(m), lo, hi, lowest: lowest / N, slots, expSlot: slots.reduce((s, p, j) => s + p * (j + 1), 0),
                   playoff: k ? A.seedCounts[t].slice(0, k).reduce((a, b) => a + b, 0) / N : 0,
                   pf: { final: mean(pf), lo: pfLo, hi: pfHi, lowest: pfLowest / N }, wins: { final: mean(wn), lo: wLo, hi: wHi, lowest: wWorst / N } };
        });
      }
      return out;
    }

    return { analyze, summary, rosterAt, impact, scenario };
  }

  return { create, unpack, uniforms, drawKey, npSum, order, playBracket };
})();

if (typeof module !== "undefined" && module.exports) module.exports = WhatIf;
if (typeof self !== "undefined" && typeof window === "undefined" && typeof module === "undefined") {
  let sim = null, lastKey = null, lastA = null, liteKey = null, liteA = null;
  self.onmessage = e => {
    try {
      if (e.data.kit) { sim = WhatIf.create(e.data.kit); lastKey = lastA = liteKey = liteA = null; self.postMessage({ id: e.data.id, ready: true }); return; }
      const t0 = Date.now(), trades = e.data.trades || [];
      const key = JSON.stringify(trades);
      if (e.data.scenario) {
        const A = key === lastKey ? lastA : key === liteKey ? liteA : (liteA = sim.analyze(trades, { lite: true }), liteKey = key, liteA);
        self.postMessage({ id: e.data.id, result: sim.scenario(A, e.data.scenario), ms: Date.now() - t0 }); return;
      }
      const A = key === lastKey ? lastA : (lastA = sim.analyze(trades), lastKey = key, lastA);
      if (e.data.impact) { self.postMessage({ id: e.data.id, result: sim.impact(A), ms: Date.now() - t0 }); return; }
      self.postMessage({ id: e.data.id, result: sim.summary(A, trades), ms: Date.now() - t0 });
    } catch (err) { self.postMessage({ id: e.data.id, error: String(err && err.stack || err) }); }
  };
}
