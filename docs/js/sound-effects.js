// 効果音再生ユーティリティ
const SoundEffects = {
    // 効果音のパス
    sounds: {
        confirm: 'sound/confirm-effect.mp3',
        registered: 'sound/registered-sound-effect.mp3',
        tap: 'sound/tap-effect.mp3',
        submission: 'sound/submission-effect.mp3'
    },

    // タップ音のデバウンス用
    lastTapTime: 0,
    tapDebounceMs: 50, // 50ms以内の連続タップは無視

    // 効果音を再生する関数
    play: function(soundName) {
        if (!this.sounds[soundName]) {
            console.warn(`効果音が見つかりません: ${soundName}`);
            return;
        }

        try {
            const audio = new Audio(this.sounds[soundName]);
            audio.volume = 0.3; // 音量を30%に設定（控えめに）
            audio.play().catch(error => {
                console.warn('効果音の再生に失敗:', error);
            });
        } catch (error) {
            console.warn('効果音の再生エラー:', error);
        }
    },

    // 画面遷移を伴うボタンクリック時の効果音
    playConfirm: function() {
        this.play('confirm');
    },

    // アカウント作成完了時の効果音
    playRegistered: function() {
        this.play('registered');
    },

    // キーボード入力時の効果音（デバウンス付き）
    playTap: function() {
        const now = Date.now();
        if (now - this.lastTapTime >= this.tapDebounceMs) {
            this.play('tap');
            this.lastTapTime = now;
        }
    },

    // 問題送信時の効果音
    playSubmission: function() {
        this.play('submission');
    }
};

// グローバルに公開
window.SoundEffects = SoundEffects;
