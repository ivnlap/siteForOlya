/* =============================================================================
   V1 «Reel» — gallery mechanics + the single call to action.
   No dependencies, no build step. Drop-in identical across the three variants.
   ============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     TODO — ЗАМЕНИТЬ ПЕРЕД ПУБЛИКАЦИЕЙ. Это два единственных места с заглушками.

     1) WHATSAPP_URL — номер в международном формате, без «+» и пробелов.
        Пример: 'https://wa.me/79991234567?text=' + encodeURIComponent(GREETING)
     2) VIDEOS — прямые ссылки на пять роликов. Сейчас все пять ведут на канал,
        потому что прямых ссылок на ролики ещё нет.
     --------------------------------------------------------------------------- */
  var GREETING = "Hi! I'd like to discuss an animated video for our brand.";
  var WHATSAPP_URL = '';                                   // ← TODO: вписать сюда
  var CHANNEL_URL = 'https://www.youtube.com/@KikiToony';   // временная цель карточек
  var VIDEOS = [
    CHANNEL_URL, // TODO: Who's in the Garden?
    CHANNEL_URL, // TODO: Summer Fruits Song
    CHANNEL_URL, // TODO: My First Colours Song
    CHANNEL_URL, // TODO: Four Seasons Song
    CHANNEL_URL  // TODO: Dog vs Cat and The Flying Snack
  ];

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. the only button ------------------------------------------------ */
  var cta = document.getElementById('cta');
  if (cta && WHATSAPP_URL) {
    cta.href = WHATSAPP_URL.indexOf('?') > -1
      ? WHATSAPP_URL
      : WHATSAPP_URL + '?text=' + encodeURIComponent(GREETING);
  }

  /* ---- 2. gallery -------------------------------------------------------- */
  var reel = document.getElementById('reel');
  if (!reel) return;

  var originals = Array.prototype.slice.call(reel.children);
  originals.forEach(function (item, i) {
    var link = item.querySelector('.card');
    if (link && VIDEOS[i]) link.href = VIDEOS[i];
  });

  /* Seamless marquee needs a second copy of the strip. The clones are
     decorative: hidden from assistive tech and skipped by the keyboard. */
  var cloned = false;
  function buildClones() {
    if (cloned || reduceMotion) return;
    originals.forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      var a = copy.querySelector('a');
      if (a) { a.tabIndex = -1; a.removeAttribute('id'); }
      var img = copy.querySelector('img');
      if (img) { img.alt = ''; img.removeAttribute('fetchpriority'); img.loading = 'lazy'; }
      reel.appendChild(copy);
    });
    cloned = true;
  }

  function loopWidth() {
    return cloned ? reel.scrollWidth / 2 : 0;
  }

  function wrap() {
    var half = loopWidth();
    if (!half) return;
    if (reel.scrollLeft >= half) reel.scrollLeft -= half;
    else if (reel.scrollLeft < 0) reel.scrollLeft += half;
  }

  /* ---- 2a. parabolic arc: the strip sags towards both edges --------------- */
  var arcTicking = false;
  function paintArc() {
    arcTicking = false;
    var vw = reel.clientWidth;
    if (!vw) return;
    var mid = vw / 2;
    var depth = vw < 640 ? 8 : 20;
    var items = reel.children;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var box = el.getBoundingClientRect();
      var reelBox = reel.getBoundingClientRect();
      var t = (box.left + box.width / 2 - reelBox.left - mid) / mid;
      if (t > 1) t = 1; else if (t < -1) t = -1;
      el.style.setProperty('--arc', (depth * t * t).toFixed(1) + 'px');
    }
  }
  function queueArc() {
    if (arcTicking) return;
    arcTicking = true;
    requestAnimationFrame(paintArc);
  }

  /* ---- 2b. drift --------------------------------------------------------- */
  var SPEED = 22;               // px per second
  var paused = false;
  var last = 0;

  function frame(now) {
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!paused && !dragging && cloned) {
      reel.scrollLeft += SPEED * dt;
      wrap();
    }
    requestAnimationFrame(frame);
  }

  function pause() { paused = true; }
  function resume() { paused = false; }

  reel.addEventListener('mouseenter', pause);
  reel.addEventListener('mouseleave', resume);
  reel.addEventListener('focusin', pause);
  reel.addEventListener('focusout', resume);
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    last = 0;
  });

  /* ---- 2c. mouse drag ---------------------------------------------------- */
  var dragging = false, startX = 0, startScroll = 0, moved = 0;

  reel.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;   // native touch scrolling is better
    dragging = true; moved = 0;
    startX = e.clientX;
    startScroll = reel.scrollLeft;
    reel.classList.add('is-dragging');
    reel.setPointerCapture(e.pointerId);
  });

  reel.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    reel.scrollLeft = startScroll - dx;
    wrap();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    reel.classList.remove('is-dragging');
    try { reel.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
  }
  reel.addEventListener('pointerup', endDrag);
  reel.addEventListener('pointercancel', endDrag);

  /* a drag that ends over a card must not open it */
  reel.addEventListener('click', function (e) {
    if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    moved = 0;
  }, true);

  /* ---- 2d. wheel: vertical intent becomes horizontal over the strip ------- */
  reel.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // real horizontal wheel
    if (!e.deltaY) return;
    var canScrollPage = document.documentElement.scrollHeight > window.innerHeight + 2;
    if (canScrollPage && window.innerWidth < 768) return;   // phone: leave the page alone
    e.preventDefault();
    reel.scrollLeft += e.deltaY;
    wrap();
  }, { passive: false });

  /* ---- 2e. keyboard ------------------------------------------------------ */
  reel.addEventListener('keydown', function (e) {
    var step = (originals[0] ? originals[0].getBoundingClientRect().width : 320) + 20;
    if (e.key === 'ArrowRight') { e.preventDefault(); reel.scrollBy({ left: step, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); reel.scrollBy({ left: -step, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    else if (e.key === 'Home') { e.preventDefault(); reel.scrollLeft = 0; }
  });

  reel.addEventListener('scroll', queueArc, { passive: true });
  window.addEventListener('resize', queueArc);

  /* ---- 3. entrance ------------------------------------------------------- */
  var order = ['.kicker', '.display', '.lead', '.action', '.facts', '.reel-wrap', '.micro'];
  order.forEach(function (sel, i) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.classList.add('lift');
    el.style.setProperty('--d', (i * 80) + 'ms');
  });

  requestAnimationFrame(function () {
    document.body.classList.add('is-ready');
    buildClones();
    /* start the strip already cut by the left edge — it reads as a continuing
       current rather than a row that begins here */
    var first = originals[0];
    if (first && window.innerWidth >= 768) {
      reel.scrollLeft = Math.round(first.getBoundingClientRect().width * 0.34);
    }
    paintArc();
    if (!reduceMotion) requestAnimationFrame(frame);
  });
})();
