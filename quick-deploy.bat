@echo off
echo ========================================
echo RCT ポートフォリオ 即座デプロイスクリプト
echo ========================================
echo.

echo [1/3] Gitにコミット中...
git add .
git commit -m "Portfolio deployment: Ready for interview demo"
echo ✅ コミット完了

echo.
echo [2/3] GitHubにプッシュ中...
git push origin main
echo ✅ プッシュ完了

echo.
echo [3/3] 次のステップ:
echo.
echo 🌐 GitHub Pages設定:
echo    1. https://github.com/[ユーザー名]/RemindCodeTyping/settings/pages
echo    2. Source: Deploy from a branch
echo    3. Branch: main / (root)
echo    4. Save
echo.
echo 🚀 Railway デプロイ:
echo    1. https://railway.app/
echo    2. Deploy from GitHub repo
echo    3. RemindCodeTyping を選択
echo    4. PostgreSQL を追加
echo.
echo 📱 公開URL:
echo    フロントエンド: https://[ユーザー名].github.io/RemindCodeTyping/
echo    バックエンド: https://[プロジェクト名].up.railway.app/
echo.
echo 🎯 面談準備完了！
echo    デモログイン: demo / password
echo.
pause