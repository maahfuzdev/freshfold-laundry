import { getSmartResponse } from "../features/laundry-faq.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Real-time Firestore Reviews Listener
onSnapshot(collection(db, "userComments"), (snapshot) => {
  if (snapshot.empty) return;
  reviewList.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const initial = (data.name || "U").charAt(0).toUpperCase();
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <div class="stars">
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
      </div>
      <p class="comment-text">“${data.comment || ""}”</p>
      <div class="author">
        <div class="author-avatar">${initial}</div>
        <div class="author-info">
          <div class="author-name">${data.name || "Anonymous"}</div>
          <span>${data.location || "Bangladesh"}</span>
        </div>
      </div>
    `;
    reviewList.appendChild(card);
  });
}, (error) => {
  console.error("Error fetching comments: ", error);
});

// FAQ Chatbot Input Handler
function handleInput() {
  const userInput = document.getElementById("userInput");
  const responseBox = document.getElementById("responseBox");
  const query = userInput.value.trim();
  if (!query) {
    responseBox.style.display = "none";
    return;
  }
  const reply = getSmartResponse(query);
  responseBox.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 10px;">
      <i class="fa-solid fa-sparkles" style="color: var(--brand-600); margin-top: 3px;"></i>
      <div>${reply}</div>
    </div>
  `;
  responseBox.style.display = "block";
}
window.handleInput = handleInput;

// Quick Suggestion Chip Click Handler
window.setQuery = function (query) {
  const input = document.getElementById("userInput");
  input.value = query;
  handleInput();
  input.focus();
};

// Enter key support for search input
document.getElementById("userInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleInput();
  }
});

// Modal Control
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const heroSignInBtn = document.getElementById("heroSignInBtn");
const modalBg = document.getElementById("modalBg");

function openModal() {
  modalBg.classList.add("active");
}
function closeModal() {
  modalBg.classList.remove("active");
}

if (openModalBtn) openModalBtn.onclick = openModal;
if (heroSignInBtn) heroSignInBtn.onclick = openModal;
if (closeModalBtn) closeModalBtn.onclick = closeModal;

window.addEventListener("click", (e) => {
  if (e.target === modalBg) closeModal();
});

// User type selection logic
const userTypeGroup = document.getElementById("userTypeGroup");
const userTypeBtns = userTypeGroup?.querySelectorAll(".user-type-btn") || [];
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
    window.location.href = "customer-login.html";
  } else {
    window.location.href = "shopkeeper-login.html";
    closeModal();
  }
};
