// ==UserScript==
// @name         YouTube Minimal Info Panel
// @namespace    https://violentmonkey.github.io/
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// @version      1.5
// @description  Replaces YouTube's comment/recommendation area with a clean info panel showing channel, exact view count, likes, dislikes, publish date, duration, and tags.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/yt-info-panel.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/yt-info-panel.user.js
// ==/UserScript==
(function () {
  'use strict';
  const TAG = '[YT Info Panel]';
  const PANEL_ID = 'vm-yt-info-panel';
  console.log(TAG, 'script loaded on', location.href);
  const fmtNum = n => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString();
  const fmtDate = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const full = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    const rel = days < 1 ? 'today'
      : days < 30 ? `${days} day${days === 1 ? '' : 's'} ago`
        : days < 365 ? `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`
          : `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? '' : 's'} ago`;
    return `${full} (${rel})`;
  };
  const fmtDur = s => {
    if (!s) return '—';
    s = Number(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  };

  function getData() {
    const urlId = new URLSearchParams(window.location.search).get('v');
    if (!urlId) return null;

    const pr = document.querySelector('ytd-watch-flexy')?.playerResponse || window.ytInitialPlayerResponse;
    if (!pr?.videoDetails || pr.videoDetails.videoId !== urlId) return null;

    const v = pr.videoDetails;
    const mf = pr.microformat?.playerMicroformatRenderer;
    return {
      videoId: v.videoId,
      title: v.title, 
      channel: v.author, 
      channelId: v.channelId,
      views: v.viewCount,
      duration: v.lengthSeconds, 
      isLive: v.isLiveContent,
      publishDate: mf?.publishDate, 
      category: mf?.category,
      keywords: v.keywords || []
    };
  }

  function getLikes() {
    const btn = document.querySelector('like-button-view-model button, ytd-toggle-button-renderer #button');
    if (!btn) return null;
    const label = btn.getAttribute('aria-label') || btn.title || '';
    const m = label.match(/[\d,.]+\s*(?:K|M|B)?/i);
    return m ? m[0].trim() : null;
  }
  async function updateDislikes(videoId, targetEl) {
    try {
      const r = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
      const d = await r.json();
      if (d && d.dislikes != null) targetEl.textContent = fmtNum(d.dislikes);
    } catch (e) { console.error(TAG, 'dislike fetch failed', e); }
  }
  function el(tag, styles, text) {
    const e = document.createElement(tag);
    if (styles) e.style.cssText = styles;
    if (text != null) e.textContent = text;
    return e;
  }
  function build(data) {
    const wrap = el('div', `
      margin: 16px 0 24px !important;
      padding: 16px 20px !important;
      background: #1a1a1a !important;
      border: 3px solid #ff4444 !important;
      border-radius: 12px !important;
      color: #f1f1f1 !important;
      font-family: "Roboto","Arial",sans-serif !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      display: block !important;
      position: relative !important;
      z-index: 9999 !important;
    `);
    wrap.id = PANEL_ID;
    wrap.appendChild(el('div', 'font-size:12px;opacity:.5;margin-bottom:8px;', '★ YT INFO PANEL (userscript)'));
    wrap.appendChild(el('div', 'font-size:18px;font-weight:600;margin-bottom:12px;', data.title || ''));
    
    const grid = el('div', 'display:grid;grid-template-columns:max-content 1fr;gap:6px 18px;');
    const rows = [
      ['Channel', data.channel || '—'],
      ['Views', fmtNum(data.views)],
      ['Likes', getLikes() ?? '—'],
      ['Dislikes', 'fetching...'],
      ['Published', fmtDate(data.publishDate)],
      ['Duration', fmtDur(data.duration) + (data.isLive ? ' (live)' : '')],
      ['Category', data.category || '—'],
    ];

    for (const [k, v] of rows) {
      grid.appendChild(el('div', 'opacity:.65', k));
      const valEl = el('div', '', '');
      
      if (k === 'Channel' && data.channelId) {
        const link = el('a', 'color:#3ea6ff;text-decoration:none;font-weight:500;', v);
        link.href = `/channel/${data.channelId}`;
        link.target = '_blank';
        valEl.appendChild(link);
      } else {
        valEl.textContent = v;
      }
      
      grid.appendChild(valEl);
      if (k === 'Dislikes') updateDislikes(data.videoId, valEl);
    }
    
    wrap.appendChild(grid);
    if (data.keywords.length) {
      wrap.appendChild(el('div',
        'margin-top:12px;opacity:.65;font-size:12px;',
        data.keywords.slice(0, 8).join(' · ')));
    }
    return wrap;
  }
  function inject() {
    if (location.pathname !== '/watch') return true;
    const data = getData();
    if (!data) return false;
    document.getElementById(PANEL_ID)?.remove();
    const anchors = [
      () => document.querySelector('#primary-inner #player'),
      () => document.querySelector('#player-container-outer'),
      () => document.querySelector('ytd-watch-flexy #primary'),
      () => document.querySelector('#below'),
    ];
    for (const find of anchors) {
      const a = find();
      if (a && a.parentNode) {
        a.insertAdjacentElement('afterend', build(data));
        console.log(TAG, 'inserted after', a);
        return true;
      }
    }
    return false;
  }
  function tryInject(tries = 40) {
    try {
      if (inject()) return;
    } catch (e) { console.error(TAG, 'inject threw', e); }
    if (tries > 0) setTimeout(() => tryInject(tries - 1), 300);
  }
  tryInject();
  document.addEventListener('yt-navigate-finish', () => { console.log(TAG, 'yt-navigate-finish'); tryInject(); });
})();
