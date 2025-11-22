-- デモユーザー作成（パスワード: Demo123!）
INSERT INTO login_info (id, login_id, password_hash, last_login_date, last_login_days, max_login_days, total_login_days, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'demo',
    'YWJjZGVmZ2hpams=',
    CURRENT_DATE,
    1,
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- サンプル学習帳データ（Java）
INSERT INTO study_book (id, user_id, language, question, explanation, created_at, updated_at)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}',
    'Javaの基本的なHello Worldプログラムです。public static void main(String[] args)がエントリーポイントになります。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'for (int i = 0; i < 10; i++) {
    System.out.println("Count: " + i);
}',
    'Javaのfor文の基本構文です。初期化、条件、増分の3つの部分で構成されます。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'function greet(name) {
    return "Hello, " + name + "!";
}
console.log(greet("World"));',
    'JavaScriptの関数定義と文字列連結の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))',
    'Pythonでのフィボナッチ数列の再帰実装です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT u.user_name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.user_name
ORDER BY order_count DESC;',
    'ユーザーごとの注文数を集計するSQL文です。LEFT JOINとGROUP BYを使用しています。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- サンプルタイピングログ
INSERT INTO typing_log (id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, accuracy, created_at)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    DATEADD('HOUR', -1, CURRENT_TIMESTAMP),
    45000,
    150,
    142,
    94.67,
    DATEADD('HOUR', -1, CURRENT_TIMESTAMP)
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002',
    DATEADD('MINUTE', -30, CURRENT_TIMESTAMP),
    32000,
    89,
    85,
    95.51,
    DATEADD('MINUTE', -30, CURRENT_TIMESTAMP)
);