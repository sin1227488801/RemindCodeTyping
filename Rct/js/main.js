function loadPage(page, event) {
    // タブをリセットする
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // クリックされたタブにactiveクラスを追加
    if (event.target.classList.contains('tab')) {
        event.target.classList.add('active');
    }

    // ページ内容を読み込む
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('content-area').innerHTML = data;
        })
        .catch(error => console.error('Error:', error));
}

// ページがロードされたときに初期コンテンツを読み込む
window.onload = function () {
    loadPage('typing.html', { target: document.querySelector('.tab.active') });
};