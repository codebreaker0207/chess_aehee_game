import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const loginLink = document.getElementById("loginLink");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const profileEmail = document.getElementById("profileEmail");

const setLoggedOutState = () => {
  if (loginLink) loginLink.style.display = "inline-block";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (userInfo) userInfo.textContent = "";
  if (profileEmail) profileEmail.textContent = "로그인되어 있지 않습니다.";
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (userInfo) userInfo.textContent = `${user.email}님 환영합니다!`;
    if (profileEmail) profileEmail.textContent = user.email ?? "";
  } else {
    setLoggedOutState();
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("로그아웃되었습니다.");
      setLoggedOutState();
    } catch (e) {
      alert("로그아웃 실패: " + e.message);
    }
  });
}

console.log("Auth 상태 감지 스크립트 로드됨");
