// ============================================================
// BIG OAK TECHNOLOGIES: Free Website Calculator
// Pure vanilla JS. No dependencies, no network calls.
// ============================================================

(function () {
  var form = document.getElementById('calcForm');
  if (!form) return;

  var resultsEl   = document.getElementById('calcResults');
  var emptyEl     = document.getElementById('calcEmpty');
  var statusEl    = document.getElementById('calcStatus');

  var visitsInput    = document.getElementById('calcVisits');
  var saleInput       = document.getElementById('calcSale');
  var rateInput       = document.getElementById('calcRate');
  var emailInput      = document.getElementById('calcEmail');
  var currencySelect  = document.getElementById('calcCurrency');

  // Symbol shown before each amount. This only changes how numbers are
  // labeled, not their value; the visitor enters their sale value in
  // whichever currency they pick, so no exchange-rate conversion is needed.
  var CURRENCY_SYMBOLS = {
    USD: '$', GBP: '\u00A3', EUR: '\u20AC', NGN: '\u20A6', QAR: 'QR',
    AED: 'AED', SAR: 'SAR', INR: '\u20B9', CAD: 'C$', AUD: 'A$', KES: 'KSh', ZAR: 'R'
  };

  // Industry-benchmark conversion rates used when the user has no
  // rate of their own. Conservative, source-able numbers rather than
  // invented ones: ~1.8% is a commonly cited average site conversion
  // rate; ~4.5% is a realistic ceiling for a conversion-optimized
  // funnel (clear CTA, fast load, follow-up system).
  var BASELINE_RATE = 0.018;
  var OPTIMIZED_RATE = 0.045;

  // Remembers the last computed figures so switching currency after
  // results are shown just relabels them instantly, no resubmit needed.
  var lastResult = null;

  function currentSymbol() {
    var code = currencySelect ? currencySelect.value : 'USD';
    return CURRENCY_SYMBOLS[code] || code || '$';
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

  function renderResults(animate) {
    if (!lastResult) return;
    var symbol = currentSymbol();
    var prefix = symbol + ' ';

    document.getElementById('rCurrentRate').textContent = lastResult.rateLabel;
    document.getElementById('rTargetRate').textContent = lastResult.targetRateLabel;

    if (animate) {
      animateValue(document.getElementById('rCurrentRevenue'), lastResult.currentMonthlyRevenue, prefix, '', 900);
      animateValue(document.getElementById('rPotentialRevenue'), lastResult.potentialMonthlyRevenue, prefix, '', 900);
      animateValue(document.getElementById('rMonthlyGap'), lastResult.monthlyGap, prefix, '', 1100);
      animateValue(document.getElementById('rAnnualGap'), lastResult.annualGap, prefix, '', 1300);
    } else {
      document.getElementById('rCurrentRevenue').textContent = prefix + formatNumber(lastResult.currentMonthlyRevenue);
      document.getElementById('rPotentialRevenue').textContent = prefix + formatNumber(lastResult.potentialMonthlyRevenue);
      document.getElementById('rMonthlyGap').textContent = prefix + formatNumber(lastResult.monthlyGap);
      document.getElementById('rAnnualGap').textContent = prefix + formatNumber(lastResult.annualGap);
    }

    document.getElementById('rSourceNote').textContent = lastResult.sourceNote;

    var waBtn = document.getElementById('calcWaBtn');
    if (waBtn) {
      var waText = 'Hi Big Oak Technologies, I just ran the revenue calculator.'
        + '\nEmail: ' + lastResult.email
        + '\nMonthly visits: ' + Math.round(lastResult.visits)
        + '\nAvg sale value: ' + symbol + ' ' + Math.round(lastResult.avgSale)
        + '\nEstimated annual revenue left on the table: ' + symbol + ' ' + formatNumber(lastResult.annualGap);
      waBtn.href = 'https://wa.me/97474089629?text=' + encodeURIComponent(waText);
      waBtn.style.display = 'inline-flex';
    }
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
    // A visitor's site can't out-convert the optimized benchmark in this model.
    // If they're already above it, use their own rate as the floor for "current".
    var targetRateDec = Math.max(OPTIMIZED_RATE, currentRateDec + 0.02);

    var currentMonthlySales = visits * currentRateDec;
    var potentialMonthlySales = visits * targetRateDec;

    var currentMonthlyRevenue = currentMonthlySales * avgSale;
    var potentialMonthlyRevenue = potentialMonthlySales * avgSale;

    var monthlyGap = Math.max(potentialMonthlyRevenue - currentMonthlyRevenue, 0);
    var annualGap = monthlyGap * 12;

    lastResult = {
      visits: visits,
      avgSale: avgSale,
      email: email,
      currentMonthlyRevenue: currentMonthlyRevenue,
      potentialMonthlyRevenue: potentialMonthlyRevenue,
      monthlyGap: monthlyGap,
      annualGap: annualGap,
      rateLabel: usingDefaultRate ? (currentRate.toFixed(1) + '% (industry avg.)') : (currentRate.toFixed(1) + '%'),
      targetRateLabel: (targetRateDec * 100).toFixed(1) + '%',
      sourceNote: usingDefaultRate
        ? 'Based on an industry-average visitor-to-customer rate of ' + (BASELINE_RATE * 100).toFixed(1) + '% since you didn\u2019t enter your own.'
        : 'Based on the rate you entered.'
    };

    if (emptyEl) emptyEl.style.display = 'none';
    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    renderResults(true);
  });

  // Switching currency after results are shown just relabels the same
  // numbers instantly, no need to resubmit the form.
  if (currencySelect) {
    currencySelect.addEventListener('change', function () {
      if (lastResult && resultsEl.style.display === 'block') {
        renderResults(false);
      }
    });
  }

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
