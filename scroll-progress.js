/* scroll-progress.js : indicateur de progression latéral.
   Crée le rail s'il manque, suit le défilement, s'efface à l'arrêt et
   réapparaît au défilement avec une dispersion de particules ("poussière"). */
(function () {
  if (window.__scrollProgress) return;
  window.__scrollProgress = true;

  var CSS = '@keyframes spDust { 0% { opacity:.9; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(var(--dx), var(--dy)) scale(.3); } }\n'
    + '[data-scroll-progress]{ transition:opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1); }\n'
    + '[data-scroll-progress][data-idle]{ opacity:0; transform:translateY(-50%) translateX(-10px); pointer-events:none; }\n'
    + '[data-scroll-dust]{ position:fixed; z-index:80; width:4px; height:4px; border-radius:50%; background:#8A4DFF; box-shadow:0 0 8px rgba(138,77,255,.85); pointer-events:none; animation:spDust .9s ease-out forwards; }\n'
    + '@media (max-width: 900px){ [data-scroll-progress]{ display:none; } }\n';

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
    rail.style.cssText = 'position:fixed; top:50%; left:18px; transform:translateY(-50%); height:38vh; width:2px; background:rgba(108,34,237,0.22); border-radius:2px; z-index:90';
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
