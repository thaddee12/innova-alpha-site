// Animated client-logo carousel. Columns each cycle through the full logo
// list, staggered, with a blur + spring-ish slide transition on each swap.
// Adapted (framer-motion-free) from the pasted LogoCarousel concept.
// Usage: <logo-carousel columns="3" data-logos="src|alt,src|alt,..."></logo-carousel>
(function () {
  if (customElements.get('logo-carousel')) return;

  var CYCLE = 2200;      // ms each logo is shown
  var COL_DELAY = 260;   // ms stagger between columns
  var OUT = 300;         // ms exit animation

  function parseLogos(str) {
    if (!str) return [];
    return str.split(',').map(function (p) {
      var bits = p.split('|');
      return { src: (bits[0] || '').trim(), alt: (bits[1] || '').trim(), scale: parseFloat(bits[2]) || 1 };
    }).filter(function (l) { return l.src; });
  }

  function makeImg(logo) {
    var img = document.createElement('img');
    if (!logo) return img;
    img.src = logo.src;
    img.alt = logo.alt || '';
    var h = Math.min(98, Math.round(50 * (logo.scale || 1)));
    img.style.cssText = 'position:absolute; inset:0; margin:auto; max-width:98%; height:' + h + 'px; width:auto; object-fit:contain; will-change:transform,opacity,filter';
    return img;
  }

  class LogoCarousel extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;

      var logos = parseLogos(this.getAttribute('data-logos'));
      var cols = parseInt(this.getAttribute('columns') || '3', 10);
      if (!logos.length) return;
      cols = Math.max(1, Math.min(cols, logos.length));

      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.innerHTML = '';
      this.style.cssText = 'display:flex; gap:clamp(16px,4vw,44px); align-items:center; justify-content:center; flex-wrap:wrap';

      this._cols = [];
      for (var c = 0; c < cols; c++) {
        var stage = document.createElement('div');
        stage.style.cssText = 'position:relative; height:104px; width:clamp(120px,22vw,190px); overflow:hidden';
        this.appendChild(stage);
        // each column cycles the full list, offset so columns differ
        var order = logos.slice(c).concat(logos.slice(0, c));
        var startImg = makeImg(order[0]);
        startImg.style.opacity = '1';
        stage.appendChild(startImg);
        this._cols.push({ stage: stage, order: order, idx: 0, cur: startImg });
      }

      if (reduced) return;

      var self = this;
      var start = performance.now();
      function tick(now) {
        var t = now - start;
        for (var i = 0; i < self._cols.length; i++) {
          var col = self._cols[i];
          var adj = t + i * COL_DELAY;
          var wanted = Math.floor(adj / CYCLE) % col.order.length;
          if (wanted !== col.idx && col.order[wanted]) {
            col.idx = wanted;
            self._swap(col, col.order[wanted]);
          }
        }
        self._raf = requestAnimationFrame(tick);
      }
      this._raf = requestAnimationFrame(tick);
    }

    _swap(col, logo) {
      var old = col.cur;
      // exit
      old.style.transition = 'transform ' + OUT + 'ms ease-in, opacity ' + OUT + 'ms ease-in, filter ' + OUT + 'ms ease-in';
      old.style.transform = 'translateY(-22%)';
      old.style.opacity = '0';
      old.style.filter = 'blur(6px)';
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, OUT + 40);
      // enter
      var next = makeImg(logo);
      next.style.transform = 'translateY(12%)';
      next.style.opacity = '0';
      next.style.filter = 'blur(8px)';
      col.stage.appendChild(next);
      // force reflow then animate in with a springy easing
      next.getBoundingClientRect();
      next.style.transition = 'transform 520ms cubic-bezier(0.34,1.56,0.64,1), opacity 460ms ease-out, filter 460ms ease-out';
      next.style.transform = 'translateY(0)';
      next.style.opacity = '1';
      next.style.filter = 'blur(0px)';
      col.cur = next;
    }

    disconnectedCallback() {
      if (this._raf) cancelAnimationFrame(this._raf);
    }
  }

  customElements.define('logo-carousel', LogoCarousel);
})();
