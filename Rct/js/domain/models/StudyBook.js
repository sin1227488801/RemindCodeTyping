/**
 * StudyBook Domain Model
 * Represents a study book entry with question, explanation, and language information
 */
class StudyBook {
    /**
     * Creates a new StudyBook instance
     * @param {string|null} id - Unique study book identifier (null for new instances)
     * @param {string} language - Programming language
     * @param {string} question - Question/problem text
     * @param {string} explanation - Explanation or answer
     * @param {string|null} userId - ID of the user who created this study book
     * @param {boolean} isSystemProblem - Whether this is a system-provided problem
     */
    constructor(id, language, question, explanation, userId = null, isSystemProblem = false) {
        this.validateConstructorParams(language, question);
        
        this._id = id;
        this._language = language.trim();
        this._question = question.trim();
        this._explanation = explanation ? explanation.trim() : '';
        this._userId = userId;
        this._isSystemProblem = isSystemProblem;
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }

    /**
     * Validates constructor parameters
     * @private
     */
    validateConstructorParams(language, question) {
        if (!language || typeof language !== 'string' || language.trim().length === 0) {
            throw new Error('Language must be a non-empty string');
        }
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            throw new Error('Question must be a non-empty string');
        }
    }

    // Getters
    get id() {
        return this._id;
    }

    get language() {
        return this._language;
    }

    get question() {
        return this._question;
    }

    get explanation() {
        return this._explanation;
    }

    get userId() {
        return this._userId;
    }

    get isSystemProblem() {
        return this._isSystemProblem;
    }

    get createdAt() {
        return this._createdAt;
    }

    get updatedAt() {
        return this._updatedAt;
    }

    /**
     * Validates the study book content
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this._language || this._language.length === 0) {
            throw new Error('Language is required');
        }

        if (!this._question || this._question.length === 0) {
            throw new Error('Question is required');
        }

        if (this._language.length > 50) {
            throw new Error('Language must be 50 characters or less');
        }

        if (this._question.length > 10000) {
            throw new Error('Question must be 10000 characters or less');
        }

        if (this._explanation && this._explanation.length > 10000) {
            throw new Error('Explanation must be 10000 characters or less');
        }

        // Validate language format (alphanumeric, spaces, hyphens, plus signs)
        const languagePattern = /^[a-zA-Z0-9\s\-+#.]+$/;
        if (!languagePattern.test(this._language)) {
            throw new Error('Language contains invalid characters');
        }
    }

    /**
     * Checks if this study book belongs to a specific user
     * @param {string} userId - User ID to check
     * @returns {boolean} True if the study book belongs to the user
     */
    belongsToUser(userId) {
        return this._userId === userId;
    }

    /**
     * Checks if this is a user-created problem
     * @returns {boolean} True if user-created
     */
    isUserProblem() {
        return !this._isSystemProblem;
    }

    /**
     * Updates the study book content
     * @param {string} language - New language
     * @param {string} question - New question
     * @param {string} explanation - New explanation
     */
    update(language, question, explanation = '') {
        this.validateConstructorParams(language, question);
        
        this._language = language.trim();
        this._question = question.trim();
        this._explanation = explanation ? explanation.trim() : '';
        this._updatedAt = new Date();
        
        this.validate();
    }

    /**
     * Gets the difficulty level based on question length and complexity
     * @returns {number} Difficulty level (1-5)
     */
    getDifficultyLevel() {
        const questionLength = this._question.length;
        const hasComplexSyntax = /[{}[\]();,.]/.test(this._question);
        const hasMultipleLines = this._question.includes('\n');
        
        let difficulty = 1;
        
        if (questionLength > 100) difficulty++;
        if (questionLength > 300) difficulty++;
        if (hasComplexSyntax) difficulty++;
        if (hasMultipleLines) difficulty++;
        
        return Math.min(difficulty, 5);
    }

    /**
     * Gets the estimated typing time in seconds
     * @param {number} wpm - Words per minute typing speed (default: 40)
     * @returns {number} Estimated time in seconds
     */
    getEstimatedTypingTime(wpm = 40) {
        const averageWordLength = 5;
        const words = this._question.length / averageWordLength;
        return Math.ceil((words / wpm) * 60);
    }

    /**
     * Converts the study book to a plain object for serialization
     * @returns {Object} Plain object representation
     */
    toPlainObject() {
        return {
            id: this._id,
            language: this._language,
            question: this._question,
            explanation: this._explanation,
            userId: this._userId,
            isSystemProblem: this._isSystemProblem,
            createdAt: this._createdAt.toISOString(),
            updatedAt: this._updatedAt.toISOString()
        };
    }

    /**
     * Creates a StudyBook instance from a plain object
     * @param {Object} data - Plain object data
     * @returns {StudyBook} New StudyBook instance
     */
    static fromPlainObject(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be an object');
        }

        const studyBook = new StudyBook(
            data.id,
            data.language,
            data.question,
            data.explanation,
            data.userId,
            data.isSystemProblem
        );

        if (data.createdAt) {
            studyBook._createdAt = new Date(data.createdAt);
        }
        if (data.updatedAt) {
            studyBook._updatedAt = new Date(data.updatedAt);
        }

        return studyBook;
    }

    /**
     * Validates study book data structure
     * @param {Object} studyBookData - Study book data to validate
     * @returns {boolean} True if valid
     * @throws {Error} If validation fails
     */
    static validate(studyBookData) {
        if (!studyBookData || typeof studyBookData !== 'object') {
            throw new Error('Study book data must be an object');
        }

        if (!studyBookData.language || typeof studyBookData.language !== 'string') {
            throw new Error('Language must be a non-empty string');
        }

        if (!studyBookData.question || typeof studyBookData.question !== 'string') {
            throw new Error('Question must be a non-empty string');
        }

        if (studyBookData.explanation !== undefined && 
            studyBookData.explanation !== null && 
            typeof studyBookData.explanation !== 'string') {
            throw new Error('Explanation must be a string or null');
        }

        if (studyBookData.isSystemProblem !== undefined && 
            typeof studyBookData.isSystemProblem !== 'boolean') {
            throw new Error('isSystemProblem must be a boolean');
        }

        return true;
    }

    /**
     * Creates a copy of the study book
     * @returns {StudyBook} New StudyBook instance with same content
     */
    clone() {
        const cloned = new StudyBook(
            null, // New instance gets null ID
            this._language,
            this._question,
            this._explanation,
            this._userId,
            this._isSystemProblem
        );
        return cloned;
    }

    /**
     * Checks if two study books have the same content
     * @param {StudyBook} other - Other study book to compare
     * @returns {boolean} True if content is the same
     */
    hasSameContent(other) {
        if (!(other instanceof StudyBook)) {
            return false;
        }
        return this._language === other._language &&
               this._question === other._question &&
               this._explanation === other._explanation;
    }

    /**
     * Checks if two study books are equal (same ID and content)
     * @param {StudyBook} other - Other study book to compare
     * @returns {boolean} True if study books are equal
     */
    equals(other) {
        if (!(other instanceof StudyBook)) {
            return false;
        }
        return this._id === other._id && this.hasSameContent(other);
    }

    /**
     * Returns a string representation of the study book
     * @returns {string} String representation
     */
    toString() {
        return `StudyBook(id=${this._id}, language=${this._language}, questionLength=${this._question.length})`;
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyBook;
} else if (typeof window !== 'undefined') {
    window.StudyBook = StudyBook;
}