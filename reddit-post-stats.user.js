// ==UserScript==
// @name         Reddit Post Stats
// @namespace    https://violentmonkey.github.io/
// @match        https://www.reddit.com/r/*/comments/*
// @grant        none
// @version      1.0
// @description  Adds a small panel showing upvote ratio and (if possible) author stats on Reddit.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/reddit-post-stats.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/reddit-post-stats.user.js
// ==/UserScript==

(function() {
    'use strict';
    const ID = 'reddit-stats-panel';
    
    function buildPanel(ratio) {
        const div = document.createElement('div');
        div.id = ID;
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1a1a1b;
            color: #d7dadc;
            padding: 12px;
            border: 1px solid #343536;
            border-radius: 8px;
            z-index: 9999;
            font-family: sans-serif;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        div.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; color: #ff4500;">POST STATS</div>
            <div>Upvote Ratio: <span style="color: #fff;">${ratio || 'Unknown'}</span></div>
        `;
        document.body.appendChild(div);
    }

    function init() {
        if (document.getElementById(ID)) return;
        // Reddit redesign stores ratio in a hidden element or we can try to find it
        // The ratio is often in a div with "upvote-ratio" or similar
        const ratioEl = document.querySelector('[data-test-id="post-content"] [style*="color:rgb(135, 138, 140)"]');
        let ratio = null;
        if (ratioEl && ratioEl.textContent.includes('%')) {
            ratio = ratioEl.textContent;
        } else {
            // Fallback: try to find any text with % in the post header area
            const allText = document.querySelector('[data-test-id="post-content"]')?.textContent || '';
            const match = allText.match(/(\d+%\s*Upvoted)/);
            if (match) ratio = match[1];
        }
        buildPanel(ratio);
    }

    setTimeout(init, 3000); // Wait for SPA load
})();
