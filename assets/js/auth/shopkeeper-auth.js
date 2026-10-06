import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    // Tab Switch
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', function () {
        const target = this.getAttribute('data-tab');
        document.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelector('.tab-link[data-tab="' + target + '"]').classList.add('active');
        document.getElementById(target).classList.add('active');
      });
    });

    // Helper: Email to Firestore-safe doc id (remove . and @)
    function emailToDocId(email) {
      return email.replace(/\./g, "_").replace(/@/g, "_at_");
    }

    // Register Handler
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      document.getElementById('registerError').textContent = '';
      document.getElementById('registerSuccess').textContent = '';

      const shopName = document.getElementById('shopName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const shopPlace = document.getElementById('shopPlace').value.trim();

      if (shopName.length < 3) {
        document.getElementById('registerError').textContent = "Shop name must be at least 3 characters.";
        return;
      }
      if (shopPlace.length < 3) {
        document.getElementById('registerError').textContent = "Shop location must be at least 3 characters.";
        return;
      }
      if (password.length < 6) {
        document.getElementById('registerError').textContent = "Password must be at least 6 characters.";
        return;
      }

      const userQuery = query(collection(db, "users"), where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        alert("এই ইমেইলটি আগে থেকেই একটি সাধারণ ইউজার হিসেবে নিবন্ধিত। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন।");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Use email as doc id (safe)
        const docId = emailToDocId(email);
        await setDoc(doc(db, "shopowners", docId), {
          shopName,
          email,
          shopPlace,
          createdAt: new Date()
        });
        document.getElementById('registerSuccess').textContent = "✅ Registration successful! Please login.";
        document.getElementById('registerForm').reset();
      } catch (error) {
        document.getElementById('registerError').textContent = "❌ " + error.message;
      }
    });

    // Login Handler
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      document.getElementById('loginError').textContent = '';

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        // Step 1: Shopowner হিসেবে email আছে কি না তা চেক করো
        const shopRef = collection(db, "shopowners");
        const q = query(shopRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // যদি shopowners এ email না থাকে
          document.getElementById('loginError').textContent = "❌ You are not a registered shop owner.";
          return;
        }

        // Step 2: যদি থাকেই, তাহলে Firebase Auth দিয়ে সাইন ইন করো
        await signInWithEmailAndPassword(auth, email, password);

        document.getElementById('loginError').textContent = "";
        alert("✅ Login successful!");
        window.location.href = "admin-dashboard.html"; // redirect after login

      } catch (error) {
        document.getElementById('loginError').textContent = "❌ " + error.message;
      }
    });
