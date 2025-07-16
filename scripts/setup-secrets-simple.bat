@echo off
echo Cloudflare Secrets 设置向导 - 简化版
echo ========================================
echo.
echo 此脚本将帮助您设置Cloudflare Secrets
echo.

REM 检查wrangler
echo 检查 wrangler CLI...
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo 错误: wrangler CLI 未安装
    echo 请先安装: npm install -g wrangler
    pause
    exit /b 1
)

echo wrangler CLI 已安装
echo.

REM 检查登录状态
echo 检查登录状态...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo 错误: 未登录到Cloudflare
    echo 请先登录: wrangler login
    pause
    exit /b 1
)

echo 已登录到Cloudflare
echo.

echo 开始设置必需的密钥...
echo.

REM 设置 SERVER_GEMINI_API_KEY
echo 1. 设置 SERVER_GEMINI_API_KEY
echo    描述: 服务器使用的Gemini API Key（付费用户将使用此密钥）
echo    获取地址: https://aistudio.google.com/app/apikey
echo.
set /p choice1="是否要设置此密钥? (y/n): "
if /i "%choice1%"=="y" (
    echo 请输入 SERVER_GEMINI_API_KEY 的值:
    set /p secret1=
    if not "%secret1%"=="" (
        echo %secret1% | wrangler secret put SERVER_GEMINI_API_KEY
        echo SERVER_GEMINI_API_KEY 设置完成
    ) else (
        echo 密钥值为空，跳过设置
    )
)
echo.

REM 设置 JWT_SECRET
echo 2. 设置 JWT_SECRET
echo    描述: 用于签名JWT令牌的密钥（建议64位随机字符串）
echo.
set /p choice2="是否要设置此密钥? (y/n): "
if /i "%choice2%"=="y" (
    echo 请输入 JWT_SECRET 的值（或按回车自动生成）:
    set /p secret2=
    if "%secret2%"=="" (
        echo 正在生成随机密钥...
        powershell -Command "[System.Web.Security.Membership]::GeneratePassword(64, 10)" > temp_jwt.txt
        set /p secret2=<temp_jwt.txt
        del temp_jwt.txt
    )
    if not "%secret2%"=="" (
        echo %secret2% | wrangler secret put JWT_SECRET
        echo JWT_SECRET 设置完成
    )
)
echo.

REM 设置 ENCRYPTION_KEY
echo 3. 设置 ENCRYPTION_KEY
echo    描述: 用于加密用户API Key的密钥（建议32位随机字符串）
echo.
set /p choice3="是否要设置此密钥? (y/n): "
if /i "%choice3%"=="y" (
    echo 请输入 ENCRYPTION_KEY 的值（或按回车自动生成）:
    set /p secret3=
    if "%secret3%"=="" (
        echo 正在生成随机密钥...
        powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32, 5)" > temp_enc.txt
        set /p secret3=<temp_enc.txt
        del temp_enc.txt
    )
    if not "%secret3%"=="" (
        echo %secret3% | wrangler secret put ENCRYPTION_KEY
        echo ENCRYPTION_KEY 设置完成
    )
)
echo.

echo 可选密钥设置...
echo.

REM 设置 WECHAT_APP_SECRET
echo 4. 设置 WECHAT_APP_SECRET（可选）
echo    描述: 微信应用密钥（如需微信登录功能）
echo.
set /p choice4="是否要设置此密钥? (y/n): "
if /i "%choice4%"=="y" (
    echo 请输入 WECHAT_APP_SECRET 的值:
    set /p secret4=
    if not "%secret4%"=="" (
        echo %secret4% | wrangler secret put WECHAT_APP_SECRET
        echo WECHAT_APP_SECRET 设置完成
    )
)
echo.

echo 密钥设置完成！
echo.
echo 查看已设置的密钥:
wrangler secret list
echo.
echo 安全提醒:
echo 1. 这些密钥已安全存储在Cloudflare中
echo 2. 不会出现在您的代码仓库中
echo 3. 只有您的Cloudflare账户可以访问
echo 4. 如需更新: wrangler secret put SECRET_NAME
echo 5. 如需删除: wrangler secret delete SECRET_NAME
echo.
echo 现在可以部署您的应用了！
echo 部署命令: wrangler deploy
echo.
pause
