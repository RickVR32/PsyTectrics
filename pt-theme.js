/* Light / dark switch. The <head> snippet sets the mode before the page paints (no flash);
   this adds the sun/moon button to the nav and remembers the choice. */
(function () {
  const root = document.documentElement;
  const set = t => { root.setAttribute('data-theme', t); try { localStorage.setItem('pt-theme', t); } catch (e) {} 
    document.querySelectorAll('.pt-theme-btn').forEach(b => { b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); b.setAttribute('aria-pressed', String(t === 'dark')); });
    window.dispatchEvent(new CustomEvent('pt-theme', { detail: t })); };
  const btn = () => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pt-theme-btn';
    b.innerHTML = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    b.onclick = () => set(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    return b;
  };
  function mount() {
    const nav = document.querySelector('nav'); if (!nav || nav.querySelector('.pt-theme-btn')) return;
    const ham = nav.querySelector('.nav-hamburger');
    const b = btn(); ham ? nav.insertBefore(b, ham) : nav.appendChild(b);
    set(root.getAttribute('data-theme') || 'light');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
