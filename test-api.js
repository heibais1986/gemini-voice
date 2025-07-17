const http = require('http');

// 测试发送验证码API
function testSendCode() {
  const data = JSON.stringify({ phone: '13800138000' });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/send-code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头:`, res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('响应体:', body);
      console.log('✅ 发送验证码API测试完成');
    });
  });

  req.on('error', (e) => {
    console.error(`❌ 请求错误: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// 测试登录API
function testLogin() {
  const data = JSON.stringify({ 
    phone: '13800138000', 
    verificationCode: '123456' 
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/phone-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头:`, res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('响应体:', body);
      console.log('✅ 登录API测试完成');
    });
  });

  req.on('error', (e) => {
    console.error(`❌ 请求错误: ${e.message}`);
  });

  req.write(data);
  req.end();
}

console.log('🧪 开始API测试...');
console.log('');

// 先测试发送验证码
testSendCode();

// 2秒后测试登录
setTimeout(() => {
  console.log('');
  console.log('🔄 2秒后测试登录API...');
  testLogin();
}, 2000); 