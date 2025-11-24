// 音声設定コントロール
(function() {
    console.log('sound-controls.js loaded');

    function initSoundControls() {
        console.log('Initializing sound controls...');
        
        const bgmToggle = document.getElementById('bgm-toggle');
        const seToggle = document.getElementById('se-toggle');
        const bgmAudio = document.getElementById('background-music');

        if (!bgmToggle || !seToggle) {
            console.warn('Sound toggle elements not found');
            return;
        }

        // 保存された設定を読み込み
        const settings = window.SoundEffects ? window.SoundEffects.getSettings() : { bgm: true, se: true };
        console.log('Loaded sound settings:', settings);

        // トグルの初期状態を設定
        bgmToggle.checked = settings.bgm;
        seToggle.checked = settings.se;

        // BGMの初期状態を設定
        if (bgmAudio) {
            if (settings.bgm) {
                bgmAudio.play().catch(e => console.log('BGM autoplay blocked:', e));
            } else {
                bgmAudio.pause();
            }
        }

        // BGMトグルのイベントリスナー
        bgmToggle.addEventListener('change', function() {
            const enabled = this.checked;
            console.log('BGM toggle changed:', enabled);
            
            if (window.SoundEffects) {
                window.SoundEffects.setSetting('bgm', enabled);
            }

            if (bgmAudio) {
                if (enabled) {
                    bgmAudio.play().catch(e => console.error('Failed to play BGM:', e));
                } else {
                    bgmAudio.pause();
                }
            }
        });

        // SEトグルのイベントリスナー
        seToggle.addEventListener('change', function() {
            const enabled = this.checked;
            console.log('SE toggle changed:', enabled);
            
            if (window.SoundEffects) {
                window.SoundEffects.setSetting('se', enabled);
            }
        });

        console.log('Sound controls initialized successfully');
    }

    // DOMContentLoadedで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSoundControls);
    } else {
        initSoundControls();
    }
})();
