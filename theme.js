/* theme.js : mémorise le mode nuit et suit la préférence système au premier passage. */
(function () {
  var KEY = 'innova-theme';
  function apply(night) {
    if (night) document.body.setAttribute('data-night', '');
    else document.body.removeAttribute('data-night');
  }
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function initial() {
    var v = stored();
    if (v === 'night') return true;
    if (v === 'day') return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  var night = initial();
  window.INNOVA_NIGHT = function () { return night; };
  window.INNOVA_SET_NIGHT = function (v) {
    night = !!v;
    try { localStorage.setItem(KEY, night ? 'night' : 'day'); } catch (e) {}
    apply(night);
  };
  /* Bascule jour/nuit + glyphe du bouton. Defini ici (et non dans un script
     de page) pour etre disponible sur toutes les pages du site. */
  window.INNOVA_toggleTheme = function () {
    window.INNOVA_SET_NIGHT(!night);
    syncGlyph();
  };

  window.INNOVA_scrollToTop = function () {
    var boxes = [document.scrollingElement, document.body, document.documentElement];
    var box = boxes.filter(function (el) { return el && el.scrollTop > 0; })[0];
    (box || window).scrollTo({ top: 0, behavior: 'smooth' });
  };

  function syncGlyph() {
    var glyphs = document.querySelectorAll('[data-theme-glyph]');
    for (var i = 0; i < glyphs.length; i++) {
      glyphs[i].textContent = night ? '☀' : '☾';
    }
  }

  function boot() { apply(night); syncGlyph(); }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
