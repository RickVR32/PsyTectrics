#!/usr/bin/env node
/* Decode a client's Source Code and re-run the engine on their answers.
   Usage:  SC_CODE_KEY=... node scripts/decode-code.js "SC4-L4N-....." */
const { decode } = require('../lib/source-code');
require('../sc-engine.js');
const fs = require('fs'), path = require('path');
const r = decode(process.argv[2] || '');
const test = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', r.test + '.json'), 'utf8'));
const answers = {}; test.items.forEach((it, i) => answers[it.id] = r.answers[i]);
const R = globalThis.SCEngine.score(test, answers);
console.log(`Test: ${r.test} · taken ${r.date}`);
console.log(`Level ${R.level}/10 (${R.stage}) · Ring ${R.ring} · ${globalThis.SCEngine.leanLabel(R.lean)}`);
console.log(`Charge ${Math.round(R.charge)} · Regulation ${Math.round(R.regulation)} · Drift ${R.drift.toFixed(1)}`);
console.log('Ratio: ' + Object.entries(R.ratio).map(([k, v]) => `${k} ${v}%`).join(' · '));
console.log('Needs balancing: ' + (R.needs.map(n => `${n.name} (${n.pattern}, light ${Math.round(n.light)} / shadow ${Math.round(n.shadow)})`).join(', ') || 'nothing major'));
console.log('\nAnswers:'); test.items.forEach((it, i) => console.log(`${String(i + 1).padStart(2)}. [${r.answers[i]}] ${it.pattern}/${it.side} — ${it.text}`));
