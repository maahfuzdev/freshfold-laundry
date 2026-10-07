import { initializeCustomerHistory } from "../features/customer-history.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  query,
  where
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

// State
let selectedShop = null;
let productsList = [];
let currentUser = null;

// Wallet document helper
async function getWalletDocByEmail(email) {
  const docRef = doc(db, "wallets", email);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, data: () => snapshot.data() };
  } else {
    // If not found, auto-initialize
    const initialData = { balance: 0, transactions: ["Initial Balance: ৳0.0"] };
    await setDoc(docRef, initialData);
    return { id: email, data: () => initialData };
  }
}

// Quantity Steppers
window.stepQty = function (productId, delta) {
  const input = document.querySelector(`.item-card[data-product-id="${productId}"] input[type="number"]`);
  if (!input) return;
  let val = parseInt(input.value) || 0;
  val = Math.max(0, val + delta);
  input.value = val > 0 ? val : "";
};

// Load Products
async function loadProducts() {
  const productsCol = collection(db, "products");
  const productSnapshot = await getDocs(productsCol);
  const container = document.querySelector(".main");
  container.innerHTML = "";
  productsList = [];

  if (productSnapshot.empty) {
    container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--slate-500);">কোনো সেবা পাওয়া যায়নি।</p>`;
    return;
  }

  productSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const safeImg = data.img ? data.img.trim() : 'https://via.placeholder.com/240x160?text=FreshFold';

    productsList.push({ ...data, id: docSnap.id });

    const item = document.createElement("div");
    item.className = "item-card";
    item.setAttribute("data-product-id", docSnap.id);

    item.innerHTML = `
      <img src="${safeImg}" alt="${data.name}" loading="lazy"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/240x160?text=FreshFold'">
      <div class="item-details">
        <div>
          <h3 class="item-title">${data.name}</h3>
          <p class="product-price">৳ ${data.price} <span style="font-size: 0.8rem; font-weight: normal; color: var(--slate-500);">/ পিস</span></p>
        </div>
        <div class="quantity-stepper">
          <button class="stepper-btn" type="button" onclick="stepQty('${docSnap.id}', -1)">−</button>
          <input type="number" placeholder="0" min="0" value=""
                 data-name="${data.name}" data-price="${data.price}" 
                 aria-label="${data.name} পরিমাণ">
          <button class="stepper-btn" type="button" onclick="stepQty('${docSnap.id}', 1)">+</button>
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

// Load Active Shops
async function loadShops() {
  const shopSnapshot = await getDocs(collection(db, "shopowners"));
  const container = document.querySelector(".shopListContainer");
  container.innerHTML = `<h3><i class="fa-solid fa-store"></i> সক্রিয় লন্ড্রি শপসমূহ</h3>`;

  if (shopSnapshot.empty) {
    container.innerHTML += `<p style="font-size: 0.9rem; color: var(--slate-500);">কোনো সক্রিয় দোকান নেই।</p>`;
    return;
  }

  shopSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const shopName = data.shopName;
    const email = data.email;
    const place = data.shopPlace || "Chittagong";

    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <span style="font-weight: 700;">${shopName}</span>
      <span style="font-size: 0.8rem; font-weight: 500; color: var(--slate-500);"><i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i>${place}</span>
    `;

    button.onclick = () => {
      document.querySelectorAll('.shopListContainer button').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      showProducts(email, shopName);
    };

    container.appendChild(button);
  });

  // Auto select first shop if available
  const firstButton = container.querySelector("button");
  if (firstButton) firstButton.click();
}

async function showProducts(ownerEmail, shopName) {
  selectedShop = shopName;
  if (!ownerEmail) return;

  const productQuery = query(collection(db, "products"), where("email", "==", ownerEmail));
  const querySnapshot = await getDocs(productQuery);

  querySnapshot.forEach((docSnap) => {
    const productData = docSnap.data();
    const productId = docSnap.id;

    const itemCard = document.querySelector(`.item-card[data-product-id="${productId}"]`);
    if (itemCard) {
      const priceTag = itemCard.querySelector(".product-price");
      const input = itemCard.querySelector("input");

      if (priceTag) priceTag.innerHTML = `৳ ${productData.price} <span style="font-size: 0.8rem; font-weight: normal; color: var(--slate-500);">/ পিস</span>`;
      if (input) input.dataset.price = productData.price;
    }
  });
}

// Load User Balance
async function loadUserBalance(email) {
  const walletDoc = await getWalletDocByEmail(email);
  const balance = walletDoc?.data().balance || 0;
  const balanceEl = document.getElementById("userBalance");
  if (balanceEl) balanceEl.innerText = Number(balance).toFixed(2);
}

// Generate Bill Modal
window.generateBill = async function () {
  const user = auth.currentUser;
  if (!user) { alert("❌ ইউজার লগইন নেই। দয়া করে লগইন করুন।"); return; }
  if (!selectedShop) { alert("⚠️ দয়া করে একটি লন্ড্রি শপ সিলেক্ট করুন।"); return; }
  const email = user.email;

  const inputs = document.querySelectorAll('.item-card input[type="number"]');
  let billHTML = `
    <div style="font-size: 0.92rem; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--slate-200);">
      <strong>দোকান:</strong> <span style="color: var(--primary);">${selectedShop}</span>
    </div>
    <table style="width:100%; border-collapse: collapse; font-size: 0.92rem;">
      <tr style="border-bottom: 1px solid var(--slate-200); color: var(--slate-600); text-align: left;">
        <th style="padding: 6px 0;">আইটেম</th>
        <th style="text-align: center; padding: 6px 0;">পরিমাণ</th>
        <th style="text-align: right; padding: 6px 0;">দর</th>
        <th style="text-align: right; padding: 6px 0;">মোট</th>
      </tr>
  `;

  let total = 0;
  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    const name = input.dataset.name;
    const price = parseInt(input.dataset.price) || 0;
    if (qty > 0) {
      const subtotal = qty * price;
      total += subtotal;
      billHTML += `
        <tr style="border-bottom: 1px solid var(--slate-100);">
          <td style="padding: 8px 0; font-weight: 500;">${name}</td>
          <td style="text-align: center; padding: 8px 0;">${qty}</td>
          <td style="text-align: right; padding: 8px 0;">৳${price}</td>
          <td style="text-align: right; padding: 8px 0; font-weight: 600;">৳${subtotal}</td>
        </tr>
      `;
    }
  });

  if (total === 0) {
    alert("⚠️ অন্তত একটি কাপড়ের সংখ্যা নির্ধারণ করুন।");
    return;
  }

  const walletDoc = await getWalletDocByEmail(email);
  const currentBalance = walletDoc?.data().balance || 0;

  billHTML += `
    <tr style="font-weight: 800; font-size: 1.05rem;">
      <td colspan="3" style="text-align: right; padding: 12px 0;">সর্বমোট বিল:</td>
      <td style="text-align: right; padding: 12px 0; color: var(--primary);">৳${total}</td>
    </tr>
  </table>
  <div style="margin-top: 10px; padding: 8px 12px; border-radius: 8px; font-size: 0.88rem; background: ${currentBalance >= total ? '#f0fdf4; color: #166534;' : '#fef2f2; color: #991b1b;'}">
    ওয়ালেট ব্যালেন্স: <strong>৳${Number(currentBalance).toFixed(2)}</strong> 
    ${currentBalance >= total ? ' (✅ পর্যাপ্ত ব্যালেন্স আছে)' : ' (❌ অপর্যাপ্ত ব্যালেন্স, অনুগ্রহ করে রিচার্জ করুন)'}
  </div>
  `;

  if (currentBalance < total) {
    billHTML += `
      <div style="margin-top: 10px; text-align: center;">
        <button onclick="goToRechargePage()" style="padding: 6px 14px; background: #16a34a; color: #fff; border:none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
          💳 এখনই রিচার্জ করুন
        </button>
      </div>
    `;
  }

  document.getElementById('billDetails').innerHTML = billHTML;
  document.getElementById('billModal').style.display = 'flex';
  window.lastOrderTotal = total;
};

// Submit Order
window.submitOrder = async function () {
  const user = auth.currentUser;
  if (!user) { alert("❌ ইউজার লগইন নেই।"); return; }
  const email = user.email;

  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const inputs = document.querySelectorAll('.item-card input[type="number"]');

  const items = [];
  let grandTotal = 0;
  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    const itemName = input.dataset.name;
    const price = parseInt(input.dataset.price) || 0;
    if (qty > 0) {
      const subtotal = qty * price;
      grandTotal += subtotal;
      items.push({ name: itemName, qty, price, subtotal });
    }
  });

  if (!name || !phone || !address || items.length === 0) {
    alert("⚠️ দয়া করে নাম, মোবাইল নম্বর, ঠিকানা পূরণ করুন এবং অন্তত ১টি আইটেম সিলেক্ট করুন।");
    return;
  }

  if (!selectedShop) {
    alert("⚠️ দয়া করে একটি শপ সিলেক্ট করুন।");
    return;
  }

  // Check balance once more
  const walletDoc = await getWalletDocByEmail(email);
  const currentBalance = walletDoc?.data().balance || 0;
  if (currentBalance < grandTotal) {
    alert("❌ আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। দয়া করে আগে ওয়ালেট রিচার্জ করুন।");
    return;
  }

  try {
    // 1. Save order into Firestore
    await addDoc(collection(db, "orders"), {
      name,
      phone,
      address,
      email,
      shop: selectedShop,
      items,
      grandTotal,
      status: "Pending",
      timestamp: new Date()
    });

    // 2. Atomic Wallet Debit
    const walletRef = doc(db, "wallets", email);
    const walletSnap = await getDoc(walletRef);
    const oldData = walletSnap.exists() ? walletSnap.data() : { balance: 0, transactions: [] };

    await updateDoc(walletRef, {
      balance: increment(-grandTotal),
      transactions: [...(oldData.transactions || []), `Order placed (৳${grandTotal}) - ${selectedShop}`]
    });

    alert("✅ আপনার লন্ড্রি অর্ডার সফলভাবে জমা হয়েছে!");
    document.getElementById('billModal').style.display = 'none';

    // Clear input fields
    document.getElementById('customerName').value = "";
    document.getElementById('customerPhone').value = "";
    document.getElementById('customerAddress').value = "";
    inputs.forEach(input => input.value = "");

    // Refresh UI
    await loadUserBalance(email);
    // FIX BUG #1: call loadUserOrders, NOT undefined loadOrderHistory!
    await loadUserOrders(email);

  } catch (error) {
    console.error("❌ অর্ডার সমস্যা:", error);
    alert("❌ অর্ডার প্রক্রিয়ায় ত্রুটি: " + error.message);
  }
};

// Recharge Redirect
window.goToRechargePage = function () {
  window.location.href = "wallet.html";
};

// Modal Outside Click
window.onclick = function (event) {
  const modal = document.getElementById('billModal');
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Customer History Feature Binding
const { displayEmailToggle, loadUserOrders } = initializeCustomerHistory(db, auth);

// Session Auth State Changed
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "customer-login.html";
    return;
  }

  currentUser = user;
  const email = user.email;

  loadUserBalance(email);
  loadUserOrders(email);
  loadProducts();
  loadShops();
  displayEmailToggle(email);
});
