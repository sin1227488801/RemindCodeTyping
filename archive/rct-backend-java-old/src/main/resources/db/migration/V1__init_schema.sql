-- ログイン情報テーブル
CREATE TABLE login_info (
    id UUID PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    last_login_date DATE,
    last_login_days INTEGER NOT NULL DEFAULT 0,
    max_login_days INTEGER NOT NULL DEFAULT 0,
    total_login_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 学習帳テーブル
CREATE TABLE study_book (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    language VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES login_info(id) ON DELETE CASCADE
);

-- タイピングログテーブル
CREATE TABLE typing_log (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    study_book_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    duration_ms BIGINT NOT NULL,
    total_chars INTEGER NOT NULL,
    correct_chars INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES login_info(id) ON DELETE CASCADE,
    FOREIGN KEY (study_book_id) REFERENCES study_book(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_login_info_login_id ON login_info(login_id);
CREATE INDEX idx_study_book_user_id ON study_book(user_id);
CREATE INDEX idx_study_book_language ON study_book(language);
CREATE INDEX idx_typing_log_user_id ON typing_log(user_id);
CREATE INDEX idx_typing_log_created_at ON typing_log(created_at);