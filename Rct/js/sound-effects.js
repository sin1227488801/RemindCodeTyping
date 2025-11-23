// 効果音再生ユーティリティ
const SoundEffects = {
    // 効果音のパス
    sounds: {
        confirm: 'sound/confirm-effect.mp3',
        registered: 'sound/registered-sound-effect.mp3',
        tap: 'sound/tap-effect.mp3',
        submission: 'sound/submission-effect.mp3'
    },

    // 効果音を再生する関数
    play: function(soundName) {
        console.log(`Attempting to play sound: ${soundName}`);
        if (!this.sounds[soundName]) {
            console.warn(`効果音が見つかりません: ${soundName}`);
            return;
        }

        try {
            const audio = new Audio(this.sounds[soundName]);
            audio.volume = 0.3; // 音量を30%に設定（控えめに）
            console.log(`Playing sound: ${this.sounds[soundName]}`);
            audio.play().then(() => {
                console.log(`Sound played successfully: ${soundName}`);
            }).catch(error => {
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

    // キーボード入力時の効果音
    playTap: function() {
        this.play('tap');
    },

    // 問題送信時の効果音
    playSubmission: function() {
        this.play('submission');
    }
};

// グローバルに公開
window.SoundEffects = SoundEffects;
