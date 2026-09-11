/* realisations.js : filtres portfolio, carrousel de projets (defilement natif
   + auto-avance), compteur de stats, effet spotlight au curseur, apparition
   au scroll. Port vanilla du composant React d'origine. */
(function () {
  var PROJECTS_TYPE = {}; // rempli via data-type sur chaque carte

  /* ---------- filtres ---------- */
  function setupFilters() {
    var buttons = Array.from(document.querySelectorAll('[data-filter-btn]'));
    var cards = Array.from(document.querySelectorAll('[data-card]'));
    if (!buttons.length) return;

    function apply(label) {
      buttons.forEach(function (b) {
        var active = b.getAttribute('data-filter') === label;
        b.setAttribute('aria-selected', active ? 'true' : 'false');
        b.style.color = active ? '#FFFFFF' : 'var(--txA)';
        b.style.background = active ? 'linear-gradient(180deg, #8A4DFF 0%, #6C22ED 45%, #5A18CF 100%)' : 'var(--glassBg)';
        b.style.borderColor = active ? 'rgba(255,255,255,0.38)' : 'var(--lineA)';
        b.style.boxShadow = active ? '0 10px 26px rgba(108,34,237,0.34)' : 'none';
      });
      var shown = 0;
      cards.forEach(function (c) {
        var match = label === 'Tous' || c.getAttribute('data-type') === label;
        c.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      updateSlideLabel();
      var track = document.querySelector('[data-track]');
      if (track) track.scrollTo({ left: 0, behavior: 'smooth' });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
    });
  }

  /* ---------- carrousel (defilement natif + auto-avance) ---------- */
  var paused = false;
  function cardStep(track) {
    var c = track.querySelector('[data-card]:not([style*="display: none"])');
    return c ? c.getBoundingClientRect().width + 22 : track.clientWidth;
  }
  function updateSlideLabel() {
    var track = document.querySelector('[data-track]');
    var label = document.querySelector('[data-slide-label]');
    var rail = document.querySelector('[data-rail]');
    if (!track) return;
    var visible = Array.from(track.querySelectorAll('[data-card]')).filter(function (c) { return c.style.display !== 'none'; });
    var step = cardStep(track);
    var idx = step ? Math.round(track.scrollLeft / step) : 0;
    idx = Math.max(0, Math.min(idx, visible.length - 1));
    if (label) label.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
    if (rail) {
      rail.style.width = (100 / Math.max(1, visible.length)) + '%';
      rail.style.transform = 'translateX(' + (idx * 100) + '%)';
    }
  }
  function setupCarousel() {
    var track = document.querySelector('[data-track]');
    var wrap = document.querySelector('[data-carousel]');
    if (!track) return;
    var sct;
    track.addEventListener('scroll', function () {
      clearTimeout(sct);
      sct = setTimeout(updateSlideLabel, 90);
    }, { passive: true });
    track.addEventListener('pointerdown', function () { paused = true; });
    if (wrap) {
      wrap.addEventListener('mouseenter', function () { paused = true; });
      wrap.addEventListener('mouseleave', function () { paused = false; });
    }
    var prevBtn = document.querySelector('[data-prev]');
    var nextBtn = document.querySelector('[data-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { paused = true; track.scrollBy({ left: -cardStep(track), behavior: 'smooth' }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { paused = true; track.scrollBy({ left: cardStep(track), behavior: 'smooth' }); });
    updateSlideLabel();

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInterval(function () {
      if (paused || document.hidden) return;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 6) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: cardStep(track), behavior: 'smooth' });
    }, 5200);
  }

  /* ---------- compteur de stats ---------- */
  function setupStatCount() {
    var stats = document.querySelector('[data-stats]');
    if (!stats) return;
    var nums = Array.from(stats.querySelectorAll('[data-stat-num]'));
    var targets = nums.map(function (n) { return parseInt(n.getAttribute('data-target'), 10); });
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var t0 = null, dur = 1400;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (n, i) { n.textContent = Math.round(targets[i] * eased); });
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(stats);
  }

  /* ---------- spotlight au curseur sur les cartes ---------- */
  function setupSpotlight() {
    document.addEventListener('pointermove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('[data-card]') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      var spot = card.querySelector('[data-spot]');
      if (spot) spot.style.opacity = '1';
    });
    document.addEventListener('pointerout', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('[data-card]') : null;
      if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
      var spot = card.querySelector('[data-spot]');
      if (spot) spot.style.opacity = '0';
    });
  }

  /* ---------- apparition au scroll ---------- */
  function setupReveal() {
    var els = Array.from(document.querySelectorAll('[data-reveal-io]'));
    if (!els.length) return;
    els.forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1), box-shadow .5s ease, border-color .5s ease';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = (els.indexOf(en.target) % 3) * 90 + 'ms';
        en.target.style.opacity = '1';
        en.target.style.transform = 'none';
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      els.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    }, 1600);
  }

  function boot() {
    setupFilters();
    setupCarousel();
    setupStatCount();
    setupSpotlight();
    setupReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
