/* ==========================================================================
   SkyNest Co-Living — script.js (shared by all five pages)
   Each feature checks that its elements exist, so the same file works on every page.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PACKAGE_NAMES = {
    'premium': 'Premium Stay',
    'standard': 'Standard Stay',
    'short-term': 'Short-Term Stay',
    'custom': 'Custom Packages',
    'unsure': 'Not sure yet'
  };

  function formatDate(iso) {
    // yyyy-mm-dd -> dd/mm/yyyy (the day / month / year format shown in the Figma form)
    if (!iso) { return ''; }
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  /* ---------- Dark / light theme with a circular reveal from the button ---------- */
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

  if (themeToggle) {
    themeToggle.addEventListener('click', function (event) {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var rect = themeToggle.getBoundingClientRect();
      // Start from the click point, or from the button centre when the keyboard is used.
      var x = event.clientX || rect.left + rect.width / 2;
      var y = event.clientY || rect.top + rect.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      if (reduceMotion) { setTheme(next); return; }

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

      // Fallback for browsers without the View Transitions API.
      var wave = document.createElement('div');
      wave.className = 'theme-wave';
      wave.style.width = wave.style.height = radius * 2 + 'px';
      wave.style.left = x + 'px';
      wave.style.top = y + 'px';
      wave.style.background = next === 'dark' ? '#0b1220' : '#ffffff';
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
  }

  /* ---------- Mobile "Menu" button ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  function closeMenu() {
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Close the menu when a link is chosen, when the user taps outside it, or presses Escape (fix for Test T02).
    primaryNav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('click', function (e) {
      if (primaryNav.classList.contains('is-open') && !primaryNav.contains(e.target)) { closeMenu(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) { closeMenu(); navToggle.focus(); }
    });
  }

  /* ---------- Header shadow, progress bar, back-to-top ---------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var backToTop = document.getElementById('backToTop');

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) { header.classList.toggle('is-scrolled', y > 10); }
    if (progress) { progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')'; }
    if (backToTop) { backToTop.classList.toggle('is-visible', y > 600); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backToTop) {
    backToTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Home: Find My Stay bar ---------- */
  var findStayForm = document.getElementById('findStayForm');
  if (findStayForm) {
    findStayForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var pkg = document.getElementById('fsPackage');
      var date = document.getElementById('fsDate');
      var error = document.getElementById('fsError');
      if (!pkg.value) {
        error.hidden = false;
        pkg.setAttribute('aria-invalid', 'true');
        pkg.focus();
        return;
      }
      error.hidden = true;
      pkg.removeAttribute('aria-invalid');
      if (pkg.value === 'help') { window.location.href = 'packages.html#find-my-stay'; return; }
      var url = 'packages.html?package=' + encodeURIComponent(pkg.value);
      if (date.value) { url += '&date=' + encodeURIComponent(date.value); }
      window.location.href = url + '#' + pkg.value;
    });
  }

  /* ---------- Packages: show the stay chosen in the Find My Stay bar ---------- */
  var params = new URLSearchParams(window.location.search);
  var staySelection = document.getElementById('staySelection');
  if (staySelection && params.get('package') && PACKAGE_NAMES[params.get('package')]) {
    var pkgKey = params.get('package');
    var card = document.getElementById(pkgKey);
    var dateText = params.get('date') ? ' from ' + formatDate(params.get('date')) : '';
    var enquireUrl = 'contact.html?package=' + encodeURIComponent(pkgKey) + (params.get('date') ? '&date=' + encodeURIComponent(params.get('date')) : '');
    staySelection.innerHTML = '<p>Showing ' + PACKAGE_NAMES[pkgKey] + dateText + '.</p><a class="btn btn-primary" href="' + enquireUrl + '">Enquire about this stay</a>';
    staySelection.hidden = false;
    if (card) {
      card.classList.add('is-highlighted');
      setTimeout(function () { card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }, 300);
    }
  }

  /* ---------- Facilities: tabs with a sliding underline ---------- */
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var tabIndicator = document.getElementById('tabIndicator');

  function moveIndicator(btn) {
    if (!tabIndicator) { return; }
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
      document.getElementById(btn.getAttribute('aria-controls')).hidden = !isActive;
      if (isActive) { moveIndicator(btn); }
    });
  }

  if (tabButtons.length) {
    tabButtons.forEach(function (btn, index) {
      btn.addEventListener('click', function () { activateTab(btn.id); btn.focus(); });
      // Left/Right arrow keys move between tabs (ARIA tabs pattern, fix for Test T12).
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var next = tabButtons[(index + (e.key === 'ArrowRight' ? 1 : tabButtons.length - 1)) % tabButtons.length];
          activateTab(next.id);
          next.focus();
        }
      });
    });
    activateTab(tabButtons[0].id);
    window.addEventListener('resize', function () { moveIndicator(document.querySelector('.tab-btn.is-active')); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { moveIndicator(document.querySelector('.tab-btn.is-active')); });
    }
  }

  /* ---------- Packages: Find My Stay advisor (two questions) ---------- */
  var advisorForm = document.getElementById('advisorForm');
  var advisorResult = document.getElementById('advisorResult');
  if (advisorForm) {
    advisorForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var length = advisorForm.querySelector('input[name="length"]:checked');
      var priority = advisorForm.querySelector('input[name="priority"]:checked');

      advisorResult.hidden = true;
      void advisorResult.offsetWidth;   // restart the pop-in animation
      advisorResult.hidden = false;

      if (!length || !priority) {
        advisorResult.textContent = 'Please answer both questions so we can recommend a package.';
        return;
      }
      var key;
      if (priority.value === 'custom') { key = 'custom'; }
      else if (length.value === 'short') { key = 'short-term'; }
      else if (priority.value === 'privacy') { key = 'premium'; }
      else { key = 'standard'; }

      var reasons = {
        'custom': 'your needs are best discussed directly with our team so we can arrange a corporate or accessible stay.',
        'short-term': 'a flexible 1 to 4 week booking with a furnished room and no long-term commitment.',
        'premium': 'a private studio with access to all facilities and weekly cleaning.',
        'standard': 'a private bedroom in a shared apartment, with co-working access at a lower cost.'
      };
      advisorResult.innerHTML = 'Recommended for you: ' + PACKAGE_NAMES[key] + ' &mdash; ' + reasons[key] +
        '<br><a class="text-link" href="#' + key + '">See ' + PACKAGE_NAMES[key] + ' details</a>';
    });
  }

  /* ---------- Contact: pre-fill from links and validate the enquiry form ---------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var formSuccess = document.getElementById('formSuccess');
    var errorSummary = document.getElementById('errorSummary');
    var errorList = document.getElementById('errorList');

    // Pre-fill from the Find My Stay bar or a package/custom link, e.g. contact.html?package=premium&date=2026-12-01
    if (params.get('package') && PACKAGE_NAMES[params.get('package')]) { document.getElementById('packageType').value = params.get('package'); }
    if (params.get('date')) { document.getElementById('moveIn').value = params.get('date'); }
    if (params.get('type')) { document.getElementById('enquiryType').value = params.get('type'); }

    var fields = [
      { input: document.getElementById('fullName'), error: document.getElementById('fullNameError'), label: 'Full name',
        validate: function (v) { return v.trim().length > 0; } },
      { input: document.getElementById('email'), error: document.getElementById('emailError'), label: 'Email address',
        validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      { input: document.getElementById('enquiryType'), error: document.getElementById('enquiryTypeError'), label: 'Enquiry type',
        validate: function (v) { return v !== ''; } },
      { input: document.getElementById('message'), error: document.getElementById('messageError'), label: 'Message',
        validate: function (v) { return v.trim().length >= 10; } }   // 10-character minimum (fix for Test T05)
    ];

    function validateField(field) {
      var ok = field.validate(field.input.value);
      field.error.hidden = ok;
      if (ok) { field.input.removeAttribute('aria-invalid'); } else { field.input.setAttribute('aria-invalid', 'true'); }
      return ok;
    }

    fields.forEach(function (field) {
      field.input.addEventListener('blur', function () { if (field.input.value) { validateField(field); } });
    });

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = fields.filter(function (f) { return !validateField(f); });
      formSuccess.hidden = true;

      if (invalid.length) {
        errorList.innerHTML = '';
        invalid.forEach(function (f) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + f.input.id;
          a.textContent = f.error.textContent.trim();
          a.addEventListener('click', function (ev) { ev.preventDefault(); f.input.focus(); });
          li.appendChild(a);
          errorList.appendChild(li);
        });
        errorSummary.hidden = false;
        invalid[0].input.focus();
        return;
      }

      errorSummary.hidden = true;
      formSuccess.hidden = false;
      contactForm.reset();
      fields.forEach(function (f) { f.error.hidden = true; f.input.removeAttribute('aria-invalid'); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('is-revealed');
          observer.unobserve(el);
          // Remove the stagger delay afterwards so hover effects respond instantly.
          setTimeout(function () { el.style.transitionDelay = ''; }, 1100);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) {
      var i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(i, 4) * 80 + 'ms';
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
  }
});
