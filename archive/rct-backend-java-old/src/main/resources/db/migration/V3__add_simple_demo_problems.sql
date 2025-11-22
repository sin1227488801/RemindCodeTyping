-- シンプルなデモ問題を追加

INSERT INTO study_book (id, user_id, language, question, explanation, created_at, updated_at)
VALUES 
-- Python基礎問題
(
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'print("Hello, world!")',
    'Pythonの基本的なHello Worldプログラムです。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'x = 10
y = 20
print(f"sum = {x + y}")',
    'Pythonの変数とf文字列の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'def greet(name):
    return f"Hello, {name}!"

print(greet("World"))',
    'Pythonの関数定義と呼び出しの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'numbers = [1, 2, 3, 4, 5]
for num in numbers:
    print(num * 2)',
    'Pythonのリストとfor文の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'if 5 > 3:
    print("True")
else:
    print("False")',
    'Pythonの条件分岐（if-else）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- JavaScript問題
(
    '550e8400-e29b-41d4-a716-446655440025',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log(doubled);',
    'JavaScriptの配列とmap関数の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440026',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'function add(a, b) {
    return a + b;
}
console.log(add(3, 4));',
    'JavaScriptの関数定義と呼び出しの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- Java問題
(
    '550e8400-e29b-41d4-a716-446655440027',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static void main(String[] args) {
        System.out.println(add(5, 3));
    }
}',
    'Javaのクラスとメソッドの基本例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- SQL問題
(
    '550e8400-e29b-41d4-a716-446655440028',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT name, age 
FROM users 
WHERE age >= 18 
ORDER BY name;',
    'SQLの基本的なSELECT文の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440029',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'UPDATE products 
SET price = price * 1.1 
WHERE category = ''electronics'';',
    'SQLのUPDATE文の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);