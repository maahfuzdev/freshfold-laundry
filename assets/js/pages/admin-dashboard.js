import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
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
const template = document.getElementById("productTemplate")?.content;
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
  if (shopNameEl) shopNameEl.textContent = shopData.shopName;
  if (shopEmailEl) shopEmailEl.textContent = user.email;

  loadProducts();
  loadOrders();
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

  const inactiveClass = "nav-tab w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all text-slate-400 hover:text-white hover:bg-slate-800";
  const activeClass = "nav-tab w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-brand-700 text-white shadow-md shadow-brand-700/20";

  btnSummary.className = inactiveClass;
  btnOrders.className = inactiveClass;
  btnPrices.className = inactiveClass;

  if (tabId === "summaryTab") {
    summarySec.style.display = "grid";
    orderSec.style.display = "block";
    priceSec.style.display = "block";
    btnSummary.className = activeClass;
  } else if (tabId === "ordersTab") {
    summarySec.style.display = "none";
    orderSec.style.display = "block";
    priceSec.style.display = "none";
    btnOrders.className = activeClass;
  } else if (tabId === "priceTab") {
    summarySec.style.display = "none";
    orderSec.style.display = "none";
    priceSec.style.display = "block";
    btnPrices.className = activeClass;
  }

  // Close mobile sidebar if open
  if (window.innerWidth < 768 && adminSidebar) {
    adminSidebar.classList.add("hidden");
  }
};

// Load Orders
async function loadOrders() {
  const orderTableBody = document.getElementById("ordersTableBody");
  if (!orderTableBody) return;
  orderTableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>অর্ডার লোড হচ্ছে...</td></tr>`;

  const summaryTotalOrders = document.getElementById("totalOrders");
  const summaryTotalIncome = document.getElementById("totalIncome");
  const pendingCountEl = document.getElementById("pendingCount");
  const completedCountEl = document.getElementById("completedCount");

  let totalOrders = 0;
  let totalIncome = 0;
  let pendingCount = 0;
  let completedCount = 0;

  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    orderTableBody.innerHTML = "";

    if (querySnapshot.empty) {
      orderTableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">কোনো অর্ডার পাওয়া যায়নি।</td></tr>`;
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
      row.className = "hover:bg-slate-50 transition-colors";
      row.innerHTML = `
        <td class="py-3 px-4 font-semibold text-slate-900">${order.name}</td>
        <td class="py-3 px-4 text-slate-600 font-mono text-xs">${order.phone}</td>
        <td class="py-3 px-4 text-slate-600 text-xs">${orderDate}<br><span class="text-slate-400">${orderTime}</span></td>
        <td class="py-3 px-4 text-slate-600 text-xs max-w-xs truncate" title="${order.address}">${order.address}</td>
        <td class="py-3 px-4 text-xs font-medium text-slate-700">
          ${itemList}
          <div class="mt-1 font-bold text-brand-700 text-sm">মোট: ৳${order.grandTotal}</div>
        </td>
        <td class="py-3 px-4">
          <select class="status-dropdown text-xs font-bold border rounded-lg p-1.5 focus:outline-none ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}">
            <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>⏳ Pending</option>
            <option value="Completed" ${order.status === "Completed" ? "selected" : ""}>✅ Completed</option>
          </select>
        </td>
        <td class="py-3 px-4 text-center">
          <button class="delete-btn p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="মুছে ফেলুন">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;

      // Delete Handler
      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`আপনি কি এই অর্ডারটি (${order.name}) নিশ্চিত মুছে ফেলতে চান?`)) {
          await deleteDoc(doc(db, "orders", id));
          loadOrders();
        }
      });

      // Status Change Handler
      row.querySelector(".status-dropdown").addEventListener("change", async (e) => {
        const newStatus = e.target.value;
        await updateDoc(doc(db, "orders", id), { status: newStatus });
        loadOrders();
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

// Load Products
async function loadProducts() {
  if (!productListEl || !template) return;
  const querySnapshot = await getDocs(collection(db, "products"));
  productListEl.innerHTML = '';

  if (querySnapshot.empty) {
    productListEl.innerHTML = `<p class="col-span-full text-center text-slate-400 py-6">কোনো পণ্য তালিকাভুক্ত নেই।</p>`;
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const product = docSnap.data();
    const id = docSnap.id;

    const clone = document.importNode(template, true);
    const imgEl = clone.querySelector(".product-img");
    imgEl.src = product.img || "https://via.placeholder.com/80?text=Item";
    imgEl.alt = product.name;
    clone.querySelector(".product-name").textContent = product.name;
    clone.querySelector(".current-price span").textContent = product.price;

    const priceInput = clone.querySelector(".price-input");
    const setPriceBtn = clone.querySelector(".set-price-btn");
    const editBtn = clone.querySelector(".edit-btn");
    const priceField = clone.querySelector(".price-field");
    const priceDisplay = clone.querySelector(".current-price span");

    editBtn.addEventListener("click", () => {
      priceInput.classList.toggle("hidden");
      priceField.value = product.price;
      priceField.focus();
    });

    setPriceBtn.addEventListener("click", async () => {
      const newPrice = parseFloat(priceField.value);
      if (!isNaN(newPrice) && newPrice > 0) {
        await updateDoc(doc(db, "products", id), { price: newPrice });
        priceDisplay.textContent = newPrice;
        priceInput.classList.add("hidden");
        alert(`✅ ${product.name} এর নতুন মূল্য ৳${newPrice} নির্ধারিত হয়েছে!`);
      }
    });

    productListEl.appendChild(clone);
  });
}

// Search Filter
document.getElementById("searchBox")?.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  document.querySelectorAll("#ordersTableBody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? "" : "none";
  });
});
