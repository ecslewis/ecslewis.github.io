/* Animated I-V figure: the measured-vs-model output curves are drawn one gate
   voltage at a time, each sweeping left to right along V_DS, then the plot
   holds, clears and repeats.
   Usage: <canvas class="iv-anim"></canvas>
   Uses images/iv-base.png (axes, grid, labels) and images/iv-layers.png
   (one row per curve, each the size of the plot area, taken from the real figure). */
(function () {
  'use strict';

  var FIG_W = 800, FIG_H = 640;              // source figure size
  var PX = 167, PY = 33, PW = 591, PH = 485; // plot area inside the figure
  var K = 16;                                // number of curves in the sprite
  var DRAW = 0.55, STAGGER = 0.22, HOLD = 2.6, FADE = 0.6;   // seconds
  var CYCLE = STAGGER * (K - 1) + DRAW + HOLD + FADE;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var base = new Image(), layers = new Image(), loaded = 0;
  base.src = 'images/iv-base.png';
  layers.src = 'images/iv-layers.png';

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }

  function setup(cv) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, raf = null, t0 = performance.now();
    var s = 1, ox = 0, oy = 0;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s = Math.min(W / FIG_W, H / FIG_H);          // fit the whole figure, centred
      ox = (W - FIG_W * s) / 2; oy = (H - FIG_H * s) / 2;
    }

    function draw(now) {
      var t = reduce ? CYCLE - HOLD - FADE : ((now - t0) / 1000) % CYCLE;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(base, ox, oy, FIG_W * s, FIG_H * s);

      var fadeStart = CYCLE - FADE;
      var alpha = t > fadeStart ? 1 - (t - fadeStart) / FADE : 1;
      ctx.globalAlpha = alpha;
      for (var i = 0; i < K; i++) {
        var p = ease((t - i * STAGGER) / DRAW);
        if (p <= 0) break;
        var w = PW * p;
        ctx.drawImage(layers, 0, i * PH, w, PH, ox + PX * s, oy + PY * s, w * s, PH * s);
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    }

    function start() {
      size();
      if (reduce) { draw(0); return; }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          var vis = es[0].isIntersecting;
          if (vis && !raf) { t0 = performance.now(); raf = requestAnimationFrame(draw); }
          if (!vis && raf) { cancelAnimationFrame(raf); raf = null; }
        }).observe(cv);
      } else raf = requestAnimationFrame(draw);
      if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv);
    }
    return start;
  }

  function init() {
    var starts = [];
    document.querySelectorAll('canvas.iv-anim').forEach(function (cv) { starts.push(setup(cv)); });
    if (!starts.length) return;
    function ready() { if (++loaded === 2) starts.forEach(function (f) { f(); }); }
    [base, layers].forEach(function (img) { if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
