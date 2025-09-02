// 結果画面でのツールチップデバッグ
console.log('=== 結果画面ツールチップデバッグ ===');

// 要素の確認
const rankElement = document.getElementById('result-rank');
const modal = document.getElementById('result-modal');

console.log('result-rank element:', rankElement);
console.log('result-modal element:', modal);

if (rankElement) {
    console.log('rank element classes:', rankElement.className);
    console.log('data-tooltip:', rankElement.getAttribute('data-tooltip'));
    console.log('text content:', rankElement.textContent);

    // クラスを強制追加
    rankElement.classList.add('rank-tooltip-trigger');

    // テスト用のツールチップを設定
    rankElement.setAttribute('data-tooltip', 'ワープロ検定テスト相当！');

    console.log('クラスとdata-tooltip属性を設定しました');
    console.log('ホバーしてツールチップを確認してください');

    // CSS疑似要素の確認
    setTimeout(() => {
        const beforeStyle = window.getComputedStyle(rankElement, '::before');
        console.log('::before content:', beforeStyle.content);
        console.log('::before opacity:', beforeStyle.opacity);
        console.log('::before visibility:', beforeStyle.visibility);
    }, 1000);
} else {
    console.log('result-rank要素が見つかりません');
}

// CSSルールの確認
const styleSheets = document.styleSheets;
let tooltipRuleFound = false;

for (let i = 0; i < styleSheets.length; i++) {
    try {
        const rules = styleSheets[i].cssRules || styleSheets[i].rules;
        for (let j = 0; j < rules.length; j++) {
            if (rules[j].selectorText && rules[j].selectorText.includes('rank-tooltip-trigger')) {
                console.log('Found tooltip CSS rule:', rules[j].cssText);
                tooltipRuleFound = true;
            }
        }
    } catch (e) {
        console.log('Cannot access stylesheet:', styleSheets[i].href);
    }
}

if (!tooltipRuleFound) {
    console.log('ツールチップのCSSルールが見つかりません');
}

console.log('=== デバッグ終了 ===');