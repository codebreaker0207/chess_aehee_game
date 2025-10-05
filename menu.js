// 탭 버튼 클릭 시 콘텐츠 전환
const tabBtns = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

const activateTab = (tabId) => {
  if (!tabId) return;

  contents.forEach((section) => {
    section.classList.toggle("active", section.id === tabId);
  });

  tabBtns.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
};

const updateHash = (tabId) => {
  if (!tabId) return;
  const newHash = `#${tabId}`;
  if (window.location.hash !== newHash) {
    if (typeof history.replaceState === "function") {
      history.replaceState(null, "", newHash);
    } else {
      window.location.hash = tabId;
    }
  }
};

const handleTabChange = (tabId, { updateLocation = true } = {}) => {
  if (!tabId || !document.getElementById(tabId)) return;
  activateTab(tabId);
  if (updateLocation) {
    updateHash(tabId);
  }
};

tabBtns.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
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

window.addEventListener("hashchange", () => applyHashTab());

applyHashTab();
