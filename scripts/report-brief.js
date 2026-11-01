#!/usr/bin/env node
/* Turn a client's Source Code into everything needed to write their report:
   a brief (numbers + their own strongest answers as evidence) and the Balance Map image.
   Usage:
     SC_CODE_KEY=... node scripts/report-brief.js "SC4-..." --name "Sam Taylor" --age "35-44" \
        --context "co-parenting" --most "..." --least "..." --out reports/sam
   Writes <out>-brief.md and <out>-map.svg (and <out>-map.png if Playwright is available). */
const fs = require('fs'), path = require('path');
const { decode } = require('../lib/source-code');
const E = require('../sc-engine.js');
const G = require('../sc-geo.js');

const args = process.argv.slice(2), code = args[0];
const opt = k => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : ''; };
const out = opt('out') || 'report';
const r = decode(code);
const test = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', r.test + '.json'), 'utf8'));
const ans = {}; test.items.forEach((it, i) => ans[it.id] = r.answers[i]);
const R = E.score(test, ans);
const r0 = Math.round, word = ['', 'Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
const status = b => b == null ? 'not measured' : b >= 20 ? 'Balanced' : b > -20 ? 'Leaning' : 'Needs balancing';
const band = (v, lo, hi) => v < lo ? 'low' : v < hi ? 'moderate' : 'high';

// Evidence: the statements they agreed with most strongly, per side
const rows = test.items.map((it, i) => ({ ...it, a: r.answers[i] }));
const top = (filter, n) => rows.filter(filter).sort((x, y) => y.a - x.a).slice(0, n).filter(x => x.a >= 4);
const shadowEv = top(x => x.side === 'shadow' || x.side === 'role', 8);
const lightEv = top(x => x.side === 'light', 6);
const blind = E.PATTERNS.filter(p => { const P = R.patterns[p]; return P.role != null && P.recog != null && P.role - P.recog >= 50; });

let md = `# Report brief — ${opt('name') || 'Client'}\n\n`;
md += `Source Code: \`${code}\`\nTest: ${r.test} · taken ${r.date}\n`;
md += `Age band: ${opt('age') || 'not provided'} · Context: ${opt('context') || 'not provided'}\n`;
if (opt('most')) md += `Most like themselves: "${opt('most')}"\n`;
if (opt('least')) md += `Least like themselves: "${opt('least')}"\n`;
md += `\n## Scores\n\n| Measure | Value | Reading |\n|---|---|---|\n`;
md += `| Level | ${R.level} / 10 | ${R.stage} (book level) · Board ring ${R.ring} |\n`;
md += `| Balance type | ${R.type} | ${E.leanLabel(R.lean)} |\n`;
md += `| Lean | ${r0(R.lean)} | −100 = fully Narc (contracts) · +100 = fully Empath (expands) |\n`;
md += `| Charge | ${r0(R.charge)} | ${band(R.charge, 35, 60)} — how hard both roles are running |\n`;
md += `| Regulation | ${r0(R.regulation)} | ${band(R.regulation, 40, 65)} — holding steady at threshold |\n`;
md += `| Drift | ${R.drift.toFixed(1)} / 5 | ${band(R.drift, 1.5, 2.5)} — says vs does |\n`;
md += `\nPattern ratio (share of shadow): ${Object.entries(R.ratio).map(([k, v]) => `${k} ${v}%`).join(' · ')}\n`;
md += `\n## Patterns\n\n| Pattern | Light | Shadow | Knows it (recog) | Role running |\n|---|---|---|---|---|\n`;
E.PATTERNS.forEach(p => { const P = R.patterns[p]; md += `| ${p} | ${r0(P.light)} | ${r0(P.shadow)} | ${P.recog == null ? '–' : r0(P.recog)} | ${P.role == null ? '–' : r0(P.role)} |\n`; });
if (blind.length) md += `\nBlind spot: the ${blind.join(' and ')} role is running strongly without being recognised — name this gently in the report.\n`;
md += `\n## Codes\n\n| Code | Pattern | Light | Shadow | Balance | Status |\n|---|---|---|---|---|---|\n`;
Object.values(R.nodes).sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0)).forEach(n =>
  md += `| ${n.name} | ${n.pattern} | ${r0(n.light)} | ${r0(n.shadow)} | ${n.balance > 0 ? '+' : ''}${r0(n.balance)} | ${status(n.balance)} |\n`);
md += `\n## What needs balancing\n\n`;
md += R.needs.length ? R.needs.map((n, i) => `${i + 1}. **${n.name}** (${n.pattern}) — light ${r0(n.light)} / shadow ${r0(n.shadow)}\n   Fix: ${n.fix}\n   Book: ${n.ch}`).join('\n') : 'Nothing major — focus the next move on keeping the Observer position under pressure (Ch 11).';
md += `\n\n## Evidence — in their own answers\n\nShadow statements they agreed with:\n`;
md += shadowEv.length ? shadowEv.map(x => `- "${x.text}" — ${word[x.a]} (${x.pattern})`).join('\n') : '- none at Agree or above';
md += `\n\nStrengths they agreed with:\n`;
md += lightEv.length ? lightEv.map(x => `- "${x.text}" — ${word[x.a]} (${x.pattern})`).join('\n') : '- none at Agree or above';
md += `\n\n## Writing notes\n- Second person, plain English, no diagnosis. Every claim ties to a number or an answer above.\n- Primary pattern = the lean (Narc contracts / Empath expands / loop = both firing).\n- Under pressure = Regulation and the Volatile codes. In relationships = Narc vs Empath codes.\n- What needs balancing = the 3 codes above, each with its fix and book chapter.\n- Wellbeing note only if Drift ≥ 3 or Regulation < 30.\n`;

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out + '-brief.md', md);
fs.writeFileSync(out + '-map.svg', G.svg(R, { standalone: true }));
console.log(`Wrote ${out}-brief.md and ${out}-map.svg`);
(async () => {
  try {
    const { chromium } = require('playwright'); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1280 } });
    await p.setContent(`<html><body style="margin:0">${fs.readFileSync(out + '-map.svg', 'utf8')}</body></html>`); await p.screenshot({ path: out + '-map.png' }); await b.close();
    console.log(`Wrote ${out}-map.png`);
  } catch { console.log('(PNG skipped — open the SVG and export it, or run where Playwright is installed)'); }
})();
