-- システム問題フラグと作成者情報を追加

ALTER TABLE study_book ADD COLUMN is_system_problem BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE study_book ADD COLUMN created_by VARCHAR(50);