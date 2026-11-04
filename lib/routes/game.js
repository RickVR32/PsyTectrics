/* Play: unlock the full online game with the code that comes with a deck.
   POST /api/game { code } -> { ok: true, games: ['narcissist'] }
   Codes live in the GAME_CODES env var: "CODE:game,CODE2:game2" (game = narcissist | bad-habits | all).
   Without the env var the built-in launch codes below are used. */
const DEFAULT = 'ZEROPOINT:narcissist,GOODHABITS:bad-habits';
const GAMES = ['narcissist', 'bad-habits'];
const hits = new Map(); // light per-instance rate limit

function codes() {
  const out = {};
  String(process.env.GAME_CODES || DEFAULT).split(',').forEach(pair => {
    const [c, g] = pair.split(':').map(x => (x || '').trim());
    if (!c) return;
    const k = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
    out[k] = (out[k] || []).concat(g === 'all' || !g ? GAMES : GAMES.filter(x => x === g));
  });
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 10) return res.status(429).json({ error: 'Too many tries. Please wait a minute.' });
  h.push(now); hits.set(ip, h);
  const code = String((req.body && req.body.code) || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  const games = code && codes()[code];
  if (!games || !games.length) return res.status(400).json({ error: "That code didn't work. Check the card in your box." });
  return res.status(200).json({ ok: true, games });
};
