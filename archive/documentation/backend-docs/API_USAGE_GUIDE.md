# RemindCodeTyping API Usage Guide

## Overview

The RemindCodeTyping API provides a comprehensive set of endpoints for managing typing practice sessions, study books, and user authentication. This guide covers best practices, common usage patterns, and examples for integrating with the API.

## Base URL

- **Development**: `http://localhost:8080`
- **Staging**: `https://api-staging.remindcodetyping.com`
- **Production**: `https://api.remindcodetyping.com`

## Authentication

### JWT Bearer Token Authentication

The API uses JWT (JSON Web Token) based authentication. Most endpoints require a valid access token in the Authorization header.

#### Getting Started

1. **Register a new user** or **login** to get tokens:

```bash
# Register new user
curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "myusername",
    "password": "mypassword123"
  }'

# Login existing user
curl -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "myusername",
    "password": "mypassword123"
  }'
```

2. **Use the access token** in subsequent requests:

```bash
curl -X GET "${BASE_URL}/api/studybooks" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}"
```

#### Token Management

- **Access tokens** expire after 1 hour
- **Refresh tokens** can be used to get new access tokens
- Use `/api/auth/refresh` before the access token expires

```bash
# Refresh token
curl -X POST "${BASE_URL}/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "${REFRESH_TOKEN}"
  }'
```

### Demo/Guest Access

For testing or demo purposes, you can create a guest session:

```bash
curl -X POST "${BASE_URL}/api/auth/demo"
```

## API Endpoints Overview

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/demo` | Create guest session |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (revoke refresh token) |
| POST | `/api/auth/logout-all` | Logout from all devices |

### Study Book Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/studybooks` | Get paginated study books |
| POST | `/api/studybooks` | Create new study book |
| PUT | `/api/studybooks/{id}` | Update study book |
| DELETE | `/api/studybooks/{id}` | Delete study book |
| GET | `/api/studybooks/random` | Get random study books |
| GET | `/api/studybooks/languages` | Get available languages |

### Typing Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/typing/results` | Record typing session result |
| GET | `/api/typing/statistics` | Get user typing statistics |

## Common Usage Patterns

### 1. Complete User Flow

```bash
#!/bin/bash

BASE_URL="http://localhost:8080"

# 1. Register or login
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "testuser",
    "password": "password123"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $RESPONSE | jq -r '.userId')

# 2. Get study books
curl -X GET "${BASE_URL}/api/studybooks?language=JavaScript&page=0&size=10" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}"

# 3. Create a new study book
STUDY_BOOK=$(curl -s -X POST "${BASE_URL}/api/studybooks" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "JavaScript",
    "question": "const greeting = \"Hello, World!\";",
    "explanation": "Variable declaration with const keyword"
  }')

STUDY_BOOK_ID=$(echo $STUDY_BOOK | jq -r '.id')

# 4. Record typing session
curl -X POST "${BASE_URL}/api/typing/results" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "studyBookId": "'${STUDY_BOOK_ID}'",
    "typedText": "const greeting = \"Hello, World!\";",
    "durationMs": 15000,
    "accuracy": 95.5
  }'

# 5. Get statistics
curl -X GET "${BASE_URL}/api/typing/statistics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}"
```

### 2. Pagination and Filtering

```bash
# Get study books with pagination and filtering
curl -X GET "${BASE_URL}/api/studybooks?language=Python&query=loop&page=0&size=20" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}"

# Get random study books for practice
curl -X GET "${BASE_URL}/api/studybooks/random?language=JavaScript&limit=5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-User-Id: ${USER_ID}"
```

### 3. Error Handling

Always check HTTP status codes and handle errors appropriately:

```javascript
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message} (${errorData.errorCode})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Best Practices

### 1. Authentication

- **Store tokens securely**: Use secure storage mechanisms (not localStorage for sensitive apps)
- **Handle token expiration**: Implement automatic token refresh
- **Logout properly**: Always call logout endpoints to revoke tokens

### 2. Request Headers

Always include required headers:

```bash
-H "Authorization: Bearer ${ACCESS_TOKEN}"
-H "X-User-Id: ${USER_ID}"
-H "Content-Type: application/json"
```

### 3. Error Handling

- Check HTTP status codes
- Parse error responses for detailed information
- Implement retry logic for transient errors (5xx)
- Don't retry authentication errors (401, 403)

### 4. Rate Limiting

- Respect rate limits (check response headers)
- Implement exponential backoff for retries
- Cache responses when appropriate

### 5. Data Validation

- Validate input data before sending requests
- Handle validation errors gracefully
- Provide user-friendly error messages

## Response Formats

### Success Responses

All successful responses return JSON with appropriate HTTP status codes:

- `200 OK`: Successful GET, PUT requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests

### Error Responses

Error responses follow a consistent format:

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

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `INVALID_CREDENTIALS` | Authentication failed |
| `USER_NOT_FOUND` | User does not exist |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Access denied |
| `SYSTEM_ERROR` | Internal server error |

## SDK Examples

### JavaScript/TypeScript

```typescript
class RctApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private userId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(loginId: string, password: string) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    });
    
    this.accessToken = response.accessToken;
    this.userId = response.userId;
    return response;
  }

  async getStudyBooks(params: {
    language?: string;
    query?: string;
    page?: number;
    size?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/api/studybooks?${searchParams}`);
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message}`);
    }

    return response.json();
  }
}
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class RctApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.user_id: Optional[str] = None

    def login(self, login_id: str, password: str) -> Dict[str, Any]:
        response = self._request('/api/auth/login', {
            'loginId': login_id,
            'password': password
        })
        
        self.access_token = response['accessToken']
        self.user_id = response['userId']
        return response

    def get_study_books(self, language: Optional[str] = None, 
                       query: Optional[str] = None,
                       page: int = 0, size: int = 20) -> Dict[str, Any]:
        params = {'page': page, 'size': size}
        if language:
            params['language'] = language
        if query:
            params['query'] = query
            
        return self._request('/api/studybooks', params=params, method='GET')

    def _request(self, endpoint: str, data: Optional[Dict] = None, 
                params: Optional[Dict] = None, method: str = 'POST') -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        if self.user_id:
            headers['X-User-Id'] = self.user_id

        if method == 'GET':
            response = requests.get(url, headers=headers, params=params)
        else:
            response = requests.post(url, headers=headers, json=data, params=params)

        response.raise_for_status()
        return response.json()
```

## Testing

### Using curl

```bash
# Test authentication
curl -X POST "${BASE_URL}/api/auth/demo" | jq '.'

# Test with invalid token
curl -X GET "${BASE_URL}/api/studybooks" \
  -H "Authorization: Bearer invalid_token" \
  -H "X-User-Id: invalid-uuid"
```

### Using Postman

1. Import the OpenAPI specification from `/v3/api-docs`
2. Set up environment variables for `BASE_URL`, `ACCESS_TOKEN`, `USER_ID`
3. Use pre-request scripts for automatic token refresh

## Support

- **API Documentation**: Available at `/swagger-ui/index.html`
- **OpenAPI Spec**: Available at `/v3/api-docs`
- **Issues**: Report issues on GitHub
- **Email**: support@remindcodetyping.com

## Changelog

### Version 1.0.0
- Initial API release
- Authentication with JWT
- Study book CRUD operations
- Typing session recording
- User statistics