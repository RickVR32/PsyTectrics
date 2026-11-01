#!/usr/bin/env node
/* Build the finished automated report (HTML + PDF) from a Source Code.
   Usage: SC_CODE_KEY=... node scripts/build-report.js "SC4-..." --name "Sam Taylor" --out reports/sam */
const fs = require('fs'), path = require('path');
const { decode } = require('../lib/source-code');
const E = require('../sc-engine.js'); require('../sc-geo.js'); require('../sc-report-library.js');
const S = require('../sc-report.js');
const args = process.argv.slice(2), code = args[0];
const opt = k => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : ''; };
const out = opt('out') || 'report';
const r = decode(code);
const test = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', r.test + '.json'), 'utf8'));
const answers = {}; test.items.forEach((it, i) => answers[it.id] = r.answers[i]);
const R = E.score(test, answers);
const date = new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'pt_logo.png')).toString('base64');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Awareness Profile — ${opt('name') || 'Report'}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600&family=Inter:wght@400;600&family=Space+Mono:wght@400;700&display=swap">
<style>body{margin:0;padding:0;background:#fff}@page{size:A4;margin:16mm 14mm}${S.CSS}</style></head>
<body><main class="scr">${S.build(R, { name: opt('name'), date, code, logo }, test, answers)}</main></body></html>`;
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out + '-report.html', html);
console.log('Wrote ' + out + '-report.html');
(async () => { try { const { chromium } = require('playwright'); const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(html, { waitUntil: 'load' }); await p.pdf({ path: out + '-report.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:#8A90A0;padding:0 14mm;display:flex;justify-content:space-between"><span>PsyTectrics™ · Awareness Profile${opt('name') ? ' · ' + opt('name').replace(/</g, '') : ''}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    margin: { top: '14mm', bottom: '18mm', left: '14mm', right: '14mm' } }); await b.close();
  console.log('Wrote ' + out + '-report.pdf'); } catch (e) { console.log('(PDF skipped: ' + e.message + ')'); } })();
