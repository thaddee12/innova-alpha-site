/* scroll-progress.js : indicateur de progression latéral.
   Crée le rail s'il manque, suit le défilement, s'efface à l'arrêt et
   réapparaît au défilement avec une dispersion de particules ("poussière").
   Affiche aussi les icônes de réseaux sociaux sous le rail (toujours visibles). */
(function () {
  if (window.__scrollProgress) return;
  window.__scrollProgress = true;

  var CSS = '@keyframes spDust { 0% { opacity:.9; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(var(--dx), var(--dy)) scale(.3); } }\n'
    + '[data-scroll-progress]{ transition:opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1); }\n'
    + '[data-scroll-progress][data-idle]{ opacity:0; transform:translateY(-50%) translateX(-10px); pointer-events:none; }\n'
    + '[data-scroll-dust]{ position:fixed; z-index:80; width:4px; height:4px; border-radius:50%; background:#8A4DFF; box-shadow:0 0 8px rgba(138,77,255,.85); pointer-events:none; animation:spDust .9s ease-out forwards; }\n'
    + '@media (max-width: 900px){ [data-scroll-progress]{ display:none; } }\n';

  var EN = /^en/i.test(document.documentElement.lang || '');

  /* Reseaux sociaux affiches sous l'indicateur. Une entree sans url s'affiche sans
     lien, marquee "bientot" : renseigner l'url de Facebook ou TikTok des que la page existe. */
  var SOCIALS = [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/innova-alpha/',
      d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { name: 'Facebook', url: '',
      d: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' },
    { name: 'TikTok', url: '',
      d: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' }
  ];

  // aligne le rail (y compris celui ecrit dans le HTML des pages) sur l'axe des icones
  CSS += '[data-scroll-progress]{ left:24px !important; }\n';
  CSS += '[data-socials]{ position:fixed; left:8px; top:calc(50% + 19vh + 20px); z-index:90; display:flex; flex-direction:column; gap:10px; opacity:0; transform:translateX(-8px); transition:opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }\n'
    + '[data-socials][data-in]{ opacity:1; transform:none; }\n'
    + '[data-socials] > *{ position:relative; display:flex; align-items:center; justify-content:center; box-sizing:border-box; width:34px; height:34px; border-radius:999px; color:var(--txA, #0B0B0C); background:var(--navBg, rgba(255,255,255,0.72)); border:1px solid var(--lineA, rgba(11,11,12,0.14)); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); text-decoration:none; transition:color .35s ease, border-color .35s ease, transform .45s cubic-bezier(.22,1,.36,1), box-shadow .35s ease; }\n'
    + '[data-socials] > *::before{ content:""; position:absolute; inset:-1px; border-radius:inherit; background:linear-gradient(180deg, #8A4DFF 0%, #6C22ED 55%, #5A18CF 100%); opacity:0; transform:scale(.6); transition:opacity .35s ease, transform .45s cubic-bezier(.22,1,.36,1); }\n'
    + '[data-socials] svg{ position:relative; width:15px; height:15px; fill:currentColor; }\n'
    + '[data-socials] > * > span{ position:absolute; left:calc(100% + 10px); top:50%; padding:6px 11px; border-radius:999px; background:#1A0B3E; color:#FFFFFF; font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; white-space:nowrap; pointer-events:none; opacity:0; transform:translate(-6px,-50%); transition:opacity .3s ease, transform .35s cubic-bezier(.22,1,.36,1); }\n'
    + '@media (hover:hover){ [data-socials] > *:hover{ color:#FFFFFF; border-color:transparent; transform:translateY(-2px) scale(1.06); box-shadow:0 10px 24px rgba(108,34,237,0.38); } [data-socials] > *:hover::before{ opacity:1; transform:scale(1); } [data-socials] > *:hover > span{ opacity:1; transform:translate(0,-50%); } }\n'
    + '[data-socials] > *:focus-visible{ outline:2px solid #8A4DFF; outline-offset:3px; color:#FFFFFF; }\n'
    + '[data-socials] > *:focus-visible::before{ opacity:1; transform:scale(1); }\n'
    + '[data-socials] > *:focus-visible > span{ opacity:1; transform:translate(0,-50%); }\n'
    + '[data-socials] [data-soon]{ cursor:default; }\n'
    + '@media (max-width: 900px){ [data-socials]{ display:none; } }\n'
    + '@media (prefers-reduced-motion: reduce){ [data-socials], [data-socials] > *, [data-socials] > *::before, [data-socials] > * > span{ transition:none; } }\n'
    + '@media print{ [data-socials]{ display:none !important; } }\n';

  function buildSocials() {
    if (document.querySelector('[data-socials]')) return;
    var box = document.createElement('div');
    box.setAttribute('data-socials', '');
    box.setAttribute('role', 'navigation');
    box.setAttribute('aria-label', EN ? 'Social media' : 'Réseaux sociaux');
    SOCIALS.forEach(function (s) {
      var soon = !s.url;
      var el = document.createElement(soon ? 'span' : 'a');
      var who = 'INNOVA ALPHA ' + (EN ? 'on ' : 'sur ') + s.name;
      if (soon) {
        el.setAttribute('data-soon', '');
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', who + (EN ? ' (coming soon)' : ' (bientôt)'));
      } else {
        el.href = s.url;
        el.target = '_blank';
        el.rel = 'noopener';
        el.setAttribute('aria-label', who);
      }
      el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + s.d + '"></path></svg>'
        + '<span aria-hidden="true">' + s.name + (soon ? (EN ? ' · soon' : ' · bientôt') : '') + '</span>';
      box.appendChild(el);
    });
    document.body.appendChild(box);
    setTimeout(function () { box.setAttribute('data-in', ''); }, 700);
  }


  function injectCss() {
    if (document.getElementById('scroll-progress-css')) return;
    var st = document.createElement('style');
    st.id = 'scroll-progress-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function build() {
    var rail = document.createElement('div');
    rail.setAttribute('data-scroll-progress', '');
    rail.setAttribute('aria-hidden', 'true');
    rail.style.cssText = 'position:fixed; top:50%; left:24px; transform:translateY(-50%); height:38vh; width:2px; background:rgba(108,34,237,0.22); border-radius:2px; z-index:90';
    var thumb = document.createElement('div');
    thumb.setAttribute('data-scroll-thumb', '');
    thumb.style.cssText = 'position:absolute; left:50%; top:0; transform:translate(-50%,-50%); width:12px; height:12px; border-radius:50%; background:#6C22ED; box-shadow:0 0 10px rgba(108,34,237,0.8)';
    rail.appendChild(thumb);
    document.body.appendChild(rail);
    return rail;
  }

  function dust(rail) {
    var r = rail.getBoundingClientRect();
    var thumb = rail.querySelector('[data-scroll-thumb]');
    var t = thumb ? thumb.getBoundingClientRect() : r;
    for (var i = 0; i < 9; i++) {
      var p = document.createElement('span');
      p.setAttribute('data-scroll-dust', '');
      var a = Math.random() * Math.PI * 2, d = 16 + Math.random() * 34;
      p.style.left = (t.left + t.width / 2 - 2) + 'px';
      p.style.top = (t.top + t.height / 2 - 2) + 'px';
      p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * d - 12).toFixed(1) + 'px');
      p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      document.body.appendChild(p);
      setTimeout((function (el) { return function () { el.remove(); }; })(p), 1100);
    }
  }

  function boot() {
    injectCss();
    buildSocials();
    var rail = document.querySelector('[data-scroll-progress]') || build();
    var thumb = rail.querySelector('[data-scroll-thumb]');
    if (!thumb) return;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idle = true, timer = 0;
    rail.setAttribute('data-idle', '');

    function update() {
      var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      var p = Math.min(1, Math.max(0, scrollY / max));
      thumb.style.top = (p * 100) + '%';
      if (idle) {
        idle = false;
        rail.removeAttribute('data-idle');
        if (!reduced) dust(rail);
      }
      clearTimeout(timer);
      timer = setTimeout(function () {
        idle = true;
        rail.setAttribute('data-idle', '');
        if (!reduced) dust(rail);
      }, 1200);
    }
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    var max0 = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    thumb.style.top = (Math.min(1, scrollY / max0) * 100) + '%';
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
