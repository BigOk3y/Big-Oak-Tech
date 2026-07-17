// ============================================================
// BIG OAK TECHNOLOGIES — Revenue Leak Calculator
// Pure vanilla JS. No dependencies, no network calls.
// ============================================================

(function () {
  var form = document.getElementById('calcForm');
  if (!form) return;

  var resultsEl   = document.getElementById('calcResults');
  var emptyEl     = document.getElementById('calcEmpty');
  var statusEl    = document.getElementById('calcStatus');

  var visitsInput = document.getElementById('calcVisits');
  var saleInput   = document.getElementById('calcSale');
  var rateInput   = document.getElementById('calcRate');
  var emailInput  = document.getElementById('calcEmail');

  // Industry-benchmark conversion rates used when the user has no
  // rate of their own. Conservative, source-able numbers rather than
  // invented ones: ~1.8% is a commonly cited average site conversion
  // rate; ~4.5% is a realistic ceiling for a conversion-optimized
  // funnel (clear CTA, fast load, follow-up system).
  var BASELINE_RATE = 0.018;
  var OPTIMIZED_RATE = 0.045;

  function formatCurrency(n) {
    n = Math.round(n);
    return 'QR ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatNumber(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function clampPercent(v) {
    if (isNaN(v) || v < 0) return null;
    if (v > 100) return 100;
    return v;
  }

  function animateValue(el, end, prefix, suffix, duration) {
    var start = 0;
    var startTime = null;
    prefix = prefix || '';
    suffix = suffix || '';
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (end - start) * eased;
      el.textContent = prefix + formatNumber(current) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + formatNumber(end) + suffix;
    }
    requestAnimationFrame(step);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var visits = parseFloat(visitsInput.value);
    var avgSale = parseFloat(saleInput.value);
    var userRateRaw = rateInput.value.trim();
    var email = emailInput.value.trim();

    if (!visits || visits <= 0 || !avgSale || avgSale <= 0 || !email) {
      statusEl.textContent = 'Enter your email, monthly visits, and average sale value to see your numbers.';
      statusEl.style.display = 'block';
      return;
    }
    statusEl.style.display = 'none';

    var currentRate = clampPercent(parseFloat(userRateRaw));
    var usingDefaultRate = currentRate === null;
    if (usingDefaultRate) currentRate = BASELINE_RATE * 100;

    var currentRateDec = currentRate / 100;
    // A visitor's site can't out-convert the optimized benchmark in this model —
    // if they're already above it, use their own rate as the floor for "current".
    var targetRateDec = Math.max(OPTIMIZED_RATE, currentRateDec + 0.02);

    var currentMonthlySales = visits * currentRateDec;
    var potentialMonthlySales = visits * targetRateDec;

    var currentMonthlyRevenue = currentMonthlySales * avgSale;
    var potentialMonthlyRevenue = potentialMonthlySales * avgSale;

    var monthlyGap = Math.max(potentialMonthlyRevenue - currentMonthlyRevenue, 0);
    var annualGap = monthlyGap * 12;

    // Populate results
    document.getElementById('rCurrentRate').textContent = currentRateDec === BASELINE_RATE ? (currentRate.toFixed(1) + '% (industry avg.)') : (currentRate.toFixed(1) + '%');
    document.getElementById('rTargetRate').textContent = (targetRateDec * 100).toFixed(1) + '%';

    animateValue(document.getElementById('rCurrentRevenue'), currentMonthlyRevenue, 'QR ', '', 900);
    animateValue(document.getElementById('rPotentialRevenue'), potentialMonthlyRevenue, 'QR ', '', 900);
    animateValue(document.getElementById('rMonthlyGap'), monthlyGap, 'QR ', '', 1100);
    animateValue(document.getElementById('rAnnualGap'), annualGap, 'QR ', '', 1300);

    document.getElementById('rSourceNote').textContent = usingDefaultRate
      ? 'Based on an industry-average conversion rate of ' + (BASELINE_RATE * 100).toFixed(1) + '% since you didn\u2019t enter your own.'
      : 'Based on the conversion rate you entered.';

    if (emptyEl) emptyEl.style.display = 'none';
    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Fire-and-forget WhatsApp handoff with the lead's numbers so the
    // sales team can follow up with context already in hand.
    var waText = 'Hi Big Oak Technologies, I just ran the revenue calculator.'
      + '%0AEmail: ' + email
      + '%0AMonthly visits: ' + Math.round(visits)
      + '%0AAvg sale value: QR ' + Math.round(avgSale)
      + '%0AEstimated annual revenue left on the table: QR ' + Math.round(annualGap).toLocaleString();

    var waBtn = document.getElementById('calcWaBtn');
    if (waBtn) {
      waBtn.href = 'https://wa.me/9740000000?text=' + waText;
      waBtn.style.display = 'inline-flex';
    }
  });

  // Live-update the little conversion-rate hint as the user types
  if (rateInput) {
    rateInput.addEventListener('input', function () {
      var hint = document.getElementById('calcRateHint');
      if (!hint) return;
      var v = clampPercent(parseFloat(rateInput.value));
      hint.textContent = rateInput.value.trim() === ''
        ? 'Leave blank to use the industry average (1.8%).'
        : (v === null ? 'Enter a number between 0 and 100.' : '');
    });
  }
})();
