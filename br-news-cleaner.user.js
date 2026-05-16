// ==UserScript==
// @name         BR News Cleaner (UOL/Globo)
// @namespace    https://violentmonkey.github.io/
// @match        https://*.uol.com.br/*
// @match        https://*.globo.com/*
// @grant        none
// @version      1.0
// @description  Removes clutter, sidebars, and ads from UOL and Globo for a cleaner reading experience.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/br-news-cleaner.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/br-news-cleaner.user.js
// ==/UserScript==

(function() {
    'use strict';
    const STYLE = `
        /* Hide sidebars and ads */
        .sidebar, .publicidade, .ads-placeholder, .content-ads, 
        [class*="banner"], [id*="banner"], .recommendation-area,
        .footer-news, .related-news, #banner-middle {
            display: none !important;
        }
        /* Maximize content width */
        .container, .content, .main-content {
            max-width: 800px !important;
            margin: 0 auto !important;
            float: none !important;
        }
        /* Readable typography */
        article, .article-content {
            font-size: 18px !important;
            line-height: 1.6 !important;
            color: #333 !important;
        }
    `;
    const s = document.createElement('style');
    s.textContent = STYLE;
    document.head.appendChild(s);
})();
