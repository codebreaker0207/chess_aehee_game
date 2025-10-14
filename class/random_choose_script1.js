// 학년/반별 이름 목록 (예시). 실제 데이터는 필요에 따라 수정하세요.
const names = {
  "1": { "1": ["김민준", "이서연", "박도현", "최하준", "강예린"] },
  "2": { "1": ["고은서", "김민수", "박서준", "이하은", "정유진"],
         "5": ["권민진", "권주희", "권지인", "김나리", "김나은", "김도윤", "박도현", "박서진", "박지민", "양지민", "염석현", "오진성", "유재윤", "유정연", "윤홍민", "이예찬", "이정환", "이후성", "조혜윤", "황제선", "홍재익", "김혜솔", "허성재", "최유진", "정연우", "정동휘", "이지영"],
         "6": ["국현", "김도하", "김도희", "김보민", "김서영", "김태영", "남궁연", "노범호", "박건우", "박민서", "소영주", "안소정", "양승호", "양승호", "양지후", "유수빈", "이규진", "이다은", "이동린", "이연희", "이예준", "이정재", "정루원", "천성훈", "최수영", "최우선", "한서준", "홍새미", "이다겸"],
         "7": ["강별","강승호","권이현","권혁","김민재","김주석","남현우","박수민","박주아","박지후","박해원","서동현","안현진","원도현","윤현수","이무헌","이윤아","이지환","이하진","이해인","임재이","임지희","조안나","조은빈","최선요","최유정","최정윤","황유진"]},
  "3": { "1": ["권지민", "문소연", "배도현", "신유나", "최민재"] }
};

const storedPicked = JSON.parse(localStorage.getItem('pickedNames'));
const pickedNames = storedPicked || { "1": {}, "2": {}, "3": {} };

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input[name="grade"]').forEach(radio => {
    radio.addEventListener('change', function () {
      updateClassOptions(this.value);
    });
  });
});

function updateClassOptions(grade) {
  const classContainer = document.getElementById('classSelectionContainer');
  const classOptionsDiv = document.getElementById('classOptions');
  classOptionsDiv.innerHTML = '';
  document.getElementById('passwordContainer').style.display = 'none';

  const classCount = grade === '1' ? 10 : grade === '2' ? 9 : 8;

  for (let i = 1; i <= classCount; i++) {
    const optionHTML = `
      <div class="option-group">
        <input type="radio" id="class${i}" name="class" value="${i}">
        <label for="class${i}">${i}반</label>
      </div>
    `;
    classOptionsDiv.insertAdjacentHTML('beforeend', optionHTML);
  }

  classContainer.style.display = 'block';

  document.querySelectorAll('input[name="class"]').forEach(radio => {
    radio.addEventListener('change', function () {
      document.getElementById('passwordContainer').style.display = 'block';
    });
  });
}

function shuffle(array) {
  // 피셔-예이츠 셔플
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getNames(grade, cls) {
  const list = names?.[grade]?.[cls];
  if (Array.isArray(list) && list.length > 0) return list.slice();
  // 기본 더미 데이터 (필요 시 교체)
  return Array.from({ length: 30 }, (_, i) => `학생 ${i + 1}`);
}

function pickName() {
  const selectedGrade = document.querySelector('input[name="grade"]:checked');
  const selectedClass = document.querySelector('input[name="class"]:checked');
  const passwordInput = document.getElementById('passwordInput').value.trim();

  if (!selectedGrade || !selectedClass) {
    alert('학년과 반을 모두 선택해 주세요!');
    return;
  }

  const grade = selectedGrade.value;
  const cls = selectedClass.value;
  const correctPassword = `${grade}021${cls}39`;

  if (passwordInput !== correctPassword) {
    alert('비밀번호가 올바르지 않습니다!');
    return;
  }

  const allNames = getNames(grade, cls);
  if (!pickedNames[grade][cls]) {
    pickedNames[grade][cls] = [];
  }

  const remainingNames = allNames.filter(name => !pickedNames[grade][cls].includes(name));
  if (remainingNames.length === 0) {
    alert('더 이상 뽑을 이름이 없습니다!');
    return;
  }

  const strip = document.getElementById('rouletteStrip');
  strip.innerHTML = '';
  strip.style.transform = 'translateX(0)';
  strip.style.transition = 'none';

  // 이동 시간은 조금 줄이되, 충분한 거리 이동 보장
  const SCROLL_LOOPS = 8; // 이전보다 약간 감소
  const repeated = [];
  for (let i = 0; i < SCROLL_LOOPS; i++) repeated.push(...remainingNames);

  // 최종 선정할 이름을 먼저 뽑고, 그 이름의 충분히 뒤쪽 발생 위치로 스크롤 목표 설정
  const chosen = remainingNames[Math.floor(Math.random() * remainingNames.length)];

  repeated.forEach(name => {
    const span = document.createElement('span');
    span.textContent = name;
    span.classList.add('roulette-item');
    strip.appendChild(span);
  });

  // 레이아웃 반영 후 측정하기 위해 2프레임 대기
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const container = document.querySelector('.roulette-container');
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const spans = Array.from(strip.querySelectorAll('span'));
      const maxTranslate = Math.max(0, strip.scrollWidth - container.clientWidth);

      // 후보 인덱스: chosen 텍스트가 있는 모든 위치
      const candidateIdx = [];
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].textContent === chosen) candidateIdx.push(i);
      }

      // 너무 앞쪽이 아닌, 전체의 70% 이후 지점에서 가능한 타깃을 우선 선택
      const threshold = Math.floor(spans.length * 0.7);
      function deltaFor(index) {
        const r = spans[index].getBoundingClientRect();
        const c = r.left + r.width / 2;
        return c - centerX; // >0 이면 왼쪽으로 이동해야 함
      }

      let targetIndex = null;
      for (const idx of candidateIdx) {
        if (idx >= threshold) {
          const d = deltaFor(idx);
          if (d <= maxTranslate) { targetIndex = idx; break; }
        }
      }
      if (targetIndex === null) {
        // 뒤에서부터 가능한 지점 탐색
        for (let k = candidateIdx.length - 1; k >= 0; k--) {
          const idx = candidateIdx[k];
          const d = deltaFor(idx);
          if (d <= maxTranslate) { targetIndex = idx; break; }
        }
      }
      if (targetIndex === null && candidateIdx.length) {
        // 모두 범위를 넘으면, maxTranslate에 가장 가까운 지점 선택
        let best = candidateIdx[0];
        let bestDiff = Infinity;
        for (const idx of candidateIdx) {
          const d = deltaFor(idx);
          const diff = Math.abs(d - maxTranslate);
          if (diff < bestDiff) { bestDiff = diff; best = idx; }
        }
        targetIndex = best;
      }

      // 최종 이동량 계산 및 트랜지션(이동 시간 약간 단축)
      const finalDelta = Math.max(0, Math.min(deltaFor(targetIndex ?? 0), maxTranslate));
      strip.style.transition = 'transform 1.2s cubic-bezier(0.22, 0.61, 0.36, 1)';
      strip.style.transform = `translateX(-${finalDelta}px)`;

      strip.addEventListener('transitionend', () => {
        const resultBox = document.getElementById('resultBox');
        if (resultBox) resultBox.textContent = `선택된 이름: ${chosen}`;
        pickedNames[grade][cls].push(chosen);
        localStorage.setItem('pickedNames', JSON.stringify(pickedNames));
      }, { once: true });
    });
  });
}
