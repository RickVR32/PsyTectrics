/* SC Geo v4 — the original SC Blueprint diagram, coloured by a result.
   Same layout and coordinates as the first solo.html map: the four Observer Codes on the diamond
   (Narc top, Grounded right, Empath bottom, Volatile left), 8 Apps (A1–A8) and 16 Source Codes,
   over the sacred geometry (seed of life, Zero-Point ring, φ existence ring, centre seat). */
(function (root) {
  const COL = { Narc: '#C4622D', Empath: '#1D9E75', Grounded: '#534AB7', Volatile: '#A0426B' };
  const STATUS = { ok: '#2F8A5B', lean: '#C48A1C', hot: '#C2413A', none: '#E4E2DC' };
  const st = b => b == null ? 'none' : b >= 20 ? 'ok' : b > -20 ? 'lean' : 'hot';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const C = 450;

  // Observer Codes on the diamond
  const OC = { Narc: [450, 302], Grounded: [598, 450], Empath: [450, 598], Volatile: [302, 450] };
  // Apps: [pattern, x, y, rotation, [node ids (clockwise)]]
  const APPS = [
    ['Narc', 367.6, 246, -22, ['intention', 'presence']],
    ['Narc', 532.4, 246, 22, ['ownership', 'impact']],
    ['Grounded', 654, 367.6, 68, ['coreself', 'integrity']],
    ['Grounded', 654, 532.4, 112, ['consistency', 'honesty']],
    ['Empath', 532.4, 654, -22, ['balance', 'connection']],
    ['Empath', 367.6, 654, 22, ['clearhead', 'holding']],
    ['Volatile', 246, 532.4, 68, ['purpose', 'pattern']],
    ['Volatile', 246, 367.6, 112, ['limit', 'cycles']]
  ];
  // Source Code triangles, clockwise from top-left (original points)
  const TRI = [
    '298.7,205.5 276.1,205.2 287.4,185.9', '389,169 383.5,147.1 405.1,153.1', '511,169 494.9,153.1 516.5,147.1', '601.3,205.5 612.6,185.9 623.9,205.2',
    '694.5,298.7 694.8,276.1 714.1,287.4', '731,389 752.9,383.5 746.9,405.1', '731,511 746.9,494.9 752.9,516.5', '694.5,601.3 714.1,612.6 694.8,623.9',
    '601.3,694.5 623.9,694.8 612.6,714.1', '511,731 516.5,752.9 494.9,746.9', '389,731 405.1,746.9 383.5,752.9', '298.7,694.5 287.4,714.1 276.1,694.8',
    '205.5,601.3 205.2,623.9 185.9,612.6', '169,511 147.1,516.5 153.1,494.9', '169,389 153.1,405.1 147.1,383.5', '205.5,298.7 185.9,287.4 205.2,276.1'
  ];
  const centroid = p => { const a = p.split(' ').map(q => q.split(',').map(Number)); return [(a[0][0] + a[1][0] + a[2][0]) / 3, (a[0][1] + a[1][1] + a[2][1]) / 3]; };
  const scale = (p, k) => { const [cx, cy] = centroid(p); return p.split(' ').map(q => { const [x, y] = q.split(',').map(Number); return `${(cx + (x - cx) * k).toFixed(1)},${(cy + (y - cy) * k).toFixed(1)}`; }).join(' '); };

  function sacred() {
    let g = '<g aria-hidden="true" fill="none">';
    g += `<circle cx="${C}" cy="${C}" r="48" stroke="#B8B2A8" stroke-width=".8" opacity=".55"/>`;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g += `<circle cx="${(C + 48 * Math.cos(a)).toFixed(1)}" cy="${(C + 48 * Math.sin(a)).toFixed(1)}" r="48" stroke="#B8B2A8" stroke-width=".8" opacity=".55"/>`; }
    g += `<polygon points="450,302 598,450 450,598 302,450" stroke="#B8B2A8" stroke-width="1.2" opacity=".8"/>`;
    g += `<circle cx="${C}" cy="${C}" r="239.5" stroke="#C8C4BC" stroke-width=".8" stroke-dasharray="3 9" opacity=".7"/>`;
    g += `<circle cx="${C}" cy="${C}" r="96" stroke="#C8C4BC" stroke-width=".8" opacity=".8"/>`;
    g += `<line x1="450" y1="106" x2="450" y2="794" stroke="#C8C4BC" stroke-width=".6" stroke-dasharray="4 8" opacity=".6"/>`;
    g += `<line x1="106" y1="450" x2="794" y2="450" stroke="#C8C4BC" stroke-width=".6" stroke-dasharray="4 8" opacity=".6"/>`;
    return g + '</g>';
  }

  function svg(R, opts = {}) {
    const E = root.SCEngine;
    const vb = '-40 40 980 820';
    let h = opts.standalone
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="1470" height="1230"><rect x="-40" y="40" width="980" height="820" fill="#fff"/>`
      : `<svg viewBox="${vb}" role="img" aria-label="Your Balance Map" style="width:100%;height:auto;display:block;max-width:620px;margin:0 auto">`;
    h += sacred();
    let t = 0;
    APPS.forEach(([p, ax, ay, rot, ids], ai) => {
      const col = COL[p], [vx, vy] = OC[p];
      h += `<line x1="${vx}" y1="${vy}" x2="${ax}" y2="${ay}" stroke="${col}" stroke-width="1.6" opacity=".6"/>`;
      ids.forEach(id => {
        const pts = TRI[t++], [cx, cy] = centroid(pts);
        const n = R.nodes && R.nodes[id], s = st(n ? n.balance : null);
        const name = E && E.NODES[id] ? E.NODES[id].name : id;
        h += `<line x1="${ax}" y1="${ay}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${col}" stroke-width="1.2" opacity=".45"/>`;
        h += `<polygon points="${scale(pts, 1.45)}" fill="${STATUS[s]}" stroke="${col}" stroke-width="2"><title>${esc(name)}${n && n.balance != null ? `: light ${Math.round(n.light)}, shadow ${Math.round(n.shadow)}` : ': not measured'}</title></polygon>`;
        // label pushed outward from the centre
        const dx = cx - C, dy = cy - C, d = Math.hypot(dx, dy), lx = cx + dx / d * 24, ly = cy + dy / d * 24;
        const anchor = Math.abs(dx / d) < 0.35 ? 'middle' : dx > 0 ? 'start' : 'end';
        const val = n && n.balance != null ? ` <tspan font-weight="700" fill="${STATUS[s]}">${n.balance > 0 ? '+' : ''}${Math.round(n.balance)}</tspan>` : '';
        h += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}" font-size="15" fill="${col}" font-family="Space Mono, monospace">${esc(name)}${val}</text>`;
      });
      h += `<ellipse cx="${ax}" cy="${ay}" rx="22" ry="12" transform="rotate(${rot},${ax},${ay})" fill="#fff" stroke="${col}" stroke-width="2"/>`;
      h += `<text x="${ax}" y="${ay + 4}" text-anchor="middle" font-size="10" fill="${col}" font-family="Space Mono, monospace">A${ai + 1}</text>`;
    });
    for (const p of Object.keys(OC)) {
      const [x, y] = OC[p], col = COL[p], pct = R.ratio ? R.ratio[p] : null;
      h += `<polygon points="${x},${y - 42} ${x + 42},${y} ${x},${y + 42} ${x - 42},${y}" fill="#fff" stroke="${col}" stroke-width="2.4"/>`;
      h += `<text x="${x}" y="${y - 1}" text-anchor="middle" font-size="11" font-weight="700" fill="${col}" font-family="Space Mono, monospace">${p}</text>`;
      if (pct != null) h += `<text x="${x}" y="${y + 14}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Space Mono, monospace">${pct}%</text>`;
    }
    // centre seat (Focus 21)
    h += `<circle cx="${C}" cy="${C}" r="52" fill="#fff" stroke="${opts.live ? '#B0ABA0' : '#00D4FF'}" stroke-width="${opts.live ? 1.8 : 3}"/>`;
    if (opts.live) {
      h += `<text x="${C}" y="${C + 2}" text-anchor="middle" font-size="16" font-weight="700" fill="#0B1020" font-family="Montserrat, sans-serif">${esc(opts.live)}</text>`;
      h += `<text x="${C}" y="${C + 18}" text-anchor="middle" font-size="8.5" fill="#6B7280" font-family="Space Mono, monospace">MAPPING…</text>`;
    } else {
      h += `<text x="${C}" y="${C + 2}" text-anchor="middle" font-size="26" font-weight="700" fill="#0B1020" font-family="Montserrat, sans-serif">L${R.level}</text>`;
      h += `<text x="${C}" y="${C + 20}" text-anchor="middle" font-size="9.5" fill="#6B7280" font-family="Inter, sans-serif">${esc(R.stage || '')}</text>`;
      h += `<text x="${C}" y="${C + 32}" text-anchor="middle" font-size="8" fill="#9CA3AF" font-family="Space Mono, monospace">RING ${R.ring}</text>`;
    }
    return h + '</svg>';
  }
  function render(el, R) { el.innerHTML = svg(R); }
  root.SCGeo = { render, svg, COL, STATUS };
  if (typeof module !== 'undefined') module.exports = root.SCGeo;
})(typeof window !== 'undefined' ? window : globalThis);
