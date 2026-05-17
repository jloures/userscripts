// ==UserScript==
// @name         YouTube Minimal Info Panel
// @namespace    https://violentmonkey.github.io/
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-idle
// @grant        none
// @version      2.5
// @description  Clean info panel: channel, views, likes/dislikes, ratio bar, engagement, chapters, speed boost (>2x), SponsorBlock, thumbnails, alt frontends, expandable description.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/yt-info-panel.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/yt-info-panel.user.js
// ==/UserScript==
(function () {
  'use strict';
  const TAG = '[YT Info Panel]';
  const PANEL_ID = 'vm-yt-info-panel';
  const LS_COLLAPSED = 'vm-yt-info-panel:collapsed';
  const LS_THEME = 'vm-yt-info-panel:theme';
  const IS_MOBILE = location.hostname === 'm.youtube.com';

  const THEMES = {
    default: { name: 'Default', vars: { '--vm-bg': '#1a1a1a', '--vm-text': '#f1f1f1', '--vm-border': '#ff4444', '--vm-btn-bg': '#2a2a2a', '--vm-btn-bg-hover': '#3a3a3a', '--vm-btn-border': '#444', '--vm-accent': '#3ea6ff', '--vm-pre-bg': '#222', '--vm-ratio-bg': '#5a2a2a', '--vm-row-hover': '#2a2a2a' } },
    light: { name: 'Light', vars: { '--vm-bg': '#ffffff', '--vm-text': '#111111', '--vm-border': '#cc0000', '--vm-btn-bg': '#f0f0f0', '--vm-btn-bg-hover': '#e0e0e0', '--vm-btn-border': '#ccc', '--vm-accent': '#065fd4', '--vm-pre-bg': '#f9f9f9', '--vm-ratio-bg': '#e0e0e0', '--vm-row-hover': '#f0f0f0' } },
    monokai: { name: 'Monokai', vars: { '--vm-bg': '#272822', '--vm-text': '#f8f8f2', '--vm-border': '#f92672', '--vm-btn-bg': '#3e3d32', '--vm-btn-bg-hover': '#49483e', '--vm-btn-border': '#75715e', '--vm-accent': '#a6e22e', '--vm-pre-bg': '#1e1f1c', '--vm-ratio-bg': '#49483e', '--vm-row-hover': '#3e3d32' } },
    homebrew: { name: 'Homebrew', vars: { '--vm-bg': '#000000', '--vm-text': '#00ff00', '--vm-border': '#00ff00', '--vm-btn-bg': '#003300', '--vm-btn-bg-hover': '#004400', '--vm-btn-border': '#00ff00', '--vm-accent': '#00ff00', '--vm-pre-bg': '#001100', '--vm-ratio-bg': '#003300', '--vm-row-hover': '#002200' } },
    solarizedDark: { name: 'Solarized Dark', vars: { '--vm-bg': '#002b36', '--vm-text': '#839496', '--vm-border': '#b58900', '--vm-btn-bg': '#073642', '--vm-btn-bg-hover': '#586e75', '--vm-btn-border': '#586e75', '--vm-accent': '#2aa198', '--vm-pre-bg': '#001e26', '--vm-ratio-bg': '#073642', '--vm-row-hover': '#073642' } },
    solarizedLight: { name: 'Solarized Light', vars: { '--vm-bg': '#fdf6e3', '--vm-text': '#657b83', '--vm-border': '#b58900', '--vm-btn-bg': '#eee8d5', '--vm-btn-bg-hover': '#93a1a1', '--vm-btn-border': '#93a1a1', '--vm-accent': '#2aa198', '--vm-pre-bg': '#f5efdc', '--vm-ratio-bg': '#eee8d5', '--vm-row-hover': '#eee8d5' } },
    dracula: { name: 'Dracula', vars: { '--vm-bg': '#282a36', '--vm-text': '#f8f8f2', '--vm-border': '#bd93f9', '--vm-btn-bg': '#44475a', '--vm-btn-bg-hover': '#6272a4', '--vm-btn-border': '#6272a4', '--vm-accent': '#ff79c6', '--vm-pre-bg': '#21222c', '--vm-ratio-bg': '#44475a', '--vm-row-hover': '#44475a' } },
    nord: { name: 'Nord', vars: { '--vm-bg': '#2e3440', '--vm-text': '#d8dee9', '--vm-border': '#88c0d0', '--vm-btn-bg': '#3b4252', '--vm-btn-bg-hover': '#434c5e', '--vm-btn-border': '#4c566a', '--vm-accent': '#8fbcbb', '--vm-pre-bg': '#242933', '--vm-ratio-bg': '#3b4252', '--vm-row-hover': '#3b4252' } },
    gruvbox: { name: 'Gruvbox', vars: { '--vm-bg': '#282828', '--vm-text': '#ebdbb2', '--vm-border': '#cc241d', '--vm-btn-bg': '#3c3836', '--vm-btn-bg-hover': '#504945', '--vm-btn-border': '#504945', '--vm-accent': '#b8bb26', '--vm-pre-bg': '#1d2021', '--vm-ratio-bg': '#3c3836', '--vm-row-hover': '#3c3836' } },
    synthwave: { name: 'Synthwave', vars: { '--vm-bg': '#2b213a', '--vm-text': '#f92aad', '--vm-border': '#ff8b39', '--vm-btn-bg': '#241b31', '--vm-btn-bg-hover': '#3a2d4d', '--vm-btn-border': '#36274e', '--vm-accent': '#00fff5', '--vm-pre-bg': '#1f162a', '--vm-ratio-bg': '#36274e', '--vm-row-hover': '#3a2d4d' } },
    oneDark: { name: 'One Dark', vars: { '--vm-bg': '#282c34', '--vm-text': '#abb2bf', '--vm-border': '#61afef', '--vm-btn-bg': '#3e4452', '--vm-btn-bg-hover': '#4b5263', '--vm-btn-border': '#5c6370', '--vm-accent': '#98c379', '--vm-pre-bg': '#21252b', '--vm-ratio-bg': '#3e4452', '--vm-row-hover': '#353b45' } },
    cyberpunk: { name: 'Cyberpunk', vars: { '--vm-bg': '#000b19', '--vm-text': '#00f0ff', '--vm-border': '#fcee0a', '--vm-btn-bg': '#051d3b', '--vm-btn-bg-hover': '#0b3a75', '--vm-btn-border': '#00f0ff', '--vm-accent': '#ff007f', '--vm-pre-bg': '#00050d', '--vm-ratio-bg': '#051d3b', '--vm-row-hover': '#082c59' } },
    tokyoNight: { name: 'Tokyo Night', vars: { '--vm-bg': '#1a1b26', '--vm-text': '#a9b1d6', '--vm-border': '#bb9af7', '--vm-btn-bg': '#24283b', '--vm-btn-bg-hover': '#414868', '--vm-btn-border': '#414868', '--vm-accent': '#7aa2f7', '--vm-pre-bg': '#16161e', '--vm-ratio-bg': '#24283b', '--vm-row-hover': '#2f354f' } },
    evergreen: { name: 'Evergreen', vars: { '--vm-bg': '#1b2a22', '--vm-text': '#d8ebd9', '--vm-border': '#4f7942', '--vm-btn-bg': '#273d32', '--vm-btn-bg-hover': '#355344', '--vm-btn-border': '#3d5e4e', '--vm-accent': '#a3c1ad', '--vm-pre-bg': '#131e18', '--vm-ratio-bg': '#273d32', '--vm-row-hover': '#2d473a' } },
    rosePine: { name: 'Rose Pine', vars: { '--vm-bg': '#191724', '--vm-text': '#e0def4', '--vm-border': '#ebbcba', '--vm-btn-bg': '#26233a', '--vm-btn-bg-hover': '#31748f', '--vm-btn-border': '#403d52', '--vm-accent': '#f6c177', '--vm-pre-bg': '#212030', '--vm-ratio-bg': '#26233a', '--vm-row-hover': '#2a2837' } },
    oceanic: { name: 'Oceanic', vars: { '--vm-bg': '#0f172a', '--vm-text': '#cbd5e1', '--vm-border': '#06b6d4', '--vm-btn-bg': '#1e293b', '--vm-btn-bg-hover': '#334155', '--vm-btn-border': '#475569', '--vm-accent': '#38bdf8', '--vm-pre-bg': '#020617', '--vm-ratio-bg': '#1e293b', '--vm-row-hover': '#1e293b' } },
    coffee: { name: 'Coffee', vars: { '--vm-bg': '#2d2420', '--vm-text': '#eedfd2', '--vm-border': '#c08a6e', '--vm-btn-bg': '#3e302b', '--vm-btn-bg-hover': '#4e3d36', '--vm-btn-border': '#604b43', '--vm-accent': '#e0a98c', '--vm-pre-bg': '#211a17', '--vm-ratio-bg': '#3e302b', '--vm-row-hover': '#362a25' } },
    sakura: { name: 'Sakura Blush', vars: { '--vm-bg': '#fff0f5', '--vm-text': '#4a3b42', '--vm-border': '#ffb7c5', '--vm-btn-bg': '#ffe4e1', '--vm-btn-bg-hover': '#ffd1dc', '--vm-btn-border': '#ffc0cb', '--vm-accent': '#db7093', '--vm-pre-bg': '#fffaf0', '--vm-ratio-bg': '#ffe4e1', '--vm-row-hover': '#ffdcd2' } },
    matrix: { name: 'Matrix', vars: { '--vm-bg': '#050505', '--vm-text': '#00ff33', '--vm-border': '#00aa22', '--vm-btn-bg': '#111111', '--vm-btn-bg-hover': '#222222', '--vm-btn-border': '#00ff33', '--vm-accent': '#00ff33', '--vm-pre-bg': '#010101', '--vm-ratio-bg': '#111111', '--vm-row-hover': '#151515' } },
    aura: { name: 'Aura', vars: { '--vm-bg': '#151026', '--vm-text': '#ede8f5', '--vm-border': '#a277ff', '--vm-btn-bg': '#241c3d', '--vm-btn-bg-hover': '#332757', '--vm-btn-border': '#3d2f66', '--vm-accent': '#61ffca', '--vm-pre-bg': '#0c0917', '--vm-ratio-bg': '#241c3d', '--vm-row-hover': '#2b2149' } }
  };

  let latestPlayerResponse = null;

  // ---------- responsive style ----------
  function injectStyle() {
    if (document.getElementById(PANEL_ID + '-style')) return;
    const s = document.createElement('style');
    s.id = PANEL_ID + '-style';
    s.textContent = `
      #${PANEL_ID} input[type=number]::-webkit-inner-spin-button,
      #${PANEL_ID} input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none !important;
        margin: 0 !important;
      }
      #${PANEL_ID} input[type=number] {
        -moz-appearance: textfield !important;
      }
      #${PANEL_ID} select option {
        background: var(--vm-btn-bg) !important;
        color: var(--vm-text) !important;
      }
      #${PANEL_ID} input:focus, #${PANEL_ID} select:focus {
        border-color: var(--vm-accent) !important;
        box-shadow: 0 0 0 1px var(--vm-accent) !important;
      }
      #${PANEL_ID} input::placeholder {
        color: var(--vm-text) !important;
        opacity: 0.5 !important;
      }
      @media (max-width: 700px) {
        #${PANEL_ID} {
          padding: 12px 14px !important;
          font-size: 13px !important;
          margin: 8px 0 16px !important;
          border-width: 2px !important;
          border-radius: 10px !important;
        }
        #${PANEL_ID} [data-grid] {
          grid-template-columns: 1fr !important;
          gap: 2px 0 !important;
        }
        #${PANEL_ID} [data-grid] > div:nth-child(odd) {
          margin-top: 6px;
          font-size: 11px;
          opacity: .55 !important;
        }
        #${PANEL_ID} [data-title] { font-size: 15px !important; }
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  // ---------- formatting ----------
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
    if (s == null) return '—';
    s = Number(s);
    if (isNaN(s) || s < 0) return '—';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    const pad = n => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  };
  const parseTimestamp = t => {
    const parts = t.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce((a, p) => a * 60 + p, 0);
  };

  // ---------- player control ----------
  const getPlayer = () => document.getElementById('movie_player');
  const seekTo = s => {
    const p = getPlayer();
    try { p?.seekTo?.(s, true); } catch (e) { }
    const v = document.querySelector('video');
    if (v) try { v.currentTime = s; } catch (e) { }
  };
  const setRate = r => {
    const p = getPlayer();
    try { p?.setPlaybackRate?.(r); } catch (e) { }
    const v = document.querySelector('video');
    if (v) try { v.playbackRate = r; } catch (e) { }
  };
  const copy = t => { try { navigator.clipboard?.writeText(t); } catch (e) { } };

  // ---------- data extraction ----------
  function getData() {
    const urlId = new URLSearchParams(window.location.search).get('v');
    if (!urlId) return null;

    const pr = latestPlayerResponse
      || document.querySelector('ytd-watch-flexy')?.playerResponse
      || window.ytInitialPlayerResponse;

    if (!pr?.videoDetails || pr.videoDetails.videoId !== urlId) return null;

    const v = pr.videoDetails;
    const mf = pr.microformat?.playerMicroformatRenderer;

    const channelUrl = mf?.ownerProfileUrl
      || document.querySelector('ytd-video-owner-renderer a')?.href
      || document.querySelector('ytm-slim-owner-renderer a, a.slim-owner-icon-and-title')?.href
      || document.querySelector('ytm-watch a[href*="/channel/"], ytm-watch a[href*="/@"]')?.href
      || (v.channelId ? `https://www.youtube.com/channel/${v.channelId}` : null);

    return {
      videoId: v.videoId,
      title: v.title,
      channel: v.author,
      channelUrl,
      views: Number(v.viewCount) || 0,
      duration: v.lengthSeconds,
      isLive: v.isLiveContent,
      publishDate: mf?.publishDate,
      category: mf?.category,
      keywords: v.keywords || [],
      description: v.shortDescription || mf?.description?.simpleText || '',
    };
  }

  // ---------- likes ----------
  function getLikes() {
    const sels = [
      'like-button-view-model button',
      'segmented-like-dislike-button-view-model button[aria-label*="like" i]',
      'ytd-menu-renderer like-button-view-model button',
      'ytm-like-button-renderer button',
      'ytm-slim-video-action-bar-renderer button[aria-label*="like" i]',
      'button[aria-label*="like this video" i]',
      'button[aria-label*="like" i]:not([aria-label*="dislike" i])',
    ];
    let btn = null;
    for (const s of sels) { btn = document.querySelector(s); if (btn) break; }
    if (!btn) return { display: null, count: null };

    const label = btn.getAttribute('aria-label') || btn.title || '';
    const txt = (btn.textContent || '').trim();

    let count = null;
    const fullMatch = label.match(/(\d{1,3}(?:[,. ]\d{3})+|\d{4,})/);
    if (fullMatch) count = Number(fullMatch[1].replace(/[,. ]/g, ''));

    let display = null;
    const m = txt.match(/[\d,.]+\s*[KMB]?/i);
    if (m) display = m[0].trim();
    else if (count != null) display = fmtNum(count);

    if (count == null && display) {
      const sm = display.match(/^([\d.,]+)\s*([KMB])?$/i);
      if (sm) {
        const mult = { K: 1e3, M: 1e6, B: 1e9 }[sm[2]?.toUpperCase()] || 1;
        count = Math.round(Number(sm[1].replace(/,/g, '')) * mult);
      }
    }
    return { display, count };
  }

  function pollLikes(targetEl, onCount, tries = 40) {
    const { display, count } = getLikes();
    if (display) {
      targetEl.textContent = display;
      onCount?.(count);
      return;
    }
    if (tries > 0) setTimeout(() => pollLikes(targetEl, onCount, tries - 1), 300);
    else targetEl.textContent = '—';
  }

  async function fetchDislikes(videoId) {
    try {
      const r = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
      return await r.json();
    } catch (e) { console.error(TAG, 'dislike fetch failed', e); return null; }
  }

  async function fetchSponsorBlock(videoId) {
    try {
      const r = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}`);
      if (!r.ok) return [];
      return await r.json();
    } catch (e) { return []; }
  }

  // ---------- chapter parsing ----------
  function parseChapters(description) {
    if (!description) return [];
    const out = [];
    const seen = new Set();
    const reA = /^[\s\-•*•>·]*\(?(\d{1,2}:\d{2}(?::\d{2})?)\)?[\s\-–—:|]*([^\s].*?)\s*$/;
    const reB = /^(.+?)[\s\-–—:|]+\(?(\d{1,2}:\d{2}(?::\d{2})?)\)?\s*$/;
    for (const raw of description.split('\n')) {
      const line = raw.replace(/\s+/g, ' ').trim();
      if (!line) continue;
      let m = line.match(reA);
      let ts, label;
      if (m) { ts = m[1]; label = m[2]; }
      else {
        m = line.match(reB);
        if (m) { ts = m[2]; label = m[1]; }
      }
      if (!ts) continue;
      const sec = parseTimestamp(ts);
      if (sec == null || seen.has(sec)) continue;
      seen.add(sec);
      out.push({ t: sec, label: label.replace(/^[-–—:|\s]+/, '').slice(0, 120) });
    }
    out.sort((a, b) => a.t - b.t);
    return out.length >= 2 ? out : [];
  }

  // ---------- UI helpers ----------
  function el(tag, styles, text) {
    const e = document.createElement(tag);
    if (styles) e.style.cssText = styles;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(label, onClick, title) {
    const b = el('button', `
      background:var(--vm-btn-bg);color:var(--vm-text);border:1px solid var(--vm-btn-border);
      border-radius:6px;padding:3px 8px;font-size:11px;
      cursor:pointer;margin:0 4px 4px 0;font-family:inherit;
    `, label);
    if (title) b.title = title;
    b.addEventListener('mouseenter', () => b.style.background = 'var(--vm-btn-bg-hover)');
    b.addEventListener('mouseleave', () => b.style.background = 'var(--vm-btn-bg)');
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function copyBtn(text, label) {
    const b = btn(label, () => {
      copy(text);
      const orig = b.textContent;
      b.textContent = '✓';
      setTimeout(() => { b.textContent = orig; }, 900);
    }, `Copy: ${text}`);
    return b;
  }
  function section(titleText) {
    const wrap = el('div', 'margin-top:14px;');
    if (titleText) {
      wrap.appendChild(el('div',
        'font-size:11px;opacity:.55;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;',
        titleText));
    }
    return wrap;
  }
  function collapsibleSection(titleText, contentBuilder, defaultOpen = false) {
    const wrap = el('div', 'margin-top:14px;');
    const head = el('div', `
      cursor:pointer;font-size:11px;opacity:.7;letter-spacing:.5px;
      text-transform:uppercase;margin-bottom:6px;user-select:none;
      display:flex;align-items:center;gap:6px;
    `);
    const arrow = el('span', '', defaultOpen ? '▾' : '▸');
    head.appendChild(arrow);
    head.appendChild(el('span', '', titleText));
    const body = el('div', '');
    body.style.display = defaultOpen ? 'block' : 'none';
    let built = false;
    const open = () => {
      if (!built) { body.appendChild(contentBuilder()); built = true; }
      body.style.display = 'block';
      arrow.textContent = '▾';
    };
    const close = () => { body.style.display = 'none'; arrow.textContent = '▸'; };
    if (defaultOpen) open();
    head.addEventListener('click', () => {
      (body.style.display === 'none') ? open() : close();
    });
    wrap.appendChild(head);
    wrap.appendChild(body);
    return wrap;
  }

  // ---------- ratio bar ----------
  function makeRatioBar() {
    const wrap = el('div', 'display:flex;flex-direction:column;gap:3px;min-width:200px;');
    const bar = el('div', 'width:100%;height:6px;background:var(--vm-ratio-bg);border-radius:3px;overflow:hidden;');
    const fill = el('div', 'width:0%;height:100%;background:var(--vm-accent);transition:width .3s;');
    bar.appendChild(fill);
    const label = el('div', 'font-size:11px;opacity:.7;', '—');
    wrap.appendChild(bar);
    wrap.appendChild(label);
    wrap.update = (likes, dislikes) => {
      const total = (likes || 0) + (dislikes || 0);
      if (!total) { label.textContent = '—'; return; }
      const pct = (likes / total) * 100;
      fill.style.width = pct.toFixed(2) + '%';
      label.textContent = `${pct.toFixed(2)}% positive (${fmtNum(likes)} / ${fmtNum(dislikes)})`;
    };
    return wrap;
  }

  // ---------- engagement metrics ----------
  function makeEngagement(data) {
    const wrap = el('div', 'font-size:12px;opacity:.8;');
    const base = [];
    if (data.publishDate && data.views) {
      const days = Math.max(1, Math.floor((Date.now() - new Date(data.publishDate).getTime()) / 86400000));
      base.push(`${fmtNum(Math.round(data.views / days))} views/day`);
    }
    wrap.textContent = base.join('  ·  ') || '—';
    wrap.update = likes => {
      const arr = base.slice();
      if (likes && data.views) arr.push(`${((likes / data.views) * 100).toFixed(3)}% like rate`);
      wrap.textContent = arr.join('  ·  ') || '—';
    };
    return wrap;
  }

  // ---------- chapters list ----------
  function makeChapters(data) {
    const chapters = parseChapters(data.description);
    if (!chapters.length) return null;
    return collapsibleSection(`Chapters (${chapters.length})`, () => {
      const list = el('div', 'display:flex;flex-direction:column;gap:2px;max-height:280px;overflow:auto;');
      for (const c of chapters) {
        const row = el('div', `
          display:flex;gap:10px;align-items:baseline;
          padding:3px 6px;border-radius:4px;cursor:pointer;
        `);
        row.addEventListener('mouseenter', () => row.style.background = 'var(--vm-row-hover)');
        row.addEventListener('mouseleave', () => row.style.background = '');
        row.addEventListener('click', () => seekTo(c.t));
        row.appendChild(el('span', 'color:var(--vm-accent);font-variant-numeric:tabular-nums;min-width:60px;', fmtDur(c.t)));
        row.appendChild(el('span', '', c.label));
        list.appendChild(row);
      }
      return list;
    });
  }

  // ---------- speed controls ----------
  function makeSpeedControls() {
    const wrap = el('div', 'display:flex;flex-wrap:wrap;align-items:center;');
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
    for (const r of rates) {
      wrap.appendChild(btn(r + '×', () => setRate(r), `Set playback rate to ${r}×`));
    }
    const input = el('input', `
      width:60px;background:var(--vm-btn-bg);color:var(--vm-text);border:1px solid var(--vm-btn-border);
      border-radius:6px;padding:3px 6px;font-size:11px;margin-left:4px;text-align:center;font-family:inherit;outline:none;transition:border-color .2s, box-shadow .2s;
    `);
    input.type = 'number';
    input.step = '0.1';
    input.min = '0.1';
    input.max = '16';
    input.placeholder = 'custom';
    input.addEventListener('mouseenter', () => input.style.backgroundColor = 'var(--vm-btn-bg-hover)');
    input.addEventListener('mouseleave', () => input.style.backgroundColor = 'var(--vm-btn-bg)');
    input.addEventListener('change', () => {
      const v = parseFloat(input.value);
      if (v > 0) setRate(v);
    });
    wrap.appendChild(input);
    return wrap;
  }

  // ---------- thumbnails ----------
  function makeThumbnails(videoId) {
    const wrap = el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;');
    const sizes = [
      ['maxres', 'maxresdefault'], ['hq', 'hqdefault'],
      ['sd', 'sddefault'], ['mq', 'mqdefault'], ['default', 'default'],
    ];
    for (const [name, file] of sizes) {
      const a = el('a', 'color:var(--vm-accent);text-decoration:none;font-size:11px;padding:3px 8px;border:1px solid var(--vm-btn-border);border-radius:6px;', name);
      a.href = `https://i.ytimg.com/vi/${videoId}/${file}.jpg`;
      a.target = '_blank';
      a.title = `Open ${name} thumbnail`;
      wrap.appendChild(a);
    }
    return wrap;
  }

  // ---------- alt frontends ----------
  function makeAltLinks(videoId) {
    const wrap = el('div', 'display:flex;flex-wrap:wrap;gap:6px;');
    const links = [
      ['Invidious (yewtu.be)', `https://yewtu.be/watch?v=${videoId}`],
      ['Piped', `https://piped.video/watch?v=${videoId}`],
      ['Embed', `https://www.youtube.com/embed/${videoId}`],
      ['NoCookie', `https://www.youtube-nocookie.com/embed/${videoId}`],
    ];
    for (const [label, url] of links) {
      const a = el('a', 'color:var(--vm-accent);text-decoration:none;font-size:11px;padding:3px 8px;border:1px solid var(--vm-btn-border);border-radius:6px;', label);
      a.href = url;
      a.target = '_blank';
      wrap.appendChild(a);
    }
    return wrap;
  }

  // ---------- description ----------
  function makeDescription(text) {
    if (!text) return null;
    return collapsibleSection('Description', () => {
      const pre = el('div', `
        white-space:pre-wrap;max-height:340px;overflow:auto;
        font-size:12px;line-height:1.5;opacity:.9;
        background:var(--vm-pre-bg);padding:10px;border-radius:6px;
        word-break:break-word;
      `);
      const re = /(https?:\/\/\S+)|(\d{1,2}:\d{2}(?::\d{2})?)/g;
      let last = 0, m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) pre.appendChild(document.createTextNode(text.slice(last, m.index)));
        if (m[1]) {
          const a = el('a', 'color:var(--vm-accent);', m[1]);
          a.href = m[1]; a.target = '_blank';
          pre.appendChild(a);
        } else {
          const sec = parseTimestamp(m[2]);
          const s = el('span', 'color:var(--vm-accent);cursor:pointer;text-decoration:underline;', m[2]);
          s.addEventListener('click', () => seekTo(sec));
          pre.appendChild(s);
        }
        last = m.index + m[0].length;
      }
      if (last < text.length) pre.appendChild(document.createTextNode(text.slice(last)));
      return pre;
    });
  }

  // ---------- sponsorblock ----------
  async function makeSponsorBlock(videoId) {
    const segs = await fetchSponsorBlock(videoId);
    if (!segs.length) return null;
    const COLORS = {
      sponsor: '#00d400', selfpromo: '#ffff00', interaction: '#cc00ff',
      intro: '#00ffff', outro: '#0202ed', preview: '#008fd6',
      music_offtopic: '#ff9900', filler: '#7300ff', poi_highlight: '#ff1684',
    };
    return collapsibleSection(`SponsorBlock (${segs.length})`, () => {
      const list = el('div', 'display:flex;flex-direction:column;gap:3px;');
      for (const s of segs) {
        const [a, b] = s.segment || [0, 0];
        const row = el('div', `
          display:flex;gap:10px;align-items:center;
          padding:3px 6px;border-radius:4px;cursor:pointer;font-size:12px;
        `);
        row.addEventListener('mouseenter', () => row.style.background = 'var(--vm-row-hover)');
        row.addEventListener('mouseleave', () => row.style.background = '');
        row.addEventListener('click', () => seekTo(a));
        row.appendChild(el('span', `display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLORS[s.category] || '#888'};flex:none;`));
        row.appendChild(el('span', 'min-width:110px;color:var(--vm-accent);font-variant-numeric:tabular-nums;',
          `${fmtDur(Math.floor(a))} – ${fmtDur(Math.floor(b))}`));
        row.appendChild(el('span', '', s.category));
        list.appendChild(row);
      }
      return list;
    });
  }

  // ---------- panel build ----------
  function build(data) {
    injectStyle();
    const wrap = el('div', `
      margin: 16px 0 24px !important;
      padding: 16px 20px !important;
      background: var(--vm-bg) !important;
      border: 3px solid var(--vm-border) !important;
      border-radius: 12px !important;
      color: var(--vm-text) !important;
      font-family: "Roboto","Arial",sans-serif !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      display: block !important;
      position: relative !important;
      z-index: 9999 !important;
    `);
    wrap.id = PANEL_ID;
    wrap.setAttribute('data-video-id', data.videoId);

    const themeSelect = el('select', 'background:var(--vm-btn-bg);color:var(--vm-text);border:1px solid var(--vm-btn-border);border-radius:6px;font-size:11px;padding:3px 20px 3px 8px;cursor:pointer;margin-right:8px;outline:none;font-family:inherit;appearance:none;-webkit-appearance:none;-moz-appearance:none;background-repeat:no-repeat;background-position:right 6px center;background-size:10px 10px;transition:border-color .2s, box-shadow .2s;');
    themeSelect.addEventListener('mouseenter', () => themeSelect.style.backgroundColor = 'var(--vm-btn-bg-hover)');
    themeSelect.addEventListener('mouseleave', () => themeSelect.style.backgroundColor = 'var(--vm-btn-bg)');

    const applyTheme = (themeId) => {
      const t = THEMES[themeId] || THEMES.default;
      for (const [k, v] of Object.entries(t.vars)) wrap.style.setProperty(k, v);
      
      const textColor = t.vars['--vm-text'];
      const encodedSvg = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(textColor)}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
      themeSelect.style.backgroundImage = encodedSvg;

      try { localStorage.setItem(LS_THEME, themeId); } catch (e) { }
    };
    const currentTheme = localStorage.getItem(LS_THEME) || 'default';
    applyTheme(currentTheme);

    for (const [id, t] of Object.entries(THEMES)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = t.name;
      if (id === currentTheme) opt.selected = true;
      themeSelect.appendChild(opt);
    }
    themeSelect.addEventListener('change', e => applyTheme(e.target.value));

    // header w/ collapse toggle
    const header = el('div', 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;');
    const titleArea = el('div', 'display:flex;align-items:center;');
    titleArea.appendChild(el('div', 'font-size:12px;opacity:.5;margin-right:12px;',
      IS_MOBILE ? '★ YT INFO PANEL' : '★ YT INFO PANEL (Alt+I to toggle)'));
    titleArea.appendChild(themeSelect);
    header.appendChild(titleArea);
    const collapseBtn = btn('—', null, 'Collapse');
    collapseBtn.setAttribute('data-role', 'collapse');
    header.appendChild(collapseBtn);
    wrap.appendChild(header);

    const body = el('div', '');

    const titleEl = el('div', 'font-size:18px;font-weight:600;margin-bottom:6px;', data.title || '');
    titleEl.setAttribute('data-title', '');
    body.appendChild(titleEl);

    // copy actions
    const videoUrl = `https://www.youtube.com/watch?v=${data.videoId}`;
    const actions = el('div', 'display:flex;flex-wrap:wrap;margin-bottom:10px;');
    actions.appendChild(copyBtn(videoUrl, '⧉ URL'));
    actions.appendChild(copyBtn(data.videoId, '⧉ ID'));
    actions.appendChild(copyBtn(data.title || '', '⧉ Title'));
    actions.appendChild(copyBtn(data.channel || '', '⧉ Channel'));
    body.appendChild(actions);

    // shared cells
    const ratioBar = makeRatioBar();
    const engagement = makeEngagement(data);
    const likesEl = el('div', '', 'fetching...');
    const dislikesEl = el('div', '', 'fetching...');

    const grid = el('div', 'display:grid;grid-template-columns:max-content 1fr;gap:6px 18px;align-items:start;');
    grid.setAttribute('data-grid', '');
    const rows = [
      ['Channel', null],
      ['Views', null],
      ['Likes', likesEl],
      ['Dislikes', dislikesEl],
      ['Ratio', ratioBar],
      ['Engagement', engagement],
      ['Published', null],
      ['Duration', null],
      ['Category', null],
    ];

    for (const [k, custom] of rows) {
      grid.appendChild(el('div', 'opacity:.65', k));
      let valEl;
      if (custom) {
        valEl = custom;
      } else if (k === 'Channel') {
        valEl = el('div');
        if (data.channelUrl) {
          const link = el('a', 'color:var(--vm-accent);text-decoration:none;font-weight:500;', data.channel || '—');
          link.href = data.channelUrl;
          link.target = '_blank';
          valEl.appendChild(link);
        } else {
          valEl.textContent = data.channel || '—';
        }
      } else if (k === 'Views') {
        valEl = el('div', '', fmtNum(data.views));
      } else if (k === 'Published') {
        valEl = el('div', '', fmtDate(data.publishDate));
      } else if (k === 'Duration') {
        valEl = el('div', '', fmtDur(data.duration) + (data.isLive ? ' (live)' : ''));
      } else if (k === 'Category') {
        valEl = el('div', '', data.category || '—');
      } else {
        valEl = el('div', '', '—');
      }
      grid.appendChild(valEl);
    }
    body.appendChild(grid);

    // mini info container for collapsed mode
    const miniInfoContainer = el('div', 'display:none;font-size:11px;opacity:.85;padding-top:8px;border-top:1px dashed var(--vm-btn-border);');
    const miniInfoContent = el('div', 'display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;');
    const addDivider = () => miniInfoContent.appendChild(el('span', 'opacity:.4;', '·'));

    if (data.channel) {
      const miniChannel = el('span', 'font-weight:500;color:var(--vm-accent);');
      if (data.channelUrl) {
        const link = el('a', 'color:var(--vm-accent);text-decoration:none;font-weight:500;', data.channel);
        link.href = data.channelUrl;
        link.target = '_blank';
        miniChannel.appendChild(link);
      } else {
        miniChannel.textContent = data.channel;
      }
      miniInfoContent.appendChild(miniChannel);
      addDivider();
    }

    const miniViews = el('span', '', fmtNum(data.views) + ' views');
    miniInfoContent.appendChild(miniViews);
    addDivider();

    const miniRatio = el('span', '', 'fetching...');
    miniInfoContent.appendChild(miniRatio);
    addDivider();

    const miniDuration = el('span', '', fmtDur(data.duration) + (data.isLive ? ' (live)' : ''));
    miniInfoContent.appendChild(miniDuration);
    miniInfoContainer.appendChild(miniInfoContent);

    const updateMiniRatio = (likes, dislikes) => {
      const activeLikes = likes ?? likeCount;
      if (activeLikes == null) return;
      if (dislikes == null) {
        miniRatio.textContent = `${fmtNum(activeLikes)} likes`;
        return;
      }
      const total = activeLikes + dislikes;
      if (!total) { miniRatio.textContent = '—'; return; }
      const pct = (activeLikes / total) * 100;
      miniRatio.textContent = `${pct.toFixed(1)}% positive (${fmtNum(activeLikes)} / ${fmtNum(dislikes)})`;
    };

    // async wiring
    let likeCount = null;
    pollLikes(likesEl, c => {
      likeCount = c;
      engagement.update(c);
      updateMiniRatio(c);
    });
    fetchDislikes(data.videoId).then(d => {
      if (!d) { dislikesEl.textContent = '—'; updateMiniRatio(likeCount); return; }
      if (d.dislikes != null) dislikesEl.textContent = fmtNum(d.dislikes);
      const likesForRatio = likeCount ?? d.likes;
      ratioBar.update(likesForRatio, d.dislikes);
      if (!likeCount && d.likes) engagement.update(d.likes);
      updateMiniRatio(likesForRatio, d.dislikes);
    });

    // speed controls
    const speedSec = section('Playback speed (browser bypasses YouTube\'s 2× cap)');
    speedSec.appendChild(makeSpeedControls());
    body.appendChild(speedSec);

    // chapters
    const ch = makeChapters(data);
    if (ch) body.appendChild(ch);

    // description
    const desc = makeDescription(data.description);
    if (desc) body.appendChild(desc);

    // sponsorblock (async)
    const sbHolder = el('div', '');
    body.appendChild(sbHolder);
    makeSponsorBlock(data.videoId).then(sb => { if (sb) sbHolder.appendChild(sb); });

    // thumbnails
    const thumbs = section('Thumbnails');
    thumbs.appendChild(makeThumbnails(data.videoId));
    body.appendChild(thumbs);

    // alt frontends
    const alt = section('Open elsewhere');
    alt.appendChild(makeAltLinks(data.videoId));
    body.appendChild(alt);

    // keywords
    if (data.keywords.length) {
      const kw = section('Tags');
      kw.appendChild(el('div',
        'opacity:.6;font-size:12px;',
        data.keywords.slice(0, 24).join(' · ')));
      body.appendChild(kw);
    }

    wrap.appendChild(body);
    wrap.appendChild(miniInfoContainer);

    // collapse persistence
    const applyCollapsed = c => {
      body.style.display = c ? 'none' : 'block';
      miniInfoContainer.style.display = c ? 'block' : 'none';
      collapseBtn.textContent = c ? '+' : '—';
      collapseBtn.title = c ? 'Expand' : 'Collapse';
    };
    let collapsed = localStorage.getItem(LS_COLLAPSED) === '1';
    applyCollapsed(collapsed);
    collapseBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      try { localStorage.setItem(LS_COLLAPSED, collapsed ? '1' : '0'); } catch (e) { }
      applyCollapsed(collapsed);
    });

    return wrap;
  }

  // ---------- injection ----------
  function inject() {
    if (location.pathname !== '/watch') return true;
    const data = getData();
    if (!data) return false;

    const existing = document.getElementById(PANEL_ID);
    if (existing && existing.getAttribute('data-video-id') === data.videoId) return true;
    existing?.remove();

    const anchors = IS_MOBILE ? [
      () => document.querySelector('ytm-slim-video-metadata-section-renderer'),
      () => document.querySelector('ytm-slim-video-information-renderer'),
      () => document.querySelector('ytm-watch #player'),
      () => document.querySelector('ytm-watch .player-container-android, ytm-watch .player-size'),
      () => document.querySelector('ytm-watch'),
    ] : [
      () => document.querySelector('#primary-inner #player'),
      () => document.querySelector('#player-container-outer'),
      () => document.querySelector('ytd-watch-flexy #primary'),
      () => document.querySelector('#below'),
    ];

    for (const find of anchors) {
      const a = find();
      if (a && a.parentNode) {
        a.insertAdjacentElement('afterend', build(data));
        console.log(TAG, 'injected panel for', data.videoId);
        return true;
      }
    }
    return false;
  }

  function tryInject(tries = 40) {
    try { if (inject()) return; } catch (e) { console.error(TAG, 'inject threw', e); }
    if (tries > 0) setTimeout(() => tryInject(tries - 1), 300);
  }

  // ---------- hotkey: Alt+I toggles panel ----------
  window.addEventListener('keydown', e => {
    if (!(e.altKey && (e.key === 'i' || e.key === 'I'))) return;
    if (e.target?.matches?.('input, textarea, [contenteditable], [contenteditable="true"]')) return;
    const p = document.getElementById(PANEL_ID);
    p?.querySelector('button[data-role="collapse"]')?.click();
  });

  // ---------- SPA navigation hooks ----------
  window.addEventListener('yt-navigate-finish', e => {
    latestPlayerResponse = e.detail?.response?.playerResponse || null;
    tryInject();
  });
  window.addEventListener('yt-page-data-updated', e => {
    if (e.detail?.pageType === 'watch') {
      latestPlayerResponse = e.detail?.response?.playerResponse || latestPlayerResponse;
      tryInject();
    }
  });

  tryInject();
})();
