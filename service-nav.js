/* Nav "Services" : sur une page service, la pastille reste ouverte et déploie
   un panneau vitré pour basculer vers un autre service. */
(function () {
  if (window.__serviceNav) return;                 // le runtime peut évaluer ce script deux fois
  window.__serviceNav = true;

  // Titres canoniques : identiques au tableau `services` de INNOVA ALPHA.dc.html
  var SERVICES = [
    { num: '01', file: 'conseil.html',   label: 'Conseil & Transformation', from: '#A855F7', to: '#5A18CF' },
    { num: '02', file: 'digital.html',   label: 'Digital & Web',            from: '#8A4DFF', to: '#6C22ED' },
    { num: '03', file: 'ia.html',        label: 'IA & Automatisation',      from: '#7C3BFF', to: '#3C1482' },
    { num: '04', file: 'graphisme.html', label: 'Identité & Marketing',     from: '#8A4DFF', to: '#5A18CF' },
    { num: '05', file: 'mobile.html',    label: 'Applications Mobiles',     from: '#B98CFF', to: '#6C22ED' },
    { num: '06', file: 'formation.html', label: 'Formation IA',             from: '#6C22ED', to: '#B98CFF' }
  ];

  function currentFile() {
    var p = decodeURIComponent(location.pathname).split('/').pop() || '';
    var slug = p.replace(/\.dc\.html$/i, '').toLowerCase();
    var byFile = SERVICES.filter(function (s) {
      return s.file.replace(/\.dc\.html$/i, '').toLowerCase() === slug;
    })[0];
    return byFile || null;
  }

  function buildPanel(active) {
    var panel = document.createElement('div');
    panel.setAttribute('data-service-panel', '');
    panel.style.cssText = [
      'position:absolute', 'top:calc(100% + 14px)', 'left:0',
      'display:grid', 'grid-template-columns:repeat(2, minmax(252px, 1fr))', 'gap:8px',
      'padding:12px', 'border-radius:26px',
      'background:var(--navBg)', 'backdrop-filter:blur(24px) saturate(180%)',
      '-webkit-backdrop-filter:blur(24px) saturate(180%)',
      'border:1px solid var(--lineA)', 'box-shadow:var(--navShadow)',
      'z-index:5', 'transform-origin:top left',
      'transition:opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)'
    ].join(';');

    SERVICES.forEach(function (s) {
      var isActive = active && s.file === active.file;
      var card = document.createElement('a');
      card.href = s.file;
      card.style.cssText = [
        'position:relative', 'display:flex', 'align-items:center', 'gap:12px',
        'padding:14px 16px', 'border-radius:22px', 'text-decoration:none',
        'color:var(--txA)', 'overflow:hidden',
        'background:' + (isActive ? 'linear-gradient(135deg,' + s.from + ',' + s.to + ')' : 'var(--glassBg)'),
        'border:1px solid ' + (isActive ? 'transparent' : 'var(--lineA)'),
        'transition:background .3s ease, transform .3s cubic-bezier(.22,1,.36,1), border-color .3s ease'
      ].join(';');
      if (isActive) {
        card.style.color = '#FFFFFF';
        card.setAttribute('aria-current', 'page');
      }
      card.addEventListener('mouseenter', function () {
        card.style.transform = 'translateY(-2px)';
        if (!isActive) card.style.background = 'var(--hov)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'none';
        if (!isActive) card.style.background = 'var(--glassBg)';
      });

      var dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      dot.textContent = s.num;
      dot.style.cssText = 'flex:none;min-width:20px;font-size:10px;font-weight:900;letter-spacing:0.14em;color:' +
        (isActive ? 'rgba(255,255,255,0.92)' : '#6C22ED');

      var txt = document.createElement('span');
      txt.textContent = s.label;
      txt.style.cssText = 'font-size:12.5px;font-weight:700;letter-spacing:0.04em;white-space:nowrap;flex:1 0 auto;min-width:max-content';

      card.appendChild(dot); card.appendChild(txt);
      panel.appendChild(card);
    });
    return panel;
  }

  function setOpen(pill, panel, open) {
    if (open) {
      pill.setAttribute('data-gnav-open', '');
      panel.style.display = 'grid';
      requestAnimationFrame(function () {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0) scale(1)';
      });
    } else {
      pill.removeAttribute('data-gnav-open');
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-8px) scale(.98)';
      setTimeout(function () { if (panel.style.opacity === '0') panel.style.display = 'none'; }, 320);
    }
  }

  var panel = null, open = false, closeTimer = null;
  var desktop = window.matchMedia('(min-width:1121px)');

  function nav() { return document.querySelector('nav[data-glass]'); }
  function pill() {
    var n = nav();
    return n ? n.querySelector('[data-gnav][aria-label="Services"]') : null;
  }

  function place() {
    var p = pill(), n = nav();
    if (!p || !n || !panel) return;
    var pr = p.getBoundingClientRect(), nr = n.getBoundingClientRect();
    panel.style.left = Math.round(pr.left - nr.left) + 'px';
  }

  // Le runtime peut re-rendre la nav : on ré-attache le panneau si besoin.
  function ensure() {
    var n = nav(), p = pill();
    if (!n || !p) return null;
    if (!panel) {
      var existing = n.querySelectorAll('[data-service-panel]');
      for (var i = 1; i < existing.length; i++) existing[i].remove();
      panel = existing[0] || buildPanel(currentFile());
      if (!panel.__wired) {
        panel.__wired = true;
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-8px) scale(.98)';
        panel.style.display = 'none';
        panel.addEventListener('mouseenter', show);
        panel.addEventListener('mouseleave', hideSoon);
      }
    }
    if (panel.parentNode !== n) n.appendChild(panel);
    if (open) p.setAttribute('data-gnav-open', '');
    place();
    return p;
  }

  function show() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    var p = ensure();
    if (!p || !desktop.matches || open) return;
    open = true;
    setOpen(p, panel, true);
  }
  function hideSoon() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      closeTimer = null;
      if (!open) return;
      open = false;
      var p = pill();
      if (p && panel) setOpen(p, panel, false);
    }, 220);
  }
  function hideNow() {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    if (!open) return;
    open = false;
    var p = pill();
    if (p && panel) setOpen(p, panel, false);
  }

  function inPill(t) { var p = pill(); return !!(p && t && p.contains(t)); }
  function inPanel(t) { return !!(panel && t && panel.contains(t)); }

  // Délégation : survit à tout re-render de la nav.
  document.addEventListener('mouseover', function (e) {
    if (inPill(e.target)) { place(); show(); }
    else if (inPanel(e.target)) show();
  }, true);
  document.addEventListener('mouseout', function (e) {
    if (!open) return;
    var to = e.relatedTarget;
    if (inPill(e.target) || inPanel(e.target)) {
      if (!inPill(to) && !inPanel(to)) hideSoon();
    }
  }, true);
  document.addEventListener('focusin', function (e) { if (inPill(e.target)) show(); });
  document.addEventListener('click', function (e) {
    if (inPill(e.target)) {
      e.preventDefault();
      if (open) hideNow(); else show();
      return;
    }
    if (!open || inPanel(e.target)) return;
    hideNow();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideNow(); });
  window.addEventListener('resize', function () {
    if (!desktop.matches) hideNow();
    place();
  });

  function boot() {
    var tries = 0;
    var id = setInterval(function () {
      var p = ensure();
      if (p) {
        clearInterval(id);
        // sur une page service : ouvert par défaut (desktop)
        if (currentFile() && desktop.matches) show();
      } else if (++tries > 200) clearInterval(id);
    }, 60);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
