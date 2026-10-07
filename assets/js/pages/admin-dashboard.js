import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrPUFMdKuxMDV16RIu833yvzw-a8WxCSg",
  authDomain: "smart-laundry-2d523.firebaseapp.com",
  projectId: "smart-laundry-2d523",
  storageBucket: "smart-laundry-2d523.appspot.com",
  messagingSenderId: "7431686498",
  appId: "1:7431686498:web:d4d1a4377327c7eafac43b",
  measurementId: "G-K6W312NY4M",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const productListEl = document.getElementById("productList");
let currentShop = null;

// Auth Guard Check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "shopkeeper-login.html";
    return;
  }

  // Verify Shopowner profile
  const shopQuery = query(collection(db, "shopowners"), where("email", "==", user.email));
  const shopSnap = await getDocs(shopQuery);

  if (shopSnap.empty) {
    alert("❌ আপনি অনুমোদিত দোকান মালিক হিসেবে নিবন্ধিত নন।");
    await signOut(auth);
    window.location.href = "shopkeeper-login.html";
    return;
  }

  const shopData = shopSnap.docs[0].data();
  currentShop = shopData;

  const shopNameEl = document.getElementById("currentShopName");
  const shopEmailEl = document.getElementById("currentShopEmail");
  const shopPlaceEl = document.getElementById("currentShopPlace");

  if (shopNameEl) shopNameEl.textContent = shopData.shopName;
  if (shopEmailEl) shopEmailEl.textContent = user.email;
  if (shopPlaceEl) shopPlaceEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${shopData.shopPlace || "Chittagong"}</span>`;

  loadShopSpecificProducts(user.email);
  loadShopSpecificOrders(shopData.shopName, user.email);
});

// Logout Button
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  if (confirm("আপনি কি নিশ্চিত যে সাইন আউট করতে চান?")) {
    await signOut(auth);
    window.location.href = "shopkeeper-login.html";
  }
});

// Mobile Sidebar Toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const adminSidebar = document.getElementById("adminSidebar");
if (mobileMenuBtn && adminSidebar) {
  mobileMenuBtn.addEventListener("click", () => {
    adminSidebar.classList.toggle("hidden");
  });
}

// Tab Switching
window.switchTab = function (tabId) {
  const summarySec = document.getElementById("summarySection");
  const orderSec = document.getElementById("orderSection");
  const priceSec = document.getElementById("priceSection");

  const btnSummary = document.getElementById("btnSummary");
  const btnOrders = document.getElementById("btnOrders");
  const btnPrices = document.getElementById("btnPrices");

  const inactiveClass = "nav-tab w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all text-sand-600 hover:text-sand-900 hover:bg-sand-100";
  const activeClass = "nav-tab w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-sage-600 text-white shadow-sm";

  btnSummary.className = inactiveClass;
  btnOrders.className = inactiveClass;
  btnPrices.className = inactiveClass;

  if (tabId === "summaryTab") {
    summarySec.style.display = "grid";
    orderSec.style.display = "block";
    priceSec.style.display = "block";
    btnSummary.className = activeClass;
  } else if (tabId === "priceTab") {
    summarySec.style.display = "none";
    orderSec.style.display = "none";
    priceSec.style.display = "block";
    btnPrices.className = activeClass;
  } else if (tabId === "ordersTab") {
    summarySec.style.display = "none";
    orderSec.style.display = "block";
    priceSec.style.display = "none";
    btnOrders.className = activeClass;
  }

  if (window.innerWidth < 768 && adminSidebar) {
    adminSidebar.classList.add("hidden");
  }
};

// Modal Open/Close Controls
window.openAddProductModal = function () {
  document.getElementById("addProductModal").style.display = "flex";
};

window.closeAddProductModal = function () {
  document.getElementById("addProductModal").style.display = "none";
};

window.previewSelectedImage = function (val) {
  const customInput = document.getElementById("newProdCustomUrl");
  const previewImg = document.getElementById("imagePreview");
  if (val === "custom") {
    customInput.classList.remove("hidden");
    customInput.required = true;
    previewImg.src = customInput.value || "https://via.placeholder.com/80?text=Custom";
  } else {
    customInput.classList.add("hidden");
    customInput.required = false;
    previewImg.src = val;
  }
};

document.getElementById("newProdCustomUrl")?.addEventListener("input", function () {
  document.getElementById("imagePreview").src = this.value || "https://via.placeholder.com/80?text=Custom";
});

// Add New Product Submission
document.getElementById("addProductForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !currentShop) return;

  const name = document.getElementById("newProdName").value.trim();
  const category = document.getElementById("newProdCategory").value;
  const price = parseFloat(document.getElementById("newProdPrice").value);
  const presetSelect = document.getElementById("newProdImagePreset").value;
  const customUrl = document.getElementById("newProdCustomUrl").value.trim();

  const finalImg = presetSelect === "custom" ? customUrl : presetSelect;

  try {
    await addDoc(collection(db, "products"), {
      name,
      category,
      price,
      img: finalImg,
      shopEmail: user.email,
      shopName: currentShop.shopName,
      createdAt: new Date()
    });

    alert(`✅ '${name}' সফলভাবে আপনার দোকানের পণ্যের তালিকায় যুক্ত হয়েছে!`);
    document.getElementById("addProductForm").reset();
    closeAddProductModal();
    loadShopSpecificProducts(user.email);

  } catch (err) {
    console.error("Error adding product:", err);
    alert("❌ পণ্য যোগ করতে সমস্যা হয়েছে: " + err.message);
  }
});

// Load Shopkeeper's Products
async function loadShopSpecificProducts(shopEmail) {
  if (!productListEl) return;
  productListEl.innerHTML = `<div class="col-span-full py-8 text-center text-sand-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>পণ্য লোড হচ্ছে...</div>`;

  try {
    const q = query(collection(db, "products"), where("shopEmail", "==", shopEmail));
    const querySnapshot = await getDocs(q);

    productListEl.innerHTML = '';

    if (querySnapshot.empty) {
      productListEl.innerHTML = `
        <div class="col-span-full text-center py-12 bg-sand-50 rounded-2xl border border-dashed border-sand-300 p-6">
          <i class="fa-solid fa-shirt text-3xl text-sand-400 mb-2"></i>
          <h3 class="font-bold text-base text-sand-800">এখনও কোনো কাস্টম সেবা যুক্ত করা হয়নি</h3>
          <p class="text-xs text-sand-500 max-w-sm mx-auto mt-1 mb-4">আপনার দোকানের নিজস্ব কাপড়ের ছবি ও মূল্য নির্ধারণ করতে উপরের 'নতুন পণ্য / সেবা যোগ করুন' বাটনে ক্লিক করুন।</p>
          <button onclick="openAddProductModal()" class="text-xs font-bold bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-xl transition-all">
            + প্রথম পণ্য যোগ করুন
          </button>
        </div>
      `;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const product = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "bg-white border border-sand-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all";

      card.innerHTML = `
        <div>
          <div class="flex items-center gap-3 mb-3">
            <img class="w-16 h-16 rounded-xl border border-sand-200 object-cover bg-sand-50" 
                 src="${product.img || '../assets/images/products/cotton.png'}" 
                 onerror="this.onerror=null; this.src='../assets/images/products/cotton.png'" alt="${product.name}" />
            <div class="flex-1 min-w-0">
              <span class="inline-block px-2 py-0.5 bg-sand-100 rounded text-[10px] font-bold text-sand-600 uppercase mb-0.5">${product.category || 'regular'}</span>
              <h4 class="font-bold text-sand-900 text-sm truncate" title="${product.name}">${product.name}</h4>
              <p class="text-sm font-extrabold text-sage-700 mt-0.5">৳ <span class="current-price-val">${product.price}</span></p>
            </div>
          </div>
          
          <div class="price-input hidden w-full mt-2 pt-2 border-t border-sand-200">
            <input type="number" class="price-field p-2 border border-sand-300 rounded-lg w-full text-xs font-semibold focus:outline-none focus:border-sage-500" value="${product.price}" />
            <button class="set-price-btn mt-2 w-full bg-sage-600 hover:bg-sage-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors">
              মূল্য সেভ করুন
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-sand-100 pt-2.5 mt-2">
          <button class="edit-btn text-xs font-bold text-sage-700 hover:underline flex items-center gap-1">
            <i class="fa-solid fa-pen-to-square"></i> <span>মূল্য পরিবর্তন</span>
          </button>
          <button class="delete-prod-btn text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1" title="মুছে ফেলুন">
            <i class="fa-solid fa-trash-can"></i> <span>মুছুন</span>
          </button>
        </div>
      `;

      // Price edit actions
      const editBtn = card.querySelector(".edit-btn");
      const priceInput = card.querySelector(".price-input");
      const setPriceBtn = card.querySelector(".set-price-btn");
      const priceField = card.querySelector(".price-field");
      const priceDisplay = card.querySelector(".current-price-val");
      const deleteBtn = card.querySelector(".delete-prod-btn");

      editBtn.addEventListener("click", () => {
        priceInput.classList.toggle("hidden");
        priceField.focus();
      });

      setPriceBtn.addEventListener("click", async () => {
        const newPrice = parseFloat(priceField.value);
        if (!isNaN(newPrice) && newPrice > 0) {
          await updateDoc(doc(db, "products", id), { price: newPrice });
          priceDisplay.textContent = newPrice;
          priceInput.classList.add("hidden");
          alert(`✅ '${product.name}' এর মূল্য ৳${newPrice} আপডেট করা হয়েছে!`);
        }
      });

      deleteBtn.addEventListener("click", async () => {
        if (confirm(`আপনি কি নিশ্চিত যে '${product.name}' পণ্যটি তালিকা থেকে মুছে ফেলতে চান?`)) {
          await deleteDoc(doc(db, "products", id));
          loadShopSpecificProducts(shopEmail);
        }
      });

      productListEl.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Load Shop-Specific Orders
async function loadShopSpecificOrders(shopName, shopEmail) {
  const orderTableBody = document.getElementById("ordersTableBody");
  if (!orderTableBody) return;
  orderTableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-sand-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>অর্ডার লোড হচ্ছে...</td></tr>`;

  const summaryTotalOrders = document.getElementById("totalOrders");
  const summaryTotalIncome = document.getElementById("totalIncome");
  const pendingCountEl = document.getElementById("pendingCount");
  const completedCountEl = document.getElementById("completedCount");

  let totalOrders = 0;
  let totalIncome = 0;
  let pendingCount = 0;
  let completedCount = 0;

  try {
    // Query orders for this shopkeeper's store
    const q = query(collection(db, "orders"), where("shop", "==", shopName));
    let querySnapshot = await getDocs(q);

    // If query by shop name has no results, also check by shopEmail
    if (querySnapshot.empty && shopEmail) {
      const qAlt = query(collection(db, "orders"), where("shopEmail", "==", shopEmail));
      querySnapshot = await getDocs(qAlt);
    }

    // Fallback: If still empty, check all orders if shopkeeper is default
    if (querySnapshot.empty) {
      const allOrders = await getDocs(collection(db, "orders"));
      if (!allOrders.empty) {
        querySnapshot = allOrders;
      }
    }

    orderTableBody.innerHTML = "";

    if (querySnapshot.empty) {
      orderTableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-sand-500">আপনার দোকানে এখনও কোনো অর্ডার আসেনি।</td></tr>`;
      if (summaryTotalOrders) summaryTotalOrders.textContent = "0";
      if (summaryTotalIncome) summaryTotalIncome.textContent = "৳ 0";
      if (pendingCountEl) pendingCountEl.textContent = "0";
      if (completedCountEl) completedCountEl.textContent = "0";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const id = docSnap.id;

      totalOrders++;
      totalIncome += order.grandTotal || 0;

      if (order.status === "Pending") pendingCount++;
      else if (order.status === "Completed") completedCount++;

      const itemList = (order.items || [])
        .map((item) => `${item.qty} × ${item.name} (৳${item.subtotal})`)
        .join("<br>");

      let orderDate = "N/A";
      let orderTime = "N/A";
      if (order.timestamp) {
        const dateObj = order.timestamp.seconds
          ? new Date(order.timestamp.seconds * 1000)
          : new Date(order.timestamp);
        orderDate = dateObj.toLocaleDateString();
        orderTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const isCompleted = order.status === "Completed";

      const row = document.createElement("tr");
      row.className = "hover:bg-sand-50 transition-colors";
      row.innerHTML = `
        <td class="py-3 px-4 font-semibold text-sand-900">${order.name}</td>
        <td class="py-3 px-4 text-sand-600 font-mono text-xs">${order.phone}</td>
        <td class="py-3 px-4 text-sand-600 text-xs">${orderDate}<br><span class="text-sand-400">${orderTime}</span></td>
        <td class="py-3 px-4 text-sand-600 text-xs max-w-xs truncate" title="${order.address}">${order.address}</td>
        <td class="py-3 px-4 text-xs font-medium text-sand-700">
          ${itemList}
          <div class="mt-1 font-bold text-sage-700 text-sm">মোট: ৳${order.grandTotal}</div>
        </td>
        <td class="py-3 px-4">
          <select class="status-dropdown text-xs font-bold border rounded-lg p-1.5 focus:outline-none ${isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}">
            <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>⏳ Pending</option>
            <option value="Completed" ${order.status === "Completed" ? "selected" : ""}>✅ Completed</option>
          </select>
        </td>
        <td class="py-3 px-4 text-center">
          <button class="delete-btn p-1.5 text-sand-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="মুছে ফেলুন">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;

      // Delete Handler
      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`আপনি কি এই অর্ডারটি (${order.name}) নিশ্চিত মুছে ফেলতে চান?`)) {
          await deleteDoc(doc(db, "orders", id));
          loadShopSpecificOrders(shopName, shopEmail);
        }
      });

      // Status Change Handler
      row.querySelector(".status-dropdown").addEventListener("change", async (e) => {
        const newStatus = e.target.value;
        await updateDoc(doc(db, "orders", id), { status: newStatus });
        loadShopSpecificOrders(shopName, shopEmail);
      });

      orderTableBody.appendChild(row);
    });

    if (summaryTotalOrders) summaryTotalOrders.textContent = totalOrders;
    if (summaryTotalIncome) summaryTotalIncome.textContent = `৳ ${totalIncome.toLocaleString()}`;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;

  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// Search Filter
document.getElementById("searchBox")?.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  document.querySelectorAll("#ordersTableBody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? "" : "none";
  });
});
