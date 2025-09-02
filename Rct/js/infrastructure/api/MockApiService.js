/**
 * Mock API Service for demonstration purposes
 * Provides realistic API responses without backend dependency
 */
class MockApiService {
    constructor() {
        this.isEnabled = this.shouldEnableMockMode();
        this.delay = 800; // Realistic network delay
        
        if (this.isEnabled) {
            console.log('🎭 Mock API Service enabled - Demo mode active');
            this.showMockModeNotification();
        }
    }

    /**
     * Determine if mock mode should be enabled
     * @returns {boolean}
     */
    shouldEnableMockMode() {
        const hostname = window.location.hostname;
        
        // Enable mock mode for GitHub Pages and other static hosts
        return hostname.includes('github.io') || 
               hostname.includes('netlify.app') || 
               hostname.includes('vercel.app') ||
               hostname.includes('surge.sh');
    }

    /**
     * Check if mock mode is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.isEnabled;
    }

    /**
     * Simulate network delay
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise<void>}
     */
    async delay(ms = this.delay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Mock authentication endpoints
     */
    async mockAuth(endpoint, data) {
        await this.delay();
        
        switch (endpoint) {
            case '/auth/login':
                if (data.loginId === 'demo' || data.loginId === 'guest') {
                    return {
                        success: true,
                        userId: 'demo-user-uuid-0000-000000000001',
                        message: 'ログインに成功しました（デモモード）',
                        user: {
                            id: 'demo-user-uuid-0000-000000000001',
                            loginId: data.loginId,
                            loginDays: 5,
                            maxLoginDays: 12,
                            totalLoginDays: 45
                        }
                    };
                }
                throw new Error('デモモードでは "demo" または "guest" でログインしてください');
                
            case '/auth/register':
                return {
                    success: true,
                    userId: 'new-user-uuid-' + Date.now(),
                    message: '新規登録が完了しました（デモモード）',
                    user: {
                        id: 'new-user-uuid-' + Date.now(),
                        loginId: data.loginId,
                        loginDays: 1,
                        maxLoginDays: 1,
                        totalLoginDays: 1
                    }
                };
                
            case '/auth/demo':
                return {
                    success: true,
                    userId: 'demo-user-uuid-0000-000000000001',
                    message: 'デモログインが完了しました'
                };
                
            default:
                throw new Error('Unknown auth endpoint');
        }
    }

    /**
     * Mock study book endpoints
     */
    async mockStudyBooks(endpoint, data) {
        await this.delay(600);
        
        const mockStudyBooks = [
            {
                id: 'sb-001',
                userId: 'demo-user-uuid-0000-000000000001',
                language: 'JavaScript',
                question: 'function calculateSum(a, b) {\n    return a + b;\n}',
                explanation: 'JavaScript関数の基本的な書き方です。引数を受け取り、計算結果を返します。'
            },
            {
                id: 'sb-002',
                userId: 'demo-user-uuid-0000-000000000001',
                language: 'Java',
                question: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
                explanation: 'Javaの基本的なHello Worldプログラムです。mainメソッドがエントリーポイントになります。'
            },
            {
                id: 'sb-003',
                userId: 'demo-user-uuid-0000-000000000001',
                language: 'Python',
                question: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
                explanation: 'Pythonでのフィボナッチ数列の再帰実装です。効率は良くありませんが、理解しやすい実装です。'
            },
            {
                id: 'sb-004',
                userId: 'demo-user-uuid-0000-000000000001',
                language: 'TypeScript',
                question: 'interface User {\n    id: string;\n    name: string;\n    email: string;\n}\n\nfunction createUser(data: Partial<User>): User {\n    return {\n        id: generateId(),\n        name: data.name || "Unknown",\n        email: data.email || ""\n    };\n}',
                explanation: 'TypeScriptのインターフェースと関数の型定義の例です。Partial<T>で部分的な型を表現できます。'
            },
            {
                id: 'sb-005',
                userId: 'demo-user-uuid-0000-000000000001',
                language: 'React',
                question: 'const TodoItem = ({ todo, onToggle, onDelete }) => {\n    return (\n        <div className="todo-item">\n            <input\n                type="checkbox"\n                checked={todo.completed}\n                onChange={() => onToggle(todo.id)}\n            />\n            <span className={todo.completed ? "completed" : ""}>\n                {todo.text}\n            </span>\n            <button onClick={() => onDelete(todo.id)}>削除</button>\n        </div>\n    );\n};',
                explanation: 'Reactの関数コンポーネントの例です。propsを受け取り、JSXを返します。'
            }
        ];
        
        switch (endpoint) {
            case '/studybooks':
                if (data && data.method === 'POST') {
                    // Create new study book
                    const newStudyBook = {
                        id: 'sb-' + Date.now(),
                        userId: 'demo-user-uuid-0000-000000000001',
                        ...data.body,
                        createdAt: new Date().toISOString()
                    };
                    return newStudyBook;
                }
                return mockStudyBooks;
                
            case '/studybooks/random':
                const limit = data?.limit || 3;
                const shuffled = [...mockStudyBooks].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, Math.min(limit, shuffled.length));
                
            default:
                if (endpoint.startsWith('/studybooks/')) {
                    const id = endpoint.split('/')[2];
                    return mockStudyBooks.find(sb => sb.id === id) || null;
                }
                throw new Error('Unknown studybooks endpoint');
        }
    }

    /**
     * Mock typing endpoints
     */
    async mockTyping(endpoint, data) {
        await this.delay(400);
        
        switch (endpoint) {
            case '/typing/logs':
                return {
                    success: true,
                    message: 'タイピング結果を記録しました（デモモード）',
                    logId: 'log-' + Date.now()
                };
                
            case '/typing/stats':
                return {
                    totalSessions: 23,
                    averageAccuracy: 87.5,
                    averageSpeed: 45.2,
                    totalTime: 1250000,
                    bestAccuracy: 98.5,
                    bestSpeed: 62.1,
                    recentSessions: [
                        { date: '2025-09-01', accuracy: 89.2, speed: 47.1 },
                        { date: '2025-08-31', accuracy: 85.7, speed: 43.8 },
                        { date: '2025-08-30', accuracy: 91.3, speed: 49.2 }
                    ]
                };
                
            default:
                throw new Error('Unknown typing endpoint');
        }
    }

    /**
     * Show mock mode notification
     */
    showMockModeNotification() {
        // Only show once per session
        if (sessionStorage.getItem('mockNotificationShown')) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
            border: 2px solid rgba(255,255,255,0.2);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🎭</span>
                <div>
                    <div style="font-size: 16px; margin-bottom: 4px;">デモモード</div>
                    <div style="font-size: 12px; opacity: 0.9;">バックエンド接続なしで動作中</div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">ログイン: demo / password</div>
                </div>
            </div>
        `;
        
        // Add animation
        if (!document.getElementById('mock-mode-styles')) {
            const style = document.createElement('style');
            style.id = 'mock-mode-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.5s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 8000);
        
        sessionStorage.setItem('mockNotificationShown', 'true');
    }
}

// Create singleton instance
const mockApiService = new MockApiService();

export default mockApiService;