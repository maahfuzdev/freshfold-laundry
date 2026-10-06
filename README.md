# Smart Laundry

A static laundry service site built with HTML, CSS, JavaScript, and Firebase. Pages, page styles, shared features, and images are kept in separate folders with names that describe their purpose.

## Project layout

```text
.
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

Serve the project root with VS Code Live Server or `python -m http.server 5500`, then open `http://localhost:5500/pages/`. Firebase Hosting rewrites the site root to `pages/index.html`.

## Firebase

The selected project is in `.firebaserc`. Hosting configuration is in `firebase.json`; review it before deployment.
