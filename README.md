# Ledger (local)

A private expense, savings and subscription tracker that lives on your phone.
It's a Progressive Web App: install it from Safari/Chrome and it runs offline from
your home screen. **There is no backend and no database server.** Everything you
enter is stored on the device (browser `localStorage`) and is never uploaded.

- Overview: spending by category, saved vs. left over, bank vs. investments, subscription cost, 6-month trend, month-by-month navigation
- Activity: every transaction, filterable, tap a row to delete
- Subscriptions: monthly/yearly/weekly, auto-rolls the next charge date, "due soon" list
- Data: export / restore a JSON backup, currency (default SGD), manage categories

Stack: React + Vite + Tailwind + Recharts, `vite-plugin-pwa` for the offline service worker. Fonts are bundled, so the app makes no network requests once installed.

## Run it on your computer

```bash
npm install
npm run dev        # http://localhost:5173 (also reachable from your phone on the same Wi-Fi)
npm test           # data-layer tests
npm run build      # static site in dist/
```

## Put it on your phone

A phone can only install a web app from an `https://` address, so the built files need to
be served once. They're plain static files, so GitHub Pages is free and nothing about your
data touches it (it only hosts the app code).

1. Create a GitHub repo and push this folder to `main`:
   ```bash
   git init && git add . && git commit -m "Ledger local"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The included workflow (`.github/workflows/pages.yml`) builds and publishes on every push.
3. Open `https://<you>.github.io/<repo>/` in **Safari** on your iPhone.
4. Tap **Share → Add to Home Screen**. Open it from the new icon.

(Chrome on Android: menu → **Install app**.)

Any static host works the same way (Netlify, Cloudflare Pages, even Railway's static
hosting). `vite.config.js` uses relative paths, so no base-path setting is needed.

## Your data

- Stored only on the device, inside the installed app. Deleting the app, clearing website
  data, or switching phones means starting empty, **unless you export a backup**.
- **Data → Export backup** saves a `.json` file (on iPhone: Save to Files / AirDrop / iCloud Drive).
  **Restore from file** loads it back, including on a new phone.
- Installing to the home screen matters on iPhone: Safari can purge data for sites you
  haven't opened in about a week, while installed home-screen apps are exempt.
- The home-screen app and the Safari tab keep separate storage. Pick one and stick with it.
- Updates: when you push a new version, the app picks it up the next time it's opened
  with a connection. Your data is untouched.

## Want a real App Store-style app instead?

This code can be wrapped with [Capacitor](https://capacitorjs.com/) into a native iOS/Android
app, but that needs a Mac with Xcode (and an Apple developer account for anything longer than
7 days of sideloading). The PWA gets you ~95% of the experience without any of that.
