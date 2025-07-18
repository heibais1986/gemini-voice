const assetManifest = {};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理 WebSocket 连接
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env);
    }
    
    // 添加 API 请求处理
    if (url.pathname.endsWith("/chat/completions") ||
        url.pathname.endsWith("/embeddings") ||
        url.pathname.endsWith("/models")) {
      return handleAPIRequest(request, env);
    }

    // 处理静态资源
    if (url.pathname === '/' || url.pathname === '/index.html') {
      console.log('Serving index.html from static directory');
      try {
        // 优先从静态资源目录获取
        const staticContent = await env.__STATIC_CONTENT.get('index.html');
        if (staticContent) {
          return new Response(staticContent, {
            headers: {
              'content-type': 'text/html;charset=UTF-8',
            },
          });
        }
      } catch (error) {
        console.log('Static content not found, serving fallback');
      }
      
      // 如果静态资源不存在，返回基本HTML
      return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini 智能助手</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <!-- 登录检查遮罩 -->
        <div id="login-overlay" class="login-overlay" style="display: none;">
            <div class="login-prompt">
                <h2>请先登录</h2>
                <p>使用 Gemini Playground 需要先登录账户</p>
                <button id="go-login" class="login-btn">前往登录</button>
            </div>
        </div>
        <div class="settings">
            <input type="password" id="api-key" placeholder="请输入 Gemini API Key" />
            <button id="config-toggle" class="material-symbols-outlined">settings</button>
        </div>
        <div id="config-container">
            <div class="config-wrapper">
                <div class="setting-container">
                    <span class="setting-label">语言: </span>
                    <select id="language-select"></select>
                </div>
                <div class="setting-container">
                    <span class="setting-label">语音: </span>
                    <select id="voice-select">
                        <option value="Puck">Puck (男声)</option>
                        <option value="Charon">Charon (男声)</option>
                        <option value="Fenrir">Fenrir (男声)</option>
                        <option value="Kore">Kore (女声)</option>
                        <option value="Aoede" selected>Aoede (女声)</option>
                    </select>
                </div>
                <div class="setting-container">
                    <span class="setting-label">回复方式: </span>
                    <select id="response-type-select">
                        <option value="text">文字</option>
                        <option value="audio" selected>语音</option>
                    </select>
                </div>
                <div class="setting-container">
                    <span class="setting-label">视频帧率: </span>
                    <input type="number" id="fps-input" placeholder="视频帧率" value="1" min="1" max="30" step="1"/>
                    <span class="fps-help">更高帧率需要更多网络带宽</span>
                </div>
                <div class="setting-container">
                    <span class="setting-label">系统指令: </span>
                </div>
                <textarea id="system-instruction" placeholder="输入自定义系统指令..."></textarea>
                <button id="apply-config">应用设置</button>
            </div>
        </div>
        <button id="connect-button">连接</button>
        <div id="logs-container"></div>
        <div class="input-controls">
            <div class="message-input-container">
                <textarea id="message-input" placeholder="输入消息..." rows="1"></textarea>
                <button id="send-button">发送</button>
            </div>
            <div class="action-buttons">
                <button id="mic-button" title="语音输入">
                    <span id="mic-icon" class="material-symbols-outlined">mic</span>
                </button>
                <button id="camera-button" title="开启摄像头">
                    <span id="camera-icon" class="material-symbols-outlined">videocam</span>
                </button>
                <button id="screen-button" title="屏幕共享">
                    <span id="screen-icon" class="material-symbols-outlined">screen_share</span>
                </button>
            </div>
        </div>
    </div>
    <script>
    // 简化的登录检查逻辑
    document.addEventListener('DOMContentLoaded', function() {
        const loginOverlay = document.getElementById('login-overlay');
        const goLoginBtn = document.getElementById('go-login');
        
        // 检查是否有会话令牌
        const sessionToken = localStorage.getItem('sessionToken') || getCookie('sessionToken');
        
        if (!sessionToken) {
            // 没有会话令牌，显示登录遮罩
            console.log('No session token found, showing login overlay');
            if (loginOverlay) {
                loginOverlay.style.display = 'flex';
            }
        } else {
            // 有会话令牌，隐藏登录遮罩
            console.log('Session token found, hiding login overlay');
            if (loginOverlay) {
                loginOverlay.style.display = 'none';
            }
        }
        
        // 绑定登录按钮事件
        if (goLoginBtn) {
            goLoginBtn.addEventListener('click', function() {
                window.location.href = '/login.html';
            });
        }
        
        function getCookie(name) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [cookieName, cookieValue] = cookie.trim().split('=');
                if (cookieName === name) {
                    return decodeURIComponent(cookieValue);
                }
            }
            return null;
        }
    });
    </script>
</body>
</html>`, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      });
    }

    // 处理其他静态资源
    const asset = await env.__STATIC_CONTENT.get(url.pathname.slice(1));
    if (asset) {
      const contentType = getContentType(url.pathname);
      return new Response(asset, {
        headers: {
          'content-type': contentType,
        },
      });
    }



    return new Response('Not found', { status: 404 });
  },
};

function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  };
  return types[ext] || 'text/plain';
}

async function handleWebSocket(request, env) {


  if (request.headers.get("Upgrade") !== "websocket") {
		return new Response("Expected WebSocket connection", { status: 400 });
	}
  
	const url = new URL(request.url);
	const pathAndQuery = url.pathname + url.search;
	const targetUrl = `wss://generativelanguage.googleapis.com${pathAndQuery}`;
	  
	console.log('Target URL:', targetUrl);
  
  const [client, proxy] = new WebSocketPair();
  proxy.accept();
  
   // 用于存储在连接建立前收到的消息
   let pendingMessages = [];
  
   const targetWebSocket = new WebSocket(targetUrl);
 
   console.log('Initial targetWebSocket readyState:', targetWebSocket.readyState);
 
   targetWebSocket.addEventListener("open", () => {
     console.log('Connected to target server');
     console.log('targetWebSocket readyState after open:', targetWebSocket.readyState);
     
     // 连接建立后，发送所有待处理的消息
     console.log(`Processing ${pendingMessages.length} pending messages`);
     for (const message of pendingMessages) {
      try {
        targetWebSocket.send(message);
        console.log('Sent pending message:', message);
      } catch (error) {
        console.error('Error sending pending message:', error);
      }
     }
     pendingMessages = []; // 清空待处理消息队列
   });
 
   proxy.addEventListener("message", async (event) => {
     console.log('Received message from client:', {
       dataPreview: typeof event.data === 'string' ? event.data.slice(0, 200) : 'Binary data',
       dataType: typeof event.data,
       timestamp: new Date().toISOString()
     });
     
     console.log("targetWebSocket.readyState"+targetWebSocket.readyState)
     if (targetWebSocket.readyState === WebSocket.OPEN) {
        try {
          targetWebSocket.send(event.data);
          console.log('Successfully sent message to gemini');
        } catch (error) {
          console.error('Error sending to gemini:', error);
        }
     } else {
       // 如果连接还未建立，将消息加入待处理队列
       console.log('Connection not ready, queueing message');
       pendingMessages.push(event.data);
     }
   });
 
   targetWebSocket.addEventListener("message", (event) => {
     console.log('Received message from gemini:', {
     dataPreview: typeof event.data === 'string' ? event.data.slice(0, 200) : 'Binary data',
     dataType: typeof event.data,
     timestamp: new Date().toISOString()
     });
     
     try {
     if (proxy.readyState === WebSocket.OPEN) {
       proxy.send(event.data);
       console.log('Successfully forwarded message to client');
     }
     } catch (error) {
     console.error('Error forwarding to client:', error);
     }
   });
 
   targetWebSocket.addEventListener("close", (event) => {
     console.log('Gemini connection closed:', {
     code: event.code,
     reason: event.reason || 'No reason provided',
     wasClean: event.wasClean,
     timestamp: new Date().toISOString(),
     readyState: targetWebSocket.readyState
     });
     if (proxy.readyState === WebSocket.OPEN) {
     proxy.close(event.code, event.reason);
     }
   });
 
   proxy.addEventListener("close", (event) => {
     console.log('Client connection closed:', {
     code: event.code,
     reason: event.reason || 'No reason provided',
     wasClean: event.wasClean,
     timestamp: new Date().toISOString()
     });
     if (targetWebSocket.readyState === WebSocket.OPEN) {
     targetWebSocket.close(event.code, event.reason);
     }
   });
 
   targetWebSocket.addEventListener("error", (error) => {
     console.error('Gemini WebSocket error:', {
     error: error.message || 'Unknown error',
     timestamp: new Date().toISOString(),
     readyState: targetWebSocket.readyState
     });
   });

 
   return new Response(null, {
   status: 101,
   webSocket: client,
   });
}

async function handleAPIRequest(request, env) {
  try {
    const worker = await import('./api_proxy/worker.mjs');
    return await worker.default.fetch(request);
  } catch (error) {
    console.error('API request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStatus = error.status || 500;
    return new Response(errorMessage, {
      status: errorStatus,
      headers: {
        'content-type': 'text/plain;charset=UTF-8',
      }
    });
  }
}