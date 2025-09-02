function loadPage(page, event) {
    console.log('Loading page:', page, 'Event:', event);

    // 既存のページをクリーンアップ
    cleanupCurrentPage();

    // タブをリセットする
    const tabs = document.querySelectorAll('.tab');
    console.log('Found tabs:', tabs.length);
    tabs.forEach(tab => tab.classList.remove('active'));

    // クリックされたタブにactiveクラスを追加
    if (event && event.target && event.target.classList.contains('tab')) {
        event.target.classList.add('active');
        console.log('Active tab set:', event.target.textContent);
    } else {
        // 初期読み込み時など、eventがない場合は最初のタブをアクティブにする
        if (tabs.length > 0) {
            tabs[0].classList.add('active');
            console.log('Default active tab set:', tabs[0].textContent);
        }
    }

    // ページ内容を読み込む
    console.log('Fetching page content:', page);
    fetch(page)
        .then(response => {
            console.log('Fetch response:', response.status, response.ok);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Page content loaded, length:', data.length);
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.innerHTML = data;
                console.log('Content area updated');

                // ページ固有の初期化処理
                initializePage(page);
            } else {
                console.error('Content area not found!');
            }
        })
        .catch(error => {
            console.error('Error loading page:', error);
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.innerHTML = `<div style="color: red; padding: 20px;">
                    <h3>ページの読み込みに失敗しました</h3>
                    <p>エラー: ${error.message}</p>
                    <p>ページ: ${page}</p>
                </div>`;
            }
        });
}

// 現在のページのクリーンアップ
function cleanupCurrentPage() {
    console.log('Cleaning up current page...');

    // タイマーのクリーンアップ
    cleanupTimers();

    // トグルボタンハンドラーのクリーンアップ
    if (window.toggleButtonHandlers) {
        window.toggleButtonHandlers.forEach(handler => {
            if (handler.element && handler.listener) {
                handler.element.removeEventListener('click', handler.listener);
            }
        });
        window.toggleButtonHandlers = [];
    }

    // 言語読み込みフラグのリセット
    if (typeof loadAvailableLanguages !== 'undefined') {
        loadAvailableLanguages.isLoading = false;
    }

    console.log('Current page cleanup completed');
}

// ページ固有の初期化処理
function initializePage(page) {
    switch (page) {
        case 'typing.html':
            initializeTypingPage();
            break;
        case 'notebook.html':
            initializeNotebookPage();
            break;
        case 'records.html':
            initializeRecordsPage();
            break;
    }
}

// タイピングページの初期化
function initializeTypingPage() {
    console.log('Initializing typing page...');

    // 既存のタイマーをクリーンアップ
    cleanupTimers();

    // レスポンシブ対応を強制適用
    applyResponsiveStyles();

    // 統計情報を取得して表示
    loadUserStats();

    // 言語選択リストを動的に更新（1回だけ実行）
    if (window.typingPageLanguageTimeout) {
        clearTimeout(window.typingPageLanguageTimeout);
    }
    window.typingPageLanguageTimeout = setTimeout(() => {
        console.log('Loading available languages for typing page...');
        loadAvailableLanguages();
        window.typingPageLanguageTimeout = null;
    }, 300);

    // 特別ランクのモーダル機能を直接実装
    if (window.specialRankModalTimeout) {
        clearTimeout(window.specialRankModalTimeout);
    }
    window.specialRankModalTimeout = setTimeout(() => {
        console.log('Setting up special rank modal functionality...');
        setupSpecialRankModal();
        window.specialRankModalTimeout = null;
    }, 200);

    // Startボタンのイベント設定（少し遅延させて確実にボタンが存在するようにする）
    if (window.typingPageButtonTimeout) {
        clearTimeout(window.typingPageButtonTimeout);
    }
    window.typingPageButtonTimeout = setTimeout(() => {
        const startButton = document.querySelector('#content-area .btn');
        if (startButton && startButton.textContent.includes('Start')) {
            // 既存のイベントリスナーを削除してから新しいものを追加
            const newStartButton = startButton.cloneNode(true);
            startButton.parentNode.replaceChild(newStartButton, startButton);
            newStartButton.addEventListener('click', startTypingSession);
            console.log('Start button event listener added');
        } else {
            console.error('Start!ボタンが見つかりません');
        }
        window.typingPageButtonTimeout = null;
    }, 100);
}

// 学習帳ページの初期化
function initializeNotebookPage() {
    console.log('Initializing notebook page...');

    // 既存のタイマーをクリーンアップ
    cleanupTimers();

    // 言語選択リストを動的に更新（1回だけ実行）
    if (window.notebookPageLanguageTimeout) {
        clearTimeout(window.notebookPageLanguageTimeout);
    }
    window.notebookPageLanguageTimeout = setTimeout(() => {
        console.log('Loading available languages for notebook page...');
        loadAvailableLanguages();
        window.notebookPageLanguageTimeout = null;
    }, 300);

    // 新規登録ボタンのイベント設定（少し遅延させて確実にボタンが存在するようにする）
    if (window.notebookPageButtonTimeout) {
        clearTimeout(window.notebookPageButtonTimeout);
    }
    window.notebookPageButtonTimeout = setTimeout(() => {
        const registerButton = document.querySelector('#content-area .btn');
        if (registerButton && registerButton.textContent.includes('新規登録')) {
            // 既存のイベントリスナーを削除してから新しいものを追加
            const newRegisterButton = registerButton.cloneNode(true);
            registerButton.parentNode.replaceChild(newRegisterButton, registerButton);
            newRegisterButton.addEventListener('click', handleStudyBookRegister);
            console.log('Register button event listener added');
        } else {
            console.error('新規登録ボタンが見つかりません');
        }
        window.notebookPageButtonTimeout = null;
    }, 100);
}

// 記録ページの初期化
function initializeRecordsPage() {
    // onclick属性でトグル機能が実装されているため、追加の初期化は不要
    console.log('Records page initialized - using onclick handlers');

    loadRecordsData();
}

// トグルボタンに表示・非表示のイベントリスナーを追加する関数
function setupToggleButtons() {
    console.log('Setting up toggle buttons...');

    const toggleButtons = document.querySelectorAll("#content-area .toggleButton");
    console.log('Found toggle buttons:', toggleButtons.length);

    // 既存のトグルボタンハンドラーをクリーンアップ
    if (window.toggleButtonHandlers) {
        window.toggleButtonHandlers.forEach(handler => {
            if (handler.element && handler.listener) {
                handler.element.removeEventListener('click', handler.listener);
            }
        });
    }
    window.toggleButtonHandlers = [];

    toggleButtons.forEach((button, index) => {
        console.log(`Setting up button ${index}:`, button);

        // 新しいイベントハンドラーを作成
        const clickHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();

            const targetId = this.getAttribute("data-target");
            const targetElement = document.getElementById(targetId);

            console.log('Toggle button clicked:', targetId, targetElement);

            if (!targetElement) {
                console.error(`${targetId}エレメントが見つかりません`);
                return;
            }

            // 表示・非表示をトグル
            if (targetElement.style.display === "none") {
                targetElement.style.display = "block";
                this.classList.add("active");
                this.textContent = "▼";
                console.log('Showing content for:', targetId);
            } else {
                targetElement.style.display = "none";
                this.classList.remove("active");
                this.textContent = "▶";
                console.log('Hiding content for:', targetId);
            }
        };

        // イベントリスナーを追加
        button.addEventListener("click", clickHandler);

        // ハンドラーを記録（後でクリーンアップするため）
        window.toggleButtonHandlers.push({
            element: button,
            listener: clickHandler
        });

        console.log(`Button ${index} event listener added`);
    });

    console.log('Toggle buttons setup complete');
}

// 利用可能な言語リストの読み込み
async function loadAvailableLanguages() {
    // 重複実行を防ぐフラグ
    if (loadAvailableLanguages.isLoading) {
        console.log('Language loading already in progress, skipping...');
        return;
    }

    loadAvailableLanguages.isLoading = true;

    try {
        console.log('Loading available languages...');
        const languages = await rctApi.getAllLanguages();
        console.log('Languages received:', languages);

        // 言語が取得できた場合はそれを使用、できなかった場合はデフォルトを使用
        const allLanguages = languages && languages.length > 0 ? languages : ['Java', 'JavaScript', 'Python3', 'SQL', 'HTML', 'CSS'];
        console.log('All languages:', allLanguages);

        // タイピング練習の言語選択リストを更新（multiple select）
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            console.log('Updating language-select with', allLanguages.length, 'languages');
            languageSelect.innerHTML = '';

            allLanguages.forEach(language => {
                const option = document.createElement('option');
                option.value = language;
                option.textContent = language;
                languageSelect.appendChild(option);
            });

            console.log('Language select updated successfully');
        } else {
            console.warn('language-selectエレメントが見つかりません');
        }

        // 学習帳の言語選択リストを更新（datalist）
        const languagesDatalist = document.getElementById('languages');
        if (languagesDatalist) {
            console.log('Updating languages datalist with', allLanguages.length, 'languages');
            languagesDatalist.innerHTML = '';

            allLanguages.forEach(language => {
                const option = document.createElement('option');
                option.value = language;
                languagesDatalist.appendChild(option);
            });

            console.log('Languages datalist updated successfully');
        } else {
            console.warn('languagesエレメントが見つかりません');
        }

    } catch (error) {
        console.error('言語リストの取得に失敗:', error);

        // エラー時はデフォルトの言語を表示
        const defaultLanguages = ['Java', 'JavaScript', 'Python3', 'SQL', 'HTML', 'CSS'];

        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            console.log('Adding default languages to language-select due to error');
            languageSelect.innerHTML = '';
            defaultLanguages.forEach(language => {
                const option = document.createElement('option');
                option.value = language;
                option.textContent = language;
                languageSelect.appendChild(option);
            });
        } else {
            console.warn('language-selectエレメントが見つかりません（エラー時）');
        }

        const languagesDatalist = document.getElementById('languages');
        if (languagesDatalist) {
            console.log('Adding default languages to datalist due to error');
            languagesDatalist.innerHTML = '';
            defaultLanguages.forEach(language => {
                const option = document.createElement('option');
                option.value = language;
                languagesDatalist.appendChild(option);
            });
        } else {
            console.warn('languagesエレメントが見つかりません（エラー時）');
        }
    } finally {
        loadAvailableLanguages.isLoading = false;
    }
}

// ユーザー統計情報の読み込み
async function loadUserStats() {
    try {
        console.log('Loading user stats...');
        const stats = await rctApi.getStats();
        console.log('Stats received:', stats);

        // タイピングページの統計表示を更新
        const userDataDiv = document.querySelector('.user-data');
        if (userDataDiv) {
            userDataDiv.innerHTML = `
                直近${stats.totalAttempts}問正答率 ${stats.averageAccuracy.toFixed(1)}%<br>
                最高正答率 ${stats.bestAccuracy.toFixed(1)}%
            `;
            console.log('User stats updated successfully');
        } else {
            console.warn('user-dataエレメントが見つかりません');
        }
    } catch (error) {
        console.error('統計情報の取得に失敗:', error);
        console.error('Stats error details:', error.stack);

        // エラー時はデフォルト値を表示
        const userDataDiv = document.querySelector('.user-data');
        if (userDataDiv) {
            userDataDiv.innerHTML = `
                直近0問正答率 0.0%<br>
                最高正答率 0.0%<br>
                <small style="color: red;">統計情報の取得に失敗しました</small>
            `;
        } else {
            console.warn('user-dataエレメントが見つかりません（エラー時）');
        }
    }
}

// タイピングセッション開始
async function startTypingSession() {
    console.log('=== main.js startTypingSession called ===');

    try {
        // 選択された言語を取得
        const languageSelect = document.getElementById('language-select');
        if (!languageSelect) {
            console.error('language-selectエレメントが見つかりません');
            alert('言語選択要素が見つかりません。');
            return;
        }

        const selectedLanguages = Array.from(languageSelect.selectedOptions).map(option => option.text);
        console.log('Selected languages:', selectedLanguages);

        if (selectedLanguages.length === 0) {
            alert('言語を選択してください。');
            return;
        }

        // 問題ソースを取得
        const problemSourceSelect = document.getElementById('problem-source-select');
        if (!problemSourceSelect) {
            console.warn('problem-source-selectエレメントが見つかりません。デフォルト値を使用します。');
        }
        const problemSource = problemSourceSelect ? problemSourceSelect.value : 'system';
        console.log('Problem source:', problemSource);

        // ランダムに1つの言語を選択
        const randomLanguage = selectedLanguages[Math.floor(Math.random() * selectedLanguages.length)];
        console.log('Random language selected:', randomLanguage);

        let problems = [];

        // 問題ソースに応じて問題を取得
        if (problemSource === 'system') {
            console.log('Fetching system problems...');
            problems = await rctApi.getSystemProblemsByLanguage(randomLanguage);
            console.log('System problems received:', problems);
        } else if (problemSource === 'user') {
            console.log('Fetching user problems...');
            problems = await rctApi.getUserProblemsByLanguage(randomLanguage);
            console.log('User problems received:', problems);
        } else if (problemSource === 'mixed') {
            console.log('Fetching mixed problems...');
            const systemProblems = await rctApi.getSystemProblemsByLanguage(randomLanguage);
            const userProblems = await rctApi.getUserProblemsByLanguage(randomLanguage);
            problems = [...systemProblems, ...userProblems];
            console.log('Mixed problems received:', problems.length, '(system:', systemProblems.length, ', user:', userProblems.length, ')');
        }

        if (problems.length === 0) {
            alert(`選択した言語（${randomLanguage}）の問題が見つかりません。問題ソース：${problemSource}`);
            return;
        }

        console.log('Problems found, proceeding to get user settings...');

        // ユーザーの設定を取得
        console.log('Getting user settings...');

        try {
            // content-area内の要素を確実に取得
            const contentArea = document.getElementById('content-area');
            if (!contentArea) {
                console.error('content-areaエレメントが見つかりません');
                alert('コンテンツエリアが見つかりません。');
                return;
            }

            const ruleSelect = contentArea.querySelector('#rule-select');
            const timeSelect = contentArea.querySelector('#time-select');
            const problemCountInput = contentArea.querySelector('#problem-count-input');

            console.log('Form elements found:', {
                contentArea: !!contentArea,
                ruleSelect: !!ruleSelect,
                timeSelect: !!timeSelect,
                problemCountInput: !!problemCountInput
            });

            if (!ruleSelect) {
                console.warn('rule-selectエレメントが見つかりません。デフォルト値を使用します。');
            }
            if (!timeSelect) {
                console.warn('time-selectエレメントが見つかりません。デフォルト値を使用します。');
            }
            if (!problemCountInput) {
                console.warn('problem-count-inputエレメントが見つかりません。デフォルト値を使用します。');
            }

            const rule = ruleSelect ? ruleSelect.value : 'option1';
            const timeLimit = timeSelect ? parseInt(timeSelect.value) || 10 : 10;
            const problemCount = problemCountInput ? parseInt(problemCountInput.value) || 10 : 10;

            console.log('User settings:', { rule, timeLimit, problemCount });

            // 設定をセッションストレージに保存してtyping-practice.htmlに遷移
            const config = {
                problemSource: problemSource,
                languages: selectedLanguages,
                rule: rule,
                timeLimit: timeLimit,
                problemCount: problemCount
            };

            const configStr = JSON.stringify(config);
            console.log('Saving config to sessionStorage:', configStr);
            sessionStorage.setItem('typingSettings', configStr);

            // 保存確認
            const savedConfig = sessionStorage.getItem('typingSettings');
            console.log('Saved config verification:', savedConfig);

            // 設定保存完了
            console.log('設定保存完了');

            console.log('Config saved, redirecting to typing-practice.html');
            // タイピング練習画面に遷移
            window.location.href = 'typing-practice.html';

        } catch (error) {
            console.error('設定取得エラー:', error);
            alert(`設定取得エラー: ${error.message}`);
            return;
        }

    } catch (error) {
        console.error('タイピングセッション開始エラー:', error);
        console.error('Error stack:', error.stack);
        alert(`タイピングセッション開始エラー: ${error.message}`);
    }
}

// 旧タイピング練習関数は削除（typing-practice.htmlを使用）

// タイマークリーンアップ関数
function cleanupTimers() {
    console.log('Cleaning up timers...');

    // メインタイピングタイマーのクリーンアップ
    if (window.typingTimer) {
        clearInterval(window.typingTimer);
        window.typingTimer = null;
        console.log('Typing timer cleared');
    }

    // ページ初期化用タイマーのクリーンアップ
    if (window.typingPageLanguageTimeout) {
        clearTimeout(window.typingPageLanguageTimeout);
        window.typingPageLanguageTimeout = null;
    }

    if (window.typingPageButtonTimeout) {
        clearTimeout(window.typingPageButtonTimeout);
        window.typingPageButtonTimeout = null;
    }

    if (window.notebookPageLanguageTimeout) {
        clearTimeout(window.notebookPageLanguageTimeout);
        window.notebookPageLanguageTimeout = null;
    }

    if (window.notebookPageButtonTimeout) {
        clearTimeout(window.notebookPageButtonTimeout);
        window.notebookPageButtonTimeout = null;
    }

    // 学習帳登録関連のタイマー
    if (window.studyBookRegistrationTimeout) {
        clearTimeout(window.studyBookRegistrationTimeout);
        window.studyBookRegistrationTimeout = null;
    }

    if (window.studyBookReloadTimeout) {
        clearTimeout(window.studyBookReloadTimeout);
        window.studyBookReloadTimeout = null;
    }

    // レスポンシブスタイル関連のタイマー
    if (window.responsiveStyleTimeout) {
        clearTimeout(window.responsiveStyleTimeout);
        window.responsiveStyleTimeout = null;
    }

    // 特別ランクモーダル関連のタイマー
    if (window.specialRankModalTimeout) {
        clearTimeout(window.specialRankModalTimeout);
        window.specialRankModalTimeout = null;
    }

    console.log('Timer cleanup completed');
}

// タイマー開始
function startTimer() {
    // 既存のタイマーをクリーンアップ
    if (window.typingTimer) {
        clearInterval(window.typingTimer);
    }

    window.typingTimer = setInterval(() => {
        const elapsed = Math.floor((new Date() - window.typingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            console.warn('timerエレメントが見つかりません');
        }
    }, 1000);
}

// 正答率更新
function updateAccuracy() {
    const input = document.getElementById('typing-input');
    if (!input) {
        console.error('typing-inputエレメントが見つかりません');
        return;
    }

    const target = window.currentProblem.question;
    let typed = input.value;

    // 改行コードを統一（Windows の \r\n を \n に変換）
    typed = typed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    let correct = 0;

    // 目標文字数分だけ比較（入力が目標より長い場合は目標文字数まで）
    for (let i = 0; i < target.length; i++) {
        if (i < typed.length && typed[i] === target[i]) {
            correct++;
        }
    }

    // 正答率は目標文字数に対する正解文字数の割合
    const accuracy = target.length > 0 ? (correct / target.length * 100) : 0;

    // 完全一致の場合は100%と表示
    const accuracyElement = document.getElementById('accuracy');
    if (accuracyElement) {
        if (typed === target) {
            accuracyElement.textContent = `正答率: 100.0% (完全一致!)`;
        } else {
            accuracyElement.textContent = `正答率: ${accuracy.toFixed(1)}% (${correct}/${target.length})`;
        }
    } else {
        console.error('accuracyエレメントが見つかりません');
    }

    // 進捗表示を更新
    const progressElement = document.getElementById('progress');
    if (progressElement) {
        progressElement.textContent = `進捗: ${Math.min(typed.length, target.length)}/${target.length}`;
    } else {
        console.warn('progressエレメントが見つかりません');
    }

    // 問題文の表示を更新（色分け）
    updateProblemDisplay(typed);
}

// 問題文の表示を更新（正解部分を緑、間違い部分を赤、未入力部分を通常色で表示）
function updateProblemDisplay(typed) {
    const target = window.currentProblem.question;
    const problemTextElement = document.getElementById('problem-text');

    if (!problemTextElement) return;

    // 改行コードを統一（Windows の \r\n を \n に変換）
    typed = typed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    let html = '';

    for (let i = 0; i < target.length; i++) {
        const targetChar = target[i];
        let displayChar = '';

        // 特殊文字を視覚化
        if (targetChar === ' ') {
            displayChar = '<span class="space-indicator">·</span>';
        } else if (targetChar === '\t') {
            displayChar = '<span class="tab-indicator">→</span>';
        } else if (targetChar === '\n') {
            displayChar = '<span class="newline-indicator">↵</span><br>';
        } else {
            displayChar = escapeHtml(targetChar);
        }

        if (i < typed.length) {
            // 入力済みの文字
            if (typed[i] === targetChar) {
                // 正解
                html += `<span class="char-correct">${displayChar}</span>`;
            } else {
                // 間違い - 期待される文字と実際の入力文字を表示
                const typedChar = typed[i];
                let typedDisplay = '';
                let charDescription = '';

                if (typedChar === ' ') {
                    typedDisplay = '<span class="space-indicator">·</span>';
                    charDescription = 'スペース';
                } else if (typedChar === '\t') {
                    typedDisplay = '<span class="tab-indicator">→</span>';
                    charDescription = 'タブ';
                } else if (typedChar === '\n') {
                    typedDisplay = '<span class="newline-indicator">↵</span>';
                    charDescription = '改行';
                } else {
                    typedDisplay = escapeHtml(typedChar);
                    charDescription = typedChar;
                }

                let targetDescription = '';
                if (targetChar === ' ') {
                    targetDescription = 'スペース';
                } else if (targetChar === '\t') {
                    targetDescription = 'タブ';
                } else if (targetChar === '\n') {
                    targetDescription = '改行';
                } else {
                    targetDescription = targetChar;
                }

                html += `<span class="char-incorrect" title="期待: ${targetDescription}, 入力: ${charDescription}">${displayChar}<span class="error-overlay">${typedDisplay}</span></span>`;
            }
        } else if (i === typed.length) {
            // 現在入力すべき文字（カーソル位置）
            html += `<span class="char-current">${displayChar}</span>`;
        } else {
            // 未入力の文字
            html += `<span class="char-pending">${displayChar}</span>`;
        }
    }

    problemTextElement.innerHTML = html;
}

// HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// タイピング完了
async function finishTyping(problemId) {
    // タイマーのクリーンアップ
    if (window.typingTimer) {
        clearInterval(window.typingTimer);
        window.typingTimer = null;
    }

    const input = document.getElementById('typing-input');
    if (!input) {
        console.error('typing-inputエレメントが見つかりません');
        return;
    }

    const target = window.currentProblem.question;
    let typed = input.value;

    // 改行コードを統一（Windows の \r\n を \n に変換）
    typed = typed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 結果計算
    let correctChars = 0;

    // 目標文字数分だけ正確な文字数をカウント
    for (let i = 0; i < target.length; i++) {
        if (i < typed.length && typed[i] === target[i]) {
            correctChars++;
        }
    }

    const durationMs = new Date() - window.typingStartTime;

    try {
        // 結果をサーバーに送信
        await rctApi.saveTypingLog(
            problemId,
            window.typingStartTime.toISOString(),
            durationMs,
            typed.length,
            correctChars
        );

        // 結果表示（目標文字数に対する正答率）
        const accuracy = target.length > 0 ? (correctChars / target.length * 100) : 0;

        // デバッグ情報も表示
        console.log('Target length:', target.length);
        console.log('Typed length:', typed.length);
        console.log('Correct chars:', correctChars);
        console.log('Target (escaped):', JSON.stringify(target));
        console.log('Typed (escaped):', JSON.stringify(typed));

        alert(`タイピング完了！\n正答率: ${accuracy.toFixed(1)}% (${correctChars}/${target.length}文字)\n入力文字数: ${typed.length}文字\n時間: ${Math.floor(durationMs / 1000)}秒`);

        // タイピング設定画面に戻る
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            loadPage('typing.html', { target: activeTab });
        } else {
            console.warn('アクティブなタブが見つかりません');
            loadPage('typing.html');
        }

    } catch (error) {
        console.error('結果保存エラー:', error);
        alert('結果の保存に失敗しました。');
    }
}

// 学習帳登録処理
async function handleStudyBookRegister() {
    console.log('Starting study book registration...');

    try {
        const languageInput = document.getElementById('language-select');
        const questionTextarea = document.querySelector('textarea[placeholder*="問題文"]');
        const explanationTextarea = document.querySelector('textarea[placeholder*="解説"]');

        if (!languageInput) {
            console.error('language-selectエレメントが見つかりません');
            alert('言語選択フィールドが見つかりません。');
            return;
        }

        if (!questionTextarea) {
            console.error('問題文テキストエリアが見つかりません');
            alert('問題文入力フィールドが見つかりません。');
            return;
        }

        if (!explanationTextarea) {
            console.error('解説テキストエリアが見つかりません');
            alert('解説入力フィールドが見つかりません。');
            return;
        }

        const language = languageInput.value.trim();
        const question = questionTextarea.value.trim();
        const explanation = explanationTextarea.value.trim();

        console.log('Form data:', { language, question, explanation });

        if (!language || !question) {
            alert('言語と問題文は必須です。');
            return;
        }

        // 登録前の状態を保存
        console.log('Sending registration request...');
        const result = await rctApi.createStudyBook(language, question, explanation);
        console.log('Registration successful:', result);

        alert('学習帳に登録しました！');

        // フォームをクリア
        languageInput.value = '';
        questionTextarea.value = '';
        explanationTextarea.value = '';

        // 言語リストを更新
        console.log('Updating language lists after registration...');
        if (window.studyBookRegistrationTimeout) {
            clearTimeout(window.studyBookRegistrationTimeout);
        }
        window.studyBookRegistrationTimeout = setTimeout(() => {
            loadAvailableLanguages();
            window.studyBookRegistrationTimeout = null;
        }, 500);

        // 登録後にページを再読み込みして最新の状態を反映
        console.log('Reloading notebook page...');
        if (window.studyBookReloadTimeout) {
            clearTimeout(window.studyBookReloadTimeout);
        }
        window.studyBookReloadTimeout = setTimeout(() => {
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) {
                loadPage('notebook.html', { target: activeTab });
            } else {
                console.warn('アクティブなタブが見つかりません');
                loadPage('notebook.html');
            }
            window.studyBookReloadTimeout = null;
        }, 1000);

    } catch (error) {
        console.error('学習帳登録エラー:', error);
        console.error('Error details:', error.stack);

        // より詳細なエラー情報を表示
        let errorMessage = '登録に失敗しました。';
        if (error.message) {
            errorMessage += `\nエラー: ${error.message}`;
        }
        if (error.status) {
            errorMessage += `\nステータス: ${error.status}`;
        }

        alert(errorMessage + '\n詳細はコンソールを確認してください。');
    }
}

// 記録データの読み込み
async function loadRecordsData() {
    try {
        const stats = await rctApi.getStats();

        // 記録ページの統計表示を更新
        const labelTextContainer = document.querySelector('.label-text-container div');
        if (labelTextContainer) {
            labelTextContainer.innerHTML = `
                <p>直近${stats.totalAttempts}問正答率 ${stats.averageAccuracy.toFixed(1)}%</p>
                <p>最高正答率 ${stats.bestAccuracy.toFixed(1)}%</p>
            `;
        } else {
            console.warn('label-text-containerエレメントが見つかりません');
        }

    } catch (error) {
        console.error('記録データの取得に失敗:', error);
    }
}

// ログアウト処理
function handleLogout() {
    console.log('ログアウト処理開始');
    try {
        if (confirm('ログアウトしますか？')) {
            console.log('ログアウト確認OK');
            rctApi.logout();
        } else {
            console.log('ログアウトキャンセル');
        }
    } catch (error) {
        console.error('ログアウト処理エラー:', error);
        // エラーが発生してもログアウトを実行
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// ユーザー情報表示の更新
function updateUserInfo() {
    const user = rctApi.getUser();
    const loginInfoText = document.querySelector('.login-info-text');

    if (loginInfoText && user.loginId) {
        // 統計情報を取得して表示
        rctApi.getStats().then(stats => {
            // ユーザー名が6文字以上の場合は改行
            const compactText = user.loginId.length >= 6
                ? `Hi! ${user.loginId}!<br>${stats.totalLoginDays}日 login!`
                : `Hi! ${user.loginId}! ${stats.totalLoginDays}日 login!`;

            loginInfoText.innerHTML = `
                <span class="login-text-full">Hello ${user.loginId}さん！<br>連続${stats.currentLoginStreak}日 累計${stats.totalLoginDays}日のログインです</span>
                <span class="login-text-compact">${compactText}</span>
            `;
        }).catch(() => {
            // ユーザー名が6文字以上の場合は改行
            const compactText = user.loginId.length >= 6
                ? `Hi! ${user.loginId}!<br>${user.isDemo ? 'Demo' : 'Login!'}`
                : `Hi! ${user.loginId}! ${user.isDemo ? 'Demo' : 'Login!'}`;

            loginInfoText.innerHTML = `
                <span class="login-text-full">Hello ${user.loginId}さん！<br>${user.isDemo ? 'デモモード' : 'ログイン中'}</span>
                <span class="login-text-compact">${compactText}</span>
            `;
        });
    }
}

// ページがロードされたときの初期化
window.onload = function () {
    console.log('Main page loaded, initializing...');

    // ログインチェック
    if (!rctApi.isLoggedIn()) {
        console.log('User not logged in, redirecting to login page');
        window.location.href = 'login.html';
        return;
    }

    console.log('User is logged in, proceeding with initialization');

    // ユーザー情報表示
    updateUserInfo();

    // ログアウトボタンのイベント設定（ヘッダー内の特定のボタンを選択）
    const logoutButton = document.querySelector('.login-info .btn');
    console.log('ログアウトボタン検索結果:', logoutButton);
    
    if (logoutButton) {
        // 既存のイベントリスナーを削除してから追加（重複防止）
        const newLogoutButton = logoutButton.cloneNode(true);
        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
        
        // クリックイベントを追加
        newLogoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ログアウトボタンがクリックされました');
            handleLogout();
        });
        
        console.log('Logout button event listener added');
    } else {
        console.warn('ログアウトボタンが見つかりません');
        
        // 代替手段：すべてのボタンを検索
        const allButtons = document.querySelectorAll('button, .btn');
        console.log('全ボタン数:', allButtons.length);
        allButtons.forEach((btn, index) => {
            console.log(`ボタン ${index}:`, btn.textContent, btn.className);
        });
    }

    // 初期ページ読み込み
    console.log('Loading initial page: typing.html');
    const activeTab = document.querySelector('.tab.active');
    console.log('Active tab found:', activeTab);

    if (activeTab) {
        loadPage('typing.html', { target: activeTab });
    } else {
        console.warn('アクティブなタブが見つかりません。デフォルトで読み込みます。');
        loadPage('typing.html');
    }
};

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    console.log('Page unloading, performing cleanup...');
    cleanupCurrentPage();
});

// ページ非表示時のクリーンアップ（タブ切り替え等）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden, cleaning up timers...');
        cleanupTimers();
    }
});

// 代替のトグル関数（直接HTMLから呼び出し可能）
function toggleContent(targetId, buttonElement) {
    console.log('Direct toggle called for:', targetId);

    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
        console.error(`${targetId}エレメントが見つかりません`);
        return;
    }

    // 表示・非表示をトグル
    if (targetElement.style.display === "none") {
        targetElement.style.display = "block";
        buttonElement.classList.add("active");
        buttonElement.textContent = "▼";
        console.log('Showing content for:', targetId);
    } else {
        targetElement.style.display = "none";
        buttonElement.classList.remove("active");
        buttonElement.textContent = "▶";
        console.log('Hiding content for:', targetId);
    }
}

// レスポンシブスタイルを強制適用する関数（常に横並びを維持）
function applyResponsiveStyles() {
    console.log('Applying responsive styles (force horizontal layout)...');

    function checkAndApplyStyles() {
        const mainElement = document.querySelector('#content-area .main');
        const boxLeft = document.querySelector('#content-area .main .box-left');
        const boxRight = document.querySelector('#content-area .main .box-right');

        if (mainElement && boxLeft && boxRight) {
            console.log('Forcing horizontal layout for all screen sizes');

            // 常に横並びを維持
            mainElement.style.flexDirection = 'row';
            mainElement.style.gap = '20px';
            mainElement.style.flexWrap = 'nowrap';

            // 左右のボックスを50%幅で固定
            boxLeft.style.width = '50%';
            boxLeft.style.flexShrink = '0';
            boxLeft.style.flexBasis = 'auto';
            boxLeft.style.maxWidth = 'none';
            boxLeft.style.minWidth = '0';

            boxRight.style.width = '50%';
            boxRight.style.flexShrink = '0';
            boxRight.style.flexBasis = 'auto';
            boxRight.style.maxWidth = 'none';
            boxRight.style.minWidth = '0';
            boxRight.style.paddingLeft = '10px';
            boxRight.style.marginTop = '0';

            console.log('Horizontal layout applied successfully');
        } else {
            console.log('Main elements not found yet, retrying...');
            setTimeout(checkAndApplyStyles, 100);
        }
    }

    // 初回適用
    if (window.responsiveStyleTimeout) {
        clearTimeout(window.responsiveStyleTimeout);
    }
    window.responsiveStyleTimeout = setTimeout(() => {
        checkAndApplyStyles();
        window.responsiveStyleTimeout = null;
    }, 50);

    // ウィンドウリサイズ時にも適用（重複防止）
    if (!window.responsiveResizeHandlerAdded) {
        window.addEventListener('resize', checkAndApplyStyles);
        window.responsiveResizeHandlerAdded = true;
    }
}
// 特別ランクのモーダル機能
function setupSpecialRankModal() {
    console.log('Setting up special rank modal functionality...');

    // 特別ランクの要素を取得
    const specialRanks = document.querySelectorAll('.rank-shodan-special, .rank-1-special, .rank-2-special');
    console.log('Special rank elements found:', specialRanks.length);

    specialRanks.forEach((element, index) => {
        console.log(`Adding click listener to special rank ${index + 1}:`, element);

        // 既存のイベントリスナーを削除（重複防止）
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);

        // クリックイベントを追加
        newElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Special rank clicked:', newElement);
            showSpecialRankModal(newElement);
        });
    });

    // モーダルの閉じるボタンのイベント設定
    const modal = document.getElementById('special-rank-modal');
    const closeBtn = modal?.querySelector('.close');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideSpecialRankModal();
        });
    }

    // モーダル背景クリックで閉じる
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideSpecialRankModal();
            }
        });
    }

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSpecialRankModal();
        }
    });

    console.log('Special rank modal setup completed');
}

function showSpecialRankModal(rankElement) {
    console.log('Showing modal for:', rankElement);

    const modal = document.getElementById('special-rank-modal');
    const title = document.getElementById('modal-rank-title');
    const description = document.getElementById('modal-rank-description');

    if (!modal || !title || !description) {
        console.error('Modal elements not found');
        return;
    }

    // ランクの種類を判定
    let rankInfo = {};
    if (rankElement.classList.contains('rank-shodan-special')) {
        rankInfo = {
            title: '初段',
            description: '最高ランクです！<br>2級相当者の2倍以上のパフォーマンスを発揮できます。'
        };
    } else if (rankElement.classList.contains('rank-1-special')) {
        rankInfo = {
            title: '1級',
            description: 'ワープロ検定1級相当の高い技能レベルです。'
        };
    } else if (rankElement.classList.contains('rank-2-special')) {
        rankInfo = {
            title: '2級',
            description: 'ワープロ検定2級相当の実用的な技能レベルです。'
        };
    }

    // モーダル内容を更新
    title.textContent = `${rankInfo.title} - 特別ランク`;
    description.innerHTML = rankInfo.description;

    // モーダルを表示
    modal.style.display = 'flex';
    console.log('Modal displayed successfully');
}

function hideSpecialRankModal() {
    const modal = document.getElementById('special-rank-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal hidden');
    }
}