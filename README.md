# Back to School

A Nigerian secondary-school life simulator in the browser (three.js, no build step).

## Play
Open `index.html` through any web server, e.g. GitHub Pages (Settings → Pages → deploy from branch, root folder), or locally:

    python -m http.server 8000

then visit http://localhost:8000. Opening the file directly from disk will not work (ES modules need http).

An internet connection is needed: three.js and the fonts load from CDNs.

## Files
- `index.html` — the game
- `world/world-data.js` — campus layout data
- `3d/common.js`, `3d/person.js` — shared characters and helpers
- `3d/v3/` — campus, classroom, mini-games, football, excursions (Olumo Rock, Taj Mahal)
- `assets/` — avatar faces and destination art

Progress is saved in the browser (localStorage).
