// 탭 버튼 클릭 시 콘텐츠 전환
const tabBtns = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

const activateTab = (tabId) => {
  if (!tabId) return;
  contents.forEach(section => {
    section.classList.toggle("active", section.id === tabId);
  });
  tabBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
};

const updateHash = (tabId) => {
  if (!tabId) return;
  const newHash = `#${tabId}`;
  if (window.location.hash !== newHash) {
    history.replaceState(null, "", newHash);
  }
};

const handleTabChange = (tabId) => {
  if (!tabId || !document.getElementById(tabId)) return;
  activateTab(tabId);
  updateHash(tabId);
};

tabBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    handleTabChange(btn.dataset.tab);
  });
});

const applyHashTab = () => {
  const hashTab = window.location.hash.replace("#", "");
  if (hashTab && document.getElementById(hashTab)) {
    activateTab(hashTab);
  } else if (contents.length) {
    const defaultTab = contents[0].id;
    activateTab(defaultTab);
    updateHash(defaultTab);
  }
};

window.addEventListener("hashchange", applyHashTab);
applyHashTab();

// 로그인 모달
const loginLink = document.getElementById('loginLink');
const loginOverlay = document.getElementById('loginOverlay');
const closeLoginBtn = document.getElementById('closeLoginBtn');

loginLink.addEventListener('click', e => {
  e.preventDefault();
  loginOverlay.style.display = 'flex';
});

loginOverlay.addEventListener('click', e => {
  if (e.target === loginOverlay) loginOverlay.style.display = 'none';
});

closeLoginBtn.addEventListener('click', () => {
  loginOverlay.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
  const loginLink = document.getElementById('loginLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');

  // 이미 로그인된 사용자인지 확인
  const user = getUser(); // 로그인 상태 확인 함수 (firebase 등 사용)
  if (user) {
    loginLink.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userInfo.textContent = `안녕하세요, ${user.email}`;
  } else {
    loginLink.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
  }

  // 로그아웃 버튼 클릭
  logoutBtn.addEventListener('click', () => {
    logoutUser(); // 로그아웃 처리 함수
    loginLink.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
  });
});
