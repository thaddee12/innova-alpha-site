/* whatsapp-float.js : bouton WhatsApp flottant, present sur toutes les pages.
   - remonte au-dessus du bandeau cookies tant qu'il est affiche ;
   - remonte au-dessus du bouton "retour en haut" quand le pied de page est visible ;
   - reste sous la barre de navigation (z-index), pour que le menu mobile ouvert le recouvre ;
   - sur desktop, s'etire au survol pour afficher "Discuter sur WhatsApp". */
(function () {
  if (window.__waFloat) return;
  window.__waFloat = true;
  var EN = /^en/i.test(document.documentElement.lang || '');

  var HREF = 'https://wa.me/237697212646?text=' +
    encodeURIComponent(EN ? 'Hello INNOVA ALPHA, I would like to discuss my project.' : 'Bonjour INNOVA ALPHA, je souhaite faire le point sur mon projet.');
  var GAP = 18;

  var CSS =
    '[data-wa-float]{ position:fixed; right:18px; bottom:calc(' + GAP + 'px + env(safe-area-inset-bottom, 0px)); z-index:95;' +
    ' display:inline-flex; align-items:center; gap:0; height:56px; min-width:56px; padding:0 16px; box-sizing:border-box;' +
    ' border-radius:999px; background:#25D366; color:#FFFFFF; text-decoration:none; font-family:inherit;' +
    ' box-shadow:0 10px 28px rgba(18,140,70,0.38), 0 2px 6px rgba(0,0,0,0.18);' +
    ' opacity:0; transform:translateY(12px) scale(.92);' +
    ' transition:bottom .35s cubic-bezier(.22,1,.36,1), opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, gap .35s ease; }\n' +
    '[data-wa-float][data-in]{ opacity:1; transform:none; }\n' +
    '[data-wa-float] svg{ flex:none; width:26px; height:26px; margin:0 -1px; }\n' +
    '[data-wa-float] span{ max-width:0; overflow:hidden; white-space:nowrap; font-size:13px; font-weight:700; letter-spacing:0.04em;' +
    ' transition:max-width .4s cubic-bezier(.22,1,.36,1); }\n' +
    '[data-wa-float]:hover, [data-wa-float]:focus-visible{ color:#FFFFFF; box-shadow:0 14px 34px rgba(18,140,70,0.48), 0 2px 6px rgba(0,0,0,0.2); }\n' +
    '[data-wa-float]:focus-visible{ outline:3px solid #8A4DFF; outline-offset:3px; }\n' +
    '@media (hover:hover) and (min-width:1121px){ [data-wa-float]:hover, [data-wa-float]:focus-visible{ gap:10px; }' +
    ' [data-wa-float]:hover span, [data-wa-float]:focus-visible span{ max-width:200px; } }\n' +
    '@media (max-width:760px){ [data-wa-float]{ right:14px; height:54px; min-width:54px; padding:0 14px; } }\n' +
    '@media (prefers-reduced-motion: reduce){ [data-wa-float]{ transition:none; } }\n' +
    '@media print{ [data-wa-float]{ display:none !important; } }\n';

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>';

  function injectCss() {
    if (document.getElementById('wa-float-css')) return;
    var st = document.createElement('style');
    st.id = 'wa-float-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function build() {
    var a = document.createElement('a');
    a.setAttribute('data-wa-float', '');
    a.href = HREF;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', EN ? 'Chat with INNOVA ALPHA on WhatsApp' : 'Discuter avec INNOVA ALPHA sur WhatsApp');
    a.innerHTML = ICON + '<span>' + (EN ? 'Chat on WhatsApp' : 'Discuter sur WhatsApp') + '</span>';
    document.body.appendChild(a);
    return a;
  }

  function consentBanner() {
    return document.querySelector('[data-consent], [role="dialog"][aria-label^="Consentement"]');
  }

  function boot() {
    injectCss();
    var btn = document.querySelector('[data-wa-float]') || build();
    var shell = document.querySelector('[data-footer-shell]');
    var footerVisible = false;

    function place() {
      var extra = 0;
      var banner = consentBanner();
      if (banner) {
        // hauteur du bandeau + sa marge basse (16px) + un espace
        extra = Math.max(extra, banner.getBoundingClientRect().height + 16 + 12 - GAP);
      }
      if (footerVisible && shell) {
        var foot = shell.querySelector('footer');
        var bar = foot && foot.lastElementChild;
        if (bar) extra = Math.max(extra, bar.getBoundingClientRect().height + 10);
      }
      btn.style.bottom = 'calc(' + (GAP + extra) + 'px + env(safe-area-inset-bottom, 0px))';
    }

    // bandeau cookies : apparition / disparition
    new MutationObserver(place).observe(document.body, { childList: true });

    // pied de page : remonter quand la barre du bas (bouton retour en haut) est a l'ecran
    if (shell && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        footerVisible = entries[0].intersectionRatio > 0.85;
        place();
      }, { threshold: [0, 0.85, 1] }).observe(shell);
    }

    window.addEventListener('resize', place, { passive: true });
    place();

    // entree discrete, apres le chargement de la page
    setTimeout(function () { btn.setAttribute('data-in', ''); }, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
