// 탭 버튼 클릭 시 콘텐츠 전환
const tabBtns = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

  const activateTab = (tabId) => {
  contents.forEach((section) => {
    section.classList.toggle("active", section.id === tabId);
  });

  tabBtns.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  const targetSection = document.getElementById(tabId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

tabBtns.forEach((btn) => {
  btn.setAttribute("type", "button");
  btn.addEventListener("click", () => {
   activateTab(btn.dataset.tab);
  });
});

const initiallyActive = document.querySelector(".tab-content.active");
if (initiallyActive) {
  activateTab(initiallyActive.id);
}
