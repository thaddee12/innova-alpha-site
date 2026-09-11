/* footer-motion.js : anime le footer harmonisé du site : pastilles magnétiques,
   révélation au scroll, parallaxe du mot INNOVA, retour en haut.
   N'ajoute ni ne retire aucun nœud du DOM de la page (styles injectés dans <head>). */
(function () {
  if (window.__footerMotion) return;
  window.__footerMotion = true;

  const CSS = `
@keyframes sfBreathe { 0% { transform:translate(-50%,-50%) scale(1); opacity:.6 } 100% { transform:translate(-50%,-50%) scale(1.1); opacity:1 } }
@keyframes sfMarquee { from { transform:translateX(0) } to { transform:translateX(-50%) } }
@keyframes sfTrace { from { stroke-dashoffset:500 } to { stroke-dashoffset:0 } }
@keyframes sfTrace2 { from { stroke-dashoffset:360 } to { stroke-dashoffset:0 } }
[data-footer-trace]{ animation: sfTrace 14s linear infinite; filter: drop-shadow(0 0 6px rgba(169,113,255,0.95)) drop-shadow(0 0 18px rgba(138,77,255,0.55)); }
[data-footer-trace-2]{ animation: sfTrace2 26s linear infinite; animation-delay:-12s; filter: drop-shadow(0 0 5px rgba(138,77,255,0.8)); }
[data-footer-reveal]{ opacity:0; transform:translateY(28px); transition:opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
[data-footer-reveal][data-in]{ opacity:1; transform:translateY(0); }
[data-footer-shell] [data-magnetic]{ will-change:transform; transition:transform .35s cubic-bezier(.16,1,.3,1), border-color .35s ease, filter .3s ease; }
`;

  function injectCss() {
    if (document.getElementById('footer-motion-css')) return;
    const st = document.createElement('style');
    st.id = 'footer-motion-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function wire() {
    const shell = document.querySelector('[data-footer-shell]');
    if (!shell) return false;

    document.querySelectorAll('[data-footer-top]').forEach((b) => {
      if (b.__wired) return; b.__wired = true;
      b.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    });

    if (!reduced) {
      shell.querySelectorAll('[data-magnetic]').forEach((el) => {
        if (el.__mag) return; el.__mag = true;
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          el.style.transform = 'translate(' + (dx * 12).toFixed(2) + 'px,' + (dy * 8).toFixed(2) + 'px)';
          el.style.borderColor = 'rgba(108,34,237,0.4)';
        });
        el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; el.style.borderColor = ''; });
      });
    }

    if (!shell.__scroll) {
      shell.__scroll = true;
      const giant = shell.querySelector('[data-footer-giant]');
      const reveal = Array.from(shell.querySelectorAll('[data-footer-reveal]'));
      const onScroll = () => {
        const r = shell.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - r.top / Math.max(1, innerHeight)));
        if (giant) giant.style.transform = 'translateX(-50%) translateY(' + ((1 - p) * 70).toFixed(1) + 'px)';
        reveal.forEach((el, i) => {
          if (p > 0.18 + i * 0.08) el.setAttribute('data-in', '');
          else el.removeAttribute('data-in');
        });
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
      onScroll();
    }
    return true;
  }

  injectCss();
  let tries = 0;
  (function boot() {
    const ok = wire();
    if (++tries < 40) setTimeout(boot, ok ? 1200 : 250);
  })();
})();
