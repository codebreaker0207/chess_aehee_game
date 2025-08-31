import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDfGn5OYurP78rYRQTBnS_9QOkMCMwQhok",
  authDomain: "aehee-c1b18.firebaseapp.com",
  projectId: "aehee-c1b18",
  storageBucket: "aehee-c1b18.firebasestorage.app",
  messagingSenderId: "843166194124",
  appId: "1:843166194124:web:87f1b8308ced5f060f2569",
  measurementId: "G-TL6NZ0S78F"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 회원가입
document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("회원가입 성공: " + userCredential.user.email);
    })
    .catch(error => {
      alert("회원가입 오류: " + error.message);
    });
});

// 로그인
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("로그인 성공: " + userCredential.user.email);
    })
    .catch(error => {
      alert("로그인 오류: " + error.message);
    });
});

// 로그아웃
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("로그아웃 성공");
  });
});

// 로그인 상태 표시
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("user-info").innerText = "로그인됨: " + user.email;
  } else {
    document.getElementById("user-info").innerText = "로그인 안 됨";
  }
});
