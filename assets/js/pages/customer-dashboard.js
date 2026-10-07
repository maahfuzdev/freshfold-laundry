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
let selectedShopName = null;
let selectedShopEmail = null;
let currentProducts = [];
let appliedDiscount = 0;
let baseOrderTotal = 0;

// Default Starter Catalog for shops that haven't created products yet
const defaultCatalog = [
  { name: "শার্ট / টি-শার্ট ওয়াশ ও আয়রন", price: 35, category: "men", img: "../assets/images/products/tshirt.png" },
  { name: "পাঞ্জাবি ওয়াশ ও রোল প্রেসিং", price: 60, category: "men", img: "../assets/images/products/panjabi.png" },
  { name: "সুতি ও জর্জেট শাড়ি স্পেশাল", price: 90, category: "women", img: "../assets/images/products/sarri.png" },
  { name: "থ্রি-পিস কমপ্লিট কেয়ার", price: 80, category: "women", img: "../assets/images/products/3pice.png" },
  { name: "প্যান্ট / ট্রাউজার প্রেসিং", price: 40, category: "men", img: "../assets/images/products/p.png" },
  { name: "বিছানার চাদর ও কভার", price: 120, category: "household", img: "../assets/images/products/cotton.png" }
];

// Wallet helper
async function getWalletDocByEmail(email) {
  const docRef = doc(db, "wallets", email);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, data: () => snapshot.data() };
  } else {
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

// Filter Category Chips
window.filterCategory = function (category) {
  document.querySelectorAll('.category-chip').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.category-chip')).find(btn => {
    return btn.getAttribute('onclick')?.includes(category);
  });
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.item-card').forEach(card => {
    const cardCat = card.getAttribute('data-category') || 'all';
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
};

// Render Products in Grid
function renderProductCards(items) {
  const container = document.querySelector(".main");
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--sand-500);">
        <i class="fa-solid fa-store-slash" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.5;"></i>
        <p>এই দোকানে বর্তমানে কোনো সেবা তালিকাভুক্ত নেই। অনুগ্রহ করে অন্য দোকান নির্বাচন করুন।</p>
      </div>
    `;
    return;
  }

  items.forEach((product, idx) => {
    const safeImg = product.img ? product.img.trim() : '../assets/images/products/cotton.png';
    const prodId = product.id || `default_${idx}`;

    const card = document.createElement("div");
    card.className = "item-card";
    card.setAttribute("data-product-id", prodId);
    card.setAttribute("data-category", product.category || "men");

    card.innerHTML = `
      <img src="${safeImg}" alt="${product.name}" loading="lazy"
           onerror="this.onerror=null; this.src='../assets/images/products/cotton.png'">
      <div class="item-details">
        <div>
          <span class="item-category-tag">${getCategoryName(product.category)}</span>
          <h3 class="item-title">${product.name}</h3>
          <p class="product-price">৳ ${product.price} <span style="font-size: 0.8rem; font-weight: normal; color: var(--sand-500);">/ পিস</span></p>
        </div>
        <div class="quantity-stepper">
          <button class="stepper-btn" type="button" onclick="stepQty('${prodId}', -1)">−</button>
          <input type="number" placeholder="0" min="0" value=""
                 data-name="${product.name}" data-price="${product.price}" 
                 aria-label="${product.name} পরিমাণ">
          <button class="stepper-btn" type="button" onclick="stepQty('${prodId}', 1)">+</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function getCategoryName(cat) {
  switch (cat) {
    case 'men': return 'পুরুষ (Men)';
    case 'women': return 'মহিলা (Women)';
    case 'household': return 'গৃহস্থালী (Household)';
    case 'dryclean': return 'ড্রাই ক্লিন';
    default: return 'রেগুলার ওয়াশ';
  }
}

// Load Shop-Specific Products
async function loadShopProducts(ownerEmail) {
  const container = document.querySelector(".main");
  container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--sand-500);"><i class="fa-solid fa-spinner fa-spin"></i> শপের পণ্য তালিকা লোড হচ্ছে...</div>`;

  try {
    // 1. First, search for products registered specifically by this shopowner
    const q = query(collection(db, "products"), where("shopEmail", "==", ownerEmail));
    const snap = await getDocs(q);

    let items = [];
    if (!snap.empty) {
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
    } else {
      // 2. Also check if products are stored with 'email' field
      const qAlt = query(collection(db, "products"), where("email", "==", ownerEmail));
      const snapAlt = await getDocs(qAlt);
      if (!snapAlt.empty) {
        snapAlt.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
      } else {
        // Fallback to default catalog with shop pricing so customer can always order
        items = defaultCatalog.map((item, idx) => ({ ...item, id: `def_${idx}` }));
      }
    }

    currentProducts = items;
    renderProductCards(items);

  } catch (err) {
    console.error("Error loading shop products:", err);
    renderProductCards(defaultCatalog);
  }
}

// Load Active Shops List
async function loadShops() {
  const container = document.querySelector(".shopListContainer");
  container.innerHTML = `<h3><i class="fa-solid fa-store"></i> সক্রিয় লন্ড্রি শপসমূহ</h3>`;

  try {
    const shopSnapshot = await getDocs(collection(db, "shopowners"));

    if (shopSnapshot.empty) {
      container.innerHTML += `<p style="font-size: 0.9rem; color: var(--sand-500);">কোনো সক্রিয় দোকান পাওয়া যায়নি।</p>`;
      return;
    }

    let firstButton = null;

    shopSnapshot.forEach((docSnap, index) => {
      const data = docSnap.data();
      const shopName = data.shopName;
      const email = data.email;
      const place = data.shopPlace || "Chittagong";

      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        <span style="font-weight: 700;">${shopName}</span>
        <span style="font-size: 0.8rem; font-weight: 500; color: var(--sand-500);"><i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i>${place}</span>
      `;

      button.onclick = () => {
        document.querySelectorAll('.shopListContainer button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        selectedShopName = shopName;
        selectedShopEmail = email;

        // Update Banner
        const nameDisplay = document.getElementById("activeShopNameDisplay");
        const placeDisplay = document.getElementById("activeShopPlaceDisplay");
        if (nameDisplay) nameDisplay.textContent = shopName;
        if (placeDisplay) placeDisplay.textContent = place;

        // Load that shop's specific products and pictures
        loadShopProducts(email);
      };

      container.appendChild(button);

      if (index === 0) firstButton = button;
    });

    // Auto-select the first shop
    if (firstButton) firstButton.click();

  } catch (err) {
    console.error("Error loading shops:", err);
  }
}

// Load User Balance
async function loadUserBalance(email) {
  const walletDoc = await getWalletDocByEmail(email);
  const balance = walletDoc?.data().balance || 0;
  const balanceEl = document.getElementById("userBalance");
  if (balanceEl) balanceEl.innerText = Number(balance).toFixed(2);
}

// Coupon / Promo Code Application
window.applyCoupon = function () {
  const couponInput = document.getElementById("couponCode");
  const msgEl = document.getElementById("couponMessage");
  const code = (couponInput?.value || "").trim().toUpperCase();

  if (!code) {
    if (msgEl) { msgEl.style.color = "#a83232"; msgEl.textContent = "দয়া করে একটি কুপন কোড লিখুন।"; }
    return;
  }

  if (code === "FIRST20") {
    appliedDiscount = Math.round(baseOrderTotal * 0.20);
    if (msgEl) {
      msgEl.style.color = "#2e6933";
      msgEl.textContent = `✅ 'FIRST20' কোডে ২০% ছাড় (৳${appliedDiscount}) সফলভাবে যুক্ত হয়েছে!`;
    }
  } else if (code === "FRESH50" && baseOrderTotal >= 200) {
    appliedDiscount = 50;
    if (msgEl) {
      msgEl.style.color = "#2e6933";
      msgEl.textContent = `✅ 'FRESH50' কোডে ৳৫০ ছাড় সফলভাবে যুক্ত হয়েছে!`;
    }
  } else {
    appliedDiscount = 0;
    if (msgEl) {
      msgEl.style.color = "#a83232";
      msgEl.textContent = "❌ কুপন কোডটি সঠিক নয় অথবা শর্ত পূরণ করেনি।";
    }
  }

  renderBillTable();
};

// Render Bill Table inside Modal
function renderBillTable() {
  const inputs = document.querySelectorAll('.item-card input[type="number"]');
  let itemsHTML = "";
  let subtotalSum = 0;

  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    const name = input.dataset.name;
    const price = parseInt(input.dataset.price) || 0;
    if (qty > 0) {
      const subtotal = qty * price;
      subtotalSum += subtotal;
      itemsHTML += `
        <tr style="border-bottom: 1px solid #edf1eb;">
          <td style="padding: 7px 0; font-weight: 500;">${name}</td>
          <td style="text-align: center; padding: 7px 0;">${qty}</td>
          <td style="text-align: right; padding: 7px 0;">৳${price}</td>
          <td style="text-align: right; padding: 7px 0; font-weight: 600;">৳${subtotal}</td>
        </tr>
      `;
    }
  });

  baseOrderTotal = subtotalSum;
  const finalTotal = Math.max(0, baseOrderTotal - appliedDiscount);

  let billHTML = `
    <div style="font-size: 0.92rem; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5ebe4;">
      <strong>নির্বাচিত দোকান:</strong> <span style="color: var(--primary); font-weight: 700;">${selectedShopName || "FreshFold"}</span>
    </div>
    <table style="width:100%; border-collapse: collapse; font-size: 0.92rem;">
      <tr style="border-bottom: 1px solid #e0e6df; color: var(--sand-600); text-align: left;">
        <th style="padding: 6px 0;">আইটেম</th>
        <th style="text-align: center; padding: 6px 0;">পরিমাণ</th>
        <th style="text-align: right; padding: 6px 0;">দর</th>
        <th style="text-align: right; padding: 6px 0;">মোট</th>
      </tr>
      ${itemsHTML}
  `;

  if (appliedDiscount > 0) {
    billHTML += `
      <tr style="color: #2e6933; font-weight: 600;">
        <td colspan="3" style="text-align: right; padding: 8px 0;">ডিসকাউন্ট ছাড়:</td>
        <td style="text-align: right; padding: 8px 0;">- ৳${appliedDiscount}</td>
      </tr>
    `;
  }

  billHTML += `
    <tr style="font-weight: 800; font-size: 1.05rem;">
      <td colspan="3" style="text-align: right; padding: 12px 0;">সর্বমোট পরিশোধযোগ্য:</td>
      <td style="text-align: right; padding: 12px 0; color: var(--primary);">৳${finalTotal}</td>
    </tr>
  </table>
  `;

  document.getElementById('billDetails').innerHTML = billHTML;
  window.lastCalculatedTotal = finalTotal;
}

// Generate Bill
window.generateBill = async function () {
  const user = auth.currentUser;
  if (!user) { alert("❌ ইউজার লগইন নেই। দয়া করে লগইন করুন।"); return; }
  if (!selectedShopName) { alert("⚠️ দয়া করে একটি লন্ড্রি শপ সিলেক্ট করুন।"); return; }

  const inputs = document.querySelectorAll('.item-card input[type="number"]');
  let hasItems = false;
  inputs.forEach(input => {
    if ((parseInt(input.value) || 0) > 0) hasItems = true;
  });

  if (!hasItems) {
    alert("⚠️ অন্তত একটি কাপড়ের সংখ্যা নির্ধারণ করুন।");
    return;
  }

  appliedDiscount = 0;
  const msgEl = document.getElementById("couponMessage");
  if (msgEl) msgEl.textContent = "";

  renderBillTable();

  // Check Wallet
  const walletDoc = await getWalletDocByEmail(user.email);
  const currentBalance = walletDoc?.data().balance || 0;
  const finalTotal = window.lastCalculatedTotal || 0;

  const balanceNotice = document.createElement("div");
  balanceNotice.style.cssText = `margin-top: 10px; padding: 8px 12px; border-radius: 8px; font-size: 0.88rem; background: ${currentBalance >= finalTotal ? '#f0fdf4; color: #166534;' : '#fef2f2; color: #991b1b;'}`;
  balanceNotice.innerHTML = `
    ওয়ালেট ব্যালেন্স: <strong>৳${Number(currentBalance).toFixed(2)}</strong> 
    ${currentBalance >= finalTotal ? ' (✅ পর্যাপ্ত ব্যালেন্স আছে)' : ' (❌ অপর্যাপ্ত ব্যালেন্স, অনুগ্রহ করে রিচার্জ করুন)'}
  `;
  document.getElementById('billDetails').appendChild(balanceNotice);

  document.getElementById('billModal').style.display = 'flex';
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
  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    const itemName = input.dataset.name;
    const price = parseInt(input.dataset.price) || 0;
    if (qty > 0) {
      items.push({ name: itemName, qty, price, subtotal: qty * price });
    }
  });

  if (!name || !phone || !address || items.length === 0) {
    alert("⚠️ দয়া করে নাম, মোবাইল নম্বর, ঠিকানা পূরণ করুন এবং অন্তত ১টি আইটেম সিলেক্ট করুন।");
    return;
  }

  const finalTotal = window.lastCalculatedTotal || 0;

  // Verify Wallet Balance
  const walletDoc = await getWalletDocByEmail(email);
  const currentBalance = walletDoc?.data().balance || 0;
  if (currentBalance < finalTotal) {
    alert("❌ আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। দয়া করে আগে ওয়ালেট রিচার্জ করুন।");
    return;
  }

  try {
    // 1. Add order to Firestore
    await addDoc(collection(db, "orders"), {
      name,
      phone,
      address,
      email,
      shop: selectedShopName,
      shopEmail: selectedShopEmail || "",
      items,
      discount: appliedDiscount,
      grandTotal: finalTotal,
      status: "Pending",
      timestamp: new Date()
    });

    // 2. Atomic Wallet Debit
    const walletRef = doc(db, "wallets", email);
    const walletSnap = await getDoc(walletRef);
    const oldData = walletSnap.exists() ? walletSnap.data() : { balance: 0, transactions: [] };

    await updateDoc(walletRef, {
      balance: increment(-finalTotal),
      transactions: [...(oldData.transactions || []), `Order placed (৳${finalTotal}) - ${selectedShopName}`]
    });

    alert("✅ আপনার লন্ড্রি অর্ডার সফলভাবে জমা হয়েছে!");
    document.getElementById('billModal').style.display = 'none';

    // Clear Fields
    document.getElementById('customerName').value = "";
    document.getElementById('customerPhone').value = "";
    document.getElementById('customerAddress').value = "";
    inputs.forEach(input => input.value = "");

    // Refresh User Info & Order History
    await loadUserBalance(email);
    await loadUserOrders(email);

  } catch (error) {
    console.error("❌ অর্ডার সমস্যা:", error);
    alert("❌ অর্ডার জমা দিতে সমস্যা হয়েছে: " + error.message);
  }
};

// Recharge Page Redirect
window.goToRechargePage = function () {
  window.location.href = "wallet.html";
};

// Close Modal on Click Outside
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

  const email = user.email;
  loadUserBalance(email);
  loadUserOrders(email);
  loadShops();
  displayEmailToggle(email);
});
