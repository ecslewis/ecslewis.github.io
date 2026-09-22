/* Home page motion. Native scrolling, no scroll hijacking: everything below is
   driven by the scroll position and eased toward it every frame. */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 901px)');

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if (el.closest('.h-hero')) return;            // hero plays on load, see below
    io.observe(el);
  });
  requestAnimationFrame(function () {
    document.querySelectorAll('.h-hero [data-reveal]').forEach(function (el) { el.classList.add('in'); });
  });

  /* ---------- model-viewer, loaded once and shared ---------- */
  var mvLoad = null;
  function viewer() {
    if (!mvLoad) mvLoad = customElements.get('model-viewer') ? Promise.resolve() : import('./model-viewer.min.js');
    return mvLoad;
  }
  function makeViewer(host, glb, orbit) {
    return viewer().then(function () {
      var mv = document.createElement('model-viewer');
      mv.setAttribute('src', glb);
      mv.setAttribute('camera-orbit', orbit);
      mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('environment-image', 'neutral');
      mv.setAttribute('exposure', '1.1');
      mv.setAttribute('shadow-intensity', '0.6');
      mv.setAttribute('interpolation-decay', '120');   // smooths the scroll-driven camera
      mv.setAttribute('disable-zoom', '');
      mv.style.pointerEvents = 'none';
      mv.addEventListener('load', function () { host.classList.add('ready'); });
      host.appendChild(mv);
      return mv;
    });
  }

  /* ---------- hero board ---------- */
  var hero = document.querySelector('.h-hero');
  var heroBoard = document.querySelector('.h-hero-board');
  var heroText = document.querySelector('.h-hero-text');
  var heroMV = null;
  window.addEventListener('load', function () {
    makeViewer(heroBoard, 'images/battery-pcb.glb', '-25deg 60deg 80%').then(function (mv) { heroMV = mv; });
  });

  /* ---------- work showcase ---------- */
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.h-chapter'));
  var slides = Array.prototype.slice.call(document.querySelectorAll('.h-slide'));
  var countEl = document.querySelector('.h-count');
  var barEl = document.querySelector('.h-bar i');
  var bode = document.querySelector('.h-slide-bode');
  var iv = document.querySelector('.h-slide-iv .iv');
  var work = document.querySelector('.h-work-body');
  var slideMV = {};
  var active = -1;

  // start loading the stage models shortly before the section arrives
  new IntersectionObserver(function (es, obs) {
    if (!es[0].isIntersecting || !desktop.matches) return;
    obs.disconnect();
    slides.forEach(function (s) {
      var glb = s.getAttribute('data-glb');
      if (!glb) return;
      var r = s.getAttribute('data-radius') || '90%';
      makeViewer(s, glb, '-25deg 60deg ' + r).then(function (mv) { slideMV[s.getAttribute('data-i')] = { mv: mv, r: r }; });
    });
  }, { rootMargin: '600px 0px' }).observe(work);

  function setActive(i) {
    if (i === active) return;
    active = i;
    slides.forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-i') === i); });
    chapters.forEach(function (c) { c.classList.toggle('on', +c.getAttribute('data-i') === i); });
    if (countEl) countEl.textContent = ('0' + (i + 1)).slice(-2);
  }
  setActive(0);

  /* ---------- per-frame update ---------- */
  var sy = window.scrollY, ty = sy;   // smoothed and target scroll
  var t0 = performance.now();

  function frame(now) {
    ty = window.scrollY;
    sy += (ty - sy) * (reduce ? 1 : 0.12);
    if (Math.abs(ty - sy) < 0.05) sy = ty;
    var vh = window.innerHeight;
    var secs = (now - t0) / 1000;

    // hero: board turns and drifts up as you leave, text lifts and fades
    var p = Math.min(1, Math.max(0, sy / vh));
    if (!reduce) {
      heroBoard.style.transform = 'translate3d(0,' + (-p * 18) + 'vh,0) scale(' + (1 - p * 0.12) + ')';
      heroBoard.style.opacity = String(1 - p * 0.9);
      heroText.style.transform = 'translate3d(0,' + (-p * 8) + 'vh,0)';
      heroText.style.opacity = String(1 - p * 1.1);
    }
    if (heroMV && p < 1) {
      var th = -25 + p * 140 + (reduce ? 0 : secs * 6);
      heroMV.cameraOrbit = th.toFixed(2) + 'deg ' + (60 - p * 22).toFixed(2) + 'deg 80%';
    }

    // showcase: the chapter crossing the middle of the screen owns the stage
    if (desktop.matches) {
      var mid = vh * 0.5, idx = active, q = 0;
      for (var i = 0; i < chapters.length; i++) {
        var r = chapters[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) { idx = i; q = (mid - r.top) / r.height; break; }
        if (i === 0 && r.top > mid) { idx = 0; q = 0; }
        if (i === chapters.length - 1 && r.bottom <= mid) { idx = i; q = 1; }
      }
      setActive(idx);
      if (barEl) barEl.style.width = (((idx + q) / chapters.length) * 100).toFixed(2) + '%';

      var s = slideMV[idx];
      if (s) s.mv.cameraOrbit = (-40 + q * 160 + secs * 4).toFixed(2) + 'deg ' + (62 - q * 14).toFixed(2) + 'deg ' + s.r;
      if (bode && idx === 3) bode.style.setProperty('--draw', String(Math.max(0, 1 - q * 1.6)));
      if (iv && idx === 4) {
        var sw = Math.min(1, Math.max(0, (q - 0.05) / 0.55));   // V_DS sweep across the plot
        iv.style.setProperty('--sweep', sw.toFixed(4));
        iv.style.setProperty('--done', sw >= 1 ? '1' : '0');
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
