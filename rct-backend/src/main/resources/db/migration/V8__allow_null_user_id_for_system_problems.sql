-- システム問題用にuser_idのNOT NULL制約を緩和

ALTER TABLE study_book ALTER COLUMN user_id SET NULL;