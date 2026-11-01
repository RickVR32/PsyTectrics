/* PsyTectrics site widgets: floating "Ask" Q&A chat + review form.
   Include with <script src="pt-widgets.js" defer></script>. Review form: <div data-pt-review></div>. */
(function () {
  const e = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = `
.ptw-btn{position:fixed;right:16px;bottom:16px;z-index:900;background:#0B1020;color:#fff;border:0;border-radius:999px;padding:.75rem 1.1rem;font:600 .82rem/1 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);cursor:pointer}
.ptw-btn:focus-visible,.ptw-panel button:focus-visible{outline:2px solid #00D4FF;outline-offset:2px}
.ptw-panel{position:fixed;right:16px;bottom:72px;z-index:901;width:min(360px,calc(100vw - 32px));max-height:min(520px,calc(100vh - 100px));display:flex;flex-direction:column;background:#fff;color:#0B1020;border:1px solid #E5E7EB;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.2);font:400 .88rem/1.5 system-ui,sans-serif}
.ptw-panel[hidden]{display:none}
.ptw-head{display:flex;justify-content:space-between;align-items:center;padding:.8rem 1rem;border-bottom:1px solid #E5E7EB;font-weight:600}
.ptw-head button{background:none;border:0;font-size:1.2rem;cursor:pointer;color:#6B7280}
.ptw-log{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.6rem}
.ptw-m{max-width:85%;padding:.55rem .8rem;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere}
.ptw-m.b{background:#F3F4F6;align-self:flex-start}.ptw-m.u{background:#0B1020;color:#fff;align-self:flex-end}
.ptw-f{display:flex;gap:.5rem;padding:.7rem;border-top:1px solid #E5E7EB}
.ptw-f input{flex:1;min-width:0;border:1px solid #D1D5DB;border-radius:6px;padding:.55rem .7rem;font:inherit}
.ptw-f button{background:#00D4FF;color:#060B18;border:0;border-radius:6px;padding:0 .9rem;font-weight:700;cursor:pointer}
.ptw-note{font-size:.7rem;color:#9CA3AF;padding:0 1rem .7rem}
.ptr{border:1px solid #E5E7EB;border-radius:8px;padding:1.4rem;background:#fff;color:#0B1020;max-width:640px;margin:2rem auto;font:400 .9rem/1.5 system-ui,sans-serif}
.ptr h3{margin:0 0 .4rem;font-size:1.1rem}.ptr p{margin:0 0 1rem;color:#6B7280}
.ptr .stars{display:flex;gap:.3rem;margin-bottom:.8rem}.ptr .stars button{font-size:1.6rem;background:none;border:0;cursor:pointer;color:#D1D5DB;padding:0 .1rem}.ptr .stars button.on{color:#C48A1C}
.ptr input[type=text],.ptr textarea{width:100%;box-sizing:border-box;border:1px solid #D1D5DB;border-radius:6px;padding:.6rem .7rem;font:inherit;margin-bottom:.7rem}
.ptr textarea{min-height:90px;resize:vertical}.ptr label{display:flex;gap:.5rem;align-items:flex-start;font-size:.82rem;color:#374151;margin-bottom:.9rem}
.ptr .go{background:#0B1020;color:#fff;border:0;border-radius:6px;padding:.7rem 1.2rem;font-weight:600;cursor:pointer}.ptr .msg{font-size:.82rem;color:#6B7280;margin-top:.6rem}
.ptr .hp{position:absolute;left:-9999px}
@media print{.ptw-btn,.ptw-panel,.ptr{display:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---- Ask widget ----
  const btn = document.createElement('button'); btn.className = 'ptw-btn'; btn.type = 'button'; btn.textContent = '💬 Ask a question';
  btn.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('div'); panel.className = 'ptw-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Ask PsyTectrics');
  panel.innerHTML = '<div class="ptw-head"><span>Ask PsyTectrics</span><button type="button" aria-label="Close">×</button></div><div class="ptw-log" aria-live="polite"><div class="ptw-m b">Hi! Ask me anything about the tests, reports, prices or the games.</div></div><form class="ptw-f"><input type="text" maxlength="500" placeholder="Type your question…" aria-label="Your question"><button type="submit">Send</button></form><div class="ptw-note">Automated answers. Not therapy or medical advice. Also on Telegram.</div>';
  document.body.append(btn, panel);
  const log = panel.querySelector('.ptw-log'), form = panel.querySelector('form'), input = form.querySelector('input');
  const history = [];
  const add = (t, who) => { const d = document.createElement('div'); d.className = 'ptw-m ' + who; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  const toggle = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) input.focus(); };
  btn.onclick = () => toggle(panel.hidden);
  panel.querySelector('.ptw-head button').onclick = () => toggle(false);
  form.onsubmit = async ev => {
    ev.preventDefault(); const q = input.value.trim(); if (!q) return;
    input.value = ''; add(q, 'u'); const wait = add('…', 'b');
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, history }) });
      const d = await r.json(); wait.textContent = d.text || 'Sorry, something went wrong.';
      history.push({ role: 'user', content: q }, { role: 'assistant', content: wait.textContent });
    } catch { wait.textContent = 'Sorry, I couldn\'t connect. Email hello@psytectrics.com.'; }
  };

  // ---- Review form ----
  document.querySelectorAll('[data-pt-review]').forEach(el => {
    let rating = 0;
    el.innerHTML = `<div class="ptr"><h3>How was your report?</h3><p>Your review goes live on the site once it's checked.</p>
      <div class="stars" role="radiogroup" aria-label="Star rating">${[1, 2, 3, 4, 5].map(v => `<button type="button" role="radio" aria-checked="false" aria-label="${v} star${v > 1 ? 's' : ''}" data-v="${v}">★</button>`).join('')}</div>
      <input type="text" class="nm" maxlength="40" placeholder="First name (shown with your review)">
      <textarea class="tx" maxlength="600" placeholder="What did you find useful?"></textarea>
      <input type="text" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label><input type="checkbox" class="inc"> I got this report free or discounted in return for a review</label>
      <button type="button" class="go">Send review</button><div class="msg"></div></div>`;
    const stars = el.querySelectorAll('.stars button'), msg = el.querySelector('.msg');
    stars.forEach(b => b.onclick = () => { rating = +b.dataset.v; stars.forEach(x => { const on = +x.dataset.v <= rating; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(+x.dataset.v === rating)); }); });
    el.querySelector('.go').onclick = async () => {
      const text = el.querySelector('.tx').value.trim();
      if (!rating) { msg.textContent = 'Please pick a star rating.'; return; }
      if (text.length < 10) { msg.textContent = 'Please write at least a sentence.'; return; }
      const go = el.querySelector('.go'); go.disabled = true; msg.textContent = 'Sending…';
      try {
        const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, text, name: el.querySelector('.nm').value.trim(), incentivised: el.querySelector('.inc').checked, website: el.querySelector('.hp').value, product: el.dataset.ptReview || 'Awareness Profile' }) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
        el.querySelector('.ptr').innerHTML = '<h3>Thank you 🙏</h3><p>Your review has been sent and will appear on the site once it\'s checked.</p>';
      } catch (err) { go.disabled = false; msg.textContent = (err && err.message) || 'Could not send. Please try again.'; }
    };
  });
})();
