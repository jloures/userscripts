# Personal userscripts for Violentmonkey / Tampermonkey.

## Install

There are two ways to install these scripts:

1.  **Direct Install**: Navigate to the raw URL of any `.user.js` file in this repository. Violentmonkey or Tampermonkey will automatically detect it and offer to install.
2.  **Manual URL**: Open your Violentmonkey dashboard, click the **+** (plus) icon, select **Install from URL**, and paste the raw URL of the script.

## Scripts

| Name | Description | Install |
| :--- | :--- | :--- |
| YouTube Minimal Info Panel | Replaces YouTube's comment/recommendation area with a clean info panel showing channel, exact view count, likes, dislikes, publish date, duration, and tags. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/yt-info-panel.user.js) |
| Reddit Post Stats | Adds a small panel showing upvote ratio on Reddit posts. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/reddit-post-stats.user.js) |
| BR News Cleaner | Removes clutter, sidebars, and ads from UOL and Globo. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/br-news-cleaner.user.js) |
| HN Visual Threading | Adds visual guide lines to Hacker News comment threads. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/hn-threading.user.js) |
| LinkedIn Noise Filter | Hides "Promoted" and "Liked by" posts on LinkedIn feed. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/linkedin-noise-filter.user.js) |
| Interaction Enabler | Re-enables right-click and text selection globally. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/interaction-enabler.user.js) |

## Adding a new script

Checklist for adding new scripts to this repository:

- [ ] Add the file at the repository root with a `.user.js` extension.
- [ ] Include the following metadata blocks:
    - `@name`
    - `@version`
    - `@match`
    - `@description`
    - `@downloadURL` (use the raw GitHub URL)
    - `@updateURL` (use the raw GitHub URL)
- [ ] Bump the `@version` whenever changes are made so existing installs auto-update.
- [ ] Add a new row to the **Scripts** table in this `README.md`.
