#!/bin/bash
# 文件格式清理脚本
# 用于清理项目中的多余空行和无意义的分隔线
echo "🧹 开始清理文件格式..."
# 清理Markdown文件中的多余空行
echo "清理Markdown文件..."
find . -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" | while read file; do
    echo "处理: $file"
    # 移除连续的空行，最多保留一个
    awk '/^$/{if(++n<=1)print;next};{n=0;print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
# 清理配置文件中的多余空行
echo "清理配置文件..."
for file in .env.example wrangler.toml package.json deno.json; do
    if [ -f "$file" ]; then
        echo "处理: $file"
        awk '/^$/{if(++n<=1)print;next};{n=0;print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
done
# 清理JavaScript/TypeScript文件中的多余空行
echo "清理源代码文件..."
find src -name "*.js" -o -name "*.ts" -o -name "*.mjs" | while read file; do
    echo "处理: $file"
    awk '/^$/{if(++n<=2)print;next};{n=0;print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
# 移除文件末尾的多余空行
echo "移除文件末尾的多余空行..."
find . -name "*.md" -o -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.toml" | \
    grep -v ".git" | grep -v "node_modules" | while read file; do
    # 移除文件末尾的空行
    sed -i -e :a -e '/^\s*$/N;ba' -e 's/\n\s*$//' "$file" 2>/dev/null || true
done
echo "✅ 文件格式清理完成！"
echo ""
echo "📋 清理内容："
echo "- 移除了连续的多余空行"
echo "- 统一空行数量（最多1-2个连续空行）"
echo "- 清理了文件末尾的空行"
echo "- 保持了代码的可读性"
