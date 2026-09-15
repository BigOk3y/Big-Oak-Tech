// ============================================================
// BIG OAK TECHNOLOGIES: shared site behavior (vanilla JS, no deps)
// ============================================================

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {

  // ---- Portfolio previews: show the screenshot as soon as it's ready.
  // If a screenshot file is missing, fall back to the live site in an
  // iframe, loaded a little before the card scrolls into view. ----
  function markReady(el) {
    el.classList.add('is-loaded');
    if (el.parentNode) el.parentNode.classList.add('is-ready');
  }
  function loadLive(iframe) {
    if (iframe.src) return;
    iframe.addEventListener('load', function () { markReady(iframe); });
    iframe.src = iframe.getAttribute('data-src');
  }
  var liveObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { loadLive(entry.target); liveObserver.unobserve(entry.target); }
    });
  }, { rootMargin: '1200px 0px' }) : null;
  function fallBackToLive(img) {
    var live = img.getAttribute('data-live');
    if (!live || !img.parentNode) return;
    var iframe = document.createElement('iframe');
    iframe.setAttribute('data-src', live);
    iframe.setAttribute('title', 'Live preview');
    iframe.setAttribute('tabindex', '-1');
    img.parentNode.replaceChild(iframe, img);
    if (liveObserver) liveObserver.observe(iframe); else loadLive(iframe);
  }
  document.querySelectorAll('img.portfolio-shot').forEach(function (img) {
    if (img.complete) {
      if (img.naturalWidth > 0) markReady(img); else fallBackToLive(img);
    } else {
      img.addEventListener('load', function () { markReady(img); });
      img.addEventListener('error', function () { fallBackToLive(img); });
    }
  });

  // ---- Mobile menu toggle ----
  var toggle = document.querySelector('.top-nav-toggle');
  var mobileMenu = document.querySelector('.top-nav-mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileMenu.classList.remove('open'); });
    });
  }

  // ---- Scroll reveal ----
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Lead form -> WhatsApp handoff ----
  var form = document.getElementById('leadForm');
  if (form) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('name') || {}).value || '';
      var phone = (document.getElementById('phone') || {}).value || '';
      var service = (document.getElementById('service') || {}).value || '';
      var msg = (document.getElementById('msg') || {}).value || '';

      var text = 'Hi Big Oak Technologies, my name is ' + name.trim() + '.'
        + '\nPhone: ' + phone.trim()
        + '\nInterested in: ' + service
        + '\nNotes: ' + (msg.trim() || 'N/A');

      var waLink = 'https://wa.me/97474089629?text=' + encodeURIComponent(text);

      if (status) status.style.display = 'block';
      window.open(waLink, '_blank');
    });
  }

  // ---- Floating nav: hamburger panel on mobile ----
  var floatToggle = document.querySelector('.floating-nav-toggle');
  var floatNavEl = document.getElementById('floatingNav');
  function closeFloatingMenu() {
    if (!floatNavEl || !floatToggle) return;
    floatNavEl.classList.remove('menu-open');
    floatToggle.setAttribute('aria-expanded', 'false');
  }
  if (floatToggle && floatNavEl) {
    floatToggle.addEventListener('click', function () {
      var open = floatNavEl.classList.toggle('menu-open');
      floatToggle.setAttribute('aria-expanded', String(open));
    });
    floatNavEl.querySelectorAll('.floating-nav-links a').forEach(function (a) {
      a.addEventListener('click', closeFloatingMenu);
    });
    document.addEventListener('click', function (e) {
      if (!floatNavEl.contains(e.target)) closeFloatingMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeFloatingMenu();
    });
  }

  // Escape closes whichever menu is open
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeFloatingMenu();
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    }
  });

  // ---- Hero video: respect reduced motion, pause when off screen ----
  var heroVideo = document.querySelector('.hero-video video');
  if (heroVideo) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else {
      heroVideo.muted = true; // required for autoplay on iOS
      var tryPlay = function () { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); };
      tryPlay();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) tryPlay(); else heroVideo.pause();
          });
        }, { threshold: 0 }).observe(heroVideo);
      }
    }
  }

  // ---- Floating nav: appears once the hero has scrolled out of view ----
  var heroSection = document.getElementById('heroSection');
  var floatingNav = document.getElementById('floatingNav');
  if (heroSection && floatingNav && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          floatingNav.classList.remove('visible');
          document.body.classList.remove('hero-passed');
          closeFloatingMenu();
        } else if (entry.boundingClientRect.top < 0) {
          // Hero has scrolled up and out of view (not "not yet scrolled to").
          floatingNav.classList.add('visible');
          document.body.classList.add('hero-passed');
        }
      });
    }, { threshold: 0 });
    navObserver.observe(heroSection);
  }

});
