#!/bin/bash

# Cloudflare Secrets 设置脚本
# 用于安全地设置敏感的环境变量

echo "🔐 Cloudflare Secrets 设置向导"
echo "================================"
echo ""
echo "此脚本将帮助您安全地设置敏感的环境变量到Cloudflare Secrets中。"
echo "这些密钥不会存储在代码仓库中，确保了安全性。"
echo ""

# 检查wrangler是否已安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误: wrangler CLI 未安装"
    echo "请先安装: npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "❌ 错误: 未登录到Cloudflare"
    echo "请先登录: wrangler login"
    exit 1
fi

echo "✅ wrangler CLI 已就绪"
echo ""

# 函数：设置密钥
set_secret() {
    local secret_name=$1
    local description=$2
    local is_required=$3
    
    echo "📝 设置 $secret_name"
    echo "描述: $description"
    
    if [ "$is_required" = "true" ]; then
        echo "⚠️  这是必需的密钥"
    else
        echo "ℹ️  这是可选的密钥（如不需要可跳过）"
    fi
    
    read -p "是否要设置此密钥? (y/n/skip): " choice
    
    case $choice in
        y|Y|yes|YES)
            echo "请输入 $secret_name 的值:"
            read -s secret_value
            
            if [ -n "$secret_value" ]; then
                echo "$secret_value" | wrangler secret put "$secret_name"
                if [ $? -eq 0 ]; then
                    echo "✅ $secret_name 设置成功"
                else
                    echo "❌ $secret_name 设置失败"
                fi
            else
                echo "⚠️  密钥值为空，跳过设置"
            fi
            ;;
        n|N|no|NO)
            if [ "$is_required" = "true" ]; then
                echo "⚠️  警告: $secret_name 是必需的，应用可能无法正常工作"
            else
                echo "ℹ️  跳过 $secret_name"
            fi
            ;;
        skip|SKIP)
            echo "ℹ️  跳过 $secret_name"
            ;;
        *)
            echo "❌ 无效选择，跳过 $secret_name"
            ;;
    esac
    
    echo ""
}

# 生成随机密钥的函数
generate_random_key() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

echo "🔑 开始设置密钥..."
echo ""

# 必需的密钥
echo "=== 必需的密钥 ==="

# JWT密钥
echo "📝 设置 JWT_SECRET"
echo "描述: 用于签名JWT令牌的密钥"
echo "⚠️  这是必需的密钥"
read -p "是否要自动生成一个安全的JWT密钥? (y/n): " auto_jwt
case $auto_jwt in
    y|Y|yes|YES)
        jwt_secret=$(generate_random_key 64)
        echo "$jwt_secret" | wrangler secret put "JWT_SECRET"
        echo "✅ JWT_SECRET 已自动生成并设置"
        ;;
    *)
        set_secret "JWT_SECRET" "用于签名JWT令牌的密钥" "true"
        ;;
esac

# 加密密钥
echo "📝 设置 ENCRYPTION_KEY"
echo "描述: 用于加密用户API Key的密钥"
echo "⚠️  这是必需的密钥"
read -p "是否要自动生成一个安全的加密密钥? (y/n): " auto_enc
case $auto_enc in
    y|Y|yes|YES)
        enc_key=$(generate_random_key 32)
        echo "$enc_key" | wrangler secret put "ENCRYPTION_KEY"
        echo "✅ ENCRYPTION_KEY 已自动生成并设置"
        ;;
    *)
        set_secret "ENCRYPTION_KEY" "用于加密用户API Key的密钥" "true"
        ;;
esac

# 服务器API密钥
set_secret "SERVER_GEMINI_API_KEY" "服务器使用的Gemini API Key（付费用户将使用此密钥）" "true"

echo ""
echo "=== 可选的密钥 ==="

# 微信相关密钥
set_secret "WECHAT_APP_SECRET" "微信应用密钥（如需微信登录功能）" "false"

# 支付相关密钥
set_secret "ALIPAY_PRIVATE_KEY" "支付宝应用私钥（如需支付宝支付功能）" "false"
set_secret "ALIPAY_PUBLIC_KEY" "支付宝公钥（如需支付宝支付功能）" "false"
set_secret "WECHAT_PAY_API_KEY" "微信支付API密钥（如需微信支付功能）" "false"

echo ""
echo "🎉 密钥设置完成！"
echo ""
echo "📋 已设置的密钥列表:"
wrangler secret list

echo ""
echo "🔒 安全提醒:"
echo "1. 这些密钥已安全存储在Cloudflare中，不会出现在您的代码仓库中"
echo "2. 只有您的Cloudflare账户可以访问这些密钥"
echo "3. 如需更新密钥，请重新运行此脚本或使用 wrangler secret put 命令"
echo "4. 如需删除密钥，请使用 wrangler secret delete <SECRET_NAME> 命令"
echo ""
echo "✅ 现在可以安全地部署您的应用了！"
