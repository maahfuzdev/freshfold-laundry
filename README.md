# Smart Laundry

A lightweight laundry service website built with HTML, CSS, JavaScript, and Firebase. The pages run as static files and can be served locally without a build step.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Public landing page and sign-in entry point |
| `login.html`, `swlogin.html` | Customer and shop sign-in flows |
| `user.html` | Customer ordering and account experience |
| `admin.html` | Order and service administration |
| `walet.html` | Wallet and payment page |

## Supporting files

- `index.css` and `index-theme.css` — landing page base styles and visual theme.
- `user.css`, `login.css` — page-specific styles.
- `user.js` — customer-facing application behavior.
- `firebaseConfig.js` — Firebase project configuration.
- Root-level `.png` files — laundry photography, clothing examples, and payment marks used by the pages.

The project keeps its static pages and referenced images at the root so existing relative links continue to work. Keep page-specific styles beside their pages and place shared behavior in JavaScript files rather than adding inline style blocks.

## Run locally

1. Open this folder in a local static server (for example, VS Code Live Server or `python -m http.server 5500`).
2. Open `index.html` in the served site.
3. Confirm `firebaseConfig.js` and the Firebase settings embedded in `index.html` and `admin.html` point to the intended Firebase project before deployment.

## Deployment

Firebase Hosting settings are in `firebase.json`. Deploy the static site with the Firebase CLI after signing in to the correct project.
