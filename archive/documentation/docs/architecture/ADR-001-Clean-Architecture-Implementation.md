# ADR-001: Clean Architecture Implementation

## Status
Accepted

## Date
2024-01-15

## Context

The RemindCodeTyping application was initially developed with a traditional layered architecture that mixed business logic with infrastructure concerns. As the application grew, several issues became apparent:

1. **Tight Coupling**: Business logic was tightly coupled to Spring Boot framework and database implementation details
2. **Testing Difficulties**: Unit testing was challenging due to framework dependencies
3. **Maintainability Issues**: Changes to infrastructure required modifications to business logic
4. **Unclear Boundaries**: Responsibilities were not clearly separated between layers

The team needed to refactor the application to improve maintainability, testability, and flexibility for future changes.

## Decision

We will implement Clean Architecture (also known as Hexagonal Architecture or Ports and Adapters) with the following structure:

### Backend Architecture Layers

1. **Domain Layer** (`com.rct.domain`)
   - Contains business entities, value objects, and domain services
   - No dependencies on external frameworks or libraries
   - Pure Java with business logic only

2. **Application Layer** (`com.rct.application`)
   - Contains use cases and application services
   - Orchestrates domain objects to fulfill business requirements
   - Defines interfaces for infrastructure dependencies

3. **Infrastructure Layer** (`com.rct.infrastructure`)
   - Implements application layer interfaces
   - Contains framework-specific code (Spring, JPA, etc.)
   - Handles external system integrations

4. **Presentation Layer** (`com.rct.presentation`)
   - Contains controllers, DTOs, and request/response handling
   - Handles HTTP concerns and input validation
   - Maps between external contracts and internal models

### Frontend Architecture Layers

1. **Domain Layer** (`js/domain`)
   - Contains domain models and business logic
   - Pure JavaScript with no framework dependencies

2. **Application Layer** (`js/application`)
   - Contains services, controllers, and state management
   - Coordinates domain objects and infrastructure services

3. **Infrastructure Layer** (`js/infrastructure`)
   - Contains HTTP clients, storage adapters, and external integrations
   - Framework-specific implementations

4. **Presentation Layer** (`js/presentation`)
   - Contains UI components and view logic
   - Handles user interactions and display concerns

### Dependency Rules

- **Dependency Inversion**: Inner layers define interfaces, outer layers implement them
- **No Inward Dependencies**: Outer layers can depend on inner layers, but not vice versa
- **Framework Independence**: Business logic is independent of frameworks and libraries

## Consequences

### Positive

1. **Improved Testability**: Domain logic can be tested without framework dependencies
2. **Better Separation of Concerns**: Clear boundaries between business logic and technical concerns
3. **Framework Independence**: Business logic is not tied to specific frameworks
4. **Easier Maintenance**: Changes to infrastructure don't affect business logic
5. **Better Code Organization**: Clear structure makes codebase easier to navigate
6. **Flexibility**: Easy to swap out infrastructure components (databases, frameworks, etc.)

### Negative

1. **Initial Complexity**: More complex structure requires learning curve for developers
2. **More Code**: Additional interfaces and mapping code required
3. **Potential Over-Engineering**: May be overkill for simple CRUD operations
4. **Performance Overhead**: Additional abstraction layers may impact performance slightly

### Mitigation Strategies

1. **Team Training**: Provide Clean Architecture training and documentation
2. **Code Reviews**: Ensure architecture principles are followed in reviews
3. **Automated Testing**: Comprehensive test suite to catch architectural violations
4. **Documentation**: Maintain clear documentation of architecture decisions and patterns

## Implementation Details

### Domain Layer Example

```java
// Domain Entity
public class User {
    private final UserId id;
    private final LoginId loginId;
    private LoginStatistics loginStatistics;
    
    // Business methods only
    public void recordLogin(LocalDate loginDate) {
        this.loginStatistics = this.loginStatistics.updateForLogin(loginDate);
    }
}

// Repository Interface (defined in domain)
public interface UserRepository {
    Optional<User> findByLoginId(LoginId loginId);
    User save(User user);
}
```

### Application Layer Example

```java
// Use Case
@Service
public class AuthenticateUserUseCase {
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    
    public AuthenticationResult execute(AuthenticationCommand command) {
        // Orchestrate domain objects
        User user = userRepository.findByLoginId(command.getLoginId())
            .orElseThrow(() -> new AuthenticationException("User not found"));
        
        if (!passwordService.matches(command.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }
        
        user.recordLogin(LocalDate.now());
        userRepository.save(user);
        
        return AuthenticationResult.success(user);
    }
}
```

### Infrastructure Layer Example

```java
// Repository Implementation
@Repository
public class JpaUserRepository implements UserRepository {
    private final JpaUserEntityRepository jpaRepository;
    private final UserMapper mapper;
    
    @Override
    public Optional<User> findByLoginId(LoginId loginId) {
        return jpaRepository.findByLoginId(loginId.getValue())
            .map(mapper::toDomain);
    }
}
```

## Alternatives Considered

1. **Traditional Layered Architecture**: Rejected due to tight coupling issues
2. **MVC Pattern**: Rejected as it doesn't provide clear separation of business logic
3. **Domain-Driven Design without Clean Architecture**: Rejected as it doesn't address infrastructure coupling

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design by Eric Evans](https://domainlanguage.com/ddd/)

## Review Date

This ADR should be reviewed in 6 months (July 2024) to assess the effectiveness of the implementation and make any necessary adjustments.