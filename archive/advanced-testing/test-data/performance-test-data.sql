-- Performance test data for complex query testing
-- This file provides sample data for testing complex database operations

-- Insert test users for performance testing
INSERT INTO users (id, login_id, password_hash, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'perftest_user1', 'hash1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('22222222-2222-2222-2222-222222222222', 'perftest_user2', 'hash2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('33333333-3333-3333-3333-333333333333', 'perftest_user3', 'hash3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert login statistics for test users
INSERT INTO user_login_statistics (user_id, last_login_date, consecutive_login_days, max_consecutive_login_days, total_login_days, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 5, 10, 25, CURRENT_TIMESTAMP),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 1, 3, 8, 15, CURRENT_TIMESTAMP),
('33333333-3333-3333-3333-333333333333', CURRENT_DATE - 2, 1, 12, 30, CURRENT_TIMESTAMP);

-- Insert study books for performance testing
INSERT INTO study_books (id, user_id, language, question, explanation, is_system_problem, created_at, updated_at) VALUES
-- User 1 study books
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'JavaScript', 'console.log("Hello World");', 'Basic console output', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'JavaScript', 'function add(a, b) { return a + b; }', 'Addition function', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Python', 'print("Hello World")', 'Basic print statement', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 2 study books
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Java', 'System.out.println("Hello World");', 'Java print statement', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Java', 'public class Main { }', 'Basic Java class', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 3 study books
('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'C++', '#include <iostream>', 'C++ include statement', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert typing sessions for performance testing
INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, completed_at, duration_ms, total_characters, correct_characters, created_at) VALUES
-- User 1 sessions (high accuracy)
('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '59 minutes', 60000, 26, 26, CURRENT_TIMESTAMP),
('s2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '119 minutes', 60000, 35, 34, CURRENT_TIMESTAMP),
('s3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '179 minutes', 60000, 20, 19, CURRENT_TIMESTAMP),

-- User 2 sessions (medium accuracy)
('s4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '59 minutes', 60000, 35, 30, CURRENT_TIMESTAMP),
('s5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '119 minutes', 60000, 20, 16, CURRENT_TIMESTAMP),

-- User 3 sessions (lower accuracy)
('s6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '59 minutes', 60000, 18, 12, CURRENT_TIMESTAMP);