// ==UserScript==
// @name         LinkedIn Noise Filter
// @namespace    https://violentmonkey.github.io/
// @match        https://www.linkedin.com/feed/*
// @grant        none
// @version      1.0
// @description  Hides "Promoted" and "Liked by" posts on LinkedIn to show only original content from your connections.
// @author       jloures
// @downloadURL  https://raw.githubusercontent.com/jloures/userscripts/main/linkedin-noise-filter.user.js
// @updateURL    https://raw.githubusercontent.com/jloures/userscripts/main/linkedin-noise-filter.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    function filter() {
        const posts = document.querySelectorAll('.feed-shared-update-v2');
        posts.forEach(post => {
            const text = post.textContent.toLowerCase();
            const isPromoted = post.querySelector('.update-components-actor__sub-description')?.textContent.includes('Promoted');
            const isLikedBy = text.includes('liked this') || text.includes('commented on this');
            
            if (isPromoted || isLikedBy) {
                post.style.display = 'none';
            }
        });
    }

    // Run periodically to handle infinite scroll
    setInterval(filter, 2000);
})();
