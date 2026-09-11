// <circuit-bg>: animated "tech circuit" section background, adapted from the
// KA SHOP block into the site's violet palette. Pure CSS animation (grid drift,
// SVG trace draw, pulsing nodes, rising particles, light sweep, floating halo).
// Drop as the FIRST child of a position:relative; isolation:isolate section;
// paints at z-index:-1 (above the section background, below content), never
// intercepts pointer events. Colour adapts to the section's luminance.
(function () {
  if (customElements.get('circuit-bg')) return;

  var KF =
      '@keyframes cb-grid{to{background-position:46px 46px}}' +
      '@keyframes cb-trace{0%{stroke-dashoffset:700}100%{stroke-dashoffset:0}}' +
      '@keyframes cb-pulse{0%{box-shadow:0 0 0 0 rgba(108,34,237,.25);opacity:.6}100%{box-shadow:0 0 0 20px rgba(108,34,237,0);opacity:.28}}' +
      '@keyframes cb-drift{0%{transform:translateY(30px);opacity:0}20%{opacity:.9}80%{opacity:.9}100%{transform:translateY(-70px);opacity:0}}' +
      '@keyframes cb-scan{0%{left:-45%}55%,100%{left:120%}}' +
      '@keyframes cb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}' +
      '@keyframes cb-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(12px)}}' +
      '@media (prefers-reduced-motion: reduce){*{animation:none !important}}';

  function luminance(el) {
    var node = el;
    while (node && node !== document.documentElement) {
      var c = getComputedStyle(node).backgroundColor;
      var m = c && c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        var p = m[1].split(',').map(function (v) { return parseFloat(v); });
        var a = p.length > 3 ? p[3] : 1;
        if (a > 0.2) return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]);
      }
      node = node.parentElement;
    }
    return 255;
  }

  var V = '#6C22ED', V2 = '#8A4DFF', VL = '#B98CFF';

  // per-theme motif: SVG paths (stroke-drawn) + node circle coords, over a 1180x520 viewBox
  function motif(name) {
    switch (name) {
      case 'flow': // Conseil / Méthode / Tarifs : ascending strategy streams
        return { anim: 'cb-trace 4s ease-out forwards', paths: [
          'M-20 470 C 220 430, 360 360, 620 320 S 980 230, 1210 150',
          'M-20 520 C 260 490, 420 420, 680 380 S 1000 300, 1210 230',
          'M-20 400 C 200 370, 340 300, 600 250 S 960 150, 1210 60'
        ], nodes: [[620,320],[680,380],[600,250],[360,360],[980,230],[960,150]] };
      case 'network': // À propos / Formation : human & knowledge constellation
        return { anim: 'cb-trace 4.4s ease-out forwards', paths: [
          'M120 90 L320 180 L480 120 L760 200 L900 120',
          'M320 180 L240 340 L560 300 L700 420 L980 320',
          'M480 120 L560 300 L760 200 L980 320 L1080 220'
        ], nodes: [[120,90],[320,180],[240,340],[480,120],[560,300],[760,200],[700,420],[900,120],[980,320],[1080,220]] };
      case 'wave': // Réalisations / Identité : creative flowing curves
        return { anim: 'cb-wave 6.5s ease-in-out infinite', paths: [
          'M-20 260 C 150 180, 330 340, 520 260 S 900 180, 1210 260',
          'M-20 330 C 160 250, 340 410, 540 330 S 920 250, 1210 330',
          'M-20 190 C 150 120, 330 270, 520 190 S 900 120, 1210 190'
        ], nodes: [[520,260],[540,330],[520,190],[900,180],[200,220]] };
      default: // circuit : IA / Digital / Mobile (tech traces)
        return { anim: 'cb-trace 3.6s ease-out forwards', paths: [
          'M760 40 L900 40 L940 90 L940 220 L1010 290',
          'M1180 120 L1010 120 L960 175 L820 175',
          'M700 490 L840 490 L880 430 L1050 430 L1120 500',
          'M0 90 L120 90 L170 140 L320 140',
          'M-10 300 L90 300 L140 250 L300 250 L360 320',
          'M60 520 L60 430 L130 360 L130 250',
          'M420 20 L420 110 L480 170 L620 170',
          'M590 500 L590 400 L520 340 L520 240'
        ], nodes: [[900,40],[940,220],[820,175],[1050,430],[120,90],[320,140],[90,300],[360,320],[420,110],[620,170],[520,240],[130,250]] };
    }
  }

  class CircuitBg extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      var dark = luminance(this.parentElement || this) < 128;
      var grid = dark ? 'rgba(255,255,255,.055)' : 'rgba(11,11,12,.05)';
      var node = dark ? VL : V2;
      var variant = this.getAttribute('variant');
      var m = motif(variant);
      var wave = m.anim.indexOf('cb-wave') === 0;
      var svgInner;
      if (variant === 'dots') {
        var cols = 16, rows = 7, dx = 1180 / (cols - 1), dy = 520 / (rows - 1), g = '';
        for (var c = 0; c < cols; c++) {
          var cx = Math.round(c * dx), inner = '';
          for (var r = 0; r < rows; r++) { inner += '<circle cx="' + cx + '" cy="' + Math.round(r * dy) + '" r="3.2"></circle>'; }
          g += '<g fill="' + node + '" fill-opacity=".62" style="animation:cb-wave 3.2s ease-in-out infinite; animation-delay:' + (c * 0.13).toFixed(2) + 's">' + inner + '</g>';
        }
        svgInner = g;
      } else {
        // traits retirés : seuls les points restent
        svgInner =
        '<g fill="' + node + '" fill-opacity=".75" style="animation:' + (wave ? m.anim : 'cb-wave 5.5s ease-in-out infinite') + '">' +
          m.nodes.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3"></circle>'; }).join('') +
        '</g>';
      }
      this.setAttribute('aria-hidden', 'true');
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + KF + ':host{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden;display:block;opacity:.4}</style>' +
        // radial violet glow
        '<div style="position:absolute;inset:0;background:radial-gradient(60% 90% at 82% 12%, rgba(108,34,237,.11), transparent 60%)"></div>' +
        '<div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:hidden">' +
          // drifting grid
          '<div style="position:absolute;inset:0;background-image:linear-gradient(' + grid + ' 1px,transparent 1px),linear-gradient(90deg,' + grid + ' 1px,transparent 1px);background-size:46px 46px;-webkit-mask-image:radial-gradient(150% 130% at 50% 40%,#000 62%,transparent 100%);mask-image:radial-gradient(150% 130% at 50% 40%,#000 62%,transparent 100%);animation:cb-grid 3.6s linear infinite"></div>' +
          // themed motif
          '<svg width="100%" height="100%" viewBox="0 0 1180 520" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;opacity:.26">' +
            svgInner +
          '</svg>' +
          // pulsing nodes
          '<span style="position:absolute;left:70%;top:26%;width:9px;height:9px;border-radius:50%;background:' + V + ';animation:cb-pulse 2s ease-out infinite"></span>' +
          '<span style="position:absolute;left:58%;top:64%;width:8px;height:8px;border-radius:50%;background:' + V + ';animation:cb-pulse 2.4s ease-out infinite .7s"></span>' +
          '<span style="position:absolute;left:88%;top:52%;width:7px;height:7px;border-radius:50%;background:' + node + ';opacity:.6;animation:cb-pulse 2.7s ease-out infinite 1.3s"></span>' +
          '<span style="position:absolute;left:11%;top:20%;width:8px;height:8px;border-radius:50%;background:' + V + ';animation:cb-pulse 2.2s ease-out infinite .4s"></span>' +
          '<span style="position:absolute;left:27%;top:56%;width:7px;height:7px;border-radius:50%;background:' + node + ';opacity:.6;animation:cb-pulse 2.5s ease-out infinite 1.1s"></span>' +
          '<span style="position:absolute;left:6%;top:74%;width:6px;height:6px;border-radius:50%;background:' + V + ';animation:cb-pulse 2.2s ease-out infinite 1.8s"></span>' +
          // rising particles
          '<span style="position:absolute;left:44%;top:78%;width:4px;height:4px;border-radius:50%;background:' + node + ';animation:cb-drift 4.4s linear infinite .2s"></span>' +
          '<span style="position:absolute;left:62%;top:82%;width:3px;height:3px;border-radius:50%;background:' + V + ';animation:cb-drift 5.5s linear infinite 1.4s"></span>' +
          '<span style="position:absolute;left:78%;top:80%;width:4px;height:4px;border-radius:50%;background:' + node + ';opacity:.75;animation:cb-drift 5s linear infinite 2.6s"></span>' +
          '<span style="position:absolute;left:92%;top:76%;width:3px;height:3px;border-radius:50%;background:' + V + ';animation:cb-drift 5.8s linear infinite .9s"></span>' +
          '<span style="position:absolute;left:15%;top:88%;width:4px;height:4px;border-radius:50%;background:' + node + ';opacity:.75;animation:cb-drift 5.3s linear infinite .6s"></span>' +
          '<span style="position:absolute;left:33%;top:84%;width:3px;height:3px;border-radius:50%;background:' + V + ';animation:cb-drift 6s linear infinite 2s"></span>' +
          '<span style="position:absolute;left:4%;top:46%;width:3px;height:3px;border-radius:50%;background:' + node + ';animation:cb-drift 4.7s linear infinite 3.1s"></span>' +
          // light sweep
          '<div style="position:absolute;top:0;bottom:0;left:-45%;width:55%;background:linear-gradient(90deg,transparent,rgba(108,34,237,.06),transparent);animation:cb-scan 6s ease-in-out infinite;animation-delay:1.5s"></div>' +
        '</div>' +
        // floating halo
        '<div style="position:absolute;right:-60px;top:-60px;width:280px;height:280px;border-radius:50%;background:' + V + ';opacity:.07;filter:blur(6px);animation:cb-float 5s ease-in-out infinite;pointer-events:none"></div>';
    }
  }

  customElements.define('circuit-bg', CircuitBg);
})();
