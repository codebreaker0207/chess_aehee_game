import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfGn5OYurP78rYRQTBnS_9QOkMCMwQhok",
  authDomain: "aehee-c1b18.firebaseapp.com",
  projectId: "aehee-c1b18",
  storageBucket: "aehee-c1b18.firebasestorage.app",
  messagingSenderId: "843166194124",
  appId: "1:843166194124:web:87f1b8308ced5f060f2569",
  measurementId: "G-TL6NZ0S78F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export let currentUserUid = null;

// 회원가입
document.getElementById("signupBtn")?.addEventListener("click", () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => { alert("회원가입 성공"); })
    .catch(error => alert("회원가입 오류: " + error.message));
});

// 로그인
document.getElementById("loginBtn")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => { 
        alert("로그인 성공");
        location.href = "location/index.html"; // 로그인 후 모둠 페이지로 이동
    })
    .catch(error => alert("로그인 오류: " + error.message));
});

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
  currentUserUid = user ? user.uid : null;
});
