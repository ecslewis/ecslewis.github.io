/* Controls for <model-viewer> figures inside .view3d.
   Plain scroll still scrolls the page; ctrl/cmd + scroll (and trackpad pinch) zooms.
   Buttons: zoom out, zoom in, reset. */
(function () {
  'use strict';

  function setup(wrap) {
    var mv = wrap.querySelector('model-viewer');
    if (!mv) return;
    var home = mv.getAttribute('camera-orbit') || 'auto auto auto';

    // Stop plain wheel events before model-viewer sees them, so the page scrolls.
    // Trackpad pinch arrives as ctrl+wheel, so pinch-to-zoom still works.
    mv.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) e.stopImmediatePropagation();
    }, { capture: true });

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-view]');
      if (!btn) return;
      var mode = btn.getAttribute('data-view');
      if (mode === 'reset') {
        mv.cameraOrbit = home;
        mv.cameraTarget = 'auto auto auto';
        mv.fieldOfView = 'auto';
        mv.jumpCameraToGoal();
        return;
      }
      // model-viewer zooms by narrowing field of view and dollying together
      mv.zoom(mode === 'in' ? 6 : -6);
    });
  }

  function init() { document.querySelectorAll('.view3d').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
