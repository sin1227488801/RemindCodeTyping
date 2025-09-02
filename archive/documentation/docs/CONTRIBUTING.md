# Contributing to RemindCodeTyping

## Welcome Contributors! 🎉

Thank you for your interest in contributing to RemindCodeTyping! This guide will help you get started with contributing to our typing practice application for programmers.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Java 17 or higher
- Node.js 18 or higher
- Git
- Docker (for integration tests)
- A GitHub account

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/RemindCodeTyping.git
   cd RemindCodeTyping
   ```

2. **Set up upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/RemindCodeTyping.git
   ```

3. **Install dependencies and verify setup**
   ```bash
   # Backend setup
   cd rct-backend
   ./mvnw clean compile
   ./mvnw test
   
   # Frontend setup
   cd ../
   npm install
   npm test
   ```

4. **Run the application**
   ```bash
   cd rct-backend
   ./mvnw spring-boot:run
   ```

### First Contribution

Look for issues labeled with:
- `good first issue` - Perfect for newcomers
- `help wanted` - We need community help
- `documentation` - Improve our docs
- `bug` - Fix existing issues

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create and switch to a new feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add JWT token refresh functionality
fix(typing): resolve accuracy calculation bug
docs(api): update authentication endpoint documentation
test(user): add unit tests for user service
refactor(database): optimize query performance
```

## Coding Standards

### Java Backend Standards

#### Code Style

We use **Google Java Style** enforced by Spotless:

```bash
# Check formatting
./mvnw spotless:check

# Apply formatting
./mvnw spotless:apply
```

#### Naming Conventions

```java
// Classes: PascalCase
public class UserService { }

// Methods and variables: camelCase
public void createUser() { }
private String userName;

// Constants: UPPER_SNAKE_CASE
private static final String DEFAULT_LANGUAGE = "JavaScript";

// Packages: lowercase with dots
package com.rct.service.user;
```

#### Code Structure

```java
/**
 * Service class for managing user operations.
 * 
 * <p>This service handles user creation, authentication, and profile management
 * following clean architecture principles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    
    /**
     * Creates a new user with the provided information.
     *
     * @param createUserCommand the user creation command
     * @return the created user result
     * @throws UserAlreadyExistsException if user already exists
     */
    public UserResult createUser(CreateUserCommand command) {
        log.info("Creating user with loginId: {}", command.getLoginId());
        
        // Validation
        validateUserDoesNotExist(command.getLoginId());
        
        // Business logic
        User user = User.builder()
            .loginId(new LoginId(command.getLoginId()))
            .passwordHash(passwordService.encode(command.getPassword()))
            .build();
        
        // Persistence
        User savedUser = userRepository.save(user);
        
        log.info("User created successfully with ID: {}", savedUser.getId());
        return UserResult.from(savedUser);
    }
    
    private void validateUserDoesNotExist(String loginId) {
        if (userRepository.existsByLoginId(new LoginId(loginId))) {
            throw new UserAlreadyExistsException(loginId);
        }
    }
}
```

#### Architecture Guidelines

**Clean Architecture Layers:**

1. **Domain Layer** (`com.rct.domain`)
   - Entities, Value Objects, Domain Services
   - No dependencies on external frameworks
   - Pure business logic

2. **Application Layer** (`com.rct.application`)
   - Use Cases, Application Services
   - Orchestrates domain objects
   - Defines interfaces for infrastructure

3. **Infrastructure Layer** (`com.rct.infrastructure`)
   - Repository implementations
   - External service integrations
   - Framework-specific code

4. **Presentation Layer** (`com.rct.presentation`)
   - Controllers, DTOs, Mappers
   - HTTP concerns only
   - Input validation and serialization

**Dependency Rules:**
- Domain layer has no dependencies
- Application layer depends only on domain
- Infrastructure implements application interfaces
- Presentation depends on application layer

### JavaScript Frontend Standards

#### Code Style

We use ESLint and Prettier:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Apply formatting
npm run format
```

#### Naming Conventions

```javascript
// Variables and functions: camelCase
const userName = 'john_doe';
function createUser() { }

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8080';

// Classes: PascalCase
class UserService { }

// Files: kebab-case
// user-service.js, typing-controller.js
```

#### Code Structure

```javascript
/**
 * Service for managing user operations.
 * 
 * Handles user authentication, registration, and profile management
 * with proper error handling and validation.
 */
class UserService {
    constructor(apiClient, validator) {
        this.apiClient = apiClient;
        this.validator = validator;
    }
    
    /**
     * Creates a new user account.
     * 
     * @param {Object} userData - User registration data
     * @param {string} userData.loginId - User login ID
     * @param {string} userData.password - User password
     * @returns {Promise<User>} The created user
     * @throws {ValidationError} If user data is invalid
     * @throws {UserExistsError} If user already exists
     */
    async createUser(userData) {
        // Validation
        this.validator.validateUserData(userData);
        
        try {
            // API call
            const response = await this.apiClient.post('/api/auth/register', userData);
            
            // Transform response
            return new User(response.data);
        } catch (error) {
            // Error handling
            if (error.status === 409) {
                throw new UserExistsError(userData.loginId);
            }
            throw new SystemError('Failed to create user', error);
        }
    }
}
```

#### Module Organization

```javascript
// Domain models
export class User {
    constructor(id, loginId) {
        this.id = id;
        this.loginId = loginId;
    }
    
    isAuthenticated() {
        return !!this.id;
    }
}

// Service layer
export class AuthService {
    // Service implementation
}

// Controller layer
export class AuthController {
    // Controller implementation
}

// Usage
import { User } from './domain/models/User.js';
import { AuthService } from './application/services/AuthService.js';
import { AuthController } from './application/controllers/AuthController.js';
```

### Database Standards

#### Schema Design

```sql
-- Use descriptive table names (plural)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Use foreign key constraints
CREATE TABLE study_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create appropriate indexes
CREATE INDEX idx_study_books_user_language ON study_books(user_id, language);
CREATE INDEX idx_study_books_language ON study_books(language);
```

#### Migration Guidelines

```sql
-- V1__create_users_table.sql
-- Always include rollback information in comments
-- Rollback: DROP TABLE users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_users_login_id ON users(login_id);
```

## Testing Guidelines

### Backend Testing

#### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordService passwordService;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    @DisplayName("Should create user successfully with valid data")
    void shouldCreateUserSuccessfully() {
        // Given
        CreateUserCommand command = CreateUserCommand.builder()
            .loginId("testuser")
            .password("password123")
            .build();
        
        User expectedUser = User.builder()
            .id(UserId.generate())
            .loginId(new LoginId("testuser"))
            .passwordHash(new PasswordHash("hashedpassword"))
            .build();
        
        when(userRepository.existsByLoginId(any())).thenReturn(false);
        when(passwordService.encode("password123")).thenReturn(new PasswordHash("hashedpassword"));
        when(userRepository.save(any())).thenReturn(expectedUser);
        
        // When
        UserResult result = userService.createUser(command);
        
        // Then
        assertThat(result.getLoginId()).isEqualTo("testuser");
        verify(userRepository).save(any(User.class));
    }
    
    @Test
    @DisplayName("Should throw exception when user already exists")
    void shouldThrowExceptionWhenUserExists() {
        // Given
        CreateUserCommand command = CreateUserCommand.builder()
            .loginId("existinguser")
            .password("password123")
            .build();
        
        when(userRepository.existsByLoginId(any())).thenReturn(true);
        
        // When & Then
        assertThatThrownBy(() -> userService.createUser(command))
            .isInstanceOf(UserAlreadyExistsException.class)
            .hasMessage("User already exists: existinguser");
    }
}
```

#### Integration Tests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserControllerIntegrationTest extends BaseIntegrationTest {
    
    @Test
    void shouldCreateUserSuccessfully() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setLoginId("newuser");
        request.setPassword("password123");
        
        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").exists())
            .andExpect(jsonPath("$.loginId").value("newuser"))
            .andExpect(jsonPath("$.accessToken").exists());
    }
}
```

### Frontend Testing

#### Unit Tests (Jest)

```javascript
// UserService.test.js
import { UserService } from '../UserService.js';
import { ApiClient } from '../ApiClient.js';
import { ValidationError, UserExistsError } from '../errors/index.js';

describe('UserService', () => {
    let userService;
    let mockApiClient;
    let mockValidator;
    
    beforeEach(() => {
        mockApiClient = {
            post: jest.fn()
        };
        mockValidator = {
            validateUserData: jest.fn()
        };
        userService = new UserService(mockApiClient, mockValidator);
    });
    
    describe('createUser', () => {
        it('should create user successfully with valid data', async () => {
            // Given
            const userData = { loginId: 'testuser', password: 'password123' };
            const expectedResponse = {
                data: { id: '123', loginId: 'testuser' }
            };
            
            mockApiClient.post.mockResolvedValue(expectedResponse);
            
            // When
            const result = await userService.createUser(userData);
            
            // Then
            expect(result.loginId).toBe('testuser');
            expect(mockValidator.validateUserData).toHaveBeenCalledWith(userData);
            expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/register', userData);
        });
        
        it('should throw UserExistsError when user already exists', async () => {
            // Given
            const userData = { loginId: 'existinguser', password: 'password123' };
            const error = { status: 409 };
            
            mockApiClient.post.mockRejectedValue(error);
            
            // When & Then
            await expect(userService.createUser(userData))
                .rejects.toThrow(UserExistsError);
        });
    });
});
```

#### E2E Tests (Cypress)

```javascript
// cypress/e2e/user-registration.cy.js
describe('User Registration', () => {
    beforeEach(() => {
        cy.visit('/register.html');
    });
    
    it('should register new user successfully', () => {
        // Given
        const userData = {
            loginId: 'testuser',
            password: 'password123'
        };
        
        // When
        cy.get('[data-testid="login-id-input"]').type(userData.loginId);
        cy.get('[data-testid="password-input"]').type(userData.password);
        cy.get('[data-testid="register-button"]').click();
        
        // Then
        cy.url().should('include', '/main.html');
        cy.get('[data-testid="user-info"]').should('contain', userData.loginId);
    });
    
    it('should show error for existing user', () => {
        // Given
        cy.intercept('POST', '/api/auth/register', {
            statusCode: 409,
            body: { errorCode: 'USER_EXISTS', message: 'User already exists' }
        });
        
        // When
        cy.get('[data-testid="login-id-input"]').type('existinguser');
        cy.get('[data-testid="password-input"]').type('password123');
        cy.get('[data-testid="register-button"]').click();
        
        // Then
        cy.get('[data-testid="error-message"]')
            .should('be.visible')
            .and('contain', 'User already exists');
    });
});
```

### Test Coverage Requirements

- **Backend**: Minimum 80% line coverage, 70% branch coverage
- **Frontend**: Minimum 80% line coverage
- **Critical paths**: 100% coverage required
- **Integration tests**: All API endpoints must have integration tests

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature
   git rebase main
   ```

2. **Run all tests**
   ```bash
   # Backend tests
   cd rct-backend
   ./mvnw verify
   
   # Frontend tests
   cd ../
   npm test
   npm run lint
   ```

3. **Update documentation**
   - Update relevant documentation
   - Add/update API documentation
   - Update CHANGELOG.md if applicable

### PR Template

When creating a PR, use this template:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Reviewer should test the changes locally
4. **Documentation**: Ensure documentation is updated
5. **Approval**: Maintainer approval required for merge

### Merge Requirements

- [ ] All CI checks pass
- [ ] At least one approving review from maintainer
- [ ] No merge conflicts
- [ ] Branch is up to date with main
- [ ] All conversations resolved

## Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
 - Java Version: [e.g. 17.0.1]
 - Browser: [e.g. Chrome 96, Firefox 95]
 - Application Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested
- `wontfix` - This will not be worked on
- `duplicate` - This issue or pull request already exists
- `invalid` - This doesn't seem right

## Documentation

### Code Documentation

#### JavaDoc Standards

```java
/**
 * Creates a new study book for the specified user.
 * 
 * <p>This method validates the input data, checks for duplicates,
 * and persists the study book to the database. The study book
 * will be associated with the authenticated user.
 * 
 * @param command the study book creation command containing
 *                language, question, and explanation
 * @return the created study book result with generated ID
 * @throws ValidationException if the input data is invalid
 * @throws DuplicateStudyBookException if a study book with the same
 *                                     question already exists for the user
 * @throws UserNotFoundException if the user does not exist
 * @since 1.0.0
 */
public StudyBookResult createStudyBook(CreateStudyBookCommand command) {
    // Implementation
}
```

#### JSDoc Standards

```javascript
/**
 * Creates a new typing session for practice.
 * 
 * @param {Object} sessionData - The session configuration
 * @param {string} sessionData.studyBookId - ID of the study book to practice
 * @param {Object} sessionData.settings - Practice settings
 * @param {number} sessionData.settings.timeLimit - Time limit in seconds
 * @param {boolean} sessionData.settings.showHints - Whether to show hints
 * @returns {Promise<TypingSession>} The created typing session
 * @throws {ValidationError} When session data is invalid
 * @throws {StudyBookNotFoundError} When study book doesn't exist
 * @example
 * const session = await typingService.createSession({
 *   studyBookId: '123e4567-e89b-12d3-a456-426614174000',
 *   settings: {
 *     timeLimit: 300,
 *     showHints: true
 *   }
 * });
 */
async createSession(sessionData) {
    // Implementation
}
```

### API Documentation

All API endpoints must be documented with OpenAPI annotations:

```java
@Operation(
    summary = "Create study book",
    description = "Creates a new study book with coding question and explanation for typing practice.",
    tags = {"Study Books"}
)
@ApiResponses(value = {
    @ApiResponse(
        responseCode = "201",
        description = "Study book created successfully",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = StudyBookResponse.class)
        )
    ),
    @ApiResponse(
        responseCode = "400",
        description = "Invalid request data",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = ErrorResponse.class)
        )
    )
})
```

## Community

### Communication Channels

- **GitHub Discussions**: General questions and discussions
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions and reviews

### Getting Help

1. **Check existing documentation** in the `/docs` folder
2. **Search existing issues** before creating new ones
3. **Use GitHub Discussions** for questions
4. **Join our community** discussions

### Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes for significant contributions
- GitHub contributor graphs
- Special mentions in project updates

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in pom.xml and package.json
- [ ] Release notes prepared
- [ ] Security review completed (for major releases)

Thank you for contributing to RemindCodeTyping! Your contributions help make coding practice better for developers worldwide. 🚀