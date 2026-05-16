// ==UserScript==
// @name         Interaction Enabler (Right-Click/Select)
// @namespace    https://violentmonkey.github.io/
// @match        *://*/*
// @grant        none
// @version      1.0
// @description  Re-enables right-click and text selection on sites that try to block them (like some news sites).
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/interaction-enabler.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/interaction-enabler.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Stop propagation of events that block interaction
    const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'paste', 'mousedown'];
    
    events.forEach(type => {
        document.addEventListener(type, (e) => {
            e.stopPropagation();
        }, true);
    });

    // Also remove CSS that blocks selection
    const style = document.createElement('style');
    style.textContent = `
        * {
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
        }
    `;
    document.head.appendChild(style);
})();
