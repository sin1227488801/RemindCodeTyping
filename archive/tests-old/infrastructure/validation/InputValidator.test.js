import InputValidator from '../../../Rct/js/infrastructure/validation/InputValidator.js';

describe('InputValidator', () => {
    
    describe('SQL Injection Detection', () => {
        test('should detect SQL injection patterns', () => {
            expect(InputValidator.containsSqlInjection("'; DROP TABLE users; --")).toBe(true);
            expect(InputValidator.containsSqlInjection("1' OR '1'='1")).toBe(true);
            expect(InputValidator.containsSqlInjection("UNION SELECT * FROM passwords")).toBe(true);
            expect(InputValidator.containsSqlInjection("admin'--")).toBe(true);
        });
        
        test('should not flag safe inputs as SQL injection', () => {
            expect(InputValidator.containsSqlInjection("normal text")).toBe(false);
            expect(InputValidator.containsSqlInjection("user123")).toBe(false);
            expect(InputValidator.containsSqlInjection("")).toBe(false);
            expect(InputValidator.containsSqlInjection(null)).toBe(false);
        });
    });
    
    describe('XSS Detection', () => {
        test('should detect XSS patterns', () => {
            expect(InputValidator.containsXss("<script>alert('xss')</script>")).toBe(true);
            expect(InputValidator.containsXss("javascript:alert('xss')")).toBe(true);
            expect(InputValidator.containsXss("<img src=x onerror=alert('xss')>")).toBe(true);
            expect(InputValidator.containsXss("onload=alert('xss')")).toBe(true);
        });
        
        test('should not flag safe inputs as XSS', () => {
            expect(InputValidator.containsXss("normal text")).toBe(false);
            expect(InputValidator.containsXss("Hello world")).toBe(false);
            expect(InputValidator.containsXss("")).toBe(false);
            expect(InputValidator.containsXss(null)).toBe(false);
        });
    });
    
    describe('Path Traversal Detection', () => {
        test('should detect path traversal patterns', () => {
            expect(InputValidator.containsPathTraversal("../../../etc/passwd")).toBe(true);
            expect(InputValidator.containsPathTraversal("..\\..\\windows\\system32")).toBe(true);
            expect(InputValidator.containsPathTraversal("%2e%2e%2f")).toBe(true);
        });
        
        test('should not flag safe paths as traversal', () => {
            expect(InputValidator.containsPathTraversal("/api/users")).toBe(false);
            expect(InputValidator.containsPathTraversal("normal/path")).toBe(false);
            expect(InputValidator.containsPathTraversal("")).toBe(false);
            expect(InputValidator.containsPathTraversal(null)).toBe(false);
        });
    });
    
    describe('Safe Input Validation', () => {
        test('should validate safe inputs', () => {
            expect(InputValidator.isSafeInput("normal text")).toBe(true);
            expect(InputValidator.isSafeInput("user123")).toBe(true);
            expect(InputValidator.isSafeInput("Hello World!")).toBe(true);
            expect(InputValidator.isSafeInput("")).toBe(true);
            expect(InputValidator.isSafeInput(null)).toBe(true);
        });
        
        test('should reject unsafe inputs', () => {
            expect(InputValidator.isSafeInput("'; DROP TABLE users; --")).toBe(false);
            expect(InputValidator.isSafeInput("<script>alert('xss')</script>")).toBe(false);
            expect(InputValidator.isSafeInput("../../../etc/passwd")).toBe(false);
        });
    });
    
    describe('Email Validation', () => {
        test('should validate correct email formats', () => {
            expect(InputValidator.isValidEmail("user@example.com")).toBe(true);
            expect(InputValidator.isValidEmail("test.email+tag@domain.co.uk")).toBe(true);
            expect(InputValidator.isValidEmail("simple@test.org")).toBe(true);
        });
        
        test('should reject invalid email formats', () => {
            expect(InputValidator.isValidEmail("invalid-email")).toBe(false);
            expect(InputValidator.isValidEmail("@domain.com")).toBe(false);
            expect(InputValidator.isValidEmail("user@")).toBe(false);
            expect(InputValidator.isValidEmail("user@domain")).toBe(false);
            expect(InputValidator.isValidEmail("javascript:alert('xss')@domain.com")).toBe(false);
        });
    });
    
    describe('URL Validation', () => {
        test('should validate correct URL formats', () => {
            expect(InputValidator.isValidUrl("https://example.com")).toBe(true);
            expect(InputValidator.isValidUrl("http://test.org/path")).toBe(true);
            expect(InputValidator.isValidUrl("https://subdomain.example.com/path/to/resource")).toBe(true);
        });
        
        test('should reject invalid URL formats', () => {
            expect(InputValidator.isValidUrl("ftp://example.com")).toBe(false);
            expect(InputValidator.isValidUrl("javascript:alert('xss')")).toBe(false);
            expect(InputValidator.isValidUrl("data:text/html,<script>alert('xss')</script>")).toBe(false);
            expect(InputValidator.isValidUrl("http://")).toBe(false);
            expect(InputValidator.isValidUrl("not-a-url")).toBe(false);
        });
    });
    
    describe('Password Validation', () => {
        test('should validate strong passwords', () => {
            expect(InputValidator.isValidPassword("SecurePass123!")).toBe(true);
            expect(InputValidator.isValidPassword("MyP@ssw0rd")).toBe(true);
            expect(InputValidator.isValidPassword("Str0ng&P@ss")).toBe(true);
        });
        
        test('should reject weak passwords', () => {
            expect(InputValidator.isValidPassword("password")).toBe(false); // No uppercase, digit, special
            expect(InputValidator.isValidPassword("PASSWORD")).toBe(false); // No lowercase, digit, special
            expect(InputValidator.isValidPassword("Password")).toBe(false); // No digit, special
            expect(InputValidator.isValidPassword("Password123")).toBe(false); // No special
            expect(InputValidator.isValidPassword("Pass!")).toBe(false); // Too short
        });
    });
    
    describe('Language Validation', () => {
        test('should validate supported programming languages', () => {
            expect(InputValidator.isValidLanguage("JavaScript")).toBe(true);
            expect(InputValidator.isValidLanguage("Java")).toBe(true);
            expect(InputValidator.isValidLanguage("Python")).toBe(true);
            expect(InputValidator.isValidLanguage("C++")).toBe(true);
        });
        
        test('should reject unsupported languages', () => {
            expect(InputValidator.isValidLanguage("FakeLanguage")).toBe(false);
            expect(InputValidator.isValidLanguage("")).toBe(false);
            expect(InputValidator.isValidLanguage(null)).toBe(false);
            expect(InputValidator.isValidLanguage("<script>alert('xss')</script>")).toBe(false);
        });
    });
    
    describe('Length Validation', () => {
        test('should validate input length correctly', () => {
            expect(InputValidator.isValidLength("short", 10)).toBe(true);
            expect(InputValidator.isValidLength("exactly10!", 10)).toBe(true);
            expect(InputValidator.isValidLength("this is too long", 10)).toBe(false);
            expect(InputValidator.isValidLength(null, 10)).toBe(true);
            expect(InputValidator.isValidLength("", 10)).toBe(true);
        });
    });
    
    describe('Form Data Validation', () => {
        test('should validate form data with rules', () => {
            const formData = {
                email: 'user@example.com',
                password: 'SecurePass123!',
                language: 'JavaScript',
                question: 'console.log("Hello World");'
            };
            
            const rules = {
                email: { required: true, email: true, secure: true },
                password: { required: true, password: true, minLength: 8, secure: true },
                language: { required: true, language: true, secure: true },
                question: { required: true, maxLength: 5000, secure: true }
            };
            
            const result = InputValidator.validateFormData(formData, rules);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });
        
        test('should detect validation errors', () => {
            const formData = {
                email: 'invalid-email',
                password: 'weak',
                language: 'FakeLanguage',
                question: ''
            };
            
            const rules = {
                email: { required: true, email: true, secure: true },
                password: { required: true, password: true, minLength: 8, secure: true },
                language: { required: true, language: true, secure: true },
                question: { required: true, maxLength: 5000, secure: true }
            };
            
            const result = InputValidator.validateFormData(formData, rules);
            expect(result.isValid).toBe(false);
            expect(result.errors.email).toBeDefined();
            expect(result.errors.password).toBeDefined();
            expect(result.errors.language).toBeDefined();
            expect(result.errors.question).toBeDefined();
        });
    });
    
    describe('Input Sanitization', () => {
        test('should sanitize HTML content', () => {
            expect(InputValidator.sanitizeHtml("<script>alert('xss')</script>"))
                .toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
            expect(InputValidator.sanitizeHtml("Normal text")).toBe("Normal text");
        });
        
        test('should sanitize dangerous input', () => {
            expect(InputValidator.sanitizeInput("<script>alert('xss')</script>"))
                .toBe("scriptalert(xss)/script");
            expect(InputValidator.sanitizeInput("'; DROP TABLE users; --"))
                .toBe(" DROP TABLE users --");
        });
    });
});