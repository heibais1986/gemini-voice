# Gemini 2.5 PlayGround 
# Gemini 2.5 游乐场
## 使用方法
### 多模态对话
填入API Key, 点击Connect按钮即可对话。
以下三个按钮分别是：
- 启用麦克风
- 启用摄像头
- 分享屏幕
<br>
### API 代理
API已经被代理为OpenAI格式，可以直接使用OpenAI格式的API。
不限网络环境，可免梯子使用。
注意替换域名与Gemini API Key。
## 致谢/引用：
# [English Version](README_EN.MD)
## 项目简介
📚 **详细文档**：
- [用户系统部署指南](USER_SYSTEM_DEPLOYMENT.md)
- [密钥管理指南](SECRETS_MANAGEMENT.md)
- [路由和认证系统指南](ROUTING_GUIDE.md)
- [Windows用户设置指南](WINDOWS_SETUP.md) - 解决Windows脚本问题
#### Demo: [https://docman.edu.kg](https://docman.edu.kg)
只需准备一个Gemini API Key，10秒即可部署一个Gemini多模态对话的网站。
不限地区/网络环境，打开即用，<b>适配了手机端</b>。
使用Deno/Cloudflare Worker无服务器免费部署。
对Gemini Chat API 进行了格式转换，中转为更通用的OpenAI格式。
可对接AI编程，接入ChatBox等AI客户端。
## ⚠️ 网络访问说明
由于网络环境变化，Google Gemini API 在中国大陆地区可能需要代理才能访问。本项目已添加灵活的网络配置支持：
- 🔧 **可配置API端点**: 支持自定义Gemini API基础URL
- 🔄 **自动故障转移**: 主URL失败时自动尝试备用URL
- 📝 **详细日志**: 记录连接尝试过程，便于调试
- 🌐 **多种部署方式**: 支持Cloudflare Worker和Deno两种部署方式
详细配置方法请参考：[网络配置指南](NETWORK_CONFIG.md)
## Deno部署（推荐）
### 作者：技术爬爬虾
0. 准备一个Gemini API Key [https://aistudio.google.com](https://aistudio.google.com)（免费）
1. [fork](https://github.com/heibais1986/gemini-playground/fork)本项目
2. 登录/注册 https://dash.deno.com/
3. 创建项目 https://dash.deno.com/new_project
4. 选择此项目，填写项目名字（请仔细填写项目名字，关系到自动分配的域名）
5. Entrypoint 填写 `src/deno_index.ts` 其他字段留空 
   <details>
   <summary>如图</summary>
   ![image](/docs/images/1.png)
   </details>
6. 点击 <b>Deploy Project</b>
7. 部署成功后获得域名，点开即用。域名同样可以作为Chat API的代理使用。
8. **网络配置**（如果遇到连接问题）：
   - 在Deno Deploy的环境变量中设置 `GEMINI_API_BASE_URL`
   - 设置 `GEMINI_API_FALLBACK_URLS` 配置备用域名
B站，YouTube，抖音，公众号 全网同名。转载请注明作者。
## 项目简介
0. 准备一个Gemini API Key [https://aistudio.google.com](https://aistudio.google.com)（免费）
1. 点击部署按钮
2. 登录Cloudflare账号
3. 填入Account ID，与API Token
4. Fork本项目，开启Github Action功能
5. 部署，打开dash.cloudflare.com，查看部署后的worker
6. 国内使用需要绑定一个自定义域名
7. **网络配置**（如果遇到连接问题）：
   - 编辑 `wrangler.toml` 中的 `[vars]` 部分
   - 设置 `GEMINI_API_BASE_URL` 为可用的代理域名
   - 配置 `GEMINI_API_FALLBACK_URLS` 备用域名列表
   <details>
   <summary>如图</summary>
   ![image](/docs/images/3.png)
   </details>
> 国内使用cloudflare有时候可能出现400: User location is not supported for the API use. 可能是粤港地区Cloudflare路由到了香港的CDN节点代理导致的。建议换成Deno部署。
#### Demo: [https://docman.edu.kg](https://docman.edu.kg)
只需准备一个Gemini API Key，10秒即可部署一个Gemini多模态对话的网站。
不限地区/网络环境，打开即用，<b>适配了手机端</b>。
使用Deno/Cloudflare Worker无服务器免费部署。
对Gemini Chat API 进行了格式转换，中转为更通用的OpenAI格式，国内直连可用。
可对接AI编程，接入ChatBox等AI客户端。
## Deno部署（推荐）
0. 准备一个Gemini API Key [https://aistudio.google.com](https://aistudio.google.com)（免费）
1. [fork](https://github.com/heibais1986/gemini-playground/fork)本项目
2. 登录/注册 https://dash.deno.com/
3. 创建项目 https://dash.deno.com/new_project
4. 选择此项目，填写项目名字（请仔细填写项目名字，关系到自动分配的域名）
5. Entrypoint 填写 `src/deno_index.ts` 其他字段留空 
   <details>
   <summary>如图</summary>
   ![image](/docs/images/1.png)
   </details>
6. 点击 <b>Deploy Project</b>
7. 部署成功后获得域名，点开即用。域名同样可以作为Chat API的代理使用。
## Cloudflare Worker 部署
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/heibais1986/gemini-playground)
0. 准备一个Gemini API Key [https://aistudio.google.com](https://aistudio.google.com)（免费）
1. 点击部署按钮
2. 登录Cloudflare账号
3. 填入Account ID，与API Token
4. Fork本项目，开启Github Action功能
5. 部署，打开dash.cloudflare.com，查看部署后的worker
6. 国内使用需要绑定一个自定义域名
   <details>
   <summary>如图</summary>
   ![image](/docs/images/3.png)
   </details>
> 国内使用cloudflare有时候可能出现400: User location is not supported for the API use. 可能是粤港地区Cloudflare路由到了香港的CDN节点代理导致的。建议换成Deno部署。
## 本地调试
Windows 安装Deno:
> irm https://deno.land/install.ps1 | iex
Mac/Linux 安装Deno:
> curl -fsSL https://deno.land/install.sh | sh
启动项目：
>cd 项目目录 <br>
>deno run --allow-net --allow-read src/deno_index.ts
## 使用方法
### 多模态对话
填入API Key, 点击Connect按钮即可对话。
以下三个按钮分别是：
- 启用麦克风
- 启用摄像头
- 分享屏幕
<br>
<details>
   <summary>如图</summary>
   ![image](/docs/images/2.png)
</details>
### API 代理
API已经被代理为OpenAI格式，可以直接使用OpenAI格式的API。
不限网络环境，可免梯子使用。
注意替换域名与Gemini API Key。
#### 可用模型列表：
```
curl --location 'http://your.domain.com/v1/models' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY'
```
#### 对话:
```
curl --location 'https://your.domain.com/v1/chat/completions' \
--header 'Authorization: Bearer YOUR-GEMINI-API-KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "system",
            "content": "You are a test assistant."
        },
        {
            "role": "user",
            "content": "Testing. Just say hi and nothing else."
        }
    ],
    "model": "gemini-2.5-flash"
}'
```
### ChatBOX：
   <details>
   <summary>如图</summary>
   ![image](/docs/images/4.png)
   </details>
### Cursor编程：
   <details>
   <summary>如图</summary>
   ![image](/docs/images/5.png)
   </details>
## 致谢/引用：
网站UI： 
```
Author: ChrisKyle
Project: https://github.com/ViaAnthroposBenevolentia/gemini-2-live-api-demo
MIT License : https://github.com/ViaAnthroposBenevolentia/gemini-2-live-api-demo/blob/main/LICENSE
```
Gemini转成OpenAI格式： 
```
Author: PublicAffairs
Project: https://github.com/PublicAffairs/openai-gemini
MIT License : https://github.com/PublicAffairs/openai-gemini/blob/main/LICENSE
```
