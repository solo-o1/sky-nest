/* ==========================================================================
   SkyNest Co-Living — script.js
   Theme toggle (circular reveal), mobile nav, facilities tabs, package advisor,
   enquiry form validation, scroll effects and animations.
   ========================================================================== */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle with circular reveal ---------- */
  var themeToggle = document.getElementById('themeToggle');

  function updateToggleLabel() {
    var isDark = root.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('skynest-theme', theme); } catch (e) {}
    updateToggleLabel();
  }

  themeToggle.addEventListener('click', function (event) {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    // Start the circle from the click point, or from the button centre for keyboard use.
    var rect = themeToggle.getBoundingClientRect();
    var x = event.clientX || rect.left + rect.width / 2;
    var y = event.clientY || rect.top + rect.height / 2;
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    if (reduceMotion) { setTheme(next); return; }

    // Modern browsers (Chrome, Edge, Safari 18+): View Transitions API.
    if (document.startViewTransition) {
      var transition = document.startViewTransition(function () { setTheme(next); });
      transition.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 750, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      });
      return;
    }

    // Fallback: an expanding coloured circle that covers the page, then fades out.
    var wave = document.createElement('div');
    wave.className = 'theme-wave';
    var size = radius * 2;
    wave.style.width = size + 'px';
    wave.style.height = size + 'px';
    wave.style.left = x + 'px';
    wave.style.top = y + 'px';
    wave.style.background = next === 'dark' ? '#0b1615' : '#ffffff';
    document.body.appendChild(wave);
    requestAnimationFrame(function () { wave.style.transform = 'translate(-50%, -50%) scale(1)'; });
    setTimeout(function () {
      setTheme(next);
      wave.style.transition = 'opacity 0.4s ease';
      wave.style.opacity = '0';
      setTimeout(function () { wave.remove(); }, 400);
    }, 700);
  });

  updateToggleLabel();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  navToggle.addEventListener('click', function () {
    var isOpen = primaryNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navToggle.setAttribute('aria-label', isOpen ? 'Close main menu' : 'Open main menu');
  });

  // Close the mobile menu once a link is chosen (fix for Test T02).
  primaryNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (primaryNav.classList.contains('is-open')) {
        primaryNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open main menu');
      }
    });
  });

  /* ---------- Header, progress bar, back-to-top, active link ---------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var backToTop = document.getElementById('backToTop');
  var navLinks = Array.prototype.slice.call(primaryNav.querySelectorAll('a[href^="#"]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 10);
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    backToTop.classList.toggle('is-visible', y > 600);

    var current = -1;
    sections.forEach(function (sec, i) {
      if (sec && sec.getBoundingClientRect().top < window.innerHeight * 0.4) { current = i; }
    });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Facilities tabs with sliding indicator ---------- */
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var tabIndicator = document.getElementById('tabIndicator');
  var tabPanels = {
    'tab-core': document.getElementById('panel-core'),
    'tab-work': document.getElementById('panel-work'),
    'tab-life': document.getElementById('panel-life')
  };

  function moveIndicator(btn) {
    tabIndicator.style.width = btn.offsetWidth + 'px';
    tabIndicator.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    tabIndicator.style.top = (btn.offsetTop + btn.offsetHeight - 1) + 'px';
  }

  function activateTab(tabId) {
    tabButtons.forEach(function (btn) {
      var isActive = btn.id === tabId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
      if (isActive) { moveIndicator(btn); }
    });
    Object.keys(tabPanels).forEach(function (id) {
      tabPanels[id].hidden = id !== tabId;
    });
  }

  tabButtons.forEach(function (btn, index) {
    btn.addEventListener('click', function () {
      activateTab(btn.id);
      btn.focus();
    });
    // Left/Right arrow keys move between tabs (ARIA tabs pattern, fix for Test T12).
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var nextIndex = e.key === 'ArrowRight'
          ? (index + 1) % tabButtons.length
          : (index - 1 + tabButtons.length) % tabButtons.length;
        var nextBtn = tabButtons[nextIndex];
        activateTab(nextBtn.id);
        nextBtn.focus();
      }
    });
  });

  window.addEventListener('resize', function () {
    var active = document.querySelector('.tab-btn.is-active');
    if (active) { moveIndicator(active); }
  });
  activateTab('tab-core');
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { activateTab(document.querySelector('.tab-btn.is-active').id); });
  }

  /* ---------- Package advisor ---------- */
  var advisorForm = document.getElementById('advisorForm');
  var advisorResult = document.getElementById('advisorResult');

  advisorForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var length = advisorForm.querySelector('input[name="length"]:checked');
    var priority = advisorForm.querySelector('input[name="priority"]:checked');

    // Re-trigger the pop-in animation on every answer.
    advisorResult.hidden = true;
    void advisorResult.offsetWidth;
    advisorResult.hidden = false;

    if (!length || !priority) {
      advisorResult.textContent = 'Please answer both questions so we can recommend a package.';
      return;
    }

    var recommendation;
    if (priority.value === 'custom') {
      recommendation = 'Custom Packages — your needs are best discussed directly with our team so we can tailor a corporate or accessibility-friendly arrangement.';
    } else if (length.value === 'short') {
      recommendation = 'Short-Term Stay — flexible 1–4 week booking with a furnished room and no long-term commitment.';
    } else if (priority.value === 'privacy') {
      recommendation = 'Premium Stay — a private studio with full facility access and weekly cleaning.';
    } else {
      recommendation = 'Standard Stay — a private bedroom in a shared apartment, with co-working access and lower cost.';
    }
    advisorResult.textContent = 'Recommended for you: ' + recommendation;
  });

  /* ---------- Enquiry form validation ---------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  var fields = [
    { input: document.getElementById('fullName'), error: document.getElementById('fullNameError'),
      validate: function (v) { return v.trim().length > 0; } },
    { input: document.getElementById('email'), error: document.getElementById('emailError'),
      validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
    { input: document.getElementById('enquiryType'), error: document.getElementById('enquiryTypeError'),
      validate: function (v) { return v !== ''; } },
    { input: document.getElementById('message'), error: document.getElementById('messageError'),
      validate: function (v) { return v.trim().length >= 10; } }   // 10-character minimum (fix for Test T05)
  ];

  function validateField(field) {
    var isValid = field.validate(field.input.value);
    field.error.hidden = isValid;
    field.input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    return isValid;
  }

  fields.forEach(function (field) {
    field.input.addEventListener('blur', function () { validateField(field); });
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var allValid = fields.map(validateField).every(Boolean);

    if (!allValid) {
      formSuccess.hidden = true;
      var firstInvalid = fields.find(function (f) { return !f.error.hidden; });
      if (firstInvalid) { firstInvalid.input.focus(); }
      return;
    }

    formSuccess.hidden = false;
    contactForm.reset();
    fields.forEach(function (field) {
      field.error.hidden = true;
      field.input.removeAttribute('aria-invalid');
    });
  });

  /* ---------- Count-up numbers in the hero ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion || isNaN(target)) { el.textContent = target; return; }
    var start = null;
    var duration = 1200;
    function step(ts) {
      if (!start) { start = ts; }
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) { requestAnimationFrame(step); }
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  setTimeout(function () {
    document.querySelectorAll('[data-count]').forEach(countUp);
  }, 400);

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll('[data-reveal], .section-title');

  if ('IntersectionObserver' in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(function (el) {
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(siblings, 4) * 90 + 'ms';
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
  }

});
