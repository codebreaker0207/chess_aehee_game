let score = 0;
let time = 60;
let timer;

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const clickBtn = document.getElementById("clickBtn");
const restartBtn = document.getElementById("restartBtn");

clickBtn.addEventListener("click", () => {
    score++;
    scoreDisplay.textContent = score;
});

function startGame() {
    score = 0;
    time = 60;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
    clickBtn.disabled = false;
    restartBtn.style.display = "none";

    timer = setInterval(() => {
        time--;
        timeDisplay.textContent = time;
        if (time <= 0) {
            clearInterval(timer);
            clickBtn.disabled = true;
            alert(`게임 종료! 점수: ${score}`);
            restartBtn.style.display = "inline-block";
        }
    }, 1000);
}

restartBtn.addEventListener("click", startGame);

// 게임 시작
startGame();
