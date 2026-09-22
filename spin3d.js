/* Card thumbnails: an <img data-glb="model.glb"> inside .card-media is replaced by a
   slowly spinning 3D model once the card scrolls into view. The image stays as the
   fallback and loading placeholder. Display only, no camera controls. */
(function () {
  'use strict';
  var imgs = document.querySelectorAll('.card-media img[data-glb]');
  if (!imgs.length) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var loader = null;
  function loadViewer() {
    if (!loader) loader = customElements.get('model-viewer') ? Promise.resolve() : import('./model-viewer.min.js');
    return loader;
  }

  function mount(img) {
    loadViewer().then(function () {
      var media = img.parentNode;
      var mv = document.createElement('model-viewer');
      mv.setAttribute('src', img.getAttribute('data-glb'));
      mv.setAttribute('camera-orbit', img.getAttribute('data-orbit') || '-25deg 58deg 68%');
      mv.setAttribute('auto-rotate', '');
      mv.setAttribute('auto-rotate-delay', '0');
      mv.setAttribute('rotation-per-second', '25deg');
      mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('environment-image', 'neutral');
      mv.setAttribute('exposure', '1.1');
      mv.setAttribute('shadow-intensity', '0.6');
      mv.setAttribute('alt', img.alt);
      mv.addEventListener('load', function () { media.classList.add('spin-ready'); });
      media.classList.add('spin3d');
      media.appendChild(mv);
    });
  }

  if (!('IntersectionObserver' in window)) { imgs.forEach(mount); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); }
    });
  }, { rootMargin: '200px' });
  imgs.forEach(function (img) { io.observe(img); });
})();
