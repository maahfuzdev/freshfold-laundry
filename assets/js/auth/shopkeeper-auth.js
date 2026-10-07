import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrPUFMdKuxMDV16RIu833yvzw-a8WxCSg",
  authDomain: "smart-laundry-2d523.firebaseapp.com",
  projectId: "smart-laundry-2d523",
  storageBucket: "smart-laundry-2d523.appspot.com",
  messagingSenderId: "7431686498",
  appId: "1:7431686498:web:d4d1a4377327c7eafac43b",
  measurementId: "G-K6W312NY4M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tab Switching
document.querySelectorAll('[data-tab]').forEach(tab => {
  tab.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.getAttribute('data-tab');
    document.querySelectorAll('.tab-link').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    const activeHeaderTab = document.querySelector(`.tab-link[data-tab="${target}"]`);
    if (activeHeaderTab) {
      activeHeaderTab.classList.add('active');
      activeHeaderTab.setAttribute('aria-selected', 'true');
    }

    const targetContent = document.getElementById(target);
    if (targetContent) {
      targetContent.classList.add('active');
    }
  });
});

// Helper: Email to Firestore-safe doc id
function emailToDocId(email) {
  return email.replace(/\./g, "_").replace(/@/g, "_at_");
}

// Registration Handler
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('registerError');
  const successEl = document.getElementById('registerSuccess');
  if (errorEl) errorEl.textContent = '';
  if (successEl) successEl.textContent = '';

  const shopName = document.getElementById('shopName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const shopPlace = document.getElementById('shopPlace').value.trim();

  if (shopName.length < 3) {
    if (errorEl) errorEl.textContent = "❌ দোকানের নাম কমপক্ষে ৩ অক্ষরের হতে হবে।";
    return;
  }
  if (shopPlace.length < 3) {
    if (errorEl) errorEl.textContent = "❌ এলাকা বা লোকেশন কমপক্ষে ৩ অক্ষরের হতে হবে।";
    return;
  }
  if (password.length < 6) {
    if (errorEl) errorEl.textContent = "❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
    return;
  }

  try {
    // Check if email already registered as customer
    const userQuery = query(collection(db, "users"), where("email", "==", email));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      if (errorEl) errorEl.textContent = "❌ এই ইমেইলটি সাধারণ কাস্টমার হিসেবে নিবন্ধিত। অন্য ইমেইল ব্যবহার করুন।";
      return;
    }

    // Create Firebase Auth Account
    await createUserWithEmailAndPassword(auth, email, password);
    const docId = emailToDocId(email);

    // Save Shop Owner Details
    await setDoc(doc(db, "shopowners", docId), {
      shopName,
      email,
      shopPlace,
      createdAt: new Date()
    });

    if (successEl) successEl.textContent = "✅ দোকান সফলভাবে নিবন্ধিত হয়েছে! লগইন করুন।";
    document.getElementById('registerForm').reset();

    setTimeout(() => {
      document.querySelector('.tab-link[data-tab="login"]')?.click();
    }, 1500);

  } catch (error) {
    if (errorEl) errorEl.textContent = "❌ " + error.message;
  }
});

// Login Handler
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.textContent = '';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    // Verify user exists in shopowners collection
    const shopRef = collection(db, "shopowners");
    const q = query(shopRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (errorEl) errorEl.textContent = "❌ এই ইমেইলে কোনো দোকানদার অ্যাকাউন্ট পাওয়া যায়নি।";
      return;
    }

    // Authenticate with Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    if (errorEl) errorEl.textContent = "❌ " + error.message;
  }
});
