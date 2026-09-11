/* consent.js : bandeau de consentement. Aucune mesure d'audience n'est chargée
   avant un accord explicite. Le choix est conservé 6 mois côté navigateur.
   Pour brancher un outil : renseigner window.INNOVA_ANALYTICS avant ce script,
   il ne sera appelé qu'après acceptation. */
(function () {
  var KEY = 'innova-consent';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || !v.t || Date.now() - v.t > MAX_AGE) return null;
      return v.choice;
    } catch (e) { return null; }
  }
  function write(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, t: Date.now() })); } catch (e) {}
  }
  function runAnalytics() {
    if (typeof window.INNOVA_ANALYTICS === 'function') {
      try { window.INNOVA_ANALYTICS(); } catch (e) {}
    }
  }

  function banner() {
    var wrap = document.createElement('div');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-label', 'Consentement à la mesure d\u2019audience');
    wrap.style.cssText = 'position:fixed; z-index:300; left:16px; right:16px; bottom:16px; max-width:640px; margin:0 auto; display:flex; flex-wrap:wrap; align-items:center; gap:14px; padding:16px 18px; border-radius:18px; background:rgba(15,7,34,0.94); color:#FFFFFF; border:1px solid rgba(255,255,255,0.16); box-shadow:0 24px 60px rgba(0,0,0,0.45); backdrop-filter:blur(18px); font-family:inherit; font-size:13.5px; line-height:1.55';

    var txt = document.createElement('p');
    txt.style.cssText = 'margin:0; flex:1 1 260px; min-width:0; color:rgba(255,255,255,0.86)';
    txt.innerHTML = 'Nous mesurons l\u2019audience du site pour l\u2019améliorer. Rien n\u2019est déposé sans votre accord. <a href="MentionsLegales.dc.html" style="color:#C4A6FF">En savoir plus</a>';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:10px; flex:none';

    function mk(label, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'font-family:inherit; cursor:pointer; padding:11px 18px; border-radius:999px; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; transition:filter .3s ease, background .3s ease; '
        + (primary
          ? 'color:#FFFFFF; background:linear-gradient(180deg,#8A4DFF 0%,#6C22ED 45%,#5A18CF 100%); border:1px solid rgba(255,255,255,0.38)'
          : 'color:rgba(255,255,255,0.86); background:transparent; border:1px solid rgba(255,255,255,0.28)');
      return b;
    }
    var no = mk('Refuser', false), yes = mk('Accepter', true);

    function close(choice) {
      write(choice);
      wrap.remove();
      if (choice === 'granted') runAnalytics();
    }
    no.addEventListener('click', function () { close('denied'); });
    yes.addEventListener('click', function () { close('granted'); });

    row.appendChild(no); row.appendChild(yes);
    wrap.appendChild(txt); wrap.appendChild(row);
    wrap.tabIndex = -1;                              // le focus reste hors du bouton d'acceptation
    document.body.appendChild(wrap);
  }

  function boot() {
    var choice = read();
    if (choice === 'granted') { runAnalytics(); return; }
    if (choice === 'denied') return;
    banner();
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
