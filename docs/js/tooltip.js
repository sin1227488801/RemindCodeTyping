// 固定位置ツールチップ実装
function initSimpleTooltip() {
    // 特別ランクの要素にツールチップを直接追加
    const specialRanks = document.querySelectorAll('.rank-shodan-special, .rank-1-special, .rank-2-special');
    
    specialRanks.forEach(element => {
        // 各要素に個別のツールチップを作成
        const tooltip = document.createElement('div');
        tooltip.className = 'fixed-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            top: -35px;
            left: 0;
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        
        // ツールチップのテキストを設定
        const tooltipText = element.getAttribute('data-tooltip');
        if (tooltipText) {
            tooltip.textContent = tooltipText;
        }
        
        // 要素に相対位置を設定（既存のスタイルを保持）
        const currentPosition = window.getComputedStyle(element).position;
        if (currentPosition === 'static') {
            element.style.position = 'relative';
        }
        
        // 要素にツールチップを追加
        element.appendChild(tooltip);
        
        // ホバーイベント（既存のイベントを妨害しないように）
        element.addEventListener('mouseenter', function() {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        }, { passive: true });

        element.addEventListener('mouseleave', function() {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        }, { passive: true });
    });
}

// ページ読み込み後に初期化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleTooltip, 1000);
    console.log('固定位置ツールチップを初期化しました');
});