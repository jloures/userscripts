// ==UserScript==
// @name         Hacker News Visual Threading
// @namespace    https://violentmonkey.github.io/
// @match        https://news.ycombinator.com/item?id=*
// @grant        none
// @version      1.0
// @description  Adds visual guide lines to Hacker News comment threads for better readability.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/hn-threading.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/hn-threading.user.js
// ==/UserScript==

(function() {
    'use strict';
    const STYLE = `
        .comment-tree .ind {
            position: relative;
        }
        .comment-tree .ind::after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #eee;
            margin-left: 10px;
        }
        /* Color code depths */
        .comment-tree tr.comtr:nth-of-type(4n+1) .ind::after { background: #f0f0f0; }
        .comment-tree tr.comtr:nth-of-type(4n+2) .ind::after { background: #e0e0e0; }
        .comment-tree tr.comtr:nth-of-type(4n+3) .ind::after { background: #d0d0d0; }
        
        .hn-collapse-all {
            cursor: pointer;
            color: #828282;
            text-decoration: underline;
            margin-left: 10px;
            font-size: 10px;
        }
    `;
    const s = document.createElement('style');
    s.textContent = STYLE;
    document.head.appendChild(s);

    // Add Collapse All button
    const subline = document.querySelector('.subline');
    if (subline) {
        const btn = document.createElement('span');
        btn.className = 'hn-collapse-all';
        btn.textContent = '[collapse all]';
        btn.onclick = () => {
            document.querySelectorAll('.togg').forEach(t => {
                if (t.textContent.includes('[-]')) t.click();
            });
        };
        subline.appendChild(btn);
    }
})();
