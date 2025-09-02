/**
 * Notification service for displaying user-friendly messages
 * Handles error notifications, success messages, and other user feedback
 */
class NotificationService {
    /**
     * Creates a new NotificationService instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.config = {
            containerId: options.containerId || 'notification-container',
            maxNotifications: options.maxNotifications || 5,
            defaultDuration: options.defaultDuration || 5000,
            animationDuration: options.animationDuration || 300,
            position: options.position || 'top-right',
            ...options
        };
        
        this.notifications = new Map();
        this.notificationCounter = 0;
        
        this.initializeContainer();
        this.setupStyles();
    }

    /**
     * Initialize notification container
     */
    initializeContainer() {
        let container = document.getElementById(this.config.containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = this.config.containerId;
            container.className = `notification-container notification-${this.config.position}`;
            document.body.appendChild(container);
        }
        
        this.container = container;
    }

    /**
     * Setup CSS styles for notifications
     */
    setupStyles() {
        const styleId = 'notification-service-styles';
        
        if (document.getElementById(styleId)) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .notification-container {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }
            
            .notification-top-right {
                top: 20px;
                right: 20px;
            }
            
            .notification-top-left {
                top: 20px;
                left: 20px;
            }
            
            .notification-bottom-right {
                bottom: 20px;
                right: 20px;
            }
            
            .notification-bottom-left {
                bottom: 20px;
                left: 20px;
            }
            
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 12px;
                padding: 16px;
                pointer-events: auto;
                position: relative;
                transform: translateX(100%);
                transition: all ${this.config.animationDuration}ms ease-in-out;
                border-left: 4px solid #ccc;
                max-width: 100%;
                word-wrap: break-word;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .notification-error {
                border-left-color: #dc3545;
                background-color: #f8d7da;
            }
            
            .notification-warning {
                border-left-color: #ffc107;
                background-color: #fff3cd;
            }
            
            .notification-success {
                border-left-color: #28a745;
                background-color: #d4edda;
            }
            
            .notification-info {
                border-left-color: #17a2b8;
                background-color: #d1ecf1;
            }
            
            .notification-critical {
                border-left-color: #dc3545;
                background-color: #f5c6cb;
                border: 2px solid #dc3545;
            }
            
            .notification-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            
            .notification-title {
                font-weight: bold;
                margin: 0;
                font-size: 14px;
                color: #333;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 12px;
                color: #666;
                line-height: 1;
            }
            
            .notification-close:hover {
                color: #333;
            }
            
            .notification-message {
                margin: 0;
                font-size: 13px;
                line-height: 1.4;
                color: #555;
            }
            
            .notification-details {
                margin-top: 8px;
                padding: 8px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 4px;
                font-size: 11px;
                font-family: monospace;
                color: #666;
                max-height: 100px;
                overflow-y: auto;
            }
            
            .notification-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;
            }
            
            .notification-button {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            }
            
            .notification-button-primary {
                background-color: #007bff;
                color: white;
            }
            
            .notification-button-primary:hover {
                background-color: #0056b3;
            }
            
            .notification-button-secondary {
                background-color: #6c757d;
                color: white;
            }
            
            .notification-button-secondary:hover {
                background-color: #545b62;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background-color: rgba(0, 0, 0, 0.2);
                transition: width linear;
            }
            
            @media (max-width: 480px) {
                .notification-container {
                    left: 10px !important;
                    right: 10px !important;
                    max-width: none;
                }
                
                .notification {
                    margin-bottom: 8px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {string} category - Error category
     * @param {Object} options - Notification options
     */
    showError(message, category = 'general', options = {}) {
        this.show({
            type: 'error',
            title: this.getErrorTitle(category),
            message,
            category,
            ...options
        });
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {string} title - Warning title
     * @param {Object} options - Notification options
     */
    showWarning(message, title = '警告', options = {}) {
        this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {string} title - Success title
     * @param {Object} options - Notification options
     */
    showSuccess(message, title = '成功', options = {}) {
        this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {string} title - Info title
     * @param {Object} options - Notification options
     */
    showInfo(message, title = '情報', options = {}) {
        this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    /**
     * Show critical notification
     * @param {string} message - Critical message
     * @param {string} title - Critical title
     * @param {Object} options - Notification options
     */
    showCritical(message, title = '重大なエラー', options = {}) {
        this.show({
            type: 'critical',
            title,
            message,
            duration: 0, // Don't auto-hide critical notifications
            ...options
        });
    }

    /**
     * Show notification
     * @param {Object} options - Notification options
     */
    show(options) {
        const notification = this.createNotification(options);
        this.addNotification(notification);
        
        // Limit number of notifications
        this.enforceMaxNotifications();
        
        return notification.id;
    }

    /**
     * Create notification element
     * @param {Object} options - Notification options
     * @returns {Object} Notification object
     */
    createNotification(options) {
        const id = ++this.notificationCounter;
        const duration = options.duration !== undefined ? options.duration : this.config.defaultDuration;
        
        const element = document.createElement('div');
        element.className = `notification notification-${options.type}`;
        element.setAttribute('data-notification-id', id);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'notification-header';
        
        const title = document.createElement('h4');
        title.className = 'notification-title';
        title.textContent = options.title || '';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close notification');
        
        header.appendChild(title);
        header.appendChild(closeButton);
        element.appendChild(header);
        
        // Create message
        const message = document.createElement('p');
        message.className = 'notification-message';
        message.textContent = options.message;
        element.appendChild(message);
        
        // Add details if provided
        if (options.details) {
            const details = document.createElement('div');
            details.className = 'notification-details';
            details.textContent = options.details;
            element.appendChild(details);
        }
        
        // Add actions if provided
        if (options.showRetry || options.actions) {
            const actions = document.createElement('div');
            actions.className = 'notification-actions';
            
            if (options.showRetry) {
                const retryButton = document.createElement('button');
                retryButton.className = 'notification-button notification-button-primary';
                retryButton.textContent = '再試行';
                retryButton.onclick = () => {
                    if (options.onRetry) {
                        options.onRetry();
                    }
                    this.hide(id);
                };
                actions.appendChild(retryButton);
            }
            
            if (options.actions) {
                options.actions.forEach(action => {
                    const button = document.createElement('button');
                    button.className = `notification-button notification-button-${action.type || 'secondary'}`;
                    button.textContent = action.label;
                    button.onclick = () => {
                        if (action.handler) {
                            action.handler();
                        }
                        this.hide(id);
                    };
                    actions.appendChild(button);
                });
            }
            
            element.appendChild(actions);
        }
        
        // Add progress bar for timed notifications
        if (duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'notification-progress';
            element.appendChild(progress);
        }
        
        const notification = {
            id,
            element,
            options,
            duration,
            timer: null,
            progressTimer: null,
            createdAt: Date.now()
        };
        
        // Setup close handler
        closeButton.onclick = () => this.hide(id);
        
        // Setup auto-hide timer
        if (duration > 0) {
            this.setupAutoHide(notification);
        }
        
        return notification;
    }

    /**
     * Add notification to container
     * @param {Object} notification - Notification object
     */
    addNotification(notification) {
        this.notifications.set(notification.id, notification);
        this.container.appendChild(notification.element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
    }

    /**
     * Setup auto-hide timer for notification
     * @param {Object} notification - Notification object
     */
    setupAutoHide(notification) {
        const progressBar = notification.element.querySelector('.notification-progress');
        
        if (progressBar) {
            // Animate progress bar
            progressBar.style.width = '100%';
            progressBar.style.transitionDuration = `${notification.duration}ms`;
            
            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }
        
        // Set hide timer
        notification.timer = setTimeout(() => {
            this.hide(notification.id);
        }, notification.duration);
    }

    /**
     * Hide notification
     * @param {number} id - Notification ID
     */
    hide(id) {
        const notification = this.notifications.get(id);
        
        if (!notification) {
            return;
        }
        
        // Clear timers
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        if (notification.progressTimer) {
            clearTimeout(notification.progressTimer);
        }
        
        // Animate out
        notification.element.classList.add('hide');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, this.config.animationDuration);
    }

    /**
     * Hide all notifications
     */
    hideAll() {
        for (const id of this.notifications.keys()) {
            this.hide(id);
        }
    }

    /**
     * Enforce maximum number of notifications
     */
    enforceMaxNotifications() {
        const notificationIds = Array.from(this.notifications.keys());
        
        if (notificationIds.length > this.config.maxNotifications) {
            // Remove oldest notifications
            const toRemove = notificationIds
                .sort((a, b) => {
                    const notifA = this.notifications.get(a);
                    const notifB = this.notifications.get(b);
                    return notifA.createdAt - notifB.createdAt;
                })
                .slice(0, notificationIds.length - this.config.maxNotifications);
            
            toRemove.forEach(id => this.hide(id));
        }
    }

    /**
     * Get error title based on category
     * @param {string} category - Error category
     * @returns {string} Error title
     */
    getErrorTitle(category) {
        switch (category) {
            case 'network':
                return 'ネットワークエラー';
            case 'authentication':
                return '認証エラー';
            case 'business':
                return 'エラー';
            case 'system':
                return 'システムエラー';
            case 'validation':
                return '入力エラー';
            default:
                return 'エラー';
        }
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get notification count
     * @returns {number} Number of active notifications
     */
    getNotificationCount() {
        return this.notifications.size;
    }

    /**
     * Check if notification exists
     * @param {number} id - Notification ID
     * @returns {boolean} Whether notification exists
     */
    hasNotification(id) {
        return this.notifications.has(id);
    }
}

export default NotificationService;