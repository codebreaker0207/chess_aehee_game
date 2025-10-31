// 아재개그 퀴즈 데이터
const allQuizzes = [
    { question: "세상에서 가장 쉬운 숫자는?", options: ["0", "18", "2"], answer: "2" }, // 십팔(쉽팔)
    { question: "소가 번개에 맞아 죽으면?", options: ["우사인볼트", "다이소", "소고기"], answer: "우사인볼트" }, // 우(소)사인 볼트
    { question: "세종대왕이 만든 우유는?", options: ["아야어여오요우유", "한글우유", "왕우유"], answer: "아야어여오요우유" }, // 아야어여오요우유
    { question: "바나나가 웃으면?", options: ["바나나킥", "바나나스마일", "바나나나"], answer: "바나나킥" }, // 바나나나
    { question: "세상에서 가장 뜨거운 복숭아는?", options: ["천도복숭아", "핫피치", "털복숭아"], answer: "천도복숭아" }, // 털복숭아(Hot)
    { question: "고등학생들이 싫어하는 나무는?", options: ["은행나무", "소나무", "야자나무"], answer: "야자나무" }, // 야간 자율 학습
    { question: "물고기 중 가장 학력이 좋은 물고기는?", options: ["고래", "참치", "꽁치"], answer: "꽁치" }, // 꽁치 (공부를 치열하게)
    { question: "직접 총을 만들면?", options: ["손수건", "취권", "직총"], answer: "손수건" },
    { question: "지구가 가장 고생한 시기는?", options: ["지구온난화", "고생대", "어몽어스(/earth)/"], answer: "고생대" }
];

// **********************************************
// 1. 날짜 기반 시드 및 인덱스 결정 로직
// **********************************************

// 현재 날짜를 YYYY-MM-DD 형식의 문자열로 가져옵니다.
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 날짜 문자열을 기반으로 결정론적인 인덱스를 계산합니다.
 * 날짜가 바뀌기 전까지는 항상 같은 퀴즈를 선택합니다.
 * @param {string} dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @returns {number} 퀴즈 배열의 인덱스
 */
function getDailyQuizIndex(dateString) {
    // 간단한 문자열 해시 함수 (시드 생성)
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        // 해시값을 업데이트하고 32비트 정수로 변환합니다.
        hash = (hash << 5) - hash + dateString.charCodeAt(i);
        hash |= 0; 
    }
    
    // 해시값을 퀴즈 배열 길이로 나눈 나머지로 오늘의 퀴즈 인덱스를 결정합니다.
    return Math.abs(hash) % allQuizzes.length;
}

// **********************************************
// 2. DOM 조작 및 이벤트 핸들링
// **********************************************

let selectedAnswer = null;
let currentQuiz = null;

function loadDailyQuiz() {
    const todayDate = getTodayDateString();
    const dailyQuizIndex = getDailyQuizIndex(todayDate);
    currentQuiz = allQuizzes[dailyQuizIndex];

    document.getElementById('date-display').textContent = `날짜: ${todayDate}`;
    document.getElementById('question').textContent = `${dailyQuizIndex + 1}번 문제: ${currentQuiz.question}`;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    selectedAnswer = null;

    currentQuiz.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        
        // 버튼 클릭 시 선택 상태 저장 및 스타일 변경
        button.onclick = function() {
            // 모든 버튼에서 'selected' 클래스 제거
            document.querySelectorAll('#options .option-button').forEach(btn => btn.classList.remove('selected'));
            // 현재 클릭된 버튼에 'selected' 클래스 추가
            this.classList.add('selected');
            selectedAnswer = option;
        };

        optionsDiv.appendChild(button);
    });
    
    document.getElementById('submit-quiz').disabled = false;
    document.getElementById('answer-area').textContent = '';
}

function checkAnswer() {
    const resultsDiv = document.getElementById('answer-area');
    const submitButton = document.getElementById('submit-quiz');
    
    if (selectedAnswer === null) {
        resultsDiv.textContent = "⚠️ 보기를 선택해주세요.";
        resultsDiv.style.color = 'orange';
        return;
    }

    // 퀴즈 제출 후 모든 버튼 비활성화
    document.querySelectorAll('#options .option-button').forEach(btn => btn.disabled = true);
    submitButton.disabled = true;

    if (selectedAnswer === currentQuiz.answer) {
        resultsDiv.textContent = "✅ 정답입니다! 아재력이 대단하시네요!";
        resultsDiv.style.color = 'green';
    } else {
        resultsDiv.textContent = `❌ 오답입니다. 정답은: ${currentQuiz.answer}`;
        resultsDiv.style.color = 'red';
    }
}

// 초기화 및 이벤트 리스너
document.addEventListener('DOMContentLoaded', loadDailyQuiz);

document.getElementById('submit-quiz').addEventListener('click', checkAnswer);



