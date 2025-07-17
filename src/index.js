// 导入用户系统和静态文件处理模块
import { UserRoutes } from './user-system/routes.js';
import { AuthService } from './user-system/auth.js';
import { getStaticFileContent, getContentType } from './static-files.js';

export default {
  /**
   * 主入口函数，处理所有传入的请求
   * @param {Request} request - 传入的请求对象
   * @param {object} env - Cloudflare Workers 的环境变量
   * @param {object} ctx - 执行上下文
   * @returns {Response} - 返回给客户端的响应
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 处理用户系统API请求 (例如 /api/login, /api/register)
    if (url.pathname.startsWith('/api/')) {
      const userRoutes = new UserRoutes(env.DB, env);
      return await userRoutes.handleRequest(request, url.pathname);
    }

    // 2. 处理 WebSocket 连接升级请求
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env);
    }

    // 3. 处理需要认证的后端API请求 (例如 /chat/completions)
    if (url.pathname.endsWith("/chat/completions") ||
        url.pathname.endsWith("/embeddings") ||
        url.pathname.endsWith("/models")) {
      return handleAPIRequest(request, env);
    }

    // 4. 处理用户系统API请求
    if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/user/') || url.pathname.startsWith('/api/payment/')) {
      const userRoutes = new UserRoutes(env.DB, env);
      return await userRoutes.handleRequest(request, url.pathname);
    }

    // 5. 处理页面路由和静态文件请求
    return await handlePageRouting(request, env);
  },
};

// --- 页面路由和静态文件服务 ---

/**
 * 处理页面路由，根据用户登录状态和请求路径返回不同页面或重定向
 */
async function handlePageRouting(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  try {
    const authResult = await checkUserAuthFromCookie(request, env);

    switch (pathname) {
      case '/':
      case '/index.html':
        return await serveIndexPage(authResult.isAuthenticated);

      case '/login.html':
        return authResult.isAuthenticated
          ? Response.redirect(new URL('/', request.url).toString(), 302)
          : await serveStaticFile('login.html');

      case '/logout':
        return await handleLogoutPage(request, env);

      default:
        // 检查是否为静态资源路径
        if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/images/') ||
            pathname.endsWith('.ico') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.svg')) {
          return await serveStaticFile(pathname.substring(1));
        }
        // 对于未知路径，重定向到主页
        return Response.redirect(new URL('/', request.url).toString(), 302);
    }
  } catch (error) {
    console.error('Page routing error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * 从Cookie中检查用户认证状态
 */
async function checkUserAuthFromCookie(request, env) {
  try {
    console.log('🔐 checkUserAuthFromCookie() 开始执行...');
    const authService = new AuthService(env.DB, env);
    const cookieHeader = request.headers.get('Cookie');
    console.log('🍪 Cookie头部:', cookieHeader ? '存在' : '不存在');
    const sessionToken = cookieHeader ? parseCookies(cookieHeader).sessionToken : null;
    console.log('🎫 解析到的sessionToken:', sessionToken ? '存在' : '不存在');

    if (!sessionToken) {
      console.log('❌ 没有sessionToken，返回未认证状态');
      return { isAuthenticated: false, user: null };
    }

    console.log('🔍 验证sessionToken有效性...');
    const sessionResult = await authService.validateSession(sessionToken);
    console.log('✅ 验证结果:', sessionResult.valid ? '有效' : '无效');
    return {
      isAuthenticated: sessionResult.valid,
      user: sessionResult.user,
      sessionToken: sessionToken
    };
  } catch (error) {
    console.error('Auth check from cookie failed:', error);
    return { isAuthenticated: false, user: null };
  }
}

/**
 * 解析Cookie字符串为对象
 */
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

/**
 * 处理用户登出逻辑
 */
async function handleLogoutPage(request, env) {
  try {
    const authResult = await checkUserAuthFromCookie(request, env);
    if (authResult.isAuthenticated) {
      const authService = new AuthService(env.DB, env);
      await authService.logout(authResult.sessionToken);
    }
    const response = Response.redirect(new URL('/login.html', request.url).toString(), 302);
    response.headers.set('Set-Cookie', 'sessionToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return Response.redirect(new URL('/login.html', request.url).toString(), 302);
  }
}

/**
 * 提供主页服务，根据认证状态动态修改内容
 */
async function serveIndexPage(isAuthenticated) {
  try {
    console.log('🏠 serveIndexPage() 被调用，认证状态:', isAuthenticated);
    let fileContent = getStaticFileContent('index.html');
    if (fileContent === null) {
      console.error('❌ index.html 文件未找到');
      return new Response('File not found', { status: 404 });
    }

    // 如果用户未认证，在HTML中添加meta标签
    if (!isAuthenticated) {
      console.log('🔓 用户未认证，注入auth-required meta标签');
      const originalContent = fileContent;
      fileContent = fileContent.replace(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="auth-required" content="true">'
      );

      // 验证替换是否成功
      if (fileContent === originalContent) {
        console.warn('⚠️ meta标签注入可能失败，viewport meta标签未找到');
        // 尝试其他方式注入
        fileContent = fileContent.replace(
          '<head>',
          '<head>\n    <meta name="auth-required" content="true">'
        );
      } else {
        console.log('✅ meta标签注入成功');
      }
    } else {
      console.log('🔒 用户已认证，返回正常页面');
    }

    return new Response(fileContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Serve index page error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * 提供静态文件服务
 */
async function serveStaticFile(filePath) {
  try {
    const fileContent = getStaticFileContent(filePath);
    if (fileContent === null) {
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


// --- API 请求处理 ---

/**
 * 处理后端的API请求，包括认证和权限检查
 */
async function handleAPIRequest(request, env) {
  try {
    const authResult = await checkUserAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: authResult.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!authResult.canUseApi) {
      return new Response(JSON.stringify({ error: 'Daily API limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    await recordApiUsage(authResult.user.id, env);
    const modifiedRequest = await createModifiedRequest(request, authResult, env);

    // 动态导入并执行API代理
    const worker = await import('./api_proxy/worker.mjs');
    return await worker.default.fetch(modifiedRequest, env);

  } catch (error) {
    console.error('API request error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}

/**
 * 检查API请求的用户认证和权限 (基于Authorization头)
 */
async function checkUserAuth(request, env) {
  try {
    const authService = new AuthService(env.DB, env);
    const authHeader = request.headers.get('Authorization');
    const sessionToken = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : null;

    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }

    const sessionResult = await authService.validateSession(sessionToken);
    if (!sessionResult.valid) {
      return { success: false, error: sessionResult.error };
    }

    const permission = await authService.checkUserPermission(sessionResult.user.id);
    return { success: true, ...sessionResult, ...permission };
  } catch (error) {
    console.error('API auth check failed:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * 记录API使用情况
 */
async function recordApiUsage(userId, env) {
  try {
    const authService = new AuthService(env.DB, env);
    await authService.database.recordApiUsage(userId, 1, 0, 0);
  } catch (error) {
    console.error('Failed to record API usage:', error);
  }
}

/**
 * 根据用户类型（付费/免费）创建修改后的请求，使用正确的API Key
 */
async function createModifiedRequest(originalRequest, authResult, env) {
  const authService = new AuthService(env.DB, env);
  let apiKey;
  if (authResult.isPremium) {
    apiKey = env.SERVER_GEMINI_API_KEY;
  } else {
    apiKey = await authService.getUserApiKey(authResult.user.id);
    if (!apiKey) {
      throw new Error('User API key not found');
    }
  }

  const headers = new Headers(originalRequest.headers);
  headers.set('Authorization', `Bearer ${apiKey}`);

  return new Request(originalRequest.url, {
    method: originalRequest.method,
    headers: headers,
    body: originalRequest.body
  });
}


// --- WebSocket 代理 ---

/**
 * 获取WebSocket的基础URL
 */
function getWebSocketBaseUrl(env) {
  if (env && env.GEMINI_API_BASE_URL) {
    return env.GEMINI_API_BASE_URL.replace(/^http/i, 'ws');
  }
  return "wss://generativelanguage.googleapis.com";
}

/**
 * 获取WebSocket的备用URL列表
 */
function getWebSocketFallbackUrls(env) {
  if (env && env.GEMINI_API_FALLBACK_URLS) {
    return env.GEMINI_API_FALLBACK_URLS.split(',')
      .map(url => url.trim().replace(/^http/i, 'ws'));
  }
  return [];
}

/**
 * 处理WebSocket连接，并将其代理到后端的Gemini API
 */
async function handleWebSocket(request, env) {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(request.url);
  const pathAndQuery = url.pathname + url.search;

  const [client, proxy] = new WebSocketPair();
  proxy.accept();

  let pendingMessages = [];
  let targetWebSocket = null;

  const tryConnectWebSocket = async (wsUrl) => {
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

  // 尝试连接主URL和备用URL
  const connect = async () => {
    const baseUrl = getWebSocketBaseUrl(env);
    const fallbackUrls = getWebSocketFallbackUrls(env);
    const allUrls = [baseUrl, ...fallbackUrls.filter(url => url !== baseUrl)];

    for (const wsProtocolUrl of allUrls) {
      const fullWsUrl = `${wsProtocolUrl}${pathAndQuery}`;
      targetWebSocket = await tryConnectWebSocket(fullWsUrl);
      if (targetWebSocket) break;
    }

    if (!targetWebSocket) {
      proxy.close(1011, 'Failed to connect to upstream WebSocket server.');
      return;
    }

    // 处理连接成功后的事件
    targetWebSocket.addEventListener("message", event => proxy.send(event.data));
    targetWebSocket.addEventListener("close", event => proxy.close(event.code, event.reason));
    targetWebSocket.addEventListener("error", () => proxy.close(1011, "Upstream WebSocket error"));

    // 发送在连接建立前收到的消息
    pendingMessages.forEach(message => targetWebSocket.send(message));
    pendingMessages = [];
  };

  connect();

  proxy.addEventListener("message", event => {
    if (targetWebSocket && targetWebSocket.readyState === WebSocket.OPEN) {
      targetWebSocket.send(event.data);
    } else {
      pendingMessages.push(event.data);
    }
  });

  proxy.addEventListener("close", event => {
    if (targetWebSocket && targetWebSocket.readyState === WebSocket.OPEN) {
      targetWebSocket.close(event.code, event.reason);
    }
  });

  proxy.addEventListener("error", () => {
     if (targetWebSocket && targetWebSocket.readyState === WebSocket.OPEN) {
      targetWebSocket.close(1011, "Client WebSocket error");
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
