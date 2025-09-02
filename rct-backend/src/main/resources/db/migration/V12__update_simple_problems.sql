-- システム問題テーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS system_problem (
    id VARCHAR(50) PRIMARY KEY,
    language VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 既存のシステム問題を削除（テーブルが存在する場合）
DELETE FROM system_problem;

-- 新しいシンプルなシステム問題を追加
INSERT INTO system_problem (id, language, question, explanation, created_at, updated_at) VALUES
-- Python基礎問題
('python-001', 'Python', 'print("Hello")', '基本的な出力文です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-002', 'Python', 'x = 5', '変数に数値を代入します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-003', 'Python', 'name = "Alice"', '変数に文字列を代入します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-004', 'Python', 'print(x + 3)', '変数を使った計算です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-005', 'Python', 'if x > 0:
    print("positive")', '条件分岐の基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-006', 'Python', 'for i in range(3):
    print(i)', '繰り返し処理の基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-007', 'Python', 'def hello():
    print("Hi")', '関数の基本的な定義です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-008', 'Python', 'numbers = [1, 2, 3]', 'リストの基本的な作成です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-009', 'Python', 'print(len(numbers))', 'リストの長さを取得します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('python-010', 'Python', 'age = 20
if age >= 18:
    print("adult")', '年齢判定の例です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- JavaScript基礎問題
('javascript-001', 'JavaScript', 'console.log("Hello");', '基本的な出力文です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-002', 'JavaScript', 'let x = 10;', '変数の宣言と代入です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-003', 'JavaScript', 'const name = "Bob";', '定数の宣言です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-004', 'JavaScript', 'let sum = 5 + 3;', '変数を使った計算です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-005', 'JavaScript', 'if (x > 5) {
    console.log("big");
}', '条件分岐の基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-006', 'JavaScript', 'for (let i = 0; i < 3; i++) {
    console.log(i);
}', 'for文の基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-007', 'JavaScript', 'function greet() {
    console.log("Hi");
}', '関数の基本的な定義です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-008', 'JavaScript', 'let arr = [1, 2, 3];', '配列の基本的な作成です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-009', 'JavaScript', 'console.log(arr.length);', '配列の長さを取得します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('javascript-010', 'JavaScript', 'let score = 85;
if (score >= 80) {
    console.log("good");
}', '点数判定の例です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Java基礎問題
('java-001', 'Java', 'System.out.println("Hello");', '基本的な出力文です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-002', 'Java', 'int x = 5;', '整数型変数の宣言です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-003', 'Java', 'String name = "Tom";', '文字列型変数の宣言です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-004', 'Java', 'int sum = x + 3;', '変数を使った計算です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-005', 'Java', 'if (x > 0) {
    System.out.println("positive");
}', '条件分岐の基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-006', 'Java', 'for (int i = 0; i < 3; i++) {
    System.out.println(i);
}', 'for文の基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-007', 'Java', 'public static void hello() {
    System.out.println("Hi");
}', 'メソッドの基本的な定義です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-008', 'Java', 'int[] numbers = {1, 2, 3};', '配列の基本的な作成です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-009', 'Java', 'System.out.println(numbers.length);', '配列の長さを取得します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('java-010', 'Java', 'int grade = 90;
if (grade >= 80) {
    System.out.println("excellent");
}', '成績判定の例です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- HTML基礎問題
('html-001', 'HTML', '<h1>Hello</h1>', '見出しタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-002', 'HTML', '<p>This is text.</p>', '段落タグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-003', 'HTML', '<a href="#">Link</a>', 'リンクタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-004', 'HTML', '<img src="pic.jpg" alt="image">', '画像タグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-005', 'HTML', '<div>Content</div>', 'divタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-006', 'HTML', '<ul>
    <li>Item 1</li>
    <li>Item 2</li>
</ul>', 'リストタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-007', 'HTML', '<input type="text" name="username">', '入力フィールドの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-008', 'HTML', '<button>Click me</button>', 'ボタンタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-009', 'HTML', '<table>
    <tr>
        <td>Cell</td>
    </tr>
</table>', 'テーブルタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('html-010', 'HTML', '<form>
    <input type="submit" value="Send">
</form>', 'フォームタグの基本です。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- CSS基礎問題
('css-001', 'CSS', 'color: red;', '文字色を赤にします。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-002', 'CSS', 'background-color: blue;', '背景色を青にします。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-003', 'CSS', 'font-size: 16px;', 'フォントサイズを設定します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-004', 'CSS', 'margin: 10px;', '外側の余白を設定します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-005', 'CSS', 'padding: 5px;', '内側の余白を設定します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-006', 'CSS', 'border: 1px solid black;', '境界線を設定します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-007', 'CSS', 'width: 100px;', '幅を設定します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-008', 'CSS', 'height: 50px;', '高さを設定します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-009', 'CSS', 'text-align: center;', 'テキストを中央揃えにします。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('css-010', 'CSS', 'display: block;', 'ブロック要素として表示します。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);