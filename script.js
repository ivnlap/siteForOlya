/* =============================================================================
   V1 «Reel» — gallery mechanics + the single call to action.
   No dependencies, no build step. Drop-in identical across the three variants.
   ============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     Обе цели заданы владельцем 09.08.2026 и заглушками больше не являются.

     1) WHATSAPP_URL — рабочий номер +7 950 957 24 90. В wa.me номер идёт без
        плюса, пробелов и дефисов, иначе ссылка не открывает диалог.
     2) VIDEOS — все пять карточек ведут на канал целиком, а не на отдельные
        ролики: так решил владелец. Не «ещё не проставлено» — не заменять на
        прямые ссылки без его слова.
     --------------------------------------------------------------------------- */
  var GREETING = "Hi! I'd like to discuss an animated video for our brand.";
  var WHATSAPP_URL = 'https://wa.me/79509572490';
  var CHANNEL_URL = 'https://www.youtube.com/@KikiToony';
  var VIDEOS = [
    CHANNEL_URL, // Who's in the Garden?
    CHANNEL_URL, // Summer Fruits Song
    CHANNEL_URL, // My First Colours Song
    CHANNEL_URL, // Four Seasons Song
    CHANNEL_URL  // Dog vs Cat and The Flying Snack
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
  var DRAG_SLOP = 6;   // порог: ниже него это клик, а не перетаскивание
  var dragging = false, captured = false, startX = 0, startScroll = 0, moved = 0;

  reel.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;   // native touch scrolling is better
    dragging = true; moved = 0; captured = false;
    startX = e.clientX;
    startScroll = reel.scrollLeft;
    reel.classList.add('is-dragging');
    /* Указатель здесь НЕ захватывается намеренно. setPointerCapture уводит на
       элемент захвата не только pointermove/pointerup, но и совместимый click:
       он приходил на .reel, ссылка внутри карточки его не получала, и обложки
       переставали открываться вовсе. Захват берётся ниже — когда палец реально
       поехал. Проверено настоящим вводом мыши, а не dispatchEvent: тот бьёт по
       элементу напрямую и мимо этого перенаправления проходит. */
  });

  reel.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    /* с этого момента это перетаскивание: захват нужен, чтобы лента не бросала
       палец, ушедший за её пределы. Клик после такого движения всё равно
       гасится ниже — открывать карточку он уже не должен. */
    if (!captured && moved > DRAG_SLOP) {
      captured = true;
      try { reel.setPointerCapture(e.pointerId); } catch (err) { /* не критично */ }
    }
    reel.scrollLeft = startScroll - dx;
    wrap();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    reel.classList.remove('is-dragging');
    if (captured) {
      try { reel.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    }
    captured = false;
  }
  reel.addEventListener('pointerup', endDrag);
  reel.addEventListener('pointercancel', endDrag);

  /* Обложка — картинка внутри ссылки, и браузер по умолчанию таскает такие
     родным drag-and-drop: указатель отменяется, лента стоит на месте, а click
     не рождается вообще. Раньше это побочно глушил захват указателя на
     pointerdown — теперь глушим явно, чтобы жест не зависел от момента захвата. */
  reel.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* a drag that ends over a card must not open it */
  reel.addEventListener('click', function (e) {
    if (moved > DRAG_SLOP) { e.preventDefault(); e.stopPropagation(); }
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
  /* маскот идёт третьим: он появляется сразу за заголовком, а не в конце очереди —
     он часть первого впечатления, а не декор, который доезжает последним */
  var order = ['.kicker', '.display', '.mascot', '.lead', '.action', '.reel-wrap', '.micro'];
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
