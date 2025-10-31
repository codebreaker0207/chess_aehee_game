// script.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

const box = 20; // 한 칸 크기 (픽셀 단위)
let snake;
let food;
let score;
let direction;
let gameInterval;

const images = {
    head: new Image(),
    body: new Image(),
    turn: new Image(),
    tail: new Image()
};
// imgs 폴더에 이미지 추가: head.png, body.png, turn.png, tail.png
images.head.src = "./imgs/head.png";
images.body.src = "./imgs/body.png";
images.turn.src = "./imgs/turn.png";
images.tail.src = "./imgs/tail.png";

function initGame() {
    // 초기 지렁이 길이 3, 오른쪽 향함
    snake = [
        { x: 8 * box, y: 8 * box },
        { x: 7 * box, y: 8 * box },
        { x: 6 * box, y: 8 * box }
    ];
    direction = "RIGHT";
    score = 0;
    scoreDisplay.textContent = score;
    generateFood();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(draw, 100);
}

function generateFood() {
    // 먹이가 지렁이 몸통과 겹치지 않게 단순 반복
    do {
        food = {
            x: Math.floor(Math.random() * (canvas.width / box)) * box,
            y: Math.floor(Math.random() * (canvas.height / box)) * box
        };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

// 키보드 입력
document.addEventListener("keydown", function (event) {
    if ((event.key === "w" || event.key === "W") && direction !== "DOWN") direction = "UP";
    if ((event.key === "s" || event.key === "S") && direction !== "UP") direction = "DOWN";
    if ((event.key === "a" || event.key === "A") && direction !== "RIGHT") direction = "LEFT";
    if ((event.key === "d" || event.key === "D") && direction !== "LEFT") direction = "RIGHT";
});


function draw() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 먹이 그리기
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, box, box);

    // 지렁이 그리기 (세그먼트별로 이미지 또는 폴백)
    for (let i = 0; i < snake.length; i++) {
        drawSegment(i);
    }

    // 이동 계산
    let headX = snake[0].x;
    let headY = snake[0].y;

    if (direction === "LEFT") headX -= box;
    if (direction === "RIGHT") headX += box;
    if (direction === "UP") headY -= box;
    if (direction === "DOWN") headY += box;

    // 벽 통과
    if (headX >= canvas.width) headX = 0;
    if (headX < 0) headX = canvas.width - box;
    if (headY >= canvas.height) headY = 0;
    if (headY < 0) headY = canvas.height - box;

    // 먹이 먹기
    if (headX === food.x && headY === food.y) {
        score++;
        scoreDisplay.textContent = score;
        generateFood();
    } else {
        snake.pop(); // 꼬리 제거
    }

    let newHead = { x: headX, y: headY };

    // 자기 자신과 충돌
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

// 모바일 스와이프 제어 (변경 없음)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", function (e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", function (e) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        // 좌우
        if (dx > 0 && direction !== "LEFT") direction = "RIGHT";
        else if (dx < 0 && direction !== "RIGHT") direction = "LEFT";
    } else if (Math.abs(dy) > threshold) {
        // 상하
        if (dy > 0 && direction !== "UP") direction = "DOWN";
        else if (dy < 0 && direction !== "DOWN") direction = "UP";
    }
});

// 드로우 보조 함수들
function drawImageRot(img, x, y, angle) {
    const px = x + box / 2;
    const py = y + box / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.drawImage(img, -box / 2, -box / 2, box, box);
    ctx.restore();
}

function drawFallback(seg, color) {
    ctx.fillStyle = color;
    ctx.fillRect(seg.x, seg.y, box, box);
}

function dirToAngle(vx, vy) {
    // vx, vy 는 그리드 단위 (-1,0,1)
    if (vx === 1 && vy === 0) return 0;             // 오른쪽
    if (vx === -1 && vy === 0) return Math.PI;      // 왼쪽
    if (vx === 0 && vy === 1) return Math.PI / 2;   // 아래
    if (vx === 0 && vy === -1) return -Math.PI / 2; // 위
    return 0;
}

function drawSegment(i) {
    const seg = snake[i];

    // 머리
    if (i === 0) {
        if (snake.length > 1) {
            const next = snake[1];
            const vx = (seg.x - next.x) / box;
            const vy = (seg.y - next.y) / box;
            const angle = dirToAngle(vx, vy);
            if (images.head.complete && images.head.naturalWidth !== 0) drawImageRot(images.head, seg.x, seg.y, angle);
            else drawFallback(seg, "lime");
        } else {
            // 단일 세그먼치인 경우 현재 방향으로 표시
            let angle = 0;
            if (direction === "LEFT") angle = Math.PI;
            if (direction === "UP") angle = -Math.PI / 2;
            if (direction === "DOWN") angle = Math.PI / 2;
            if (images.head.complete && images.head.naturalWidth !== 0) drawImageRot(images.head, seg.x, seg.y, angle);
            else drawFallback(seg, "lime");
        }
        return;
    }

    // 꼬리
    if (i === snake.length - 1) {
        const prev = snake[i - 1];
        const vx = (prev.x - seg.x) / box;
        const vy = (prev.y - seg.y) / box;
        const angle = dirToAngle(vx, vy);
        if (images.tail.complete && images.tail.naturalWidth !== 0) drawImageRot(images.tail, seg.x, seg.y, angle);
        else drawFallback(seg, "darkgreen");
        return;
    }

    // 중간 (몸통 or 코너)
    const prev = snake[i - 1];
    const next = snake[i + 1];

    // 수직 또는 수평(직선)
    if (prev.x === next.x) {
        // 세로
        if (images.body.complete && images.body.naturalWidth !== 0) drawImageRot(images.body, seg.x, seg.y, Math.PI / 2);
        else drawFallback(seg, "green");
        return;
    }
    if (prev.y === next.y) {
        // 가로
        if (images.body.complete && images.body.naturalWidth !== 0) drawImageRot(images.body, seg.x, seg.y, 0);
        else drawFallback(seg, "green");
        return;
    }

    // 코너(턴)
    const hasUp = (prev.y === seg.y - box) || (next.y === seg.y - box);
    const hasDown = (prev.y === seg.y + box) || (next.y === seg.y + box);
    const hasLeft = (prev.x === seg.x - box) || (next.x === seg.x - box);
    const hasRight = (prev.x === seg.x + box) || (next.x === seg.x + box);

    let angle = 0;
    // images.turn 기본 이미지는 Up->Right 연결 형태(위와 오른쪽을 연결)
    if (hasUp && hasRight) angle = 0;                 // Up + Right
    else if (hasRight && hasDown) angle = Math.PI / 2;  // Right + Down
    else if (hasDown && hasLeft) angle = Math.PI;        // Down + Left
    else if (hasLeft && hasUp) angle = -Math.PI / 2;     // Left + Up

    if (images.turn.complete && images.turn.naturalWidth !== 0) drawImageRot(images.turn, seg.x, seg.y, angle);
    else drawFallback(seg, "orange");
}
