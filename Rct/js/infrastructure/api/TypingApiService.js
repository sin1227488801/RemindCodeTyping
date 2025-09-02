/**
 * Typing API Service
 * Handles all typing session and statistics related API calls
 */
class TypingApiService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Save typing session result
     * @param {Object} sessionData - Typing session data
     * @param {string} sessionData.studyBookId - Study book ID
     * @param {Date|string} sessionData.startedAt - Session start time
     * @param {number} sessionData.durationMs - Duration in milliseconds
     * @param {number} sessionData.totalChars - Total characters typed
     * @param {number} sessionData.correctChars - Correct characters typed
     * @returns {Promise<Object>} Saved session data
     */
    async saveTypingSession(sessionData) {
        try {
            this.validateSessionData(sessionData);
            
            const requestData = {
                studyBookId: sessionData.studyBookId,
                startedAt: this.formatDateTime(sessionData.startedAt),
                durationMs: Math.round(sessionData.durationMs),
                totalChars: Math.round(sessionData.totalChars),
                correctChars: Math.round(sessionData.correctChars)
            };
            
            const response = await this.apiClient.post('/typing/logs', requestData);
            return response;
        } catch (error) {
            throw this.handleTypingError(error, 'save typing session');
        }
    }

    /**
     * Get typing statistics for the current user
     * @param {Object} params - Query parameters
     * @param {string} params.period - Time period (day, week, month, year)
     * @param {Date} params.startDate - Start date for statistics
     * @param {Date} params.endDate - End date for statistics
     * @param {string} params.language - Language filter
     * @returns {Promise<Object>} Typing statistics
     */
    async getTypingStatistics(params = {}) {
        try {
            const queryParams = this.buildStatsQueryParams(params);
            const endpoint = `/typing/stats${queryParams ? '?' + queryParams : ''}`;
            
            const response = await this.apiClient.get(endpoint);
            return this.transformStatsResponse(response);
        } catch (error) {
            throw this.handleTypingError(error, 'fetch typing statistics');
        }
    }

    /**
     * Get typing session history
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (0-based)
     * @param {number} params.size - Page size
     * @param {string} params.language - Language filter
     * @param {Date} params.startDate - Start date filter
     * @param {Date} params.endDate - End date filter
     * @returns {Promise<Object>} Paginated session history
     */
    async getTypingHistory(params = {}) {
        try {
            const queryParams = this.buildHistoryQueryParams(params);
            const endpoint = `/typing/history${queryParams ? '?' + queryParams : ''}`;
            
            const response = await this.apiClient.get(endpoint);
            return this.transformHistoryResponse(response);
        } catch (error) {
            throw this.handleTypingError(error, 'fetch typing history');
        }
    }

    /**
     * Get daily typing statistics
     * @param {Date} date - Specific date (optional, defaults to today)
     * @returns {Promise<Object>} Daily statistics
     */
    async getDailyStats(date = null) {
        try {
            const targetDate = date || new Date();
            const dateStr = this.formatDate(targetDate);
            
            const response = await this.apiClient.get(`/typing/stats/daily?date=${dateStr}`);
            return response;
        } catch (error) {
            throw this.handleTypingError(error, 'fetch daily statistics');
        }
    }

    /**
     * Get weekly typing statistics
     * @param {Date} weekStart - Start of the week (optional)
     * @returns {Promise<Object>} Weekly statistics
     */
    async getWeeklyStats(weekStart = null) {
        try {
            let endpoint = '/typing/stats/weekly';
            
            if (weekStart) {
                const dateStr = this.formatDate(weekStart);
                endpoint += `?weekStart=${dateStr}`;
            }
            
            const response = await this.apiClient.get(endpoint);
            return response;
        } catch (error) {
            throw this.handleTypingError(error, 'fetch weekly statistics');
        }
    }

    /**
     * Get monthly typing statistics
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {Promise<Object>} Monthly statistics
     */
    async getMonthlyStats(year = null, month = null) {
        try {
            const now = new Date();
            const targetYear = year || now.getFullYear();
            const targetMonth = month || (now.getMonth() + 1);
            
            const response = await this.apiClient.get(`/typing/stats/monthly?year=${targetYear}&month=${targetMonth}`);
            return response;
        } catch (error) {
            throw this.handleTypingError(error, 'fetch monthly statistics');
        }
    }

    /**
     * Get typing accuracy trends
     * @param {Object} params - Query parameters
     * @param {string} params.period - Period (day, week, month)
     * @param {number} params.limit - Number of data points
     * @returns {Promise<Array>} Accuracy trend data
     */
    async getAccuracyTrends(params = {}) {
        try {
            const queryParams = this.buildTrendsQueryParams(params);
            const endpoint = `/typing/stats/accuracy-trends${queryParams ? '?' + queryParams : ''}`;
            
            const response = await this.apiClient.get(endpoint);
            return Array.isArray(response) ? response : response.data || [];
        } catch (error) {
            throw this.handleTypingError(error, 'fetch accuracy trends');
        }
    }

    /**
     * Get typing speed trends
     * @param {Object} params - Query parameters
     * @returns {Promise<Array>} Speed trend data
     */
    async getSpeedTrends(params = {}) {
        try {
            const queryParams = this.buildTrendsQueryParams(params);
            const endpoint = `/typing/stats/speed-trends${queryParams ? '?' + queryParams : ''}`;
            
            const response = await this.apiClient.get(endpoint);
            return Array.isArray(response) ? response : response.data || [];
        } catch (error) {
            throw this.handleTypingError(error, 'fetch speed trends');
        }
    }

    /**
     * Get language-specific statistics
     * @param {string} language - Programming language
     * @param {Object} params - Additional parameters
     * @returns {Promise<Object>} Language statistics
     */
    async getLanguageStats(language, params = {}) {
        try {
            if (!language) {
                throw new Error('Language is required');
            }
            
            const queryParams = this.buildStatsQueryParams(params);
            const endpoint = `/typing/stats/language/${encodeURIComponent(language)}${queryParams ? '?' + queryParams : ''}`;
            
            const response = await this.apiClient.get(endpoint);
            return response;
        } catch (error) {
            throw this.handleTypingError(error, 'fetch language statistics');
        }
    }

    /**
     * Validate typing session data
     * @param {Object} sessionData - Session data to validate
     * @throws {Error} If validation fails
     */
    validateSessionData(sessionData) {
        if (!sessionData) {
            throw new Error('Session data is required');
        }
        
        if (!sessionData.studyBookId) {
            throw new Error('Study book ID is required');
        }
        
        if (!sessionData.startedAt) {
            throw new Error('Start time is required');
        }
        
        if (typeof sessionData.durationMs !== 'number' || sessionData.durationMs < 0) {
            throw new Error('Valid duration is required');
        }
        
        if (typeof sessionData.totalChars !== 'number' || sessionData.totalChars < 0) {
            throw new Error('Valid total character count is required');
        }
        
        if (typeof sessionData.correctChars !== 'number' || sessionData.correctChars < 0) {
            throw new Error('Valid correct character count is required');
        }
        
        if (sessionData.correctChars > sessionData.totalChars) {
            throw new Error('Correct characters cannot exceed total characters');
        }
    }

    /**
     * Build query parameters for statistics
     * @param {Object} params - Parameters
     * @returns {string} Query string
     */
    buildStatsQueryParams(params) {
        const queryParams = {};
        
        if (params.period) {
            queryParams.period = params.period;
        }
        
        if (params.startDate) {
            queryParams.startDate = this.formatDate(params.startDate);
        }
        
        if (params.endDate) {
            queryParams.endDate = this.formatDate(params.endDate);
        }
        
        if (params.language) {
            queryParams.language = params.language;
        }
        
        return new URLSearchParams(queryParams).toString();
    }

    /**
     * Build query parameters for history
     * @param {Object} params - Parameters
     * @returns {string} Query string
     */
    buildHistoryQueryParams(params) {
        const queryParams = {};
        
        if (typeof params.page === 'number') {
            queryParams.page = params.page;
        }
        
        if (typeof params.size === 'number') {
            queryParams.size = params.size;
        }
        
        if (params.language) {
            queryParams.language = params.language;
        }
        
        if (params.startDate) {
            queryParams.startDate = this.formatDate(params.startDate);
        }
        
        if (params.endDate) {
            queryParams.endDate = this.formatDate(params.endDate);
        }
        
        return new URLSearchParams(queryParams).toString();
    }

    /**
     * Build query parameters for trends
     * @param {Object} params - Parameters
     * @returns {string} Query string
     */
    buildTrendsQueryParams(params) {
        const queryParams = {};
        
        if (params.period) {
            queryParams.period = params.period;
        }
        
        if (typeof params.limit === 'number') {
            queryParams.limit = params.limit;
        }
        
        if (params.language) {
            queryParams.language = params.language;
        }
        
        return new URLSearchParams(queryParams).toString();
    }

    /**
     * Transform statistics response
     * @param {*} response - API response
     * @returns {Object} Transformed statistics
     */
    transformStatsResponse(response) {
        return {
            totalSessions: response.totalSessions || 0,
            totalDuration: response.totalDuration || 0,
            averageAccuracy: response.averageAccuracy || 0,
            averageSpeed: response.averageSpeed || 0,
            bestAccuracy: response.bestAccuracy || 0,
            bestSpeed: response.bestSpeed || 0,
            languageStats: response.languageStats || [],
            recentSessions: response.recentSessions || [],
            ...response
        };
    }

    /**
     * Transform history response
     * @param {*} response - API response
     * @returns {Object} Transformed history
     */
    transformHistoryResponse(response) {
        if (Array.isArray(response)) {
            return {
                content: response,
                totalElements: response.length,
                totalPages: 1,
                number: 0,
                size: response.length
            };
        }
        
        return {
            content: response.content || [],
            totalElements: response.totalElements || 0,
            totalPages: response.totalPages || 0,
            number: response.number || 0,
            size: response.size || 0,
            ...response
        };
    }

    /**
     * Format date for API
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string (YYYY-MM-DD)
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    /**
     * Format datetime for API
     * @param {Date|string} datetime - Datetime to format
     * @returns {string} Formatted datetime string (ISO format)
     */
    formatDateTime(datetime) {
        return new Date(datetime).toISOString();
    }

    /**
     * Handle typing-specific errors
     * @param {Error} error - Original error
     * @param {string} operation - Operation that failed
     * @returns {Error} Enhanced error
     */
    handleTypingError(error, operation) {
        console.error(`Typing API error during ${operation}:`, error);
        
        // Enhance error messages for better user experience
        if (error.status === 400) {
            if (operation.includes('save')) {
                error.message = 'タイピング結果の保存に失敗しました。データを確認してください。';
            } else {
                error.message = 'リクエストの内容に問題があります。条件を確認してください。';
            }
        } else if (error.status === 404) {
            error.message = '指定されたデータが見つかりません。';
        } else if (error.status === 422) {
            error.message = 'タイピングデータの形式が正しくありません。';
        } else if (error.isNetworkError) {
            error.message = 'ネットワークに接続できません。インターネット接続を確認してください。';
        } else if (!error.message || error.message.includes('HTTP error')) {
            error.message = 'タイピングデータの処理中にエラーが発生しました。しばらく待ってから再試行してください。';
        }
        
        return error;
    }
}

export default TypingApiService;