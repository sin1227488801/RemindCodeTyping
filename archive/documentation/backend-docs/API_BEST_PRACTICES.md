# API Best Practices Guide

## Overview

This document outlines best practices for developing, maintaining, and consuming the RemindCodeTyping API. Following these guidelines ensures consistency, reliability, and maintainability.

## API Design Principles

### 1. RESTful Design

- Use HTTP methods appropriately:
  - `GET` for retrieving data
  - `POST` for creating resources
  - `PUT` for updating entire resources
  - `PATCH` for partial updates
  - `DELETE` for removing resources

- Use meaningful HTTP status codes:
  - `200 OK` - Successful GET, PUT, PATCH
  - `201 Created` - Successful POST
  - `204 No Content` - Successful DELETE
  - `400 Bad Request` - Client error
  - `401 Unauthorized` - Authentication required
  - `403 Forbidden` - Access denied
  - `404 Not Found` - Resource not found
  - `409 Conflict` - Resource conflict
  - `422 Unprocessable Entity` - Validation error
  - `500 Internal Server Error` - Server error

### 2. URL Structure

```
/api/{version}/{resource}/{id}/{sub-resource}
```

Examples:
- `GET /api/studybooks` - Get all study books
- `GET /api/studybooks/123` - Get specific study book
- `POST /api/studybooks` - Create new study book
- `PUT /api/studybooks/123` - Update study book
- `DELETE /api/studybooks/123` - Delete study book

### 3. Consistent Naming

- Use plural nouns for collections: `/studybooks`, `/users`
- Use kebab-case for multi-word resources: `/typing-sessions`
- Use camelCase for JSON properties: `studyBookId`, `createdAt`

## Request/Response Standards

### 1. Request Headers

Always include appropriate headers:

```http
Content-Type: application/json
Authorization: Bearer {token}
X-User-Id: {userId}
Accept: application/json
```

### 2. Request Body Validation

- Validate all input data
- Use appropriate validation annotations
- Provide clear error messages
- Sanitize input to prevent XSS/injection attacks

```java
@NotBlank(message = "Login ID is required")
@Size(min = 4, max = 50, message = "Login ID must be between 4 and 50 characters")
@SafeInput(maxLength = 50, strict = true, allowHtml = false)
private String loginId;
```

### 3. Response Format

#### Success Response

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "language": "JavaScript",
  "question": "console.log('Hello World');",
  "explanation": "Basic console output",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

#### Error Response

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Login ID is required",
  "timestamp": "2024-01-01T12:00:00Z",
  "details": {
    "field": "loginId",
    "rejectedValue": ""
  }
}
```

#### Paginated Response

```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false
    }
  },
  "totalElements": 100,
  "totalPages": 5,
  "first": true,
  "last": false,
  "numberOfElements": 20
}
```

## Security Best Practices

### 1. Authentication & Authorization

- Use JWT tokens with appropriate expiration times
- Implement refresh token rotation
- Validate user permissions for each request
- Use HTTPS in production

```java
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('USER')")
public ResponseEntity<StudyBookResponse> getStudyBook(@PathVariable UUID id) {
    // Implementation
}
```

### 2. Input Validation & Sanitization

- Validate all input parameters
- Sanitize HTML content
- Prevent SQL injection with parameterized queries
- Use input length limits

```java
@SafeInput(maxLength = 1000, allowHtml = false)
@NotBlank(message = "Question is required")
private String question;
```

### 3. Rate Limiting

- Implement rate limiting per user/IP
- Use appropriate limits for different endpoints
- Return rate limit headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Performance Best Practices

### 1. Database Optimization

- Use appropriate indexes
- Implement query optimization
- Use pagination for large datasets
- Implement caching where appropriate

```java
@Query("SELECT sb FROM StudyBook sb WHERE sb.userId = :userId AND sb.language = :language")
Page<StudyBook> findByUserIdAndLanguage(@Param("userId") UUID userId, 
                                       @Param("language") String language, 
                                       Pageable pageable);
```

### 2. Response Optimization

- Use appropriate HTTP caching headers
- Implement compression (gzip)
- Return only necessary data
- Use ETags for conditional requests

```java
@GetMapping("/{id}")
public ResponseEntity<StudyBookResponse> getStudyBook(@PathVariable UUID id, 
                                                     HttpServletRequest request) {
    String etag = generateETag(id);
    if (request.getHeader("If-None-Match") != null && 
        request.getHeader("If-None-Match").equals(etag)) {
        return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
    }
    
    StudyBookResponse response = studyBookService.getById(id);
    return ResponseEntity.ok()
        .eTag(etag)
        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)))
        .body(response);
}
```

## Error Handling

### 1. Consistent Error Format

All errors should follow the same structure:

```java
@Data
@Builder
public class ErrorResponse {
    private String errorCode;
    private String message;
    private LocalDateTime timestamp;
    private Map<String, Object> details;
}
```

### 2. Error Categories

- **Validation Errors** (400): Input validation failures
- **Authentication Errors** (401): Invalid or missing credentials
- **Authorization Errors** (403): Insufficient permissions
- **Not Found Errors** (404): Resource doesn't exist
- **Conflict Errors** (409): Resource state conflicts
- **Server Errors** (500): Internal system errors

### 3. Global Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
        ErrorResponse error = ErrorResponse.builder()
            .errorCode("VALIDATION_ERROR")
            .message(e.getMessage())
            .timestamp(LocalDateTime.now())
            .details(Map.of("field", e.getField(), "rejectedValue", e.getValue()))
            .build();
        return ResponseEntity.badRequest().body(error);
    }
}
```

## Documentation Standards

### 1. OpenAPI Annotations

Use comprehensive OpenAPI annotations:

```java
@Operation(
    summary = "Create study book",
    description = "Creates a new study book with coding question and explanation"
)
@ApiResponses(value = {
    @ApiResponse(responseCode = "201", description = "Study book created successfully"),
    @ApiResponse(responseCode = "400", description = "Invalid request data"),
    @ApiResponse(responseCode = "401", description = "Authentication required")
})
```

### 2. Example Values

Provide realistic examples:

```java
@Schema(description = "Programming language", example = "JavaScript")
private String language;

@Schema(description = "Code question", example = "console.log('Hello World');")
private String question;
```

### 3. Parameter Documentation

Document all parameters:

```java
@Parameter(
    description = "User ID", 
    required = true, 
    example = "123e4567-e89b-12d3-a456-426614174000"
)
@RequestHeader("X-User-Id") UUID userId
```

## Testing Best Practices

### 1. Unit Tests

- Test all business logic
- Mock external dependencies
- Use meaningful test names
- Achieve high test coverage

```java
@Test
void shouldCreateStudyBookSuccessfully() {
    // Given
    CreateStudyBookCommand command = createValidCommand();
    when(studyBookRepository.save(any())).thenReturn(savedStudyBook);
    
    // When
    StudyBookResult result = useCase.execute(command);
    
    // Then
    assertThat(result.getId()).isNotNull();
    assertThat(result.getLanguage()).isEqualTo(command.getLanguage());
}
```

### 2. Integration Tests

- Test complete request/response cycles
- Use TestContainers for database tests
- Test error scenarios
- Validate security constraints

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class StudyBookControllerIntegrationTest {
    
    @Test
    void shouldCreateStudyBookWithValidRequest() {
        // Test implementation
    }
}
```

### 3. API Contract Tests

- Validate OpenAPI specification
- Test request/response schemas
- Ensure backward compatibility

## Monitoring & Observability

### 1. Logging

- Use structured logging
- Include correlation IDs
- Log at appropriate levels
- Don't log sensitive data

```java
@Slf4j
public class StudyBookController {
    
    @PostMapping
    public ResponseEntity<StudyBookResponse> create(@RequestBody CreateStudyBookRequest request) {
        String correlationId = MDC.get("correlationId");
        log.info("Creating study book for user: {}, correlationId: {}", 
                 getCurrentUserId(), correlationId);
        
        // Implementation
        
        log.info("Study book created successfully: {}, correlationId: {}", 
                 result.getId(), correlationId);
    }
}
```

### 2. Metrics

- Track request counts and latencies
- Monitor error rates
- Track business metrics
- Use appropriate metric names

```java
@Component
public class ApiMetrics {
    
    private final Counter requestCounter;
    private final Timer requestTimer;
    
    public ApiMetrics(MeterRegistry meterRegistry) {
        this.requestCounter = Counter.builder("api.requests.total")
            .description("Total API requests")
            .register(meterRegistry);
            
        this.requestTimer = Timer.builder("api.requests.duration")
            .description("API request duration")
            .register(meterRegistry);
    }
}
```

### 3. Health Checks

- Implement comprehensive health checks
- Check database connectivity
- Verify external service availability
- Return appropriate status codes

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // Check database connectivity
            return Health.up()
                .withDetail("database", "Available")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("database", "Unavailable")
                .withException(e)
                .build();
        }
    }
}
```

## Versioning Strategy

### 1. API Versioning

- Use URL path versioning: `/api/v1/studybooks`
- Maintain backward compatibility
- Deprecate old versions gracefully
- Document version changes

### 2. Schema Evolution

- Add new fields as optional
- Don't remove existing fields without deprecation
- Use appropriate default values
- Version database schemas

## Client Integration Guidelines

### 1. SDK Development

- Provide official SDKs for popular languages
- Include comprehensive examples
- Handle authentication automatically
- Implement retry logic

### 2. Error Handling

- Parse error responses properly
- Implement appropriate retry strategies
- Handle rate limiting gracefully
- Provide user-friendly error messages

### 3. Caching

- Respect cache headers
- Implement client-side caching
- Use ETags for conditional requests
- Cache authentication tokens securely

## Deployment & Operations

### 1. Environment Configuration

- Use environment-specific configurations
- Externalize sensitive configuration
- Validate configuration on startup
- Use feature flags for gradual rollouts

### 2. Database Migrations

- Version all schema changes
- Test migrations thoroughly
- Implement rollback procedures
- Monitor migration performance

### 3. Monitoring

- Set up comprehensive monitoring
- Create alerting rules
- Monitor business metrics
- Track SLA compliance

## Conclusion

Following these best practices ensures that the RemindCodeTyping API remains:

- **Reliable**: Consistent behavior and error handling
- **Secure**: Proper authentication and input validation
- **Performant**: Optimized queries and caching
- **Maintainable**: Clear documentation and testing
- **Scalable**: Efficient resource usage and monitoring

Regular review and updates of these practices help maintain API quality as the system evolves.