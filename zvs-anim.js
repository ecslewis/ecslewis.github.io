/* Animated AC-ZVS scope trace for the characterization platform card.
   Usage: <canvas class="zvs-anim"></canvas> inside .card-media.
   Top lanes: comparator polarity output and the complementary PWM pair,
   which swap every half cycle. Bottom: V_DS envelope (red), I_D (teal)
   and the AC line (yellow), all scrolling like a rolling acquisition. */
(function () {
  'use strict';

  var CYCLES = 2;       // line cycles across the screen
  var SPEED = 0.35;     // line cycles scrolled per second
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2;

  function setup(cv) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, t0 = performance.now(), raf = null;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function grid() {
      ctx.fillStyle = '#f7f8f6';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,0,0,0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 1; i < 10; i++) { var x = Math.round(W * i / 10) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (var j = 1; j < 8; j++) { var y = Math.round(H * j / 8) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }

    // phase at screen column x (0..W); the whole trace moves left over time
    function theta(x, ph) { return TAU * (CYCLES * x / W + ph); }
    function skew(th) { return Math.sin(th + 0.22 * Math.sin(th)); }

    function frame(now) {
      var ph = reduce ? 0.08 : ((now - t0) / 1000) * SPEED;
      var x, th;
      grid();

      /* ---------- digital lanes ---------- */
      var laneH = H * 0.075;
      var pwmY = H * 0.07, cmpY = H * 0.19;

      // complementary PWM pair: teal on one polarity, dark on the other, dead band at each zero crossing
      for (x = 0; x < W; x++) {
        th = theta(x, ph);
        var pos = Math.sin(th) < 0;                 // screen-up half of the AC line
        if (Math.abs(Math.sin(th)) < 0.06) continue;
        var half = ((th % Math.PI) + Math.PI) % Math.PI / Math.PI;   // 0..1 through this half cycle
        if ((half * 16) % 1 > 0.2 + 0.65 * Math.abs(Math.sin(th))) continue;   // duty follows the line
        ctx.fillStyle = pos ? '#48b3b8' : '#1b1f22';
        ctx.fillRect(x, pwmY, 1.02, laneH);
      }
      ctx.strokeStyle = 'rgba(40,120,125,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, pwmY + laneH + 0.5); ctx.lineTo(W, pwmY + laneH + 0.5); ctx.stroke();

      // comparator polarity output: square wave following the line polarity
      ctx.strokeStyle = '#d23a45';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var prev = null;
      for (x = 0; x <= W; x++) {
        th = theta(x, ph);
        var yq = Math.sin(th) < 0 ? cmpY : cmpY + laneH;
        if (prev === null) ctx.moveTo(x, yq);
        else if (yq !== prev) { ctx.lineTo(x, prev); ctx.lineTo(x, yq); }
        else ctx.lineTo(x, yq);
        prev = yq;
      }
      ctx.stroke();

      /* ---------- analog section ---------- */
      var cy = H * 0.64, A = H * 0.30;
      var top = [], bot = [];

      // I_D (teal): line-frequency sine plus switching ripple
      for (x = 0; x <= W; x++) {
        var s = skew(theta(x, ph)), a = Math.abs(s);
        top.push(cy - (-0.34 * s + 0.66 * a) * A);
        bot.push(cy - (-0.34 * s - 0.66 * a) * A);
      }
      ctx.fillStyle = 'rgba(64,190,196,0.85)';
      ctx.beginPath();
      ctx.moveTo(0, top[0]);
      for (x = 1; x <= W; x++) ctx.lineTo(x, top[x]);
      for (x = W; x >= 0; x--) ctx.lineTo(x, bot[x]);
      ctx.closePath(); ctx.fill();

      // outer edge highlight
      ctx.strokeStyle = 'rgba(190,220,80,0.95)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (x = 0; x <= W; x++) {
        var ye = Math.sin(theta(x, ph)) > 0 ? bot[x] : top[x];
        if (x === 0) ctx.moveTo(x, ye); else ctx.lineTo(x, ye);
      }
      ctx.stroke();

      // V_DS (red): symmetric switching envelope
      ctx.fillStyle = '#e23a34';
      ctx.beginPath();
      var r = [];
      for (x = 0; x <= W; x++) r.push(Math.pow(Math.abs(Math.sin(theta(x, ph))), 0.75) * 0.5 * A);
      ctx.moveTo(0, cy - r[0]);
      for (x = 1; x <= W; x++) ctx.lineTo(x, cy - r[x]);
      for (x = W; x >= 0; x--) ctx.lineTo(x, cy + r[x]);
      ctx.closePath(); ctx.fill();

      // AC line (yellow), drawn on top so the travelling sine is easy to follow
      ctx.strokeStyle = '#f2c230';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (x = 0; x <= W; x++) {
        var yl = cy + Math.sin(theta(x, ph)) * A * 0.78;
        if (x === 0) ctx.moveTo(x, yl); else ctx.lineTo(x, yl);
      }
      ctx.stroke();

      if (!reduce) raf = requestAnimationFrame(frame);
    }

    size();
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); if (reduce) frame(0); }).observe(cv);
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting;
        if (vis && !raf) raf = requestAnimationFrame(frame);
        if (!vis && raf) { cancelAnimationFrame(raf); raf = null; }
      }).observe(cv);
    } else if (!reduce) raf = requestAnimationFrame(frame);
    if (reduce) frame(0);
  }

  function init() { document.querySelectorAll('canvas.zvs-anim').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
