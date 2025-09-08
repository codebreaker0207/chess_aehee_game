const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

const box = 20; // 한 칸 크기
let snake;
let food;
let score;
let direction;
let gameInterval;

function initGame() {
    snake = [{x: 8 * box, y: 8 * box}];
    direction = "RIGHT";
    score = 0;
    scoreDisplay.textContent = score;
    generateFood();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(draw, 100);
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / box)) * box,
        y: Math.floor(Math.random() * (canvas.height / box)) * box
    };
}

// 키보드 입력
document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
    if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
});

function draw() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 먹이 그리기
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, box, box);

    // 지렁이 그리기
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "lime" : "green";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    // 이동
    let headX = snake[0].x;
    let headY = snake[0].y;

    if (direction === "LEFT") headX -= box;
    if (direction === "RIGHT") headX += box;
    if (direction === "UP") headY -= box;
    if (direction === "DOWN") headY += box;

    // 벽 통과: 그냥 넘어가게 함
    if (headX >= canvas.width) headX = 0;
    if (headX < 0) headX = canvas.width - box;
    if (headY >= canvas.height) headY = 0;
    if (headY < 0) headY = canvas.height - box;

    // 먹이 먹었는지 확인
    if (headX === food.x && headY === food.y) {
        score++;
        scoreDisplay.textContent = score;
        generateFood();
    } else {
        snake.pop(); // 꼬리 제거
    }

    let newHead = {x: headX, y: headY};

    // 자기 몸에 부딪히면 게임 종료
    if (collision(newHead, snake)) {
        clearInterval(gameInterval);
        alert("게임 종료! 점수: " + score);
        return;
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) return true;
    }
    return false;
}

restartBtn.addEventListener("click", initGame);

initGame();
