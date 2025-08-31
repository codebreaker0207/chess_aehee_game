document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("nameInput");
    const genderInput = document.getElementById("genderInput");
    const addStudentBtn = document.getElementById("addStudentBtn");
    const studentList = document.getElementById("studentList");
    const generateGroupsBtn = document.getElementById("generateGroupsBtn");
    const groupResult = document.getElementById("groupResult");

    let students = JSON.parse(localStorage.getItem("students")) || []; // 저장된 데이터 불러오기

    // 학생 목록 화면에 표시
    function renderStudents() {
        studentList.innerHTML = "";
        students.forEach((student, index) => {
            const li = document.createElement("li");
            li.textContent = `${student.name} (${student.gender})`;
            studentList.appendChild(li);
        });
    }

    renderStudents();

    // 학생 추가
    addStudentBtn.addEventListener("click", () => {
        const name = nameInput.value.trim();
        const gender = genderInput.value;
        if (name) {
            students.push({ name, gender });
            localStorage.setItem("students", JSON.stringify(students)); // 저장
            renderStudents();
            nameInput.value = "";
        }
    });

    // 모둠 생성
    generateGroupsBtn.addEventListener("click", () => {
        groupResult.innerHTML = "";
        let shuffled = [...students].sort(() => Math.random() - 0.5);
        let groupSize = 4;

        for (let i = 0; i < shuffled.length; i += groupSize) {
            const group = shuffled.slice(i, i + groupSize);
            const div = document.createElement("div");
            div.innerHTML = `<strong>모둠 ${Math.floor(i / groupSize) + 1}</strong>: ` + 
                group.map(s => `${s.name} (${s.gender})`).join(", ");
            groupResult.appendChild(div);
        }
    });
});
