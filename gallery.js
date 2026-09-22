/* In-page photo gallery: click a photo in .gallery to view it full size.
   Arrow keys / buttons step through, Esc or a click outside closes. */
(function () {
  'use strict';
  var galleries = document.querySelectorAll('.gallery');
  if (!galleries.length) return;

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML =
    '<button class="lb-close" aria-label="Close">&times;</button>' +
    '<button class="lb-prev" aria-label="Previous">&#8249;</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lb-next" aria-label="Next">&#8250;</button>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), cap = box.querySelector('figcaption');
  var items = [], idx = 0, lastFocus = null;

  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx];
    img.src = it.getAttribute('data-full') || it.src;
    img.alt = it.alt;
    var fc = it.closest('figure') && it.closest('figure').querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : '';
  }
  function open(list, i) {
    items = list; lastFocus = document.activeElement;
    show(i); box.classList.add('open'); document.body.style.overflow = 'hidden';
    box.querySelector('.lb-close').focus();
  }
  function close() {
    box.classList.remove('open'); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  galleries.forEach(function (g) {
    var list = Array.prototype.slice.call(g.querySelectorAll('img'));
    list.forEach(function (im, i) {
      im.tabIndex = 0;
      im.addEventListener('click', function () { open(list, i); });
      im.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(list, i); });
    });
  });

  box.addEventListener('click', function (e) {
    if (e.target.closest('.lb-prev')) show(idx - 1);
    else if (e.target.closest('.lb-next')) show(idx + 1);
    else if (e.target.closest('.lb-close') || e.target === box) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
