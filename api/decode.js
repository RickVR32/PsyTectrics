/* Opens a Source Code so test.html can show the result again (e.g. from the Telegram bot link).
   Returns only the test id and answers — never anything about who took it. */
const { decode } = require('../lib/source-code');
const hits = new Map(); // light rate limit per warm instance
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  const n = (hits.get(ip) || 0) + 1; hits.set(ip, n); if (hits.size > 5000) hits.clear();
  if (n > 30) return res.status(429).json({ error: 'Too many tries — please wait a bit.' });
  try {
    const d = decode((req.body || {}).code || '');
    return res.status(200).json({ test: d.test, answers: d.answers, date: d.date });
  } catch (e) { return res.status(400).json({ error: 'That code could not be opened. Check it was copied in full.' }); }
};
