# Remember — Little Star Wish

A quiet memorial and condolence page, served at `remember.mylittlestarwish.com`.

This is a standalone static site (no build step) so it can be deployed on
GitHub Pages under its own custom subdomain, separate from the main baby
registry site at `mylittlestarwish.com`.

## Structure
- `index.html` — the memorial page
- `css/memorial.css` — styles
- `js/memorial.js` — data loading, support dialog, condolence form, message wall
- `data/memorial.json` — editable content (name, dates, bank details, `messagesApi`, seeded messages)
- `CNAME` — custom domain for GitHub Pages (`remember.mylittlestarwish.com`)

## Condolence messages
New submissions go to the Google Apps Script + Google Sheet backend referenced
in `data/memorial.json` under `messagesApi`. See the main baby-registry repo's
`scripts/apps-script/Code.gs` for that backend's source and setup instructions.

## Deploy
1. Push this repo to GitHub.
2. Repo Settings → Pages → enable Pages from the `main` branch, root folder.
3. Repo Settings → Pages → Custom domain → `remember.mylittlestarwish.com`.
4. Ensure DNS has a CNAME record: `remember` → `<your-username>.github.io`.
