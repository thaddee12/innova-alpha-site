/* hero-video-loop.js : garantit qu'une video hero en autoplay ne reste jamais
   figee sur pause (certains navigateurs mobiles interrompent l'autoplay). */
(function () {
  function sync() {
    document.querySelectorAll('video[data-hero-video]').forEach(function (v) {
      v.loop = true; v.muted = true; v.playsInline = true;
      if (!v.__loopGuard) {
        v.__loopGuard = true;
        var replay = function () {
          v.currentTime = 0;
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        };
        v.addEventListener('ended', replay);
        v.addEventListener('pause', function () {
          if (!document.hidden) setTimeout(function () { if (v.paused) replay(); }, 250);
        });
      }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  }
  function boot() { sync(); setTimeout(sync, 600); setInterval(sync, 5000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
