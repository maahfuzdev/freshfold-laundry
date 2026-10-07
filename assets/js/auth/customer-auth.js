import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Registration Handler
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('registerError');
  const successEl = document.getElementById('registerSuccess');
  if (errorEl) errorEl.textContent = '';
  if (successEl) successEl.textContent = '';

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value.trim();

  // Validate Bangladeshi Phone Number
  const phoneRegex = /^01[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    if (errorEl) errorEl.textContent = "❌ সঠিক ১১ ডিজিটের বাংলাদেশি ফোন নম্বর দিন (০১XXXXXXXXX)";
    return;
  }

  // Validate Password Length
  if (password.length < 6) {
    if (errorEl) errorEl.textContent = "❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
    return;
  }

  try {
    // Check if this email is already a shopkeeper
    const shopOwnerQuery = query(collection(db, "shopowners"), where("email", "==", email));
    const shopOwnerSnapshot = await getDocs(shopOwnerQuery);
    if (!shopOwnerSnapshot.empty) {
      if (errorEl) errorEl.textContent = "❌ এই ইমেইলটি দোকান মালিক হিসেবে নিবন্ধিত। কাস্টমার হিসেবে অন্য ইমেইল ব্যবহার করুন।";
      return;
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create User Profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      phone,
      createdAt: new Date()
    });

    // Automatically initialize Digital Wallet for seamless checkout
    await setDoc(doc(db, "wallets", email), {
      balance: 0,
      transactions: ["Initial Balance: ৳0.0"]
    });

    if (successEl) successEl.textContent = "✅ রেজিস্ট্রেশন সফল হয়েছে! লগইন করুন।";
    document.getElementById('registerForm').reset();

    setTimeout(() => {
      document.querySelector('.tab-link[data-tab="login"]')?.click();
    }, 1500);

  } catch (error) {
    if (errorEl) errorEl.textContent = "❌ রেজিস্ট্রেশন ব্যর্থ: " + error.message;
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
    // Verify user exists in customer "users" collection
    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (errorEl) errorEl.textContent = "❌ আপনি কাস্টমার হিসেবে নিবন্ধিত নন। রেজিস্ট্রেশন করুন অথবা সঠিক অ্যাকাউন্টে যান।";
      return;
    }

    // Authenticate with Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "customer-dashboard.html";

  } catch (error) {
    if (errorEl) errorEl.textContent = "❌ " + error.message;
  }
});
