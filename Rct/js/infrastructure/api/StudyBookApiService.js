/**
 * StudyBook API Service
 * Handles all study book related API calls
 */
class StudyBookApiService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Get study books with pagination and filtering
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (0-based)
     * @param {number} params.size - Page size
     * @param {string} params.language - Language filter
     * @param {string} params.search - Search term
     * @returns {Promise<Object>} Paginated study books
     */
    async getStudyBooks(params = {}) {
        try {
            const queryParams = this.buildQueryParams(params);
            const endpoint = `/studybooks${queryParams ? '?' + queryParams : ''}`;
            
            const response = await this.apiClient.get(endpoint);
            return this.transformStudyBooksResponse(response);
        } catch (error) {
            throw this.handleStudyBookError(error, 'fetch study books');
        }
    }

    /**
     * Get random study books for practice
     * @param {string} language - Language filter (optional)
     * @param {number} limit - Number of books to fetch (default: 10)
     * @returns {Promise<Array>} Random study books
     */
    async getRandomStudyBooks(language = null, limit = 10) {
        try {
            const params = { limit };
            if (language) {
                params.language = language;
            }
            
            const queryParams = this.buildQueryParams(params);
            const response = await this.apiClient.get(`/studybooks/random?${queryParams}`);
            
            return Array.isArray(response) ? response : response.content || [];
        } catch (error) {
            throw this.handleStudyBookError(error, 'fetch random study books');
        }
    }

    /**
     * Create a new study book
     * @param {Object} studyBookData - Study book data
     * @param {string} studyBookData.language - Programming language
     * @param {string} studyBookData.question - Code question
     * @param {string} studyBookData.explanation - Explanation (optional)
     * @returns {Promise<Object>} Created study book
     */
    async createStudyBook(studyBookData) {
        try {
            this.validateStudyBookData(studyBookData);
            
            const response = await this.apiClient.post('/studybooks', {
                language: studyBookData.language.trim(),
                question: studyBookData.question.trim(),
                explanation: studyBookData.explanation ? studyBookData.explanation.trim() : null
            });
            
            return response;
        } catch (error) {
            throw this.handleStudyBookError(error, 'create study book');
        }
    }

    /**
     * Update an existing study book
     * @param {string} id - Study book ID
     * @param {Object} studyBookData - Updated study book data
     * @returns {Promise<Object>} Updated study book
     */
    async updateStudyBook(id, studyBookData) {
        try {
            if (!id) {
                throw new Error('Study book ID is required');
            }
            
            this.validateStudyBookData(studyBookData);
            
            const response = await this.apiClient.put(`/studybooks/${id}`, {
                language: studyBookData.language.trim(),
                question: studyBookData.question.trim(),
                explanation: studyBookData.explanation ? studyBookData.explanation.trim() : null
            });
            
            return response;
        } catch (error) {
            throw this.handleStudyBookError(error, 'update study book');
        }
    }

    /**
     * Delete a study book
     * @param {string} id - Study book ID
     * @returns {Promise<void>}
     */
    async deleteStudyBook(id) {
        try {
            if (!id) {
                throw new Error('Study book ID is required');
            }
            
            await this.apiClient.delete(`/studybooks/${id}`);
        } catch (error) {
            throw this.handleStudyBookError(error, 'delete study book');
        }
    }

    /**
     * Get available languages
     * @returns {Promise<Array>} List of available languages
     */
    async getAllLanguages() {
        try {
            const response = await this.apiClient.get('/studybooks/languages');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.warn('Failed to fetch languages:', error);
            return []; // Return empty array on error to prevent UI breaks
        }
    }

    /**
     * Get system problem languages
     * @returns {Promise<Array>} List of system problem languages
     */
    async getSystemProblemLanguages() {
        try {
            const response = await this.apiClient.get('/studybooks/system-problems/languages');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.warn('Failed to fetch system problem languages:', error);
            return [];
        }
    }

    /**
     * Get user problem languages
     * @returns {Promise<Array>} List of user problem languages
     */
    async getUserProblemLanguages() {
        try {
            const response = await this.apiClient.get('/studybooks/user-problems/languages');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.warn('Failed to fetch user problem languages:', error);
            return [];
        }
    }

    /**
     * Get system problems by language
     * @param {string} language - Programming language
     * @returns {Promise<Array>} System problems for the language
     */
    async getSystemProblemsByLanguage(language) {
        try {
            if (!language) {
                throw new Error('Language is required');
            }
            
            const response = await this.apiClient.get(`/studybooks/system-problems/${encodeURIComponent(language)}`);
            return Array.isArray(response) ? response : response.content || [];
        } catch (error) {
            throw this.handleStudyBookError(error, 'fetch system problems');
        }
    }

    /**
     * Get user problems by language
     * @param {string} language - Programming language
     * @returns {Promise<Array>} User problems for the language
     */
    async getUserProblemsByLanguage(language) {
        try {
            if (!language) {
                throw new Error('Language is required');
            }
            
            const response = await this.apiClient.get(`/studybooks/user-problems/${encodeURIComponent(language)}`);
            return Array.isArray(response) ? response : response.content || [];
        } catch (error) {
            throw this.handleStudyBookError(error, 'fetch user problems');
        }
    }

    /**
     * Search study books
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Object>} Search results
     */
    async searchStudyBooks(query, filters = {}) {
        try {
            const params = {
                search: query,
                ...filters
            };
            
            return await this.getStudyBooks(params);
        } catch (error) {
            throw this.handleStudyBookError(error, 'search study books');
        }
    }

    /**
     * Validate study book data
     * @param {Object} studyBookData - Data to validate
     * @throws {Error} If validation fails
     */
    validateStudyBookData(studyBookData) {
        if (!studyBookData) {
            throw new Error('Study book data is required');
        }
        
        if (!studyBookData.language || !studyBookData.language.trim()) {
            throw new Error('プログラミング言語を選択してください。');
        }
        
        if (!studyBookData.question || !studyBookData.question.trim()) {
            throw new Error('問題文を入力してください。');
        }
        
        if (studyBookData.question.length > 5000) {
            throw new Error('問題文は5000文字以内で入力してください。');
        }
        
        if (studyBookData.explanation && studyBookData.explanation.length > 2000) {
            throw new Error('解説は2000文字以内で入力してください。');
        }
    }

    /**
     * Build query parameters string
     * @param {Object} params - Parameters object
     * @returns {string} Query string
     */
    buildQueryParams(params) {
        const filteredParams = Object.entries(params)
            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
        
        return new URLSearchParams(filteredParams).toString();
    }

    /**
     * Transform study books response to ensure consistent format
     * @param {*} response - API response
     * @returns {Object} Transformed response
     */
    transformStudyBooksResponse(response) {
        // Handle different response formats
        if (Array.isArray(response)) {
            return {
                content: response,
                totalElements: response.length,
                totalPages: 1,
                number: 0,
                size: response.length,
                first: true,
                last: true
            };
        }
        
        // Ensure required pagination properties exist
        return {
            content: response.content || [],
            totalElements: response.totalElements || 0,
            totalPages: response.totalPages || 0,
            number: response.number || 0,
            size: response.size || 0,
            first: response.first !== false,
            last: response.last !== false,
            ...response
        };
    }

    /**
     * Handle study book specific errors
     * @param {Error} error - Original error
     * @param {string} operation - Operation that failed
     * @returns {Error} Enhanced error
     */
    handleStudyBookError(error, operation) {
        console.error(`StudyBook API error during ${operation}:`, error);
        
        // Enhance error messages for better user experience
        if (error.status === 400) {
            if (operation.includes('create') || operation.includes('update')) {
                error.message = '学習帳の内容に不備があります。入力内容を確認してください。';
            } else {
                error.message = 'リクエストの内容に問題があります。条件を確認してください。';
            }
        } else if (error.status === 404) {
            if (operation.includes('delete') || operation.includes('update')) {
                error.message = '指定された学習帳が見つかりません。';
            } else {
                error.message = '学習帳が見つかりません。';
            }
        } else if (error.status === 409) {
            error.message = '同じ内容の学習帳が既に存在します。';
        } else if (error.status === 413) {
            error.message = 'データサイズが大きすぎます。内容を短くしてください。';
        } else if (error.status === 422) {
            error.message = '入力データの形式が正しくありません。';
        } else if (error.isNetworkError) {
            error.message = 'ネットワークに接続できません。インターネット接続を確認してください。';
        } else if (!error.message || error.message.includes('HTTP error')) {
            error.message = '学習帳の操作中にエラーが発生しました。しばらく待ってから再試行してください。';
        }
        
        return error;
    }
}

export default StudyBookApiService;