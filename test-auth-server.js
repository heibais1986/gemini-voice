// 简单的测试服务器，用于调试认证问题
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'src', 'static');

// MIME 类型映射
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

// 模拟认证检查
function checkAuth(request) {
  const cookieHeader = request.headers.cookie;
  console.log('🍪 收到Cookie:', cookieHeader);
  
  if (!cookieHeader) {
    console.log('❌ 没有Cookie，用户未认证');
    return false;
  }
  
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.sessionToken;
  console.log('🎫 解析到sessionToken:', sessionToken ? '存在' : '不存在');
  
  // 简单的token验证（实际应该查数据库）
  if (sessionToken && sessionToken !== 'invalid') {
    console.log('✅ 用户已认证');
    return true;
  }
  
  console.log('❌ 用户未认证');
  return false;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// 修改HTML内容，注入meta标签
function injectAuthMeta(htmlContent) {
  console.log('🔧 注入auth-required meta标签...');
  const modifiedContent = htmlContent.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="auth-required" content="true">'
  );
  
  if (modifiedContent === htmlContent) {
    console.warn('⚠️ viewport meta标签未找到，尝试其他方式注入');
    return htmlContent.replace(
      '<head>',
      '<head>\n    <meta name="auth-required" content="true">'
    );
  }
  
  console.log('✅ meta标签注入成功');
  return modifiedContent;
}

const server = http.createServer((req, res) => {
  console.log(`\n📥 ${req.method} ${req.url}`);
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 处理主页请求
  if (req.url === '/' || req.url === '/index.html') {
    const isAuthenticated = checkAuth(req);
    console.log('🏠 处理主页请求，认证状态:', isAuthenticated);
    
    const filePath = path.join(STATIC_DIR, 'index.html');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        console.error('❌ 读取index.html失败:', err);
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      
      let responseContent = content;
      if (!isAuthenticated) {
        responseContent = injectAuthMeta(content);
      }
      
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(responseContent);
    });
    return;
  }

  // 模拟API请求
  if (req.url === '/api/user/profile') {
    const isAuthenticated = checkAuth(req);
    if (isAuthenticated) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user: {
          username: 'testuser',
          user_type: 'free'
        }
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
    return;
  }

  // 处理静态文件
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(STATIC_DIR, filePath);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
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
  console.log(`🚀 认证测试服务器启动成功！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`\n🔧 测试说明:`);
  console.log(`1. 访问 http://localhost:${PORT} - 应该显示登录遮罩`);
  console.log(`2. 打开浏览器开发者工具查看控制台日志`);
  console.log(`3. 手动设置Cookie: document.cookie = 'sessionToken=valid'`);
  console.log(`4. 刷新页面 - 应该隐藏登录遮罩`);
  console.log(`5. 按 Ctrl+C 停止服务器`);
});

process.on('SIGINT', () => {
  console.log('\n👋 服务器正在关闭...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
