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
        console.log('playConfirm called');
        try {
            const audio = new Audio(this.sounds.confirm);
            audio.volume = 0.7; // confirm効果音は音量を70%に設定
            console.log(`Playing confirm sound: ${this.sounds.confirm}, volume: ${audio.volume}`);
            audio.play().then(() => {
                console.log('Confirm sound played successfully');
            }).catch(error => {
                console.error('Confirm sound playback failed:', error);
                console.error('Error details:', error.name, error.message);
            });
        } catch (error) {
            console.error('Confirm sound error:', error);
        }
    },

    // アカウント作成完了時の効果音
    playRegistered: function() {
        this.play('registered');
    },

    // キーボード入力時の効果音
    playTap: function() {
        try {
            const audio = new Audio(this.sounds.tap);
            audio.volume = 1.0; // tap効果音は音量を100%に設定（最大）
            audio.play().catch(error => {
                console.warn('Tap sound playback failed:', error);
            });
        } catch (error) {
            console.warn('Tap sound error:', error);
        }
    },

    // 問題送信時の効果音
    playSubmission: function() {
        this.play('submission');
    }
};

// グローバルに公開
window.SoundEffects = SoundEffects;
