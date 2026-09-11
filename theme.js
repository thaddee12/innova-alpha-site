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
  function boot() { apply(night); }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
