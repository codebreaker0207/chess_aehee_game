// reset.html로 잠깐 이동 후 다시 돌아오기
if (!sessionStorage.getItem('resetDone') && !sessionStorage.getItem('fromPicked')) {
    sessionStorage.setItem('resetDone', 'true');
    window.location.href = 'reset.html?return=random_choose.html';
}