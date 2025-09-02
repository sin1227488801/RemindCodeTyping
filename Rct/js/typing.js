// タイピング設定画面の機能
class TypingConfig {
    constructor() {
        console.log('TypingConfigクラスが初期化されました');
        this.languages = [];
        window.typingConfigInstance = this; // デバッグ用にグローバル変数に保存
        this.init();
    }

    async init() {
        console.log('TypingConfig.init()が呼ばれました');

        await this.loadLanguages();
        await this.loadUserStats();
        this.setupEventListeners();
        console.log('TypingConfig初期化完了');
    }

    async waitForBackend() {
        const maxWait = 20000; // 最大20秒待機
        const checkInterval = 1000; // 1秒間隔でチェック
        const startTime = Date.now();

        console.log('バックエンドの準備完了を待機中...');
        this.updateLanguageProgress(10, 'APIライブラリの読み込みを待機中...');

        // まずrctApiの読み込みを待つ
        while (Date.now() - startTime < maxWait && !window.rctApi) {
            console.log('rctAPIの読み込みを待機中...');
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        if (!window.rctApi) {
            console.error('rctAPIの読み込みがタイムアウトしました');
            throw new Error('APIライブラリの読み込みに失敗しました');
        }

        console.log('rctAPIが読み込まれました。バックエンドの接続を確認中...');
        this.updateLanguageProgress(15, 'バックエンドサーバーとの接続を確認中...');

        // バックエンドの接続確認
        let attemptCount = 0;
        const backendStartTime = Date.now();
        while (Date.now() - startTime < maxWait) {
            attemptCount++;
            try {
                // ヘルスチェック的なAPI呼び出し
                const response = await fetch('/api/studybooks/languages', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log('バックエンドの準備が完了しました');
                    this.updateLanguageProgress(25, 'バックエンド接続完了');
                    return;
                }

                console.log(`バックエンド応答: ${response.status} ${response.statusText}`);
                const elapsed = Date.now() - backendStartTime;
                const progress = Math.min(20, 15 + (elapsed / (maxWait * 0.6)) * 5);
                this.updateLanguageProgress(progress, `接続試行中... (${attemptCount}回目)`);

            } catch (error) {
                console.log('バックエンド接続確認中:', error.message);
                const elapsed = Date.now() - backendStartTime;
                const progress = Math.min(20, 15 + (elapsed / (maxWait * 0.6)) * 5);
                this.updateLanguageProgress(progress, `接続試行中... (${attemptCount}回目)`);
            }

            // 少し待ってから再試行
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        console.log('バックエンドの準備完了を待機中にタイムアウトしました');
        throw new Error('バックエンドサーバーとの接続がタイムアウトしました');
    }

    updateLanguageProgress(percentage, status) {
        const progressBar = document.getElementById('language-progress');
        const statusText = document.getElementById('language-status');

        console.log(`言語読み込み進捗更新: ${percentage}% - ${status}`);
        console.log('プログレスバー要素:', progressBar);
        console.log('ステータステキスト要素:', statusText);

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            console.log(`プログレスバー幅を${percentage}%に設定しました`);
        } else {
            console.error('language-progressエレメントが見つかりません');
        }

        if (statusText) {
            statusText.textContent = status;
            console.log(`ステータステキストを「${status}」に設定しました`);
        } else {
            console.error('language-statusエレメントが見つかりません');
        }
    }

    hideLanguageLoading() {
        const loadingOverlay = document.getElementById('language-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('言語読み込みローディングを非表示にしました');
        }
    }

    async loadUserStats() {
        console.log('ユーザー統計情報の読み込みを開始します...');
        const statsLoading = document.getElementById('stats-loading');
        const statsDisplay = document.getElementById('stats-display');
        const recentAccuracy = document.getElementById('recent-accuracy');
        const highestRank = document.getElementById('highest-rank');

        if (!window.rctApi || !window.rctApi.isLoggedIn()) {
            console.log('ユーザーがログインしていないため、統計情報をスキップします');
            if (recentAccuracy) recentAccuracy.textContent = '直近の正答率 ---% (ログインが必要)';
            if (highestRank) highestRank.textContent = '最高ランク --- (ログインが必要)';
            return;
        }

        try {
            if (statsLoading) statsLoading.style.display = 'block';
            if (statsDisplay) statsDisplay.style.display = 'none';

            const stats = await window.rctApi.getStats();
            console.log('取得した統計情報:', stats);

            if (stats) {
                // 正答率の計算（100問までと100問以上で分岐）
                let accuracyText = '直近の正答率 ---%';
                if (stats.totalAttempts > 0) {
                    const accuracy = stats.averageAccuracy || 0;
                    const attempts = stats.totalAttempts;

                    if (attempts <= 100) {
                        accuracyText = `直近${attempts}問正答率 ${accuracy.toFixed(1)}%`;
                    } else {
                        accuracyText = `直近100問正答率 ${accuracy.toFixed(1)}%`;
                    }
                }

                // ランクの計算（正答率に基づく）
                let rankText = '最高ランク ---';
                if (stats.bestAccuracy !== null && stats.bestAccuracy !== undefined) {
                    const bestAccuracy = parseFloat(stats.bestAccuracy);
                    const rank = this.calculateRank(bestAccuracy);
                    rankText = `最高ランク ${rank}`;
                }

                if (recentAccuracy) recentAccuracy.textContent = accuracyText;
                if (highestRank) highestRank.textContent = rankText;
            }

        } catch (error) {
            console.error('統計情報の読み込みに失敗しました:', error);
            if (recentAccuracy) recentAccuracy.textContent = '直近の正答率 取得失敗';
            if (highestRank) highestRank.textContent = '最高ランク 取得失敗';
        } finally {
            if (statsLoading) statsLoading.style.display = 'none';
            if (statsDisplay) statsDisplay.style.display = 'block';
        }
    }

    calculateRank(accuracy) {
        // typing-practice.jsと統一した評価基準
        if (accuracy >= 95) return '初段';
        if (accuracy >= 90) return '1級';
        if (accuracy >= 85) return '準1級';
        if (accuracy >= 80) return '2級';
        if (accuracy >= 75) return '準2級';
        if (accuracy >= 70) return '3級';
        if (accuracy >= 60) return '4級';
        return '未認定';
    }

    async loadLanguages() {
        console.log('言語の読み込みを開始します...');
        this.updateLanguageProgress(50, '言語リストを取得中...');

        try {
            // データベースから実際の言語を取得
            this.updateLanguageProgress(60, 'サーバーから言語データを取得中...');

            // 少し待ってから実際の取得を開始
            await new Promise(resolve => setTimeout(resolve, 300));

            const allLanguages = await this.fetchAllLanguages();
            console.log('APIから取得した言語:', allLanguages);

            this.updateLanguageProgress(70, '言語データを処理中...');
            await new Promise(resolve => setTimeout(resolve, 200));

            if (allLanguages && allLanguages.length > 0) {
                this.languages = allLanguages;
                console.log('APIから取得した言語を使用:', this.languages);
            } else {
                console.log('APIからの言語取得に失敗、フォールバックを使用');
                // フォールバック用の言語リスト
                this.languages = [
                    'HTML', 'CSS', 'JavaScript', 'PHP', 'Java', 'Python3', 'SQL', 'Linux (RED Hat)', 'Linux(Debian)', 'Git'
                ];
            }

            this.updateLanguageProgress(85, '選択肢を作成中...');
            await new Promise(resolve => setTimeout(resolve, 200));
            this.populateLanguageSelect();

        } catch (error) {
            console.error('言語の読み込みに失敗しました:', error);
            console.log('エラーのため、フォールバックを使用');
            this.updateLanguageProgress(60, 'フォールバック言語を使用中...');
            await new Promise(resolve => setTimeout(resolve, 200));

            // フォールバック用の言語リスト
            this.languages = [
                'HTML', 'CSS', 'JavaScript', 'PHP', 'Java', 'Python3', 'SQL', 'Linux (RED Hat)', 'Linux(Debian)', 'Git'
            ];

            this.updateLanguageProgress(85, '選択肢を作成中...');
            await new Promise(resolve => setTimeout(resolve, 200));
            this.populateLanguageSelect();
        }
    }

    async fetchAllLanguages() {
        const maxRetries = 5;
        const baseDelay = 1000; // 基本遅延時間

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`APIを呼び出し中 (試行 ${attempt}/${maxRetries}): /api/studybooks/languages`);

                // rctApiが読み込まれるまで待機
                if (!window.rctApi) {
                    console.log('rctApiが未定義です。少し待ってから再試行します。');
                    await new Promise(resolve => setTimeout(resolve, baseDelay));
                    continue;
                }

                // rctApiを使用して言語一覧を取得
                const languages = await window.rctApi.getAllLanguages();
                console.log('取得した言語データ:', languages);

                // 成功した場合は結果を返す
                if (languages && Array.isArray(languages) && languages.length > 0) {
                    return languages;
                }

                // 空の配列が返された場合もリトライ
                console.log(`試行 ${attempt}: 言語データが空でした`);

            } catch (error) {
                console.error(`言語取得エラー (試行 ${attempt}):`, error);

                // 特定のエラーの場合は即座に諦める
                if (error.message && error.message.includes('404')) {
                    console.log('404エラーのため、リトライを中止します');
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

        console.log('全ての試行が失敗しました。フォールバックを使用します。');
        return [];
    }

    populateLanguageSelect() {
        console.log('言語選択肢を作成中:', this.languages);
        const languageSelect = document.getElementById('language-select');

        if (!languageSelect) {
            console.error('language-selectエレメントが見つかりません');
            return;
        }

        languageSelect.innerHTML = '';

        this.languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageSelect.appendChild(option);
            console.log('言語オプション追加:', language);
        });

        console.log('言語選択肢の作成完了。総数:', this.languages.length);
    }

    setupEventListeners() {
        const startButton = document.querySelector('.btn');
        const problemSourceSelect = document.getElementById('problem-source-select');
        const languageSelect = document.getElementById('language-select');
        const problemCountInput = document.getElementById('problem-count-input');

        console.log('イベントリスナー設定中...');
        console.log('Start!ボタン:', startButton);

        // 既存のイベントリスナーをクリア
        this.removeEventListeners();

        if (startButton) {
            // イベントリスナーの重複を防ぐため、既存のものを削除してから追加
            const newStartButton = startButton.cloneNode(true);
            startButton.parentNode.replaceChild(newStartButton, startButton);

            this.startButtonHandler = (e) => {
                e.preventDefault(); // フォーム送信を防ぐ
                console.log('Start!ボタンがクリックされました');
                this.startTyping();
            };
            newStartButton.addEventListener('click', this.startButtonHandler);
            console.log('Start!ボタンのイベントリスナーを設定しました');
        } else {
            console.error('Start!ボタンが見つかりません');
        }

        if (problemSourceSelect) {
            this.problemSourceHandler = () => this.onProblemSourceChange();
            problemSourceSelect.addEventListener('change', this.problemSourceHandler);
        } else {
            console.warn('problem-source-selectエレメントが見つかりません');
        }

        // 問題数入力のバリデーション（フォーカスが外れた時のみ）
        if (problemCountInput) {
            this.problemCountHandler = (e) => {
                let value = parseInt(e.target.value);
                // 上限20のみチェック、下限は設定しない
                if (value > 20) {
                    e.target.value = 20;
                }
                // 空欄やNaNの場合はそのまま（ユーザーが入力中の可能性）
            };
            // inputイベントは削除し、blurイベントのみで検証
            problemCountInput.addEventListener('blur', this.problemCountHandler);

            // Enterキーが押された時も検証
            this.problemCountKeyHandler = (e) => {
                if (e.key === 'Enter') {
                    this.problemCountHandler(e);
                }
            };
            problemCountInput.addEventListener('keydown', this.problemCountKeyHandler);
        } else {
            console.warn('problem-count-inputエレメントが見つかりません');
        }

        // 言語選択の表示問題を修正
        if (languageSelect) {
            this.languageBlurHandler = () => {
                // フォーカスを失った時に選択状態のスタイルを強制適用
                if (this.languageBlurTimeout) {
                    clearTimeout(this.languageBlurTimeout);
                }
                this.languageBlurTimeout = setTimeout(() => {
                    if (languageSelect) {
                        const selectedOptions = languageSelect.querySelectorAll('option:checked');
                        selectedOptions.forEach(option => {
                            option.style.backgroundColor = 'var(--color-accent)';
                            option.style.color = 'white';
                        });
                    }
                }, 10);
            };

            this.languageChangeHandler = () => {
                // 選択変更時にスタイルを更新
                if (languageSelect) {
                    const allOptions = languageSelect.querySelectorAll('option');
                    allOptions.forEach(option => {
                        if (option.selected) {
                            option.style.backgroundColor = 'var(--color-accent)';
                            option.style.color = 'white';
                        } else {
                            option.style.backgroundColor = '';
                            option.style.color = '';
                        }
                    });
                }
            };

            languageSelect.addEventListener('blur', this.languageBlurHandler);
            languageSelect.addEventListener('change', this.languageChangeHandler);
        } else {
            console.warn('language-selectエレメントが見つかりません');
        }

        // カスタム時間入力の処理
        const timeSelect = document.getElementById('time-select');
        const customTimeInput = document.getElementById('custom-time-input');

        if (timeSelect && customTimeInput) {
            this.timeSelectHandler = () => {
                if (timeSelect.value === 'custom') {
                    customTimeInput.style.display = 'block';
                    customTimeInput.focus();
                } else {
                    customTimeInput.style.display = 'none';
                    customTimeInput.value = '';
                }
            };

            this.customTimeInputHandler = (e) => {
                let value = parseInt(e.target.value);
                if (isNaN(value) || value < 1) {
                    e.target.value = 1;
                } else if (value > 120) {
                    e.target.value = 120;
                }
            };

            timeSelect.addEventListener('change', this.timeSelectHandler);
            customTimeInput.addEventListener('input', this.customTimeInputHandler);
        } else {
            console.warn('time-selectまたはcustom-time-inputエレメントが見つかりません');
        }

        // 特別ランクのクリックイベントを設定（typing-practice.htmlでは不要のためコメントアウト）
        // this.setupSpecialRankEvents();

        // 要素への参照を保存（クリーンアップ用）
        this.elements = {
            startButton: document.querySelector('.btn'),
            problemSourceSelect,
            languageSelect,
            problemCountInput,
            timeSelect: document.getElementById('time-select'),
            customTimeInput: document.getElementById('custom-time-input')
        };
    }

    removeEventListeners() {
        // タイマーのクリーンアップ
        if (this.languageBlurTimeout) {
            clearTimeout(this.languageBlurTimeout);
            this.languageBlurTimeout = null;
        }

        // イベントリスナーの削除
        if (this.elements) {
            if (this.elements.problemSourceSelect && this.problemSourceHandler) {
                this.elements.problemSourceSelect.removeEventListener('change', this.problemSourceHandler);
            }
            if (this.elements.languageSelect) {
                if (this.languageBlurHandler) {
                    this.elements.languageSelect.removeEventListener('blur', this.languageBlurHandler);
                }
                if (this.languageChangeHandler) {
                    this.elements.languageSelect.removeEventListener('change', this.languageChangeHandler);
                }
            }
            if (this.elements.problemCountInput) {
                if (this.problemCountHandler) {
                    this.elements.problemCountInput.removeEventListener('blur', this.problemCountHandler);
                }
                if (this.problemCountKeyHandler) {
                    this.elements.problemCountInput.removeEventListener('keydown', this.problemCountKeyHandler);
                }
            }
            if (this.elements.timeSelect && this.timeSelectHandler) {
                this.elements.timeSelect.removeEventListener('change', this.timeSelectHandler);
            }
            if (this.elements.customTimeInput && this.customTimeInputHandler) {
                this.elements.customTimeInput.removeEventListener('input', this.customTimeInputHandler);
            }
        }

        // ハンドラーをクリア
        this.startButtonHandler = null;
        this.problemSourceHandler = null;
        this.languageBlurHandler = null;
        this.languageChangeHandler = null;
        this.problemCountHandler = null;
        this.problemCountKeyHandler = null;
        this.timeSelectHandler = null;
        this.customTimeInputHandler = null;
    }

    onProblemSourceChange() {
        // 問題ソースが変更されたときの処理
        // 必要に応じて言語リストを更新
        this.loadLanguages();
    }

    startTyping() {
        console.log('startTyping関数が呼び出されました');
        const config = this.getTypingConfig();
        console.log('取得した設定:', config);

        if (!this.validateConfig(config)) {
            console.log('設定の検証に失敗しました');
            return;
        }

        try {
            console.log('タイピング設定:', config);

            // 設定をセッションストレージに保存
            const configStr = JSON.stringify(config);
            console.log('保存する設定文字列:', configStr);
            sessionStorage.setItem('typingSettings', configStr);

            // 保存確認
            const savedConfig = sessionStorage.getItem('typingSettings');
            console.log('保存確認:', savedConfig);

            if (savedConfig === configStr) {
                console.log('設定の保存が成功しました');
                // すぐにタイピング練習画面に遷移
                console.log('typing-practice.htmlに遷移します');
                window.location.href = 'typing-practice.html';
            } else {
                console.error('設定の保存に失敗しました');
                alert('設定の保存に失敗しました。再度お試しください。');
            }
        } catch (error) {
            console.error('タイピング開始エラー:', error);
            alert('タイピングの開始に失敗しました。');
        }
    }

    getTypingConfig() {
        console.log('設定を取得中...');

        const problemSourceSelect = document.getElementById('problem-source-select');
        const problemSource = problemSourceSelect ? problemSourceSelect.value : 'system';
        console.log('問題ソース:', problemSource);

        const languageSelect = document.getElementById('language-select');
        if (!languageSelect) {
            console.error('language-selectエレメントが見つかりません');
            return null;
        }
        const selectedLanguages = Array.from(languageSelect.selectedOptions).map(option => option.value);
        console.log('選択された言語:', selectedLanguages);

        const ruleSelect = document.getElementById('rule-select');
        const rule = ruleSelect ? ruleSelect.value : 'option1';
        console.log('ルール:', rule);

        const timeSelect = document.getElementById('time-select');
        const customTimeInput = document.getElementById('custom-time-input');
        let time = '10';

        if (timeSelect) {
            if (timeSelect.value === 'custom' && customTimeInput && customTimeInput.value) {
                time = customTimeInput.value;
            } else if (timeSelect.value !== 'custom') {
                time = timeSelect.value;
            }
        }
        console.log('時間:', time);

        const problemCountInput = document.getElementById('problem-count-input');
        const problemCount = problemCountInput ? parseInt(problemCountInput.value) : 10;
        console.log('問題数（生値）:', problemCount);

        // 問題数のバリデーション（上限20のみ、下限なし、ただし無効値の場合は10をデフォルト）
        let validProblemCount;
        if (isNaN(problemCount) || problemCount <= 0) {
            validProblemCount = 10; // デフォルト値
        } else if (problemCount > 20) {
            validProblemCount = 20; // 上限
        } else {
            validProblemCount = problemCount; // そのまま使用
        }
        console.log('問題数（検証後）:', validProblemCount);

        const config = {
            problemSource,
            languages: selectedLanguages,
            rule,
            timeLimit: parseInt(time) || 10,
            problemCount: validProblemCount
        };

        console.log('最終設定:', config);
        return config;
    }

    validateConfig(config) {
        if (config.languages.length === 0) {
            alert('言語を選択してください。');
            return false;
        }

        if (!config.timeLimit || config.timeLimit < 1) {
            alert('有効な時間を入力してください。');
            return false;
        }

        if (!config.problemCount || config.problemCount < 1 || config.problemCount > 20) {
            alert('問題数は1〜20の範囲で入力してください。');
            return false;
        }

        return true;
    }

    // 特別ランクのモーダル機能は typing-practice.html では不要のため削除
    // setupSpecialRankEvents(), showSpecialRankModal(), hideSpecialRankModal() を削除
}

// テスト用関数をグローバルスコープで定義
window.testConfig = function () {
    const config = {
        problemSource: 'system',
        languages: ['HTML'],
        rule: 'option1',
        timeLimit: 10,
        problemCount: 10
    };

    console.log('テスト設定を保存:', config);
    sessionStorage.setItem('typingSettings', JSON.stringify(config));

    const saved = sessionStorage.getItem('typingSettings');
    console.log('保存確認:', saved);

    alert('テスト設定を保存しました。typing-practice.htmlに移動してテストしてください。');
};

// 手動でStart!ボタンをテストする関数
window.testStartButton = function () {
    console.log('手動でStart!ボタンをテスト中...');
    if (window.typingConfigInstance) {
        window.typingConfigInstance.startTyping();
    } else {
        console.error('TypingConfigインスタンスが見つかりません');
    }
};

// 初期化フラグ
let typingConfigInitialized = false;

// 初期化関数
function initializeTypingConfig() {
    if (typingConfigInitialized) {
        console.log('TypingConfigは既に初期化されています');
        return;
    }

    console.log('TypingConfigを初期化します');
    typingConfigInitialized = true;

    // 即座に進捗を更新
    const progressBar = document.getElementById('language-progress');
    const statusText = document.getElementById('language-status');
    if (progressBar) {
        progressBar.style.width = '5%';
        console.log('初期プログレスバーを5%に設定');
    }
    if (statusText) {
        statusText.textContent = '初期化中...';
        console.log('初期ステータステキストを設定');
    }

    // 既存のインスタンスをクリーンアップ
    if (window.typingConfigInstance && typeof window.typingConfigInstance.removeEventListeners === 'function') {
        window.typingConfigInstance.removeEventListeners();
    }

    window.typingConfigInstance = new TypingConfig();
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoadedイベントが発火しました');
    initializeTypingConfig();
});

// 念のため、windowのloadイベントでも初期化を試行（重複防止付き）
window.addEventListener('load', () => {
    console.log('windowのloadイベントが発火しました');
    if (!typingConfigInitialized) {
        console.log('TypingConfigが初期化されていないため、初期化します');
        initializeTypingConfig();
    }
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (window.typingConfigInstance && typeof window.typingConfigInstance.removeEventListeners === 'function') {
        console.log('ページ離脱時にTypingConfigをクリーンアップします');
        window.typingConfigInstance.removeEventListeners();
    }
    typingConfigInitialized = false;
});