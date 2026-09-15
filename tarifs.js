/* tarifs.js : conversion de devise (XAF de reference, FX indicatif), bascule
   entre les 6 familles de forfaits, onglets. Port vanilla du composant React
   d'origine (memes regles de conversion et de detection de devise). */
(function () {
  var EN = /^en/i.test(document.documentElement.lang || '');
  var LOCALE = EN ? 'en-US' : 'fr-FR';
  var FROM = EN ? 'From ' : 'Dès ';
  var FX = {
    XAF: { label: 'FCFA', rate: 1 },
    EUR: { label: '€', rate: 655.957 },
    USD: { label: '$', rate: 600 },
    GBP: { label: '£', rate: 780 },
    CAD: { label: 'C$', rate: 440 },
  };
  var NOTE_XAF = EN ? 'Reference prices in CFA francs (XAF/XOF). Firm quote after the Alpha Diagnostic.' : 'Tarifs de référence en francs CFA (XAF/XOF). Devis ferme après le Diagnostic Alpha.';
  var NOTE_OTHER = EN ? 'Indicative conversion from the CFA franc, our reference currency. Invoicing remains in FCFA at the daily rate.' : 'Conversion indicative depuis le franc CFA, notre devise de référence. La facturation reste en FCFA au taux du jour.';

  function amount(xaf, withUnit, cur) {
    var fx = FX[cur];
    if (cur === 'XAF') {
      if (xaf >= 1000000) {
        var m = Math.round(xaf / 100000) / 10;
        return (EN ? String(m) : String(m).replace('.', ',')) + (withUnit ? ' M FCFA' : ' M');
      }
      var v = Math.round(xaf / 1000) * 1000;
      return new Intl.NumberFormat(LOCALE).format(v) + (withUnit ? ' FCFA' : '');
    }
    var raw = xaf / fx.rate;
    var step = raw >= 20000 ? 1000 : raw >= 2000 ? 100 : raw >= 200 ? 25 : 5;
    var v2 = Math.max(step, Math.round(raw / step) * step);
    var num = new Intl.NumberFormat(LOCALE).format(v2);
    return withUnit ? num + ' ' + fx.label : num;
  }

  function priceText(el, cur) {
    var min = el.getAttribute('data-xaf') === '' ? null : parseFloat(el.getAttribute('data-xaf'));
    var maxAttr = el.getAttribute('data-xaf-max');
    var max = maxAttr ? parseFloat(maxAttr) : null;
    var plus = el.getAttribute('data-plus') === '1';
    var from = el.getAttribute('data-from') === '1';   // prix plancher : prefixe "Des"
    var kind = el.getAttribute('data-kind');
    // controle avant tout calcul (sinon un abonnement sans prix affichait "NaN")
    if (min === null || isNaN(min)) return EN ? 'On quote' : 'Sur devis';
    if (kind === 'sub') {
      return (from ? FROM : '') + amount(min, true, cur) + (plus ? '+' : '') + (EN ? ' / month' : ' / mois');
    }
    if (min === 0) return EN ? 'Free' : 'Gratuit';
    if (max) return amount(min, false, cur) + ' – ' + amount(max, true, cur);
    return (from ? FROM : '') + amount(min, true, cur) + (plus ? '+' : '');
  }

  function detectCurrency() {
    var stored = null;
    try { stored = localStorage.getItem('ia-currency'); } catch (e) {}
    if (stored && FX[stored]) return stored;
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (/^Africa\//.test(tz)) return 'XAF';
    if (tz === 'Europe/London') return 'GBP';
    if (/^Europe\//.test(tz)) return 'EUR';
    if (/^America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina)/.test(tz)) return 'CAD';
    if (/^America\//.test(tz)) return 'USD';
    var lang = (navigator.language || '').toLowerCase();
    if (/-(cm|ga|td|cf|cg|gq|sn|ci|ml|bf|bj|tg|ne|gw)$/.test(lang)) return 'XAF';
    if (/-(fr|be|de|it|es|pt|nl|ie|at|fi)$/.test(lang)) return 'EUR';
    if (/-gb$/.test(lang)) return 'GBP';
    if (/-ca$/.test(lang)) return 'CAD';
    return 'USD';
  }

  var currentCurrency = 'XAF';

  function renderPrices() {
    document.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = priceText(el, currentCurrency);
    });
    var note = document.querySelector('[data-fx-note]');
    if (note) note.textContent = currentCurrency === 'XAF' ? NOTE_XAF : NOTE_OTHER;
  }

  function setCurrency(code) {
    currentCurrency = code;
    try { localStorage.setItem('ia-currency', code); } catch (e) {}
    document.querySelectorAll('[data-currency-btn]').forEach(function (b) {
      var active = b.getAttribute('data-currency-btn') === code;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      // le hero est toujours sombre : texte clair pour les devises inactives (sinon noir sur noir en mode jour)
      b.style.color = active ? '#FFFFFF' : 'rgba(255,255,255,0.78)';
      b.style.background = active ? 'linear-gradient(180deg, #8A4DFF 0%, #6C22ED 45%, #5A18CF 100%)' : 'transparent';
      b.style.borderColor = active ? 'rgba(255,255,255,0.38)' : 'transparent';
      b.style.boxShadow = active ? '0 10px 28px rgba(108,34,237,0.38), inset 0 1px 0 rgba(255,255,255,0.45)' : 'none';
    });
    renderPrices();
  }

  function setupCurrency() {
    document.querySelectorAll('[data-currency-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setCurrency(b.getAttribute('data-currency-btn')); });
    });
    var detected = detectCurrency();
    setCurrency(detected);
  }

  /* ---------- onglets famille de forfaits ---------- */
  var FAMILY_TITLES = EN ? {
    conseil: 'Consulting & Transformation', digital: 'Digital & Web', ia: 'AI & Automation',
    graphisme: 'Brand & Marketing', mobile: 'Mobile Apps', formation: 'AI Training'
  } : {
    conseil: 'Conseil & Transformation', digital: 'Digital & Web', ia: 'IA & Automatisation',
    graphisme: 'Identité & Marketing', mobile: 'Applications Mobiles', formation: 'Formation IA'
  };
  function setupTabs() {
    var tabs = document.querySelectorAll('[data-tab-btn]');
    var titleEl = document.querySelector('[data-tab-title]');
    function select(id) {
      tabs.forEach(function (b) {
        var on = b.getAttribute('data-tab-btn') === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.style.color = on ? '#FFFFFF' : 'var(--txA, #0B0B0C)';
        b.style.background = on ? 'linear-gradient(180deg, #8A4DFF 0%, #6C22ED 45%, #5A18CF 100%)' : 'transparent';
        b.style.borderColor = on ? 'rgba(255,255,255,0.38)' : 'transparent';
        b.style.boxShadow = on ? '0 10px 26px rgba(108,34,237,0.34)' : 'none';
      });
      document.querySelectorAll('[data-family]').forEach(function (block) {
        block.style.display = block.getAttribute('data-family') === id ? 'grid' : 'none';
      });
      if (titleEl) titleEl.textContent = FAMILY_TITLES[id] || '';
    }

    var list = document.querySelector('[role="tablist"][data-family-tabs]');
    var mobile = window.matchMedia('(max-width: 760px)');

    function syncEdge() {
      if (!list) return;
      list.classList.toggle('at-end', list.scrollLeft + list.clientWidth >= list.scrollWidth - 4);
    }

    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-tab-btn');
        select(id);
        if (!mobile.matches || !list) return;
        // onglet actif ramene au centre du bandeau
        list.scrollTo({ left: b.offsetLeft - (list.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
        // si l'on est deja descendu dans les cartes, revenir au debut de la famille choisie
        var block = document.querySelector('[data-family="' + id + '"]');
        if (!block) return;
        var barBottom = list.getBoundingClientRect().bottom;
        var top = block.getBoundingClientRect().top;
        if (top < barBottom) {
          window.scrollTo({ top: window.scrollY + top - barBottom - 12, behavior: 'smooth' });
        }
      });
    });

    if (list) {
      list.addEventListener('scroll', syncEdge, { passive: true });
      window.addEventListener('resize', syncEdge);
      syncEdge();
    }
  }

  function boot() { setupCurrency(); setupTabs(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
