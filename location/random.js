// Firebase Firestore 가져오기
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

let currentUser = null;

// 로그인 상태 확인
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("로그인됨:", user.uid);
    loadStudents(); // 로그인 시 학생 명단 불러오기
  } else {
    currentUser = null;
    console.log("로그아웃 상태");
  }
});

// 학생 추가
document.getElementById("addStudentBtn").addEventListener("click", async () => {
  if (!currentUser) {
    alert("로그인이 필요합니다!");
    return;
  }

  const name = document.getElementById("nameInput").value;
  const gender = document.getElementById("genderInput").value;

  if (name.trim() === "") return;

  await addDoc(collection(db, "users", currentUser.uid, "students"), {
    name: name,
    gender: gender
  });

  document.getElementById("nameInput").value = "";
  loadStudents();
});

// 학생 불러오기
async function loadStudents() {
  if (!currentUser) return;

  const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "students"));
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.name} (${data.gender})`;
    studentList.appendChild(li);
  });
}
