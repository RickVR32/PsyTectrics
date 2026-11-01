/* PsyTectrics Source Code v4 — each client's personal, encrypted code.
   Layout:  SC4-L4N-XXXXX-XXXXX-...
            │   │ └ lean type: N Narc, E Empath, L loop, M mixed, Z near Zero-Point
            │   └── Level 1–10 (A = 10)
            └────── format version
   The blocks after the signature are AES-256-GCM ciphertext (Crockford base32) holding:
   key id · test id · date · every answer. Only someone with SC_CODE_KEY can read it,
   and any typo or tampering makes it fail to open. */
const crypto = require('crypto');

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
const TESTS = ['awareness-profile', 'quick-check', 'narc-check', 'empath-check', 'observer-check', 'couples'];
const TYPES = { narc: 'N', empath: 'E', loop: 'L', mixed: 'M', zero: 'Z' };

function b32(buf) {
  let bits = 0, val = 0, out = '';
  for (const byte of buf) { val = (val << 8) | byte; bits += 8; while (bits >= 5) { out += ALPHABET[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += ALPHABET[(val << (5 - bits)) & 31];
  return out;
}
function unb32(str) {
  const clean = str.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  let bits = 0, val = 0; const out = [];
  for (const ch of clean) { const i = ALPHABET.indexOf(ch); if (i < 0) throw new Error('Invalid character in code'); val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}
// answers 1–5 packed as one base-5 number (56 answers -> 17 bytes)
function packAnswers(answers) {
  let n = 0n; for (let i = answers.length - 1; i >= 0; i--) n = n * 5n + BigInt(answers[i] - 1);
  const len = Math.ceil(answers.length * Math.log2(5) / 8); const buf = Buffer.alloc(len);
  for (let i = len - 1; i >= 0; i--) { buf[i] = Number(n & 255n); n >>= 8n; }
  return buf;
}
function unpackAnswers(buf, count) {
  let n = 0n; for (const b of buf) n = (n << 8n) | BigInt(b);
  const out = []; for (let i = 0; i < count; i++) { out.push(Number(n % 5n) + 1); n /= 5n; }
  return out;
}
function getKey(keyId = 1) {
  const hex = process.env[keyId === 1 ? 'SC_CODE_KEY' : `SC_CODE_KEY_${keyId}`];
  if (!hex || hex.length !== 64) throw new Error('SC_CODE_KEY must be set to 64 hex characters');
  return Buffer.from(hex, 'hex');
}

function encode({ test, answers, level, type, date = new Date() }, keyId = 1) {
  const t = TESTS.indexOf(test); if (t < 0) throw new Error('Unknown test');
  if (!answers.every(a => a >= 1 && a <= 5)) throw new Error('Answers must be 1–5');
  const days = Math.floor(date.getTime() / 86400000); // days since 1970
  const header = Buffer.from([t, answers.length, (days >> 8) & 255, days & 255]);
  const plain = Buffer.concat([header, packAnswers(answers)]);
  const iv = crypto.randomBytes(12);
  const sig = `L${level === 10 ? 'A' : level}${TYPES[type] || 'M'}`;
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(keyId), iv);
  cipher.setAAD(Buffer.from(sig)); // the visible signature is protected too
  const body = Buffer.concat([Buffer.from([keyId]), iv, cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
  return `SC4-${sig}-` + b32(body).match(/.{1,5}/g).join('-');
}

function decode(code) {
  const m = String(code).trim().toUpperCase().replace(/[\s_.]+/g, '-').match(/^SC4-(L[1-9A][NELMZ])-(.+)$/);
  if (!m) throw new Error('Not a v4 Source Code');
  const sig = m[1], body = unb32(m[2]);
  const keyId = body[0], iv = body.subarray(1, 13), tag = body.subarray(body.length - 16), data = body.subarray(13, body.length - 16);
  const d = crypto.createDecipheriv('aes-256-gcm', getKey(keyId), iv);
  d.setAAD(Buffer.from(sig)); d.setAuthTag(tag);
  let plain;
  try { plain = Buffer.concat([d.update(data), d.final()]); } catch { throw new Error('Code could not be opened — mistyped, altered, or wrong key'); }
  const test = TESTS[plain[0]], count = plain[1], days = (plain[2] << 8) | plain[3];
  return { test, answers: unpackAnswers(plain.subarray(4), count), date: new Date(days * 86400000).toISOString().slice(0, 10),
    level: sig[1] === 'A' ? 10 : +sig[1], type: Object.keys(TYPES).find(k => TYPES[k] === sig[2]) };
}

module.exports = { encode, decode };
