/* Minimal Telegram Bot API client. TELEGRAM_BOT_TOKEN comes from @BotFather. */
const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
async function call(method, body) {
  const r = await fetch(`${API()}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!d.ok) console.error('Telegram', method, d.description || r.status);
  return d.result;
}
const kb = rows => ({ inline_keyboard: rows });
const send = (chat_id, text, keyboard) => call('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...(keyboard ? { reply_markup: kb(keyboard) } : {}) });
const edit = (chat_id, message_id, text, keyboard) => call('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...(keyboard ? { reply_markup: kb(keyboard) } : {}) });
const answer = (callback_query_id, text) => call('answerCallbackQuery', { callback_query_id, ...(text ? { text } : {}) });
const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// Message to you (the admin chat)
const admin = (text, keyboard) => process.env.TELEGRAM_ADMIN_CHAT_ID ? send(process.env.TELEGRAM_ADMIN_CHAT_ID, text, keyboard) : null;
module.exports = { call, send, edit, answer, esc, admin };
