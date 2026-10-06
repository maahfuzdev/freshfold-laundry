import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initializeCustomerHistory(db, auth) {
    function displayEmailToggle(email) {
      const emailContainer = document.getElementById('userEmailDisplay');
      if (!emailContainer) return;
      emailContainer.textContent = email.charAt(0).toUpperCase();
      emailContainer.title = "Click to show email";
      emailContainer.onclick = () => {
        if (emailContainer.textContent.length === 1) {
          emailContainer.textContent = email;
          emailContainer.title = "Click to hide email";
        } else {
          emailContainer.textContent = email.charAt(0).toUpperCase();
          emailContainer.title = "Click to show email";
        }
      };
    }

    // Load user orders

    async function loadUserOrders(email) {
      if (!email) {
        console.error("❌ Email is undefined!");
        return;
      }

      console.log("Inside loadUserOrders, email:", email); //
      const orderListDiv = document.getElementById("userOrders");
      orderListDiv.innerHTML = "Loading...";

      try {
        console.log("Loading orders for email:", email);
        const q = query(collection(db, "orders"), where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          orderListDiv.innerHTML = `<p style="color: red;">আপনার কোনো অর্ডার নেই।</p>`;
          return;
        }

        let html = "";
        snapshot.forEach((doc) => {
          const order = doc.data();
          const readableDate = order.timestamp?.toDate().toLocaleString("bn-BD", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });


          const itemListHTML = (order.items || [])
            .map(item => `<li>${item.qty} × ${item.name} — ৳${item.subtotal}</li>`)
            .join('');

          html += `
  <div class="history-item">
    <div class="order-header">
      <span class="order-date">${readableDate}</span>
      <span class="order-total">৳${order.grandTotal}</span>
    </div>

    <div class="order-info">
      <p><strong>👤 Name:</strong> ${order.name}</p>
      <p><strong>📞 Phone:</strong> ${order.phone || 'N/A'}</p>
      <p><strong>🏠 Address:</strong> ${order.address || 'N/A'}</p>
    </div>

    <div class="order-items">
      <strong>📦 Items:</strong>
      <ul class="item-list">${itemListHTML}</ul>
    </div>
  </div>
`;
        });

        orderListDiv.innerHTML = html;
      } catch (err) {
        orderListDiv.innerHTML = `<p style="color: red;">অর্ডার লোড করতে সমস্যা হয়েছে!</p>`;
        console.error("loadUserOrders error:", err);
      }
    }



    // History টগল করার জন্য
    const historySection = document.getElementById("history");
    const historyLink = document.querySelector('a[href="#history"]');

    historyLink.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent jump
      if (historySection.style.display === "none" || !historySection.style.display) {
        historySection.style.display = "block";
        historySection.scrollIntoView({ behavior: "smooth" });
      } else {
        historySection.style.display = "none";
      }
    });

    // Default এ লুকানো রাখো
    document.addEventListener("DOMContentLoaded", () => {
      historySection.style.display = "none";
    });

    //comment section

    const toggleCommentBtn = document.getElementById('toggleCommentBtn');
    const commentSection = document.getElementById('commentSection');
    const commentForm = document.getElementById('commentForm');

    toggleCommentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      commentSection.classList.toggle('show');
    });

    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('userName').value.trim();
      const location = document.getElementById('userLocation').value.trim();
      const comment = document.getElementById('userComment').value.trim();
      const user = auth.currentUser;
      const email = user?.email || "Anonymous";

      if (!name || !location || !comment) return;

      await addDoc(collection(db, "userComments"), {
        email,
        name,
        location,
        comment,
        timestamp: new Date()
      });

      commentForm.reset();
      commentSection.classList.remove('show');
      alert("Thank you for your comment!");
    });









    // ইউজার লগইন থাকলে সেট করো

      return { displayEmailToggle, loadUserOrders };
}
