# Cloudflare Secrets 设置向导 - PowerShell版本
# 适用于Windows系统
Write-Host "🔐 Cloudflare Secrets 设置向导" -ForegroundColor Cyan
Write-Host "====" -ForegroundColor Cyan
Write-Host ""
Write-Host "此脚本将帮助您安全地设置敏感的环境变量到Cloudflare Secrets中。" -ForegroundColor Green
Write-Host "这些密钥不会存储在代码仓库中，确保了安全性。" -ForegroundColor Green
Write-Host ""
# 检查wrangler是否已安装
Write-Host "检查 wrangler CLI..." -ForegroundColor Yellow
try {
    $wranglerVersion = wrangler --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "wrangler not found"
    }
    Write-Host "✅ wrangler CLI 已安装: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: wrangler CLI 未安装" -ForegroundColor Red
    Write-Host "请先安装: npm install -g wrangler" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}
# 检查是否已登录
Write-Host "检查登录状态..." -ForegroundColor Yellow
try {
    $whoami = wrangler whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "not logged in"
    }
    Write-Host "✅ 已登录到Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未登录到Cloudflare" -ForegroundColor Red
    Write-Host "请先登录: wrangler login" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}
Write-Host ""
# 函数：设置密钥
function Set-Secret {
    param(
        [string]$SecretName,
        [string]$Description,
        [bool]$IsRequired = $true
    )
    Write-Host "📝 设置 $SecretName" -ForegroundColor Cyan
    Write-Host "描述: $Description" -ForegroundColor Gray
    if ($IsRequired) {
        Write-Host "⚠️  这是必需的密钥" -ForegroundColor Yellow
    } else {
        Write-Host "ℹ️  这是可选的密钥（如不需要可跳过）" -ForegroundColor Blue
    }
    $choice = Read-Host "是否要设置此密钥? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        $secretValue = Read-Host "请输入 $SecretName 的值" -AsSecureString
        $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretValue))
        if ($plainValue -ne "") {
            try {
                $plainValue | wrangler secret put $SecretName
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ $SecretName 设置成功" -ForegroundColor Green
                } else {
                    Write-Host "❌ $SecretName 设置失败" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ $SecretName 设置失败: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️  密钥值为空，跳过设置" -ForegroundColor Yellow
        }
    } else {
        if ($IsRequired) {
            Write-Host "⚠️  警告: $SecretName 是必需的，应用可能无法正常工作" -ForegroundColor Yellow
        } else {
            Write-Host "ℹ️  跳过 $SecretName" -ForegroundColor Blue
        }
    }
    Write-Host ""
}
# 函数：生成随机密钥
function Generate-RandomKey {
    param([int]$Length = 64)
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $random = New-Object System.Random
    $result = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $result += $chars[$random.Next(0, $chars.Length)]
    }
    return $result
}
# 函数：设置带自动生成选项的密钥
function Set-SecretWithGeneration {
    param(
        [string]$SecretName,
        [string]$Description,
        [int]$KeyLength = 64
    )
    Write-Host "📝 设置 $SecretName" -ForegroundColor Cyan
    Write-Host "描述: $Description" -ForegroundColor Gray
    Write-Host "⚠️  这是必需的密钥" -ForegroundColor Yellow
    $choice = Read-Host "是否要自动生成一个安全的密钥? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Write-Host "正在生成随机密钥..." -ForegroundColor Yellow
        $randomKey = Generate-RandomKey -Length $KeyLength
        try {
            $randomKey | wrangler secret put $SecretName
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $SecretName 已自动生成并设置" -ForegroundColor Green
            } else {
                Write-Host "❌ 自动生成失败，请手动设置" -ForegroundColor Red
                Set-Secret -SecretName $SecretName -Description $Description
            }
        } catch {
            Write-Host "❌ 自动生成失败，请手动设置" -ForegroundColor Red
            Set-Secret -SecretName $SecretName -Description $Description
        }
    } else {
        Set-Secret -SecretName $SecretName -Description $Description
    }
}
# 开始设置密钥
Write-Host "🔑 开始设置密钥..." -ForegroundColor Cyan
Write-Host ""
Write-Host "=== 必需的密钥 ===" -ForegroundColor Magenta
Write-Host ""
# JWT密钥
Set-SecretWithGeneration -SecretName "JWT_SECRET" -Description "用于签名JWT令牌的密钥" -KeyLength 64
# 加密密钥
Set-SecretWithGeneration -SecretName "ENCRYPTION_KEY" -Description "用于加密用户API Key的密钥" -KeyLength 32
# 服务器API密钥
Set-Secret -SecretName "SERVER_GEMINI_API_KEY" -Description "服务器使用的Gemini API Key（付费用户将使用此密钥）"
Write-Host "=== 可选的密钥 ===" -ForegroundColor Magenta
Write-Host ""
# 微信相关密钥
Set-Secret -SecretName "WECHAT_APP_SECRET" -Description "微信应用密钥（如需微信登录功能）" -IsRequired $false
# 支付相关密钥
Set-Secret -SecretName "ALIPAY_PRIVATE_KEY" -Description "支付宝应用私钥（如需支付宝支付功能）" -IsRequired $false
Set-Secret -SecretName "ALIPAY_PUBLIC_KEY" -Description "支付宝公钥（如需支付宝支付功能）" -IsRequired $false
Set-Secret -SecretName "WECHAT_PAY_API_KEY" -Description "微信支付API密钥（如需微信支付功能）" -IsRequired $false
# 完成
Write-Host "🎉 密钥设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 已设置的密钥列表:" -ForegroundColor Cyan
wrangler secret list
Write-Host ""
Write-Host "🔒 安全提醒:" -ForegroundColor Yellow
Write-Host "1. 这些密钥已安全存储在Cloudflare中，不会出现在您的代码仓库中"
Write-Host "2. 只有您的Cloudflare账户可以访问这些密钥"
Write-Host "3. 如需更新密钥，请重新运行此脚本或使用 wrangler secret put 命令"
Write-Host "4. 如需删除密钥，请使用 wrangler secret delete <SECRET_NAME> 命令"
Write-Host ""
Write-Host "✅ 现在可以安全地部署您的应用了！" -ForegroundColor Green
Write-Host "部署命令: wrangler deploy" -ForegroundColor Cyan
Write-Host ""
Read-Host "按任意键退出"
