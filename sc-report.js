/* SC Report v4 — assembles a complete Awareness Profile report from an engine result.
   Works in the browser (window.SCReport) and in Node (require). */
(function (root) {
  const E = root.SCEngine || (typeof require !== 'undefined' && require('./sc-engine.js'));
  const G = root.SCGeo || (typeof require !== 'undefined' && require('./sc-geo.js'));
  const L = root.SCReportLibrary || (typeof require !== 'undefined' && require('./sc-report-library.js'));
  const COL = { Narc: '#C4622D', Empath: '#1D9E75', Grounded: '#534AB7', Volatile: '#A0426B' };
  const r0 = Math.round;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const state = b => b >= 20 ? 'ok' : b > -20 ? 'lean' : 'hot';
  const STATE = { ok: ['Balanced', '#2F8A5B', '#E3F3EA'], lean: ['Leaning', '#A9740F', '#FBF0D9'], hot: ['Needs balancing', '#C2413A', '#FBE4E2'] };
  const chip = s => `<span class="chip" style="color:${STATE[s][1]};background:${STATE[s][2]}">${STATE[s][0]}</span>`;
  const band = (v, lo, hi) => v < lo ? 'low' : v < hi ? 'moderate' : 'high';
  const word = ['', 'Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

  function build(R, meta = {}, test = null, answers = null) {
    const T = L.TYPES[R.type] || L.TYPES.mixed;
    const ranked = E.PATTERNS.slice().sort((a, b) => (R.patterns[b].shadow || 0) - (R.patterns[a].shadow || 0));
    const sec = (n, kicker, title, body) => `<section class="sec"><div class="kick"><span>${String(n).padStart(2, '0')}</span>${esc(kicker)}</div><h2>${esc(title)}</h2>${body}</section>`;
    let n = 0, h = '';
    // ---- cover
    h += `<header class="cover"><div class="brand">${meta.logo ? `<img src="${esc(meta.logo)}" alt="PsyTectrics" class="logo">` : 'PSYTECTRICS™'}<span>Awareness Profile</span></div><div class="your">Your result</div><h1>${esc(T.name)}</h1><p class="tag">${esc(T.tag)}</p>
      <div class="meta">${esc(meta.name || '')}${meta.date ? ' · ' + esc(meta.date) : ''}${meta.code ? ' · <code>' + esc(meta.code.split('-').slice(0, 2).join('-')) + '</code>' : ''}</div></header>`;
    // ---- scores ranked
    h += `<section class="scores"><h3>Your scores</h3><p class="note">Your four patterns, ranked by how strongly their protective side shows up. Light is the healthy side of each pattern; shadow is the protective side that takes over under pressure.</p>`;
    ranked.forEach(p => { const P = R.patterns[p]; h += `<div class="srow"><span class="pn" style="color:${COL[p]}">${p}</span>
      <div class="bars"><div class="bar"><i style="width:${r0(P.shadow)}%;background:${COL[p]}"></i></div><div class="bar light"><i style="width:${r0(P.light)}%;background:${COL[p]}"></i></div></div>
      <span class="pv">shadow ${r0(P.shadow)}<br><em>light ${r0(P.light)}</em></span></div>`; });
    h += `<div class="measures">${[
      ['Level', `${R.level}/10`, `${R.stage} · ring ${R.ring} of 5`],
      ['Lean', E.leanLabel(R.lean), 'Narc ↔ Empath'],
      ['Charge', r0(R.charge), L.MEASURES.charge[band(R.charge, 35, 60)]],
      ['Regulation', r0(R.regulation), L.MEASURES.regulation[band(R.regulation, 40, 65)]],
      ['Drift', R.drift.toFixed(1), L.MEASURES.drift[band(R.drift, 1.5, 2.5)]]
    ].map(([k, v, s]) => `<div class="m"><span class="k">${k}</span><span class="v">${esc(v)}</span><span class="s">${esc(s)}</span></div>`).join('')}</div></section>`;
    // ---- part 1
    h += `<div class="part">Part one · Meet your pattern</div>`;
    h += sec(++n, 'Your result', T.name, `<p>${esc(T.intro)}</p>`);
    h += sec(++n, 'Your level', `Level ${R.level} · ${R.stage}`, `<p>${esc(L.STAGES[R.stage])}</p><p>On the board, that puts you on ring ${R.ring} of 5. Every level up is a ring closer to Zero-Point — the balance point between the two roles, where neither one is in charge.</p>`);
    h += sec(++n, 'Your four patterns', 'Light and shadow', E.PATTERNS.map(p => { const P = R.patterns[p], s = state(P.light - P.shadow);
      return `<div class="pat"><h4 style="color:${COL[p]}">${p} ${chip(s)}</h4><p><strong>What it is.</strong> ${esc(L.PATTERN_TEXT[p].what)}</p><p><strong>Its gift.</strong> ${esc(L.PATTERN_TEXT[p].gift)}</p><p class="nums">Your light ${r0(P.light)} · your shadow ${r0(P.shadow)}</p></div>`; }).join(''));
    // ---- part 2 map
    h += `<div class="part">Part two · Your Balance Map</div>`;
    h += sec(++n, 'Your Balance Map', 'Where your balance sits', `<div class="map">${G.svg(R)}</div><p class="note">Zero-Point is the centre. Narc pulls left, Empath right, Grounded up, Volatile down. Each circle is one of your 16 codes: green is balanced, amber is leaning, red needs balancing. The number is light minus shadow. The highlighted ring is where you are now.</p>`);
    // ---- part 3 codes
    h += `<div class="part">Part three · Code by code</div>`;
    E.PATTERNS.forEach(p => {
      const ids = Object.keys(E.NODES).filter(id => E.NODES[id].pattern === p && R.nodes[id]);
      if (!ids.length) return;
      h += sec(++n, p, `Your ${p} codes`, ids.map(id => { const c = R.nodes[id], s = state(c.balance);
        return `<div class="code"><h4>${esc(c.name)} ${chip(s)}</h4><p>${esc(L.CODES[id][s])}</p></div>`; }).join(''));
    });
    // ---- part 4 needs balancing
    h += `<div class="part">Part four · What needs balancing</div>`;
    h += sec(++n, 'Your next three moves', 'What needs balancing', R.needs.length ? R.needs.map((c, i) =>
      `<div class="need" style="border-color:${COL[c.pattern]}"><h4>${i + 1}. ${esc(c.name)} <span class="pnm">${c.pattern}</span></h4><p>${esc(L.CODES[c.id][state(c.balance)])}</p><p class="fix"><strong>Try this:</strong> ${esc(c.fix)}</p><p class="ch">${esc(c.ch)}</p></div>`).join('')
      : '<p>Nothing is pulling you far off centre. Your work now is keeping the Observer position under real pressure (Chapter 11).</p>');
    // ---- part 5 people
    h += `<div class="part">Part five · People, love and work</div>`;
    const loud = E.PATTERNS.filter(p => (R.patterns[p].shadow || 0) >= 55);
    const lines = (loud.length ? loud : ['steady']).flatMap(p => L.WORK_WITH_ME[p]);
    h += sec(++n, 'Lines to hand over', 'How to work with me', `<p>Pass these on to a partner, co-parent, friend or manager. They are written in your voice.</p><ul class="lines">${lines.map(l => `<li>"${esc(l)}"</li>`).join('')}</ul>`);
    if (test && answers) {
      const rows = test.items.map(it => ({ ...it, a: answers[it.id] })).filter(x => x.a >= 4);
      const sh = rows.filter(x => x.side === 'shadow' || x.side === 'role').sort((a, b) => b.a - a.a).slice(0, 4);
      const li = rows.filter(x => x.side === 'light').sort((a, b) => b.a - a.a).slice(0, 4);
      h += sec(++n, 'In your own words', 'What you told us', `<div class="two"><div><h4>Strengths you claimed</h4><ul>${li.map(x => `<li>"${esc(x.text)}" <em>${word[x.a]}</em></li>`).join('') || '<li>None at Agree or above.</li>'}</ul></div><div><h4>Patterns you recognised</h4><ul>${sh.map(x => `<li>"${esc(x.text)}" <em>${word[x.a]}</em></li>`).join('') || '<li>None at Agree or above.</li>'}</ul></div></div>`);
    }
    // ---- part 6 road ahead
    h += `<div class="part">Part six · The road ahead</div>`;
    const focus = R.needs[0];
    h += sec(++n, 'Four weeks', 'A small experiment', `<ol class="weeks">
      <li><strong>Week 1 — Notice.</strong> Each time ${focus ? 'your ' + esc(focus.name) + ' pattern' : 'a familiar reaction'} shows up, make a mark. No changing anything yet.</li>
      <li><strong>Week 2 — Name it.</strong> Say it out loud or to yourself when it starts: ${focus ? esc(focus.fix) : '"I\'m noticing I\'m reacting."'}</li>
      <li><strong>Week 3 — Interrupt early.</strong> Act on the first warning sign, not the last. Slow down by one beat.</li>
      <li><strong>Week 4 — Repair and re-check.</strong> Go back to one moment that didn't go well and repair it. Then retake the free Quick Check and compare your map.</li></ol>`);
    if (R.drift >= 3 || R.regulation < 30) h += `<section class="care"><h4>Looking after yourself</h4><p>Some of your answers suggest things have felt heavy or hard to hold lately. If that is affecting your day-to-day life, it is worth talking it through with your GP or someone you trust.</p></section>`;
    if (meta.code) h += `<section class="codebox"><h4>Your Source Code</h4><code>${esc(meta.code)}</code><p>Your full assessment, encrypted. The start shows your level and lean (${esc(meta.code.split('-')[1] || '')}). Keep it to unlock Profile Chat, share with a practitioner, or compare your next assessment.</p></section>`;
    h += `<footer class="disc">This report describes patterns in how you respond under pressure. It is a self-reflection tool, not a psychological assessment or diagnosis, and it is not a substitute for professional advice. Based on the SC Framework™ and the book <em>Narcissist / Yarcissist</em>. PsyTectrics™ · psytectrics.com</footer>`;
    return h;
  }

  const CSS = `
  .scr{--ink:#0B1020;--muted:#5D6475;--line:#E3E6EE;--soft:#F4F6F9;--accent:#00B8DE;font-family:Inter,system-ui,sans-serif;color:var(--ink);line-height:1.65;font-size:15px;max-width:760px;margin:0 auto}
  .scr h1,.scr h2{font-family:Montserrat,system-ui,sans-serif;font-weight:300;line-height:1.1;margin:0}
  .scr .cover{background:#02050E;color:#fff;padding:36px 36px 40px;border-radius:4px;margin-bottom:28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .scr .brand{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.scr .brand .logo{height:34px;width:auto;display:block}.scr .brand span{font:700 10px 'Space Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5)}
  .scr .brand{font:700 11px 'Space Mono',monospace;letter-spacing:.18em;color:rgba(255,255,255,.55)}
  .scr .chip,.scr .bar i,.scr .fix,.scr .care{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .scr .your{font:400 12px 'Space Mono',monospace;letter-spacing:.3em;text-transform:uppercase;color:#00D4FF;margin-top:36px}
  .scr .cover h1{font-size:46px;margin:8px 0 10px}
  .scr .tag{font-size:17px;color:rgba(255,255,255,.8);max-width:52ch;margin:0}
  .scr .meta{font:12px 'Space Mono',monospace;color:rgba(255,255,255,.5);margin-top:28px}
  .scr code{font-family:'Space Mono',monospace;font-size:12px;word-break:break-all}
  .scr h3{font:600 13px 'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;margin:0 0 6px}
  .scr .note{color:var(--muted);font-size:13px}
  .scr .srow{display:grid;grid-template-columns:90px 1fr 92px;gap:12px;align-items:center;margin:10px 0}
  .scr .pn{font-weight:600}.scr .pv{font:12px 'Space Mono',monospace;text-align:right;line-height:1.35}.scr .pv em{color:var(--muted);font-style:normal}
  .scr .bars{display:flex;flex-direction:column;gap:4px}.scr .bar{height:10px;background:var(--soft);border-radius:5px;overflow:hidden}.scr .bar i{display:block;height:100%}.scr .bar.light i{opacity:.35}
  .scr .measures{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin:20px 0 8px}
  .scr .m{background:#fff;padding:10px;display:flex;flex-direction:column;gap:2px}.scr .m .k{font:10px 'Space Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
  .scr .m .v{font:300 22px Montserrat,sans-serif}.scr .m .s{font-size:11px;color:var(--muted);line-height:1.35}
  .scr .part{font:700 11px 'Space Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);border-top:2px solid var(--ink);padding-top:10px;margin:40px 0 4px;break-before:page}
  .scr .sec{margin:22px 0;break-inside:avoid-page}
  .scr .kick{font:12px 'Space Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:flex;gap:10px}.scr .kick span{color:var(--accent);font-weight:700}
  .scr .sec h2{font-size:28px;margin:4px 0 10px}
  .scr h4{font-size:16px;margin:14px 0 4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .scr .chip{font:500 11px 'Space Mono',monospace;border-radius:99px;padding:1px 8px}
  .scr .pat p,.scr .code p{margin:4px 0}.scr .nums{font:12px 'Space Mono',monospace;color:var(--muted)}
  .scr .map{max-width:520px;margin:0 auto}
  .scr .need{border-left:3px solid;padding:4px 0 4px 14px;margin:14px 0}.scr .pnm{font:12px 'Space Mono',monospace;color:var(--muted);font-weight:400}
  .scr .fix{background:var(--soft);padding:8px 10px;border-radius:4px}.scr .ch{font:12px 'Space Mono',monospace;color:#534AB7}
  .scr .lines li{margin:6px 0;font-size:16px}.scr .two{display:grid;grid-template-columns:1fr 1fr;gap:20px}.scr .two em{color:var(--muted);font-size:12px;font-style:normal}
  .scr .weeks li{margin:8px 0}.scr .care{background:#FFF8EC;border:1px solid #F0DDB5;padding:12px 16px;border-radius:4px}
  .scr .codebox{border:1px solid var(--line);padding:12px 16px;border-radius:4px;margin-top:20px}.scr .disc{color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:12px;margin-top:28px}
  @media(max-width:640px){.scr .measures{grid-template-columns:repeat(2,1fr)}.scr .two{grid-template-columns:1fr}.scr .cover h1{font-size:36px}}`;

  root.SCReport = { build, CSS };
  if (typeof module !== 'undefined') module.exports = root.SCReport;
})(typeof window !== 'undefined' ? window : globalThis);
