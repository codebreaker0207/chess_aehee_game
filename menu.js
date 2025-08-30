// 탭 버튼 클릭 시 콘텐츠 전환
const tabBtns = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    // 모든 콘텐츠 숨기기
    contents.forEach(c => c.classList.remove("active"));
    // 해당 콘텐츠 보이기
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});
