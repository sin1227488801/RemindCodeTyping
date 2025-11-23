// 電子学習帳のJavaScript

class NotebookManager {
    constructor() {
        this.api = window.rctApi;
        this.currentTab = 'register';
        this.problems = [];
        this.filteredProblems = [];
        this.init();
    }

    async init() {
        console.log('NotebookManager initialized');
        this.setupTabs();
        this.setupRegisterForm();
        await this.loadLanguages();
        await this.loadProblems();
    }

    // タブ切り替え
    setupTabs() {
        const tabs = document.querySelectorAll('.notebook-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // タブボタンの切り替え
        document.querySelectorAll('.notebook-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // コンテンツの切り替え
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // 問題一覧タブに切り替えた時は問題を再読み込み
        if (tabName === 'list') {
            this.loadProblems();
        }
    }

    // 新規登録フォームのセットアップ
    setupRegisterForm() {
        const registerButton = document.getElementById('register-button');
        if (registerButton) {
            registerButton.addEventListener('click', () => this.registerProblem());
        }
    }

    // 言語リストの読み込み
    async loadLanguages() {
        try {
            const languages = await this.api.getAllLanguages();
            console.log('Languages loaded:', languages);

            // 新規登録フォームの言語リスト
            const datalist = document.getElementById('languages');
            if (datalist) {
                datalist.innerHTML = '';
                languages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    datalist.appendChild(option);
                });
            }

            // フィルター用の言語リスト
            const filterSelect = document.getElementById('filter-language');
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">すべて</option>';
                languages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    option.textContent = lang;
                    filterSelect.appendChild(option);
                });

                // フィルター変更イベント
                filterSelect.addEventListener('change', () => this.filterProblems());
            }

        } catch (error) {
            console.error('Failed to load languages:', error);
        }
    }

    // 問題の新規登録
    async registerProblem() {
        const language = document.getElementById('language-select').value.trim();
        const question = document.getElementById('question-input').value.trim();
        const explanation = document.getElementById('explanation-input').value.trim();

        if (!language) {
            alert('言語を入力してください');
            return;
        }

        if (!question) {
            alert('問題文を入力してください');
            return;
        }

        try {
            const result = await this.api.createQuestion({
                language: language,
                question: question,
                explanation: explanation || '',
                category: 'user-created',
                difficulty: 'medium'
            });

            console.log('Problem registered:', result);
            
            // 登録完了の効果音を再生
            if (window.SoundEffects) {
                window.SoundEffects.playRegistered();
            }

            alert('問題を登録しました！');

            // フォームをクリア
            document.getElementById('language-select').value = '';
            document.getElementById('question-input').value = '';
            document.getElementById('explanation-input').value = '';

            // 問題一覧を再読み込み
            await this.loadProblems();

        } catch (error) {
            console.error('Failed to register problem:', error);
            alert('問題の登録に失敗しました: ' + error.message);
        }
    }

    // 問題一覧の読み込み
    async loadProblems() {
        const listContainer = document.getElementById('problems-list');
        if (!listContainer) return;

        listContainer.innerHTML = '<p class="loading-message">読み込み中...</p>';

        try {
            // ユーザーの問題を取得
            this.problems = await this.api.getUserQuestions();
            console.log('Problems loaded:', this.problems);
            
            // デバッグ: 各問題のanswerフィールドを確認
            this.problems.forEach((p, i) => {
                console.log(`Problem ${i}:`, {
                    id: p.id,
                    question: p.question,
                    answer: p.answer,
                    explanation: p.explanation
                });
            });

            this.filteredProblems = [...this.problems];
            this.renderProblems();

        } catch (error) {
            console.error('Failed to load problems:', error);
            listContainer.innerHTML = '<p class="empty-message">問題の読み込みに失敗しました</p>';
        }
    }

    // フィルター処理
    filterProblems() {
        const filterLanguage = document.getElementById('filter-language').value;

        if (filterLanguage) {
            this.filteredProblems = this.problems.filter(p => p.language === filterLanguage);
        } else {
            this.filteredProblems = [...this.problems];
        }

        this.renderProblems();
    }

    // 問題一覧の描画
    renderProblems() {
        const listContainer = document.getElementById('problems-list');
        if (!listContainer) return;

        if (this.filteredProblems.length === 0) {
            listContainer.innerHTML = '<p class="empty-message">登録された問題がありません</p>';
            return;
        }

        listContainer.innerHTML = '';

        this.filteredProblems.forEach(problem => {
            const item = this.createProblemItem(problem);
            listContainer.appendChild(item);
        });
    }

    // 問題アイテムの作成
    createProblemItem(problem) {
        const item = document.createElement('div');
        item.className = 'problem-item';

        // ヘッダー（records.htmlと同じスタイル）
        const header = document.createElement('div');
        header.className = 'label-button-container';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'problem-header-left';

        const language = document.createElement('span');
        language.className = 'problem-language';
        language.textContent = problem.language;

        const questionPreview = document.createElement('span');
        questionPreview.className = 'problem-question-preview';
        questionPreview.textContent = problem.question.substring(0, 40) + (problem.question.length > 40 ? '...' : '');

        headerLeft.appendChild(language);
        headerLeft.appendChild(questionPreview);

        const actions = document.createElement('div');
        actions.className = 'problem-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteProblem(problem.id);
        });

        // トグルボタン（records.htmlと同じスタイル）
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggleButton';
        toggleBtn.setAttribute('data-target', `problem-${problem.id}`);

        actions.appendChild(deleteBtn);
        actions.appendChild(toggleBtn);
        
        header.appendChild(headerLeft);
        header.appendChild(actions);

        // コンテンツ（折りたたみ可能）
        const content = document.createElement('div');
        content.className = 'toggleContent';
        content.id = `problem-${problem.id}`;
        content.style.display = 'none';

        const questionDiv = document.createElement('div');
        questionDiv.className = 'problem-question';
        questionDiv.textContent = problem.question;

        content.appendChild(questionDiv);

        // 解説がある場合のみ表示
        const answerText = problem.answer || problem.explanation || '';
        if (answerText.trim()) {
            const explanationLabel = document.createElement('div');
            explanationLabel.className = 'problem-explanation-label';
            explanationLabel.textContent = '解説:';

            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'problem-explanation';
            explanationDiv.textContent = answerText;

            content.appendChild(explanationLabel);
            content.appendChild(explanationDiv);
        }

        item.appendChild(header);
        item.appendChild(content);

        // トグル機能（records.htmlと同じ動作）
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = content.style.display === 'block';
            content.style.display = isOpen ? 'none' : 'block';
            toggleBtn.classList.toggle('active', !isOpen);
        });

        return item;
    }

    // 問題の削除
    async deleteProblem(problemId) {
        if (!confirm('この問題を削除しますか？')) {
            return;
        }

        try {
            await this.api.deleteQuestion(problemId);
            console.log('Problem deleted:', problemId);
            alert('問題を削除しました');

            // 問題一覧を再読み込み
            await this.loadProblems();

        } catch (error) {
            console.error('Failed to delete problem:', error);
            alert('問題の削除に失敗しました: ' + error.message);
        }
    }
}

// グローバルスコープに公開
window.NotebookManager = NotebookManager;
