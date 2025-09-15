let clickCount = 0;
let timeLeft = 0;
let timer;
let isTestRunning = false;
let timeInput = document.getElementById('timeInput');
let clickGraph = document.getElementById('clickGraph');

// 클릭 이벤트 리스너
document.getElementById('clickBtn').addEventListener('click', function() {
    if (!isTestRunning) return;
    clickCount++;
    document.getElementById('clickCount').textContent = `클릭 횟수: ${clickCount}`;
    updateGraph();
});

// 타이머 함수
function startTimer() {
    timeLeft = parseInt(timeInput.value); // 사용자 입력에 따른 시간 설정
    document.getElementById('time').textContent = timeLeft;
    
    timer = setInterval(function() {
        timeLeft--;
        document.getElementById('time').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            isTestRunning = false;
            calculateCPS();
        }
    }, 1000);
}

// CPS 계산 함수
function calculateCPS() {
    const cps = (clickCount / parseInt(timeInput.value)).toFixed(2); // 설정된 시간에 대한 CPS 계산
    document.getElementById('cpsResult').textContent = `CPS: ${cps}`;
}

// 그래프 업데이트 함수
let graphData = {
    labels: [],
    datasets: [{
        label: '클릭 횟수',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        tension: 0.1
    }]
};

let graphConfig = {
    type: 'line',
    data: graphData,
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: '시간 (초)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: '클릭 횟수'
                },
                min: 0
            }
        }
    }
};

let chart = new Chart(clickGraph, graphConfig);

function updateGraph() {
    if (isTestRunning) {
        graphData.labels.push(parseInt(timeInput.value) - timeLeft + 1); // 시간 축 (1초 단위)
        graphData.datasets[0].data.push(clickCount); // 클릭 횟수
        chart.update();
    }
}

// 게임 시작
function startTest() {
    clickCount = 0;
    document.getElementById('clickCount').textContent = `클릭 횟수: ${clickCount}`;
    document.getElementById('cpsResult').textContent = `CPS: 0`;
    isTestRunning = true;
    updateGraph(); // 초기화 후 그래프 업데이트
    document.getElementById('clickBtn').disabled = false; // 클릭 버튼 활성화
    startTimer();
}

// 시간 설정 후 테스트 시작
document.getElementById('startBtn').addEventListener('click', function() {
    const inputTime = parseInt(timeInput.value);
    if (inputTime > 0) {
        startTest();
        document.getElementById('startBtn').disabled = true; // 시작 버튼 비활성화
    } else {
        alert('시간을 1초 이상으로 설정해주세요.');
    }
});
