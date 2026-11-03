/* SC Geo v4 — draws a result as the Blueprint map: Zero-Point at the centre, the four patterns on two axes
   (Narc left, Empath right, Grounded top, Volatile bottom), their codes around them, coloured by balance. */
(function (root) {
  const COL = { Narc: '#C4622D', Empath: '#1D9E75', Grounded: '#534AB7', Volatile: '#A0426B' };
  const STATUS = { ok: '#2F8A5B', lean: '#C48A1C', hot: '#C2413A', none: '#C9CCD6' };
  const POS = { Narc: [150, 320, 180], Empath: [490, 320, 0], Grounded: [320, 150, -90], Volatile: [320, 490, 90] };
  const st = b => b == null ? 'none' : b >= 20 ? 'ok' : b > -20 ? 'lean' : 'hot';
  const r0 = Math.round;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function svg(R, opts = {}) {
    const E = root.SCEngine;
    let h = opts.standalone ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="1280" height="1280"><rect width="640" height="640" fill="#fff"/>' : '<svg viewBox="0 0 640 640" role="img" aria-label="Your Balance Map" style="width:100%;height:auto;display:block;max-width:560px;margin:0 auto">';
    // Sacred geometry (from the original SC Blueprint diagram, scaled so the Observer Codes sit at r170):
    // seed of life = Omniality; inner ring r110 = Zero-Point boundary; diamond = tetrahedron projection
    // with the four codes as vertices; outer ring r275 = existence field, φ × the code radius.
    h += geometry(opts.geometry !== false);
    // rings: the five board rings around Zero-Point, the person's ring highlighted
    for (let i = 5; i >= 1; i--) {
      const rr = 60 + i * 50, on = !opts.live && (6 - i) === R.ring;
      h += `<circle cx="320" cy="320" r="${rr}" fill="none" stroke="${on ? '#00D4FF' : 'rgba(11,16,32,0.06)'}" stroke-width="${on ? 2.5 : 1}" ${on ? '' : 'stroke-dasharray="3 6"'}/>`;
    }
    h += '<line x1="40" y1="320" x2="600" y2="320" stroke="rgba(11,16,32,0.12)"/><line x1="320" y1="40" x2="320" y2="600" stroke="rgba(11,16,32,0.12)"/>';
    for (const p of E.PATTERNS) {
      const [x, y, ang] = POS[p], col = COL[p];
      const ids = Object.keys(E.NODES).filter(id => E.NODES[id].pattern === p);
      h += `<line x1="320" y1="320" x2="${x}" y2="${y}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
      ids.forEach((id, i) => {
        const a = (ang + (i - 1.5) * 34) * Math.PI / 180, nx = x + 112 * Math.cos(a), ny = y + 112 * Math.sin(a);
        const n = R.nodes[id], s = st(n ? n.balance : null);
        h += `<line x1="${x}" y1="${y}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${col}" stroke-width="1.6" opacity="${n ? 1 : .35}"/>`;
        h += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="21" fill="${STATUS[s]}" stroke="#fff" stroke-width="3"><title>${esc(E.NODES[id].name)}${n && n.balance != null ? `: light ${r0(n.light)}, shadow ${r0(n.shadow)}` : ': not measured in this test'}</title></circle>`;
        if (n && n.balance != null) h += `<text x="${nx.toFixed(1)}" y="${(ny + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Space Mono, monospace">${n.balance > 0 ? '+' : ''}${r0(n.balance)}</text>`;
        h += `<text x="${nx.toFixed(1)}" y="${(ny + 35).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="#0B1020" font-family="Inter, sans-serif" opacity="${n ? 1 : .45}">${esc(E.NODES[id].name)}</text>`;
      });
      const P = R.patterns[p];
      h += `<circle cx="${x}" cy="${y}" r="42" fill="#fff" stroke="${col}" stroke-width="3"/>`;
      h += `<text x="${x}" y="${y - 3}" text-anchor="middle" font-size="14" font-weight="700" fill="${col}" font-family="Inter, sans-serif">${p}</text>`;
      h += `<text x="${x}" y="${y + 14}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Space Mono, monospace">${R.ratio[p]}%</text>`;
    }
    h += '<circle cx="320" cy="320" r="54" fill="#060B18"/>';
    if (opts.live) { // while answering: show progress, keep the level for the end
      h += `<text x="320" y="322" text-anchor="middle" font-size="20" font-weight="700" fill="#00D4FF" font-family="Montserrat, sans-serif">${esc(opts.live)}</text>`;
      h += `<text x="320" y="342" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.7)" font-family="Space Mono, monospace">MAPPING…</text>`;
    } else {
    h += `<text x="320" y="316" text-anchor="middle" font-size="28" font-weight="700" fill="#00D4FF" font-family="Montserrat, sans-serif">L${R.level}</text>`;
    h += `<text x="320" y="336" text-anchor="middle" font-size="11" fill="#fff" font-family="Inter, sans-serif">${esc(R.stage)}</text>`;
    h += `<text x="320" y="351" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.6)" font-family="Space Mono, monospace">RING ${R.ring}</text>`;
    }
    h += '</svg>';
    return h;
  }
  function geometry(on) {
    if (!on) return '';
    const C = 320, PHI = 1.618, rc = 170, rs = 55; // rc: Observer Code radius, rs: seed circle radius
    let g = '<g class="sc-sacred" aria-hidden="true" fill="none">';
    g += `<circle cx="${C}" cy="${C}" r="${(rc * PHI).toFixed(1)}" stroke="#B8B2A8" stroke-width="1" stroke-dasharray="2 7" opacity=".55"/>`;
    // flower ring: 12 faint circles on the outer field
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g += `<circle cx="${(C + rc * Math.cos(a)).toFixed(1)}" cy="${(C + rc * Math.sin(a)).toFixed(1)}" r="${(rc * PHI - rc).toFixed(1)}" stroke="#C8C4BC" stroke-width=".6" opacity=".35"/>`; }
    g += `<polygon points="${C},${C - rc} ${C + rc},${C} ${C},${C + rc} ${C - rc},${C}" stroke="#B8B2A8" stroke-width="1.3" opacity=".8"/>`;
    g += `<polygon points="${C - rc / Math.SQRT2},${C - rc / Math.SQRT2} ${C + rc / Math.SQRT2},${C - rc / Math.SQRT2} ${C + rc / Math.SQRT2},${C + rc / Math.SQRT2} ${C - rc / Math.SQRT2},${C + rc / Math.SQRT2}" stroke="#C8C4BC" stroke-width=".8" opacity=".5"/>`;
    g += `<circle cx="${C}" cy="${C}" r="${(rc / PHI * 1.03).toFixed(1)}" stroke="#B8B2A8" stroke-width=".9" opacity=".7"/>`;
    g += `<circle cx="${C}" cy="${C}" r="${rs}" stroke="#B8B2A8" stroke-width=".9" opacity=".7"/>`;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g += `<circle cx="${(C + rs * Math.cos(a)).toFixed(1)}" cy="${(C + rs * Math.sin(a)).toFixed(1)}" r="${rs}" stroke="#B8B2A8" stroke-width=".9" opacity=".7"/>`; }
    return g + '</g>';
  }
  function render(el, R) { el.innerHTML = svg(R); }
  root.SCGeo = { render, svg, COL, STATUS };
  if (typeof module !== 'undefined') module.exports = root.SCGeo;
})(typeof window !== 'undefined' ? window : globalThis);
