/**
 * Typing Service
 * Coordinates typing session-related operations and business logic
 */
class TypingService {
    /**
     * Creates a new TypingService instance
     * @param {Object} apiClient - API client for backend communication
     * @param {SessionRepository} sessionRepository - Session repository
     * @param {UserRepository} userRepository - User repository
     * @param {EventBus} eventBus - Event bus for application events
     */
    constructor(apiClient, sessionRepository, userRepository, eventBus) {
        this.apiClient = apiClient;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.eventBus = eventBus;
    }

    /**
     * Records a typing session result
     * @param {TypingSession} session - Completed typing session
     * @param {TypingResult} result - Session result
     * @returns {Promise<Object>} Recording result
     */
    async recordResult(session, result) {
        try {
            const currentUser = this.userRepository.getCurrentUser();

            // Emit record attempt event
            await this.eventBus.emit('typing:record:attempt', {
                sessionId: session.id,
                result
            });

            // Add to local history
            this.sessionRepository.addToHistory(session, result);

            // If user is authenticated (not guest), save to backend
            if (currentUser && !currentUser.isGuest) {
                const response = await this.apiClient.post('/typing-sessions', {
                    studyBookId: session.studyBook.id,
                    totalCharacters: result.totalCharacters,
                    correctCharacters: result.correctCharacters,
                    duration: result.duration.toMilliseconds(),
                    accuracy: result.accuracy,
                    startedAt: session.startTime.toISOString(),
                    completedAt: new Date().toISOString()
                });

                if (response.success) {
                    // Emit successful record event
                    await this.eventBus.emit('typing:record:success', {
                        sessionId: session.id,
                        result,
                        serverResult: response.data
                    });

                    return {
                        success: true,
                        result: response.data
                    };
                } else {
                    // Emit failed record event (but local save succeeded)
                    await this.eventBus.emit('typing:record:partial', {
                        sessionId: session.id,
                        result,
                        error: response.error
                    });

                    return {
                        success: true, // Local save succeeded
                        warning: 'Result saved locally but failed to sync with server',
                        error: response.error
                    };
                }
            } else {
                // Guest user - only local save
                await this.eventBus.emit('typing:record:success', {
                    sessionId: session.id,
                    result
                });

                return {
                    success: true,
                    result: result
                };
            }

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('typing:record:error', {
                sessionId: session.id,
                result,
                error: error.message
            });

            return {
                success: false,
                error: error.message || 'An error occurred while recording typing result'
            };
        }
    }

    /**
     * Gets user typing statistics
     * @param {string} userId - User ID (optional, uses current user if not provided)
     * @param {Object} options - Filter options
     * @returns {Promise<Object>} Statistics result
     */
    async getUserStatistics(userId = null, options = {}) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            const targetUserId = userId || (currentUser ? currentUser.id : null);

            if (!targetUserId) {
                return { success: false, error: 'No user specified' };
            }

            // Emit get statistics attempt event
            await this.eventBus.emit('typing:statistics:attempt', {
                userId: targetUserId,
                options
            });

            // Get local statistics
            const localStats = this.sessionRepository.getAggregatedStatistics(options);

            // If user is authenticated and requesting their own stats, try to get from server
            if (currentUser && !currentUser.isGuest && targetUserId === currentUser.id) {
                try {
                    const queryParams = new URLSearchParams();

                    if (options.language) queryParams.append('language', options.language);
                    if (options.dateFrom) queryParams.append('dateFrom', options.dateFrom);
                    if (options.dateTo) queryParams.append('dateTo', options.dateTo);
                    if (options.period) queryParams.append('period', options.period);

                    const response = await this.apiClient.get(`/typing-sessions/statistics?${queryParams.toString()}`);

                    if (response.success) {
                        // Emit successful get statistics event
                        await this.eventBus.emit('typing:statistics:success', {
                            userId: targetUserId,
                            statistics: response.data
                        });

                        return {
                            success: true,
                            statistics: response.data
                        };
                    }
                } catch (error) {
                    console.warn('Failed to get server statistics, using local:', error);
                }
            }

            // Use local statistics as fallback
            await this.eventBus.emit('typing:statistics:success', {
                userId: targetUserId,
                statistics: localStats
            });

            return {
                success: true,
                statistics: localStats
            };

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('typing:statistics:error', {
                userId: userId,
                error: error.message
            });

            return {
                success: false,
                error: error.message || 'An error occurred while getting statistics'
            };
        }
    }

    /**
     * Gets typing session history
     * @param {Object} options - Filter and pagination options
     * @returns {Promise<Object>} History result
     */
    async getSessionHistory(options = {}) {
        try {
            const currentUser = this.userRepository.getCurrentUser();

            // Emit get history attempt event
            await this.eventBus.emit('typing:history:attempt', { options });

            // Get local history
            const localHistory = this.sessionRepository.getHistory(options);

            // If user is authenticated, try to get from server
            if (currentUser && !currentUser.isGuest) {
                try {
                    const queryParams = new URLSearchParams();

                    if (options.page !== undefined) queryParams.append('page', options.page);
                    if (options.size !== undefined) queryParams.append('size', options.size);
                    if (options.language) queryParams.append('language', options.language);
                    if (options.dateFrom) queryParams.append('dateFrom', options.dateFrom);
                    if (options.dateTo) queryParams.append('dateTo', options.dateTo);
                    if (options.sortBy) queryParams.append('sortBy', options.sortBy);
                    if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

                    const response = await this.apiClient.get(`/typing-sessions?${queryParams.toString()}`);

                    if (response.success) {
                        const serverHistory = {
                            sessions: response.data.content,
                            pagination: {
                                page: response.data.page,
                                size: response.data.size,
                                totalElements: response.data.totalElements,
                                totalPages: response.data.totalPages,
                                hasNext: !response.data.last,
                                hasPrevious: response.data.page > 0
                            }
                        };

                        // Emit successful get history event
                        await this.eventBus.emit('typing:history:success', {
                            history: serverHistory
                        });

                        return {
                            success: true,
                            history: serverHistory
                        };
                    }
                } catch (error) {
                    console.warn('Failed to get server history, using local:', error);
                }
            }

            // Use local history as fallback
            await this.eventBus.emit('typing:history:success', {
                history: localHistory
            });

            return {
                success: true,
                history: localHistory
            };

        } catch (error) {
            // Emit error event
            await this.eventBus.emit('typing:history:error', {
                options,
                error: error.message
            });

            return {
                success: false,
                error: error.message || 'An error occurred while getting session history'
            };
        }
    }

    /**
     * Calculates typing accuracy
     * @param {string} typedText - Text that was typed
     * @param {string} targetText - Target text
     * @returns {number} Accuracy percentage (0-100)
     */
    calculateAccuracy(typedText, targetText) {
        if (!typedText || typedText.length === 0) {
            return 0;
        }

        if (!targetText || targetText.length === 0) {
            return 0;
        }

        let correctCharacters = 0;
        const minLength = Math.min(typedText.length, targetText.length);

        // Count correct characters
        for (let i = 0; i < minLength; i++) {
            if (typedText[i] === targetText[i]) {
                correctCharacters++;
            }
        }

        // Calculate accuracy based on typed text length
        const accuracy = (correctCharacters / typedText.length) * 100;
        return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculates words per minute (WPM)
     * @param {number} totalCharacters - Total characters typed
     * @param {number} durationMinutes - Duration in minutes
     * @returns {number} Words per minute
     */
    calculateWPM(totalCharacters, durationMinutes) {
        if (durationMinutes <= 0) return 0;

        // Standard calculation: 5 characters = 1 word
        const words = totalCharacters / 5;
        return Math.round(words / durationMinutes);
    }

    /**
     * Calculates characters per minute (CPM)
     * @param {number} totalCharacters - Total characters typed
     * @param {number} durationMinutes - Duration in minutes
     * @returns {number} Characters per minute
     */
    calculateCPM(totalCharacters, durationMinutes) {
        if (durationMinutes <= 0) return 0;

        return Math.round(totalCharacters / durationMinutes);
    }

    /**
     * Estimates typing difficulty level
     * @param {string} text - Text to analyze
     * @returns {number} Difficulty level (1-5)
     */
    estimateDifficulty(text) {
        if (!text || text.length === 0) return 1;

        let score = 1;

        // Length factor
        if (text.length > 100) score += 0.5;
        if (text.length > 300) score += 0.5;
        if (text.length > 500) score += 0.5;

        // Special characters factor
        const specialChars = text.match(/[^a-zA-Z0-9\s]/g);
        if (specialChars) {
            score += Math.min(specialChars.length / 20, 1);
        }

        // Complexity patterns
        if (text.includes('\t')) score += 0.3; // Tabs
        if (text.includes('\n')) score += 0.2; // Line breaks
        if (/[{}[\]()]/g.test(text)) score += 0.3; // Brackets
        if (/[<>]/g.test(text)) score += 0.2; // Angle brackets
        if (/['"]/g.test(text)) score += 0.2; // Quotes

        // Programming language patterns
        if (/function|class|interface|import|export/i.test(text)) score += 0.3;
        if (/SELECT|FROM|WHERE|JOIN/i.test(text)) score += 0.2;
        if (/<[^>]+>/g.test(text)) score += 0.3; // HTML tags

        return Math.min(Math.max(Math.round(score), 1), 5);
    }

    /**
     * Estimates typing time for a text
     * @param {string} text - Text to analyze
     * @param {number} averageWPM - Average WPM (default: 40)
     * @returns {number} Estimated time in seconds
     */
    estimateTypingTime(text, averageWPM = 40) {
        if (!text || text.length === 0) return 0;

        const words = text.length / 5; // Standard word calculation
        const baseTimeMinutes = words / averageWPM;

        // Adjust for difficulty
        const difficulty = this.estimateDifficulty(text);
        const difficultyMultiplier = 1 + (difficulty - 1) * 0.3;

        const adjustedTimeMinutes = baseTimeMinutes * difficultyMultiplier;
        return Math.round(adjustedTimeMinutes * 60); // Convert to seconds
    }

    /**
     * Analyzes typing patterns and provides feedback
     * @param {TypingSession} session - Typing session to analyze
     * @returns {Object} Analysis result with feedback
     */
    analyzeTypingPatterns(session) {
        const result = session.getResult();
        if (!result) {
            return { feedback: [], strengths: [], improvements: [] };
        }

        const feedback = [];
        const strengths = [];
        const improvements = [];

        // Accuracy analysis
        if (result.accuracy >= 95) {
            strengths.push('Excellent accuracy - very few mistakes');
        } else if (result.accuracy >= 85) {
            strengths.push('Good accuracy with room for improvement');
        } else if (result.accuracy >= 70) {
            improvements.push('Focus on accuracy - slow down if needed');
        } else {
            improvements.push('Accuracy needs significant improvement - practice more');
        }

        // Speed analysis
        const wpm = this.calculateWPM(result.totalCharacters, result.duration.toMinutes());
        if (wpm >= 60) {
            strengths.push('Excellent typing speed');
        } else if (wpm >= 40) {
            strengths.push('Good typing speed');
        } else if (wpm >= 25) {
            feedback.push('Average typing speed - practice regularly to improve');
        } else {
            improvements.push('Typing speed needs improvement - focus on finger placement');
        }

        // Consistency analysis
        const errorRate = ((result.totalCharacters - result.correctCharacters) / result.totalCharacters) * 100;
        if (errorRate < 5) {
            strengths.push('Very consistent typing with few errors');
        } else if (errorRate > 20) {
            improvements.push('Work on consistency - many corrections needed');
        }

        // Time analysis
        const estimatedTime = this.estimateTypingTime(session.studyBook.question);
        const actualTime = result.duration.toSeconds();

        if (actualTime < estimatedTime * 0.8) {
            strengths.push('Completed faster than expected');
        } else if (actualTime > estimatedTime * 1.5) {
            feedback.push('Take your time - accuracy is more important than speed');
        }

        return {
            feedback,
            strengths,
            improvements,
            metrics: {
                wpm,
                cpm: this.calculateCPM(result.totalCharacters, result.duration.toMinutes()),
                accuracy: result.accuracy,
                errorRate,
                difficulty: this.estimateDifficulty(session.studyBook.question)
            }
        };
    }

    /**
     * Gets personalized recommendations for improvement
     * @param {string} userId - User ID (optional, uses current user if not provided)
     * @returns {Promise<Object>} Recommendations result
     */
    async getRecommendations(userId = null) {
        try {
            const currentUser = this.userRepository.getCurrentUser();
            const targetUserId = userId || (currentUser ? currentUser.id : null);

            if (!targetUserId) {
                return { success: false, error: 'No user specified' };
            }

            // Get user statistics
            const statsResult = await this.getUserStatistics(targetUserId);
            if (!statsResult.success) {
                return { success: false, error: 'Failed to get user statistics' };
            }

            const stats = statsResult.statistics;
            const recommendations = [];

            // Accuracy recommendations
            if (stats.averageAccuracy < 85) {
                recommendations.push({
                    type: 'accuracy',
                    priority: 'high',
                    title: 'Improve Accuracy',
                    description: 'Focus on typing slowly and accurately rather than fast',
                    actions: [
                        'Practice with shorter texts first',
                        'Use proper finger positioning',
                        'Take breaks to avoid fatigue'
                    ]
                });
            }

            // Speed recommendations
            if (stats.averageWpm < 40) {
                recommendations.push({
                    type: 'speed',
                    priority: 'medium',
                    title: 'Increase Typing Speed',
                    description: 'Practice regularly to build muscle memory',
                    actions: [
                        'Practice touch typing exercises',
                        'Use online typing games',
                        'Focus on common word patterns'
                    ]
                });
            }

            // Practice recommendations based on language breakdown
            const languageStats = stats.languageBreakdown;
            const weakLanguages = Object.keys(languageStats)
                .filter(lang => languageStats[lang].averageAccuracy < stats.averageAccuracy - 10)
                .slice(0, 2);

            if (weakLanguages.length > 0) {
                recommendations.push({
                    type: 'practice',
                    priority: 'medium',
                    title: 'Focus on Specific Languages',
                    description: `Practice more with ${weakLanguages.join(' and ')}`,
                    actions: [
                        `Practice ${weakLanguages[0]} syntax patterns`,
                        'Learn common keywords and symbols',
                        'Use language-specific typing exercises'
                    ]
                });
            }

            // Consistency recommendations
            if (stats.totalSessions > 5) {
                const recentSessions = stats.progressTrend.slice(-5);
                const accuracyVariance = this.calculateVariance(recentSessions.map(s => s.accuracy));

                if (accuracyVariance > 100) { // High variance
                    recommendations.push({
                        type: 'consistency',
                        priority: 'low',
                        title: 'Improve Consistency',
                        description: 'Your performance varies significantly between sessions',
                        actions: [
                            'Maintain regular practice schedule',
                            'Ensure proper ergonomics',
                            'Take breaks when tired'
                        ]
                    });
                }
            }

            return {
                success: true,
                recommendations: recommendations.sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
            };

        } catch (error) {
            return {
                success: false,
                error: error.message || 'An error occurred while generating recommendations'
            };
        }
    }

    /**
     * Calculates variance for an array of numbers
     * @param {number[]} values - Array of numbers
     * @returns {number} Variance
     * @private
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Initializes the typing service
     */
    initialize() {
        // Set up periodic sync for authenticated users
        this.setupPeriodicSync();
    }

    /**
     * Sets up periodic synchronization with backend
     * @private
     */
    setupPeriodicSync() {
        // Sync every 5 minutes for authenticated users
        setInterval(async () => {
            const currentUser = this.userRepository.getCurrentUser();
            if (currentUser && !currentUser.isGuest) {
                try {
                    // Sync any pending results
                    await this.syncPendingResults();
                } catch (error) {
                    console.warn('Periodic sync failed:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Syncs pending results with backend
     * @private
     */
    async syncPendingResults() {
        // This would implement logic to sync any locally stored results
        // that haven't been sent to the backend yet
        // For now, this is a placeholder
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TypingService;
} else if (typeof window !== 'undefined') {
    window.TypingService = TypingService;
}