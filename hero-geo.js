/* PsyTectrics homepage hero — the SC Blueprint diagram, animated.
   1) The sacred geometry draws itself in, then the diamond, Apps and Source Codes appear.
   2) Then it loops: pulses travel out from Zero-Point along every branch, the 16 codes shift
      from red through amber to green as they come into balance, and the level climbs 1 → 10.
   Respects prefers-reduced-motion (shows the finished, still diagram). */
(function () {
  const el = document.getElementById('hero-geo');
  if (!el) return;
  const COL = { Narc: '#C4622D', Grounded: '#534AB7', Empath: '#1D9E75', Volatile: '#A0426B' };
  const OC = { Narc: [450, 302], Grounded: [598, 450], Empath: [450, 598], Volatile: [302, 450] };
  const APPS = [['Narc', 367.6, 246, -22], ['Narc', 532.4, 246, 22], ['Grounded', 654, 367.6, 68], ['Grounded', 654, 532.4, 112],
    ['Empath', 532.4, 654, -22], ['Empath', 367.6, 654, 22], ['Volatile', 246, 532.4, 68], ['Volatile', 246, 367.6, 112]];
  const TRI = ['298.7,205.5 276.1,205.2 287.4,185.9', '389,169 383.5,147.1 405.1,153.1', '511,169 494.9,153.1 516.5,147.1', '601.3,205.5 612.6,185.9 623.9,205.2',
    '694.5,298.7 694.8,276.1 714.1,287.4', '731,389 752.9,383.5 746.9,405.1', '731,511 746.9,494.9 752.9,516.5', '694.5,601.3 714.1,612.6 694.8,623.9',
    '601.3,694.5 623.9,694.8 612.6,714.1', '511,731 516.5,752.9 494.9,746.9', '389,731 405.1,746.9 383.5,752.9', '298.7,694.5 287.4,714.1 276.1,694.8',
    '205.5,601.3 205.2,623.9 185.9,612.6', '169,511 147.1,516.5 153.1,494.9', '169,389 153.1,405.1 147.1,383.5', '205.5,298.7 185.9,287.4 205.2,276.1'];
  const NAMES = ['Intention', 'Presence', 'Ownership', 'Impact', 'Core Self', 'Integrity', 'Consistency', 'Honesty',
    'Balance', 'Connection', 'Clear Head', 'Holding', 'Purpose', 'Pattern', 'Limit', 'Cycles'];
  const cen = p => { const a = p.split(' ').map(q => q.split(',').map(Number)); return [(a[0][0] + a[1][0] + a[2][0]) / 3, (a[0][1] + a[1][1] + a[2][1]) / 3]; };
  const big = (p, k) => { const [cx, cy] = cen(p); return p.split(' ').map(q => { const [x, y] = q.split(',').map(Number); return `${(cx + (x - cx) * k).toFixed(1)},${(cy + (y - cy) * k).toFixed(1)}`; }).join(' '); };
  const C = 450;
  let d = 0; const delay = s => `style="animation-delay:${(d = s).toFixed(2)}s"`;

  let s = `<svg viewBox="-10 50 920 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The SC Blueprint: four codes, eight Apps and sixteen Source Codes around Zero-Point">
  <defs><radialGradient id="hg-glow"><stop offset="0" stop-color="#00D4FF" stop-opacity=".35"/><stop offset="1" stop-color="#00D4FF" stop-opacity="0"/></radialGradient></defs>
  <circle cx="450" cy="450" r="150" fill="url(#hg-glow)" class="hg-breathe"/>`;
  // sacred geometry
  s += `<g class="hg-spin-slow" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1">`;
  s += `<circle class="hg-draw" pathLength="1" cx="450" cy="450" r="48" ${delay(0)}/>`;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += `<circle class="hg-draw" pathLength="1" cx="${(C + 48 * Math.cos(a)).toFixed(1)}" cy="${(C + 48 * Math.sin(a)).toFixed(1)}" r="48" ${delay(0.15 + i * 0.12)}/>`; }
  s += `</g>`;
  s += `<circle class="hg-draw" pathLength="1" cx="450" cy="450" r="96" fill="none" stroke="rgba(255,255,255,.18)" ${delay(0.9)}/>`;
  s += `<g class="hg-spin-rev"><circle class="hg-draw" pathLength="1" cx="450" cy="450" r="239.5" fill="none" stroke="rgba(255,255,255,.16)" stroke-dasharray="3 9" ${delay(1.0)}/></g>`;
  s += `<line class="hg-draw" pathLength="1" x1="450" y1="106" x2="450" y2="794" stroke="rgba(255,255,255,.08)" ${delay(1.1)}/><line class="hg-draw" pathLength="1" x1="106" y1="450" x2="794" y2="450" stroke="rgba(255,255,255,.08)" ${delay(1.1)}/>`;
  s += `<polygon class="hg-draw" pathLength="1" points="450,302 598,450 450,598 302,450" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.3" ${delay(1.3)}/>`;
  // branches, apps, codes
  let t = 0;
  APPS.forEach(([p, ax, ay, rot], ai) => {
    const col = COL[p], [vx, vy] = OC[p], base = 1.7 + ai * 0.12;
    s += `<line class="hg-draw" pathLength="1" x1="${vx}" y1="${vy}" x2="${ax}" y2="${ay}" stroke="${col}" stroke-width="1.6" opacity=".7" ${delay(base)}/>`;
    for (let k = 0; k < 2; k++) {
      const i = t++, pts = TRI[i], [cx, cy] = cen(pts);
      s += `<line class="hg-draw" pathLength="1" x1="${ax}" y1="${ay}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${col}" stroke-width="1.1" opacity=".5" ${delay(base + 0.3)}/>`;
      // pulse travelling out along the branch (loops after build-in)
      s += `<circle r="3" fill="${col}" class="hg-pulse"><animateMotion dur="3.2s" begin="${(3.4 + i * 0.2).toFixed(1)}s" repeatCount="indefinite" path="M${C},${C} L${vx},${vy} L${ax},${ay} L${cx.toFixed(1)},${cy.toFixed(1)}"/></circle>`;
      const dx = cx - C, dy = cy - C, dd = Math.hypot(dx, dy), lx = cx + dx / dd * 22, ly = cy + dy / dd * 22;
      const anchor = Math.abs(dx / dd) < 0.35 ? 'middle' : dx > 0 ? 'start' : 'end';
      s += `<g class="hg-pop" ${delay(base + 0.55)}><polygon data-i="${i}" class="hg-code" points="${big(pts, 1.4)}" fill="#C2413A" stroke="${col}" stroke-width="2"/>`;
      s += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" fill="${col}" font-family="Space Mono, monospace" opacity=".85">${NAMES[i]}</text></g>`;
    }
    s += `<g class="hg-pop" ${delay(base + 0.2)}><ellipse cx="${ax}" cy="${ay}" rx="21" ry="11.5" transform="rotate(${rot},${ax},${ay})" fill="#060B18" stroke="${col}" stroke-width="2"/>`;
    s += `<text x="${ax}" y="${ay + 3.5}" text-anchor="middle" font-size="9.5" fill="${col}" font-family="Space Mono, monospace">A${ai + 1}</text></g>`;
  });
  for (const p of Object.keys(OC)) {
    const [x, y] = OC[p], col = COL[p];
    s += `<g class="hg-pop hg-oc" ${delay(1.5)}><polygon points="${x},${y - 40} ${x + 40},${y} ${x},${y + 40} ${x - 40},${y}" fill="#060B18" stroke="${col}" stroke-width="2.4"/>`;
    s += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${col}" font-family="Space Mono, monospace">${p}</text></g>`;
  }
  s += `<g class="hg-pop" ${delay(0.5)}><circle cx="450" cy="450" r="52" fill="#060B18" stroke="#00D4FF" stroke-width="2.4" class="hg-seat"/>`;
  s += `<text id="hg-level" x="450" y="456" text-anchor="middle" font-size="28" font-weight="700" fill="#00D4FF" font-family="Montserrat, sans-serif">L1</text>`;
  s += `<text x="450" y="474" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.55)" font-family="Space Mono, monospace" letter-spacing="1">ZERO-POINT</text></g>`;
  s += `</svg>`;
  el.innerHTML = s;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const codes = [...el.querySelectorAll('.hg-code')], lvl = el.querySelector('#hg-level');
  const STEPS = ['#C2413A', '#C48A1C', '#2F8A5B'];
  if (reduce) { el.classList.add('hg-still'); codes.forEach((c, i) => c.setAttribute('fill', STEPS[i % 3])); lvl.textContent = 'L7'; return; }

  // Loop: level climbs 1→10 while codes move towards balance, holds, then resets
  const state = codes.map(() => 0);
  let level = 1, hold = 0;
  setTimeout(function tick() {
    if (document.hidden) return setTimeout(tick, 1000);
    if (level < 10) {
      const order = codes.map((_, i) => i).filter(i => state[i] < 2).sort(() => Math.random() - 0.5).slice(0, 4);
      order.forEach(i => { state[i]++; codes[i].setAttribute('fill', STEPS[state[i]]); });
      level = Math.min(10, 1 + Math.round(state.reduce((a, b) => a + b, 0) / (codes.length * 2) * 9));
      lvl.textContent = 'L' + level;
      if (level === 10) el.classList.add('hg-zero');
    } else if (++hold > 3) {
      hold = 0; level = 1; el.classList.remove('hg-zero');
      codes.forEach((c, i) => { state[i] = Math.random() < 0.3 ? 1 : 0; c.setAttribute('fill', STEPS[state[i]]); });
      lvl.textContent = 'L1';
    }
    setTimeout(tick, 900);
  }, 3600);
})();
