// 데이터 초기화
    localStorage.removeItem('pickedNames');

    // 돌아갈 주소 확인
    const params = new URLSearchParams(window.location.search);
    const returnPage = params.get('return') || 'random_choose.html';

    // 1초 후 자동 복귀
    setTimeout(() => {
      window.location.href = returnPage;
    }, 1000);