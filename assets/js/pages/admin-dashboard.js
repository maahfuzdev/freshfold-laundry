// তোমার Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyCrPUFMdKuxMDV16RIu833yvzw-a8WxCSg",
      authDomain: "smart-laundry-2d523.firebaseapp.com",
      projectId: "smart-laundry-2d523",
      storageBucket: "smart-laundry-2d523.appspot.com",
      messagingSenderId: "7431686498",
      appId: "1:7431686498:web:d4d1a4377327c7eafac43b",
      measurementId: "G-K6W312NY4M",
    };

    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import {
      getFirestore,
      collection,
      getDocs,
      updateDoc,
      deleteDoc,
      doc,

    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const productListEl = document.getElementById("productList");
    const template = document.getElementById("productTemplate").content;




    async function loadOrders() {
      const orderTableBody = document.querySelector("#orderSection tbody");
      orderTableBody.innerHTML = ""; // Clear old data

      const summaryTotalOrders = document.getElementById("totalOrders");
      const summaryTotalIncome = document.getElementById("totalIncome");

      let totalOrders = 0;
      let totalIncome = 0;
      let pendingCount = 0,
        completedCount = 0;

      const querySnapshot = await getDocs(collection(db, "orders"));
      querySnapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const id = docSnap.id;

        totalOrders++;
        totalIncome += order.grandTotal || 0;

        if (order.status === "Pending") pendingCount++;
        else if (order.status === "Completed") completedCount++;

        const itemList = order.items
          .map((item) => {
            return `${item.qty} × ${item.name} (৳${item.subtotal})`;
          })
          .join("<br>");

        const timestamp = order.timestamp?.seconds
          ? new Date(order.timestamp.seconds * 1000)
          : null;
        const orderDate = timestamp ? timestamp.toLocaleDateString() : "N/A";
        const orderTime = timestamp ? timestamp.toLocaleTimeString() : "N/A";

        const row = document.createElement("tr");
        row.className = "border-t";
        row.innerHTML = `
          <td class="py-3 px-4">${order.name}</td>
          <td class="py-3 px-4">${order.phone}</td>
          <td class="py-3 px-4">${orderDate}</td>
          <td class="py-3 px-4">${orderTime}</td>
          <td class="py-3 px-4">${order.address}</td>
          <td class="py-3 px-4 text-sm">${itemList}<br><strong>Total: ৳${order.grandTotal}</strong></td>
          <td class="py-3 px-4">
            <select class="status-dropdown border p-1 rounded">
              <option value="Pending" ${order.status === "Pending" ? "selected" : ""
          }>Pending</option>
              <option value="Completed" ${order.status === "Completed" ? "selected" : ""
          }>Completed</option>
            </select>
          </td>
          <td class="py-3 px-4">
            <button class="delete-btn text-red-500 hover:underline">🗑</button>
          </td>
        `;

        // Delete handler
        row.querySelector(".delete-btn").addEventListener("click", async () => {
          if (confirm("Are you sure to delete this order?")) {
            await deleteDoc(doc(db, "orders", id));
            loadOrders(); // Refresh
          }
        });

        // Status change handler
        row
          .querySelector(".status-dropdown")
          .addEventListener("change", async (e) => {
            const newStatus = e.target.value;
            await updateDoc(doc(db, "orders", id), { status: newStatus });
            loadOrders(); // Refresh to update counts and summary
          });

        orderTableBody.appendChild(row);
      });

      summaryTotalOrders.textContent = totalOrders;
      summaryTotalIncome.textContent = `৳${totalIncome}`;
      document.getElementById("pendingCount").textContent = pendingCount;
      document.getElementById("completedCount").textContent = completedCount;
    }

    async function loadProducts() {
      const querySnapshot = await getDocs(collection(db, "products"));
      productListEl.innerHTML = ''; // Clear before loading

      querySnapshot.forEach((docSnap) => {
        const product = docSnap.data();
        const id = docSnap.id;

        const clone = document.importNode(template, true);
        clone.querySelector(".product-img").src = product.img;
        clone.querySelector(".product-img").alt = product.name;
        clone.querySelector(".product-name").textContent = product.name;
        clone.querySelector(".current-price span").textContent = product.price;

        const priceInput = clone.querySelector(".price-input");
        const setPriceBtn = clone.querySelector(".set-price-btn");
        const editBtn = clone.querySelector(".edit-btn");
        const priceField = clone.querySelector(".price-field");
        const priceDisplay = clone.querySelector(".current-price span");

        editBtn.addEventListener("click", () => {
          priceInput.classList.remove("hidden");
          priceField.value = product.price;
        });

        setPriceBtn.addEventListener("click", async () => {
          const newPrice = parseFloat(priceField.value);
          if (!isNaN(newPrice) && newPrice > 0) {
            await updateDoc(doc(db, "products", id), { price: newPrice });
            priceDisplay.textContent = newPrice;
            priceInput.classList.add("hidden");
          }
        });

        productListEl.appendChild(clone);
      });
    }

    // সার্চ বক্স ইভেন্ট একবার বসানো হলো, লুপের বাইরে
    document.getElementById("searchBox").addEventListener("input", function () {
      const keyword = this.value.toLowerCase();
      document.querySelectorAll("#orderSection tbody tr").forEach((row) => {
        row.style.display = row.innerText.toLowerCase().includes(keyword) ? "" : "none";
      });
    });

    loadProducts();
    loadOrders();

    window.toggleSection = function (sectionId) {
      const section = document.getElementById(sectionId);
      section.style.display = section.style.display === "none" ? "block" : "none";
    };
