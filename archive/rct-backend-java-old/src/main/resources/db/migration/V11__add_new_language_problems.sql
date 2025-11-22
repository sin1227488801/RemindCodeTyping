-- PHP問題を追加（5問のみ）
INSERT INTO study_book (id, user_id, language, question, explanation, is_system_problem, created_at, updated_at) VALUES
(RANDOM_UUID(), NULL, 'PHP', '<?php echo "Hello World"; ?>', 'PHPの基本的なHello World出力', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'PHP', '$name = "John"; echo $name;', 'PHP変数の宣言と出力', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'PHP', 'if ($age >= 18) { echo "Adult"; }', 'PHPの条件分岐', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'PHP', 'for ($i = 0; $i < 5; $i++) { echo $i; }', 'PHPのforループ', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'PHP', 'function greet($name) { return "Hello " . $name; }', 'PHP関数の定義', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Git問題を追加（5問のみ）
INSERT INTO study_book (id, user_id, language, question, explanation, is_system_problem, created_at, updated_at) VALUES
(RANDOM_UUID(), NULL, 'Git', 'git init', 'Gitリポジトリ初期化', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'Git', 'git add .', 'Git全ファイルをステージング', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'Git', 'git commit -m "Initial commit"', 'Gitコミット実行', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'Git', 'git status', 'Git作業ディレクトリ状態確認', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(RANDOM_UUID(), NULL, 'Git', 'git log', 'Gitコミット履歴表示', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);