// 이미지 파일은 index.html과 같은 폴더에 있음
const PATH_POOP = './poop.png';
const PATH_CANDY = './candy.png';
const PATH_PLAYER = './player.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

let gameRunning = false;
let score = 0;
let lives = 3;
let player = { x: W / 2, y: H - 70, w: 56, h: 40, speed: 6 };
let objects = [];
let spawnTimer = 0;
let spawnInterval = 60;

const imgPoop = new Image();
imgPoop.src = PATH_POOP;
const imgCandy = new Image();
imgCandy.src = PATH_CANDY;
const imgPlayer = new Image();
imgPlayer.src = PATH_PLAYER;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function rectsOverlap(a, b) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

function spawn() {
  const type = Math.random() < 0.25 ? "candy" : "poop";
  const size = type === "poop" ? rand(36, 56) : rand(30, 44);
  const x = rand(12, W - size - 12);
  const speed = rand(2 + score * 0.02, 3 + score * 0.05);
  objects.push({ x, y: -size, w: size, h: size, type, speed });
}

function update() {
  if (!gameRunning) return;
  spawnTimer++;
  if (spawnTimer >= Math.max(20, spawnInterval - Math.floor(score / 10))) {
    spawn();
    spawnTimer = 0;
  }
  objects.forEach((o) => {
    o.y += o.speed;
  });
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    const p = {
      x: player.x - player.w / 2,
      y: player.y - player.h / 2,
      w: player.w,
      h: player.h,
    };
    if (rectsOverlap(p, o)) {
      if (o.type === "poop") {
        lives--;
        updateHUD();
        playSound("poop");
        if (lives <= 0) endGame();
      } else {
        score += 10;
        updateHUD();
        playSound("candy");
      }
      objects.splice(i, 1);
    } else if (o.y > H + 40) {
      objects.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#eaf3ff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e9f0ff";
  ctx.fillRect(0, H - 48, W, 48);

  const px = player.x - player.w / 2;
  const py = player.y - player.h / 2;
  if (imgPlayer.complete && imgPlayer.naturalWidth !== 0) {
    ctx.drawImage(imgPlayer, px, py, player.w, player.h);
  } else {
    ctx.fillStyle = "#2b7be4";
    ctx.fillRect(px, py, player.w, player.h);
  }

  objects.forEach((o) => {
    let img =
      o.type === "poop"
        ? imgPoop
        : imgCandy;
    if (img.complete && img.naturalWidth !== 0)
      ctx.drawImage(img, o.x, o.y, o.w, o.h);
  });
}

function loop() {
  update();
  draw();
  if (gameRunning) requestAnimationFrame(loop);
}

let keys = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

function applyInput() {
  if (keys["ArrowLeft"] || keys["a"]) player.x -= player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += player.speed;
  player.x = Math.max(
    player.w / 2 + 6,
    Math.min(W - player.w / 2 - 6, player.x)
  );
}

document.getElementById("leftBtn").addEventListener("mousedown", () => (keys["ArrowLeft"] = true));
document.getElementById("leftBtn").addEventListener("mouseup", () => (keys["ArrowLeft"] = false));
document.getElementById("rightBtn").addEventListener("mousedown", () => (keys["ArrowRight"] = true));
document.getElementById("rightBtn").addEventListener("mouseup", () => (keys["ArrowRight"] = false));

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  player.x = e.clientX - rect.left;
});

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === "candy" ? "sine" : "square";
    osc.frequency.value = type === "candy" ? 880 : 220;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

function updateHUD() {
  document.getElementById("score").textContent = score;
  document.getElementById("lives").textContent = lives;
}
function startGame() {
  gameRunning = true;
  score = 0;
  lives = 3;
  objects = [];
  updateHUD();
  document.getElementById("overlay").classList.add("hidden");
  requestAnimationFrame(loop);
}
function endGame() {
  gameRunning = false;
  document.getElementById("overlay").classList.remove("hidden");
  document.querySelector(".big").textContent = "게임 오버 💀";
}
function resetGame() {
  gameRunning = false;
  score = 0;
  lives = 3;
  objects = [];
  updateHUD();
  document.getElementById("overlay").classList.remove("hidden");
  document.querySelector(".big").textContent = "🗑️ 청소피하기 🍬";
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);

setInterval(() => {
  if (gameRunning) applyInput();
}, 1000 / 60);
updateHUD();
