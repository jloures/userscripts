// ==UserScript==
// @name         Amazon Price History & Dark-Pattern Sanitizer
// @namespace    https://violentmonkey.github.io/
// @match        https://*.amazon.com/*
// @match        https://*.amazon.co.uk/*
// @match        https://*.amazon.ca/*
// @match        https://*.amazon.de/*
// @match        https://*.amazon.fr/*
// @match        https://*.amazon.es/*
// @match        https://*.amazon.it/*
// @match        https://*.amazon.co.jp/*
// @run-at       document-idle
// @grant        none
// @version      1.0
// @description  Cleans up Amazon product pages by sanitizing dark patterns (fake urgency, pre-selected subscriptions, sponsored spam) and injecting beautiful CamelCamelCamel price history charts.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/amazon-sanitizer.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/amazon-sanitizer.user.js
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'vm-amazon-sanitizer-panel';
  const LS_DECLUTTER = 'vm-amazon-declutter';

  // ---------- Helper DOM builder ----------
  function el(tag, style, text, html) {
    const e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text) e.textContent = text;
    if (html) e.innerHTML = html;
    return e;
  }

  // ---------- ASIN Extractor ----------
  function getASIN() {
    const m = location.href.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (m) return m[2].toUpperCase();
    const input = document.getElementById('ASIN');
    if (input && input.value) return input.value.toUpperCase();
    const urlParams = new URLSearchParams(location.search);
    const asinParam = urlParams.get('asin');
    if (asinParam) return asinParam.toUpperCase();
    return null;
  }

  // ---------- Locale Mapper ----------
  function getLocale() {
    const host = location.hostname;
    if (host.endsWith('amazon.co.uk')) return 'uk';
    if (host.endsWith('amazon.ca')) return 'ca';
    if (host.endsWith('amazon.de')) return 'de';
    if (host.endsWith('amazon.fr')) return 'fr';
    if (host.endsWith('amazon.es')) return 'es';
    if (host.endsWith('amazon.it')) return 'it';
    if (host.endsWith('amazon.co.jp')) return 'jp';
    return 'us';
  }

  // ---------- Injected Styles ----------
  function injectStyles() {
    if (document.getElementById('vm-sanitizer-styles')) return;
    const style = document.createElement('style');
    style.id = 'vm-sanitizer-styles';
    style.textContent = `
      @keyframes vm-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .vm-shimmer-bg {
        background: linear-gradient(90deg, #131a26 25%, #25334d 50%, #131a26 75%);
        background-size: 200% 100%;
        animation: vm-shimmer 1.5s infinite linear;
      }
      .vm-btn {
        background: #1b263b;
        color: #e0e1dd;
        border: 1px solid #415a77;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      }
      .vm-btn:hover {
        background: #415a77;
        color: #ffffff;
      }
      .vm-btn.active {
        background: #00b4d8;
        color: #0d1b2a;
        border-color: #00b4d8;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- De-clutter Mode ----------
  let declutterStyle = null;
  function setDeclutter(active) {
    if (active) {
      if (!declutterStyle) {
        declutterStyle = document.createElement('style');
        declutterStyle.id = 'vm-amazon-declutter-style';
        declutterStyle.textContent = `
          #sponsoredProducts2_feature_div,
          #sponsoredProducts_feature_div,
          .sp_desktop,
          div[id^="spa-"],
          #shoppingAdCreative,
          .ad-placeholder,
          iframe[id^="ape_"],
          div[class*="sponsored-products"],
          #hqp-container,
          #premium-beauty-widget_feature_div,
          #ape_Detail_hero-quick-promo_placement,
          #combinedBuyBox_feature_div div[class*="sponsored"],
          .a-carousel-container[class*="sponsored"],
          #gr-hover-container {
            display: none !important;
          }
        `;
        document.head.appendChild(declutterStyle);
      }
    } else {
      if (declutterStyle) {
        declutterStyle.remove();
        declutterStyle = null;
      }
    }
    try { localStorage.setItem(LS_DECLUTTER, active ? 'true' : 'false'); } catch (e) { }
  }

  // ---------- Scarcity Sanitizer ----------
  function sanitizeScarcity() {
    const elements = document.querySelectorAll(
      '#availability span, #fastTrack_feature_div, .fastTrack-urgency, #dealBadge, #dealCountdown, .deal-countdown'
    );
    elements.forEach(element => {
      const txt = element.textContent.toLowerCase();
      if (txt.includes('left in stock') || txt.includes('order soon') || txt.includes('order within') || txt.includes('only')) {
        element.style.opacity = '0.55';
        element.style.transition = 'opacity 0.2s';
        element.addEventListener('mouseenter', () => element.style.opacity = '1');
        element.addEventListener('mouseleave', () => element.style.opacity = '0.55');

        if (!element.dataset.scarcityFlagged) {
          element.dataset.scarcityFlagged = 'true';
          const badge = el('span', 'color:#ff6b6b;font-size:10px;font-weight:bold;margin-left:6px;', ' [Scarcity Tactic] ');
          element.appendChild(badge);
        }
      }
    });
  }

  // ---------- Subscription Safeguard ----------
  function checkSubscriptionTrap(notifyFn) {
    const subRow = document.getElementById('subscribeAndSaveAccordionRow');
    const oneTimeRow = document.getElementById('newAccordionRow');

    if (subRow && subRow.classList.contains('accordion-row-active')) {
      subRow.style.border = '2px dashed #ff9f43';
      subRow.style.borderRadius = '8px';
      subRow.style.padding = '6px';

      if (oneTimeRow && !window.amazonSanitizerSwitched) {
        window.amazonSanitizerSwitched = true;
        const oneTimeButton = oneTimeRow.querySelector('a, input[type="radio"], .a-accordion-row-a');
        if (oneTimeButton) {
          oneTimeButton.click();
          if (notifyFn) notifyFn('⚠️ Subscription trap bypassed! Switched to One-Time Purchase.');
        }
      }
    }
  }

  // ---------- Main Panel Render ----------
  function buildPanel(asin, locale) {
    if (document.getElementById(PANEL_ID)) return;

    const target = document.getElementById('rightCol') ||
      document.getElementById('buybox_feature_div') ||
      document.getElementById('corePrice_feature_div') ||
      document.getElementById('centerCol');
    if (!target) return;

    injectStyles();

    const card = el('div', `
      margin: 14px 0;
      padding: 16px;
      background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
      color: #e0e1dd;
      border: 1px solid #415a77;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `);
    card.id = PANEL_ID;

    // Header
    const header = el('div', 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #415a77;padding-bottom:8px;');
    header.appendChild(el('div', 'font-weight:bold;font-size:13px;color:#00b4d8;display:flex;align-items:center;gap:6px;', '🛡️ Product Sanitizer'));

    const cccLink = el('a', 'color:#00b4d8;text-decoration:none;font-size:11px;font-weight:bold;', 'CamelCamelCamel ↗');
    cccLink.href = `https://camelcamelcamel.com/product/${asin}`;
    cccLink.target = '_blank';
    header.appendChild(cccLink);
    card.appendChild(header);

    // Notification Area
    const notification = el('div', 'font-size:11px;color:#ff9f43;font-weight:bold;display:none;');
    card.appendChild(notification);
    const notify = (msg) => {
      notification.textContent = msg;
      notification.style.display = 'block';
    };

    // Chart Area
    const chartWrapper = el('div', 'width:100%;height:180px;border-radius:8px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#131a26;');
    const shimmer = el('div', 'position:absolute;top:0;left:0;width:100%;height:100%;');
    shimmer.className = 'vm-shimmer-bg';
    chartWrapper.appendChild(shimmer);

    const chartImg = el('img', 'width:100%;height:100%;object-fit:contain;z-index:2;display:none;cursor:pointer;');
    chartImg.title = 'Click to zoom price chart';
    chartImg.addEventListener('click', () => {
      window.open(chartImg.src, '_blank');
    });
    chartImg.addEventListener('load', () => {
      shimmer.style.display = 'none';
      chartImg.style.display = 'block';
    });
    chartImg.addEventListener('error', () => {
      shimmer.style.display = 'none';
      chartWrapper.appendChild(el('div', 'color:#ff6b6b;font-size:11px;', 'Price history unavailable for this item'));
    });
    chartWrapper.appendChild(chartImg);
    card.appendChild(chartWrapper);

    // Filter Buttons
    let currentType = 'amazon';
    let currentPeriod = 'all';

    function updateChart() {
      shimmer.style.display = 'block';
      chartImg.style.display = 'none';
      const suffix = currentType === 'amazon' ? 'amazon-new' : (currentType === 'new' ? 'new' : 'used');
      chartImg.src = `https://charts.camelcamelcamel.com/${locale}/${asin}/${suffix}.png?force=1&zero=0&w=500&h=300&desired=false&legend=1&ilt=1&tp=${currentPeriod}&fo=0&lang=en`;
    }

    const controls = el('div', 'display:flex;flex-direction:column;gap:8px;');

    // Row 1: Source
    const sourceRow = el('div', 'display:flex;gap:6px;align-items:center;');
    sourceRow.appendChild(el('span', 'opacity:0.7;width:50px;', 'Source:'));
    const btnAmazon = el('button', '', 'Amazon');
    const btnNew = el('button', '', '3rd New');
    const btnUsed = el('button', '', '3rd Used');

    btnAmazon.className = 'vm-btn active';
    btnNew.className = 'vm-btn';
    btnUsed.className = 'vm-btn';

    const setSource = (type, btn) => {
      currentType = type;
      [btnAmazon, btnNew, btnUsed].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateChart();
    };

    btnAmazon.addEventListener('click', () => setSource('amazon', btnAmazon));
    btnNew.addEventListener('click', () => setSource('new', btnNew));
    btnUsed.addEventListener('click', () => setSource('used', btnUsed));

    sourceRow.appendChild(btnAmazon);
    sourceRow.appendChild(btnNew);
    sourceRow.appendChild(btnUsed);
    controls.appendChild(sourceRow);

    // Row 2: Period
    const periodRow = el('div', 'display:flex;gap:6px;align-items:center;');
    periodRow.appendChild(el('span', 'opacity:0.7;width:50px;', 'Period:'));
    const btn1M = el('button', '', '1 Month');
    const btn3M = el('button', '', '3 Months');
    const btnAll = el('button', '', 'All Time');

    btn1M.className = 'vm-btn';
    btn3M.className = 'vm-btn';
    btnAll.className = 'vm-btn active';

    const setPeriod = (period, btn) => {
      currentPeriod = period;
      [btn1M, btn3M, btnAll].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateChart();
    };

    btn1M.addEventListener('click', () => setPeriod('1m', btn1M));
    btn3M.addEventListener('click', () => setPeriod('3m', btn3M));
    btnAll.addEventListener('click', () => setPeriod('all', btnAll));

    periodRow.appendChild(btn1M);
    periodRow.appendChild(btn3M);
    periodRow.appendChild(btnAll);
    controls.appendChild(periodRow);

    card.appendChild(controls);

    // Declutter Toggle Row
    const declutterRow = el('div', 'display:flex;justify-content:space-between;align-items:center;border-top:1px solid #415a77;padding-top:10px;');
    declutterRow.appendChild(el('span', 'font-weight:bold;opacity:0.9;', 'Hide Sponsored Clutter'));

    const checkbox = el('input', 'cursor:pointer;');
    checkbox.type = 'checkbox';

    let isDeclutterActive = false;
    try {
      isDeclutterActive = localStorage.getItem(LS_DECLUTTER) === 'true';
    } catch (e) { }

    checkbox.checked = isDeclutterActive;
    setDeclutter(isDeclutterActive);

    checkbox.addEventListener('change', (e) => {
      setDeclutter(e.target.checked);
    });
    declutterRow.appendChild(checkbox);
    card.appendChild(declutterRow);

    // Append to target page block
    if (target.firstChild) {
      target.insertBefore(card, target.firstChild);
    } else {
      target.appendChild(card);
    }

    updateChart();

    // Initial Safeguard Run
    checkSubscriptionTrap(notify);
  }

  // ---------- Execution Loop ----------
  function run() {
    const asin = getASIN();
    const locale = getLocale();

    if (asin) {
      buildPanel(asin, locale);
      sanitizeScarcity();

      // Periodically scan for dynamic loaded trap states & scarcity elements
      setInterval(() => {
        sanitizeScarcity();
        const notification = document.querySelector(`#${PANEL_ID} div[style*="color:#ff9f43"]`);
        checkSubscriptionTrap(msg => {
          if (notification) {
            notification.textContent = msg;
            notification.style.display = 'block';
          }
        });
      }, 2000);
    }
  }

  // Start the engine
  run();

  // Listen to single-page navigation shifts if user clicks variants
  window.addEventListener('popstate', () => setTimeout(run, 1500));
  document.addEventListener('click', () => setTimeout(run, 1500));

})();
