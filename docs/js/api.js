// UUID生成関数
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// RCT API接続クラス
class RctApi {
    constructor() {
        this.baseUrl = 'https://remindcodetyping.onrender.com/api/v1';
        this.userId = this.getCurrentUserId();
        console.log('RctApi initialized - baseUrl:', this.baseUrl);
        console.log('RctApi initialized - userId:', this.userId);
    }

    // 現在のユーザーIDを取得
    getCurrentUserId() {
        const currentUser = localStorage.getItem('currentUser');
        console.log('getCurrentUserId - currentUser from localStorage:', currentUser);
        if (currentUser) {
            try {
                const userData = JSON.parse(currentUser);
                console.log('getCurrentUserId - parsed userData:', userData);
                console.log('getCurrentUserId - returning userId:', userData.id);
                return userData.id;
            } catch (e) {
                console.error('Error parsing current user data:', e);
            }
        }
        console.log('getCurrentUserId - returning null');
        return null;
    }

    // 基本的なHTTPリクエスト
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // ユーザーIDヘッダーを追加
        if (this.userId) {
            config.headers['X-User-Id'] = this.userId;
        }

        console.log(`API Request: ${url}`, config);

        try {
            const response = await fetch(url, config);

            console.log(`API Response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error Response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`API Response Data:`, data);
                return data;
            }

            return response;

        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // 学習帳取得
    async getStudyBooks() {
        return await this.request('/study-books');
    }

    // 問題検索
    async searchQuestions(query) {
        return await this.request(`/search/questions?q=${encodeURIComponent(query)}`);
    }

    // 言語一覧取得
    async getAllLanguages() {
        try {
            // システム言語を取得
            const systemLanguages = await this.request('/studybooks/languages');
            
            // ユーザーの学習帳から言語を取得
            const userLanguages = await this.getUserLanguages();
            
            // 重複を除いて統合
            const allLanguages = [...new Set([...systemLanguages, ...userLanguages])];
            
            console.log('統合された言語リスト:', {
                systemLanguages,
                userLanguages,
                allLanguages
            });
            
            return allLanguages;
        } catch (error) {
            console.warn('言語一覧の取得に失敗しました:', error);
            return ['JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS']; // デフォルト言語
        }
    }

    // ユーザーの学習帳から言語を取得
    async getUserLanguages() {
        try {
            const studyBooks = await this.request('/study-books');
            const languages = new Set();
            
            for (const book of studyBooks) {
                try {
                    const questions = await this.request(`/questions/?study_book_id=${book.id}`);
                    questions.forEach(q => {
                        if (q.language) {
                            languages.add(q.language);
                        }
                    });
                } catch (error) {
                    console.warn(`学習帳 ${book.id} の問題取得に失敗:`, error);
                }
            }
            
            return Array.from(languages);
        } catch (error) {
            console.warn('ユーザー言語の取得に失敗しました:', error);
            return [];
        }
    }

    // 統計情報取得
    async getStats() {
        try {
            // ローカルユーザーの場合はローカルストレージから統計を取得
            if (this.isLocalUser()) {
                return this.getLocalStats();
            }

            const backendStats = await this.request('/typing/stats');
            console.log('バックエンドから取得した統計情報:', backendStats);

            // バックエンドユーザーでもローカルタイピングログがある場合はそれを使用
            const localTypingLogs = JSON.parse(localStorage.getItem('typingLogs') || '[]');
            let totalProblems, totalCorrectProblems;
            
            if (localTypingLogs.length > 0) {
                // ローカルタイピングログから実際の問題数を計算
                const localStats = this.calculateStatsFromLogs(localTypingLogs);
                totalProblems = localStats.totalProblems;
                totalCorrectProblems = localStats.totalCorrectProblems;
                
                // ローカルログがある場合は、より正確な正答率を使用
                const localAccuracy = localStats.averageAccuracy;
                console.log('バックエンドユーザーでもローカルログから統計を計算:', {
                    totalProblems, 
                    totalCorrectProblems,
                    localAccuracy,
                    backendAccuracy: (backendStats.averageAccuracy || 0) * 100
                });
                
                // ローカル統計がより正確な場合はそれを使用
                if (localTypingLogs.length >= 3) { // 3回以上の記録がある場合
                    return {
                        ...this.getLocalStats(),
                        // バックエンドのWPM情報は保持
                        averageWpm: backendStats.averageWpm || 0,
                        bestWpm: backendStats.bestWpm || 0
                    };
                }
            } else {
                // ローカルログがない場合は推定（小数点以下を保持）
                totalProblems = (backendStats.totalAttempts || 0) * 10;
                totalCorrectProblems = Math.round(totalProblems * (backendStats.averageAccuracy || 0) * 10) / 10;
            }

            // バックエンドの統計情報を0-100の範囲に変換
            const backendAccuracy = (backendStats.averageAccuracy || 0) * 100;
            
            const convertedStats = {
                totalAttempts: backendStats.totalAttempts || 0,
                averageAccuracy: Math.round(backendAccuracy * 10) / 10, // 小数点1桁で丸める
                recent100ProblemsScore: Math.round((backendStats.averageWpm || 0) * 0.6 * 10) / 10, // WPMからスコア推定
                averageWpm: backendStats.averageWpm || 0,
                bestWpm: backendStats.bestWpm || 0,
                recentAccuracy: Math.round(backendAccuracy * 10) / 10, // 小数点1桁で丸める
                highestRank: this.calculateRankFromAccuracy(backendAccuracy),
                totalSessions: backendStats.totalAttempts || 0,
                totalProblems: totalProblems,
                totalCorrectProblems: totalCorrectProblems
            };

            console.log('変換後の統計情報:', convertedStats);
            return convertedStats;
        } catch (error) {
            console.warn('統計情報の取得に失敗しました:', error);
            return this.getLocalStats();
        }
    }

    // ローカルユーザーかどうかを判定
    isLocalUser() {
        const currentUser = this.getCurrentUser();
        return currentUser && currentUser.isLocalOnly === true;
    }

    // ローカル統計情報を取得
    getLocalStats() {
        const localStats = JSON.parse(localStorage.getItem('localTypingStats') || '{}');
        const typingLogs = JSON.parse(localStorage.getItem('typingLogs') || '[]');

        console.log('デバッグ - localStats:', localStats);
        console.log('デバッグ - typingLogs:', typingLogs);

        // 古いlocalTypingStatsが新しい計算を妨げている場合はクリア
        if (typingLogs.length > 0 && localStats.averageAccuracy) {
            console.log('古いlocalTypingStatsをクリアして、タイピングログから再計算します');
            console.log('手動でクリアする場合: localStorage.removeItem("localTypingStats")');
            localStorage.removeItem('localTypingStats');
        }

        // タイピングログから実際の統計を計算
        const calculatedStats = this.calculateStatsFromLogs(typingLogs);
        
        console.log('デバッグ - calculatedStats:', calculatedStats);

        const result = {
            recentAccuracy: calculatedStats.averageAccuracy,
            highestRank: calculatedStats.rank,
            totalSessions: calculatedStats.totalSessions,
            averageWpm: calculatedStats.averageWpm,
            bestWpm: calculatedStats.bestWpm,
            totalAttempts: calculatedStats.totalSessions,
            averageAccuracy: calculatedStats.averageAccuracy,
            recent100ProblemsScore: calculatedStats.recent100ProblemsScore,
            totalProblems: calculatedStats.totalProblems,
            totalCorrectProblems: calculatedStats.totalCorrectProblems
        };
        
        console.log('デバッグ - getLocalStats結果:', result);
        return result;
    }

    // 言語別統計を取得
    async getLanguageStats() {
        try {
            const typingLogs = JSON.parse(localStorage.getItem('typingLogs') || '[]');
            
            console.log('デバッグ - 全タイピングログ:', typingLogs);
            
            if (typingLogs.length === 0) {
                return {
                    bestLanguage: null,
                    worstLanguage: null
                };
            }

            // 言語情報とスコア情報があるログのみをフィルタリング
            const validLogs = typingLogs.filter(log => {
                const hasLanguage = log.language && log.language !== 'Unknown';
                const hasScore = log.score !== undefined && log.score !== null;
                
                if (!hasLanguage || !hasScore) {
                    console.log('無効なログをスキップ:', {
                        language: log.language,
                        score: log.score,
                        timestamp: log.timestamp
                    });
                }
                
                return hasLanguage && hasScore;
            });

            console.log('有効なログ数:', validLogs.length, '/ 全ログ数:', typingLogs.length);

            if (validLogs.length === 0) {
                console.warn('言語情報とスコア情報を持つログが見つかりません');
                return {
                    bestLanguage: null,
                    worstLanguage: null
                };
            }

            // 言語別にスコアを集計
            const languageScores = {};
            
            validLogs.forEach(log => {
                const language = log.language;
                const score = log.score;
                
                if (!languageScores[language]) {
                    languageScores[language] = {
                        totalScore: 0,
                        count: 0,
                        language: language
                    };
                }
                
                languageScores[language].totalScore += score;
                languageScores[language].count += 1;
            });

            // 平均スコアを計算
            const languageStats = Object.values(languageScores).map(stat => ({
                language: stat.language,
                averageScore: stat.totalScore / stat.count,
                count: stat.count
            }));

            // スコアでソート
            languageStats.sort((a, b) => b.averageScore - a.averageScore);

            console.log('言語別統計:', languageStats);

            return {
                bestLanguage: languageStats.length > 0 ? languageStats[0] : null,
                worstLanguage: languageStats.length > 0 ? languageStats[languageStats.length - 1] : null,
                allLanguages: languageStats
            };
        } catch (error) {
            console.error('言語別統計の取得に失敗:', error);
            return {
                bestLanguage: null,
                worstLanguage: null
            };
        }
    }

    // 現在のユーザー情報を取得
    getCurrentUser() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            return currentUser ? JSON.parse(currentUser) : null;
        } catch (e) {
            console.error('ユーザー情報の取得に失敗:', e);
            return null;
        }
    }

    // 精度からランクを計算
    calculateRankFromAccuracy(accuracy) {
        if (accuracy >= 95) return 'Expert';
        if (accuracy >= 85) return 'Advanced';
        if (accuracy >= 70) return 'Intermediate';
        return 'Beginner';
    }

    // タイピングログから統計を計算
    calculateStatsFromLogs(logs) {
        if (!logs || logs.length === 0) {
            return {
                totalSessions: 0,
                totalProblems: 0,
                totalCorrectProblems: 0,
                averageAccuracy: 85.0,
                recent100ProblemsScore: 0.0,
                averageWpm: 0,
                bestWpm: 0,
                rank: 'Beginner'
            };
        }

        // デバッグ：ログの構造を確認
        console.log('デバッグ - 全ログの詳細:', logs.map((log, index) => ({
            index,
            startedAt: log.startedAt,
            timestamp: log.timestamp,
            totalChars: log.totalChars,
            accuracy: log.accuracy,
            wpm: log.wpm
        })));

        // 一時的に従来の方法に戻す（デバッグ用）
        // const sessions = this.groupLogsBySession(logs);
        // let totalSessions = sessions.length;
        let totalSessions = logs.length;
        let totalProblems = 0;
        let totalCorrectProblems = 0;
        let totalWpm = 0;
        let bestWpm = 0;

        // 直近100問のスコア計算用
        let recentProblems = [];

        logs.forEach((log, index) => {
            // 実際の問題数情報がある場合はそれを使用、なければ推定
            let sessionProblems, sessionCorrectProblems;
            
            if (log.totalProblems !== undefined && log.correctProblems !== undefined) {
                // 新しいログ形式：実際の問題数情報を使用
                sessionProblems = log.totalProblems;
                sessionCorrectProblems = log.correctProblems;
            } else {
                // 古いログ形式：推定値を使用（1問として扱う）
                sessionProblems = 1;
                sessionCorrectProblems = log.accuracy || 0;
            }

            console.log(`デバッグ - ログ${index}:`, {
                sessionProblems,
                sessionCorrectProblems,
                accuracy: log.accuracy,
                totalProblems: log.totalProblems,
                correctProblems: log.correctProblems,
                totalChars: log.totalChars
            });

            totalProblems += sessionProblems;
            totalCorrectProblems += sessionCorrectProblems;

            // WPM統計
            const wpm = log.wpm || 0;
            totalWpm += wpm;
            bestWpm = Math.max(bestWpm, wpm);

            // 直近100問のスコア計算用データを収集
            const sessionScore = log.score || 0;
            for (let i = 0; i < sessionProblems; i++) {
                recentProblems.push({
                    score: sessionScore,
                    timestamp: log.timestamp
                });
            }
        });

        // 直近100問のスコア平均を計算
        const recent100ProblemsScore = this.calculateRecent100ProblemsScore(recentProblems);

        const averageAccuracy = totalProblems > 0 ? (totalCorrectProblems / totalProblems) * 100 : 85.0;
        const averageWpm = totalSessions > 0 ? Math.round(totalWpm / totalSessions) : 0;
        const rank = this.calculateRankFromAccuracy(averageAccuracy);

        console.log('デバッグ - 最終計算結果:', {
            totalSessions,
            totalProblems,
            totalCorrectProblems,
            averageAccuracy,
            recent100ProblemsScore
        });

        return {
            totalSessions,
            totalProblems,
            totalCorrectProblems,
            averageAccuracy: Math.round(averageAccuracy * 10) / 10,
            recent100ProblemsScore: Math.round(recent100ProblemsScore * 10) / 10,
            averageWpm,
            bestWpm,
            rank
        };
    }

    // ログをセッションごとにグループ化
    groupLogsBySession(logs) {
        if (!logs || logs.length === 0) {
            return [];
        }

        // タイムスタンプでソート
        const sortedLogs = logs.sort((a, b) => {
            const timeA = new Date(a.startedAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.startedAt || b.timestamp || 0).getTime();
            return timeA - timeB;
        });

        const sessions = [];
        let currentSession = [sortedLogs[0]];
        let lastTime = new Date(sortedLogs[0].startedAt || sortedLogs[0].timestamp || 0).getTime();

        for (let i = 1; i < sortedLogs.length; i++) {
            const currentTime = new Date(sortedLogs[i].startedAt || sortedLogs[i].timestamp || 0).getTime();
            const timeDiff = currentTime - lastTime;

            // 5分以内（300,000ミリ秒）なら同一セッション
            if (timeDiff <= 300000) {
                currentSession.push(sortedLogs[i]);
            } else {
                // 新しいセッション開始
                sessions.push(currentSession);
                currentSession = [sortedLogs[i]];
            }
            lastTime = currentTime;
        }

        // 最後のセッションを追加
        if (currentSession.length > 0) {
            sessions.push(currentSession);
        }

        console.log('デバッグ - セッショングループ化結果:', {
            totalLogs: logs.length,
            totalSessions: sessions.length,
            sessionsDetail: sessions.map(session => ({
                logCount: session.length,
                startTime: session[0].startedAt || session[0].timestamp,
                endTime: session[session.length - 1].startedAt || session[session.length - 1].timestamp
            }))
        });

        return sessions;
    }

    // 直近100問のスコア平均を計算
    calculateRecent100ProblemsScore(recentProblems) {
        if (!recentProblems || recentProblems.length === 0) {
            return 0.0;
        }

        // タイムスタンプでソート（新しい順）
        const sortedProblems = recentProblems.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
        });

        // 直近100問を取得
        const recent100 = sortedProblems.slice(0, 100);

        if (recent100.length === 0) {
            return 0.0;
        }

        // スコアの平均を計算
        const totalScore = recent100.reduce((sum, problem) => sum + (problem.score || 0), 0);
        return totalScore / recent100.length;
    }

    // 言語名の正規化（バックエンドAPIの言語名に合わせる）
    normalizeLanguageName(language) {
        const languageMap = {
            'Javascript': 'JavaScript',
            'javascript': 'JavaScript',
            'Python': 'Python3',
            'python': 'Python3',
            'Html': 'Html',
            'html': 'Html',
            'Css': 'Css',
            'css': 'Css',
            'Php': 'Php',
            'php': 'Php',
            'Java': 'Java',
            'java': 'Java',
            'Sql': 'Sql',
            'sql': 'Sql',
            'Git': 'Git',
            'git': 'Git',
            'Linux (Red Hat)': 'Linux (Red Hat)',
            'Linux(Debian)': 'Linux(Debian)',
            'linux': 'Linux (Red Hat)' // デフォルトでRed Hat
        };

        return languageMap[language] || language;
    }

    // システム問題取得
    async getSystemProblemsByLanguage(language) {
        try {
            return await this.request(`/studybooks/system-problems/${language}`);
        } catch (error) {
            console.warn(`システム問題の取得に失敗しました (${language}):`, error);
            return this.getDefaultProblems(language);
        }
    }

    // ユーザー問題取得
    async getUserProblemsByLanguage(language) {
        try {
            console.log(`ユーザー問題を取得中... 言語: ${language}`);
            
            // ユーザー問題は学習帳から取得
            const studyBooks = await this.request('/study-books');
            console.log(`取得した学習帳数: ${studyBooks.length}`, studyBooks);
            
            const userProblems = [];

            for (const book of studyBooks) {
                console.log(`学習帳 ${book.id} の問題を取得中...`);
                
                // 正しいエンドポイントを使用
                const questions = await this.request(`/questions/?study_book_id=${book.id}`);
                console.log(`学習帳 ${book.id} の問題数: ${questions.length}`, questions);
                
                const languageQuestions = questions.filter(q => {
                    const matches = q.language.toLowerCase() === language.toLowerCase();
                    console.log(`問題の言語: ${q.language}, 検索言語: ${language}, 一致: ${matches}`);
                    return matches;
                });
                
                console.log(`言語 ${language} に一致する問題数: ${languageQuestions.length}`);
                userProblems.push(...languageQuestions);
            }

            console.log(`最終的なユーザー問題数: ${userProblems.length}`, userProblems);
            return userProblems;
        } catch (error) {
            console.error(`ユーザー問題の取得に失敗しました (${language}):`, error);
            console.error('エラー詳細:', error.stack);
            return [];
        }
    }

    // 学習帳作成
    async createStudyBook(language, question, explanation) {
        // まず学習帳を作成
        const studyBook = await this.request('/study-books', {
            method: 'POST',
            body: JSON.stringify({
                title: `${language} 学習帳`,
                description: `${language}の学習問題集`
            })
        });

        // 次に問題を追加（正しいエンドポイントを使用）
        const questionData = await this.request(`/questions/?study_book_id=${studyBook.id}`, {
            method: 'POST',
            body: JSON.stringify({
                language: language,
                category: 'General',
                difficulty: 'medium',
                question: question,
                answer: explanation
            })
        });

        return { studyBook, question: questionData };
    }

    // デモログイン
    async demoLogin() {
        const userData = {
            id: '176c6aeb-297e-4033-8c96-abc8cd7c474a', // 実際に存在するユーザーUUID (Alice Johnson)
            name: 'デモユーザー (Alice Johnson)',
            email: 'demo@example.com',
            loginId: 'demo'
        };
        this.setUser(userData);
        return userData;
    }

    // デフォルト問題を返す（バックエンドが利用できない場合）
    getDefaultProblems(language) {
        const defaultProblems = {
            'JavaScript': [
                { id: 'js1', question: 'console.log("Hello World");', answer: 'コンソールに文字列を出力' },
                { id: 'js2', question: 'const arr = [1, 2, 3];', answer: '配列の定義' },
                { id: 'js3', question: 'function add(a, b) { return a + b; }', answer: '関数の定義' },
                { id: 'js4', question: 'let x = 10;', answer: '変数の宣言' },
                { id: 'js5', question: 'if (x > 5) { return true; }', answer: '条件分岐' },
                { id: 'js6', question: 'for (let i = 0; i < 10; i++) {}', answer: 'forループ' },
                { id: 'js7', question: 'const obj = { name: "test" };', answer: 'オブジェクトの定義' },
                { id: 'js8', question: 'arr.push(4);', answer: '配列に要素を追加' },
                { id: 'js9', question: 'const result = arr.map(x => x * 2);', answer: '配列のmap関数' },
                { id: 'js10', question: 'try { code(); } catch (e) {}', answer: '例外処理' },
                { id: 'js11', question: 'const promise = new Promise();', answer: 'Promise作成' },
                { id: 'js12', question: 'async function getData() {}', answer: '非同期関数' },
                { id: 'js13', question: 'const { name } = obj;', answer: '分割代入' },
                { id: 'js14', question: 'class MyClass {}', answer: 'クラス定義' },
                { id: 'js15', question: 'import React from "react";', answer: 'モジュールのインポート' },
                { id: 'js16', question: 'export default function() {}', answer: 'デフォルトエクスポート' },
                { id: 'js17', question: 'const sum = (a, b) => a + b;', answer: 'アロー関数' },
                { id: 'js18', question: 'JSON.stringify(obj);', answer: 'JSONに変換' },
                { id: 'js19', question: 'setTimeout(() => {}, 1000);', answer: 'タイマー設定' },
                { id: 'js20', question: 'document.getElementById("test");', answer: 'DOM要素取得' }
            ],
            'Python': [
                { id: 'py1', question: 'print("Hello World")', answer: '文字列の出力' },
                { id: 'py2', question: 'list = [1, 2, 3]', answer: 'リストの定義' },
                { id: 'py3', question: 'def add(a, b): return a + b', answer: '関数の定義' },
                { id: 'py4', question: 'x = 10', answer: '変数の代入' },
                { id: 'py5', question: 'if x > 5: return True', answer: '条件分岐' },
                { id: 'py6', question: 'for i in range(10):', answer: 'forループ' },
                { id: 'py7', question: 'dict = {"name": "test"}', answer: '辞書の定義' },
                { id: 'py8', question: 'list.append(4)', answer: 'リストに要素を追加' },
                { id: 'py9', question: 'result = [x * 2 for x in list]', answer: 'リスト内包表記' },
                { id: 'py10', question: 'try: code() except:', answer: '例外処理' },
                { id: 'py11', question: 'import os', answer: 'モジュールのインポート' },
                { id: 'py12', question: 'class MyClass:', answer: 'クラス定義' },
                { id: 'py13', question: 'with open("file.txt") as f:', answer: 'ファイル操作' },
                { id: 'py14', question: 'lambda x: x * 2', answer: 'ラムダ関数' },
                { id: 'py15', question: 'str.split(",")', answer: '文字列分割' },
                { id: 'py16', question: 'len(list)', answer: 'リストの長さ' },
                { id: 'py17', question: 'range(1, 11)', answer: '数値範囲' },
                { id: 'py18', question: 'enumerate(list)', answer: 'インデックス付きループ' },
                { id: 'py19', question: 'zip(list1, list2)', answer: 'リストの結合' },
                { id: 'py20', question: 'json.dumps(dict)', answer: 'JSONに変換' }
            ],
            'Java': [
                { id: 'java1', question: 'System.out.println("Hello World");', answer: '文字列の出力' },
                { id: 'java2', question: 'int[] arr = {1, 2, 3};', answer: '配列の定義' },
                { id: 'java3', question: 'public int add(int a, int b) { return a + b; }', answer: 'メソッドの定義' },
                { id: 'java4', question: 'int x = 10;', answer: '変数の宣言' },
                { id: 'java5', question: 'if (x > 5) { return true; }', answer: '条件分岐' },
                { id: 'java6', question: 'for (int i = 0; i < 10; i++) {}', answer: 'forループ' },
                { id: 'java7', question: 'String str = "test";', answer: '文字列の宣言' },
                { id: 'java8', question: 'List<Integer> list = new ArrayList<>();', answer: 'リストの作成' },
                { id: 'java9', question: 'list.add(4);', answer: 'リストに要素を追加' },
                { id: 'java10', question: 'try { code(); } catch (Exception e) {}', answer: '例外処理' },
                { id: 'java11', question: 'public class MyClass {}', answer: 'クラス定義' },
                { id: 'java12', question: 'private String name;', answer: 'フィールド定義' },
                { id: 'java13', question: 'public MyClass() {}', answer: 'コンストラクタ' },
                { id: 'java14', question: 'import java.util.*;', answer: 'パッケージのインポート' },
                { id: 'java15', question: 'static final int MAX = 100;', answer: '定数の定義' },
                { id: 'java16', question: 'while (condition) {}', answer: 'whileループ' },
                { id: 'java17', question: 'switch (value) { case 1: break; }', answer: 'switch文' },
                { id: 'java18', question: 'String.valueOf(number);', answer: '文字列変換' },
                { id: 'java19', question: 'arr.length', answer: '配列の長さ' },
                { id: 'java20', question: 'Math.max(a, b);', answer: '最大値取得' }
            ],
            'Html': [
                { id: 'html1', question: '<html><head></head><body></body></html>', answer: '基本的なHTML構造' },
                { id: 'html2', question: '<h1>タイトル</h1>', answer: '見出しタグ' },
                { id: 'html3', question: '<p>段落テキスト</p>', answer: '段落タグ' },
                { id: 'html4', question: '<a href="url">リンク</a>', answer: 'リンクタグ' },
                { id: 'html5', question: '<img src="image.jpg" alt="画像">', answer: '画像タグ' },
                { id: 'html6', question: '<div class="container"></div>', answer: 'divタグ' },
                { id: 'html7', question: '<span id="text">テキスト</span>', answer: 'spanタグ' },
                { id: 'html8', question: '<ul><li>項目</li></ul>', answer: 'リストタグ' },
                { id: 'html9', question: '<table><tr><td>セル</td></tr></table>', answer: 'テーブルタグ' },
                { id: 'html10', question: '<form action="submit"></form>', answer: 'フォームタグ' },
                { id: 'html11', question: '<input type="text" name="name">', answer: '入力フィールド' },
                { id: 'html12', question: '<button type="submit">送信</button>', answer: 'ボタンタグ' },
                { id: 'html13', question: '<meta charset="UTF-8">', answer: 'メタタグ' },
                { id: 'html14', question: '<title>ページタイトル</title>', answer: 'タイトルタグ' },
                { id: 'html15', question: '<link rel="stylesheet" href="style.css">', answer: 'CSSリンク' },
                { id: 'html16', question: '<script src="script.js"></script>', answer: 'JavaScriptリンク' },
                { id: 'html17', question: '<br>', answer: '改行タグ' },
                { id: 'html18', question: '<hr>', answer: '水平線タグ' },
                { id: 'html19', question: '<strong>強調</strong>', answer: '強調タグ' },
                { id: 'html20', question: '<em>斜体</em>', answer: '斜体タグ' }
            ],
            'Css': [
                { id: 'css1', question: 'color: red;', answer: '文字色の設定' },
                { id: 'css2', question: 'background-color: blue;', answer: '背景色の設定' },
                { id: 'css3', question: 'font-size: 16px;', answer: 'フォントサイズ' },
                { id: 'css4', question: 'margin: 10px;', answer: '外側の余白' },
                { id: 'css5', question: 'padding: 5px;', answer: '内側の余白' },
                { id: 'css6', question: 'border: 1px solid black;', answer: 'ボーダーの設定' },
                { id: 'css7', question: 'width: 100px;', answer: '幅の設定' },
                { id: 'css8', question: 'height: 50px;', answer: '高さの設定' },
                { id: 'css9', question: 'display: flex;', answer: 'フレックスボックス' },
                { id: 'css10', question: 'position: absolute;', answer: '絶対位置' },
                { id: 'css11', question: 'text-align: center;', answer: 'テキスト中央揃え' },
                { id: 'css12', question: 'float: left;', answer: '左フロート' },
                { id: 'css13', question: 'z-index: 10;', answer: '重ね順' },
                { id: 'css14', question: 'opacity: 0.5;', answer: '透明度' },
                { id: 'css15', question: 'transform: rotate(45deg);', answer: '回転変形' },
                { id: 'css16', question: 'transition: all 0.3s;', answer: 'トランジション' },
                { id: 'css17', question: 'box-shadow: 2px 2px 5px gray;', answer: 'ボックスシャドウ' },
                { id: 'css18', question: 'border-radius: 5px;', answer: '角丸' },
                { id: 'css19', question: 'font-weight: bold;', answer: 'フォント太さ' },
                { id: 'css20', question: 'line-height: 1.5;', answer: '行の高さ' }
            ],
            'Python3': [
                { id: 'py3_1', question: 'print("Hello World")', answer: '文字列の出力' },
                { id: 'py3_2', question: 'list = [1, 2, 3]', answer: 'リストの定義' },
                { id: 'py3_3', question: 'def add(a, b): return a + b', answer: '関数の定義' },
                { id: 'py3_4', question: 'x = 10', answer: '変数の代入' },
                { id: 'py3_5', question: 'if x > 5: return True', answer: '条件分岐' },
                { id: 'py3_6', question: 'for i in range(10):', answer: 'forループ' },
                { id: 'py3_7', question: 'dict = {"name": "test"}', answer: '辞書の定義' },
                { id: 'py3_8', question: 'list.append(4)', answer: 'リストに要素を追加' },
                { id: 'py3_9', question: 'result = [x * 2 for x in list]', answer: 'リスト内包表記' },
                { id: 'py3_10', question: 'try: code() except Exception as e:', answer: '例外処理' },
                { id: 'py3_11', question: 'import numpy as np', answer: 'モジュールのインポート' },
                { id: 'py3_12', question: 'class MyClass:', answer: 'クラス定義' },
                { id: 'py3_13', question: 'with open("file.txt", "r") as f:', answer: 'ファイル操作' },
                { id: 'py3_14', question: 'lambda x: x ** 2', answer: 'ラムダ関数' },
                { id: 'py3_15', question: 'str.split(",")', answer: '文字列分割' },
                { id: 'py3_16', question: 'len(list)', answer: 'リストの長さ' },
                { id: 'py3_17', question: 'range(1, 11)', answer: '数値範囲' },
                { id: 'py3_18', question: 'enumerate(list)', answer: 'インデックス付きループ' },
                { id: 'py3_19', question: 'zip(list1, list2)', answer: 'リストの結合' },
                { id: 'py3_20', question: 'json.dumps(dict)', answer: 'JSONに変換' }
            ],
            'Php': [
                { id: 'php1', question: '<?php echo "Hello World"; ?>', answer: '文字列の出力' },
                { id: 'php2', question: '$arr = array(1, 2, 3);', answer: '配列の定義' },
                { id: 'php3', question: 'function add($a, $b) { return $a + $b; }', answer: '関数の定義' },
                { id: 'php4', question: '$x = 10;', answer: '変数の代入' },
                { id: 'php5', question: 'if ($x > 5) { return true; }', answer: '条件分岐' },
                { id: 'php6', question: 'for ($i = 0; $i < 10; $i++) {}', answer: 'forループ' },
                { id: 'php7', question: '$assoc = ["name" => "test"];', answer: '連想配列の定義' },
                { id: 'php8', question: 'array_push($arr, 4);', answer: '配列に要素を追加' },
                { id: 'php9', question: '$result = array_map(function($x) { return $x * 2; }, $arr);', answer: '配列のmap関数' },
                { id: 'php10', question: 'try { code(); } catch (Exception $e) {}', answer: '例外処理' },
                { id: 'php11', question: 'include "file.php";', answer: 'ファイルのインクルード' },
                { id: 'php12', question: 'class MyClass {}', answer: 'クラス定義' },
                { id: 'php13', question: '$file = fopen("file.txt", "r");', answer: 'ファイル操作' },
                { id: 'php14', question: 'isset($variable)', answer: '変数の存在確認' },
                { id: 'php15', question: 'explode(",", $str)', answer: '文字列分割' },
                { id: 'php16', question: 'count($arr)', answer: '配列の長さ' },
                { id: 'php17', question: '$_GET["param"]', answer: 'GETパラメータ取得' },
                { id: 'php18', question: '$_POST["data"]', answer: 'POSTデータ取得' },
                { id: 'php19', question: 'json_encode($arr)', answer: 'JSONに変換' },
                { id: 'php20', question: 'mysqli_connect($host, $user, $pass, $db)', answer: 'データベース接続' }
            ],
            'Sql': [
                { id: 'sql1', question: 'SELECT * FROM users;', answer: '全データの取得' },
                { id: 'sql2', question: 'SELECT name, email FROM users;', answer: '特定カラムの取得' },
                { id: 'sql3', question: 'SELECT * FROM users WHERE age > 20;', answer: '条件付き取得' },
                { id: 'sql4', question: 'INSERT INTO users (name, email) VALUES ("John", "john@example.com");', answer: 'データの挿入' },
                { id: 'sql5', question: 'UPDATE users SET name = "Jane" WHERE id = 1;', answer: 'データの更新' },
                { id: 'sql6', question: 'DELETE FROM users WHERE id = 1;', answer: 'データの削除' },
                { id: 'sql7', question: 'SELECT COUNT(*) FROM users;', answer: 'レコード数の取得' },
                { id: 'sql8', question: 'SELECT * FROM users ORDER BY name ASC;', answer: '昇順ソート' },
                { id: 'sql9', question: 'SELECT * FROM users LIMIT 10;', answer: '取得件数の制限' },
                { id: 'sql10', question: 'SELECT * FROM users WHERE name LIKE "%John%";', answer: '部分一致検索' },
                { id: 'sql11', question: 'SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id;', answer: 'テーブル結合' },
                { id: 'sql12', question: 'SELECT name, COUNT(*) FROM users GROUP BY name;', answer: 'グループ化' },
                { id: 'sql13', question: 'SELECT * FROM users WHERE age BETWEEN 20 AND 30;', answer: '範囲検索' },
                { id: 'sql14', question: 'SELECT * FROM users WHERE email IS NOT NULL;', answer: 'NULL以外の検索' },
                { id: 'sql15', question: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));', answer: 'テーブル作成' },
                { id: 'sql16', question: 'ALTER TABLE users ADD COLUMN age INT;', answer: 'カラム追加' },
                { id: 'sql17', question: 'DROP TABLE users;', answer: 'テーブル削除' },
                { id: 'sql18', question: 'CREATE INDEX idx_name ON users(name);', answer: 'インデックス作成' },
                { id: 'sql19', question: 'SELECT DISTINCT name FROM users;', answer: '重複除去' },
                { id: 'sql20', question: 'SELECT MAX(age) FROM users;', answer: '最大値取得' }
            ],
            'Git': [
                { id: 'git1', question: 'git init', answer: 'リポジトリの初期化' },
                { id: 'git2', question: 'git add .', answer: '全ファイルをステージング' },
                { id: 'git3', question: 'git commit -m "Initial commit"', answer: 'コミットの作成' },
                { id: 'git4', question: 'git status', answer: 'ファイル状態の確認' },
                { id: 'git5', question: 'git log', answer: 'コミット履歴の表示' },
                { id: 'git6', question: 'git branch feature', answer: 'ブランチの作成' },
                { id: 'git7', question: 'git checkout feature', answer: 'ブランチの切り替え' },
                { id: 'git8', question: 'git merge feature', answer: 'ブランチのマージ' },
                { id: 'git9', question: 'git pull origin main', answer: 'リモートから取得' },
                { id: 'git10', question: 'git push origin main', answer: 'リモートにプッシュ' },
                { id: 'git11', question: 'git clone https://github.com/user/repo.git', answer: 'リポジトリのクローン' },
                { id: 'git12', question: 'git diff', answer: '変更差分の表示' },
                { id: 'git13', question: 'git reset --hard HEAD', answer: '変更の取り消し' },
                { id: 'git14', question: 'git stash', answer: '変更の一時保存' },
                { id: 'git15', question: 'git stash pop', answer: '一時保存の復元' },
                { id: 'git16', question: 'git remote add origin https://github.com/user/repo.git', answer: 'リモートの追加' },
                { id: 'git17', question: 'git tag v1.0.0', answer: 'タグの作成' },
                { id: 'git18', question: 'git rebase main', answer: 'リベースの実行' },
                { id: 'git19', question: 'git cherry-pick abc123', answer: '特定コミットの適用' },
                { id: 'git20', question: 'git config --global user.name "Your Name"', answer: 'ユーザー名の設定' }
            ],
            'Linux (Red Hat)': [
                { id: 'rh1', question: 'ls -la', answer: 'ファイル一覧の詳細表示' },
                { id: 'rh2', question: 'cd /home/user', answer: 'ディレクトリの移動' },
                { id: 'rh3', question: 'mkdir new_directory', answer: 'ディレクトリの作成' },
                { id: 'rh4', question: 'rm -rf directory', answer: 'ディレクトリの削除' },
                { id: 'rh5', question: 'cp file.txt backup.txt', answer: 'ファイルのコピー' },
                { id: 'rh6', question: 'mv old_name.txt new_name.txt', answer: 'ファイル名の変更' },
                { id: 'rh7', question: 'chmod 755 script.sh', answer: 'ファイル権限の変更' },
                { id: 'rh8', question: 'chown user:group file.txt', answer: 'ファイル所有者の変更' },
                { id: 'rh9', question: 'ps aux | grep process', answer: 'プロセスの検索' },
                { id: 'rh10', question: 'kill -9 1234', answer: 'プロセスの強制終了' },
                { id: 'rh11', question: 'systemctl start httpd', answer: 'サービスの開始' },
                { id: 'rh12', question: 'systemctl enable httpd', answer: 'サービスの自動起動設定' },
                { id: 'rh13', question: 'yum install package', answer: 'パッケージのインストール' },
                { id: 'rh14', question: 'yum update', answer: 'システムの更新' },
                { id: 'rh15', question: 'firewall-cmd --add-port=80/tcp --permanent', answer: 'ファイアウォール設定' },
                { id: 'rh16', question: 'grep "error" /var/log/messages', answer: 'ログファイルの検索' },
                { id: 'rh17', question: 'find / -name "*.conf"', answer: 'ファイルの検索' },
                { id: 'rh18', question: 'tar -czf archive.tar.gz directory/', answer: 'アーカイブの作成' },
                { id: 'rh19', question: 'crontab -e', answer: 'cron設定の編集' },
                { id: 'rh20', question: 'df -h', answer: 'ディスク使用量の確認' }
            ],
            'Linux(Debian)': [
                { id: 'deb1', question: 'ls -la', answer: 'ファイル一覧の詳細表示' },
                { id: 'deb2', question: 'cd /home/user', answer: 'ディレクトリの移動' },
                { id: 'deb3', question: 'mkdir new_directory', answer: 'ディレクトリの作成' },
                { id: 'deb4', question: 'rm -rf directory', answer: 'ディレクトリの削除' },
                { id: 'deb5', question: 'cp file.txt backup.txt', answer: 'ファイルのコピー' },
                { id: 'deb6', question: 'mv old_name.txt new_name.txt', answer: 'ファイル名の変更' },
                { id: 'deb7', question: 'chmod 755 script.sh', answer: 'ファイル権限の変更' },
                { id: 'deb8', question: 'chown user:group file.txt', answer: 'ファイル所有者の変更' },
                { id: 'deb9', question: 'ps aux | grep process', answer: 'プロセスの検索' },
                { id: 'deb10', question: 'kill -9 1234', answer: 'プロセスの強制終了' },
                { id: 'deb11', question: 'systemctl start apache2', answer: 'サービスの開始' },
                { id: 'deb12', question: 'systemctl enable apache2', answer: 'サービスの自動起動設定' },
                { id: 'deb13', question: 'apt install package', answer: 'パッケージのインストール' },
                { id: 'deb14', question: 'apt update && apt upgrade', answer: 'システムの更新' },
                { id: 'deb15', question: 'ufw allow 80/tcp', answer: 'ファイアウォール設定' },
                { id: 'deb16', question: 'grep "error" /var/log/syslog', answer: 'ログファイルの検索' },
                { id: 'deb17', question: 'find / -name "*.conf"', answer: 'ファイルの検索' },
                { id: 'deb18', question: 'tar -czf archive.tar.gz directory/', answer: 'アーカイブの作成' },
                { id: 'deb19', question: 'crontab -e', answer: 'cron設定の編集' },
                { id: 'deb20', question: 'df -h', answer: 'ディスク使用量の確認' }
            ]
        };
        // 言語名の正規化（バックエンドの言語名に合わせる）
        const normalizedLanguage = this.normalizeLanguageName(language);
        return defaultProblems[normalizedLanguage] || defaultProblems['JavaScript'];
    }

    // タイピングログ保存
    async saveTypingLog(studyBookId, startedAt, durationMs, totalChars, correctChars, language = 'Unknown', score = 0) {
        // 0除算を防ぐ
        const wpm = durationMs > 0 ? Math.round((totalChars / 5) / (durationMs / 60000)) : 0;
        const accuracy = totalChars > 0 ? correctChars / totalChars : 0;

        console.log('saveTypingLog called with:', {
            studyBookId, startedAt, durationMs, totalChars, correctChars, language, score, wpm, accuracy
        });

        // ローカルユーザーの場合は直接ローカルストレージに保存
        if (this.isLocalUser()) {
            return this.saveLocalTypingLog(studyBookId, startedAt, durationMs, totalChars, correctChars, wpm, accuracy, language, score);
        }

        try {
            const requestData = {
                question_id: studyBookId, // 実際は question_id を期待
                wpm: wpm,
                accuracy: accuracy,
                took_ms: durationMs
            };
            
            console.log('バックエンドにタイピングログを保存中:', requestData);
            
            const result = await this.request('/typing-logs/', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            console.log('バックエンドタイピングログ保存成功:', result);
            return result;
        } catch (error) {
            console.warn('タイピングログの保存に失敗しました:', error);
            console.error('保存エラー詳細:', error);
            // バックエンドが利用できない場合はローカルに保存
            return this.saveLocalTypingLog(studyBookId, startedAt, durationMs, totalChars, correctChars, wpm, accuracy, language, score);
        }
    }

    // ローカルタイピングログ保存
    saveLocalTypingLog(studyBookId, startedAt, durationMs, totalChars, correctChars, wpm, accuracy, language = 'Unknown', score = 0) {
        // タイピングログを保存
        const logs = JSON.parse(localStorage.getItem('typingLogs') || '[]');
        logs.push({
            studyBookId,
            startedAt,
            durationMs,
            totalChars,
            correctChars,
            wpm,
            accuracy,
            language,
            score,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('typingLogs', JSON.stringify(logs));

        // 統計情報を更新
        this.updateLocalStats(wpm, accuracy);

        console.log('ローカルタイピングログを保存しました:', { wpm, accuracy, language, score });
        return { success: true, savedLocally: true };
    }

    // ローカル統計情報を更新（廃止予定：タイピングログから計算するため）
    updateLocalStats(wpm, accuracy) {
        console.log('updateLocalStats は廃止されました。タイピングログから統計を計算します。');
        // この関数は使用しない（タイピングログから統計を計算するため）
        // 古いlocalTypingStatsが残っている場合は削除
        if (localStorage.getItem('localTypingStats')) {
            console.log('古いlocalTypingStatsを削除します');
            localStorage.removeItem('localTypingStats');
        }
    }

    // ユーザー情報管理
    setUser(userData) {
        console.log('setUser called with:', userData);
        this.userId = userData.id;
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('setUser - userId set to:', this.userId);
        console.log('setUser - localStorage updated');
    }

    getCurrentUser() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                return JSON.parse(currentUser);
            } catch (e) {
                console.error('Error parsing current user data:', e);
                return null;
            }
        }
        return null;
    }

    // getUser エイリアス（既存コードとの互換性のため）
    getUser() {
        return this.getCurrentUser();
    }

    logout() {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        this.userId = null;
        window.location.href = 'login.html';
    }

    isLoggedIn() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }
}

// グローバルRctAPIインスタンス
window.rctApi = new RctApi();