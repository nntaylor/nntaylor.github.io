// "How Contendathon Works" (was "How the odds get made"), drawn live in a <canvas> (user, 2026-10-14: animations instead of a video). The same
// slides and wording as methodology/methodology_gif.py (wide, 720 x 405) and mobile_scenes.py (phones, 420 x 260),
// in the page's own fonts, sharp at any size. ~15 KB; it only runs while it's on screen and open.
//   const stop = howExplainer(canvas)   starts it (loops); stop() stops it
(() => {
  const BG = "#05091d", CARD = "#131b38", CARD2 = "#1c2546", HAIR = "#2d3650";
  const CYAN = "#00e1e0", CYAN_T = "#00fff9", AMBER = "#ffab0e", RED = "#ff8075", GREEN = "#28e757", PINK = "#ff80ad";
  const TXT = "#f0f2f6", TXT2 = "#b7c5d4", MUTED = "#8996aa", FPS = 12;
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
  const pop = t => t < 1 ? 1 + 0.25 * Math.sin(Math.PI * Math.max(0, Math.min(1, t))) : 1;
  const hexa = (c, a) => {  // blend a color into the background (fades without transparency)
    const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)), q = p(c), b = p(BG);
    return "#" + q.map((v, i) => Math.round(b[i] + (v - b[i]) * Math.max(0, Math.min(1, a))).toString(16).padStart(2, "0")).join("");
  };
  // the same pretend data every time (a fixed seed)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const DROPS = Array.from({ length: 46 }, gauss);
  const NAMES = ["You", "Kyle", "Dana", "Marco", "Priya", "Bo"];
  const SEASONS = [["Kyle", "You", "Dana", "Marco", "Priya", "Bo"]].concat(Array.from({ length: 29 }, () => [...NAMES].sort(() => rnd() - 0.5)));
  const TITLES = [["You", 2300], ["Kyle", 3105], ["Dana", 1890], ["Marco", 1402], ["Priya", 887], ["Bo", 404]];

  const LAYOUTS = {
    wide: { W: 720, H: 405, cap: [600, 24], F: { h1: [34, 1], h2: [24, 1], b: [18, 1], t: [17, 0], s: [14, 0], big: [64, 1], num: [28, 1], tiny: [12, 0] } },
    phone: { W: 420, H: 260, cap: [390, 21], F: { h1: [32, 1], h2: [21, 1], b: [18, 1], t: [17, 0], s: [15, 0], big: [46, 1], num: [40, 1], tiny: [12, 0] } },
  };

  function make(ctx, L) {
    const { W, H } = L;
    const font = k => { const [px, bold] = L.F[k]; return `${bold ? 700 : 400} ${px}px ${bold ? "Poppins" : "Inter"}, system-ui, sans-serif`; };
    const ANCH = { mm: ["center", "middle"], la: ["left", "top"], lm: ["left", "middle"], ra: ["right", "top"], rm: ["right", "middle"] };
    const text = (x, y, s, f, fill = TXT, anchor = "la") => {
      ctx.font = font(f); ctx.fillStyle = fill; [ctx.textAlign, ctx.textBaseline] = ANCH[anchor]; ctx.fillText(s, x, y);
    };
    const wrap = (s, f, width) => {
      ctx.font = font(f); const out = []; let cur = "";
      for (const w of s.split(" ")) { const t = (cur + " " + w).trim(); if (ctx.measureText(t).width <= width) cur = t; else { out.push(cur); cur = w; } }
      return out.concat(cur);
    };
    const caption = (s, a, y, f = "t") => wrap(s, f, L.cap[0]).forEach((line, i) => text(W / 2, y + i * L.cap[1], line, f, hexa(TXT2, a), "mm"));
    const rr = (x0, y0, x1, y1, r, fill, stroke, lw) => {
      ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    };
    const disk = (cx, cy, r, fill) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill(); };
    const oval = (x0, y0, x1, y1, fill) => { ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, 0, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill(); };
    const arc = (cx, cy, r, a0, a1, color, lw) => { ctx.beginPath(); ctx.arc(cx, cy, r, a0 * Math.PI / 180, a1 * Math.PI / 180); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.stroke(); };
    const line = (pts, color, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); };
    const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };

    // the host (2026-10-15, user: the Tankathon's tank, "A3 revised", instead of the coffee robot): drawn from the
    // tank's own drawing (x 22-192, y 52-142 in its units), centred on x, sitting where the robot's feet were, bobbing
    function robot(x, y, s, t) {
      y += Math.sin(t * 6) * 3 * s;
      const u = 0.5 * s, X = v => x + (v - 107) * u, Y = v => y + 62 * s + (v - 142) * u, lw = Math.max(2, 3.6 * u * 1.6);
      oval(x - 44 * s, y + 66 * s, x + 44 * s, y + 76 * s, "#03060f");
      // "T4" (user, 2026-10-16: the app icon's tank, no tile): the barrel raised 28 degrees about the dome's shoulder,
      // a puff of smoke at the muzzle
      ctx.save(); ctx.translate(X(108), Y(68)); ctx.rotate(-28 * Math.PI / 180);
      const R = v => v * u;  // the tank's units, relative to the pivot (108, 68)
      rr(R(-4), R(-6), R(76), R(6), 6 * u, CARD2, CYAN, lw);                           // barrel
      rr(R(72), R(-10), R(84), R(10), 4 * u, CARD2, CYAN, lw);                         // its nub
      for (const [px, py, pr] of [[99, -10, 7], [108, -19, 5.2], [96, -22, 4]]) disk(R(px), R(py), pr * u, hexa("#c6cde6", 0.6));
      ctx.restore();
      rr(X(22), Y(96), X(178), Y(142), 23 * u, CARD2, CYAN, lw);                      // hull
      for (const cx of [50, 80, 110, 140]) disk(X(cx), Y(119), 8.5 * u, AMBER);      // gold wheels
      ctx.beginPath(); ctx.ellipse(X(86), Y(90), 40 * u, 38 * u, 0, Math.PI, 2 * Math.PI); ctx.closePath();
      ctx.fillStyle = CARD2; ctx.fill(); ctx.strokeStyle = CYAN; ctx.lineWidth = lw; ctx.stroke();   // dome
      rr(X(40), Y(88), X(132), Y(98), 5 * u, CARD2, CYAN, lw);                        // collar
      const blink = (t * 0.45) % 1 > 0.94;  // a blink now and then
      for (const ex of [73, 99]) {
        if (blink) arc(X(ex), Y(70), 5 * u, 200, 340, CYAN_T, Math.max(1.5, 2.6 * u));
        else { disk(X(ex), Y(68), 6.5 * u, CYAN_T); disk(X(ex + 2), Y(66), 2.2 * u, "#ffffff"); }
      }
      disk(X(63), Y(79), 4.5 * u, hexa(PINK, 0.8)); disk(X(109), Y(79), 4.5 * u, hexa(PINK, 0.8));
      arc(X(86), Y(76), 6 * u, 30, 150, CYAN_T, Math.max(1.5, 3 * u));
    }
    function trophy(x, y, s, color = AMBER) {
      ctx.beginPath(); ctx.arc(x, y - 18 * s, 12 * s, 0, Math.PI); ctx.fillStyle = color; ctx.fill();
      ctx.fillRect(x - 12 * s, y - 30 * s, 24 * s, 12 * s);
      arc(x - 14 * s, y - 22 * s, 6 * s, 90, 270, color, 3); arc(x + 14 * s, y - 22 * s, 6 * s, 270, 450, color, 3);
      ctx.fillRect(x - 3 * s, y - 8 * s, 6 * s, 6 * s); ctx.fillRect(x - 10 * s, y - 3 * s, 20 * s, 5 * s);
    }
    function die(dx, dy, f, r) {
      const ang = f * 0.45;
      poly([0, 1, 2, 3].map(k => [dx + r * Math.cos(ang + k * Math.PI / 2), dy + r * Math.sin(ang + k * Math.PI / 2)]), TXT);
      const face = Math.floor(f / 4) % 6 + 1, P = { 1: [[0, 0]], 2: [[-.5, -.5], [.5, .5]], 3: [[-.5, -.5], [0, 0], [.5, .5]], 4: [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]],
        5: [[-.5, -.5], [.5, -.5], [0, 0], [-.5, .5], [.5, .5]], 6: [[-.5, -.6], [.5, -.6], [-.5, 0], [.5, 0], [-.5, .6], [.5, .6]] }[face];
      const pr = r * 0.58, q = Math.max(3, r / 9);
      for (const [px, py] of P) disk(dx + pr * (px * Math.cos(ang) - py * Math.sin(ang)), dy + pr * (px * Math.sin(ang) + py * Math.cos(ang)), q, BG);
    }
    const curve = (cx, base, w, h, grow = 1) => Array.from({ length: 81 }, (_, i) => { const z = -3 + 6 * i / 80;
      return [cx + z / 3 * w / 2, base - h * grow * Math.exp(-0.5 * z * z)]; });
    function bell(cx, base, w, h, grow, bandFill, lw) {
      const pts = curve(cx, base, w, h, grow);
      const band = bandFill ? pts.filter(p => Math.abs(p[0] - cx) <= w / 6) : pts;
      poly([[band[0][0], base], ...band, [band[band.length - 1][0], base]], hexa(CYAN, bandFill ? 0.25 : 0.18));
      line(pts, CYAN, lw); line([[cx - w / 2, base], [cx + w / 2, base]], HAIR, 2);
    }
    function drops(cx, base, w, t, r, fall) {
      // each dot falls into its column (one dot wide) and lands on top of the dots already there: the pile grows
      // into the bell's shape (2026-10-15, user: they used to land on the line, then jump to an unrelated height)
      const shown = Math.floor(DROPS.length * Math.min(1, t * 1.25)), col = 2 * r + 1, level = new Map();
      DROPS.slice(0, shown).forEach((z, i) => {
        const c = Math.round(Math.max(-3, Math.min(3, z)) / 3 * w / 2 / col), k = level.get(c) || 0;
        level.set(c, k + 1);
        const x = cx + c * col, top = base - r - 1 - k * col, age = t * 1.25 * DROPS.length - i;
        disk(x, age < 3 ? top - (1 - ease(age / 3)) * fall : top, r, AMBER);
      });
      return shown;
    }
    const pts = shown => (18.4 + DROPS[Math.min(shown, DROPS.length) - 1] * 5).toFixed(1);
    const standings = (x0, y0, x1, row, f, t, pad, rowY) => SEASONS[0].forEach((team, i) => {
      const a = ease(t * 6 - i * 0.5), wins = Math.max(1, 12 - i * 2 + (team === "You" ? 1 : 0));
      text(x0 + pad, rowY + i * row, `${i + 1}. ${team}`, f, hexa(team === "You" ? CYAN_T : TXT, a), "lm");
      text(x1 - pad, rowY + i * row, `${wins}-${14 - wins}`, f, hexa(TXT2, a), "rm");
    });

    const wide = {
      title(t, f) { robot(W / 2, 160, 1.25, f / FPS); text(W / 2, 290, "How the odds get made", "h1", hexa(TXT, ease(t * 3)), "mm"); },
      projection(t, f) {
        text(W / 2, 40, "1. Every player gets a projection", "h2", CYAN_T, "mm");
        const x0 = 210 + (1 - ease(t * 2.5)) * -420;
        rr(x0, 100, x0 + 300, 240, 18, CARD, HAIR, 2); rr(x0 + 18, 120, x0 + 62, 142, 6, hexa(PINK, 0.9)); text(x0 + 40, 131, "QB", "s", BG, "mm");
        text(x0 + 76, 116, "Joe Burrow", "b", TXT, "lm"); text(x0 + 76, 140, "CIN · week 7", "s", MUTED, "lm");
        text(x0 + 150, 198, `${(18.4 * Math.min(1, t * 1.8)).toFixed(1)} pts`, "big", t > 0.55 ? AMBER : TXT, "mm");
        caption("Each player has a projected score.", ease(t * 3), 320);
      },
      bands(t) {
        text(W / 2, 40, "2. Each projection gets a range", "h2", CYAN_T, "mm");
        bell(W / 2, 268, 520, 170, ease(t * 1.6), true, 4);
        if (t > 0.4) for (const [z, lab, col] of [[-2, "bad day: 9", RED], [0, "likely: 18", AMBER], [2.2, "big game: 31", GREEN]]) {
          const x = W / 2 + z / 3 * 260, a = ease((t - 0.4) * 4);
          line([[x, 268], [x, 276]], hexa(col, a), 3); text(x, 290, lab, "s", hexa(col, a), "mm");
        }
        caption("Ranges based on historical performance vs. projection", ease(t * 3), 336);
      },
      dice(t, f) {
        text(W / 2, 40, "3. Roll the dice", "h2", CYAN_T, "mm");
        bell(250, 250, 340, 120, 1, false, 3);
        const shown = drops(250, 250, 340, t, 5, 120);
        die(560, 170 + 18 * Math.sin(f * 0.5), f, 38);
        if (shown) text(560, 250, `this week: ${pts(shown)} pts`, "b", AMBER, "mm");
        caption("Every week, each player gets a random score from his range.", ease(t * 3), 330);
      },
      season(t) {
        text(W / 2, 40, "4. Play one season", "h2", CYAN_T, "mm");
        rr(200, 74, 520, 300, 16, CARD, HAIR, 2); text(220, 92, "STANDINGS", "s", MUTED);
        standings(200, 0, 520, 28, "t", t, 26, 132);
        if (t > 0.6) { ctx.save(); const s = 1.6 * pop((t - 0.6) * 3); trophy(628, 200, s); ctx.restore(); text(628, 232, `${SEASONS[0][0]} wins it all`, "b", AMBER, "mm"); }
        caption("Lineups add up, the schedule and playoffs play out. That's one season.", ease(t * 3), 340);
      },
      tenk(t, f) {
        text(W / 2, 40, "5. Now do it 10,000 times", "h2", CYAN_T, "mm");
        text(W / 2, 140, `season #${Math.floor(1 + 9999 * ease(t / 0.8) ** 2).toLocaleString("en-US")}`, "big", AMBER, "mm");
        for (let i = 0; i < 5; i++) { const x = 120 + i * 120, c = SEASONS[(Math.floor(f / 2) + i) % 30][0];
          rr(x - 46, 196, x + 46, 252, 10, CARD, HAIR, 1); text(x, 214, "champ:", "tiny", MUTED, "mm"); text(x, 234, c, "b", c === "You" ? CYAN_T : TXT, "mm"); }
        caption("Same rules, different dice.", ease(t * 3), 320);
      },
      count(t) {
        text(W / 2, 40, "6. Count it up", "h2", CYAN_T, "mm");
        TITLES.forEach(([team, wins], i) => { const y = 86 + i * 34, g = ease(t * 2 - i * 0.12), w = 300 * wins / 3105 * g;
          text(250, y + 11, team, "b", team === "You" ? CYAN_T : TXT, "rm");
          if (w > 18) rr(264, y, 264 + w, y + 22, 8, team === "You" ? CYAN : hexa(TXT2, 0.45)); });
        if (t > 0.5) text(W / 2, 330, "23% = 2,300 of 10,000 seasons", "h2", hexa(AMBER, ease((t - 0.5) * 4)), "mm");
      },
      end(t, f) { const a = ease(t * 3); robot(W / 2, 140, 1.15, f / FPS);
        text(W / 2, 252, "Not a guarantee.", "h1", hexa(TXT, a), "mm"); text(W / 2, 292, "Just 10,000 simulated seasons.", "t", hexa(TXT2, a), "mm");
        text(W / 2, 344, "contendathon.com", "b", hexa(CYAN_T, a), "mm"); },
    };
    const head = s => text(W / 2, 26, s, "h2", CYAN_T, "mm");
    const phone = {
      title(t, f) { const a = ease(t * 3); robot(110, 86, 1, f / FPS); text(290, 108, "How the odds", "h1", hexa(TXT, a), "mm"); text(290, 146, "get made", "h1", hexa(TXT, a), "mm"); },
      projection(t) {
        head("1. Every player gets a projection");
        const x0 = 70 + (1 - ease(t * 2.5)) * -360;
        rr(x0, 54, x0 + 280, 176, 16, CARD, HAIR, 2); rr(x0 + 16, 70, x0 + 56, 90, 6, hexa(PINK, 0.9)); text(x0 + 36, 80, "QB", "s", BG, "mm");
        text(x0 + 68, 76, "Joe Burrow", "b", TXT, "lm"); text(x0 + 68, 97, "CIN · week 7", "s", MUTED, "lm");
        text(x0 + 140, 142, `${(18.4 * Math.min(1, t * 1.8)).toFixed(1)} pts`, "big", t > 0.55 ? AMBER : TXT, "mm");
        caption("Each player has a projected score.", ease(t * 3), 222);
      },
      bands(t) {
        head("2. Each projection gets a range");
        bell(W / 2, 168, 340, 110, ease(t * 1.6), true, 4);
        if (t > 0.4) for (const [z, lab, col] of [[-2, "bad day 9", RED], [0, "likely 18", AMBER], [2.1, "big game 31", GREEN]]) {
          const x = W / 2 + z / 3 * 170, a = ease((t - 0.4) * 4);
          line([[x, 168], [x, 174]], hexa(col, a), 3); text(x, 186, lab, "s", hexa(col, a), "mm");
        }
        // two balanced lines, clear of the bottom edge (user, 2026-10-16)
        ["Ranges based on historical", "performance vs. projection"].forEach((l, i) => text(W / 2, 212 + i * L.cap[1], l, "t", hexa(TXT2, ease(t * 3)), "mm"));
      },
      dice(t, f) {
        head("3. Roll the dice");
        bell(150, 160, 240, 92, 1, false, 3);
        const shown = drops(150, 160, 240, t, 4, 90);
        die(338, 100 + 8 * Math.sin(f * 0.5), f, 30);
        if (shown) text(338, 162, `${pts(shown)} pts`, "b", AMBER, "mm");
        caption("Every week, each player gets a random score from his range.", ease(t * 3), 210);
      },
      season(t) {
        head("4. Play one season");
        rr(24, 48, 244, 196, 14, CARD, HAIR, 2); standings(24, 0, 244, 22, "s", t, 16, 62);
        if (t > 0.6) { trophy(332, 120, 1.4 * pop((t - 0.6) * 3)); text(332, 150, `${SEASONS[0][0]} wins it all`, "b", AMBER, "mm"); }
        caption("Lineups add up, the schedule and playoffs play out. That's one season.", ease(t * 3), 214);
      },
      tenk(t, f) {
        head("5. Now do it 10,000 times");
        text(W / 2, 92, `season #${Math.floor(1 + 9999 * ease(t / 0.8) ** 2).toLocaleString("en-US")}`, "num", AMBER, "mm");
        for (let i = 0; i < 3; i++) { const x = 80 + i * 130, c = SEASONS[(Math.floor(f / 2) + i) % 30][0];
          rr(x - 54, 128, x + 54, 180, 10, CARD, HAIR, 1); text(x, 144, "champ:", "tiny", MUTED, "mm"); text(x, 164, c, "b", c === "You" ? CYAN_T : TXT, "mm"); }
        caption("Same rules, different dice.", ease(t * 3), 226);
      },
      count(t) {
        head("6. Count it up");
        TITLES.forEach(([team, wins], i) => { const y = 50 + i * 24, g = ease(t * 2 - i * 0.12), w = 260 * wins / 3105 * g;
          text(96, y + 9, team, "s", team === "You" ? CYAN_T : TXT, "rm");
          if (w > 14) rr(106, y + 1, 106 + w, y + 17, 6, team === "You" ? CYAN : hexa(TXT2, 0.45)); });
        if (t > 0.5) text(W / 2, 214, "23% = 2,300 of 10,000 seasons", "h2", hexa(AMBER, ease((t - 0.5) * 4)), "mm");
      },
      end(t, f) { const a = ease(t * 3); robot(100, 96, 1, f / FPS);
        text(282, 96, "Not a guarantee.", "h2", hexa(TXT, a), "mm"); text(282, 128, "Just 10,000 simulated seasons.", "s", hexa(TXT2, a), "mm");
        text(282, 168, "contendathon.com", "b", hexa(CYAN_T, a), "mm"); },
    };
    return L === LAYOUTS.wide ? wide : phone;
  }

  // [scene, seconds it plays]: then it holds on its last picture until every slide has lasted SLIDE seconds (user,
  // 2026-10-15: each slide the same length, the longest one plus a second). One file for the landing page and every
  // league page (both tabs load /how/explainer.js), so they always match
  const SLIDE = 7.6;
  const SCENES = [["title", 2.0], ["projection", 3.0], ["bands", 3.6], ["dice", 3.8], ["season", 3.4], ["tenk", 3.2],
                  ["count", 3.6], ["end", 2.6]].map(([n, play]) => [n, play, SLIDE - play - (n === "title" || n === "end" ? 3 : 0)]);
  // (user, 2026-10-15) the title and the ending 3 s shorter than the rest
  const TOTAL = SCENES.reduce((a, [, s, h]) => a + s + h, 0);

  window.howExplainer = canvas => {
    const ctx = canvas.getContext("2d");
    let L = null, draw = null, raf = 0, t0 = performance.now(), visible = true;
    const fit = () => {  // the layout by the box's width; drawn at the screen's pixel density
      const cw = canvas.parentElement.clientWidth || 360;
      const nl = cw < 520 ? LAYOUTS.phone : LAYOUTS.wide;
      if (nl !== L) { L = nl; draw = make(ctx, L); }
      const dpr = Math.min(window.devicePixelRatio || 1, 3), h = cw * L.H / L.W;
      canvas.style.width = cw + "px"; canvas.style.height = h + "px";
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(canvas.width / L.W, 0, 0, canvas.height / L.H, 0, 0);
    };
    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      let s = ((now - t0) / 1000) % TOTAL;
      const [name, play, hold] = SCENES.find(([, d, h]) => (s -= d + h) < 0) || SCENES[0], secs = play + hold, into = secs + s;
      const t = Math.min(1, into / play), f = into * FPS;  // f keeps running through a hold (the tank's bob, the die)
      ctx.fillStyle = BG; ctx.fillRect(0, 0, L.W, L.H);
      ctx.globalAlpha = Math.max(0, Math.min(1, into / 0.33, (secs - into) / 0.33));  // fade between slides
      draw[name](t, f);
      ctx.globalAlpha = 1;
    };
    const io = "IntersectionObserver" in window ? new IntersectionObserver(e => { visible = e[0].isIntersecting; }) : null;
    if (io) io.observe(canvas);
    addEventListener("resize", fit);
    const go = () => { fit(); t0 = performance.now(); raf = requestAnimationFrame(frame); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
    return () => { cancelAnimationFrame(raf); if (io) io.disconnect(); removeEventListener("resize", fit); };
  };
})();
