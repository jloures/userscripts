# Personal userscripts for Violentmonkey / Tampermonkey.

## Install

There are two ways to install these scripts:

1.  **Direct Install**: Navigate to the raw URL of any `.user.js` file in this repository. Violentmonkey or Tampermonkey will automatically detect it and offer to install.
2.  **Manual URL**: Open your Violentmonkey dashboard, click the **+** (plus) icon, select **Install from URL**, and paste the raw URL of the script.

## Scripts

| Name | Description | Install |
| :--- | :--- | :--- |
| YouTube Minimal Info Panel | Replaces YouTube's comment/recommendation area with a clean info panel showing channel, exact view count, likes, dislikes, publish date, duration, and tags. | [Install](https://raw.githubusercontent.com/jloures/userscripts/main/yt-info-panel.user.js) |

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
