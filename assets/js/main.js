// ============================================================
// BIG OAK TECHNOLOGIES: shared site behavior (vanilla JS, no deps)
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ---- Mobile menu toggle ----
  var toggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
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

  // ---- Hero core: mouse-follow tilt, touch support, click burst ----
  var heroVisual = document.querySelector('.hero-visual');
  var coreWrap = document.querySelector('.core-wrap');
  var corePulse = document.querySelector('.core-pulse');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroVisual && coreWrap && !reduceMotion) {
    var baseX = 20, baseY = -15, maxTilt = 14;

    function applyTilt(clientX, clientY, hovering) {
      var rect = heroVisual.getBoundingClientRect();
      var relX = (clientX - rect.left) / rect.width;
      var relY = (clientY - rect.top) / rect.height;
      var tiltY = (relX - 0.5) * maxTilt * 2;
      var tiltX = (0.5 - relY) * maxTilt * 2;
      var scale = hovering ? 1.06 : 1;
      coreWrap.style.transform = 'rotateX(' + (baseX + tiltX) + 'deg) rotateY(' + (baseY + tiltY) + 'deg) scale(' + scale + ')';
    }
    function resetTilt() {
      coreWrap.style.transform = 'rotateX(' + baseX + 'deg) rotateY(' + baseY + 'deg) scale(1)';
    }

    heroVisual.addEventListener('mousemove', function (e) {
      applyTilt(e.clientX, e.clientY, true);
    });
    heroVisual.addEventListener('mouseleave', resetTilt);

    heroVisual.addEventListener('touchmove', function (e) {
      if (!e.touches || !e.touches[0]) return;
      applyTilt(e.touches[0].clientX, e.touches[0].clientY, true);
    }, { passive: true });
    heroVisual.addEventListener('touchend', resetTilt);

    heroVisual.addEventListener('click', function () {
      if (!corePulse) return;
      corePulse.classList.remove('burst');
      // force reflow so the animation can restart if clicked again quickly
      void corePulse.offsetWidth;
      corePulse.classList.add('burst');
      setTimeout(function () { corePulse.classList.remove('burst'); }, 650);
    });
  }

});
