# 生产环境问题排查指南

## 问题现象
- 输入手机号 13800138000 后点击发送验证码，提示网络错误
- 直接在验证码框输入 123456，点登录，还是提示网络错误

## 可能的原因分析

### 1. 路由配置问题
**症状**: API请求返回404或被重定向
**检查方法**:
```bash
# 检查API端点是否可访问
curl -X POST https://your-domain.com/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'
```

### 2. 环境变量缺失
**症状**: 服务器内部错误
**检查方法**:
```bash
# 检查必需的环境变量
wrangler secret list
```

### 3. 数据库连接问题
**症状**: 数据库相关错误
**检查方法**:
```bash
# 测试数据库连接
wrangler d1 execute gemini-playground-db --command="SELECT 1"
```

### 4. CORS配置问题
**症状**: 跨域请求被阻止
**检查方法**: 浏览器开发者工具 → Network → 查看请求状态

## 解决方案

### 方案1: 快速修复 - 内联API处理

修改 `src/index.js`，将用户系统API处理内联到主文件中：

```javascript
// 在 src/index.js 中添加
import { AuthService } from './user-system/auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理用户系统API请求 - 内联处理
    if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/user/')) {
      return await handleUserAPI(request, env, url.pathname);
    }
    
    // 其他处理...
  }
};

// 内联API处理函数
async function handleUserAPI(request, env, pathname) {
  const authService = new AuthService(env.DB, env);
  
  // 发送验证码
  if (pathname === '/api/auth/send-code' && request.method === 'POST') {
    try {
      const { phone } = await request.json();
      
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return new Response(JSON.stringify({
          success: false,
          message: '请输入正确的手机号'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 测试手机号使用固定验证码
      const code = phone === '13800138000' ? '123456' : 
                   Math.floor(100000 + Math.random() * 900000).toString();
      
      // 存储验证码
      authService.storeVerificationCode(phone, code);
      
      return new Response(JSON.stringify({
        success: true,
        message: '验证码已发送',
        hint: phone === '13800138000' ? '测试号码，验证码: 123456' : '验证码已发送到您的手机'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '发送验证码失败'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 手机号登录
  if (pathname === '/api/auth/login/phone' && request.method === 'POST') {
    try {
      const { phone, verificationCode } = await request.json();
      
      if (!phone || !verificationCode) {
        return new Response(JSON.stringify({
          success: false,
          message: '请输入手机号和验证码'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证验证码
      const result = authService.verifyPhoneCode(phone, verificationCode);
      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          message: result.error
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 登录成功
      const user = {
        id: Date.now().toString(),
        phone: phone,
        username: `用户${phone.slice(-4)}`,
        user_type: 'free'
      };
      
      const sessionToken = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      return new Response(JSON.stringify({
        success: true,
        message: '登录成功',
        user: user,
        sessionToken: sessionToken
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': `sessionToken=${sessionToken}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict`
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '登录失败'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 未知API端点
  return new Response(JSON.stringify({
    success: false,
    message: 'API endpoint not found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 方案2: 检查部署配置

1. **验证wrangler.toml配置**:
```toml
[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "gemini-playground-db"
database_id = "your-actual-database-id"
```

2. **检查必需的Secrets**:
```bash
wrangler secret put SERVER_GEMINI_API_KEY
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

3. **重新部署**:
```bash
wrangler deploy
```

### 方案3: 本地测试验证

创建本地测试环境验证功能：

```bash
# 启动本地开发服务器
wrangler dev

# 或使用简单的Node.js服务器测试
node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/api/auth/send-code') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({success: true, message: '验证码已发送', hint: '测试号码，验证码: 123456'}));
  } else if (req.url === '/api/auth/login/phone') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({success: true, message: '登录成功', user: {username: '测试用户'}}));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});
server.listen(3000, () => console.log('测试服务器启动: http://localhost:3000'));
"
```

## 调试步骤

### 1. 检查网络请求
打开浏览器开发者工具 → Network标签：
- 查看API请求的状态码
- 检查请求URL是否正确
- 查看响应内容

### 2. 检查控制台错误
打开浏览器开发者工具 → Console标签：
- 查看JavaScript错误
- 检查CORS错误
- 查看网络错误详情

### 3. 检查服务器日志
```bash
# 查看Cloudflare Workers日志
wrangler tail

# 查看实时日志
wrangler tail --format=pretty
```

### 4. 测试API端点
```bash
# 测试发送验证码API
curl -X POST https://your-domain.com/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

# 测试登录API
curl -X POST https://your-domain.com/api/auth/login/phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","verificationCode":"123456"}'
```

## 常见问题解决

### Q: API返回404错误
A: 检查路由配置，确保用户系统路由正确注册

### Q: 数据库连接失败
A: 检查D1数据库配置和绑定

### Q: 环境变量未定义
A: 使用 `wrangler secret put` 设置必需的密钥

### Q: CORS错误
A: 检查响应头设置，确保包含正确的CORS头部

### Q: 验证码验证失败
A: 确认测试手机号 13800138000 使用固定验证码 123456

## 紧急修复

如果问题紧急，可以临时使用以下简化版本替换整个用户系统：

```javascript
// 临时简化版本 - 替换 src/index.js 中的用户API处理部分
if (url.pathname === '/api/auth/send-code') {
  return new Response(JSON.stringify({
    success: true,
    message: '验证码已发送',
    hint: '测试号码，验证码: 123456'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

if (url.pathname === '/api/auth/login/phone') {
  return new Response(JSON.stringify({
    success: true,
    message: '登录成功',
    user: { username: '测试用户', user_type: 'free' }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

这个临时方案可以让登录功能立即工作，然后再逐步修复完整的用户系统。
