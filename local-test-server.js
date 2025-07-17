// 本地测试环境 - 模拟生产环境的修复效果
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'src', 'static');

// 模拟验证码存储
const verificationCodes = new Map();

// 模拟会话存储
const sessions = new Map();

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = {
    'info': '📝',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'api': '🔗'
  };
  console.log(`${emoji[type] || '📝'} [${timestamp}] ${message}`);
}

// 处理用户系统API - 与生产环境修复版本一致
async function handleUserSystemAPI(req, res, pathname) {
  try {
    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
      res.writeHead(200, corsHeaders);
      res.end();
      return;
    }

    // 发送验证码API
    if (pathname === '/api/auth/send-code' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const { phone } = JSON.parse(body);
          log(`收到发送验证码请求: ${phone}`, 'api');

          if (!phone) {
            log('验证码请求失败: 手机号为空', 'error');
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              message: '手机号不能为空'
            }));
            return;
          }

          if (!/^1[3-9]\d{9}$/.test(phone)) {
            log(`验证码请求失败: 手机号格式错误 - ${phone}`, 'error');
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              message: '手机号格式不正确'
            }));
            return;
          }

          // 生成验证码 - 与生产环境逻辑一致
          const testPhones = ['13800138000', '13800138001', '13800138002', '18888888888', '19999999999'];
          const code = testPhones.includes(phone) ? '123456' :
                       Math.floor(100000 + Math.random() * 900000).toString();

          // 存储验证码（5分钟过期）
          const expiresAt = Date.now() + 5 * 60 * 1000;
          verificationCodes.set(phone, { code, expiresAt });

          // 5分钟后清理
          setTimeout(() => {
            verificationCodes.delete(phone);
            log(`验证码已过期并清理: ${phone}`, 'warning');
          }, 5 * 60 * 1000);

          log(`验证码生成成功: ${phone} -> ${code}`, 'success');

          res.writeHead(200, corsHeaders);
          res.end(JSON.stringify({
            success: true,
            message: '验证码已发送',
            hint: testPhones.includes(phone) ? '测试号码，验证码: 123456' : '验证码已发送到您的手机'
          }));

        } catch (error) {
          log(`发送验证码异常: ${error.message}`, 'error');
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({
            success: false,
            message: '服务器内部错误'
          }));
        }
      });
      return;
    }

    // 手机号登录API
    if (pathname === '/api/auth/phone-login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const { phone, code, verificationCode } = JSON.parse(body);
          // 支持两种字段名：code 和 verificationCode
          const inputCode = code || verificationCode;
          log(`收到登录请求: ${phone}, 验证码: ${inputCode}`, 'api');

          if (!phone || !inputCode) {
            log('登录失败: 手机号或验证码为空', 'error');
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              message: '手机号和验证码不能为空'
            }));
            return;
          }

          // 验证验证码 - 与生产环境逻辑一致
          const stored = verificationCodes.get(phone);

          if (!stored) {
            log(`登录失败: 验证码不存在 - ${phone}`, 'error');
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              message: '验证码不存在或已过期'
            }));
            return;
          }

          if (Date.now() > stored.expiresAt) {
            verificationCodes.delete(phone);
            log(`登录失败: 验证码已过期 - ${phone}`, 'error');
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              message: '验证码已过期'
            }));
            return;
          }

          // 支持测试验证码和万能验证码
          const testPhones = ['13800138000', '13800138001', '13800138002', '18888888888', '19999999999'];
          const universalCodes = ['123456', '000000', '888888'];
          const isValidCode = stored.code === inputCode ||
                             (testPhones.includes(phone) && universalCodes.includes(inputCode));

          if (!isValidCode) {
            log(`登录失败: 验证码错误 - ${phone}:${inputCode} (期望:${stored.code})`, 'error');
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              message: '验证码错误'
            }));
            return;
          }

          // 验证成功，删除验证码
          verificationCodes.delete(phone);

          // 创建用户信息
          const user = {
            id: Date.now().toString(),
            phone: phone,
            username: `用户${phone.slice(-4)}`,
            user_type: 'free',
            created_at: new Date().toISOString()
          };

          // 生成会话令牌
          const sessionToken = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

          // 存储会话
          sessions.set(sessionToken, {
            user: user,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天
          });

          log(`登录成功: ${phone} -> ${sessionToken}`, 'success');

          // 设置Cookie并返回响应
          const responseHeaders = {
            ...corsHeaders,
            'Set-Cookie': `sessionToken=${sessionToken}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict`
          };

          res.writeHead(200, responseHeaders);
          res.end(JSON.stringify({
            success: true,
            message: '登录成功',
            user: user,
            sessionToken: sessionToken
          }));

        } catch (error) {
          log(`登录异常: ${error.message}`, 'error');
          res.writeHead(500, corsHeaders);
          res.end(JSON.stringify({
            success: false,
            message: '服务器内部错误'
          }));
        }
      });
      return;
    }

    // 获取用户信息API
    if (pathname === '/api/user/profile' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      log(`收到获取用户信息请求: ${authHeader ? '有认证头' : '无认证头'}`, 'api');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        log('获取用户信息失败: 缺少认证头', 'warning');
        res.writeHead(401, corsHeaders);
        res.end(JSON.stringify({
          success: false,
          message: 'Unauthorized'
        }));
        return;
      }

      const sessionToken = authHeader.substring(7);
      const session = sessions.get(sessionToken);

      if (!session || Date.now() > session.expiresAt) {
        log('获取用户信息失败: 会话无效或已过期', 'warning');
        res.writeHead(401, corsHeaders);
        res.end(JSON.stringify({
          success: false,
          message: 'Session expired'
        }));
        return;
      }

      log(`获取用户信息成功: ${session.user.username}`, 'success');
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({
        success: true,
        user: session.user
      }));
      return;
    }

    // 未知API端点
    log(`未知API端点: ${pathname}`, 'warning');
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      message: 'API endpoint not found',
      endpoint: pathname
    }));

  } catch (error) {
    log(`用户系统API错误: ${error.message}`, 'error');
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      success: false,
      message: '服务器内部错误'
    }));
  }
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const url = req.url;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API请求处理
  if (url.startsWith('/api/')) {
    return handleUserSystemAPI(req, res, url);
  }

  // 静态文件处理
  let filePath = url === '/' ? '/login.html' : url;
  filePath = path.join(STATIC_DIR, filePath);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('500 Internal Server Error');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  log('本地测试环境启动成功', 'success');
  console.log(`\n🚀 本地测试环境已启动`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`\n🧪 测试步骤:`);
  console.log(`1. 打开浏览器访问 http://localhost:${PORT}`);
  console.log(`2. 输入测试手机号: 13800138000`);
  console.log(`3. 点击"发送验证码" - 观察控制台日志`);
  console.log(`4. 输入验证码: 123456`);
  console.log(`5. 点击"登录" - 观察控制台日志`);
  console.log(`\n📋 支持的测试手机号:`);
  console.log(`   13800138000, 13800138001, 13800138002`);
  console.log(`   18888888888, 19999999999`);
  console.log(`   验证码: 123456`);
  console.log(`\n🔧 万能验证码: 123456, 000000, 888888`);
  console.log(`\n📊 实时日志显示所有API请求和响应`);
  console.log(`按 Ctrl+C 停止服务器`);
});

process.on('SIGINT', () => {
  log('服务器正在关闭', 'warning');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
