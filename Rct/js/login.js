function togglePassword() {
    const passwordField = document.getElementById('password');
    const passwordToggle = document.getElementById('show-password');
    if (passwordToggle.checked) {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
}

// ゲストプレイ処理
async function handleGuestPlay() {
    try {
        showLoading('ゲストログイン中...');
        const response = await rctApi.guestLogin();
        console.log('ゲストログイン成功:', response);
        window.location.href = 'main.html';
    } catch (error) {
        console.error('ゲストログインエラー:', error);
        showError('ゲストログインに失敗しました。');
    } finally {
        hideLoading();
    }
}

// ログイン処理
async function handleLogin(event) {
    event.preventDefault();

    const loginId = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!loginId || !password) {
        showError('IDとパスワードを入力してください。');
        return;
    }

    try {
        showLoading('ログイン中...');
        const response = await rctApi.login(loginId, password);
        console.log('ログイン成功:', response);
        window.location.href = 'main.html';
    } catch (error) {
        console.error('ログインエラー:', error);
        showError('ログインに失敗しました。IDとパスワードを確認してください。');
    } finally {
        hideLoading();
    }
}

// 新規登録処理
async function handleRegister() {
    const loginId = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!loginId || !password) {
        showError('IDとパスワードを入力してください。');
        return;
    }

    // パスワード強度チェック
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        showError('パスワードは英大文字・小文字・数字・記号を含む8文字以上で入力してください。');
        return;
    }

    try {
        showLoading('新規登録中...');
        const response = await rctApi.register(loginId, password);
        console.log('新規登録成功:', response);
        
        // 新規登録後は自動ログインせず、アカウント作成完了ページに遷移
        rctApi.logout(); // 念のため既存のセッションをクリア
        
        // アカウント情報をURLパラメータで渡す
        const params = new URLSearchParams({
            loginId: loginId,
            password: password
        });
        window.location.href = `account-created.html?${params.toString()}`;
    } catch (error) {
        console.error('新規登録エラー:', error);
        showError('新規登録に失敗しました。IDが既に使用されている可能性があります。');
    } finally {
        hideLoading();
    }
}

// UI ヘルパー関数
function showLoading(message) {
    // 既存のエラーメッセージを削除
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // ローディング表示
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.textContent = message;
    loadingDiv.style.cssText = 'color: #007bff; text-align: center; margin: 10px 0;';

    const form = document.querySelector('form');
    form.appendChild(loadingDiv);

    // ボタンを無効化
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
}

function hideLoading() {
    const loadingDiv = document.querySelector('.loading-message');
    if (loadingDiv) {
        loadingDiv.remove();
    }

    // ボタンを有効化
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
}

function showError(message) {
    // 既存のエラーメッセージを削除
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // エラーメッセージ表示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #dc3545; text-align: center; margin: 10px 0; padding: 10px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;';

    const form = document.querySelector('form');
    form.appendChild(errorDiv);
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function () {
    // 既にログインしている場合はメインページにリダイレクト
    if (rctApi.isLoggedIn()) {
        window.location.href = 'main.html';
        return;
    }

    // フォーム送信イベントを上書き
    const form = document.querySelector('form');
    form.addEventListener('submit', handleLogin);

    // ボタンイベントの設定
    const buttons = document.querySelectorAll('.btn-muted');
    buttons[0].addEventListener('click', function (e) {
        e.preventDefault();
        handleGuestPlay();
    });
    buttons[1].addEventListener('click', function (e) {
        e.preventDefault();
        handleRegister();
    });
});