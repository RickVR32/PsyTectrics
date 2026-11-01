// Server-side proxy for Claude. The API key lives in Vercel env vars
// (ANTHROPIC_API_KEY) and never reaches the browser.
//
// Guards so the endpoint can't be used as a free general-purpose AI:
//  - only requests from SITE_URL are accepted
//  - the system prompt must be one of PsyTectrics' own prompts
//  - token, size and message-count limits are enforced here, not in the page

const LIMITS = {
  'assess-report': {
    prefixes: ['You are generating a deeply personal SCH awareness profile report.'],
    maxTokens: 2000,
    maxMessages: 1
  },
  'awareness-index': {
    prefixes: ['You are generating a PsyTectrics™ Awareness Index™ profile.'],
    maxTokens: 1200,
    maxMessages: 1
  },
  chat: {
    prefixes: ['You are operating as a Mirror', 'You are a Subject Simulation'],
    maxTokens: 1000,
    maxMessages: 9 // 5 free user messages + 4 replies (matches FREE_LIMIT in chat.html)
  }
};

const MAX_CHARS = 40000;

function allowedOrigin(req) {
  const site = process.env.SITE_URL;
  if (!site) return true;
  const origin = req.headers.origin || req.headers.referer || '';
  try {
    const host = new URL(origin).host;
    const siteHost = new URL(site).host;
    // VERCEL_URL is this deployment's own preview host, so previews work too
    return host === siteHost || host === 'www.' + siteHost || host === process.env.VERCEL_URL;
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'AI not configured.' });

  const { kind, system, messages } = req.body || {};
  const rule = LIMITS[kind];
  if (!rule) return res.status(400).json({ error: 'Unknown request type.' });
  if (typeof system !== 'string' || !rule.prefixes.some(p => system.startsWith(p))) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > rule.maxMessages) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  const valid = messages.every(m =>
    m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
  );
  if (!valid) return res.status(400).json({ error: 'Invalid request.' });

  const size = system.length + messages.reduce((n, m) => n + m.content.length, 0);
  if (size > MAX_CHARS) return res.status(413).json({ error: 'Request too large.' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: rule.maxTokens,
        system,
        messages
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Anthropic error:', r.status, data);
      return res.status(502).json({ error: 'AI request failed.' });
    }
    // Same shape the pages already read: data.content[0].text
    return res.status(200).json({ content: data.content });
  } catch (err) {
    console.error('ai proxy error:', err);
    return res.status(502).json({ error: 'AI request failed.' });
  }
};
