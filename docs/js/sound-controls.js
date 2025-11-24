// 音声設定コントロール
(function() {
    console.log('sound-controls.js loaded');

    function initSoundControls() {
        console.log('Initializing sound controls...');
        
        // チェックボックス型トグル（main.html用）
        const bgmToggle = document.getElementById('bgm-toggle');
        const seToggle = document.getElementById('se-toggle');
        
        // ボタン型トグル（typing.html用）
        const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
        const seToggleBtn = document.getElementById('se-toggle-btn');
        
        const bgmAudio = document.getElementById('background-music');

        // 保存された設定を読み込み
        const settings = window.SoundEffects ? window.SoundEffects.getSettings() : { bgm: true, se: true };
        console.log('Loaded sound settings:', settings);

        // チェックボックス型トグルの初期化
        if (bgmToggle && seToggle) {
            bgmToggle.checked = settings.bgm;
            seToggle.checked = settings.se;

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

            seToggle.addEventListener('change', function() {
                const enabled = this.checked;
                console.log('SE toggle changed:', enabled);
                
                if (window.SoundEffects) {
                    window.SoundEffects.setSetting('se', enabled);
                }
            });
        }

        // ボタン型トグルの初期化
        if (bgmToggleBtn && seToggleBtn) {
            // 初期状態を設定
            if (settings.bgm) {
                bgmToggleBtn.classList.add('active');
            } else {
                bgmToggleBtn.classList.remove('active');
            }
            
            if (settings.se) {
                seToggleBtn.classList.add('active');
            } else {
                seToggleBtn.classList.remove('active');
            }

            // BGMトグルボタンのイベントリスナー
            bgmToggleBtn.addEventListener('click', function() {
                const isActive = this.classList.contains('active');
                const newState = !isActive;
                
                if (newState) {
                    this.classList.add('active');
                } else {
                    this.classList.remove('active');
                }
                
                console.log('BGM toggle button clicked:', newState);
                
                if (window.SoundEffects) {
                    window.SoundEffects.setSetting('bgm', newState);
                }

                if (bgmAudio) {
                    if (newState) {
                        bgmAudio.play().catch(e => console.error('Failed to play BGM:', e));
                    } else {
                        bgmAudio.pause();
                    }
                }
            });

            // SEトグルボタンのイベントリスナー
            seToggleBtn.addEventListener('click', function() {
                const isActive = this.classList.contains('active');
                const newState = !isActive;
                
                if (newState) {
                    this.classList.add('active');
                } else {
                    this.classList.remove('active');
                }
                
                console.log('SE toggle button clicked:', newState);
                
                if (window.SoundEffects) {
                    window.SoundEffects.setSetting('se', newState);
                }
            });
        }

        // BGMの初期状態を設定
        if (bgmAudio) {
            if (settings.bgm) {
                bgmAudio.play().catch(e => console.log('BGM autoplay blocked:', e));
            } else {
                bgmAudio.pause();
            }
        }

        console.log('Sound controls initialized successfully');
    }

    // DOMContentLoadedで初期化（少し遅延させて他のスクリプトの後に実行）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initSoundControls, 500);
        });
    } else {
        setTimeout(initSoundControls, 500);
    }
})();
