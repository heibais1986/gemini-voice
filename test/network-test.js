/**
 * 网络连接测试脚本
 * 用于测试Gemini API的网络连接和故障转移机制
 */

// 测试HTTP API连接
async function testHttpConnection(baseUrl, apiKey) {
  console.log(`Testing HTTP connection to: ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/v1beta/models`, {
      headers: {
        'x-goog-api-key': apiKey,
        'x-goog-api-client': 'genai-js/0.21.0'
      }
    });
    
    if (response.ok) {
      console.log(`✅ HTTP connection successful: ${baseUrl}`);
      return true;
    } else {
      console.log(`❌ HTTP connection failed: ${baseUrl} (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ HTTP connection error: ${baseUrl} (${error.message})`);
    return false;
  }
}

// 测试WebSocket连接
async function testWebSocketConnection(baseUrl, apiKey) {
  console.log(`Testing WebSocket connection to: ${baseUrl}`);
  
  return new Promise((resolve) => {
    const wsUrl = `${baseUrl.replace('https://', 'wss:')}/v1beta/models/gemini-live-2.5-flash-preview:streamingGenerateContent?key=${apiKey}`;
    
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      console.log(`❌ WebSocket connection timeout: ${baseUrl}`);
      ws.close();
      resolve(false);
    }, 10000);
    
    ws.onopen = () => {
      clearTimeout(timeout);
      console.log(`✅ WebSocket connection successful: ${baseUrl}`);
      ws.close();
      resolve(true);
    };
    
    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.log(`❌ WebSocket connection error: ${baseUrl}`);
      resolve(false);
    };
  });
}

// 主测试函数
async function runNetworkTest() {
  console.log('🔍 开始网络连接测试...\n');
  
  // 从环境变量或默认值获取配置
  const apiKey = process.env.GEMINI_API_KEY || 'your-api-key-here';
  const baseUrl = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com';
  const fallbackUrls = (process.env.GEMINI_API_FALLBACK_URLS || 'https://generativelanguage.googleapis.com')
    .split(',').map(url => url.trim());
  
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Fallback URLs: ${fallbackUrls.join(', ')}\n`);
  
  if (apiKey === 'your-api-key-here') {
    console.log('⚠️  请设置 GEMINI_API_KEY 环境变量');
    console.log('   export GEMINI_API_KEY="your-actual-api-key"');
    return;
  }
  
  // 测试主URL
  console.log('📡 测试主URL...');
  const httpSuccess = await testHttpConnection(baseUrl, apiKey);
  const wsSuccess = await testWebSocketConnection(baseUrl, apiKey);
  
  if (httpSuccess && wsSuccess) {
    console.log('\n✅ 主URL连接正常，无需使用备用URL');
    return;
  }
  
  // 测试备用URLs
  console.log('\n📡 测试备用URLs...');
  let foundWorking = false;
  
  for (const url of fallbackUrls) {
    if (url === baseUrl) continue; // 跳过已测试的主URL
    
    const httpOk = await testHttpConnection(url, apiKey);
    const wsOk = await testWebSocketConnection(url, apiKey);
    
    if (httpOk && wsOk) {
      console.log(`\n✅ 找到可用的备用URL: ${url}`);
      console.log(`   建议将此URL设置为主URL：`);
      console.log(`   export GEMINI_API_BASE_URL="${url}"`);
      foundWorking = true;
      break;
    }
  }
  
  if (!foundWorking) {
    console.log('\n❌ 所有URL都无法连接');
    console.log('   建议检查：');
    console.log('   1. 网络连接是否正常');
    console.log('   2. API密钥是否正确');
    console.log('   3. 是否需要使用代理');
    console.log('   4. 防火墙设置');
  }
}

// 如果直接运行此脚本
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runNetworkTest().catch(console.error);
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testHttpConnection,
    testWebSocketConnection,
    runNetworkTest
  };
}
