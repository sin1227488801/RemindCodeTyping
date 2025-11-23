// ログイン機能
document.addEventListener('DOMContentLoaded', function () {
    // 既存の認証情報をチェックして、UUID形式でない場合はクリア
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            // UUID形式でない場合はクリア
            if (userData.id && !userData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.log('古い形式のユーザーIDを検出しました。認証情報をクリアします。');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('currentUser');
            }
        } catch (e) {
            console.error('ユーザー情報の解析に失敗しました:', e);
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
        }
    }

    // 既にログインしている場合はメインページにリダイレクト
    if (localStorage.getItem('isAuthenticated') === 'true') {
        window.location.href = 'main.html';
        return;
    }

    // パスワード表示切替
    window.togglePassword = function () {
        const passwordField = document.getElementById('password');
        const passwordToggle = document.getElementById('show-password');
        passwordField.type = passwordToggle.checked ? 'text' : 'password';
    };

    // メッセージ表示
    function showMessage(message, type = 'info') {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = message;

        const colors = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
            info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
        };

        const color = colors[type] || colors.info;
        messageDiv.style.cssText = `
            margin: 15px 0; padding: 10px; border-radius: 4px; text-align: center;
            background-color: ${color.bg}; border: 1px solid ${color.border}; color: ${color.text};
        `;

        const form = document.querySelector('form');
        form.appendChild(messageDiv);

        setTimeout(() => messageDiv.remove(), 3000);
    }

    // ログイン処理
    function handleLogin(event) {
        event.preventDefault();

        const loginId = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!loginId || !password) {
            showMessage('IDとパスワードを入力してください。', 'error');
            return;
        }

        // 認証処理
        let authenticatedUser = null;

        // デモ認証
        if (loginId === 'demo' && password === 'password') {
            authenticatedUser = {
                id: '176c6aeb-297e-4033-8c96-abc8cd7c474a', // 実際に存在するユーザーUUID (Alice Johnson)
                name: 'デモユーザー (Alice Johnson)',
                email: 'demo@example.com',
                loginId: loginId
            };
        } else {
            // 新規登録ユーザーの認証
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const user = registeredUsers.find(u => u.loginId === loginId && u.password === password);

            if (user) {
                authenticatedUser = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    loginId: user.loginId
                };
                console.log('新規登録ユーザーでログイン:', authenticatedUser);
            }
        }

        if (authenticatedUser) {
            window.rctApi.setUser(authenticatedUser);
            showMessage('ログイン成功！', 'success');

            // 画面遷移の効果音を再生
            if (window.SoundEffects) {
                window.SoundEffects.playConfirm();
            }

            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
        } else {
            showMessage('IDまたはパスワードが正しくありません。', 'error');
        }
    }

    // ゲストプレイ
    function handleGuestPlay() {
        const userData = {
            id: 'e5de0d5a-e347-487f-9276-165f4641ace9', // 実際に存在するユーザーUUID (Bob Smith)
            name: 'ゲストユーザー (Bob Smith)',
            email: 'guest@example.com',
            loginId: 'guest'
        };

        window.rctApi.setUser(userData);
        showMessage('ゲストとしてログインします...', 'success');

        // 画面遷移の効果音を再生
        if (window.SoundEffects) {
            window.SoundEffects.playConfirm();
        }

        setTimeout(() => {
            window.location.href = 'main.html';
        }, 1000);
    }

    // 新規登録
    async function handleRegister() {
        const loginId = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!loginId || !password) {
            showMessage('IDとパスワードを入力してください。', 'error');
            return;
        }

        // 入力内容の検証
        if (loginId.length < 3) {
            showMessage('ログインIDは3文字以上で入力してください。', 'error');
            return;
        }

        if (password.length < 4) {
            showMessage('パスワードは4文字以上で入力してください。', 'error');
            return;
        }

        console.log('新規登録処理開始:', loginId);

        // 既存ユーザーのチェック
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        if (existingUsers.find(user => user.loginId === loginId)) {
            showMessage('このログインIDは既に使用されています。', 'error');
            return;
        }

        // 確認ダイアログを表示
        if (!confirm(`以下の内容で新規登録しますか？\n\nログインID: ${loginId}\nパスワード: ${'*'.repeat(password.length)}`)) {
            return;
        }

        showMessage('新規登録処理中...', 'info');

        try {
            // バックエンドAPIでユーザーを作成
            const response = await fetch('https://remindcodetyping.onrender.com/api/v1/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: loginId,
                    email: loginId.includes('@') ? loginId : `${loginId}@example.com`
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('バックエンドユーザー作成エラー:', errorData);
                showMessage('アカウント作成に失敗しました。別のユーザーIDをお試しください。', 'error');
                return;
            }

            const backendUserData = await response.json();
            console.log('バックエンドでユーザー作成完了:', backendUserData);

            // 新規ユーザー情報を作成（バックエンドから返されたIDを使用）
            const newUser = {
                id: backendUserData.id,
                loginId: loginId,
                password: password, // 実際のアプリでは暗号化が必要
                email: loginId.includes('@') ? loginId : `${loginId}@example.com`,
                name: loginId,
                registeredAt: new Date().toISOString()
            };

            // ローカルストレージに永続保存（ログイン用）
            existingUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

            // 新規登録情報を一時的に保存（account-created.htmlで使用）
            sessionStorage.setItem('newUserData', JSON.stringify(newUser));

            console.log('新規ユーザーを登録しました:', newUser);
            showMessage('アカウント作成が完了しました！', 'success');

            // アカウント作成完了画面に遷移
            setTimeout(() => {
                window.location.href = 'account-created.html';
            }, 1000);

        } catch (error) {
            console.error('ユーザー作成中にエラーが発生:', error);
            console.log('バックエンドが利用できないため、ローカル登録にフォールバック');

            // バックエンドが利用できない場合のフォールバック処理
            // UUID生成関数
            function generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0;
                    const v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            // ローカルのみでユーザー情報を作成
            const newUser = {
                id: generateUUID(),
                loginId: loginId,
                password: password,
                email: loginId.includes('@') ? loginId : `${loginId}@example.com`,
                name: loginId,
                registeredAt: new Date().toISOString(),
                isLocalOnly: true // ローカルのみのユーザーであることを示すフラグ
            };

            // ローカルストレージに永続保存
            existingUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

            // 新規登録情報を一時的に保存
            sessionStorage.setItem('newUserData', JSON.stringify(newUser));

            console.log('ローカルユーザーを登録しました:', newUser);
            showMessage('アカウント作成が完了しました（ローカル保存）！', 'success');

            // アカウント作成完了画面に遷移
            setTimeout(() => {
                window.location.href = 'account-created.html';
            }, 1000);
        }
    }

    // イベントリスナー設定
    document.querySelector('form').addEventListener('submit', handleLogin);

    // ボタンをIDで正確に取得
    const guestPlayButton = document.getElementById('guest-play-button');
    const registerButton = document.getElementById('register-button');

    if (guestPlayButton) {
        guestPlayButton.addEventListener('click', handleGuestPlay);
        console.log('ゲストプレイボタンのイベントリスナーを設定しました');
    }

    if (registerButton) {
        registerButton.addEventListener('click', handleRegister);
        console.log('新規登録ボタンのイベントリスナーを設定しました');
    }

    // デフォルト値設定
    document.getElementById('username').value = 'demo';
    document.getElementById('password').value = 'password';
});