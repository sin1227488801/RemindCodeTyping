// API接続用の共通ユーティリティ
class RctApi {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api';
        this.userId = sessionStorage.getItem('userId');
    }

    // 共通のHTTPリクエスト処理
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // ユーザーIDが必要なAPIの場合、ヘッダーに追加
        if (this.userId && !config.headers['X-User-Id']) {
            config.headers['X-User-Id'] = this.userId;
        }

        console.log(`API Request: ${url}`, config);

        try {
            const response = await fetch(url, config);
            
            console.log(`API Response: ${response.status}`, response);
            
            if (!response.ok) {
                const error = await this.handleErrorResponse(response, endpoint);
                throw error;
            }
            
            return await this.handleSuccessResponse(response);
            
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            
            // ネットワークエラーの場合の詳細情報を設定
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                error.message = 'ネットワークエラー: サーバーに接続できません。バックエンドが起動しているか確認してください。';
                error.isNetworkError = true;
            }
            
            // ユーザーにエラーを表示
            this.showUserFriendlyError(error, endpoint);
            
            throw error;
        }
    }

    // 成功レスポンスの統一処理
    async handleSuccessResponse(response) {
        // レスポンスがJSONの場合のみパース
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(`API Response Data:`, data);
            return data;
        }
        
        // JSONでない場合はレスポンスオブジェクトをそのまま返す
        return response;
    }

    // エラーレスポンスの統一処理
    async handleErrorResponse(response, endpoint) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = null;
        
        try {
            // レスポンスボディからエラー詳細を取得
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorDetails = await response.json();
                if (errorDetails.message) {
                    errorMessage = errorDetails.message;
                } else if (errorDetails.error) {
                    errorMessage = errorDetails.error;
                }
            } else {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            }
        } catch (e) {
            console.warn('Could not read error response body:', e);
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.details = errorDetails;
        error.endpoint = endpoint;
        
        return error;
    }

    // ユーザーフレンドリーなエラー表示
    showUserFriendlyError(error, endpoint) {
        // エラー表示用の要素があれば使用
        const errorContainer = document.getElementById('error-message');
        let userMessage = this.getErrorMessage(error, endpoint);
        
        // DOM要素がある場合は表示
        if (errorContainer) {
            errorContainer.textContent = userMessage;
            errorContainer.style.display = 'block';
            errorContainer.className = 'error-message';
            
            // 5秒後に自動で非表示
            setTimeout(() => {
                if (errorContainer) {
                    errorContainer.style.display = 'none';
                }
            }, 5000);
        } else {
            // DOM要素がない場合は動的に作成して表示
            this.createAndShowErrorMessage(userMessage);
        }
    }

    // エラーメッセージの統一処理
    getErrorMessage(error, endpoint) {
        // エンドポイント別の詳細なエラーメッセージ
        const endpointMessages = {
            '/auth/login': {
                401: 'ログインIDまたはパスワードが正しくありません。',
                403: 'アカウントがロックされています。管理者にお問い合わせください。',
                429: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。'
            },
            '/auth/register': {
                400: '入力内容に不備があります。IDとパスワードを確認してください。',
                409: 'このIDは既に使用されています。別のIDを選択してください。',
                422: 'パスワードが要件を満たしていません。'
            },
            '/studybooks': {
                400: '学習帳の内容に不備があります。入力内容を確認してください。',
                413: 'データサイズが大きすぎます。内容を短くしてください。'
            },
            '/typing/logs': {
                400: 'タイピング結果の保存に失敗しました。データを確認してください。'
            }
        };

        // エンドポイントに基づく詳細メッセージを取得
        for (const [path, messages] of Object.entries(endpointMessages)) {
            if (endpoint.includes(path) && messages[error.status]) {
                return messages[error.status];
            }
        }

        // 一般的なHTTPステータスコード別メッセージ
        if (error.status === 400) {
            return 'リクエストの内容に問題があります。入力内容を確認してください。';
        } else if (error.status === 401) {
            return '認証が必要です。ログインしてください。';
        } else if (error.status === 403) {
            return 'この操作を実行する権限がありません。';
        } else if (error.status === 404) {
            return 'リクエストされたリソースが見つかりません。';
        } else if (error.status === 409) {
            return 'データの競合が発生しました。ページを更新して再試行してください。';
        } else if (error.status === 413) {
            return 'データサイズが大きすぎます。';
        } else if (error.status === 422) {
            return '入力データの形式が正しくありません。';
        } else if (error.status === 429) {
            return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        } else if (error.status >= 500 && error.status < 600) {
            return 'サーバーで問題が発生しました。しばらく待ってから再試行してください。';
        } else if (error.message && error.message.includes('ネットワークエラー')) {
            return 'ネットワークに接続できません。インターネット接続を確認してください。';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return 'サーバーに接続できません。バックエンドサービスが起動しているか確認してください。';
        } else {
            return 'エラーが発生しました。しばらく待ってから再試行してください。';
        }
    }

    // エラーメッセージを動的に作成して表示
    createAndShowErrorMessage(message) {
        // 既存のエラーメッセージを削除
        const existingError = document.querySelector('.rct-error-message');
        if (existingError) {
            existingError.remove();
        }

        // エラーメッセージ要素を作成
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rct-error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px 16px;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        // ページに追加
        document.body.appendChild(errorDiv);

        // 5秒後に自動で削除
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);

        // クリックで手動削除
        errorDiv.addEventListener('click', () => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        });
    }

    // 成功メッセージの表示（オプション）
    showSuccessMessage(message) {
        // 既存の成功メッセージを削除
        const existingSuccess = document.querySelector('.rct-success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // 成功メッセージ要素を作成
        const successDiv = document.createElement('div');
        successDiv.className = 'rct-success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 12px 16px;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        // ページに追加
        document.body.appendChild(successDiv);

        // 3秒後に自動で削除
        setTimeout(() => {
            if (successDiv && successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);

        // クリックで手動削除
        successDiv.addEventListener('click', () => {
            if (successDiv && successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        });
    }

    // APIリクエストのリトライ機能
    async requestWithRetry(endpoint, options = {}, maxRetries = 2) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`API Retry attempt ${attempt} for ${endpoint}`);
                    // リトライ前に少し待機
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
                
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;
                
                // リトライしない条件
                if (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404) {
                    break;
                }
                
                // 最後の試行でない場合は続行
                if (attempt < maxRetries) {
                    console.log(`API request failed, retrying... (${attempt + 1}/${maxRetries})`);
                    continue;
                }
            }
        }
        
        throw lastError;
    }

    // 認証関連API
    async demoLogin() {
        const response = await this.request('/auth/demo', { method: 'POST' });
        this.setUser(response);
        return response;
    }

    async guestLogin() {
        const response = await this.request('/auth/demo', { method: 'POST' });
        this.setUser(response);
        return response;
    }

    async login(loginId, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ loginId, password })
        });
        this.setUser(response);
        return response;
    }

    async register(loginId, password) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ loginId, password })
        });
        this.setUser(response);
        return response;
    }

    // 学習帳関連API
    async getStudyBooks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/studybooks${queryString ? '?' + queryString : ''}`;
        return await this.requestWithRetry(endpoint);
    }

    async getRandomStudyBooks(language = null, limit = 10) {
        const params = { limit };
        if (language) params.language = language;
        const queryString = new URLSearchParams(params).toString();
        return await this.requestWithRetry(`/studybooks/random?${queryString}`);
    }

    async createStudyBook(language, question, explanation) {
        return await this.request('/studybooks', {
            method: 'POST',
            body: JSON.stringify({ language, question, explanation })
        });
    }

    async updateStudyBook(id, language, question, explanation) {
        return await this.request(`/studybooks/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ language, question, explanation })
        });
    }

    async deleteStudyBook(id) {
        return await this.request(`/studybooks/${id}`, { method: 'DELETE' });
    }

    // 言語一覧取得API
    async getAllLanguages() {
        return await this.requestWithRetry('/studybooks/languages');
    }

    async getSystemProblemLanguages() {
        return await this.requestWithRetry('/studybooks/system-problems/languages');
    }

    async getUserProblemLanguages() {
        return await this.requestWithRetry('/studybooks/user-problems/languages');
    }

    // 問題取得API
    async getSystemProblemsByLanguage(language) {
        return await this.requestWithRetry(`/studybooks/system-problems/${language}`);
    }

    async getUserProblemsByLanguage(language) {
        return await this.requestWithRetry(`/studybooks/user-problems/${language}`);
    }

    // タイピング関連API
    async saveTypingLog(studyBookId, startedAt, durationMs, totalChars, correctChars) {
        return await this.request('/typing/logs', {
            method: 'POST',
            body: JSON.stringify({
                studyBookId,
                startedAt,
                durationMs,
                totalChars,
                correctChars
            })
        });
    }

    async getStats() {
        return await this.requestWithRetry('/typing/stats');
    }

    // ユーザー情報管理
    setUser(userData) {
        this.userId = userData.userId;
        sessionStorage.setItem('userId', userData.userId);
        sessionStorage.setItem('loginId', userData.loginId);
        sessionStorage.setItem('isGuest', userData.guest || false);
        sessionStorage.setItem('token', userData.token);
    }

    getUser() {
        return {
            userId: sessionStorage.getItem('userId'),
            loginId: sessionStorage.getItem('loginId'),
            isGuest: sessionStorage.getItem('isGuest') === 'true',
            token: sessionStorage.getItem('token')
        };
    }

    logout() {
        console.log('API logout処理開始');
        try {
            // セッションストレージをクリア
            sessionStorage.clear();
            console.log('セッションストレージクリア完了');
            
            // ユーザーIDをクリア
            this.userId = null;
            console.log('ユーザーIDクリア完了');
            
            // ログインページにリダイレクト
            console.log('ログインページにリダイレクト中...');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('ログアウト処理でエラー:', error);
            // エラーが発生してもリダイレクトを実行
            window.location.href = 'login.html';
        }
    }

    isLoggedIn() {
        return !!sessionStorage.getItem('userId');
    }
}

// グローバルAPIインスタンス
window.rctApi = new RctApi();