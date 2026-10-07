import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function initializeCustomerHistory(db, auth) {
  // User Avatar / Email Toggle (Gentle Sage Green - Zero Blue)
  function displayEmailToggle(email) {
    const emailContainer = document.getElementById('userEmailDisplay');
    if (!emailContainer || !email) return;
    const initial = email.charAt(0).toUpperCase();
    emailContainer.textContent = initial;
    emailContainer.style.background = "linear-gradient(135deg, #5d8760, #486b4b)";
    emailContainer.title = `Logged in as: ${email} (Click to toggle)`;

    emailContainer.onclick = () => {
      if (emailContainer.textContent === initial) {
        emailContainer.textContent = email;
        emailContainer.style.width = "auto";
        emailContainer.style.padding = "0 14px";
        emailContainer.style.borderRadius = "9999px";
      } else {
        emailContainer.textContent = initial;
        emailContainer.style.width = "36px";
        emailContainer.style.padding = "0";
      }
    };
  }

  // Load User Orders with Live Status Tracker
  async function loadUserOrders(email) {
    if (!email) return;

    const orderListDiv = document.getElementById("userOrders");
    if (!orderListDiv) return;
    orderListDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--sand-500);"><i class="fa-solid fa-spinner fa-spin"></i> অর্ডার লোড হচ্ছে...</div>`;

    try {
      const q = query(collection(db, "orders"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        orderListDiv.innerHTML = `
          <div style="text-align: center; padding: 30px; color: var(--sand-500);">
            <i class="fa-solid fa-receipt" style="font-size: 2rem; color: #d6dcd4; margin-bottom: 8px;"></i>
            <p>আপনার এখনও কোনো অর্ডার নেই। উপরের সার্ভিস থেকে আপনার প্রথম অর্ডারটি করুন!</p>
          </div>
        `;
        return;
      }

      let html = "";
      snapshot.forEach((doc) => {
        const order = doc.data();
        let readableDate = "N/A";
        if (order.timestamp) {
          const dateObj = order.timestamp.toDate ? order.timestamp.toDate() : new Date(order.timestamp);
          readableDate = dateObj.toLocaleString("bn-BD", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
        }

        const isCompleted = order.status === "Completed";
        const statusBadge = isCompleted 
          ? `<span style="padding: 4px 10px; background: #edf7ee; color: #2b572e; border: 1px solid #c9dec9; border-radius: 9999px; font-size: 0.8rem; font-weight: 700;">✅ সম্পন্ন (Completed)</span>`
          : `<span style="padding: 4px 10px; background: #fdf6ed; color: #874b1e; border: 1px solid #f4dec7; border-radius: 9999px; font-size: 0.8rem; font-weight: 700;">⏳ অপেক্ষমাণ (Processing)</span>`;

        const itemListHTML = (order.items || [])
          .map(item => `<li>${item.qty} × ${item.name} (৳${item.subtotal})</li>`)
          .join('');

        // Progress tracker line
        const step1 = `<span class="completed-step">① অর্ডার গৃহীত</span>`;
        const step2 = isCompleted ? `<span class="completed-step">② ওয়াশ ও প্রেসিং</span>` : `<span>② প্রসেসিং হচ্ছে</span>`;
        const step3 = isCompleted ? `<span class="completed-step">③ ডেলিভারি সম্পন্ন</span>` : `<span>③ ডেলিভারি অপেক্ষা</span>`;

        html += `
          <div class="history-item">
            <div class="order-header">
              <div>
                <span class="order-date"><i class="fa-regular fa-calendar" style="margin-right: 5px;"></i>${readableDate}</span>
                <span style="margin-left: 10px; font-size: 0.85rem; color: #486b4b; font-weight: 700;">🏪 ${order.shop || "FreshFold"}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                ${statusBadge}
                <span class="order-total">৳${order.grandTotal}</span>
              </div>
            </div>

            <!-- Live Status Step Tracker -->
            <div class="order-tracker-steps">
              ${step1}
              <i class="fa-solid fa-arrow-right" style="color: #cbd5cb; font-size: 0.75rem; align-self: center;"></i>
              ${step2}
              <i class="fa-solid fa-arrow-right" style="color: #cbd5cb; font-size: 0.75rem; align-self: center;"></i>
              ${step3}
            </div>

            <div class="order-info" style="margin-top: 12px;">
              <p><strong>👤 প্রাপক:</strong> ${order.name}</p>
              <p><strong>📞 মোবাইল:</strong> ${order.phone || 'N/A'}</p>
              <p style="grid-column: 1 / -1;"><strong>🏠 ঠিকানা:</strong> ${order.address || 'N/A'}</p>
            </div>

            <div class="order-items">
              <strong>📦 পোশাক ও লন্ড্রি আইটেম:</strong>
              <ul class="item-list">${itemListHTML}</ul>
            </div>
          </div>
        `;
      });

      orderListDiv.innerHTML = html;
    } catch (err) {
      orderListDiv.innerHTML = `<p style="color: #a83232; text-align: center;">অর্ডার হিস্ট্রি লোড করতে সমস্যা হয়েছে।</p>`;
      console.error("loadUserOrders error:", err);
    }
  }

  // Comments / Feedback Drawer
  const toggleCommentBtn = document.getElementById('toggleCommentBtn');
  const commentSection = document.getElementById('commentSection');
  const commentForm = document.getElementById('commentForm');

  if (toggleCommentBtn && commentSection) {
    toggleCommentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      commentSection.classList.toggle('show');
    });
  }

  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('userName').value.trim();
      const location = document.getElementById('userLocation').value.trim();
      const comment = document.getElementById('userComment').value.trim();
      const user = auth.currentUser;
      const email = user?.email || "Anonymous";

      if (!name || !location || !comment) return;

      try {
        await addDoc(collection(db, "userComments"), {
          email,
          name,
          location,
          comment,
          timestamp: new Date()
        });

        commentForm.reset();
        commentSection?.classList.remove('show');
        alert("✅ আপনার মূল্যবান মতামতের জন্য ধন্যবাদ! এটি আমাদের হোমপেজে প্রদর্শিত হবে।");
      } catch (err) {
        console.error("Error submitting comment:", err);
      }
    });
  }

  return { displayEmailToggle, loadUserOrders };
}
