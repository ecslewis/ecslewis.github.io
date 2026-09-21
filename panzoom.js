/* Interactive pan/zoom for large figures (schematics, layouts).
   Markup:
     <div class="zoomview"><div class="zoomctl">...</div><img src="..."></div>
   Plain scroll still scrolls the page. Ctrl/Cmd + scroll zooms. */
(function () {
  'use strict';

  function setup(view) {
    var img = view.querySelector('img');
    if (!img) return;

    var scale = 1, tx = 0, ty = 0, fit = 1, maxH = null;
    var MAX = 20;
    var pointers = new Map();
    var pinchDist = 0, pinchMid = null;

    function apply() {
      img.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';
    }

    function clamp() {
      var w = view.clientWidth, h = view.clientHeight;
      var iw = img.offsetWidth * scale, ih = img.offsetHeight * scale;
      tx = iw <= w ? (w - iw) / 2 : Math.min(0, Math.max(w - iw, tx));
      ty = ih <= h ? (h - ih) / 2 : Math.min(0, Math.max(h - ih, ty));
    }

    function reset() {
      if (maxH === null) maxH = view.clientHeight;   // the CSS cap, captured once
      var ih = img.offsetHeight;                      // height at width:100%, scale 1
      // short/wide figures shrink the frame instead of floating in dead space
      view.style.height = (ih ? Math.min(maxH, ih) : maxH) + 'px';
      fit = ih ? Math.min(1, view.clientHeight / ih) : 1;
      scale = fit;
      tx = 0; ty = 0;
      clamp(); apply();
    }

    function zoomAt(cx, cy, factor) {
      var ns = Math.max(fit, Math.min(MAX, scale * factor));
      if (Math.abs(ns - scale) < 1e-6) return;
      tx = cx - (cx - tx) * (ns / scale);
      ty = cy - (cy - ty) * (ns / scale);
      scale = ns;
      clamp(); apply();
    }

    function local(e) {
      var r = view.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    view.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;   // plain scroll = page scroll
      e.preventDefault();
      var p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.002));
    }, { passive: false });

    view.addEventListener('dblclick', function (e) {
      e.preventDefault();
      var p = local(e);
      zoomAt(p.x, p.y, 1.8);
    });

    view.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.zoomctl')) return;
      view.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      view.classList.add('dragging');
      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        pinchMid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      }
    });

    view.addEventListener('pointermove', function (e) {
      if (!pointers.has(e.pointerId)) return;
      var prev = pointers.get(e.pointerId);
      var cur = local(e);
      pointers.set(e.pointerId, cur);

      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (pinchDist > 0 && d > 0) zoomAt(pinchMid.x, pinchMid.y, d / pinchDist);
        pinchDist = d;
        pinchMid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
        return;
      }
      tx += cur.x - prev.x;
      ty += cur.y - prev.y;
      clamp(); apply();
    });

    function release(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) view.classList.remove('dragging');
    }
    view.addEventListener('pointerup', release);
    view.addEventListener('pointercancel', release);

    view.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-zoom]');
      if (!btn) return;
      var mode = btn.getAttribute('data-zoom');
      if (mode === 'reset') { reset(); return; }
      zoomAt(view.clientWidth / 2, view.clientHeight / 2, mode === 'in' ? 1.5 : 1 / 1.5);
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reset, 120);
    });

    if (img.complete && img.offsetHeight) reset();
    else img.addEventListener('load', reset);
    // SVGs occasionally report zero height on the first tick
    setTimeout(function () { if (!img.offsetHeight) return; if (scale === 1 && tx === 0 && ty === 0) reset(); }, 60);
  }

  function init() {
    document.querySelectorAll('.zoomview').forEach(setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
