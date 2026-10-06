import { initializeCustomerHistory } from "../features/customer-history.js";
// Firebase Imports
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, increment, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

    // Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyCrPUFMdKuxMDV16RIu833yvzw-a8WxCSg",
      authDomain: "smart-laundry-2d523.firebaseapp.com",
      projectId: "smart-laundry-2d523",
      storageBucket: "smart-laundry-2d523.appspot.com",
      messagingSenderId: "7431686498",
      appId: "1:7431686498:web:d4d1a4377327c7eafac43b",
      measurementId: "G-K6W312NY4M"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // State
    let selectedShop = null;
    let productsList = [];
    let shopList = [];
    let currentUser = null;

    // Shop select
    window.selectShop = function (shop) {
      selectedShop = shop;
      document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
      Array.from(document.querySelectorAll('.sidebar button')).find(btn => btn.textContent === shop)?.classList.add('active');
    };

    // Get wallet doc
    async function getWalletDocByEmail(email) {
      const docRef = doc(db, "wallets", email);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, data: () => snapshot.data() } : null;
    }

    // Load products



    async function loadProducts() {
      const productsCol = collection(db, "products");
      const productSnapshot = await getDocs(productsCol);
      const container = document.querySelector(".main");
      container.innerHTML = "";
      productsList = [];

      productSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const safeImg = data.img ? data.img.trim() : 'https://via.placeholder.com/200x150?text=No+Image';

        console.log("Loaded Product:", data.name, "| Image URL:", safeImg);

        productsList.push({ ...data, id: docSnap.id });

        const item = document.createElement("div");
        item.className = "item-card";
        item.setAttribute("data-product-id", docSnap.id); // ✅ Add this line

        item.innerHTML = `
      <img src="${safeImg}" alt="${data.name}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/200x150?text=No+Image'">
      <p><strong>${data.name}</strong></p>
      <p class="product-price">Price: ${data.price}৳</p>
      <input type="number" placeholder="quantity :" min="0" 
             data-name="${data.name}" data-price="${data.price}" style="margin-bottom:5px;">
    `;

        container.appendChild(item);
      });
    }

    async function loadShops() {
      const shopSnapshot = await getDocs(collection(db, "shopowners"));
      const container = document.querySelector(".shopListContainer");
      container.innerHTML = "<h3>Active Shops</h3>";

      shopSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const shopName = data.shopName;
        const email = data.email;

        const button = document.createElement("button");
        button.textContent = shopName + " (" + data.shopPlace + ")";
        button.onclick = () => showProducts(email, shopName);

        container.appendChild(button);
      });
    }

    async function showProducts(ownerEmail, shopName) {
      selectedShop = shopName;
      const productQuery = query(collection(db, "products"), where("email", "==", ownerEmail));
      const querySnapshot = await getDocs(productQuery);

      querySnapshot.forEach((docSnap) => {
        const productData = docSnap.data();
        const productId = docSnap.id;

        const itemCard = document.querySelector(`.item-card[data-product-id="${productId}"]`);
        if (itemCard) {
          const priceTag = itemCard.querySelector(".product-price");
          const input = itemCard.querySelector("input");

          if (priceTag) priceTag.textContent = `Price: ${productData.price}৳`;
          if (input) input.dataset.price = productData.price;
        }
      });
    }


    // Load user balance
    async function loadUserBalance(email) {
      const walletDoc = await getWalletDocByEmail(email);
      const balance = walletDoc?.data().balance || 0;
      document.getElementById("userBalance").innerText = `${balance} ৳`;
    }


    // Generate bill
    window.generateBill = async function () {
      const user = auth.currentUser;
      if (!user) { alert("❌ ইউজার লগইন নেই।"); return; }
      if (!selectedShop) { alert("⚠️ দয়া করে একটি Shop সিলেক্ট করুন."); return; }
      const email = user.email;
      const inputs = document.querySelectorAll('.item-card input');
      let billHTML = "<table style='width:100%; margin-top:10px; border-collapse: collapse;'><tr><th style='text-align:left;'>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>";
      let total = 0;
      inputs.forEach(input => {
        const qty = parseInt(input.value);
        const name = input.dataset.name;
        const price = parseInt(input.dataset.price);
        if (!isNaN(qty) && qty > 0) {
          const subtotal = qty * price;
          total += subtotal;
          billHTML += `<tr><td>${name}</td><td>${qty}</td><td>${price}৳</td><td>${subtotal}৳</td></tr>`;
        }
      });
      if (total === 0) { alert("⚠️ অন্তত ১টি প্রোডাক্ট quantity দিন।"); return; }
      const walletDoc = await getWalletDocByEmail(email);
      if (!walletDoc) { alert("❌ ইউজারের ওয়ালেট ডেটা পাওয়া যায়নি।"); return; }
      const currentBalance = walletDoc.data().balance || 0;
      if (currentBalance < total) { alert("❌ পর্যাপ্ত ব্যালেন্স নেই। রিচার্জ করুন।"); return; }
      billHTML += `<tr><td colspan="3" style="text-align:right;"><strong>Grand Total:</strong></td><td><strong>${total}৳</strong></td></tr></table>`;
      document.getElementById('billDetails').innerHTML = billHTML;
      document.getElementById('billModal').style.display = 'block';
      window.lastOrderTotal = total;
    };

    // Submit order
    window.submitOrder = async function () {
      const user = auth.currentUser;
      if (!user) { alert("❌ ইউজার লগইন নেই।"); return; }
      const email = user.email;
      const name = document.getElementById('customerName').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();
      const address = document.getElementById('customerAddress').value.trim();
      const inputs = document.querySelectorAll('.item-card input');
      const items = [];
      let grandTotal = 0;
      inputs.forEach(input => {
        const qty = parseInt(input.value);
        const itemName = input.dataset.name;
        const price = parseInt(input.dataset.price);
        if (!isNaN(qty) && qty > 0) {
          const subtotal = qty * price;
          grandTotal += subtotal;
          items.push({ name: itemName, qty, price, subtotal });
        }
      });
      if (!name || !phone || !address || items.length === 0) {
        alert("⚠️ দয়া করে সব ইনপুট পূরণ করুন এবং অন্তত ১টি প্রোডাক্ট quantity দিন।");
        return;
      }
      if (!selectedShop) {
        alert("⚠️ দয়া করে একটি Shop সিলেক্ট করুন.");
        return;
      }
      try {
        await addDoc(collection(db, "orders"), {
          name, phone, address, email, shop: selectedShop, items, grandTotal, timestamp: new Date()
        });
        // Wallet update
        const walletRef = doc(db, "wallets", email);
        const walletSnap = await getDoc(walletRef);
        const oldData = walletSnap.exists() ? walletSnap.data() : { balance: 0, transactions: [] };
        await updateDoc(walletRef, {
          balance: increment(-grandTotal),
          transactions: [...(oldData.transactions || []), `Order placed ৳${grandTotal}`]
        });
        alert("✅ অর্ডার সফলভাবে জমা হয়েছে!");
        document.getElementById('billModal').style.display = 'none';
        // Clear Fields
        document.getElementById('customerName').value = "";
        document.getElementById('customerPhone').value = "";
        document.getElementById('customerAddress').value = "";
        inputs.forEach(input => input.value = "");
        await loadUserBalance(email);
        await loadOrderHistory(email);
      } catch (error) {
        console.error("❌ অর্ডার সমস্যা:", error);

      }
    };

    // Recharge Page Redirect
    window.goToRechargePage = function () {
      window.location.href = "wallet.html";
    };

    // Close Modal on Click Outside
    window.onclick = function (event) {
      const modal = document.getElementById('billModal');
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    // Email Toggle
    const { displayEmailToggle, loadUserOrders } = initializeCustomerHistory(db, auth);

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "customer-login.html";
        return;
      }

      currentUser = user; // এখানে অ্যাসাইন করো

      const email = user.email;
      console.log("Logged in as:", email);

      loadUserBalance(email);
      loadUserOrders(email);
      loadProducts().then(() => { });
      loadShops();

      showProducts();
      displayEmailToggle(email);

    });
