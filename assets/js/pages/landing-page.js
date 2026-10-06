import { getSmartResponse } from "../features/laundry-faq.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import {
      getFirestore,
      collection,
      getDocs,
      onSnapshot
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

    const reviewList = document.getElementById("reviewList");

    // Firestore থেকে রিয়েলটাইম ডাটা ফেচ
    onSnapshot(collection(db, "userComments"), (snapshot) => {
      reviewList.innerHTML = ""; // পুরানো মুছে ফেলুন
      snapshot.forEach((doc) => {
        const data = doc.data();
        const commentEl = document.createElement("blockquote");
        commentEl.innerHTML = `
      “${data.comment}”<br />
      <cite>— ${data.name}, ${data.location}</cite>
    `;
        reviewList.appendChild(commentEl);
      });
    }, (error) => {
      console.error("Error fetching comments: ", error);
    });







    function handleInput() {
      const input = document.getElementById("userInput").value;
      const reply = getSmartResponse(input);
      document.getElementById("responseBox").innerHTML = reply;
    }
    window.handleInput = handleInput;

    // Modal control
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalBg = document.getElementById("modalBg");
    openModalBtn.onclick = () => {
      modalBg.classList.add("active");
    };
    document.getElementById("heroSignInBtn").onclick = () => {
      modalBg.classList.add("active");
    };
    closeModalBtn.onclick = () => {
      modalBg.classList.remove("active");
    };
    window.addEventListener("click", function (e) {
      if (e.target === modalBg) modalBg.classList.remove("active");
    });

    // User type selection logic
    const userTypeGroup = document.getElementById("userTypeGroup");
    const userTypeBtns = userTypeGroup.querySelectorAll(".user-type-btn");
    let selectedType = "customer";
    userTypeBtns.forEach((btn) => {
      btn.onclick = () => {
        userTypeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedType = btn.getAttribute("data-type");
      };
    });

    // Next button action
    document.getElementById("nextBtn").onclick = function () {
      if (selectedType === "customer") {
        window.location.href = "/pages/customer-login.html";
      } else {
        window.location.href = "/pages/shopkeeper-login.html";
        modalBg.classList.remove("active");
      }
    };
