import { currentUserUid } from "../firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const db = getFirestore();

// 학생 불러오기
async function loadStudents() {
  if (!currentUserUid) return;
  const snapshot = await getDocs(collection(db, "users", currentUserUid, "students"));
  const list = document.getElementById("studentList");
  list.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.name} (${data.gender})`;
    list.appendChild(li);
  });
}

// 학생 추가
document.getElementById("addStudentBtn").addEventListener("click", async () => {
  if (!currentUserUid) { alert("로그인 필요"); return; }
  const name = document.getElementById("nameInput").value.trim();
  const gender = document.getElementById("genderInput").value;
  if (!name) return;
  await addDoc(collection(db, "users", currentUserUid, "students"), { name, gender });
  document.getElementById("nameInput").value = "";
  loadStudents();
});

// 모둠 생성
document.getElementById("generateGroupsBtn").addEventListener("click", () => {
  const items = document.getElementById("studentList").querySelectorAll("li");
  const students = Array.from(items).map(li => li.textContent);
  const groupResult = document.getElementById("groupResult");
  groupResult.innerHTML = "";
  let shuffled = [...students].sort(() => Math.random() - 0.5);
  const groupSize = 4;
  for (let i = 0; i < shuffled.length; i += groupSize) {
    const group = shuffled.slice(i, i + groupSize);
    const div = document.createElement("div");
    div.innerHTML = `<strong>모둠 ${Math.floor(i/groupSize)+1}</strong>: ${group.join(", ")}`;
    groupResult.appendChild(div);
  }
});

// 로그인 후 학생 불러오기
setTimeout(loadStudents, 500);
