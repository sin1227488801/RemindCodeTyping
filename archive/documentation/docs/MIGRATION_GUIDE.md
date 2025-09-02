# Migration Guide: RemindCodeTyping Refactoring

This guide helps users and developers migrate from the legacy system to the new refactored architecture.

## Overview

The RemindCodeTyping application has undergone a comprehensive refactoring to implement clean architecture principles, improve maintainability, and enhance performance. This migration guide provides step-by-step instructions for transitioning from the legacy system to the new implementation.

## Migration Timeline

### Phase 1: Preparation (Weeks 1-2)
- [ ] Review this migration guide
- [ ] Backup existing data
- [ ] Set up development environment with new codebase
- [ ] Run compatibility tests

### Phase 2: Gradual Migration (Weeks 3-6)
- [ ] Enable feature flags for new components
- [ ] Monitor system performance and stability
- [ ] Gradually increase rollout percentages
- [ ] Address any issues that arise

### Phase 3: Full Migration (Weeks 7-8)
- [ ] Complete rollout of all new features
- [ ] Remove legacy compatibility layers
- [ ] Clean up deprecated code
- [ ] Update documentation

## API Changes

### Authentication API

#### Legacy Endpoint (DEPRECATED)
```http
POST /api/auth/login
Content-Type: application/json

{
  "loginId": "user123",
  "password": "password123"
}
```

#### New Endpoint
```http
POST /api/v2/auth/authenticate
Content-Type: application/json

{
  "credentials": {
    "loginId": "user123",
    "password": "password123"
  }
}
```

#### Response Changes
**Legacy Response:**
```json
{
  "status": "success",
  "token": "legacy_token_123",
  "userId": "user_123"
}
```

**New Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_123",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "loginId": "user123",
      "roles": ["USER"]
    },
    "expiresIn": 3600
  }
}
```

### Study Book API

#### Legacy Endpoint (DEPRECATED)
```http
GET /api/studybooks?userId=123&page=0&size=10
```

#### New Endpoint
```http
GET /api/v2/study-books?page=0&size=10
Authorization: Bearer {jwt_token}
```

#### Response Changes
**Legacy Response:**
```json
{
  "studyBooks": [
    {
      "id": "book123",
      "language": "JavaScript",
      "question": "console.log('Hello');",
      "explanation": "Basic output",
      "isSystemProblem": false
    }
  ],
  "totalCount": 1,
  "currentPage": 0
}
```

**New Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "language": "JavaScript",
        "question": "console.log('Hello');",
        "explanation": "Basic output",
        "isSystemProblem": false,
        "difficultyLevel": 1,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 0,
      "size": 10,
      "totalElements": 1,
      "totalPages": 1
    }
  }
}
```

### Typing Session API

#### Legacy Endpoint (DEPRECATED)
```http
POST /api/typing/record
Content-Type: application/json

{
  "userId": "user123",
  "studyBookId": "book123",
  "totalChars": 100,
  "correctChars": 85,
  "durationMs": 60000
}
```

#### New Endpoint
```http
POST /api/v2/typing-sessions/record
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "studyBookId": "550e8400-e29b-41d4-a716-446655440001",
  "result": {
    "totalCharacters": 100,
    "correctCharacters": 85,
    "duration": "PT1M"
  }
}
```

## Database Schema Changes

### Users Table Migration
The `login_info` table has been split into two normalized tables:

**Old Structure:**
```sql
login_info (
  id, login_id, password_hash, last_login_date, 
  last_login_days, max_login_days, total_login_days
)
```

**New Structure:**
```sql
users (
  id, login_id, password_hash, created_at, updated_at
)

user_login_statistics (
  user_id, last_login_date, consecutive_login_days,
  max_consecutive_login_days, total_login_days
)
```

### Study Books Table Migration
**Old Structure:**
```sql
study_book (
  id, user_id, language, question, explanation, 
  is_system_problem, created_by
)
```

**New Structure:**
```sql
study_books (
  id, user_id, language, question, explanation,
  is_system_problem, difficulty_level, created_by,
  created_at, updated_at
)
```

### Typing Sessions Table Migration
**Old Structure:**
```sql
typing_log (
  id, user_id, study_book_id, started_at,
  duration_ms, total_chars, correct_chars
)
```

**New Structure:**
```sql
typing_sessions (
  id, user_id, study_book_id, started_at, completed_at,
  duration_ms, total_characters, correct_characters,
  accuracy, created_at
)
```

## Frontend Changes

### JavaScript Module Structure

#### Legacy Structure (DEPRECATED)
```javascript
// Old monolithic structure
api.js - Mixed HTTP and UI logic
main.js - All business logic in one file
```

#### New Structure
```javascript
// New modular structure
domain/
  models/
    User.js
    StudyBook.js
    TypingSession.js
application/
  controllers/
    AuthController.js
    StudyBookController.js
    TypingController.js
  services/
    AuthService.js
    StudyBookService.js
    TypingService.js
infrastructure/
  http/
    ApiClient.js
  api/
    AuthApiService.js
    StudyBookApiService.js
    TypingApiService.js
```

### API Client Usage

#### Legacy Usage (DEPRECATED)
```javascript
// Old direct API calls
fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ loginId, password })
})
.then(response => response.json())
.then(data => {
  // Handle response
});
```

#### New Usage
```javascript
// New service-based approach
import { AuthService } from './application/services/AuthService.js';

const authService = new AuthService();
const result = await authService.authenticate({ loginId, password });

if (result.success) {
  // Handle successful authentication
} else {
  // Handle error
}
```

## Configuration Changes

### Environment Variables

#### New Required Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rct_db
DB_USERNAME=rct_user
DB_PASSWORD=secure_password

# Feature Flags
FEATURE_FLAGS_ENABLED=true

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECKS_ENABLED=true
```

### Application Properties

#### New Properties (application.yml)
```yaml
rct:
  security:
    jwt:
      secret: ${JWT_SECRET}
      expiration: ${JWT_EXPIRATION:3600}
  features:
    new-authentication: ${NEW_AUTH_ENABLED:false}
    new-study-books: ${NEW_STUDY_BOOKS_ENABLED:false}
    new-typing-sessions: ${NEW_TYPING_SESSIONS_ENABLED:false}
  monitoring:
    metrics-enabled: ${METRICS_ENABLED:true}
    health-checks-enabled: ${HEALTH_CHECKS_ENABLED:true}
```

## Migration Steps

### Step 1: Data Backup
```bash
# Create database backup
pg_dump rct_database > rct_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup application files
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/app
```

### Step 2: Run Migration Scripts
```bash
# Execute data migration
psql -d rct_database -f db/migration/scripts/data-migration-master.sql

# Validate migration
psql -d rct_database -f db/migration/scripts/data-validation-checks.sql
```

### Step 3: Deploy New Application
```bash
# Build new application
./build.sh

# Deploy with feature flags disabled
export NEW_AUTH_ENABLED=false
export NEW_STUDY_BOOKS_ENABLED=false
export NEW_TYPING_SESSIONS_ENABLED=false

# Start application
./deploy.sh
```

### Step 4: Gradual Feature Rollout
```bash
# Enable authentication for 10% of users
curl -X POST /api/admin/feature-flags/new-jwt-authentication/rollout \
  -H "Content-Type: application/json" \
  -d '{"percentage": 10}'

# Monitor metrics and gradually increase
curl -X POST /api/admin/feature-flags/new-jwt-authentication/rollout \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50}'

# Full rollout
curl -X POST /api/admin/feature-flags/new-jwt-authentication/rollout \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'
```

## Rollback Procedures

### Emergency Rollback
```bash
# Disable all new features immediately
curl -X POST /api/admin/feature-flags/emergency-rollback \
  -H "Content-Type: application/json" \
  -d '{"reason": "Critical issue detected"}'
```

### Database Rollback
```bash
# Restore from backup if needed
psql -d rct_database -f db/migration/scripts/rollback-procedures.sql

# Execute specific rollback
SELECT rollback_complete_migration('backup_20240115_120000');
```

## Testing Migration

### Automated Tests
```bash
# Run migration tests
./mvnw test -Dtest=DataMigrationTest

# Run integration tests
./mvnw test -Dtest=*IntegrationTest

# Run end-to-end tests
npm run test:e2e
```

### Manual Testing Checklist
- [ ] User authentication works with both old and new systems
- [ ] Study book creation and retrieval function correctly
- [ ] Typing sessions are recorded accurately
- [ ] Statistics calculations are consistent
- [ ] Performance is maintained or improved
- [ ] All existing functionality remains available

## Support and Troubleshooting

### Common Issues

#### Issue: Authentication Tokens Not Working
**Solution:** Ensure JWT secret is properly configured and tokens are being generated with correct format.

#### Issue: Database Connection Errors
**Solution:** Verify database credentials and connection pool settings in application.yml.

#### Issue: Feature Flags Not Responding
**Solution:** Check feature flag database tables exist and service is properly initialized.

### Getting Help

- **Documentation:** Check `/docs` directory for detailed technical documentation
- **Logs:** Monitor application logs at `/logs/application.log`
- **Health Checks:** Visit `/actuator/health` for system status
- **Metrics:** Access `/actuator/metrics` for performance data

### Contact Information

- **Development Team:** dev-team@company.com
- **System Administrator:** sysadmin@company.com
- **Emergency Contact:** on-call@company.com

## Post-Migration Cleanup

### After Successful Migration (30 days)
1. Remove legacy compatibility layers
2. Delete deprecated API endpoints
3. Clean up old database views
4. Update documentation
5. Archive old codebase

### Monitoring Period (90 days)
1. Monitor system performance
2. Collect user feedback
3. Address any remaining issues
4. Optimize based on usage patterns
5. Plan future enhancements

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Next Review:** March 2024