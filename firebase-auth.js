import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } 
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
const auth = getAuth(app);

// 메뉴 버튼 선택
const authBtn = document.getElementById("authBtn");

// 버튼 클릭 시 동작
authBtn.addEventListener("click", () => {
  if (auth.currentUser) {
    // 로그인 상태 → 로그아웃
    signOut(auth).then(() => {
      alert("로그아웃 성공");
    });
  } else {
    // 로그아웃 상태 → 익명 로그인
    signInAnonymously(auth)
      .then(() => {
        alert("익명 로그인 성공");
      })
      .catch(error => {
        alert("로그인 오류: " + error.message);
      });
  }
});

// 로그인 상태 변경 시 버튼 텍스트를 UID로 표시
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 익명 로그인이면 UID, 이메일 로그인이면 user.email
    const displayName = user.isAnonymous ? "익명-" + user.uid.slice(0, 6) : user.email;
    authBtn.textContent = displayName;
  } else {
    authBtn.textContent = "로그인";
  }
});
