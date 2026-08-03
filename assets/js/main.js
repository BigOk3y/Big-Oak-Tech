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

  // ---- Floating nav: appears once the hero has scrolled out of view ----
  var heroSection = document.getElementById('heroSection');
  var floatingNav = document.getElementById('floatingNav');
  if (heroSection && floatingNav && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          floatingNav.classList.remove('visible');
          document.body.classList.remove('hero-passed');
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
