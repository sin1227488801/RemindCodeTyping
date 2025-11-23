// タイピング練習画面の機能
console.log('typing-practice.js が読み込まれました');

class TypingPractice {
    constructor() {
        console.log('TypingPractice コンストラクタが呼ばれました');
        this.config = null;
        this.problems = [];
        this.currentProblemIndex = 0;
        this.startTime = null;
        this.timeLimit = 0;
        this.timer = null;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        this.isActive = false;
        this.currentProblemCompleted = false; // 現在の問題の完了状態

        this.init();
    }

    async init() {
        const maxRetries = 2; // 最大2回試行
        let currentAttempt = 1;

        while (currentAttempt <= maxRetries) {
            try {
                console.log(`初期化試行 ${currentAttempt}/${maxRetries}`);
                this.updateProgress(5, 'NOW LOADING...', `初期化中... (${currentAttempt}/${maxRetries}回目)`);

                // バックエンドの準備完了を待つ
                await this.waitForBackend();

                // まず設定を読み込む
                this.updateProgress(55, '設定読み込み中...', '保存された設定を確認しています');
                try {
                    this.loadConfig();
                } catch (error) {
                    console.error('設定読み込みエラー:', error);
                    // loadConfig内で既にリダイレクト処理が実行されているので、ここでは処理を終了
                    return;
                }

                // 設定が正常に読み込まれなかった場合は終了
                if (!this.config) {
                    console.error('設定の読み込みに失敗したため、初期化を中断します');
                    return;
                }

                // ログイン状態をチェック
                this.updateProgress(60, 'ログイン確認中...', 'ユーザー認証を確認しています', 'login');
                if (!window.rctApi || !window.rctApi.isLoggedIn()) {
                    console.log('ログインしていません。デモログインを実行します...');
                    try {
                        if (window.rctApi) {
                            this.updateProgress(65, 'ログイン中...', 'デモユーザーでログインしています', 'login');
                            await window.rctApi.demoLogin();
                            console.log('デモログイン成功');
                            this.completeStep('login');
                        } else {
                            throw new Error('rctApiが利用できません');
                        }
                    } catch (error) {
                        console.error('デモログイン失敗:', error);
                        this.updateStepStatus('login', 'error');
                        throw error; // リトライ対象のエラーとして再スロー
                    }
                } else {
                    this.completeStep('login');
                }

                this.updateProgress(70, '問題読み込み中...', '設定に基づいて問題を取得しています', 'problems');
                await this.loadProblems();
                this.completeStep('problems');

                this.updateProgress(95, '最終準備中...', 'タイピング練習の準備をしています');
                this.setupEventListeners();

                this.updateProgress(100, '準備完了', 'タイピング練習を開始します');

                // 成功した場合、少し待ってから開始
                setTimeout(() => {
                    this.startPractice();
                }, 800);

                return; // 成功したので終了

            } catch (error) {
                console.error(`初期化試行 ${currentAttempt} でエラー:`, error);

                if (currentAttempt < maxRetries) {
                    console.log('バックエンドの起動を待ってリトライします...');
                    this.updateProgress(30, 'リトライ準備中...', `バックエンドの起動を待機しています... (${currentAttempt + 1}/${maxRetries}回目)`);

                    // 少し待ってからリトライ（短縮）
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    currentAttempt++;
                } else {
                    // 最大試行回数に達した場合
                    console.error('全ての試行が失敗しました。設定画面に戻ります。');
                    this.updateProgress(100, 'エラー', '初期化に失敗しました。設定画面に戻ります。');

                    setTimeout(() => {
                        alert('システムの準備に時間がかかっています。メイン画面に戻ります。');
                        window.location.href = 'main.html';
                    }, 2000);
                    return;
                }
            }
        }
    }

    updateProgress(percentage, message, detail, step = null) {
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = document.getElementById('progress-percentage');
        const messageEl = document.getElementById('loading-message');
        const detailEl = document.getElementById('loading-detail');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
        if (messageEl) {
            messageEl.textContent = message;
        }
        if (detailEl) {
            detailEl.textContent = detail;
        }

        // ステップ表示を更新
        if (step) {
            this.updateStepStatus(step, 'active');
        }

        console.log(`進捗更新: ${percentage}% - ${message} - ${detail}`);
    }

    updateStepStatus(stepId, status) {
        const stepEl = document.getElementById(`step-${stepId}`);
        if (stepEl) {
            const icons = {
                'pending': '⏳',
                'active': '🔄',
                'completed': '✅',
                'error': '❌'
            };

            const colors = {
                'pending': '#95a5a6',
                'active': '#3498db',
                'completed': '#27ae60',
                'error': '#e74c3c'
            };

            const text = stepEl.textContent.substring(2); // アイコンを除去
            stepEl.textContent = `${icons[status]} ${text}`;
            stepEl.style.color = colors[status];

            if (status === 'active') {
                stepEl.style.fontWeight = 'bold';
            }
        }
    }

    completeStep(stepId) {
        this.updateStepStatus(stepId, 'completed');
    }

    updateLoadingMessage(message, detail) {
        // 後方互換性のため残す
        this.updateProgress(0, message, detail);
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('ローディング表示を非表示にしました');
        }
    }

    loadConfig() {
        console.log('設定読み込み開始...');
        const configStr = sessionStorage.getItem('typingSettings');
        console.log('セッションストレージから取得した設定文字列:', configStr);

        if (!configStr) {
            console.warn('設定が見つかりません。メイン画面に戻ります。');
            alert('設定が見つかりません。メイン画面に戻ります。');
            window.location.href = 'main.html';
            throw new Error('設定が見つかりません');
        }

        try {
            this.config = JSON.parse(configStr);
            console.log('読み込んだ設定:', this.config);

            // 設定の妥当性チェック
            if (!this.config || typeof this.config !== 'object') {
                throw new Error('設定が無効です');
            }

            // 必要最小限のデフォルト値のみ設定（既存の値は上書きしない）
            if (!this.config.languages || !Array.isArray(this.config.languages) || this.config.languages.length === 0) {
                this.config.languages = ['HTML'];
            }
            if (!this.config.problemSource) {
                this.config.problemSource = 'system';
            }
            if (!this.config.rule) {
                this.config.rule = 'normal';
            }
            if (!this.config.timeLimit || this.config.timeLimit <= 0) {
                this.config.timeLimit = 10;
            }
            if (!this.config.problemCount || this.config.problemCount <= 0) {
                this.config.problemCount = 10;
            }

            console.log('デフォルト値適用後の設定:', this.config);

        } catch (error) {
            console.error('設定の解析に失敗しました:', error);
            sessionStorage.clear();
            alert('設定の読み込みに失敗しました。メイン画面に戻ります。');
            window.location.href = 'main.html';
            throw new Error('設定の解析に失敗しました');
        }

        this.timeLimit = this.config.timeLimit * 60; // 分を秒に変換
        console.log('設定読み込み完了:', this.config);
    }

    async loadProblems() {
        try {
            console.log('問題読み込み開始');
            console.log('設定:', this.config);
            console.log('API利用可能:', !!window.rctApi);
            console.log('ユーザーログイン状態:', window.rctApi ? window.rctApi.isLoggedIn() : 'API未定義');

            const problems = [];
            const totalLanguages = this.config.languages.length;
            let processedLanguages = 0;

            for (const language of this.config.languages) {
                console.log(`言語 ${language} の問題を取得中...`);
                const progress = 70 + (processedLanguages / totalLanguages) * 20;
                this.updateProgress(progress, '問題を読み込み中...', `${language}の問題を取得しています (${processedLanguages + 1}/${totalLanguages})`);

                if (this.config.problemSource === 'system') {
                    const systemProblems = await this.fetchSystemProblems(language);
                    console.log(`システム問題取得結果 (${language}):`, systemProblems.length, '件');
                    problems.push(...systemProblems);
                } else if (this.config.problemSource === 'user') {
                    const userProblems = await this.fetchUserProblems(language);
                    console.log(`ユーザー問題取得結果 (${language}):`, userProblems.length, '件');
                    problems.push(...userProblems);
                } else if (this.config.problemSource === 'mixed') {
                    const systemProblems = await this.fetchSystemProblems(language);
                    const userProblems = await this.fetchUserProblems(language);
                    console.log(`ミックス問題取得結果 (${language}): システム${systemProblems.length}件, ユーザー${userProblems.length}件`);
                    problems.push(...systemProblems, ...userProblems);
                }

                processedLanguages++;
            }

            console.log('取得した問題の総数:', problems.length);

            if (problems.length === 0) {
                console.error('問題が見つかりませんでした');
                console.error('設定詳細:', this.config);
                console.error('選択された言語:', this.config.languages);
                console.error('問題ソース:', this.config.problemSource);
                console.error('ログイン状態:', window.rctApi ? window.rctApi.isLoggedIn() : 'API未定義');
                console.error('ユーザー情報:', window.rctApi ? window.rctApi.getUser() : 'API未定義');

                // 各言語で個別に問題取得を試行
                for (const language of this.config.languages) {
                    try {
                        console.log(`デバッグ: ${language}の問題を個別取得中...`);
                        const testProblems = await window.rctApi.getSystemProblemsByLanguage(language);
                        console.log(`デバッグ: ${language}の問題数:`, testProblems ? testProblems.length : 'null');
                    } catch (error) {
                        console.error(`デバッグ: ${language}の問題取得エラー:`, error);
                    }
                }

                // セッションストレージをクリアしてから戻る
                sessionStorage.removeItem('typingSettings');

                alert(`問題が見つかりません。\n言語: ${this.config.languages.join(', ')}\n問題ソース: ${this.config.problemSource}\n\nコンソールログを確認してください。\nメイン画面に戻ります。`);
                window.location.href = 'main.html';
                return;
            }

            // ルールに応じて問題をソート
            let sortedProblems = this.sortProblemsByRule(problems);

            // 問題数制限を適用
            const problemCount = this.config.problemCount || 10;
            if (problemCount > 0 && sortedProblems.length > problemCount) {
                sortedProblems = sortedProblems.slice(0, problemCount);
                console.log(`問題数を${problemCount}問に制限しました`);
            }

            this.problems = sortedProblems;
            console.log('最終的な問題数:', this.problems.length);
            this.updateLoadingMessage('準備完了', `${this.problems.length}問の問題を読み込みました`);

            // 問題数を表示に反映
            document.getElementById('total-problems').textContent = this.problems.length;

        } catch (error) {
            console.error('問題の読み込みに失敗しました:', error);

            // リトライ可能なエラーとして再スロー
            throw new Error(`問題の読み込みに失敗: ${error.message}`);
        }
    }

    async fetchSystemProblems(language) {
        const maxRetries = 5;
        const baseDelay = 1000; // 基本遅延時間

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`システム問題を取得中 (試行 ${attempt}/${maxRetries}): ${language}`);

                // rctApiが読み込まれるまで待機
                if (!window.rctApi) {
                    console.log('rctApiが未定義です。少し待ってから再試行します。');
                    await new Promise(resolve => setTimeout(resolve, baseDelay));
                    continue;
                }

                const problems = await window.rctApi.getSystemProblemsByLanguage(language);
                console.log(`システム問題取得成功 (${language}):`, problems);

                // 成功した場合は結果を返す
                if (problems && Array.isArray(problems)) {
                    // 問題数が少ない場合はデフォルト問題で補完
                    if (problems.length < 10 && window.rctApi && typeof window.rctApi.getDefaultProblems === 'function') {
                        const defaultProblems = window.rctApi.getDefaultProblems(language);
                        console.log(`問題数が少ないため、デフォルト問題で補完 (${language}): ${problems.length} + ${defaultProblems.length}`);
                        return [...problems, ...defaultProblems];
                    }
                    return problems;
                }

                console.log(`試行 ${attempt}: 問題データが無効でした`);

            } catch (error) {
                console.error(`システム問題取得エラー (試行 ${attempt}, ${language}):`, error);
                console.error('エラー詳細:', {
                    message: error.message,
                    status: error.status,
                    statusText: error.statusText
                });

                // 特定のエラーの場合は即座に諦める
                if (error.message && (error.message.includes('404') || error.message.includes('401'))) {
                    console.log('認証エラーまたは404エラーのため、リトライを中止します');
                    break;
                }
            }

            // 最後の試行でない場合は指数バックオフで待機
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1); // 指数バックオフ
                console.log(`${delay}ms後にリトライします...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        console.log(`全ての試行が失敗しました (${language})。デフォルト問題を使用します。`);
        
        // バックエンドから取得できない場合はデフォルト問題を使用
        if (window.rctApi && typeof window.rctApi.getDefaultProblems === 'function') {
            const defaultProblems = window.rctApi.getDefaultProblems(language);
            console.log(`デフォルト問題を使用 (${language}):`, defaultProblems.length, '問');
            return defaultProblems;
        }
        
        return [];
    }

    async fetchUserProblems(language) {
        try {
            // rctApiが読み込まれるまで待機
            if (!window.rctApi) {
                console.error('rctApiが未定義です');
                return [];
            }

            console.log(`ユーザー問題を取得中: ${language}`);

            const problems = await window.rctApi.getUserProblemsByLanguage(language);
            console.log(`ユーザー問題取得成功 (${language}):`, problems);
            return problems || [];
        } catch (error) {
            console.error(`ユーザー問題取得エラー (${language}):`, error);
            console.error('エラー詳細:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText
            });
            return [];
        }
    }

    sortProblemsByRule(problems) {
        switch (this.config.rule) {
            case 'option1': // ランダム出題
                return this.shuffleArray([...problems]);
            case 'option2': // 苦手優先
                // TODO: 正答率データを使用して実装
                return this.shuffleArray([...problems]);
            case 'option3': // 得意優先
                // TODO: 正答率データを使用して実装
                return this.shuffleArray([...problems]);
            case 'option4': // 登録順(新しい順)
                return problems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'option5': // 登録順(古い順)
                return problems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            default:
                return this.shuffleArray([...problems]);
        }
    }

    async waitForBackend() {
        const maxWait = 10000; // 最大10秒待機（短縮）
        const checkInterval = 500; // 0.5秒間隔でチェック（高速化）
        const startTime = Date.now();

        console.log('バックエンドの準備完了を待機中...');
        this.updateProgress(5, 'システム準備中...', 'APIライブラリの読み込みを待機しています', 'api');

        // rctApiは既に利用可能なはず（DOMContentLoadedで確認済み）
        if (!window.rctApi) {
            console.error('rctAPIが利用できません');
            this.updateStepStatus('api', 'error');
            this.updateProgress(20, 'エラー', 'APIライブラリが利用できません');
            throw new Error('APIライブラリが利用できません');
        }

        this.completeStep('api');
        console.log('rctAPIが読み込まれました。バックエンドの接続を確認中...');
        this.updateProgress(25, 'システム準備中...', 'バックエンドサーバーとの接続を確認しています', 'backend');

        // バックエンドの接続確認
        let attemptCount = 0;
        const backendStartTime = Date.now();
        while (Date.now() - startTime < maxWait) {
            attemptCount++;
            try {
                // ヘルスチェック的なAPI呼び出し
                const response = await fetch('http://localhost:8000/api/v1/studybooks/languages', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log('バックエンドの準備が完了しました');
                    this.completeStep('backend');
                    this.updateProgress(50, '接続完了', 'バックエンドサーバーとの接続が確立されました');
                    return;
                }

                console.log(`バックエンド応答: ${response.status} ${response.statusText}`);
                const elapsed = Date.now() - backendStartTime;
                const progress = Math.min(45, 25 + (elapsed / (maxWait * 0.6)) * 20);
                this.updateProgress(progress, 'システム準備中...', `接続試行中... (${attemptCount}回目)`, 'backend');

            } catch (error) {
                console.log('バックエンド接続確認中:', error.message);
                const elapsed = Date.now() - backendStartTime;
                const progress = Math.min(45, 25 + (elapsed / (maxWait * 0.6)) * 20);
                this.updateProgress(progress, 'システム準備中...', `接続試行中... (${attemptCount}回目)`, 'backend');
            }

            // 少し待ってから再試行
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        console.log('バックエンドの準備完了を待機中にタイムアウトしました');
        this.updateStepStatus('backend', 'error');
        this.updateProgress(45, 'タイムアウト', 'バックエンドサーバーとの接続がタイムアウトしました');
        throw new Error('バックエンドサーバーとの接続がタイムアウトしました');
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        const typingInput = document.getElementById('typing-input');
        const skipButton = document.getElementById('skip-button');
        const hintButton = document.getElementById('hint-button');
        const pauseButton = document.getElementById('pause-button');
        const retryButton = document.getElementById('retry-button');
        const backButton = document.getElementById('back-button');

        // ボタンテキストを確実に設定
        if (skipButton) skipButton.textContent = '次へ';
        if (hintButton) hintButton.textContent = 'ヒント表示';
        if (pauseButton) pauseButton.textContent = '一時停止';

        // 表示オプションのチェックボックス設定
        const showProblemCheckbox = document.getElementById('show-problem');

        if (showProblemCheckbox) {
            showProblemCheckbox.addEventListener('change', () => this.toggleProblemDisplay());
        }

        typingInput.addEventListener('input', () => this.onTypingInput());
        typingInput.addEventListener('keydown', (e) => this.onKeyDown(e));
        skipButton.addEventListener('click', () => this.skipProblem());
        hintButton.addEventListener('click', () => this.showHint());
        pauseButton.addEventListener('click', () => this.togglePause());
        retryButton.addEventListener('click', () => this.retry());
        backButton.addEventListener('click', () => this.goBack());

        // ResizeObserverを設定
        this.setupResizeObserver();
    }

    startPractice() {
        // ローディング表示を非表示にする
        this.hideLoading();

        // 問題がない場合はエラー表示
        if (!this.problems || this.problems.length === 0) {
            console.error('問題が読み込まれていません');
            alert('問題の読み込みに失敗しました。設定画面に戻ります。');
            window.location.href = 'main.html';
            return;
        }

        this.isActive = true;
        this.startTime = Date.now();
        this.showCurrentProblem();
        this.startTimer();

        // 入力フィールドにフォーカス
        document.getElementById('typing-input').focus();
    }

    showCurrentProblem() {
        if (this.currentProblemIndex >= this.problems.length) {
            // 問題がない場合は結果表示ではなくエラー表示
            if (this.problems.length === 0) {
                console.error('問題が読み込まれていません');
                alert('問題の読み込みに失敗しました。設定画面に戻ります。');
                window.location.href = 'main.html';
                return;
            }
            this.endPractice();
            return;
        }

        // 次へボタンのテキストを更新
        this.updateSkipButtonText();

        const problem = this.problems[this.currentProblemIndex];

        document.getElementById('current-language').textContent = problem.language;
        document.getElementById('current-problem').textContent = this.currentProblemIndex + 1;
        
        // ヒント表示用のテキストを設定
        const hintText = this.generateHintText(problem);
        document.getElementById('problem-explanation').textContent = hintText;

        // 目標時間を全問題の合計値で計算して表示
        const totalChars = this.problems.reduce((sum, p) => sum + p.question.length, 0);
        const targetTimeSeconds = this.calculateTargetTime(totalChars);
        const targetTimeMinutes = Math.floor(targetTimeSeconds / 60);
        const targetTimeSecondsRemainder = Math.round(targetTimeSeconds % 60);

        document.getElementById('target-time').textContent =
            `${targetTimeMinutes}:${targetTimeSecondsRemainder.toString().padStart(2, '0')}`;

        // 凡例要素の存在確認（デバッグ用）
        const legendElement = document.querySelector('.legend');
        console.log('凡例要素の存在確認:', legendElement);
        if (legendElement) {
            console.log('凡例要素のスタイル:', window.getComputedStyle(legendElement));
        }

        // 入力フィールドをクリア
        const typingInput = document.getElementById('typing-input');
        typingInput.value = '';

        // 初期表示で特殊文字を視覚化
        this.updateTypingDisplay('', problem.question);

        // 入力フィールドにフォーカス
        typingInput.focus();

        // 入力エリアのサイズを調整（複数回実行して確実に高さを取得）
        setTimeout(() => {
            this.adjustInputAreaSize();
        }, 50);
        setTimeout(() => {
            this.adjustInputAreaSize();
        }, 200);
        setTimeout(() => {
            this.adjustInputAreaSize();
        }, 500);
    }

    onTypingInput() {
        if (!this.isActive) return;

        const input = document.getElementById('typing-input').value;
        const problem = this.problems[this.currentProblemIndex];

        // キーボード入力の効果音を再生
        console.log('onTypingInput called - attempting to play tap sound');
        if (window.SoundEffects) {
            console.log('SoundEffects available, calling playTap');
            window.SoundEffects.playTap();
        } else {
            console.warn('SoundEffects not available in onTypingInput');
        }

        // リアルタイムで入力位置と正答率を更新
        this.updateTypingDisplay(input, problem.question);

        // 完全一致チェック
        if (input === problem.question) {
            this.correctAnswer();
        }
    }

    updateTypingDisplay(userInput, correctText) {
        console.log('updateTypingDisplay called:', { userInput: userInput, correctTextLength: correctText.length });
        const problemTextDiv = document.getElementById('problem-text');
        let html = '';
        let correctChars = 0;
        let totalChars = Math.max(userInput.length, correctText.length);

        for (let i = 0; i < correctText.length; i++) {
            const correctChar = correctText[i];
            const userChar = i < userInput.length ? userInput[i] : '';

            let charClass = '';
            let displayChar = correctChar;

            if (i < userInput.length) {
                if (userChar === correctChar) {
                    charClass = 'correct';
                    correctChars++;
                } else {
                    charClass = 'incorrect';
                }
            } else if (i === userInput.length) {
                charClass = 'current';
            } else {
                charClass = 'pending';
            }

            // 特殊文字の視覚化
            if (correctChar === ' ') {
                displayChar = '<span class="space-char">&nbsp;</span>';
            } else if (correctChar === '\t') {
                displayChar = '<span class="tab-char">→</span>';
            } else if (correctChar === '\n') {
                displayChar = '<span class="newline-char">↵</span><br>';
            } else {
                displayChar = this.escapeHtml(correctChar);
            }

            html += `<span class="${charClass}">${displayChar}</span>`;
        }

        problemTextDiv.innerHTML = html;

        // 動的正答率計算
        if (userInput.length > 0) {
            const currentAccuracy = Math.round((correctChars / userInput.length) * 100);
            document.getElementById('accuracy').textContent = `${currentAccuracy}%`;
        }

        // 入力エリアのサイズを調整
        this.adjustInputAreaSize();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    onKeyDown(e) {
        if (!this.isActive) return;

        // 入力完了後のEnterキーで次の問題へ
        if (e.key === 'Enter') {
            const typingInput = document.getElementById('typing-input');
            const problem = this.problems[this.currentProblemIndex];

            // 入力が完了している場合（正解している場合）
            if (typingInput && typingInput.value === problem.question) {
                e.preventDefault();
                this.nextProblem();
                return;
            }
        }

        // Ctrl+Enter で強制的に次の問題へ（スキップ）
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            this.skipProblem();
        }
    }

    correctAnswer() {
        this.correctAnswers++;
        this.score += 10; // 正解時のスコア

        this.updateDisplay();

        // 入力完了メッセージを表示
        console.log('問題完了！Enterキーまたは「次へ」ボタンで次の問題に進んでください。');

        // 入力フィールドの背景色を変更（無効化はしない）
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.style.backgroundColor = '#d4edda'; // 薄い緑色で完了を示す
        }

        // 完了メッセージを表示
        const completionMessage = document.getElementById('completion-message');
        if (completionMessage) {
            completionMessage.style.display = 'block';
        }

        // 次へボタンを強調表示
        const skipButton = document.getElementById('skip-button');
        if (skipButton) {
            skipButton.style.backgroundColor = '#28a745';
            skipButton.style.color = 'white';
        }

        // 完了状態をマーク
        this.currentProblemCompleted = true;

        // 問題完了の効果音を再生
        console.log('Playing submission sound on completion');
        if (window.SoundEffects) {
            window.SoundEffects.playSubmission();
        }
    }

    skipProblem() {
        // totalAnswersのインクリメントは削除（correctAnswerでのみカウント）
        this.updateDisplay();
        this.nextProblem();
    }

    nextProblem() {
        this.currentProblemIndex++;

        // 完了状態をリセット
        this.currentProblemCompleted = false;

        // 入力フィールドを再有効化
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.disabled = false;
            typingInput.style.backgroundColor = '';
        }

        // 完了メッセージを非表示
        const completionMessage = document.getElementById('completion-message');
        if (completionMessage) {
            completionMessage.style.display = 'none';
        }

        // 次へボタンを元に戻す
        const skipButton = document.getElementById('skip-button');
        if (skipButton) {
            skipButton.style.backgroundColor = '';
            skipButton.style.color = '';
        }

        // ボタンテキストを更新
        this.updateSkipButtonText();

        if (this.currentProblemIndex >= this.problems.length) {
            this.endPractice();
        } else {
            this.showCurrentProblem();
        }
    }

    showHint() {
        const explanationDiv = document.getElementById('problem-explanation');
        const hintButton = document.getElementById('hint-button');
        const isCurrentlyHidden = explanationDiv.style.display === 'none';

        explanationDiv.style.display = isCurrentlyHidden ? 'block' : 'none';
        
        // ボタンテキストを更新
        if (hintButton) {
            hintButton.textContent = isCurrentlyHidden ? 'ヒント非表示' : 'ヒント表示';
        }

        // ヒント表示の切り替えではテキストエリアの高さは変更しない
        // 問題文ボックスの高さのみに基づいて調整
    }

    // ヒント表示用のテキストを生成
    generateHintText(problem) {
        // 既存のexplanationまたはanswerフィールドがある場合はそれを使用
        if (problem.explanation && problem.explanation !== problem.question) {
            return problem.explanation;
        }
        
        if (problem.answer && problem.answer !== problem.question) {
            return problem.answer;
        }

        // デフォルト問題の場合、answerフィールドから適切なヒントを生成
        const hintText = problem.answer || '';
        
        // 追加情報を生成
        const additionalInfo = [];
        
        if (problem.language) {
            additionalInfo.push(`言語: ${problem.language}`);
        }
        
        if (problem.category) {
            additionalInfo.push(`カテゴリ: ${problem.category}`);
        }
        
        if (problem.difficulty) {
            additionalInfo.push(`難易度: ${problem.difficulty}`);
        }

        // 文字数情報を追加
        if (problem.question) {
            additionalInfo.push(`文字数: ${problem.question.length}文字`);
        }

        // ヒントテキストを構築
        let result = hintText;
        if (additionalInfo.length > 0) {
            result += '\n\n' + additionalInfo.join(' | ');
        }

        return result || 'ヒント情報がありません';
    }

    togglePause() {
        const pauseButton = document.getElementById('pause-button');

        if (this.isActive) {
            this.isActive = false;
            clearInterval(this.timer);
            pauseButton.textContent = '再開';
            document.getElementById('typing-input').disabled = true;
        } else {
            this.isActive = true;
            this.startTimer();
            pauseButton.textContent = '一時停止';
            document.getElementById('typing-input').disabled = false;
            document.getElementById('typing-input').focus();
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLimit--;
            this.updateTimer();

            if (this.timeLimit <= 0) {
                this.endPractice();
            }
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.timeLimit / 60);
        const seconds = this.timeLimit % 60;
        document.getElementById('timer').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        // 現在の判定値を計算して表示
        const currentJudgmentValue = this.calculateCurrentJudgmentValue();
        document.getElementById('score').textContent = Math.round(currentJudgmentValue * 10) / 10;

        // 問題単位での正答率（完了した問題のみ）
        const completedProblems = this.currentProblemIndex;
        const problemAccuracy = completedProblems > 0 ?
            Math.round((this.correctAnswers / completedProblems) * 100) : 100;

        // 現在入力中の文字レベルでの正答率は updateTypingDisplay で更新される
        // 問題が完了していない場合は、現在の入力状況を維持
        if (this.totalAnswers === 0) {
            // 初回表示時は100%を表示
            document.getElementById('accuracy').textContent = '100%';
        }
    }

    endPractice() {
        this.isActive = false;
        clearInterval(this.timer);

        // 結果を表示
        this.showResults();
    }

    showResults() {
        const accuracy = this.totalAnswers > 0 ?
            Math.round((this.correctAnswers / this.totalAnswers) * 100) : 0;

        // 経過時間を計算（秒単位）
        const elapsedTime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        this.totalTime = elapsedTime; // totalTimeプロパティを設定

        // 全問題の総文字数を計算
        let totalChars = 0;
        let totalInputChars = 0;
        let totalIncorrectChars = 0;
        let totalExcessChars = 0;

        this.problems.forEach(problem => {
            totalChars += problem.question.length;
        });

        // 実際の問題数と正答率に基づいて計算
        const actualTotalProblems = this.problems.length;
        const actualCorrectProblems = this.correctAnswers;
        const actualAccuracy = actualTotalProblems > 0 ?
            Math.round((actualCorrectProblems / actualTotalProblems) * 100) : 0;

        // 正確な文字数計算
        totalInputChars = Math.round(totalChars * (actualCorrectProblems / actualTotalProblems));
        totalIncorrectChars = totalChars - totalInputChars;
        totalExcessChars = 0; // 現在の実装では過剰入力は計算していない

        // ワープロ検定評価を計算
        const wpEvaluation = this.calculateWordProcessorRank(
            totalInputChars,
            totalIncorrectChars,
            totalExcessChars,
            elapsedTime
        );

        // 目標時間を計算
        const targetTime = this.calculateTargetTime(totalChars);
        const targetTimeMinutes = Math.floor(targetTime / 60);
        const targetTimeSeconds = Math.round(targetTime % 60);

        // 判定値を計算
        const judgmentValue = this.calculateJudgmentValue();

        document.getElementById('result-total').textContent = actualTotalProblems;
        document.getElementById('result-correct').textContent = actualCorrectProblems;
        document.getElementById('result-accuracy').textContent = `${actualAccuracy}%`;
        document.getElementById('result-judgment-value').textContent = Math.round(judgmentValue * 10) / 10; // 小数点1桁で表示

        const rank = this.calculateRank(actualAccuracy, this.score);
        const rankElement = document.getElementById('result-rank');
        rankElement.textContent = rank;

        // data-tooltip属性を更新
        rankElement.setAttribute('data-tooltip', `ワープロ検定${rank}相当！`);

        document.getElementById('result-input-chars').textContent = totalInputChars;
        document.getElementById('result-target-time').textContent =
            `${targetTimeMinutes}:${targetTimeSeconds.toString().padStart(2, '0')}`;

        const modal = document.getElementById('result-modal');
        modal.style.display = 'flex';

        // CSSが適用されない場合の強制スタイル適用（モーダル背景）
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999';

        // モーダルコンテンツ（白い部分）のスタイル強制適用
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.backgroundColor = '#fff';
            modalContent.style.padding = '30px';
            modalContent.style.borderRadius = '8px';
            modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            modalContent.style.width = '500px';
            modalContent.style.maxWidth = '90vw';
            modalContent.style.maxHeight = '70vh';
            modalContent.style.overflowY = 'auto';
            modalContent.style.textAlign = 'center';
            modalContent.style.position = 'relative';
            modalContent.style.margin = '0 auto';

            // 統計情報のスタイル強制適用
            const stats = modalContent.querySelectorAll('.stat');
            stats.forEach(stat => {
                stat.style.display = 'flex';
                stat.style.justifyContent = 'space-between';
                stat.style.alignItems = 'center';
                stat.style.padding = '10px 0';
                stat.style.borderBottom = '1px solid #e9ecef';
            });
        }

        // タイピングログを保存
        this.saveTypingResult(actualAccuracy, elapsedTime, totalInputChars, totalChars);

        // 最後の統計項目のボーダーを削除（modalContentが存在する場合のみ）
        if (modalContent) {
            const stats = modalContent.querySelectorAll('.stat');
            if (stats.length > 0) {
                stats[stats.length - 1].style.borderBottom = 'none';
            }
        }

        // ランクハイライトのスタイル
        const rankHighlight = modalContent.querySelector('.rank-highlight');
        if (rankHighlight) {
            rankHighlight.style.backgroundColor = '#f8f9fa';
            rankHighlight.style.fontWeight = 'bold';
            rankHighlight.style.color = '#28a745';
        }

        // タイピングログを保存
        this.saveTypingResult(actualAccuracy, elapsedTime, totalInputChars, totalChars);
    }

    calculateRank(accuracy, score) {
        // 判定値ベースの評価基準
        const judgmentValue = this.calculateJudgmentValue();

        if (judgmentValue >= 100) return '初段';
        if (judgmentValue >= 70) return '1級';
        if (judgmentValue >= 60) return '準1級';
        if (judgmentValue >= 50) return '2級';
        if (judgmentValue >= 40) return '準2級';
        if (judgmentValue >= 30) return '3級';
        return '4級';
    }

    // 新しい判定値計算メソッド
    calculateJudgmentValue() {
        // 実際にかかった時間を計算（秒単位）
        const actualTimeInSeconds = this.totalTime;

        // 全問題の統計を集計
        let totalInputChars = 0;        // ①入力文字数
        let totalRemainingChars = 0;    // ②残った本文の文字数（不足した入力値）
        let totalExcessChars = 0;       // ②余った文字数（過分な入力値）

        // 各問題の結果を集計
        for (let i = 0; i < this.currentProblemIndex; i++) {
            const problem = this.problems[i];
            const expectedText = problem.question;

            // 問題が完了している場合（正解した場合）
            if (i < this.correctAnswers) {
                // 正解した問題は全文字を正しく入力したとみなす
                totalInputChars += expectedText.length;
                // 残った文字数と余った文字数は0
                totalRemainingChars += 0;
                totalExcessChars += 0;
            } else {
                // スキップした問題は入力文字数0、残った文字数は全文字数
                totalInputChars += 0;
                totalRemainingChars += expectedText.length;
                totalExcessChars += 0;
            }
        }

        // 判定値計算: ((①入力文字数 - (②残った本文の文字数 + 余った文字数)) / ③かかった時間) × 6 × 10
        const effectiveChars = totalInputChars - (totalRemainingChars + totalExcessChars);
        const judgmentValue = (effectiveChars / actualTimeInSeconds) * 6 * 10;

        console.log('判定値計算:', {
            totalInputChars: totalInputChars,
            totalRemainingChars: totalRemainingChars,
            totalExcessChars: totalExcessChars,
            effectiveChars: effectiveChars,
            actualTimeInSeconds: actualTimeInSeconds,
            judgmentValue: judgmentValue
        });

        return Math.max(0, judgmentValue); // 負の値は0にする
    }

    // 日本語ワープロ検定基準の評価計算
    calculateWordProcessorRank(inputChars, incorrectChars, excessChars, timeInSeconds) {
        // 判定値 = ((入力文字数 - (残った本文の文字数 + 余った文字数)) / かかった時間) × 6
        const effectiveChars = inputChars - (incorrectChars + excessChars);
        const timeInMinutes = timeInSeconds / 60;
        const judgmentValue = (effectiveChars / timeInMinutes) * 6;

        console.log('評価計算:', {
            inputChars,
            incorrectChars,
            excessChars,
            effectiveChars,
            timeInSeconds,
            timeInMinutes,
            judgmentValue
        });

        // 日本語ワープロ検定の評価基準
        if (judgmentValue >= 8) return { rank: '初段', value: judgmentValue };
        if (judgmentValue >= 7) return { rank: '1級', value: judgmentValue };
        if (judgmentValue >= 6) return { rank: '準1級', value: judgmentValue };
        if (judgmentValue >= 5) return { rank: '2級', value: judgmentValue };
        if (judgmentValue >= 4) return { rank: '準2級', value: judgmentValue };
        if (judgmentValue >= 3) return { rank: '3級', value: judgmentValue };
        return { rank: '4級', value: judgmentValue };
    }

    // 目標時間の計算（2級相当を基準）
    calculateTargetTime(totalChars) {
        // 目標時間 = (文字数 × 6) / 5 (秒)
        return (totalChars * 6) / 5;
    }

    // 現在の判定値を計算（リアルタイム表示用）
    calculateCurrentJudgmentValue() {
        if (!this.startTime || this.correctAnswers === 0) {
            return 0;
        }

        // 経過時間を計算（秒単位）
        const elapsedTime = (Date.now() - this.startTime) / 1000;

        // 完了した問題の総文字数を計算
        let completedChars = 0;
        for (let i = 0; i < this.correctAnswers && i < this.problems.length; i++) {
            completedChars += this.problems[i].question.length;
        }

        // 判定値計算: (有効文字数 / 経過時間) × 6 × 10
        const judgmentValue = (completedChars / elapsedTime) * 6 * 10;

        return Math.max(0, judgmentValue);
    }

    // 次へボタンのテキストを更新
    updateSkipButtonText() {
        const skipButton = document.getElementById('skip-button');
        if (skipButton) {
            const isLastProblem = this.currentProblemIndex >= this.problems.length - 1;
            skipButton.textContent = isLastProblem ? '提出' : '次へ';
        }
    }

    // 問題文の表示/非表示を切り替え（現在位置は表示維持）
    toggleProblemDisplay() {
        const problemText = document.getElementById('problem-text');
        const showProblemCheckbox = document.getElementById('show-problem');

        if (problemText && showProblemCheckbox) {
            if (showProblemCheckbox.checked) {
                problemText.classList.remove('text-hidden');
            } else {
                problemText.classList.add('text-hidden');
            }
        }
    }

    // 入力エリアのサイズを問題文に合わせて調整
    adjustInputAreaSize() {
        const problemText = document.getElementById('problem-text');
        const typingInput = document.getElementById('typing-input');

        if (problemText && typingInput) {
            // 少し待ってから高さを取得（レンダリング完了を待つ）
            setTimeout(() => {
                // 問題文ボックスのみの高さを取得
                const problemHeight = problemText.scrollHeight;
                const problemOffsetHeight = problemText.offsetHeight;

                // より確実な高さを取得
                const actualHeight = Math.max(problemHeight, problemOffsetHeight);

                // 入力エリアの高さを問題文ボックスに合わせる
                typingInput.style.height = `${actualHeight}px`;

                console.log('入力エリアの高さを調整:', {
                    problemHeight: problemHeight,
                    problemOffsetHeight: problemOffsetHeight,
                    actualHeight: actualHeight
                });
            }, 10);
        }
    }

    // ResizeObserverを使用して問題文の高さ変更を監視
    setupResizeObserver() {
        const problemText = document.getElementById('problem-text');
        if (problemText && window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.adjustInputAreaSize();
            });
            resizeObserver.observe(problemText);
        }
    }

    retry() {
        window.location.reload();
    }

    goBack() {
        // 統計情報更新フラグを設定
        sessionStorage.setItem('statsUpdated', 'true');
        
        // バックエンドユーザーの場合、統計情報のキャッシュをクリア
        if (window.rctApi && !window.rctApi.isLocalUser()) {
            console.log('バックエンドユーザーの統計キャッシュをクリア');
            // 次回の統計取得時に最新情報を取得するため、少し待機
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 500);
        } else {
            window.location.href = 'main.html';
        }
    }

    // タイピング結果を保存
    async saveTypingResult(accuracy, elapsedTimeSeconds, correctChars, totalChars) {
        try {
            // 実際の問題数情報を計算
            const totalProblems = this.problems.length;
            const correctProblems = this.correctAnswers;
            
            console.log('タイピング結果保存開始:', {
                accuracy: accuracy,
                elapsedTime: elapsedTimeSeconds,
                correctChars: correctChars,
                totalChars: totalChars,
                totalProblems: totalProblems,
                correctProblems: correctProblems
            });

            // WPM計算（Words Per Minute）- 0除算を防ぐ
            const wpm = elapsedTimeSeconds > 0 ? Math.round((correctChars / 5) / (elapsedTimeSeconds / 60)) : 0;

            // 精度を0-1の範囲に変換（0-100% → 0-1）
            const accuracyDecimal = Math.max(0, Math.min(1, accuracy / 100));

            // ミリ秒に変換
            const durationMs = Math.round(elapsedTimeSeconds * 1000);

            // スコア（判定値）を計算
            const score = this.calculateCurrentJudgmentValue();

            // 使用した言語を取得（複数言語の場合は最初の言語）
            const language = this.config.languages && this.config.languages.length > 0 
                ? this.config.languages[0] 
                : 'Unknown';

            // rctApiのsaveTypingLogを呼び出し
            if (window.rctApi && typeof window.rctApi.saveTypingLog === 'function') {
                const result = await window.rctApi.saveTypingLog(
                    null, // studyBookId（現在は使用しない）
                    this.startTime, // startedAt
                    durationMs, // durationMs
                    totalChars, // totalChars
                    correctChars, // correctChars
                    language, // language
                    score // score
                );

                console.log('タイピングログ保存結果:', result);

                if (result.savedLocally) {
                    console.log('ローカルストレージに保存されました');
                } else {
                    console.log('バックエンドに保存されました');
                    
                    // バックエンドユーザーでも問題数情報をローカルに保存
                    const localLogs = JSON.parse(localStorage.getItem('typingLogs') || '[]');
                    localLogs.push({
                        startedAt: this.startTime,
                        durationMs: durationMs,
                        totalChars: totalChars,
                        correctChars: correctChars,
                        wpm: wpm,
                        accuracy: accuracyDecimal,
                        totalProblems: totalProblems,
                        correctProblems: correctProblems,
                        score: score,
                        language: language,
                        timestamp: new Date().toISOString(),
                        backendSaved: true
                    });
                    localStorage.setItem('typingLogs', JSON.stringify(localLogs));
                    console.log('バックエンドユーザーの問題数情報もローカルに保存しました');
                }
            } else {
                console.warn('rctApi.saveTypingLogが利用できません。ローカルに保存します。');

                // フォールバック：直接ローカルストレージに保存
                const logs = JSON.parse(localStorage.getItem('typingLogs') || '[]');
                logs.push({
                    startedAt: this.startTime,
                    durationMs: durationMs,
                    totalChars: totalChars,
                    correctChars: correctChars,
                    wpm: wpm,
                    accuracy: accuracyDecimal,
                    totalProblems: totalProblems,
                    correctProblems: correctProblems,
                    score: score,
                    language: language,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('typingLogs', JSON.stringify(logs));

                // 統計情報は自動的にタイピングログから計算される
            }

        } catch (error) {
            console.error('タイピング結果保存エラー:', error);

            // エラー時のフォールバック処理
            const logs = JSON.parse(localStorage.getItem('typingLogs') || '[]');
            logs.push({
                startedAt: this.startTime,
                durationMs: Math.round(elapsedTimeSeconds * 1000),
                totalChars: totalChars,
                correctChars: correctChars,
                wpm: Math.round((correctChars / 5) / (elapsedTimeSeconds / 60)),
                accuracy: accuracy / 100,
                totalProblems: totalProblems,
                correctProblems: correctProblems,
                score: score,
                timestamp: new Date().toISOString(),
                error: true
            });
            localStorage.setItem('typingLogs', JSON.stringify(logs));

            // 統計情報は自動的にタイピングログから計算される
        }
    }

    // ローカル統計情報を直接更新（廃止：タイピングログから自動計算）
    updateLocalStatsDirectly(wpm, accuracy) {
        console.log('updateLocalStatsDirectly は廃止されました。タイピングログから統計を計算します。');
        // この関数は使用しない（タイピングログから統計を計算するため）
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoadedイベントが発火しました');

    // api.jsの読み込みを確実に待つ
    const initWithDelay = () => {
        if (window.rctApi) {
            console.log('rctApiが利用可能です。TypingPracticeを初期化します。');
            new TypingPractice();
        } else {
            console.log('rctApiがまだ利用できません。100ms後に再試行します。');
            setTimeout(initWithDelay, 100);
        }
    };

    // 少し待ってから初期化を開始
    setTimeout(initWithDelay, 50);
});