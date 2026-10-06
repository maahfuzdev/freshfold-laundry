import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
    const auth = getAuth(app);

    let balance = 0;
    let generatedOtp = "";
    let walletDoc;
    let currentEmail = "";

    const balanceDisplay = document.getElementById('balance');
    const historyList = document.getElementById('history');

    function updateBalanceDisplay() {
      balanceDisplay.textContent = balance.toFixed(2);
    }

    function addHistory(text) {
      const li = document.createElement('li');
      li.textContent = text;
      historyList.prepend(li);
    }

    async function saveTransaction(text, amount) {
      balance += amount;
      updateBalanceDisplay();
      await updateDoc(walletDoc, {
        balance: balance,
        transactions: arrayUnion(text)
      });
      addHistory(text);
    }

    async function loadWallet() {
      const docSnap = await getDoc(walletDoc);
      if (docSnap.exists()) {
        const data = docSnap.data();
        balance = data.balance || 0;
        updateBalanceDisplay();
        if (Array.isArray(data.transactions)) {
          data.transactions.reverse().forEach(addHistory);
        }
      } else {
        await setDoc(walletDoc, {
          balance: 0,
          transactions: ["Initial Balance: ৳0.0"]
        });
        balance = 0;
        updateBalanceDisplay();
        addHistory("Initial Balance: ৳0.0");
      }
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentEmail = user.email;
        walletDoc = doc(db, "wallets", currentEmail);
        await loadWallet();
      } else {
        alert("Please login to access your wallet.");
      }
    });

    // Expose functions globally
    window.showPaymentOptions = function () {
      document.getElementById('paymentOptions').style.display = 'block';
      document.getElementById('bkashForm').style.display = 'none';
    };

    window.selectPayment = function (method) {
      const amountInput = document.getElementById('amount');
      const amount = parseFloat(amountInput.value);
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount first.");
        return;
      }
      if (method === 'bKash') {
        document.getElementById('paymentOptions').style.display = 'none';
        document.getElementById('bkashForm').style.display = 'block';
      } else {
        const msg = `Recharged ৳${amount.toFixed(2)} via ${method}`;
        saveTransaction(msg, amount);
        amountInput.value = '';
        document.getElementById('paymentOptions').style.display = 'none';
      }
    };

    window.confirmBkash = function () {
      const bkashNumber = document.getElementById('bkashNumber').value;
      const amount = parseFloat(document.getElementById('amount').value);
      if (!bkashNumber || bkashNumber.length < 11) {
        alert("Please enter a valid bKash number.");
        return;
      }
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
      }
      generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("OTP (for testing):", generatedOtp);
      document.getElementById('bkashForm').style.display = 'none';
      document.getElementById('otpSection').style.display = 'block';
    };

    window.verifyOtp = function () {
      const userOtp = document.getElementById('otpInput').value;
      const bkashNumber = document.getElementById('bkashNumber').value;
      const amount = parseFloat(document.getElementById('amount').value);
      if (userOtp === generatedOtp) {
        const msg = `Recharged ৳${amount.toFixed(2)} via bKash (${bkashNumber})`;
        saveTransaction(msg, amount);
        document.getElementById('bkashNumber').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('otpInput').value = '';
        document.getElementById('otpSection').style.display = 'none';
        alert("Recharge successful!");
      } else {
        alert("Incorrect OTP. Please try again.");
      }
    };

    window.cancelBkash = function () {
      document.getElementById('bkashForm').style.display = 'none';
    };

    window.cancelOtp = function () {
      document.getElementById('otpSection').style.display = 'none';
      document.getElementById('bkashNumber').value = '';
    };
