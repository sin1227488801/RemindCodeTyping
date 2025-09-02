/**
 * Frontend input validation utilities for security and data integrity.
 */
class InputValidator {
    
    // Security patterns
    static SQL_INJECTION_PATTERN = /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/i;
    static XSS_PATTERN = /(<script[^>]*>.*?<\/script>|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=)/i;
    static PATH_TRAVERSAL_PATTERN = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i;
    
    // Format patterns
    static EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    static URL_PATTERN = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    static SAFE_TEXT_PATTERN = /^[a-zA-Z0-9\s.,!?;:()\-_@#$%&*+=\[\]{}|\\\"'`~<>/]*$/;
    
    /**
     * Validates input for SQL injection patterns.
     */
    static containsSqlInjection(input) {
        if (!input || typeof input !== 'string') {
            return false;
        }
        return this.SQL_INJECTION_PATTERN.test(input);
    }
    
    /**
     * Validates input for XSS patterns.
     */
    static containsXss(input) {
        if (!input || typeof input !== 'string') {
            return false;
        }
        return this.XSS_PATTERN.test(input);
    }
    
    /**
     * Validates input for path traversal patterns.
     */
    static containsPathTraversal(input) {
        if (!input || typeof input !== 'string') {
            return false;
        }
        return this.PATH_TRAVERSAL_PATTERN.test(input);
    }
    
    /**
     * Comprehensive security validation.
     */
    static isSafeInput(input) {
        if (!input || typeof input !== 'string') {
            return true;
        }
        
        return !this.containsSqlInjection(input) &&
               !this.containsXss(input) &&
               !this.containsPathTraversal(input);
    }
    
    /**
     * Validates email format.
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        
        return this.EMAIL_PATTERN.test(email) && 
               email.length <= 254 && 
               this.isSafeInput(email);
    }
    
    /**
     * Validates URL format.
     */
    static isValidUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        return this.URL_PATTERN.test(url) && 
               url.length <= 2048 && 
               this.isSafeInput(url);
    }
    
    /**
     * Validates input length.
     */
    static isValidLength(input, maxLength) {
        if (!input) {
            return true;
        }
        return input.length <= maxLength;
    }
    
    /**
     * Validates that input contains only safe characters.
     */
    static containsOnlySafeCharacters(input) {
        if (!input || typeof input !== 'string') {
            return true;
        }
        return this.SAFE_TEXT_PATTERN.test(input);
    }
    
    /**
     * Validates password strength.
     */
    static isValidPassword(password, minLength = 8) {
        if (!password || typeof password !== 'string') {
            return false;
        }
        
        if (password.length < minLength) {
            return false;
        }
        
        // Check for at least one uppercase, one lowercase, and one digit
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[@$!%*?&]/.test(password);
        
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
    
    /**
     * Validates programming language name.
     */
    static isValidLanguage(language) {
        const validLanguages = [
            'JavaScript', 'Java', 'Python', 'C++', 'C#', 'C', 'Go', 'Rust',
            'TypeScript', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'HTML',
            'CSS', 'SQL', 'Shell', 'PowerShell', 'Bash', 'R', 'MATLAB',
            'Perl', 'Lua', 'Dart', 'Elixir', 'Haskell', 'Clojure', 'F#',
            'VB.NET', 'Assembly', 'COBOL', 'Fortran', 'Pascal', 'Delphi',
            'Objective-C', 'Groovy', 'Julia', 'Erlang'
        ];
        
        return validLanguages.includes(language) && this.isSafeInput(language);
    }
    
    /**
     * Sanitizes HTML content by removing dangerous elements.
     */
    static sanitizeHtml(input) {
        if (!input || typeof input !== 'string') {
            return input;
        }
        
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML;
    }
    
    /**
     * Sanitizes input by removing potentially dangerous characters.
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return input;
        }
        
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/['"]/g, '') // Remove quotes
            .replace(/[;]/g, '') // Remove semicolons
            .trim();
    }
    
    /**
     * Validates form data comprehensively.
     */
    static validateFormData(formData, rules) {
        const errors = {};
        
        for (const [field, value] of Object.entries(formData)) {
            const fieldRules = rules[field];
            if (!fieldRules) continue;
            
            const fieldErrors = [];
            
            // Required validation
            if (fieldRules.required && (!value || value.trim() === '')) {
                fieldErrors.push(`${field} is required`);
                continue;
            }
            
            // Skip other validations if field is empty and not required
            if (!value || value.trim() === '') {
                continue;
            }
            
            // Length validation
            if (fieldRules.maxLength && !this.isValidLength(value, fieldRules.maxLength)) {
                fieldErrors.push(`${field} must not exceed ${fieldRules.maxLength} characters`);
            }
            
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                fieldErrors.push(`${field} must be at least ${fieldRules.minLength} characters`);
            }
            
            // Security validation
            if (fieldRules.secure && !this.isSafeInput(value)) {
                fieldErrors.push(`${field} contains potentially dangerous content`);
            }
            
            // Email validation
            if (fieldRules.email && !this.isValidEmail(value)) {
                fieldErrors.push(`${field} must be a valid email address`);
            }
            
            // URL validation
            if (fieldRules.url && !this.isValidUrl(value)) {
                fieldErrors.push(`${field} must be a valid URL`);
            }
            
            // Language validation
            if (fieldRules.language && !this.isValidLanguage(value)) {
                fieldErrors.push(`${field} must be a valid programming language`);
            }
            
            // Password validation
            if (fieldRules.password && !this.isValidPassword(value, fieldRules.minLength)) {
                fieldErrors.push(`${field} must contain uppercase, lowercase, digit, and special character`);
            }
            
            // Custom pattern validation
            if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                fieldErrors.push(fieldRules.patternMessage || `${field} format is invalid`);
            }
            
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

export default InputValidator;