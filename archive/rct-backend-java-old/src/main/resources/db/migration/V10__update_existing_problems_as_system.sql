-- 既存の問題をシステム問題として設定

-- 全ての既存問題をシステム問題として設定
UPDATE study_book 
SET is_system_problem = TRUE, 
    user_id = NULL,
    created_by = 'system'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';