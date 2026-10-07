import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

let balance = 0;
let generatedOtp = "";
let walletDocRef;
let currentEmail = "";

const balanceDisplay = document.getElementById('balance');
const historyList = document.getElementById('history');
const userEmailTag = document.getElementById('userEmailTag');

function updateBalanceDisplay() {
  if (balanceDisplay) {
    balanceDisplay.textContent = Number(balance).toFixed(2);
  }
}

function addHistory(text) {
  if (!historyList) return;
  const li = document.createElement('li');
  const isDebit = text.includes("Order placed") || text.includes("-");
  li.innerHTML = `
    <span>${text}</span>
    <span style="font-weight: 700; color: ${isDebit ? '#ef4444' : '#10b981'};">
      ${isDebit ? '−' : '+'}
    </span>
  `;
  historyList.prepend(li);
}

async function saveTransaction(text, amount) {
  balance += amount;
  updateBalanceDisplay();

  if (walletDocRef) {
    await updateDoc(walletDocRef, {
      balance: balance,
      transactions: arrayUnion(text)
    });
  }

  addHistory(text);
}

async function loadWallet() {
  if (!walletDocRef) return;
  const docSnap = await getDoc(walletDocRef);
  if (historyList) historyList.innerHTML = "";

  if (docSnap.exists()) {
    const data = docSnap.data();
    balance = data.balance || 0;
    updateBalanceDisplay();
    if (Array.isArray(data.transactions) && data.transactions.length > 0) {
      data.transactions.forEach(addHistory);
    } else {
      addHistory("Initial Balance: ৳0.0");
    }
  } else {
    await setDoc(walletDocRef, {
      balance: 0,
      transactions: ["Initial Balance: ৳0.0"]
    });
    balance = 0;
    updateBalanceDisplay();
    addHistory("Initial Balance: ৳0.0");
  }
}

// Session Auth Check
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentEmail = user.email;
    if (userEmailTag) userEmailTag.textContent = currentEmail;
    walletDocRef = doc(db, "wallets", currentEmail);
    await loadWallet();
  } else {
    alert("ওয়ালেট ব্যবহার করতে অনুগ্রহ করে লগইন করুন।");
    window.location.href = "customer-login.html";
  }
});

// Quick Recharge Amount Chip Setter
window.setRechargeAmount = function (amt) {
  const amountInput = document.getElementById('amount');
  if (amountInput) {
    amountInput.value = amt;
    showPaymentOptions();
  }
};

// Show Payment Gateways
window.showPaymentOptions = function () {
  const amountInput = document.getElementById('amount');
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    alert("দয়া করে প্রথমে রিচার্জের পরিমাণ লিখুন।");
    amountInput.focus();
    return;
  }
  const opts = document.getElementById('paymentOptions');
  if (opts) opts.style.display = 'grid';
  document.getElementById('bkashForm').style.display = 'none';
};

// Select Gateway
window.selectPayment = function (method) {
  const amountInput = document.getElementById('amount');
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    alert("দয়া করে প্রথমে সঠিক রিচার্জের পরিমাণ নির্ধারণ করুন।");
    return;
  }

  if (method === 'bKash') {
    document.getElementById('paymentOptions').style.display = 'none';
    document.getElementById('bkashForm').style.display = 'block';
  } else {
    const msg = `Recharged ৳${amount.toFixed(2)} via ${method}`;
    saveTransaction(msg, amount);
    amountInput.value = '';
    document.getElementById('paymentOptions').style.display = 'none';
    alert(`✅ ${method} এর মাধ্যমে ৳${amount} সফলভাবে ওয়ালেটে রিচার্জ হয়েছে!`);
  }
};

// bKash Flow
window.confirmBkash = function () {
  const bkashNumber = document.getElementById('bkashNumber').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!bkashNumber || bkashNumber.length < 11) {
    alert("সঠিক ১১ ডিজিটের বিকাশ নম্বর প্রদান করুন।");
    return;
  }
  if (!amount || amount <= 0) {
    alert("সঠিক পরিমাণ লিখুন।");
    return;
  }

  generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("%c[FreshFold bKash Simulator] Your OTP is: " + generatedOtp, "color: #e2136e; font-size: 16px; font-weight: bold;");
  alert(`[সিমুলেশন] আপনার ওটিপি কোড: ${generatedOtp} (ব্রাউজার কনসোলেও দেখতে পাবেন)`);

  document.getElementById('bkashForm').style.display = 'none';
  document.getElementById('otpSection').style.display = 'block';
};

window.verifyOtp = function () {
  const userOtp = document.getElementById('otpInput').value.trim();
  const bkashNumber = document.getElementById('bkashNumber').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (userOtp === generatedOtp) {
    const msg = `Recharged ৳${amount.toFixed(2)} via bKash (${bkashNumber})`;
    saveTransaction(msg, amount);
    document.getElementById('bkashNumber').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('otpInput').value = '';
    document.getElementById('otpSection').style.display = 'none';
    alert(`✅ বিকাশ দিয়ে ৳${amount} রিচার্জ সফল হয়েছে!`);
  } else {
    alert("❌ ওটিপি ভুল হয়েছে। আবার চেষ্টা করুন।");
  }
};

window.cancelBkash = function () {
  document.getElementById('bkashForm').style.display = 'none';
};

window.cancelOtp = function () {
  document.getElementById('otpSection').style.display = 'none';
  document.getElementById('bkashNumber').value = '';
};
