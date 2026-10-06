# Smart Laundry

A static laundry service site built with HTML, CSS, JavaScript, and Firebase. Pages, page styles, shared features, and images are kept in separate folders with names that describe their purpose.

## Project layout

```text
.
|-- index.html                  # Redirects the site root to the landing page
|-- pages/
|   |-- index.html
|   |-- customer-login.html
|   |-- shopkeeper-login.html
|   |-- customer-dashboard.html
|   |-- admin-dashboard.html
|   `-- wallet.html
|-- assets/
|   |-- css/
|   |   |-- landing-page.css
|   |   |-- landing-page-theme.css
|   |   |-- customer-dashboard.css
|   |   |-- customer-shop-list.css
|   |   |-- customer-feedback.css
|   |   |-- authentication.css
|   |   |-- auth/shopkeeper-auth.css
|   |   |-- pages/admin-dashboard.css
|   |   `-- payments/wallet.css
|   |-- js/
|   |   |-- auth/                 # Customer and shopkeeper sign-in
|   |   |-- features/             # Laundry FAQ and customer history
|   |   |-- pages/                # Landing, customer, and admin pages
|   |   `-- payments/             # Wallet and payment behavior
|   `-- images/
|       |-- laundry/
|       |-- payments/
|       `-- products/
|-- firebase.json
`-- .firebaserc
```

Each page loads its own JavaScript module. Reusable behavior such as the laundry FAQ and order history lives in `assets/js/features/`; page behavior lives under `assets/js/pages/`, `auth/`, or `payments/`. Customer dashboard styles are split into layout, shop list, and feedback files. The old standalone chatbot and unused duplicate JavaScript files were removed.

## Run locally

Serve the project root with VS Code Live Server or `python -m http.server 5500`, then open `http://localhost:5500/`. The root entry redirects to `pages/index.html`; page-to-page links stay relative so they work on GitHub Pages project URLs.

## Firebase

The selected project is in `.firebaserc`. Hosting configuration is in `firebase.json`; review it before deployment.

## Search engines

The public landing page has a descriptive title, summary, canonical URL, and website metadata. `robots.txt` allows crawling and points to `sitemap.xml`; account, dashboard, and wallet pages are marked `noindex`. To request Google indexing, verify this site in Google Search Console and submit `https://maahfuzdev.github.io/freshfold-laundry/sitemap.xml`. Search engines decide when and whether to show the site.
