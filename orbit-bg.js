// <orbit-bg>: fond anime de la section Methode Alpha de l'accueil.
// Trois anneaux concentriques en rotation lente, cinq etapes posees sur
// l'anneau central qui s'allument dans l'ordre (Probleme, Strategie,
// Transformation, IA, Performance), une trainee lumineuse qui fait le tour
// au meme rythme. SVG + CSS uniquement. A placer en PREMIER enfant d'une
// section position:relative; isolation:isolate ; se peint en z-index:-1,
// n'intercepte jamais le pointeur. Couleurs adaptees a la luminance du fond.
(function () {
  if (customElements.get('orbit-bg')) return;

  var CYCLE = 5; // secondes pour un tour complet (1 s par etape)

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

  class OrbitBg extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      var dark = luminance(this.parentElement || this) < 128;
      var ring = dark ? 'rgba(185,140,255,.30)' : 'rgba(108,34,237,.22)';
      var ringSoft = dark ? 'rgba(185,140,255,.16)' : 'rgba(108,34,237,.12)';
      var node = dark ? '#B98CFF' : '#6C22ED';
      var glow = dark ? 'rgba(138,77,255,.55)' : 'rgba(108,34,237,.35)';

      // cinq etapes sur l'anneau central (r = 250), la premiere en haut
      var R = 250, C = 400, steps = '';
      for (var k = 0; k < 5; k++) {
        var ang = (-90 + k * 72) * Math.PI / 180;
        var x = (C + R * Math.cos(ang)).toFixed(1), y = (C + R * Math.sin(ang)).toFixed(1);
        steps +=
          '<g class="st" style="animation-delay:' + k + 's">' +
            '<circle cx="' + x + '" cy="' + y + '" r="22" fill="' + glow + '" class="halo"></circle>' +
            '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + node + '"></circle>' +
          '</g>';
      }
      var circ = (2 * Math.PI * R).toFixed(1);

      this.setAttribute('aria-hidden', 'true');
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' +
          ':host{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden;display:block}' +
          '.wrap{position:absolute;left:50%;top:58%;width:clamp(560px,92vw,1040px);aspect-ratio:1;transform:translate(-50%,-50%);opacity:.7}' +
          'svg{width:100%;height:100%;display:block;overflow:visible}' +
          '.rot{transform-box:view-box;transform-origin:400px 400px}' +
          '.r1{animation:ob-spin 70s linear infinite}' +
          '.r2{animation:ob-spin 48s linear infinite reverse}' +
          '.r3{animation:ob-spin 95s linear infinite}' +
          '.comet{animation:ob-spin ' + CYCLE + 's linear infinite}' +
          '.st{opacity:.35;animation:ob-step ' + CYCLE + 's ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
          '.st .halo{opacity:0;animation:ob-halo ' + CYCLE + 's ease-in-out infinite;animation-delay:inherit}' +
          '.core{animation:ob-breathe 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
          '@keyframes ob-spin{to{transform:rotate(360deg)}}' +
          '@keyframes ob-step{0%,30%,100%{opacity:.35}8%,18%{opacity:1}}' +
          '@keyframes ob-halo{0%,30%,100%{opacity:0;r:10px}10%{opacity:.9;r:26px}}' +
          '@keyframes ob-breathe{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}' +
          '@media (prefers-reduced-motion: reduce){*{animation:none !important}.st{opacity:.8}}' +
        '</style>' +
        '<div class="wrap">' +
          '<svg viewBox="0 0 800 800">' +
            '<defs>' +
              '<radialGradient id="ob-core"><stop offset="0" stop-color="' + glow + '"></stop><stop offset="1" stop-color="rgba(108,34,237,0)"></stop></radialGradient>' +
              '<linearGradient id="ob-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + node + '" stop-opacity="0"></stop><stop offset="1" stop-color="' + node + '" stop-opacity=".95"></stop></linearGradient>' +
            '</defs>' +
            // halo central
            '<circle class="core" cx="400" cy="400" r="190" fill="url(#ob-core)"></circle>' +
            // anneaux en pointilles, vitesses et sens differents
            '<g class="rot r1"><circle cx="400" cy="400" r="150" fill="none" stroke="' + ringSoft + '" stroke-width="1.5" stroke-dasharray="2 10"></circle></g>' +
            '<g class="rot r2"><circle cx="400" cy="400" r="250" fill="none" stroke="' + ring + '" stroke-width="1.5" stroke-dasharray="14 8"></circle></g>' +
            '<g class="rot r3"><circle cx="400" cy="400" r="350" fill="none" stroke="' + ringSoft + '" stroke-width="1" stroke-dasharray="1 14"></circle></g>' +
            // trainee lumineuse synchronisee sur les etapes : sa tete arrive sur
            // chaque etape au pic d'allumage (0,65 s apres le debut, soit 47 deg)
            '<g class="rot comet"><circle cx="400" cy="400" r="250" fill="none" stroke="' + node + '" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" ' +
              'stroke-dasharray="' + (circ * 0.12).toFixed(1) + ' ' + circ + '" transform="rotate(-180 400 400)"></circle></g>' +
            steps +
          '</svg>' +
        '</div>';
    }
  }

  customElements.define('orbit-bg', OrbitBg);
})();
