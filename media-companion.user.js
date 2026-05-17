// ==UserScript==
// @name         Media "Streaming Locator" & Subtitle Matcher
// @namespace    https://violentmonkey.github.io/
// @match        *://*.imdb.com/title/tt*
// @match        *://*.letterboxd.com/film/*
// @run-at       document-idle
// @grant        none
// @version      1.0
// @description  A premium, high-utility companion panel for IMDb and Letterboxd that matches subtitles, locates streaming options (via JustWatch), searches trailers, and copies clean markdown tags.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/media-companion.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/media-companion.user.js
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'vm-media-companion-panel';
  const LS_REGION = 'vm-media-region';

  // ---------- Helper DOM builder ----------
  function el(tag, style, text, html) {
    const e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text) e.textContent = text;
    if (html) e.innerHTML = html;
    return e;
  }

  // ---------- Metadata Extraction ----------
  function getMovieMetadata() {
    const host = location.hostname;
    let title = '';
    let year = '';
    let imdbId = '';

    if (host.includes('imdb.com')) {
      // Extract IMDb ID
      const mId = location.href.match(/\/title\/(tt\d+)/i);
      if (mId) imdbId = mId[1];

      // Extract Title
      const titleEl = document.querySelector('[data-testid="hero__pageTitle"] h1') || 
                      document.querySelector('h1');
      title = titleEl ? titleEl.textContent.trim() : '';

      if (!title) {
        const meta = document.querySelector('meta[property="og:title"]');
        title = meta ? meta.content.replace(/ - IMDb$/i, '').trim() : '';
      }

      // Extract Year
      const yearEl = document.querySelector('[data-testid="hero-title-block__metadata"] li a') || 
                     document.querySelector('[data-testid="hero-title-block__metadata"] li');
      const yearMatch = yearEl ? yearEl.textContent.match(/\d{4}/) : null;
      if (yearMatch) {
        year = yearMatch[0];
      } else {
        const tMatch = title.match(/\((\d{4})\)/);
        if (tMatch) {
          year = tMatch[1];
          title = title.replace(/\(\d{4}\)/, '').trim();
        }
      }
    } else if (host.includes('letterboxd.com')) {
      // Extract IMDb ID from links
      const link = document.querySelector('a[href*="imdb.com/title/"]');
      const mId = link ? link.href.match(/tt\d+/) : null;
      if (mId) imdbId = mId[0];

      // Extract Title
      const titleEl = document.querySelector('#featured-film-header h1') || 
                      document.querySelector('.headline-1 h1') ||
                      document.querySelector('.headline-1');
      title = titleEl ? titleEl.textContent.trim() : '';

      // Extract Year
      const yearEl = document.querySelector('.releaseyear a') || 
                     document.querySelector('.releaseyear');
      year = yearEl ? yearEl.textContent.trim() : '';
    }

    return { title, year, imdbId };
  }

  // ---------- Injected Styles ----------
  function injectStyles() {
    if (document.getElementById('vm-companion-styles')) return;
    const style = document.createElement('style');
    style.id = 'vm-companion-styles';
    style.textContent = `
      .vm-comp-btn {
        background: #3e2264;
        color: #ebdff7;
        border: 1px solid #7047ab;
        border-radius: 6px;
        padding: 5px 10px;
        font-size: 11px;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
        text-decoration: none !important;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-weight: 500;
      }
      .vm-comp-btn:hover {
        background: #5a3a8a;
        color: #ffffff !important;
        border-color: #9d75da;
        box-shadow: 0 0 8px rgba(157, 117, 218, 0.4);
      }
      .vm-comp-btn-region {
        background: #1f1136;
        color: #cbb2eb;
        border: 1px solid #4a2d7a;
        border-radius: 4px;
        padding: 3px 6px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .vm-comp-btn-region:hover {
        background: #3e2264;
        color: #ffffff;
      }
      .vm-comp-btn-region.active {
        background: #9d75da;
        color: #0d0517;
        border-color: #9d75da;
        font-weight: bold;
      }
      .vm-comp-section {
        border-top: 1px solid #4a2d7a;
        padding-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- Clipboard Helper ----------
  function copyToClipboard(text, btn, originalText) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied! ✓';
      btn.style.borderColor = '#00f0ff';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.borderColor = '';
      }, 1500);
    }).catch(() => {
      alert('Failed to copy metadata');
    });
  }

  // ---------- Build Dashboard Panel ----------
  function buildPanel(meta) {
    if (document.getElementById(PANEL_ID)) return;

    const host = location.hostname;
    let target = null;

    if (host.includes('imdb.com')) {
      target = document.querySelector('.ipc-page-section--side-grid') || 
               document.querySelector('.title-overview-sidebar') || 
               document.querySelector('#main') || 
               document.body;
    } else if (host.includes('letterboxd.com')) {
      target = document.querySelector('#film-page-wrapper .sidebar') || 
               document.querySelector('.sidebar') || 
               document.body;
    }

    if (!target) return;

    injectStyles();

    // Deep Amethyst container
    const card = el('div', `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, #2b1845 0%, #11091d 100%);
      color: #f1ecf6;
      border: 1px solid #5a3a8a;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(90, 58, 138, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 100%;
      box-sizing: border-box;
    `);
    card.id = PANEL_ID;

    // Header
    const header = el('div', 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #4a2d7a;padding-bottom:8px;');
    header.appendChild(el('div', 'font-weight:bold;font-size:13px;color:#a882dd;display:flex;align-items:center;gap:6px;', '🔮 Media Companion'));
    
    // Cross-link
    if (meta.imdbId) {
      const crossLink = el('a', 'color:#a882dd;text-decoration:none;font-size:10px;font-weight:bold;', '');
      if (host.includes('imdb.com')) {
        crossLink.textContent = 'Letterboxd ↗';
        crossLink.href = `https://letterboxd.com/search/films/${encodeURIComponent(meta.title)}/`;
      } else {
        crossLink.textContent = 'IMDb ↗';
        crossLink.href = `https://www.imdb.com/title/${meta.imdbId}/`;
      }
      crossLink.target = '_blank';
      header.appendChild(crossLink);
    }
    card.appendChild(header);

    // Section 1: Streaming Locator (JustWatch)
    const streamSection = el('div', 'display:flex;flex-direction:column;gap:6px;');
    streamSection.className = 'vm-comp-section';
    streamSection.appendChild(el('div', 'font-weight:bold;color:#ebdff7;opacity:0.9;', 'Streaming Locator'));
    
    const jwControls = el('div', 'display:flex;justify-content:space-between;align-items:center;');
    jwControls.appendChild(el('span', 'opacity:0.7;font-size:11px;', 'Region:'));
    
    const regions = { us: 'US', uk: 'UK', ca: 'CA', de: 'DE' };
    const regionRow = el('div', 'display:flex;gap:4px;');
    
    let currentRegion = 'us';
    try {
      currentRegion = localStorage.getItem(LS_REGION) || 'us';
    } catch(e) {}

    const streamBtn = el('a', '', 'Locate Streams ↗');
    streamBtn.className = 'vm-comp-btn';
    streamBtn.target = '_blank';

    const updateStreamLink = () => {
      streamBtn.href = `https://www.justwatch.com/${currentRegion}/search?q=${encodeURIComponent(meta.title)}`;
    };

    Object.entries(regions).forEach(([code, label]) => {
      const btn = el('button', '', label);
      btn.className = `vm-comp-btn-region ${code === currentRegion ? 'active' : ''}`;
      btn.addEventListener('click', () => {
        currentRegion = code;
        regionRow.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        try { localStorage.setItem(LS_REGION, code); } catch(e) {}
        updateStreamLink();
      });
      regionRow.appendChild(btn);
    });

    jwControls.appendChild(regionRow);
    streamSection.appendChild(jwControls);
    updateStreamLink();
    streamSection.appendChild(streamBtn);
    card.appendChild(streamSection);

    // Section 2: Subtitle Matcher
    const subSection = el('div', 'display:flex;flex-direction:column;gap:6px;');
    subSection.className = 'vm-comp-section';
    subSection.appendChild(el('div', 'font-weight:bold;color:#ebdff7;opacity:0.9;', 'Subtitle Matcher'));

    const subGrid = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:6px;');
    
    // OpenSubtitles (IMDb ID matching for absolute accuracy)
    const btnOpenSub = el('a', '', 'OpenSubtitles ↗');
    btnOpenSub.className = 'vm-comp-btn';
    btnOpenSub.target = '_blank';
    if (meta.imdbId) {
      const digits = meta.imdbId.match(/\d+/)[0];
      btnOpenSub.href = `https://www.opensubtitles.org/en/search/sublanguageid-all/idmovie-${digits}`;
    } else {
      btnOpenSub.href = `https://www.opensubtitles.org/en/search2/sublanguageid-all/moviename-${encodeURIComponent(meta.title)}`;
    }
    
    // Subscene
    const btnSubscene = el('a', '', 'Subscene ↗');
    btnSubscene.className = 'vm-comp-btn';
    btnSubscene.target = '_blank';
    btnSubscene.href = `https://subscene.com/subtitles/searchbytitle?query=${encodeURIComponent(meta.title)}`;

    // YIFY Subtitles
    const btnYify = el('a', '', 'YIFY Subs ↗');
    btnYify.className = 'vm-comp-btn';
    btnYify.target = '_blank';
    btnYify.href = `https://yifysubtitles.org/search?q=${encodeURIComponent(meta.title)}`;

    subGrid.appendChild(btnOpenSub);
    subGrid.appendChild(btnSubscene);
    subGrid.appendChild(btnYify);
    subSection.appendChild(subGrid);
    card.appendChild(subSection);

    // Section 3: Alternates (Trailers & Safe Streams)
    const altSection = el('div', 'display:flex;flex-direction:column;gap:6px;');
    altSection.className = 'vm-comp-section';
    altSection.appendChild(el('div', 'font-weight:bold;color:#ebdff7;opacity:0.9;', 'Alternative Searches'));

    const altGrid = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:6px;');
    
    // YouTube Official Trailer
    const btnTrailer = el('a', '', 'Official Trailer ↗');
    btnTrailer.className = 'vm-comp-btn';
    btnTrailer.target = '_blank';
    btnTrailer.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(meta.title)}+${meta.year || ''}+official+trailer`;

    // Free Search Hook
    const btnFreeSearch = el('a', '', 'Search Streams ↗');
    btnFreeSearch.className = 'vm-comp-btn';
    btnFreeSearch.target = '_blank';
    btnFreeSearch.href = `https://duckduckgo.com/?q=watch+${encodeURIComponent(meta.title)}+${meta.year || ''}+online+free`;

    altGrid.appendChild(btnTrailer);
    altGrid.appendChild(btnFreeSearch);
    altSection.appendChild(altGrid);
    card.appendChild(altSection);

    // Section 4: Metadata Clipper
    const clipSection = el('div', 'display:flex;flex-direction:column;gap:6px;');
    clipSection.className = 'vm-comp-section';
    clipSection.appendChild(el('div', 'font-weight:bold;color:#ebdff7;opacity:0.9;', 'Metadata Clipper'));

    const clipGrid = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:6px;');
    
    // Copy Markdown Link
    const btnCopyMd = el('button', '', 'Copy MD Link');
    btnCopyMd.className = 'vm-comp-btn';
    const mdLink = `[${meta.title} (${meta.year || 'N/A'})](https://www.imdb.com/title/${meta.imdbId || ''})`;
    btnCopyMd.addEventListener('click', () => copyToClipboard(mdLink, btnCopyMd, 'Copy MD Link'));

    // Copy IDs
    const btnCopyMeta = el('button', '', 'Copy Title & ID');
    btnCopyMeta.className = 'vm-comp-btn';
    const metaString = `${meta.title} (${meta.year || 'N/A'}) - IMDb: ${meta.imdbId || 'N/A'}`;
    btnCopyMeta.addEventListener('click', () => copyToClipboard(metaString, btnCopyMeta, 'Copy Title & ID'));

    clipGrid.appendChild(btnCopyMd);
    clipGrid.appendChild(btnCopyMeta);
    clipSection.appendChild(clipGrid);
    card.appendChild(clipSection);

    // Injection placement
    if (host.includes('imdb.com')) {
      if (target.firstChild) {
        target.insertBefore(card, target.firstChild);
      } else {
        target.appendChild(card);
      }
    } else {
      // In Letterboxd inject inside poster container list
      const actions = target.querySelector('.js-actions-panel') || target;
      if (actions && actions.nextSibling) {
        actions.parentNode.insertBefore(card, actions.nextSibling);
      } else {
        target.appendChild(card);
      }
    }
  }

  // ---------- Execution Loop ----------
  function run() {
    const meta = getMovieMetadata();
    if (meta.title) {
      buildPanel(meta);
    }
  }

  // Start the engine
  run();

  // Handle single-page transitions on dynamic ajax loads
  window.addEventListener('popstate', () => setTimeout(run, 1500));
  document.addEventListener('click', () => setTimeout(run, 1500));

})();
