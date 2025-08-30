const students = [];

const nameInput = document.getElementById('nameInput');
const genderInput = document.getElementById('genderInput');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentList = document.getElementById('studentList');
const generateGroupsBtn = document.getElementById('generateGroupsBtn');
const groupResult = document.getElementById('groupResult');

// 학생 추가
addStudentBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const gender = genderInput.value;
    if(name === "") return alert("이름을 입력하세요.");
    
    students.push({name, gender});
    renderStudentList();
    nameInput.value = '';
});

// 학생 명단 렌더링
function renderStudentList() {
    studentList.innerHTML = '';
    students.forEach((s, index) => {
        const li = document.createElement('li');
        li.textContent = `${s.name} (${s.gender})`;
        studentList.appendChild(li);
    });
}

// 모둠 생성
generateGroupsBtn.addEventListener('click', () => {
    if(students.length === 0) return alert("학생을 추가하세요.");

    const maleStudents = students.filter(s => s.gender === "남");
    const femaleStudents = students.filter(s => s.gender === "여");

    shuffleArray(maleStudents);
    shuffleArray(femaleStudents);

    const allStudents = [];
    while(maleStudents.length > 0 || femaleStudents.length > 0) {
        if(maleStudents.length > 0) allStudents.push(maleStudents.pop());
        if(femaleStudents.length > 0) allStudents.push(femaleStudents.pop());
    }

    const groups = [];
    for(let i = 0; i < allStudents.length; i += 4) {
        groups.push(allStudents.slice(i, i + 4));
    }

    displayGroups(groups);
});

// 배열 섞기
function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 모둠 결과 출력
function displayGroups(groups) {
    groupResult.innerHTML = '';
    groups.forEach((group, index) => {
        const div = document.createElement('div');
        div.classList.add('group');
        div.innerHTML = `<strong>모둠 ${index + 1}</strong><br>` +
            group.map(s => `${s.name} (${s.gender})`).join('<br>');
        groupResult.appendChild(div);
    });
}
