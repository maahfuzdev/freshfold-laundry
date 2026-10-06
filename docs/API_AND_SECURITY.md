# FreshFold Laundry - API Operations & Security Evaluation

## 1. BaaS Architecture & Operations Matrix

Because FreshFold Laundry operates on a Serverless Backend-as-a-Service (BaaS) model, client scripts interface directly with Google Firebase services over HTTPS and WebSockets.

| Service | Collection / Resource | SDK Function | Invoking File | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | Firebase Auth | `createUserWithEmailAndPassword()` | `customer-auth.js` | Registers new customer login account |
| **Auth** | Firebase Auth | `signInWithEmailAndPassword()` | `customer-auth.js` | Authenticates customer credentials |
| **Auth** | Firebase Auth | `createUserWithEmailAndPassword()` | `shopkeeper-auth.js` | Registers new shopowner account |
| **Auth** | Firebase Auth | `signInWithEmailAndPassword()` | `shopkeeper-auth.js` | Authenticates shopowner credentials |
| **Auth** | Firebase Auth | `onAuthStateChanged()` | `customer-dashboard.js`, `wallet-payments.js` | Tracks session lifecycle & enforces access |
| **Firestore** | `users` | `setDoc()` | `customer-auth.js` | Creates profile document keyed by `user.uid` |
| **Firestore** | `users` | `getDocs(query(where("email", "==")))` | `customer-auth.js` | Verifies account uniqueness before signin |
| **Firestore** | `shopowners` | `setDoc()` | `shopkeeper-auth.js` | Stores shop profile keyed by sanitized email |
| **Firestore** | `shopowners` | `getDocs()` | `customer-dashboard.js` | Lists active laundry partners in dashboard |
| **Firestore** | `products` | `getDocs()` | `customer-dashboard.js`, `admin-dashboard.js` | Fetches active garment catalog |
| **Firestore** | `products` | `updateDoc()` | `admin-dashboard.js` | Modifies item unit prices |
| **Firestore** | `orders` | `addDoc()` | `customer-dashboard.js` | Persists confirmed laundry orders |
| **Firestore** | `orders` | `getDocs(query(where("email", "==")))` | `customer-history.js` | Retrieves customer's historical orders |
| **Firestore** | `orders` | `getDocs()` | `admin-dashboard.js` | Retrieves all system orders for admin table |
| **Firestore** | `orders` | `updateDoc()` | `admin-dashboard.js` | Modifies fulfillment status (Pending/Completed) |
| **Firestore** | `orders` | `deleteDoc()` | `admin-dashboard.js` | Deletes an order from system records |
| **Firestore** | `wallets` | `getDoc()` | `customer-dashboard.js`, `wallet-payments.js` | Reads current balance |
| **Firestore** | `wallets` | `updateDoc(..., { balance: increment() })` | `customer-dashboard.js`, `wallet-payments.js` | Atomically increments or decrements balance |
| **Firestore** | `userComments` | `onSnapshot()` | `landing-page.js` | Real-time reactive stream of user reviews |
| **Firestore** | `userComments` | `addDoc()` | `customer-history.js` | Submits public feedback and review |

---

## 2. Authentication & Authorization Architecture

### 2.1. Dual-Role Segregation Strategy
The application maintains two user types: **Customer** and **Shopkeeper**. Because Firebase Authentication natively treats all credentials equally, the application establishes role boundaries through Firestore collections:

1. **Customer Login**:
   - Queries `collection(db, "users")` by email.
   - If found, proceeds with `signInWithEmailAndPassword()`.
   - If absent, blocks sign-in with `"You are not a registered user."`.
2. **Shopkeeper Login**:
   - Queries `collection(db, "shopowners")` by email.
   - If found, proceeds with `signInWithEmailAndPassword()`.
   - If absent, blocks sign-in with `"You are not a registered shop owner."`.

---

## 3. Security Vulnerability Assessment

### 3.1. Absence of Cloud Firestore Security Rules
> [!CAUTION]
> There is currently no `firestore.rules` file in the project repository. If rules are set to default test mode (`allow read, write: if true;`), any user who inspects the frontend bundle can write, overwrite, or delete any customer profile, wallet balance, or order using the exposed `firebaseConfig` keys.

### 3.2. Missing Route Guard on Admin Panel (`admin-dashboard.html`)
> [!WARNING]
> While `customer-dashboard.html` validates `onAuthStateChanged()` and redirects unauthenticated users to `customer-login.html`, `admin-dashboard.html` contains **zero authentication checks**. Anyone who navigates directly to `pages/admin-dashboard.html` can read all orders, delete customer orders, and alter laundry prices.

### 3.3. Client-Side Financial Balance Trust
In `wallet-payments.js`, wallet balances can be topped up directly from client code without server-side verification:
- Top-ups via Nagad, Rocket, DBBL, and Bank immediately call `saveTransaction(msg, amount)` which adds balance directly to Firestore without a gateway callback or webhooks.
- In production, balance recharge must be confirmed by server-side Firebase Cloud Functions or an SSLCommerz/bKash Merchant Webhook.

---

## 4. Recommended Production Security Rules (`firestore.rules`)

To secure the Firestore database, deploy the following security rules using the Firebase CLI (`firebase deploy --only firestore:rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if the user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user matches the document or email
    function isOwner(email) {
      return isAuthenticated() && request.auth.token.email == email;
    }

    // 1. User Profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update, delete: if isAuthenticated() && request.auth.uid == userId;
    }

    // 2. Shop Owners Registry
    match /shopowners/{ownerId} {
      allow read: if true; // Publicly readable so customers can list active shops
      allow write: if isAuthenticated();
    }

    // 3. Products
    match /products/{productId} {
      allow read: if true; // Publicly readable for customer shop views
      allow write: if isAuthenticated(); // Restrict to authenticated shop owners
    }

    // 4. Orders
    match /orders/{orderId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.email == request.auth.token.email;
      allow update, delete: if isAuthenticated();
    }

    // 5. Wallets
    match /wallets/{email} {
      allow read: if isOwner(email);
      // In production, writing should be restricted to trusted backend / Cloud Functions
      allow write: if isOwner(email);
    }

    // 6. User Comments / Reviews
    match /userComments/{commentId} {
      allow read: if true; // Publicly readable on landing page
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
  }
}
```
