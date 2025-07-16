const assetManifest = {};

// 导入用户系统
import { UserRoutes } from './user-system/routes.js';
import { AuthService } from './user-system/auth.js';
import { getStaticFileContent, getContentType } from './static-files.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理用户系统API请求
    if (url.pathname.startsWith('/api/')) {
      const userRoutes = new UserRoutes(env.DB, env);
      return await userRoutes.handleRequest(request, url.pathname);
    }

    // 处理 WebSocket 连接
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env);
    }

    // 添加 API 请求处理（需要认证）
    if (url.pathname.endsWith("/chat/completions") ||
        url.pathname.endsWith("/embeddings") ||
        url.pathname.endsWith("/models")) {
      return handleAPIRequest(request, env);
    }

    // 处理页面路由
    return await handlePageRouting(request, env);

    // 处理静态资源
    if (url.pathname === '/' || url.pathname === '/index.html') {
      console.log('Serving index.html',env);
      return new Response(await env.__STATIC_CONTENT.get('index.html'), {
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

// 页面路由处理函数
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 检查用户登录状态
    const authResult = await checkUserAuthFromCookie(request, env);

    // 根据路径和登录状态进行路由
    switch (pathname) {
      case '/':
      case '/index.html':
        // 主页：需要登录才能访问
        if (authResult.isAuthenticated) {
          return await serveStaticFile('index.html');
        } else {
          // 未登录，重定向到登录页
          return Response.redirect(new URL('/login.html', request.url).toString(), 302);
        }

      case '/login.html':
        // 登录页：已登录用户重定向到主页
        if (authResult.isAuthenticated) {
          return Response.redirect(new URL('/', request.url).toString(), 302);
        } else {
          return await serveStaticFile('login.html');
        }

      case '/logout':
        // 登出处理
        return await handleLogoutPage(request, env);

      default:
        // 其他静态文件：根据文件路径提供服务
        if (pathname.startsWith('/css/') ||
            pathname.startsWith('/js/') ||
            pathname.startsWith('/images/') ||
            pathname.endsWith('.ico') ||
            pathname.endsWith('.png') ||
            pathname.endsWith('.jpg') ||
            pathname.endsWith('.svg')) {
          return await serveStaticFile(pathname.substring(1));
        }

        // 未知路径：重定向到主页
        return Response.redirect(new URL('/', request.url).toString(), 302);
    }
  } catch (error) {
    console.error('Page routing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 从Cookie检查用户认证状态
async function checkUserAuthFromCookie(request, env) {
  try {
    const authService = new AuthService(env.DB, env);

    // 从Cookie获取会话令牌
    const cookieHeader = request.headers.get('Cookie');
    let sessionToken = null;

    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      sessionToken = cookies.sessionToken;
    }

    if (!sessionToken) {
      return { isAuthenticated: false, user: null };
    }

    // 验证会话
    const sessionResult = await authService.validateSession(sessionToken);
    if (!sessionResult.valid) {
      return { isAuthenticated: false, user: null };
    }

    return {
      isAuthenticated: true,
      user: sessionResult.user,
      sessionToken: sessionToken
    };
  } catch (error) {
    console.error('Auth check from cookie failed:', error);
    return { isAuthenticated: false, user: null };
  }
}

// 解析Cookie字符串
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

// 处理登出页面
async function handleLogoutPage(request, env) {
  try {
    const authResult = await checkUserAuthFromCookie(request, env);

    if (authResult.isAuthenticated) {
      // 删除服务器端会话
      const authService = new AuthService(env.DB, env);
      await authService.logout(authResult.sessionToken);
    }

    // 创建响应，清除Cookie
    const response = Response.redirect(new URL('/login.html', request.url).toString(), 302);
    response.headers.set('Set-Cookie', 'sessionToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return Response.redirect(new URL('/login.html', request.url).toString(), 302);
  }
}

// 提供静态文件服务
async function serveStaticFile(filePath) {
  try {
    const fileContent = getStaticFileContent(filePath);
    if (!fileContent) {
      return new Response('File not found', { status: 404 });
    }

    const contentType = getContentType(filePath);
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Serve static file error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}



// 检查用户认证和权限
async function checkUserAuth(request, env) {
  try {
    const authService = new AuthService(env.DB, env);

    // 从请求头获取会话令牌
    const authHeader = request.headers.get('Authorization');
    let sessionToken = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }

    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }

    // 验证会话
    const sessionResult = await authService.validateSession(sessionToken);
    if (!sessionResult.valid) {
      return { success: false, error: sessionResult.error };
    }

    // 检查用户权限
    const permission = await authService.checkUserPermission(sessionResult.user.id);

    return {
      success: true,
      user: sessionResult.user,
      isPremium: permission.isPremium,
      canUseApi: permission.canUseApi,
      dailyUsage: permission.dailyUsage,
      dailyLimit: permission.dailyLimit
    };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

// 记录API使用
async function recordApiUsage(userId, env) {
  try {
    const authService = new AuthService(env.DB, env);
    await authService.database.recordApiUsage(userId, 1, 0, 0);
  } catch (error) {
    console.error('Failed to record API usage:', error);
  }
}

// 创建修改后的请求（使用正确的API Key）
async function createModifiedRequest(originalRequest, authResult, env) {
  try {
    const authService = new AuthService(env.DB, env);
    let apiKey;

    if (authResult.isPremium) {
      // 付费用户使用服务器API Key
      apiKey = env.SERVER_GEMINI_API_KEY;
    } else {
      // 免费用户使用自己的API Key
      apiKey = await authService.getUserApiKey(authResult.user.id);
      if (!apiKey) {
        throw new Error('User API key not found');
      }
    }

    // 创建新的请求头
    const headers = new Headers(originalRequest.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);

    // 创建新的请求
    return new Request(originalRequest.url, {
      method: originalRequest.method,
      headers: headers,
      body: originalRequest.body
    });
  } catch (error) {
    throw new Error('Failed to create modified request: ' + error.message);
  }
}

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

// 获取WebSocket的基础URL
function getWebSocketBaseUrl(env) {
  if (env && env.GEMINI_API_BASE_URL) {
    return env.GEMINI_API_BASE_URL.replace('https://', 'wss://');
  }
  return "wss://generativelanguage.googleapis.com";
}

// 获取WebSocket备用URL列表
function getWebSocketFallbackUrls(env) {
  if (env && env.GEMINI_API_FALLBACK_URLS) {
    return env.GEMINI_API_FALLBACK_URLS.split(',')
      .map(url => url.trim().replace('https://', 'wss://'));
  }
  return ["wss://generativelanguage.googleapis.com"];
}

async function handleWebSocket(request, env) {
  if (request.headers.get("Upgrade") !== "websocket") {
		return new Response("Expected WebSocket connection", { status: 400 });
	}

	const url = new URL(request.url);
	const pathAndQuery = url.pathname + url.search;
	const baseUrl = getWebSocketBaseUrl(env);
	const targetUrl = `${baseUrl}${pathAndQuery}`;

	console.log('Target URL:', targetUrl);
  
  const [client, proxy] = new WebSocketPair();
  proxy.accept();

   // 用于存储在连接建立前收到的消息
   let pendingMessages = [];
   let targetWebSocket = null;
   let connectionAttempted = false;

   // 尝试连接到目标WebSocket，支持故障转移
   const tryConnectWebSocket = async (urls, currentIndex = 0) => {
     if (currentIndex >= urls.length) {
       console.error('All WebSocket URLs failed');
       proxy.close(1006, 'All API endpoints failed. Please check your network connection or try using a proxy.');
       return null;
     }

     const wsUrl = `${urls[currentIndex]}${pathAndQuery}`;
     console.log(`Trying WebSocket URL: ${wsUrl}`);

     const ws = new WebSocket(wsUrl);

     return new Promise((resolve) => {
       const timeout = setTimeout(() => {
         console.log(`WebSocket connection timeout for: ${wsUrl}`);
         ws.close();
         resolve(null);
       }, 10000); // 10秒超时

       ws.addEventListener("open", () => {
         clearTimeout(timeout);
         console.log(`WebSocket connected successfully: ${wsUrl}`);
         resolve(ws);
       });

       ws.addEventListener("error", (error) => {
         clearTimeout(timeout);
         console.log(`WebSocket connection failed: ${wsUrl}`, error);
         resolve(null);
       });
     });
   };

   // 获取所有可能的WebSocket URL
   const fallbackUrls = getWebSocketFallbackUrls(env);
   const allUrls = [baseUrl, ...fallbackUrls.filter(url => url !== baseUrl)];

   // 尝试连接
   for (let i = 0; i < allUrls.length; i++) {
     targetWebSocket = await tryConnectWebSocket([allUrls[i]], 0);
     if (targetWebSocket) break;
   }

   if (!targetWebSocket) {
     return new Response('Failed to connect to Gemini API', { status: 503 });
   }

   console.log('Initial targetWebSocket readyState:', targetWebSocket.readyState);
 
   // 连接已经建立，发送所有待处理的消息
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
    // 检查用户认证和权限
    const authResult = await checkUserAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({
        error: authResult.error
      }), {
        status: 401,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        }
      });
    }

    // 检查API调用限制
    if (!authResult.canUseApi) {
      return new Response(JSON.stringify({
        error: 'Daily API limit exceeded'
      }), {
        status: 429,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        }
      });
    }

    // 记录API使用
    await recordApiUsage(authResult.user.id, env);

    // 创建新的请求，使用正确的API Key
    const modifiedRequest = await createModifiedRequest(request, authResult, env);

    const worker = await import('./api_proxy/worker.mjs');
    return await worker.default.fetch(modifiedRequest, env);
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