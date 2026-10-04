/* Harsh Shukla — portfolio behaviour.
   Vanilla JS for controls; GSAP + ScrollTrigger (CDN) for the scroll choreography.
   Nothing is hidden until GSAP is confirmed present, so the page degrades to a
   static, fully visible document. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduceMotion;
  if (animate) root.classList.add('anim');

  /* ---------------- Theme toggle with circular wipe ---------------- */
  var themeBtn = document.getElementById('theme-toggle');
  var themeLabel = document.getElementById('theme-label');
  function currentTheme() {
    var forced = root.getAttribute('data-theme');
    if (forced === 'dark' || forced === 'light') return forced;
    return 'light'; // light is the default; dark only when chosen with the switch
  }
  function paintTheme() {
    var dark = currentTheme() === 'dark';
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(dark));
      themeBtn.setAttribute('aria-label', (dark ? 'Dark' : 'Light') + ' mode, switch to ' + (dark ? 'light' : 'dark'));
    }
    if (themeLabel) themeLabel.textContent = dark ? 'Dark' : 'Light';
  }
  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    paintTheme();
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function (e) {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition || reduceMotion) { applyTheme(next); return; }
      var r = themeBtn.getBoundingClientRect();
      var x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var vt = document.startViewTransition(function () { applyTheme(next); });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 600, easing: 'cubic-bezier(.22,.61,.36,1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () { /* transition unsupported mid-flight: theme already applied */ });
    });
    prefersDark.addEventListener('change', paintTheme);
  }
  paintTheme();

  /* ---------------- Scroll: header, progress bar, back-to-top ring ---------------- */
  var header = document.getElementById('site-header');
  var progress = document.getElementById('progress');
  var backTop = document.getElementById('back-top');
  var ring = document.getElementById('ring-fill');
  var RING = 125.66;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, y / max) : 0;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (progress) progress.style.width = (p * 100) + '%';
    if (backTop) backTop.classList.toggle('show', y > 600);
    if (ring) ring.style.strokeDashoffset = String(RING * (1 - p));
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------------- Mobile navigation ---------------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('open'); root.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Open menu');
  }
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      root.classList.toggle('nav-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------------- Active section + sliding indicator ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var indicator = document.getElementById('nav-indicator');
  function moveIndicator(link) {
    if (!indicator) return;
    if (!link || window.innerWidth <= 800) { indicator.classList.remove('on'); return; }
    indicator.style.left = link.offsetLeft + 'px';
    indicator.style.width = link.offsetWidth + 'px';
    indicator.classList.add('on');
  }
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id, active = null;
        navLinks.forEach(function (a) { var on = a.getAttribute('href') === id; a.classList.toggle('active', on); if (on) active = a; });
        moveIndicator(active);
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
    window.addEventListener('resize', function () { moveIndicator(document.querySelector('.site-nav a.active')); });
  }

  /* ---------------- Cursor effects (pointer devices only) ---------------- */
  var heroBg = document.getElementById('hero-bg');
  if (finePointer && !reduceMotion) {
    if (heroBg) {
      var hero = heroBg.parentElement;
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        heroBg.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
        heroBg.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
      });
    }
    // spotlight position on cards
    Array.prototype.forEach.call(document.querySelectorAll('.spot'), function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
      });
    });
    // 3D tilt on the photo and project cards
    Array.prototype.forEach.call(document.querySelectorAll('.tilt'), function (el) {
      var shine = el.querySelector('.shine');
      var max = el.classList.contains('photo') ? 7 : 4;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - .5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - py) * max * 2).toFixed(2) + 'deg');
        if (shine) { el.style.setProperty('--sx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--sy', (py * 100).toFixed(1) + '%'); }
      });
      el.addEventListener('mouseleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.project'), function (c) { c.classList.add('tilt'); });
    // magnetic buttons
    Array.prototype.forEach.call(document.querySelectorAll('.magnetic'), function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = 'translate(' + (dx * 6).toFixed(1) + 'px,' + (dy * 6).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------------- Copy email + toast ---------------- */
  var copyBtn = document.getElementById('copy-email');
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy') || '';
      var done = function () { showToast('Email address copied'); };
      var fail = function () { showToast(text); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    });
  }

  /* ---------------- Footer year ---------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------- Helpers shared by animated and static paths ---------------- */
  function formatNumber(n) { return n.toLocaleString('en-IN'); }
  function splitText(el, mode) {
    var text = el.textContent;
    el.textContent = '';
    var words = text.split(/(\s+)/);
    words.forEach(function (w) {
      if (!w) return;
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(' ')); return; }
      var wrap = document.createElement('span'); wrap.className = 'wrd'; wrap.setAttribute('aria-hidden', 'true');
      if (mode === 'chars') {
        Array.prototype.forEach.call(w, function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wrap.appendChild(s); });
      } else {
        var s = document.createElement('span'); s.className = 'wd'; s.textContent = w; wrap.appendChild(s);
      }
      el.appendChild(wrap);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.section-head'), function (h) {
    // heading underline: static path shows it at once; animated path toggles on enter
    if (!animate) h.classList.add('in');
  });

  /* ================= 21st.dev-inspired interactions (no GSAP needed) ================= */
  var stackMode = window.matchMedia('(min-width: 1025px)');

  // ---- Letter swap on nav links
  Array.prototype.forEach.call(document.querySelectorAll('.site-nav a'), function (a) {
    var text = a.textContent.trim();
    if (!text || a.querySelector('.ls')) return;
    var row = function () { return '<span class="ls-row">' + text.split('').map(function (c, i) { return '<span style="--i:' + i + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>'; }).join('') + '</span>'; };
    a.setAttribute('aria-label', text);
    a.innerHTML = '<span class="ls" aria-hidden="true">' + row() + row() + '</span>';
  });

  // ---- Flow buttons: fill grows from the side the pointer entered
  Array.prototype.forEach.call(document.querySelectorAll('.btn'), function (b) {
    b.addEventListener('mouseenter', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--fx', (e.clientX - r.left) + 'px');
      b.style.setProperty('--fy', (e.clientY - r.top) + 'px');
    });
  });

  // ---- Stacking project cards: per-card offset
  Array.prototype.forEach.call(document.querySelectorAll('.stack .project'), function (c, i) { c.style.setProperty('--i', i); });

  // ---- Marker highlight (static path)
  var hl = document.getElementById('hl');
  if (hl && !animate) hl.classList.add('on');

  // ---- Kinetic grid: dots lean toward the pointer, clicks send a ripple
  (function kineticGrid() {
    var cv = document.getElementById('kinetic');
    if (!cv || !cv.getContext) return;
    var heroEl = cv.parentElement, ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, dots = [], gap = 28;
    var mouse = { x: -9999, y: -9999, on: false }, ripples = [], running = false, visible = true;
    root.classList.add('has-kinetic');
    function color(a) { var c = getComputedStyle(root).getPropertyValue('--accent').trim() || '#0E6B53'; return c; }
    var accent = color();
    function build() {
      var r = heroEl.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (var y = gap / 2; y < H; y += gap) for (var x = gap / 2; x < W; x += gap) dots.push({ x: x, y: y, ox: 0, oy: 0 });
      accent = color(); draw();
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = accent;
      var now = t || 0;
      for (var i = ripples.length - 1; i >= 0; i--) { ripples[i].r += 9; if (ripples[i].r > Math.max(W, H)) ripples.splice(i, 1); }
      for (var j = 0; j < dots.length; j++) {
        var d = dots[j], tx = 0, ty = 0, glow = 0;
        if (mouse.on && !reduceMotion) {
          var dx = mouse.x - d.x, dy = mouse.y - d.y, dist = Math.sqrt(dx * dx + dy * dy), R = 170;
          if (dist < R) { var k = 1 - dist / R; tx += dx * k * 0.28; ty += dy * k * 0.28; glow = k; }
        }
        for (var q = 0; q < ripples.length; q++) {
          var rp = ripples[q], ddx = d.x - rp.x, ddy = d.y - rp.y, dd = Math.sqrt(ddx * ddx + ddy * ddy), band = Math.abs(dd - rp.r);
          if (band < 40 && dd > 0) { var f = (1 - band / 40) * (1 - rp.r / Math.max(W, H)); tx += ddx / dd * f * 10; ty += ddy / dd * f * 10; glow = Math.max(glow, f); }
        }
        d.ox += (tx - d.ox) * 0.18; d.oy += (ty - d.oy) * 0.18;
        var fade = Math.max(0, 1 - (d.y / H) * 0.9);
        ctx.globalAlpha = (0.16 + glow * 0.6) * fade;
        var s = 1.1 + glow * 1.8;
        ctx.beginPath(); ctx.arc(d.x + d.ox, d.y + d.oy, s, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) { if (!running) return; draw(t); requestAnimationFrame(loop); }
    function start() { if (running || reduceMotion || !visible) return; running = true; requestAnimationFrame(loop); }
    function stop() { running = false; }
    build();
    window.addEventListener('resize', function () { build(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(heroEl);
    if (finePointer) {
      heroEl.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; start(); });
      heroEl.addEventListener('mouseleave', function () { mouse.on = false; });
    }
    heroEl.addEventListener('click', function (e) { if (reduceMotion) return; var r = cv.getBoundingClientRect(); ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 0 }); start(); });
    var themeObs = new MutationObserver(function () { accent = color(); draw(); });
    themeObs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if (!reduceMotion) start();
  })();

  if (!animate) return;

  /* ================= GSAP choreography ================= */
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: .8 });

  // ---- Hero intro
  var h1 = document.querySelector('.split-chars');
  var tag = document.querySelector('.split-words');
  if (h1) splitText(h1, 'chars');
  if (tag) splitText(tag, 'words');
  // ---- Intro loader: counts to 100, then lifts away and plays the hero
  var loader = document.getElementById('loader');
  var loaderCount = document.getElementById('loader-count');
  var loaderBar = document.getElementById('loader-bar');
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' }, paused: true });
  function killLoader() { if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }
  if (loader) {
    var seen = false;
    try { seen = sessionStorage.getItem('introSeen') === '1'; sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    if (seen) { killLoader(); intro.play(); }
    else {
      var ctr = { v: 0 };
      gsap.timeline()
        .to(ctr, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: function () { loaderCount.textContent = Math.round(ctr.v); loaderBar.style.width = ctr.v + '%'; } })
        .to(loader, { yPercent: -100, duration: .8, ease: 'power4.inOut', onStart: function () { intro.play(); } }, '+=.1')
        .add(killLoader);
      setTimeout(function () { if (loader.parentNode) { killLoader(); intro.play(); } }, 3500);
    }
  } else { intro.play(); }
  intro.from('.status[data-hero]', { y: 14, autoAlpha: 0, duration: .6 }, 0)
       .from('.split-chars .ch', { yPercent: 110, duration: .9, stagger: .035, ease: 'power4.out' }, .1)
       .from('.split-words .wd', { yPercent: 100, autoAlpha: 0, duration: .7, stagger: .04 }, .5)
       .from('.summary[data-hero]', { y: 18, autoAlpha: 0 }, .9)
       .from('.hero-actions[data-hero] .btn', { y: 16, autoAlpha: 0, stagger: .1, duration: .6 }, 1.05)
       .from('.hero-links[data-hero] li', { x: -12, autoAlpha: 0, stagger: .08, duration: .5 }, 1.25)
       .fromTo('#photo', { clipPath: 'inset(100% 0 0 0 round 12px)' }, { clipPath: 'inset(0% 0 0 0 round 12px)', duration: 1.1, ease: 'power4.inOut', clearProps: 'clipPath' }, .2)
       .from('#photo img', { scale: 1.18, duration: 1.6, ease: 'power3.out', clearProps: 'scale' }, .2)
       .from('[data-hero-side]', { x: 28, autoAlpha: 0, duration: .8 }, .9);

  // ---- Hero parallax: photo column drifts as you scroll away
  gsap.to('.hero-side', { y: 70, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { y: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // ---- Entrance system. Every element is hidden with gsap.set() and revealed
  //      with a gsap.to() when its trigger enters; transforms are cleared after
  //      each reveal so CSS hover effects work again. No from() tweens, no once
  //      triggers, no CSS transitions on transform: those three combined can
  //      leave elements stuck mid-state.
  function reveal(targets, vars) {
    return gsap.to(targets, Object.assign({ autoAlpha: 1, x: 0, y: 0, scale: 1, duration: .7, overwrite: 'auto', clearProps: 'transform' }, vars || {}));
  }
  function onEnter(trigger, start, fn) {
    var st = ScrollTrigger.create({ trigger: trigger, start: start || 'top 88%', onEnter: function () { fn(); st.kill(); } });
    return st;
  }

  var heads = gsap.utils.toArray('.section-head');
  gsap.set(heads, { y: 24, autoAlpha: 0 });
  heads.forEach(function (h) { onEnter(h, 'top 88%', function () { reveal(h); h.classList.add('in'); }); });

  if (stackMode.matches) Array.prototype.forEach.call(document.querySelectorAll('.stack .project'), function (c) { c.removeAttribute('data-fx'); });
  var fx = gsap.utils.toArray('[data-fx]:not(.section-head)');
  gsap.set(fx, { y: 32, autoAlpha: 0 });
  ScrollTrigger.batch(fx, { start: 'top 88%', once: true, onEnter: function (batch) { reveal(batch, { stagger: .09, duration: .8 }); } });

  var bulletGroups = gsap.utils.toArray('.tl-card');
  bulletGroups.forEach(function (card) {
    var items = card.querySelectorAll('.bullets li');
    gsap.set(items, { x: -14, autoAlpha: 0 });
    onEnter(card, 'top 78%', function () { reveal(items, { stagger: .08, duration: .5 }); });
  });

  gsap.utils.toArray('.skill-group, .tl-card, .project-body, .competencies').forEach(function (group) {
    var chips = group.querySelectorAll('.chips li');
    if (!chips.length) return;
    gsap.set(chips, { y: 10, autoAlpha: 0 });
    onEnter(group, 'top 86%', function () { reveal(chips, { stagger: .025, duration: .45, ease: 'power2.out' }); });
  });

  var markers = gsap.utils.toArray('.tl-marker');
  gsap.set(markers, { scale: 0 });
  markers.forEach(function (m) { onEnter(m, 'top 82%', function () { reveal(m, { duration: .5, ease: 'back.out(2.5)' }); }); });

  var checks = gsap.utils.toArray('.checklist .icon');
  if (checks.length) {
    gsap.set(checks, { strokeDashoffset: 30 });
    onEnter('.checklist', 'top 85%', function () { gsap.to(checks, { strokeDashoffset: 0, stagger: .12, duration: .6, ease: 'power2.out' }); });
  }

  var contact = document.querySelector('.contact');
  if (contact) { gsap.set(contact, { scale: .97 }); onEnter(contact, 'top 85%', function () { reveal(contact, { duration: .6 }); }); }

  // ---- Metrics count up
  gsap.utils.toArray('.counter').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var obj = { v: 0 };
    onEnter(el, 'top 90%', function () {
      gsap.to(obj, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = formatNumber(Math.round(obj.v)) + suffix; } });
    });
  });

  // ---- Timeline line drawn by scroll (scrubbed, so it follows the reader)
  var tlLine = document.querySelector('.tl-line');
  if (tlLine) gsap.fromTo(tlLine, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 55%', scrub: .6 } });

  // ---- Headings rise word by word
  heads.forEach(function (h) {
    var h2 = h.querySelector('h2'); if (!h2) return;
    var words = h2.textContent.trim().split(/\s+/);
    h2.setAttribute('aria-label', h2.textContent.trim());
    h2.innerHTML = words.map(function (w) { return '<span class="hw" aria-hidden="true"><span>' + w + '</span></span>'; }).join(' ');
    var inner = h2.querySelectorAll('.hw > span');
    gsap.set(inner, { yPercent: 110 });
    onEnter(h, 'top 88%', function () { gsap.to(inner, { yPercent: 0, duration: .9, stagger: .08, ease: 'power4.out' }); });
  });

  // ---- Project images wipe open
  gsap.utils.toArray('.cover-link, .project .cover').forEach(function (c) {
    gsap.set(c, { clipPath: 'inset(0 0 100% 0)' });
    onEnter(c, 'top 90%', function () { gsap.to(c, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.inOut', clearProps: 'clipPath' }); });
  });

  // ---- Safety net: after any scroll settles (and every 1.5 s), anything still
  //      hidden that sits at or above the bottom of the viewport is revealed, so
  //      a fast jump (nav click, End key, flick) can never leave a gap behind.
  var hiddenPool = fx.concat(heads, gsap.utils.toArray('.bullets li'), gsap.utils.toArray('.chips li'), markers, contact ? [contact] : []);
  function sweep() {
    var limit = window.innerHeight + 40;
    hiddenPool.forEach(function (el) {
      if (gsap.isTweening(el)) return;
      var r = el.getBoundingClientRect();
      if (r.top > limit) return;
      var cs = getComputedStyle(el);
      var t = cs.transform;
      var stuck = t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)';
      if (parseFloat(cs.opacity) >= .99 && !stuck) return;
      reveal(el, { duration: .5 });
      if (el.classList.contains('section-head')) el.classList.add('in');
    });
    document.querySelectorAll('.hw > span').forEach(function (w) { if (w.getBoundingClientRect().top < limit && !gsap.isTweening(w) && gsap.getProperty(w, 'yPercent') !== 0) gsap.to(w, { yPercent: 0, duration: .5 }); });
    document.querySelectorAll('.cover-link, .project .cover').forEach(function (c) { if (c.getBoundingClientRect().top < limit && !gsap.isTweening(c) && c.style.clipPath && c.style.clipPath.indexOf('100%') > -1) gsap.to(c, { clipPath: 'inset(0 0 0% 0)', duration: .6, clearProps: 'clipPath' }); });
  }
  var sweepTimer = null;
  function scheduleSweep() { if (sweepTimer) clearTimeout(sweepTimer); sweepTimer = setTimeout(sweep, 160); }
  window.addEventListener('scroll', scheduleSweep, { passive: true });
  window.addEventListener('resize', scheduleSweep);
  window.addEventListener('load', function () { setTimeout(sweep, 1200); });
  window.setInterval(sweep, 1500);

  // ---- Custom cursor with easing
  var cursor = document.getElementById('cursor');
  if (cursor && finePointer) {
    root.classList.add('has-cursor');
    var dot = cursor.querySelector('.cursor-dot'), ringEl = cursor.querySelector('.cursor-ring'), label = document.getElementById('cursor-label');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)'; }, { passive: true });
    gsap.ticker.add(function () { rx += (mx - rx) * .18; ry += (my - ry) * .18; ringEl.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)'; });
    document.addEventListener('mouseover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      var hov = e.target.closest('a, button, .chips li, .spot');
      cursor.classList.toggle('label', !!lab);
      if (label) label.textContent = lab ? lab.getAttribute('data-cursor') : '';
      cursor.classList.toggle('hover', !lab && !!hov);
    });
    window.addEventListener('mousedown', function () { cursor.classList.add('down'); });
    window.addEventListener('mouseup', function () { cursor.classList.remove('down'); });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });
  }

  // ---- Smooth scrolling (Lenis) wired into ScrollTrigger and anchor links
  if (typeof window.Lenis !== 'undefined' && finePointer) {
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); var el = id === '#top' ? 0 : document.querySelector(id);
        if (el === null) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -76 });
      });
    });
    if (backTop) backTop.addEventListener('click', function (e) { e.stopImmediatePropagation(); lenis.scrollTo(0); }, true);
  }

  // ---- Word rotate in the hero
  var rot = document.getElementById('rot');
  if (rot) {
    var words = ['Angular dashboards', 'Node.js REST APIs', 'role-based access control', 'live-class integrations', 'full-stack MERN apps'];
    var wi = 0, current = rot.querySelector('.rot-word');
    setInterval(function () {
      if (document.hidden) return;
      wi = (wi + 1) % words.length;
      var next = document.createElement('span'); next.className = 'rot-word'; next.textContent = words[wi];
      rot.appendChild(next);
      var old = current; current = next;
      gsap.fromTo(next, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'power3.out' });
      gsap.to(old, { yPercent: -100, opacity: 0, duration: .5, ease: 'power3.in', onComplete: function () { old.remove(); } });
    }, 2600);
  }

  // ---- Marker highlight sweeps in after the hero intro
  if (hl) setTimeout(function () { hl.classList.add('on'); }, 1900);

  // ---- Stacking cards: earlier cards shrink and dim as the next one slides over
  if (stackMode.matches) {
    var cards = gsap.utils.toArray('.stack .project');
    cards.forEach(function (card, i) {
      var next = cards[i + 1]; if (!next) return;
      ScrollTrigger.create({
        trigger: next, start: 'top bottom', end: 'top ' + (76 + 18 * (i + 1)) + 'px', scrub: true,
        onUpdate: function (self) { var p = self.progress; card.style.setProperty('--s', (1 - p * 0.06).toFixed(4)); card.style.setProperty('--b', (1 - p * 0.12).toFixed(4)); }
      });
    });
  }

  // ---- Velocity marquee: speeds up with scroll and follows its direction
  var track = document.querySelector('.marquee-track');
  if (track) {
    track.classList.add('js-driven');
    var mqX = 0, dir = -1, lastY = window.scrollY, half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure(); window.addEventListener('resize', measure);
    var paused = false;
    track.parentElement.addEventListener('mouseenter', function () { paused = true; });
    track.parentElement.addEventListener('mouseleave', function () { paused = false; });
    gsap.ticker.add(function (time, delta) {
      var y = window.scrollY, v = y - lastY; lastY = y;
      if (v > 0.5) dir = -1; else if (v < -0.5) dir = 1;
      var speed = paused ? 0 : (0.6 + Math.min(Math.abs(v) * 0.35, 14));
      mqX += dir * speed * (delta / 16.67);
      if (half > 0) { if (mqX <= -half) mqX += half; if (mqX > 0) mqX -= half; }
      track.style.transform = 'translate3d(' + mqX.toFixed(2) + 'px,0,0)';
    });
  }

  ScrollTrigger.refresh();
})();
