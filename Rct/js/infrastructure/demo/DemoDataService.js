/**
 * Demo Data Service for offline demonstration
 * Provides mock data when backend is not available
 */
class DemoDataService {
    constructor() {
        this.isOfflineMode = false;
        this.demoUser = {
            id: 'demo-user-001',
            loginId: 'demo',
            loginDays: 5,
            maxLoginDays: 12,
            totalLoginDays: 45
        };
        
        this.demoStudyBooks = [
            {
                id: 'sb-001',
                language: 'JavaScript',
                question: 'function calculateSum(a, b) {\n    return a + b;\n}',
                explanation: 'JavaScript関数の基本的な書き方です。'
            },
            {
                id: 'sb-002',
                language: 'Java',
                question: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
                explanation: 'Javaの基本的なHello Worldプログラムです。'
            },
            {
                id: 'sb-003',
                language: 'Python',
                question: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
                explanation: 'Pythonでのフィボナッチ数列の再帰実装です。'
            }
        ];
        
        this.demoTypingStats = {
            totalSessions: 23,
            averageAccuracy: 87.5,
            averageSpeed: 45.2,
            totalTime: 1250000, // milliseconds
            bestAccuracy: 98.5,
            bestSpeed: 62.1
        };
    }

    /**
     * Enable offline mode
     */
    enableOfflineMode() {
        this.isOfflineMode = true;
        console.log('Demo mode enabled - using offline data');
    }

    /**
     * Disable offline mode
     */
    disableOfflineMode() {
        this.isOfflineMode = false;
        console.log('Demo mode disabled - using live API');
    }

    /**
     * Check if in offline mode
     * @returns {boolean}
     */
    isInOfflineMode() {
        return this.isOfflineMode;
    }

    /**
     * Mock authentication
     * @param {string} loginId 
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async mockLogin(loginId, password) {
        await this.delay(800); // Simulate network delay
        
        if (loginId === 'demo' || loginId === 'guest') {
            return {
                success: true,
                user: this.demoUser,
                token: 'demo-jwt-token-' + Date.now()
            };
        }
        
        return {
            success: false,
            error: 'デモモードでは "demo" または "guest" でログインしてください'
        };
    }

    /**
     * Mock registration
     * @param {string} loginId 
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async mockRegister(loginId, password) {
        await this.delay(1000);
        
        return {
            success: true,
            user: {
                ...this.demoUser,
                loginId: loginId,
                loginDays: 1,
                maxLoginDays: 1,
                totalLoginDays: 1
            },
            token: 'demo-jwt-token-' + Date.now()
        };
    }

    /**
     * Mock study books retrieval
     * @returns {Promise<Array>}
     */
    async mockGetStudyBooks() {
        await this.delay(500);
        return [...this.demoStudyBooks];
    }

    /**
     * Mock random study books
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async mockGetRandomStudyBooks(limit = 3) {
        await this.delay(300);
        const shuffled = [...this.demoStudyBooks].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(limit, shuffled.length));
    }

    /**
     * Mock study book creation
     * @param {Object} studyBookData 
     * @returns {Promise<Object>}
     */
    async mockCreateStudyBook(studyBookData) {
        await this.delay(600);
        
        const newStudyBook = {
            id: 'sb-' + Date.now(),
            ...studyBookData,
            createdAt: new Date().toISOString()
        };
        
        this.demoStudyBooks.push(newStudyBook);
        return newStudyBook;
    }

    /**
     * Mock typing result recording
     * @param {Object} typingResult 
     * @returns {Promise<Object>}
     */
    async mockRecordTypingResult(typingResult) {
        await this.delay(400);
        
        // Update demo stats
        this.demoTypingStats.totalSessions++;
        this.demoTypingStats.averageAccuracy = 
            (this.demoTypingStats.averageAccuracy + typingResult.accuracy) / 2;
        
        return {
            success: true,
            message: 'タイピング結果を記録しました（デモモード）'
        };
    }

    /**
     * Mock typing statistics
     * @returns {Promise<Object>}
     */
    async mockGetTypingStats() {
        await this.delay(400);
        return { ...this.demoTypingStats };
    }

    /**
     * Simulate network delay
     * @param {number} ms 
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show demo mode notification
     */
    showDemoNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            🎭 デモモード<br>
            <small>バックエンド接続なしで動作中</small>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Create singleton instance
const demoDataService = new DemoDataService();

export default demoDataService;