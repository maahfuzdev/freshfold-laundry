import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

    import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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
        this.classList.add('active');
        document.getElementById(target).classList.add('active');
      });
    });

    document.getElementById('registerForm').addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const phone = document.getElementById('regPhone').value.trim();

      const phoneRegex = /^01[0-9]{9}$/;
      if (!phoneRegex.test(phone)) {
        alert("❌ সঠিক ১১ ডিজিটের বাংলাদেশি ফোন নম্বর দিন (০১XXXXXXXXX)");
        return;
      }

      async function handleSignup() {
        // your code here
        if (password.length < 6) {
          alert("❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
          return;
        }

        const shopOwnerQuery = query(collection(db, "shopowners"), where("email", "==", email));
        const shopOwnerSnapshot = await getDocs(shopOwnerQuery);

        if (!shopOwnerSnapshot.empty) {
          alert("এই ইমেইলটি একটি দোকানদার হিসেবে নিবন্ধিত। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন।");
          return;
        }

        createUserWithEmailAndPassword(auth, email, password);
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          try {
            await setDoc(doc(db, "users", user.uid), {
              name,
              email,
              phone,
              createdAt: new Date()
            });
            alert("✅ রেজিস্ট্রেশন সফল হয়েছে! এখন লগইন করুন।");
            document.querySelector('[data-tab="login"]').click();
          } catch (error) {
            alert("❌ ইউজার তথ্য সংরক্ষণে সমস্যা: " + error.message);
          }
        })
        .catch(error => {
          alert("❌ রেজিস্ট্রেশন ব্যর্থ: " + error.message);
        });


    });



    // Login Handler



    document.getElementById('loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      document.getElementById('loginError').textContent = '';

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        // Step 1: user হিসেবে email আছে কি না তা চেক করো
        const userRef = collection(db, "users");
        // Query to check if email exists in users collection
        const q = query(userRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // যদি users এ email না থাকে
          document.getElementById('loginError').textContent = "❌ You are not a registered user .";
          return;
        }

        // Step 2: যদি থাকেই, তাহলে Firebase Auth দিয়ে সাইন ইন করো
        await signInWithEmailAndPassword(auth, email, password);

        document.getElementById('loginError').textContent = "";
        alert("✅ Login successful!");
        window.location.href = "customer-dashboard.html"; // redirect after login

      } catch (error) {
        document.getElementById('loginError').textContent = "❌ " + error.message;
      }
    });
