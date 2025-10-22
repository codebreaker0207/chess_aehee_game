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
