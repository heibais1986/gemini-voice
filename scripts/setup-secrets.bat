@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔐 Cloudflare Secrets 设置向导
echo ================================
echo.
echo 此脚本将帮助您安全地设置敏感的环境变量到Cloudflare Secrets中。
echo 这些密钥不会存储在代码仓库中，确保了安全性。
echo.

REM 检查wrangler是否已安装
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: wrangler CLI 未安装
    echo 请先安装: npm install -g wrangler
    pause
    exit /b 1
)

REM 检查是否已登录
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未登录到Cloudflare
    echo 请先登录: wrangler login
    pause
    exit /b 1
)

echo ✅ wrangler CLI 已就绪
echo.

echo 🔑 开始设置密钥...
echo.

echo === 必需的密钥 ===
echo.

REM JWT密钥
echo 📝 设置 JWT_SECRET
echo 描述: 用于签名JWT令牌的密钥
echo ⚠️  这是必需的密钥
set /p auto_jwt="是否要自动生成一个安全的JWT密钥? (y/n): "
if /i "!auto_jwt!"=="y" (
    echo 正在生成JWT密钥...
    powershell -Command "[System.Web.Security.Membership]::GeneratePassword(64, 10)" | wrangler secret put JWT_SECRET
    echo ✅ JWT_SECRET 已自动生成并设置
) else (
    call :set_secret "JWT_SECRET" "用于签名JWT令牌的密钥"
)
echo.

REM 加密密钥
echo 📝 设置 ENCRYPTION_KEY
echo 描述: 用于加密用户API Key的密钥
echo ⚠️  这是必需的密钥
set /p auto_enc="是否要自动生成一个安全的加密密钥? (y/n): "
if /i "!auto_enc!"=="y" (
    echo 正在生成加密密钥...
    powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32, 5)" | wrangler secret put ENCRYPTION_KEY
    echo ✅ ENCRYPTION_KEY 已自动生成并设置
) else (
    call :set_secret "ENCRYPTION_KEY" "用于加密用户API Key的密钥"
)
echo.

REM 服务器API密钥
call :set_secret "SERVER_GEMINI_API_KEY" "服务器使用的Gemini API Key（付费用户将使用此密钥）"

echo.
echo === 可选的密钥 ===
echo.

REM 微信相关密钥
call :set_secret_optional "WECHAT_APP_SECRET" "微信应用密钥（如需微信登录功能）"

REM 支付相关密钥
call :set_secret_optional "ALIPAY_PRIVATE_KEY" "支付宝应用私钥（如需支付宝支付功能）"
call :set_secret_optional "ALIPAY_PUBLIC_KEY" "支付宝公钥（如需支付宝支付功能）"
call :set_secret_optional "WECHAT_PAY_API_KEY" "微信支付API密钥（如需微信支付功能）"

echo.
echo 🎉 密钥设置完成！
echo.
echo 📋 已设置的密钥列表:
wrangler secret list

echo.
echo 🔒 安全提醒:
echo 1. 这些密钥已安全存储在Cloudflare中，不会出现在您的代码仓库中
echo 2. 只有您的Cloudflare账户可以访问这些密钥
echo 3. 如需更新密钥，请重新运行此脚本或使用 wrangler secret put 命令
echo 4. 如需删除密钥，请使用 wrangler secret delete ^<SECRET_NAME^> 命令
echo.
echo ✅ 现在可以安全地部署您的应用了！
pause
exit /b 0

:set_secret
set secret_name=%~1
set description=%~2
echo 📝 设置 %secret_name%
echo 描述: %description%
echo ⚠️  这是必需的密钥
set /p choice="是否要设置此密钥? (y/n): "
if /i "!choice!"=="y" (
    echo 请输入 %secret_name% 的值:
    set /p secret_value=
    if not "!secret_value!"=="" (
        echo !secret_value! | wrangler secret put %secret_name%
        echo ✅ %secret_name% 设置成功
    ) else (
        echo ⚠️  密钥值为空，跳过设置
    )
) else (
    echo ⚠️  警告: %secret_name% 是必需的，应用可能无法正常工作
)
echo.
goto :eof

:set_secret_optional
set secret_name=%~1
set description=%~2
echo 📝 设置 %secret_name%
echo 描述: %description%
echo ℹ️  这是可选的密钥（如不需要可跳过）
set /p choice="是否要设置此密钥? (y/n/skip): "
if /i "!choice!"=="y" (
    echo 请输入 %secret_name% 的值:
    set /p secret_value=
    if not "!secret_value!"=="" (
        echo !secret_value! | wrangler secret put %secret_name%
        echo ✅ %secret_name% 设置成功
    ) else (
        echo ⚠️  密钥值为空，跳过设置
    )
) else (
    echo ℹ️  跳过 %secret_name%
)
echo.
goto :eof
