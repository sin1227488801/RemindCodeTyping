/**
 * TypingSession Domain Model
 * Represents a typing practice session with results and statistics
 */
class TypingSession {
    /**
     * Creates a new TypingSession instance
     * @param {string|null} id - Unique session identifier (null for new sessions)
     * @param {StudyBook} studyBook - The study book being practiced
     * @param {string} userId - ID of the user performing the session
     * @param {Object} settings - Session settings (timeLimit, etc.)
     */
    constructor(id, studyBook, userId, settings = {}) {
        this.validateConstructorParams(studyBook, userId);
        
        this._id = id;
        this._studyBook = studyBook;
        this._userId = userId;
        this._settings = { ...this.getDefaultSettings(), ...settings };
        this._startTime = null;
        this._endTime = null;
        this._result = null;
        this._status = 'not_started'; // not_started, in_progress, completed, abandoned
        this._createdAt = new Date();
    }

    /**
     * Gets default session settings
     * @private
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return {
            timeLimit: 600, // 10 minutes in seconds
            allowBackspace: true,
            showProgress: true,
            strictMode: false // If true, must match exactly including whitespace
        };
    }

    /**
     * Validates constructor parameters
     * @private
     */
    validateConstructorParams(studyBook, userId) {
        if (!studyBook || typeof studyBook !== 'object') {
            throw new Error('StudyBook must be provided');
        }
        if (!userId || typeof userId !== 'string') {
            throw new Error('User ID must be a non-empty string');
        }
    }

    // Getters
    get id() {
        return this._id;
    }

    get studyBook() {
        return this._studyBook;
    }

    get userId() {
        return this._userId;
    }

    get settings() {
        return { ...this._settings };
    }

    get startTime() {
        return this._startTime;
    }

    get endTime() {
        return this._endTime;
    }

    get result() {
        return this._result;
    }

    get status() {
        return this._status;
    }

    get createdAt() {
        return this._createdAt;
    }

    /**
     * Starts the typing session
     * @throws {Error} If session is already started
     */
    start() {
        if (this._status !== 'not_started') {
            throw new Error('Session has already been started');
        }
        
        this._startTime = new Date();
        this._status = 'in_progress';
    }

    /**
     * Completes the typing session with the typed text
     * @param {string} typedText - The text that was typed
     * @returns {TypingResult} The calculated result
     * @throws {Error} If session is not in progress
     */
    complete(typedText) {
        if (this._status !== 'in_progress') {
            throw new Error('Session is not in progress');
        }
        
        this._endTime = new Date();
        this._status = 'completed';
        this._result = this.calculateResult(typedText);
        
        return this._result;
    }

    /**
     * Abandons the typing session
     * @throws {Error} If session is not in progress
     */
    abandon() {
        if (this._status !== 'in_progress') {
            throw new Error('Session is not in progress');
        }
        
        this._endTime = new Date();
        this._status = 'abandoned';
    }

    /**
     * Calculates the typing result based on typed text
     * @param {string} typedText - The text that was typed
     * @returns {TypingResult} Calculated result
     * @private
     */
    calculateResult(typedText) {
        const targetText = this._studyBook.question;
        const durationMs = this._endTime - this._startTime;
        
        // Normalize line endings for comparison
        const normalizedTarget = targetText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const normalizedTyped = typedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        let correctCharacters = 0;
        let totalCharacters = normalizedTarget.length;
        let typedCharacters = normalizedTyped.length;
        
        // Calculate correct characters
        for (let i = 0; i < Math.min(normalizedTarget.length, normalizedTyped.length); i++) {
            if (normalizedTarget[i] === normalizedTyped[i]) {
                correctCharacters++;
            }
        }
        
        // Calculate accuracy based on target text length
        const accuracy = totalCharacters > 0 ? (correctCharacters / totalCharacters) * 100 : 0;
        
        // Calculate words per minute (assuming average word length of 5 characters)
        const minutes = durationMs / (1000 * 60);
        const wordsTyped = typedCharacters / 5;
        const wpm = minutes > 0 ? wordsTyped / minutes : 0;
        
        // Calculate characters per minute
        const cpm = minutes > 0 ? typedCharacters / minutes : 0;
        
        // Determine if session was completed successfully
        const isComplete = normalizedTyped === normalizedTarget;
        
        return new TypingResult(
            correctCharacters,
            totalCharacters,
            typedCharacters,
            accuracy,
            durationMs,
            wpm,
            cpm,
            isComplete
        );
    }

    /**
     * Gets the elapsed time in milliseconds
     * @returns {number|null} Elapsed time or null if not started
     */
    getElapsedTime() {
        if (!this._startTime) {
            return null;
        }
        
        const endTime = this._endTime || new Date();
        return endTime - this._startTime;
    }

    /**
     * Gets the remaining time in seconds
     * @returns {number|null} Remaining time or null if no time limit
     */
    getRemainingTime() {
        if (!this._settings.timeLimit || !this._startTime) {
            return null;
        }
        
        const elapsed = this.getElapsedTime();
        const remaining = (this._settings.timeLimit * 1000) - elapsed;
        return Math.max(0, Math.floor(remaining / 1000));
    }

    /**
     * Checks if the session has exceeded the time limit
     * @returns {boolean} True if time limit exceeded
     */
    isTimeExpired() {
        const remaining = this.getRemainingTime();
        return remaining !== null && remaining <= 0;
    }

    /**
     * Checks if the session is currently active
     * @returns {boolean} True if session is in progress
     */
    isActive() {
        return this._status === 'in_progress';
    }

    /**
     * Checks if the session is completed
     * @returns {boolean} True if session is completed
     */
    isCompleted() {
        return this._status === 'completed';
    }

    /**
     * Checks if the session was abandoned
     * @returns {boolean} True if session was abandoned
     */
    isAbandoned() {
        return this._status === 'abandoned';
    }

    /**
     * Converts the session to a plain object for serialization
     * @returns {Object} Plain object representation
     */
    toPlainObject() {
        return {
            id: this._id,
            studyBook: this._studyBook.toPlainObject(),
            userId: this._userId,
            settings: this._settings,
            startTime: this._startTime ? this._startTime.toISOString() : null,
            endTime: this._endTime ? this._endTime.toISOString() : null,
            result: this._result ? this._result.toPlainObject() : null,
            status: this._status,
            createdAt: this._createdAt.toISOString()
        };
    }

    /**
     * Creates a TypingSession instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {TypingSession} New TypingSession instance
     */
    static fromPlainObject(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be an object');
        }

        const studyBook = StudyBook.fromPlainObject(data.studyBook);
        const session = new TypingSession(data.id, studyBook, data.userId, data.settings);
        
        if (data.startTime) {
            session._startTime = new Date(data.startTime);
        }
        if (data.endTime) {
            session._endTime = new Date(data.endTime);
        }
        if (data.result) {
            session._result = TypingResult.fromPlainObject(data.result);
        }
        if (data.status) {
            session._status = data.status;
        }
        if (data.createdAt) {
            session._createdAt = new Date(data.createdAt);
        }

        return session;
    }

    /**
     * Returns a string representation of the session
     * @returns {string} String representation
     */
    toString() {
        return `TypingSession(id=${this._id}, status=${this._status}, studyBook=${this._studyBook.id})`;
    }
}

/**
 * TypingResult Value Object
 * Represents the result of a typing session
 */
class TypingResult {
    /**
     * Creates a new TypingResult instance
     * @param {number} correctCharacters - Number of correctly typed characters
     * @param {number} totalCharacters - Total characters in target text
     * @param {number} typedCharacters - Total characters typed by user
     * @param {number} accuracy - Accuracy percentage (0-100)
     * @param {number} durationMs - Duration in milliseconds
     * @param {number} wpm - Words per minute
     * @param {number} cpm - Characters per minute
     * @param {boolean} isComplete - Whether the text was completed exactly
     */
    constructor(correctCharacters, totalCharacters, typedCharacters, accuracy, durationMs, wpm, cpm, isComplete) {
        this.validateConstructorParams(correctCharacters, totalCharacters, typedCharacters, accuracy, durationMs);
        
        this._correctCharacters = correctCharacters;
        this._totalCharacters = totalCharacters;
        this._typedCharacters = typedCharacters;
        this._accuracy = Math.round(accuracy * 100) / 100; // Round to 2 decimal places
        this._durationMs = durationMs;
        this._wpm = Math.round(wpm * 100) / 100;
        this._cpm = Math.round(cpm * 100) / 100;
        this._isComplete = isComplete;
    }

    /**
     * Validates constructor parameters
     * @private
     */
    validateConstructorParams(correctCharacters, totalCharacters, typedCharacters, accuracy, durationMs) {
        if (typeof correctCharacters !== 'number' || correctCharacters < 0) {
            throw new Error('Correct characters must be a non-negative number');
        }
        if (typeof totalCharacters !== 'number' || totalCharacters < 0) {
            throw new Error('Total characters must be a non-negative number');
        }
        if (typeof typedCharacters !== 'number' || typedCharacters < 0) {
            throw new Error('Typed characters must be a non-negative number');
        }
        if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
            throw new Error('Accuracy must be a number between 0 and 100');
        }
        if (typeof durationMs !== 'number' || durationMs < 0) {
            throw new Error('Duration must be a non-negative number');
        }
    }

    // Getters
    get correctCharacters() {
        return this._correctCharacters;
    }

    get totalCharacters() {
        return this._totalCharacters;
    }

    get typedCharacters() {
        return this._typedCharacters;
    }

    get accuracy() {
        return this._accuracy;
    }

    get durationMs() {
        return this._durationMs;
    }

    get durationSeconds() {
        return Math.round(this._durationMs / 1000);
    }

    get wpm() {
        return this._wpm;
    }

    get cpm() {
        return this._cpm;
    }

    get isComplete() {
        return this._isComplete;
    }

    /**
     * Gets the error count (incorrect characters)
     * @returns {number} Number of errors
     */
    getErrorCount() {
        return Math.max(0, this._typedCharacters - this._correctCharacters);
    }

    /**
     * Gets the error rate as a percentage
     * @returns {number} Error rate percentage
     */
    getErrorRate() {
        if (this._typedCharacters === 0) return 0;
        return Math.round((this.getErrorCount() / this._typedCharacters) * 10000) / 100;
    }

    /**
     * Gets a performance grade based on accuracy and speed
     * @returns {string} Grade (A+, A, B+, B, C+, C, D, F)
     */
    getGrade() {
        if (this._accuracy >= 98 && this._wpm >= 60) return 'A+';
        if (this._accuracy >= 95 && this._wpm >= 50) return 'A';
        if (this._accuracy >= 90 && this._wpm >= 40) return 'B+';
        if (this._accuracy >= 85 && this._wpm >= 30) return 'B';
        if (this._accuracy >= 80 && this._wpm >= 25) return 'C+';
        if (this._accuracy >= 75 && this._wpm >= 20) return 'C';
        if (this._accuracy >= 60 && this._wpm >= 15) return 'D';
        return 'F';
    }

    /**
     * Converts the result to a plain object for serialization
     * @returns {Object} Plain object representation
     */
    toPlainObject() {
        return {
            correctCharacters: this._correctCharacters,
            totalCharacters: this._totalCharacters,
            typedCharacters: this._typedCharacters,
            accuracy: this._accuracy,
            durationMs: this._durationMs,
            wpm: this._wpm,
            cpm: this._cpm,
            isComplete: this._isComplete
        };
    }

    /**
     * Creates a TypingResult instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {TypingResult} New TypingResult instance
     */
    static fromPlainObject(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be an object');
        }

        return new TypingResult(
            data.correctCharacters,
            data.totalCharacters,
            data.typedCharacters,
            data.accuracy,
            data.durationMs,
            data.wpm,
            data.cpm,
            data.isComplete
        );
    }

    /**
     * Returns a string representation of the result
     * @returns {string} String representation
     */
    toString() {
        return `TypingResult(accuracy=${this._accuracy}%, wpm=${this._wpm}, duration=${this.durationSeconds}s)`;
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TypingSession, TypingResult };
} else if (typeof window !== 'undefined') {
    window.TypingSession = TypingSession;
    window.TypingResult = TypingResult;
}