/**
 * TypingPracticeInterface Component
 * Reusable component for the typing practice interface
 */
class TypingPracticeInterface {
    /**
     * Creates a new TypingPracticeInterface instance
     * @param {HTMLElement} container - Container element for the interface
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showTimer: true,
            showScore: true,
            showAccuracy: true,
            showProblemExplanation: true,
            showSpecialCharacters: true,
            enableHints: true,
            enablePause: true,
            enableSkip: true,
            ...options
        };
        this.eventHandlers = new Map();
        
        // State
        this.currentProblem = null;
        this.currentProblemIndex = 0;
        this.totalProblems = 0;
        this.timeRemaining = 0;
        this.targetTime = 0;
        this.score = 0;
        this.accuracy = 100;
        this.isPaused = false;
        this.isCompleted = false;
        this.timer = null;
        this.typingStartTime = null;
        this.userInput = '';
    }

    /**
     * Renders the typing practice interface
     */
    render() {
        this.container.innerHTML = this.getInterfaceHTML();
        this.attachEventListeners();
        this.initializeInterface();
    }

    /**
     * Gets the HTML structure for the typing interface
     * @returns {string} HTML string
     * @private
     */
    getInterfaceHTML() {
        return `
            <div class="typing-practice-interface">
                <header class="typing-header">
                    <h1>タイピング練習</h1>
                    <div class="typing-info">
                        ${this.options.showTimer ? `
                            <div class="info-item timer">
                                残り時間: <span id="timer-display">--:--</span>
                            </div>
                        ` : ''}
                        <div class="info-item target-time">
                            目標時間: <span id="target-time-display">--:--</span>
                        </div>
                        ${this.options.showScore ? `
                            <div class="info-item score">
                                スコア: <span id="score-display">0</span>
                            </div>
                        ` : ''}
                        ${this.options.showAccuracy ? `
                            <div class="info-item accuracy">
                                正答率: <span id="accuracy-display">100%</span>
                            </div>
                        ` : ''}
                    </div>
                </header>

                <main class="typing-main">
                    <div class="problem-display">
                        <div class="problem-info">
                            <span class="language-tag" id="current-language">-</span>
                            <span class="problem-counter">
                                <span id="current-problem-number">1</span> / <span id="total-problems-display">1</span>
                            </span>
                        </div>
                        
                        <div class="display-options">
                            <div class="option-group">
                                <input type="checkbox" id="show-problem" checked>
                                <label for="show-problem">問題文を表示</label>
                            </div>
                            ${this.options.showProblemExplanation ? `
                                <div class="option-group">
                                    <input type="checkbox" id="show-explanation">
                                    <label for="show-explanation">解説を表示</label>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${this.options.showSpecialCharacters ? `
                            <div class="legend">
                                <div class="legend-title">特殊文字の表示:</div>
                                <div class="legend-items">
                                    <span class="legend-item">
                                        <span class="space-char">·</span> = 半角スペース
                                    </span>
                                    <span class="legend-item">
                                        <span class="tab-char">→</span> = タブ文字
                                    </span>
                                    <span class="legend-item">
                                        <span class="newline-char">↵</span> = 改行
                                    </span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="coding-area">
                            <div class="problem-section">
                                ${this.options.showProblemExplanation ? `
                                    <div class="problem-explanation" id="problem-explanation" style="display: none;">
                                        <!-- 解説がここに表示されます -->
                                    </div>
                                ` : ''}
                                
                                <div class="problem-text" id="problem-text">
                                    <!-- 問題文がここに表示されます -->
                                </div>
                            </div>
                            
                            <div class="typing-section">
                                <textarea 
                                    id="typing-input" 
                                    class="typing-textarea"
                                    placeholder="ここにコードを入力してください..."
                                    spellcheck="false"
                                    autocomplete="off"
                                    autocorrect="off"
                                    autocapitalize="off"
                                ></textarea>
                                <div id="completion-message" class="completion-message" style="display: none;">
                                    ✅ 完了！Enterキーまたは「次へ」ボタンで次の問題に進んでください
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="typing-controls">
                        ${this.options.enableSkip ? `
                            <button id="skip-button" class="btn btn-secondary">次へ</button>
                        ` : ''}
                        ${this.options.enableHints ? `
                            <button id="hint-button" class="btn btn-secondary">ヒント表示</button>
                        ` : ''}
                        ${this.options.enablePause ? `
                            <button id="pause-button" class="btn btn-primary">一時停止</button>
                        ` : ''}
                    </div>
                </main>

                <!-- Pause Overlay -->
                <div id="pause-overlay" class="pause-overlay" style="display: none;">
                    <div class="pause-content">
                        <h2>一時停止中</h2>
                        <p>準備ができたら「再開」ボタンを押してください</p>
                        <div class="pause-actions">
                            <button id="resume-button" class="btn btn-primary">再開</button>
                            <button id="quit-button" class="btn btn-secondary">終了</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attaches event listeners to interface elements
     * @private
     */
    attachEventListeners() {
        const typingInput = this.container.querySelector('#typing-input');
        const skipButton = this.container.querySelector('#skip-button');
        const hintButton = this.container.querySelector('#hint-button');
        const pauseButton = this.container.querySelector('#pause-button');
        const resumeButton = this.container.querySelector('#resume-button');
        const quitButton = this.container.querySelector('#quit-button');
        const showProblemCheckbox = this.container.querySelector('#show-problem');
        const showExplanationCheckbox = this.container.querySelector('#show-explanation');

        // Typing input
        if (typingInput) {
            const inputHandler = (event) => this.handleTypingInput(event);
            const keydownHandler = (event) => this.handleKeyDown(event);
            
            typingInput.addEventListener('input', inputHandler);
            typingInput.addEventListener('keydown', keydownHandler);
            
            this.eventHandlers.set('typing-input', { element: typingInput, event: 'input', handler: inputHandler });
            this.eventHandlers.set('typing-keydown', { element: typingInput, event: 'keydown', handler: keydownHandler });
        }

        // Control buttons
        if (skipButton) {
            const skipHandler = () => this.handleSkip();
            skipButton.addEventListener('click', skipHandler);
            this.eventHandlers.set('skip-button', { element: skipButton, event: 'click', handler: skipHandler });
        }

        if (hintButton) {
            const hintHandler = () => this.handleHint();
            hintButton.addEventListener('click', hintHandler);
            this.eventHandlers.set('hint-button', { element: hintButton, event: 'click', handler: hintHandler });
        }

        if (pauseButton) {
            const pauseHandler = () => this.handlePause();
            pauseButton.addEventListener('click', pauseHandler);
            this.eventHandlers.set('pause-button', { element: pauseButton, event: 'click', handler: pauseHandler });
        }

        if (resumeButton) {
            const resumeHandler = () => this.handleResume();
            resumeButton.addEventListener('click', resumeHandler);
            this.eventHandlers.set('resume-button', { element: resumeButton, event: 'click', handler: resumeHandler });
        }

        if (quitButton) {
            const quitHandler = () => this.handleQuit();
            quitButton.addEventListener('click', quitHandler);
            this.eventHandlers.set('quit-button', { element: quitButton, event: 'click', handler: quitHandler });
        }

        // Display options
        if (showProblemCheckbox) {
            const toggleHandler = () => this.toggleProblemDisplay();
            showProblemCheckbox.addEventListener('change', toggleHandler);
            this.eventHandlers.set('show-problem', { element: showProblemCheckbox, event: 'change', handler: toggleHandler });
        }

        if (showExplanationCheckbox) {
            const toggleHandler = () => this.toggleExplanationDisplay();
            showExplanationCheckbox.addEventListener('change', toggleHandler);
            this.eventHandlers.set('show-explanation', { element: showExplanationCheckbox, event: 'change', handler: toggleHandler });
        }

        // Keyboard shortcuts
        const keyboardHandler = (event) => this.handleGlobalKeyboard(event);
        document.addEventListener('keydown', keyboardHandler);
        this.eventHandlers.set('global-keyboard', { element: document, event: 'keydown', handler: keyboardHandler });
    }

    /**
     * Initializes the interface
     * @private
     */
    initializeInterface() {
        // Focus on typing input
        const typingInput = this.container.querySelector('#typing-input');
        if (typingInput) {
            typingInput.focus();
        }
    }

    /**
     * Starts a typing session
     * @param {Object} sessionData - Session configuration
     */
    startSession(sessionData) {
        this.totalProblems = sessionData.problems.length;
        this.timeRemaining = sessionData.timeLimit * 60; // Convert to seconds
        this.targetTime = sessionData.targetTime || 0;
        this.currentProblemIndex = 0;
        this.score = 0;
        this.accuracy = 100;
        this.isPaused = false;
        this.isCompleted = false;
        this.typingStartTime = null;

        // Update display
        this.updateDisplay();
        
        // Load first problem
        if (sessionData.problems.length > 0) {
            this.loadProblem(sessionData.problems[0]);
        }

        // Start timer
        this.startTimer();

        // Emit session started event
        this.emit('sessionStarted', sessionData);
    }

    /**
     * Loads a problem
     * @param {Object} problem - Problem data
     */
    loadProblem(problem) {
        this.currentProblem = problem;
        this.userInput = '';
        this.typingStartTime = null;

        // Update problem display
        this.updateProblemDisplay();
        
        // Clear typing input
        const typingInput = this.container.querySelector('#typing-input');
        if (typingInput) {
            typingInput.value = '';
            typingInput.focus();
        }

        // Hide completion message
        const completionMessage = this.container.querySelector('#completion-message');
        if (completionMessage) {
            completionMessage.style.display = 'none';
        }

        // Emit problem loaded event
        this.emit('problemLoaded', problem);
    }

    /**
     * Updates the problem display
     * @private
     */
    updateProblemDisplay() {
        if (!this.currentProblem) return;

        const languageTag = this.container.querySelector('#current-language');
        const problemText = this.container.querySelector('#problem-text');
        const problemExplanation = this.container.querySelector('#problem-explanation');

        if (languageTag) {
            languageTag.textContent = this.currentProblem.language || '-';
        }

        if (problemText) {
            problemText.innerHTML = this.formatProblemText(this.currentProblem.question);
        }

        if (problemExplanation && this.currentProblem.explanation) {
            problemExplanation.innerHTML = this.formatExplanationText(this.currentProblem.explanation);
        }

        this.updateDisplay();
    }

    /**
     * Formats problem text with special characters
     * @param {string} text - Problem text
     * @returns {string} Formatted HTML
     * @private
     */
    formatProblemText(text) {
        if (!text) return '';
        
        if (this.options.showSpecialCharacters) {
            return text
                .replace(/ /g, '<span class="space-char">·</span>')
                .replace(/\t/g, '<span class="tab-char">→</span>')
                .replace(/\n/g, '<span class="newline-char">↵</span>\n');
        }
        
        return text;
    }

    /**
     * Formats explanation text
     * @param {string} text - Explanation text
     * @returns {string} Formatted HTML
     * @private
     */
    formatExplanationText(text) {
        if (!text) return '';
        return `<pre>${text}</pre>`;
    }

    /**
     * Updates the display elements
     * @private
     */
    updateDisplay() {
        const timerDisplay = this.container.querySelector('#timer-display');
        const targetTimeDisplay = this.container.querySelector('#target-time-display');
        const scoreDisplay = this.container.querySelector('#score-display');
        const accuracyDisplay = this.container.querySelector('#accuracy-display');
        const currentProblemNumber = this.container.querySelector('#current-problem-number');
        const totalProblemsDisplay = this.container.querySelector('#total-problems-display');

        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.timeRemaining);
        }

        if (targetTimeDisplay) {
            targetTimeDisplay.textContent = this.formatTime(this.targetTime);
        }

        if (scoreDisplay) {
            scoreDisplay.textContent = this.score.toString();
        }

        if (accuracyDisplay) {
            accuracyDisplay.textContent = `${this.accuracy.toFixed(1)}%`;
        }

        if (currentProblemNumber) {
            currentProblemNumber.textContent = (this.currentProblemIndex + 1).toString();
        }

        if (totalProblemsDisplay) {
            totalProblemsDisplay.textContent = this.totalProblems.toString();
        }
    }

    /**
     * Formats time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     * @private
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Starts the timer
     * @private
     */
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isCompleted) {
                this.timeRemaining--;
                this.updateDisplay();

                if (this.timeRemaining <= 0) {
                    this.handleTimeUp();
                }
            }
        }, 1000);
    }

    /**
     * Stops the timer
     * @private
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Handles typing input
     * @param {Event} event - Input event
     * @private
     */
    handleTypingInput(event) {
        if (this.isPaused || this.isCompleted) return;

        const input = event.target.value;
        this.userInput = input;

        // Start timing on first input
        if (!this.typingStartTime && input.length > 0) {
            this.typingStartTime = Date.now();
        }

        // Check if problem is completed
        if (this.currentProblem && input.trim() === this.currentProblem.question.trim()) {
            this.handleProblemCompleted();
        } else {
            // Update accuracy
            this.updateAccuracy();
        }

        // Emit typing event
        this.emit('typing', {
            input: input,
            problem: this.currentProblem,
            accuracy: this.accuracy
        });
    }

    /**
     * Handles keydown events
     * @param {KeyboardEvent} event - Keydown event
     * @private
     */
    handleKeyDown(event) {
        // Handle Enter key for completed problems
        if (event.key === 'Enter' && this.isProblemCompleted()) {
            event.preventDefault();
            this.handleSkip();
        }
    }

    /**
     * Handles global keyboard shortcuts
     * @param {KeyboardEvent} event - Keydown event
     * @private
     */
    handleGlobalKeyboard(event) {
        // Escape to pause
        if (event.key === 'Escape' && !this.isPaused) {
            event.preventDefault();
            this.handlePause();
        }
    }

    /**
     * Updates accuracy calculation
     * @private
     */
    updateAccuracy() {
        if (!this.currentProblem || !this.userInput) {
            this.accuracy = 100;
            return;
        }

        const target = this.currentProblem.question;
        const input = this.userInput;
        const minLength = Math.min(target.length, input.length);
        
        let correctChars = 0;
        for (let i = 0; i < minLength; i++) {
            if (target[i] === input[i]) {
                correctChars++;
            }
        }

        this.accuracy = minLength > 0 ? (correctChars / minLength) * 100 : 100;
        this.updateDisplay();
    }

    /**
     * Checks if current problem is completed
     * @returns {boolean} Whether problem is completed
     * @private
     */
    isProblemCompleted() {
        return this.currentProblem && 
               this.userInput.trim() === this.currentProblem.question.trim();
    }

    /**
     * Handles problem completion
     * @private
     */
    handleProblemCompleted() {
        const completionMessage = this.container.querySelector('#completion-message');
        if (completionMessage) {
            completionMessage.style.display = 'block';
        }

        // Calculate score for this problem
        const problemScore = this.calculateProblemScore();
        this.score += problemScore;

        // Emit problem completed event
        this.emit('problemCompleted', {
            problem: this.currentProblem,
            userInput: this.userInput,
            score: problemScore,
            accuracy: this.accuracy,
            timeSpent: this.typingStartTime ? Date.now() - this.typingStartTime : 0
        });

        this.updateDisplay();
    }

    /**
     * Calculates score for current problem
     * @returns {number} Problem score
     * @private
     */
    calculateProblemScore() {
        if (!this.currentProblem || !this.typingStartTime) return 0;

        const timeSpent = (Date.now() - this.typingStartTime) / 1000; // seconds
        const characterCount = this.currentProblem.question.length;
        const baseScore = characterCount * (this.accuracy / 100);
        
        // Time bonus (faster typing gets higher score)
        const timeBonus = Math.max(0, (60 - timeSpent) / 60) * 10;
        
        return Math.round(baseScore + timeBonus);
    }

    /**
     * Handles skip button click
     * @private
     */
    handleSkip() {
        if (this.isPaused || this.isCompleted) return;

        this.emit('skipProblem', {
            problem: this.currentProblem,
            userInput: this.userInput
        });
    }

    /**
     * Handles hint button click
     * @private
     */
    handleHint() {
        if (this.isPaused || this.isCompleted) return;

        const showExplanationCheckbox = this.container.querySelector('#show-explanation');
        if (showExplanationCheckbox) {
            showExplanationCheckbox.checked = true;
            this.toggleExplanationDisplay();
        }

        this.emit('hintRequested', {
            problem: this.currentProblem
        });
    }

    /**
     * Handles pause button click
     * @private
     */
    handlePause() {
        if (this.isCompleted) return;

        this.isPaused = true;
        
        const pauseOverlay = this.container.querySelector('#pause-overlay');
        const pauseButton = this.container.querySelector('#pause-button');
        
        if (pauseOverlay) {
            pauseOverlay.style.display = 'flex';
        }
        
        if (pauseButton) {
            pauseButton.textContent = '再開';
        }

        this.emit('sessionPaused');
    }

    /**
     * Handles resume button click
     * @private
     */
    handleResume() {
        this.isPaused = false;
        
        const pauseOverlay = this.container.querySelector('#pause-overlay');
        const pauseButton = this.container.querySelector('#pause-button');
        
        if (pauseOverlay) {
            pauseOverlay.style.display = 'none';
        }
        
        if (pauseButton) {
            pauseButton.textContent = '一時停止';
        }

        // Focus back on typing input
        const typingInput = this.container.querySelector('#typing-input');
        if (typingInput) {
            typingInput.focus();
        }

        this.emit('sessionResumed');
    }

    /**
     * Handles quit button click
     * @private
     */
    handleQuit() {
        this.handleSessionEnd(true);
    }

    /**
     * Handles time up
     * @private
     */
    handleTimeUp() {
        this.handleSessionEnd(false);
    }

    /**
     * Handles session end
     * @param {boolean} wasQuit - Whether session was quit by user
     * @private
     */
    handleSessionEnd(wasQuit = false) {
        this.isCompleted = true;
        this.stopTimer();

        this.emit('sessionCompleted', {
            wasQuit: wasQuit,
            totalProblems: this.totalProblems,
            completedProblems: this.currentProblemIndex + (this.isProblemCompleted() ? 1 : 0),
            score: this.score,
            accuracy: this.accuracy,
            timeRemaining: this.timeRemaining
        });
    }

    /**
     * Toggles problem display
     * @private
     */
    toggleProblemDisplay() {
        const showProblemCheckbox = this.container.querySelector('#show-problem');
        const problemText = this.container.querySelector('#problem-text');
        
        if (showProblemCheckbox && problemText) {
            problemText.style.display = showProblemCheckbox.checked ? 'block' : 'none';
        }
    }

    /**
     * Toggles explanation display
     * @private
     */
    toggleExplanationDisplay() {
        const showExplanationCheckbox = this.container.querySelector('#show-explanation');
        const problemExplanation = this.container.querySelector('#problem-explanation');
        
        if (showExplanationCheckbox && problemExplanation) {
            problemExplanation.style.display = showExplanationCheckbox.checked ? 'block' : 'none';
        }
    }

    /**
     * Moves to next problem
     * @param {Object} nextProblem - Next problem data
     */
    nextProblem(nextProblem) {
        this.currentProblemIndex++;
        
        if (nextProblem) {
            this.loadProblem(nextProblem);
        } else {
            // No more problems, end session
            this.handleSessionEnd(false);
        }
    }

    /**
     * Gets current session state
     * @returns {Object} Session state
     */
    getSessionState() {
        return {
            currentProblemIndex: this.currentProblemIndex,
            totalProblems: this.totalProblems,
            timeRemaining: this.timeRemaining,
            score: this.score,
            accuracy: this.accuracy,
            isPaused: this.isPaused,
            isCompleted: this.isCompleted,
            currentProblem: this.currentProblem,
            userInput: this.userInput
        };
    }

    /**
     * Emits a custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @private
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(`typingPractice:${eventName}`, {
            detail: data,
            bubbles: true
        });
        this.container.dispatchEvent(event);
    }

    /**
     * Adds an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    on(eventName, handler) {
        this.container.addEventListener(`typingPractice:${eventName}`, handler);
    }

    /**
     * Removes an event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        this.container.removeEventListener(`typingPractice:${eventName}`, handler);
    }

    /**
     * Destroys the component and cleans up resources
     */
    destroy() {
        // Stop timer
        this.stopTimer();
        
        // Remove event listeners
        this.eventHandlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventHandlers.clear();

        // Clear container
        this.container.innerHTML = '';
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TypingPracticeInterface;
} else if (typeof window !== 'undefined') {
    window.TypingPracticeInterface = TypingPracticeInterface;
}