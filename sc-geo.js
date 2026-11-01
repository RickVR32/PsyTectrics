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
    // rings: the five board rings around Zero-Point, the person's ring highlighted
    for (let i = 5; i >= 1; i--) {
      const rr = 60 + i * 50, on = (6 - i) === R.ring;
      h += `<circle cx="320" cy="320" r="${rr}" fill="none" stroke="${on ? '#00D4FF' : 'rgba(11,16,32,0.08)'}" stroke-width="${on ? 2.5 : 1}" ${on ? '' : 'stroke-dasharray="3 6"'}/>`;
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
    h += `<text x="320" y="316" text-anchor="middle" font-size="28" font-weight="700" fill="#00D4FF" font-family="Montserrat, sans-serif">L${R.level}</text>`;
    h += `<text x="320" y="336" text-anchor="middle" font-size="11" fill="#fff" font-family="Inter, sans-serif">${esc(R.stage)}</text>`;
    h += `<text x="320" y="351" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.6)" font-family="Space Mono, monospace">RING ${R.ring}</text>`;
    h += '</svg>';
    return h;
  }
  function render(el, R) { el.innerHTML = svg(R); }
  root.SCGeo = { render, svg, COL, STATUS };
  if (typeof module !== 'undefined') module.exports = root.SCGeo;
})(typeof window !== 'undefined' ? window : globalThis);
