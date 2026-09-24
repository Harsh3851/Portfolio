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
    return prefersDark.matches ? 'dark' : 'light';
  }
  function paintTheme() {
    var dark = currentTheme() === 'dark';
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(dark));
      themeBtn.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' mode');
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

  ScrollTrigger.refresh();
})();
