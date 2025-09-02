-- Sample Production Data for Migration Testing
-- This file contains realistic production-like data samples for testing migration
-- Requirements: 10.2

-- ============================================================================
-- LEGACY SCHEMA SETUP (Original Tables)
-- ============================================================================

-- Create original login_info table
CREATE TABLE IF NOT EXISTS login_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login_date DATE,
    last_login_days INTEGER DEFAULT 0,
    max_login_days INTEGER DEFAULT 0,
    total_login_days INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create original study_book table
CREATE TABLE IF NOT EXISTS study_book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    language VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    is_system_problem BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES login_info(id) ON DELETE CASCADE
);

-- Create original typing_log table
CREATE TABLE IF NOT EXISTS typing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    study_book_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    duration_ms BIGINT,
    total_chars INTEGER NOT NULL,
    correct_chars INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES login_info(id) ON DELETE CASCADE,
    FOREIGN KEY (study_book_id) REFERENCES study_book(id) ON DELETE CASCADE
);

-- ============================================================================
-- REALISTIC USER DATA
-- ============================================================================

-- Active users with various login patterns
INSERT INTO login_info (id, login_id, password_hash, last_login_date, last_login_days, max_login_days, total_login_days, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john_developer', '$2a$10$N9qo8uLOickgx2ZMRZoMye1VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-15', 15, 20, 45, '2023-06-15 10:30:00', '2024-01-15 09:15:00'),
('550e8400-e29b-41d4-a716-446655440002', 'sarah_coder', '$2a$10$N9qo8uLOickgx2ZMRZoMye2VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-14', 7, 25, 89, '2023-03-20 14:20:00', '2024-01-14 16:45:00'),
('550e8400-e29b-41d4-a716-446655440003', 'mike_student', '$2a$10$N9qo8uLOickgx2ZMRZoMye3VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-10', 3, 12, 28, '2023-09-10 08:00:00', '2024-01-10 11:30:00'),
('550e8400-e29b-41d4-a716-446655440004', 'lisa_expert', '$2a$10$N9qo8uLOickgx2ZMRZoMye4VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-16', 22, 30, 156, '2022-12-01 12:00:00', '2024-01-16 08:20:00'),
('550e8400-e29b-41d4-a716-446655440005', 'guest_user', '$2a$10$N9qo8uLOickgx2ZMRZoMye5VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-05', 1, 5, 12, '2024-01-01 15:30:00', '2024-01-05 10:15:00'),
('550e8400-e29b-41d4-a716-446655440006', 'inactive_user', '$2a$10$N9qo8uLOickgx2ZMRZoMye6VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2023-11-20', 0, 8, 35, '2023-05-15 09:45:00', '2023-11-20 14:30:00'),
('550e8400-e29b-41d4-a716-446655440007', 'power_user', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-16', 45, 60, 234, '2022-08-10 11:15:00', '2024-01-16 07:45:00'),
('550e8400-e29b-41d4-a716-446655440008', 'beginner_01', '$2a$10$N9qo8uLOickgx2ZMRZoMye8VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-12', 2, 4, 8, '2024-01-08 13:20:00', '2024-01-12 15:10:00'),
('550e8400-e29b-41d4-a716-446655440009', 'advanced_user', '$2a$10$N9qo8uLOickgx2ZMRZoMye9VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-15', 18, 35, 127, '2023-01-15 16:30:00', '2024-01-15 12:40:00'),
('550e8400-e29b-41d4-a716-446655440010', 'test_account', '$2a$10$N9qo8uLOickgx2ZMRZoMye0VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-13', 5, 10, 22, '2023-12-01 10:00:00', '2024-01-13 09:30:00');

-- ============================================================================
-- REALISTIC STUDY BOOK DATA
-- ============================================================================

-- System-provided problems (no user_id)
INSERT INTO study_book (id, user_id, language, question, explanation, is_system_problem, created_by, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', NULL, 'JavaScript', 'console.log("Hello World");', 'Basic console output in JavaScript', TRUE, 'system', '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('660e8400-e29b-41d4-a716-446655440002', NULL, 'Python', 'print("Hello World")', 'Basic print statement in Python', TRUE, 'system', '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('660e8400-e29b-41d4-a716-446655440003', NULL, 'Java', 'System.out.println("Hello World");', 'Basic output in Java', TRUE, 'system', '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('660e8400-e29b-41d4-a716-446655440004', NULL, 'C++', '#include <iostream>\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}', 'Basic C++ program structure', TRUE, 'system', '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
('660e8400-e29b-41d4-a716-446655440005', NULL, 'TypeScript', 'const message: string = "Hello World";\nconsole.log(message);', 'TypeScript with type annotations', TRUE, 'system', '2023-01-01 00:00:00', '2023-01-01 00:00:00');

-- User-created problems
INSERT INTO study_book (id, user_id, language, question, explanation, is_system_problem, created_by, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'JavaScript', 'function fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n-1) + fibonacci(n-2);\n}', 'Recursive fibonacci implementation', FALSE, 'john_developer', '2023-07-15 14:30:00', '2023-07-15 14:30:00'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Python', 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)', 'Quicksort algorithm implementation', FALSE, 'sarah_coder', '2023-08-20 16:45:00', '2023-08-20 16:45:00'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Java', 'public class BinarySearch {\n    public static int search(int[] arr, int target) {\n        int left = 0, right = arr.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}', 'Binary search algorithm', FALSE, 'lisa_expert', '2023-09-10 10:20:00', '2023-09-10 10:20:00'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440007', 'C++', 'template<typename T>\nclass LinkedList {\nprivate:\n    struct Node {\n        T data;\n        Node* next;\n        Node(T val) : data(val), next(nullptr) {}\n    };\n    Node* head;\npublic:\n    LinkedList() : head(nullptr) {}\n    void insert(T val) {\n        Node* newNode = new Node(val);\n        newNode->next = head;\n        head = newNode;\n    }\n};', 'Template-based linked list implementation', FALSE, 'power_user', '2023-10-05 13:15:00', '2023-10-05 13:15:00'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440009', 'TypeScript', 'interface User {\n    id: number;\n    name: string;\n    email: string;\n}\n\nclass UserService {\n    private users: User[] = [];\n    \n    addUser(user: User): void {\n        this.users.push(user);\n    }\n    \n    findUser(id: number): User | undefined {\n        return this.users.find(u => u.id === id);\n    }\n}', 'TypeScript interface and class example', FALSE, 'advanced_user', '2023-11-12 09:30:00', '2023-11-12 09:30:00');

-- ============================================================================
-- REALISTIC TYPING SESSION DATA
-- ============================================================================

-- High accuracy sessions
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-01-15 09:00:00', 45000, 26, 26, '2024-01-15 09:00:45'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '2024-01-14 14:30:00', 38000, 20, 20, '2024-01-14 14:30:38'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', '2024-01-16 08:15:00', 42000, 35, 35, '2024-01-16 08:15:42'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', '2024-01-16 07:30:00', 125000, 156, 156, '2024-01-16 07:32:05');

-- Medium accuracy sessions
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '2024-01-10 11:00:00', 65000, 26, 22, '2024-01-10 11:01:05'),
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', '2024-01-05 10:00:00', 58000, 20, 17, '2024-01-05 10:00:58'),
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', '2024-01-12 15:00:00', 78000, 26, 21, '2024-01-12 15:01:18'),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440005', '2024-01-15 12:30:00', 95000, 67, 58, '2024-01-15 12:31:35');

-- Lower accuracy sessions (learning phase)
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', '2024-01-08 13:30:00', 120000, 26, 15, '2024-01-08 13:32:00'),
('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '2024-01-09 16:00:00', 145000, 20, 12, '2024-01-09 16:02:25');

-- Complex code sessions
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', '2024-01-15 10:00:00', 180000, 125, 118, '2024-01-15 10:03:00'),
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', '2024-01-14 15:00:00', 245000, 287, 265, '2024-01-14 15:04:05'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440008', '2024-01-16 09:00:00', 195000, 234, 228, '2024-01-16 09:03:15'),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440009', '2024-01-16 08:00:00', 320000, 456, 445, '2024-01-16 08:05:20'),
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440010', '2024-01-15 13:00:00', 275000, 378, 361, '2024-01-15 13:04:35');

-- ============================================================================
-- EDGE CASES AND BOUNDARY CONDITIONS
-- ============================================================================

-- User with no typing sessions
INSERT INTO login_info (id, login_id, password_hash, last_login_date, last_login_days, max_login_days, total_login_days, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'no_sessions_user', '$2a$10$N9qo8uLOickgx2ZMRZoMye1VdLSnZpX6/Oa2HeuGZtran9L6cOuNu', '2024-01-01', 0, 0, 0, '2024-01-01 12:00:00', '2024-01-01 12:00:00');

-- Study book with very long content
INSERT INTO study_book (id, user_id, language, question, explanation, is_system_problem, created_by, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440007', 'JavaScript', 
'// This is a comprehensive example of a React component with hooks\nimport React, { useState, useEffect, useCallback, useMemo } from ''react'';\nimport { debounce } from ''lodash'';\n\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n  isActive: boolean;\n}\n\ninterface UserListProps {\n  initialUsers: User[];\n  onUserSelect: (user: User) => void;\n}\n\nconst UserList: React.FC<UserListProps> = ({ initialUsers, onUserSelect }) => {\n  const [users, setUsers] = useState<User[]>(initialUsers);\n  const [searchTerm, setSearchTerm] = useState<string>('''');\n  const [loading, setLoading] = useState<boolean>(false);\n  const [error, setError] = useState<string | null>(null);\n\n  // Debounced search function\n  const debouncedSearch = useCallback(\n    debounce((term: string) => {\n      setLoading(true);\n      // Simulate API call\n      setTimeout(() => {\n        const filtered = initialUsers.filter(user => \n          user.name.toLowerCase().includes(term.toLowerCase()) ||\n          user.email.toLowerCase().includes(term.toLowerCase())\n        );\n        setUsers(filtered);\n        setLoading(false);\n      }, 300);\n    }, 500),\n    [initialUsers]\n  );\n\n  // Effect for search\n  useEffect(() => {\n    if (searchTerm) {\n      debouncedSearch(searchTerm);\n    } else {\n      setUsers(initialUsers);\n    }\n  }, [searchTerm, debouncedSearch, initialUsers]);\n\n  // Memoized active users count\n  const activeUsersCount = useMemo(() => {\n    return users.filter(user => user.isActive).length;\n  }, [users]);\n\n  const handleUserClick = useCallback((user: User) => {\n    onUserSelect(user);\n  }, [onUserSelect]);\n\n  if (error) {\n    return <div className="error">Error: {error}</div>;\n  }\n\n  return (\n    <div className="user-list">\n      <div className="search-container">\n        <input\n          type="text"\n          placeholder="Search users..."\n          value={searchTerm}\n          onChange={(e) => setSearchTerm(e.target.value)}\n          className="search-input"\n        />\n        <div className="user-stats">\n          Active Users: {activeUsersCount} / {users.length}\n        </div>\n      </div>\n      \n      {loading ? (\n        <div className="loading">Loading...</div>\n      ) : (\n        <ul className="user-items">\n          {users.map(user => (\n            <li \n              key={user.id} \n              className={`user-item ${user.isActive ? ''active'' : ''inactive''}`}\n              onClick={() => handleUserClick(user)}\n            >\n              <div className="user-info">\n                <h3>{user.name}</h3>\n                <p>{user.email}</p>\n                <span className={`status ${user.isActive ? ''active'' : ''inactive''}`}>\n                  {user.isActive ? ''Active'' : ''Inactive''}\n                </span>\n              </div>\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n};\n\nexport default UserList;', 
'Complex React component with TypeScript, hooks, and performance optimizations', FALSE, 'power_user', '2023-12-15 16:20:00', '2023-12-15 16:20:00');

-- Zero character typing session (edge case)
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', '2024-01-08 14:00:00', 5000, 0, 0, '2024-01-08 14:00:05');

-- Very long typing session
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440011', '2024-01-16 10:00:00', 1800000, 2847, 2756, '2024-01-16 10:30:00');

-- ============================================================================
-- DATA QUALITY ISSUES (FOR TESTING CLEANSING)
-- ============================================================================

-- These records should be cleaned up during migration

-- User with empty login_id (should be removed)
INSERT INTO login_info (id, login_id, password_hash, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440099', '', '$2a$10$invalid', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Study book with empty language (should be removed)
INSERT INTO study_book (id, user_id, language, question, explanation, is_system_problem, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440099', '550e8400-e29b-41d4-a716-446655440001', '', 'Invalid question', 'Should be removed', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Typing session with negative values (should be corrected)
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440099', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-01-01 00:00:00', 30000, -5, -2, '2024-01-01 00:00:30');

-- Typing session where correct > total (should be corrected)
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440098', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '2024-01-01 00:00:00', 30000, 50, 75, '2024-01-01 00:00:30');