/* simulateur.js : simulateur de devis. Le visiteur coche des services (prix repris
   de la page Tarifs), precise son besoin, puis envoie la demande pre-remplie sur
   WhatsApp ou par e-mail. Aucune donnee n'est envoyee a un serveur.
   Preselection possible par l'URL : simulateur.html?services=alpha-speed,logo */
(function () {
  var EN = /^en/i.test(document.documentElement.lang || '');
  var LOCALE = EN ? 'en-US' : 'fr-FR';
  var WA = '237697212646';
  var MAILTO = 'contact@innovaalpha.com';
  var SEP = EN ? ': ' : ' : ';
  var FX = {
    XAF: { label: 'FCFA', rate: 1 },
    EUR: { label: '€', rate: 655.957 },
    USD: { label: '$', rate: 600 },
    GBP: { label: '£', rate: 780 },
    CAD: { label: 'C$', rate: 440 }
  };
  var T = EN ? {
    from: 'From ', month: ' / month', free: 'Free', quote: 'On quote', none: '—',
    quoteNote: function (n) { return n === 1 ? '1 service on quote, priced after a call.' : n + ' services on quote, priced after a call.'; },
    remove: 'Remove',
    errEmpty: 'Choose at least one service or describe your need.',
    errName: 'Please enter your name.',
    errContact: 'Please enter a phone number or an email so we can reply.',
    okWa: 'WhatsApp opens with your request prefilled. Just press Send.',
    okMail: 'Your email app opens with the request prefilled. If nothing happens, write to ' + MAILTO + '.',
    hello: 'Hello INNOVA ALPHA, here is my quote request from the simulator.',
    services: 'Selected services:', once: 'Project estimate', monthly: 'Monthly estimate',
    fxNote: 'Amounts converted for information only (invoicing in FCFA).',
    need: 'My need', delay: 'Desired timeline', name: 'Name', company: 'Company', phone: 'Phone', email: 'Email',
    subject: 'Quote request (simulator): '
  } : {
    from: 'Dès ', month: ' / mois', free: 'Gratuit', quote: 'Sur devis', none: '—',
    quoteNote: function (n) { return n === 1 ? '1 service sur devis, chiffré après échange.' : n + ' services sur devis, chiffrés après échange.'; },
    remove: 'Retirer',
    errEmpty: 'Choisissez au moins un service ou décrivez votre besoin.',
    errName: 'Indiquez votre nom.',
    errContact: 'Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre.',
    okWa: 'WhatsApp s’ouvre avec votre demande pré-remplie. Il reste à appuyer sur Envoyer.',
    okMail: 'Votre messagerie s’ouvre avec la demande pré-remplie. Si rien ne se passe, écrivez à ' + MAILTO + '.',
    hello: 'Bonjour INNOVA ALPHA, voici ma demande de devis faite avec le simulateur.',
    services: 'Services choisis :', once: 'Estimation projet', monthly: 'Estimation mensuelle',
    fxNote: 'Montants convertis à titre indicatif (facturation en FCFA).',
    need: 'Mon besoin', delay: 'Délai souhaité', name: 'Nom', company: 'Entreprise', phone: 'Téléphone', email: 'E-mail',
    subject: 'Demande de devis (simulateur) : '
  };

  /* ---------- montants (memes regles que tarifs.js) ---------- */
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
    return 'XAF';
  }

  function readItem(input) {
    var card = input.closest('[data-sim-card]');
    var xaf = input.getAttribute('data-xaf');
    var max = input.getAttribute('data-xaf-max');
    return {
      input: input,
      card: card,
      name: card.querySelector('[data-sim-name]').textContent.trim(),
      min: xaf === '' ? null : parseFloat(xaf),
      max: max ? parseFloat(max) : null,
      sub: input.getAttribute('data-kind') === 'sub',
      from: input.getAttribute('data-from') === '1',
      plus: input.getAttribute('data-plus') === '1'
    };
  }

  function priceOf(it, cur) {
    if (it.min === null) return T.quote;
    if (it.sub) return (it.from ? T.from : '') + amount(it.min, true, cur) + (it.plus ? '+' : '') + T.month;
    if (it.min === 0) return T.free;
    if (it.max) return amount(it.min, false, cur) + ' – ' + amount(it.max, true, cur);
    return (it.from ? T.from : '') + amount(it.min, true, cur) + (it.plus ? '+' : '');
  }

  // Projet : somme des prix ponctuels (fourchette, ou "des" si un prix est un plancher).
  // Mensuel : somme des abonnements. Les offres sans prix sont comptees a part.
  function totals(list, cur) {
    var o = { min: 0, max: 0, open: false, n: 0 }, s = { min: 0, open: false, n: 0 }, q = 0;
    list.forEach(function (it) {
      if (it.min === null) { q++; return; }
      if (it.sub) { s.min += it.min; s.open = s.open || it.from || it.plus; s.n++; return; }
      o.min += it.min; o.max += it.max || it.min; o.open = o.open || it.from || it.plus; o.n++;
    });
    var once = T.none;
    if (o.n) {
      if (o.max === 0) once = T.free;
      else if (o.open) once = T.from + amount(o.min, true, cur);
      else if (o.max > o.min) once = amount(o.min, false, cur) + ' – ' + amount(o.max, true, cur);
      else once = amount(o.min, true, cur);
    }
    var monthly = s.n ? (s.open ? T.from : '') + amount(s.min, true, cur) + T.month : T.none;
    return { once: once, monthly: monthly, quotes: q, hasOnce: o.n > 0, hasMonthly: s.n > 0 };
  }

  var form, inputs, listEl, emptyEl, onceEl, monthlyEl, quoteEl, statusEl, curSel, bar, barTotal, summary;
  var cur = 'XAF';
  var mobile = window.matchMedia('(max-width: 980px)');

  function selected() {
    return inputs.filter(function (i) { return i.checked; }).map(readItem);
  }

  function syncBar() {
    if (!bar) return;
    var n = inputs.filter(function (i) { return i.checked; }).length;
    var show = mobile.matches && n > 0 && summary.getBoundingClientRect().top > window.innerHeight - 40;
    bar.toggleAttribute('data-show', show);
  }

  function render() {
    inputs.forEach(function (i) {
      var it = readItem(i);
      it.card.toggleAttribute('data-on', i.checked);
      var p = it.card.querySelector('[data-sim-price]');
      if (p) p.textContent = priceOf(it, cur);
    });
    var sel = selected();
    listEl.innerHTML = '';
    sel.forEach(function (it) {
      var li = document.createElement('li');
      var n = document.createElement('span');
      n.className = 'sim-li-name';
      n.textContent = it.name;
      var pr = document.createElement('span');
      pr.className = 'sim-li-price';
      pr.textContent = priceOf(it, cur);
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'sim-li-rm';
      rm.setAttribute('aria-label', T.remove + ' ' + it.name);
      rm.textContent = '×';
      rm.addEventListener('click', function () { it.input.checked = false; render(); });
      li.appendChild(n); li.appendChild(pr); li.appendChild(rm);
      listEl.appendChild(li);
    });
    emptyEl.hidden = sel.length > 0;
    var t = totals(sel, cur);
    onceEl.textContent = t.once;
    monthlyEl.textContent = t.monthly;
    quoteEl.hidden = !t.quotes;
    quoteEl.textContent = t.quotes ? T.quoteNote(t.quotes) : '';
    if (barTotal) barTotal.textContent = t.hasOnce ? t.once : (t.hasMonthly ? t.monthly : T.quote);
    syncBar();
    return { sel: sel, t: t };
  }

  function field(name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.setAttribute('data-kind', kind);
  }

  function buildMessage() {
    var r = render(), sel = r.sel, t = r.t;
    var need = field('need');
    if (!sel.length && !need) { setStatus(T.errEmpty, 'err'); inputs[0].focus(); return null; }
    if (!field('name')) { setStatus(T.errName, 'err'); form.elements.name.focus(); return null; }
    if (!field('phone') && !field('email')) { setStatus(T.errContact, 'err'); form.elements.phone.focus(); return null; }

    var lines = [T.hello, ''];
    if (sel.length) {
      lines.push(T.services);
      sel.forEach(function (it) { lines.push('- ' + it.name + SEP + priceOf(it, cur)); });
      lines.push('');
      if (t.hasOnce) lines.push(T.once + SEP + t.once);
      if (t.hasMonthly) lines.push(T.monthly + SEP + t.monthly);
      if (t.quotes) lines.push(T.quoteNote(t.quotes));
      if (cur !== 'XAF') lines.push(T.fxNote);
      lines.push('');
    }
    var delay = form.elements.delay;
    if (need) lines.push(T.need + SEP + need);
    if (delay && delay.value) lines.push(T.delay + SEP + delay.options[delay.selectedIndex].text);
    if (need || (delay && delay.value)) lines.push('');
    lines.push(T.name + SEP + field('name'));
    if (field('company')) lines.push(T.company + SEP + field('company'));
    if (field('phone')) lines.push(T.phone + SEP + field('phone'));
    if (field('email')) lines.push(T.email + SEP + field('email'));
    return lines.join('\n');
  }

  function send(channel) {
    var msg = buildMessage();
    if (!msg) return;
    var url;
    if (channel === 'whatsapp') {
      url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      window.INNOVA_SIM_LAST = url;
      var w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (e) {} } else { window.location.href = url; }
      setStatus(T.okWa, 'ok');
    } else {
      url = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent(T.subject + field('name')) + '&body=' + encodeURIComponent(msg);
      window.INNOVA_SIM_LAST = url;
      window.location.href = url;
      setStatus(T.okMail, 'ok');
    }
  }

  function boot() {
    form = document.querySelector('[data-sim-form]');
    if (!form) return;
    inputs = Array.prototype.slice.call(form.querySelectorAll('input[data-sim-svc]'));
    listEl = form.querySelector('[data-sim-list]');
    emptyEl = form.querySelector('[data-sim-empty]');
    onceEl = form.querySelector('[data-sim-once]');
    monthlyEl = form.querySelector('[data-sim-monthly]');
    quoteEl = form.querySelector('[data-sim-quote]');
    statusEl = form.querySelector('[data-sim-status]');
    curSel = form.querySelector('[data-sim-currency]');
    summary = document.getElementById('sim-summary');
    bar = document.querySelector('[data-sim-bar]');
    barTotal = bar && bar.querySelector('[data-sim-bar-total]');

    cur = detectCurrency();
    if (curSel) {
      curSel.value = cur;
      curSel.addEventListener('change', function () {
        cur = FX[curSel.value] ? curSel.value : 'XAF';
        try { localStorage.setItem('ia-currency', cur); } catch (e) {}
        render();
      });
    }

    var wanted = (location.search.match(/[?&]services=([^&]+)/) || [])[1];
    if (wanted) {
      decodeURIComponent(wanted).split(',').forEach(function (id) {
        inputs.forEach(function (i) { if (i.value === id.trim()) i.checked = true; });
      });
    }

    form.addEventListener('change', function (e) {
      if (e.target.matches && e.target.matches('input[data-sim-svc]')) render();
    });
    // un message d'erreur disparait des que le visiteur corrige sa saisie
    form.addEventListener('input', function () {
      if (statusEl.getAttribute('data-kind') === 'err') setStatus('', '');
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.querySelectorAll('[data-sim-send]').forEach(function (b) {
      b.addEventListener('click', function () { send(b.getAttribute('data-sim-send')); });
    });
    window.addEventListener('scroll', syncBar, { passive: true });
    window.addEventListener('resize', syncBar);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
