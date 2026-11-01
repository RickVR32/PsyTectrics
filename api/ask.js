/* Website Q&A widget — same brain as the Telegram bot. */
const { ask } = require('../lib/qa');
const tg = require('../lib/tg');
const hits = new Map();
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  const day = new Date().toISOString().slice(0, 10), k = ip + day;
  const n = (hits.get(k) || 0) + 1; hits.set(k, n); if (hits.size > 5000) hits.clear();
  if (n > 25) return res.status(429).json({ text: 'I\'ve answered a lot today! Email hello@psytectrics.com and Ric will reply.' });
  const { question, history } = req.body || {};
  if (!question || !String(question).trim()) return res.status(400).json({ text: 'Type a question first.' });
  const h = Array.isArray(history) ? history.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content.slice(0, 800) })).slice(-6) : [];
  const a = await ask(question, h);
  if (a.unanswered || a.crisis) tg.admin(`${a.crisis ? '⚠️ Possible crisis message' : '❓ Unanswered question'} on the site:\n"${tg.esc(String(question).slice(0, 300))}"`);
  return res.status(200).json({ text: a.text });
};
