/* contact.js : formulaire de contact (barre de progression, envoi par email
   pre-rempli, anti-spam), accordeon FAQ, points decoratifs du cercle
   "Diagnostic Alpha". Port vanilla du composant React d'origine. */
(function () {
  var MAILTO = 'contact@innovaalpha.com';

  /* ---------- points decoratifs (cercle hero) ---------- */
  function randomDot() {
    var x, y, tries = 0;
    do {
      x = 4 + Math.random() * 88;
      y = 8 + Math.random() * 84;
      tries++;
    } while (tries < 20 && x < 58 && y > 30 && y < 82);
    return { left: x.toFixed(1) + '%', top: y.toFixed(1) + '%' };
  }
  function setupDots() {
    var dots = Array.from(document.querySelectorAll('[data-dot]'));
    dots.forEach(function (el, i) {
      setTimeout(function () {
        setInterval(function () {
          var d = randomDot();
          el.style.left = d.left; el.style.top = d.top;
        }, 3400);
      }, i * 480 + 3400);
    });
  }

  /* ---------- formulaire ---------- */
  function setupForm() {
    var form = document.querySelector('[data-diag-form]');
    if (!form) return;
    var progressLabel = document.querySelector('[data-progress-label]');
    var progressBar = document.querySelector('[data-progress-bar]');
    var statusEl = document.querySelector('[data-form-status]');
    var submitBtn = form.querySelector('button[type="submit"]');
    var NEEDED = ['name', 'email', 'company', 'domain', 'message', 'privacy'];

    function updateProgress() {
      var req = Array.from(form.elements).filter(function (el) {
        return el.name && (el.required || NEEDED.indexOf(el.name) > -1);
      });
      var done = req.filter(function (el) {
        return el.type === 'checkbox' ? el.checked : String(el.value || '').trim() !== '';
      });
      var pct = req.length ? Math.round((done.length / req.length) * 100) : 0;
      if (progressLabel) progressLabel.textContent = pct + ' %';
      if (progressBar) progressBar.style.width = pct + '%';
    }
    form.addEventListener('input', updateProgress);
    form.addEventListener('change', updateProgress);
    updateProgress();

    function setStatus(text, color) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.style.color = color;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var payload = Object.fromEntries(data);

      if (payload.site_web) return; // honeypot : bot detecte, on ignore silencieusement
      delete payload.site_web;
      if (!payload.privacy) {
        setStatus("Merci de valider le consentement avant l'envoi.", '#D2453B');
        return;
      }

      var body = Object.entries(payload).map(function (kv) { return kv[0] + ' : ' + kv[1]; }).join('\n');
      try {
        var kept = JSON.parse(localStorage.getItem('innova-demandes') || '[]');
        kept.push(Object.assign({}, payload, { date: new Date().toISOString() }));
        localStorage.setItem('innova-demandes', JSON.stringify(kept));
      } catch (err) {}

      window.location.href = 'mailto:' + MAILTO
        + '?subject=' + encodeURIComponent('Demande de diagnostic : ' + (payload.name || ''))
        + '&body=' + encodeURIComponent(body);
      setStatus("Votre logiciel de messagerie va s'ouvrir avec la demande pré-remplie. Si rien ne se passe, écrivez à " + MAILTO + ' ou appelez le +237 697 212 646.', 'var(--txB)');
    });
  }

  /* ---------- FAQ (accordeon) ---------- */
  function setupFaq() {
    document.querySelectorAll('[data-faq]').forEach(function (item) {
      var btn = item.querySelector('button');
      btn.addEventListener('click', function () {
        item.toggleAttribute('data-open');
        btn.setAttribute('aria-expanded', item.hasAttribute('data-open') ? 'true' : 'false');
      });
    });
  }

  function boot() { setupDots(); setupForm(); setupFaq(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
