/* Python Group — homepage interaction layer.
   No dependencies. Native scroll (no scroll-jacking): scroll-linked visuals read a
   smoothed "virtual" scroll position, so parallax, the craft sequence and image
   flex glide behind the page like inertia. Transforms, clip-paths and opacity only.
   Everything degrades to a complete static page when motion is reduced or JS is off. */
(function () {
  'use strict';

  var root = document.documentElement;
  var motion = root.classList.contains('has-motion');
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  var vh = window.innerHeight, vw = window.innerWidth;
  var hh = 72;

  /* ---- Configuration: set when real contact details exist ---------------- */
  var CONTACT_EMAIL = 'info@pythongroup.co.nz'; // e.g. 'hello@example.co.nz'. When set, "Enquire" buttons open an email.
  if (CONTACT_EMAIL) {
    $$('[data-enquire]').forEach(function (a) {
      a.setAttribute('href', 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Project enquiry'));
    });
  }

  /* ---- Letter-by-letter headlines ---------------------------------------- */
  function splitChars() {
    if (!motion) return;
    $$('[data-chars]').forEach(function (el) {
      var label = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('aria-label', label);
      var isHero = el.classList.contains('hero__title');
      $$('.ln > span', el).forEach(function (span, li) {
        var text = span.textContent;
        span.textContent = '';
        span.setAttribute('aria-hidden', 'true');
        var n = 0;
        text.split(' ').forEach(function (word, wi, arr) {
          var w = document.createElement('span');
          w.className = 'wd';
          for (var i = 0; i < word.length; i++) {
            var c = document.createElement('span');
            c.className = 'ch';
            c.textContent = word.charAt(i);
            c.style.setProperty('--d', Math.round((isHero ? 550 : 0) + li * 150 + n * 24));
            w.appendChild(c); n++;
          }
          span.appendChild(w);
          if (wi < arr.length - 1) { span.appendChild(document.createTextNode(' ')); n++; }
        });
      });
    });
  }

  /* ---- Opening sequence + hero ready ------------------------------------- */
  var intro = $('.intro');
  var heroImg = $('[data-hero-img]');
  var readyDone = false;

  function heroReady() {
    if (readyDone) return;
    readyDone = true;
    root.classList.add('hero-ready');
    setTimeout(function () { root.classList.add('hero-settled'); }, 2200);
  }
  var introTimers = [], introEnded = false;
  function endIntro() {
    if (!intro || introEnded) return;
    introEnded = true;
    introTimers.forEach(clearTimeout);
    intro.classList.add('is-leaving');
    root.classList.remove('intro-lock');
    heroReady();
    setTimeout(function () {
      root.classList.remove('is-intro');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      try { sessionStorage.setItem('pg-intro', '1'); } catch (e) { /* ignore */ }
    }, 1000);
  }
  /* Intro: mark fades in and out, "Built" and "with intent." arrive from the edges and meet in the centre,
     then a small mark appears and the curtain lifts. */
  function runIntro(done) {
    var steps = [
      [1500, 'add', 's1'], [700, 'remove', 's1'], [1000, 'add', 's2'], [1000, 'add', 's3'],
      [1000, 'remove', 's2'], [1000, 'add', 's4'], [900, 'done']
    ];
    var i = 0;
    function next() {
      if (introEnded) return;
      var s = steps[i++];
      if (!s) return;
      if (s[1] === 'done') { done(); return; }
      intro.classList[s[1]](s[2]);
      introTimers.push(setTimeout(next, s[0]));
    }
    introTimers.push(setTimeout(next, 500));
    intro.addEventListener('click', done);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') done(); });
  }
  if (motion) {
    var imgReady = heroImg && heroImg.decode ? heroImg.decode().catch(function () {}) : Promise.resolve();
    if (root.classList.contains('is-intro') && intro) {
      root.classList.add('intro-lock');
      var played = new Promise(function (r) { runIntro(r); });
      Promise.race([Promise.all([imgReady, played]), new Promise(function (r) { setTimeout(r, 14000); })]).then(endIntro);
      played.then(function () { /* skipped or finished */ });
    } else {
      Promise.race([imgReady, new Promise(function (r) { setTimeout(r, 4500); })]).then(function () {
        new Promise(function (r) { setTimeout(r, 150); }).then(heroReady);
      });
    }
  }

  /* ---- Header ------------------------------------------------------------- */
  var header = $('[data-header]');
  var lastY = window.scrollY;
  function updateHeader() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    if (!root.classList.contains('menu-open')) {
      if (y > lastY + 6 && y > vh * 0.5) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 40) header.classList.remove('is-hidden');
    }
    lastY = y;
  }

  /* ---- Menu (with image preview on hover/focus) --------------------------- */
  var menu = $('#menu');
  var toggle = $('[data-menu-toggle]');
  var toggleLabel = $('[data-menu-label]');
  var main = $('#main');
  var footer = $('.site-footer');
  var menuImgs = $$('[data-menu-img]');
  var menuActive = 0;

  function setMenuImg(i) {
    if (i === menuActive) return;
    menuActive = i;
    menuImgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
  }
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Close' : 'Menu';
    if (open) {
      menu.removeAttribute('inert');
      main.setAttribute('inert', ''); footer.setAttribute('inert', '');
      header.classList.remove('is-hidden');
      var first = $('[data-menu-link]', menu);
      setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 450);
    } else {
      menu.setAttribute('inert', '');
      main.removeAttribute('inert'); footer.removeAttribute('inert');
      setMenuImg(0);
    }
  }
  toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
  });
  $$('[data-menu-link]').forEach(function (a) {
    var i = parseInt(a.getAttribute('data-i'), 10) || 0;
    a.addEventListener('mouseenter', function () { setMenuImg(i); });
    a.addEventListener('focus', function () { setMenuImg(i); });
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id && id.charAt(0) === '#' ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      setTimeout(function () { target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' }); }, 420);
    });
  });

  /* ---- Reveals ------------------------------------------------------------ */
  var pendingImgs = [];
  function setupReveals() {
    var els = $$('[data-reveal], [data-fade]');
    if (!motion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) {
      if (el.classList.contains('reveal')) pendingImgs.push(el); else io.observe(el);
    });
  }
  function updateImageReveals() {
    if (!pendingImgs.length) return;
    pendingImgs = pendingImgs.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.86 && r.bottom > 0) { el.classList.add('is-in'); return false; }
      return true;
    });
  }

  /* ---- Statement words ---------------------------------------------------- */
  var statement = $('[data-words]');
  var words = [];
  function setupStatement() {
    if (!statement || !motion) return;
    var text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.textContent = '';
    text.split(/\s+/).forEach(function (w, i, arr) {
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      statement.appendChild(s);
      if (i < arr.length - 1) statement.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  /* ---- Smoothed scroll state ---------------------------------------------- */
  var realY = window.scrollY, sy = realY, dy = 0, skew = 0;
  var tpx = .7, tpy = .45, px = .7, py = .45; // pointer, normalised to the viewport
  var running = false, last = 0;

  var parallax = $$('[data-parallax]').map(function (el) {
    return { el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0.08, host: el.closest('.reveal, .band') || el.parentNode };
  });
  var heroFrame = $('[data-hero-frame]');
  var heroLight = $('[data-hero-light]');
  var bandDim = $('[data-band-dim]');
  var band = $('.band');
  var gutter = 24;
  function resolveGutter() {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--g);height:0';
    document.body.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);
    return w || 24;
  }

  function topOf(el) { return el.getBoundingClientRect().top + dy; } // position at the virtual scroll

  function renderHero() {
    if (sy > vh * 1.3) return;
    var p = easeOut(clamp(sy / (vh * 0.55)));
    var night = easeOut(clamp(sy / (vh * 0.95)));
    heroFrame.style.setProperty('--in', lerp(gutter, 0, p).toFixed(1) + 'px');
    heroFrame.style.setProperty('--night', night.toFixed(3));
    heroImg.style.setProperty('--ty', (sy * 0.16).toFixed(1) + 'px');
    heroImg.style.setProperty('--sc', (1.04 + p * 0.07).toFixed(4));
    if (fine) {
      heroImg.style.setProperty('--mx', ((px - .5) * -10).toFixed(1) + 'px');
      heroImg.style.setProperty('--my', ((py - .5) * -6).toFixed(1) + 'px');
      if (heroLight) {
        var x = px * vw - 0, y = py * vh - hh;
        heroLight.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
    }
  }

  function renderParallax() {
    var sk = '0deg';
    for (var i = 0; i < parallax.length; i++) {
      var p = parallax[i], r = p.host.getBoundingClientRect();
      var top = r.top + dy;
      if (top + r.height < -120 || top > vh + 120) continue;
      var off = (top + r.height / 2) - vh / 2;
      p.el.style.setProperty('--ty', (-off * p.speed).toFixed(1) + 'px');
      p.el.style.setProperty('--sk', sk);
    }
    if (band && bandDim) {
      var br = band.getBoundingClientRect(), bt = br.top + dy;
      if (bt < vh && bt + br.height > 0) {
        var pr = clamp((vh - bt) / (vh * 0.95));
        bandDim.style.opacity = (0.52 * (1 - easeOut(pr))).toFixed(3);
      }
    }
  }

  function renderStatement() {
    if (!words.length) return;
    var top = topOf(statement), h = statement.offsetHeight;
    if (top + h < 0 || top > vh) return;
    var p = clamp((vh * 0.82 - top) / (h + vh * 0.38));
    var n = words.length, lit = Math.round(p * n * 1.04);
    for (var i = 0; i < n; i++) words[i].classList.toggle('on', i < lit);
  }

  var prSection = $('[data-principles]');
  var prRows = $$('[data-pr]');
  var prImgs = $$('[data-pr-img]');
  var prCount = $('[data-pr-count]');
  var prActive = 0;
  function setPr(i) {
    if (i === prActive) return;
    prActive = i;
    prRows.forEach(function (r, k) { r.classList.toggle('is-active', k === i); });
    prImgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
    if (prCount) prCount.textContent = '0' + (i + 1);
  }
  function renderPrinciples() {
    if (!prSection || vw < 900) return;
    var r = prSection.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    var mid = vh * 0.5, best = 0, bestD = Infinity;
    prRows.forEach(function (row, k) {
      var b = row.getBoundingClientRect(), d = Math.abs((b.top + b.height / 2) - mid);
      if (d < bestD) { bestD = d; best = k; }
    });
    setPr(best);
  }

  var seq = $('[data-seq]');
  var track = $('[data-seq-track]');
  var bar = $('[data-seq-bar]');
  var seqDist = 0, pinned = false;
  function setupSeq() {
    if (!seq) return;
    var want = motion && vw >= 900;
    if (want !== pinned) { pinned = want; seq.classList.toggle('is-pinned', pinned); }
    if (pinned) {
      seqDist = Math.max(0, track.scrollWidth - vw);
      seq.style.height = (seqDist + vh) + 'px';
    } else { seq.style.height = ''; track.style.transform = ''; }
  }
  function renderSeq() {
    if (!pinned) return;
    var r = seq.getBoundingClientRect(), t = r.top + dy;
    if (t + r.height < -50 || t > vh + 50) return;
    var p = clamp(-t / Math.max(1, r.height - vh));
    track.style.transform = 'translate3d(' + (-p * seqDist).toFixed(1) + 'px,0,0)';
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  function render() {
    updateImageReveals();
    renderHero();
    renderParallax();
    renderStatement();
    renderPrinciples();
    renderSeq();
  }

  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    realY = window.scrollY;
    var k = 1 - Math.exp(-dt * 5.2);
    sy += (realY - sy) * k;
    dy = realY - sy;
    skew = lerp(skew, dy, 1 - Math.exp(-dt * 10));
    var kp = 1 - Math.exp(-dt * 3);
    px += (tpx - px) * kp; py += (tpy - py) * kp;
    render();
    var calm = Math.abs(dy) < 0.4 && Math.abs(skew) < 0.4 && Math.abs(tpx - px) < 0.002 && Math.abs(tpy - py) < 0.002;
    if (calm) { sy = realY; dy = 0; skew = 0; render(); running = false; } else { requestAnimationFrame(tick); }
  }
  function kick() {
    updateHeader();
    if (!motion) return;
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
  }

  /* ---- Pointer: light + tilt, magnetic controls --------------------------- */
  if (motion && fine) {
    window.addEventListener('pointermove', function (e) {
      tpx = e.clientX / vw; tpy = e.clientY / vh;
      if (sy < vh * 1.3) kick();
    }, { passive: true });
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = 'translate3d(' + (x * 14).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  function measure() {
    vh = window.innerHeight; vw = window.innerWidth;
    hh = vw <= 720 ? 64 : 72;
    gutter = resolveGutter();
    setupSeq();
    kick();
  }

  window.addEventListener('scroll', kick, { passive: true });
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(measure, 120); });
  window.addEventListener('load', function () { measure(); setTimeout(measure, 600); });

  splitChars();
  setupReveals();
  setupStatement();
  gutter = resolveGutter();
  setupSeq();
  kick();
  if (motion) { running = true; last = performance.now(); requestAnimationFrame(tick); }
})();
