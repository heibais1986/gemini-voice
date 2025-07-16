 
const getContentType = (path: string): string => {
// 环境变量接口，兼容Cloudflare Worker和Deno
interface Env {
  GEMINI_API_BASE_URL?: string;
  GEMINI_API_FALLBACK_URLS?: string;
}
// 获取环境变量，支持Deno环境
const getEnv = (): Env => {
  return {
    GEMINI_API_BASE_URL: Deno.env.get("GEMINI_API_BASE_URL") || "https://generativelanguage.googleapis.com",
    GEMINI_API_FALLBACK_URLS: Deno.env.get("GEMINI_API_FALLBACK_URLS") || "https://generativelanguage.googleapis.com"
  };
};
// 获取WebSocket的基础URL
const getWebSocketBaseUrl = (env: Env): string => {
  if (env.GEMINI_API_BASE_URL) {
    return env.GEMINI_API_BASE_URL.replace('https://', 'wss://');
  }
  return "wss://generativelanguage.googleapis.com";
};
// 获取WebSocket备用URL列表
const getWebSocketFallbackUrls = (env: Env): string[] => {
  if (env.GEMINI_API_FALLBACK_URLS) {
    return env.GEMINI_API_FALLBACK_URLS.split(',')
      .map(url => url.trim().replace('https://', 'wss://'));
  }
  return ["wss://generativelanguage.googleapis.com"];
};
const getContentType = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
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
};
  const ext = path.split('.').pop()?.toLowerCase() || '';
async function handleWebSocket(req: Request): Promise<Response> {
  const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
  const url = new URL(req.url);
  const pathAndQuery = url.pathname + url.search;
  const env = getEnv();
  const baseUrl = getWebSocketBaseUrl(env);
  console.log('Base URL:', baseUrl);
  const pendingMessages: string[] = [];
  let targetWs: WebSocket | null = null;
  // 尝试连接到目标WebSocket，支持故障转移
  const tryConnectWebSocket = async (wsUrl: string): Promise<WebSocket | null> => {
    console.log(`Trying WebSocket URL: ${wsUrl}`);
    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        console.log(`WebSocket connection timeout for: ${wsUrl}`);
        ws.close();
        resolve(null);
      }, 10000); // 10秒超时
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log(`WebSocket connected successfully: ${wsUrl}`);
        resolve(ws);
      };
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.log(`WebSocket connection failed: ${wsUrl}`, error);
        resolve(null);
      };
    });
  };
  const types: Record<string, string> = {
  // 获取所有可能的WebSocket URL
  const fallbackUrls = getWebSocketFallbackUrls(env);
  const allUrls = [baseUrl, ...fallbackUrls.filter(url => url !== baseUrl)];
  // 尝试连接
  for (const wsBaseUrl of allUrls) {
    const wsUrl = `${wsBaseUrl}${pathAndQuery}`;
    targetWs = await tryConnectWebSocket(wsUrl);
    if (targetWs) break;
  }
  if (!targetWs) {
    console.error('All WebSocket URLs failed');
    clientWs.close(1006, 'All API endpoints failed. Please check your network connection or try using a proxy.');
    return response;
  }
  // 连接已经建立，发送所有待处理的消息
  console.log(`Processing ${pendingMessages.length} pending messages`);
  pendingMessages.forEach(msg => targetWs!.send(msg));
  pendingMessages.length = 0;
  clientWs.onmessage = (event) => {
    console.log('Client message received');
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(event.data);
    } else {
      pendingMessages.push(event.data);
    }
  };
    'js': 'application/javascript',
    'css': 'text/css',
  clientWs.onclose = (event) => {
    console.log('Client connection closed');
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.close(1000, event.reason);
    }
  };
    'html': 'text/html',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
async function handleAPIRequest(req: Request): Promise<Response> {
  try {
    const worker = await import('./api_proxy/worker.mjs');
    const env = getEnv();
    return await worker.default.fetch(req, env);
  } catch (error) {
    console.error('API request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStatus = (error as { status?: number }).status || 500;
    return new Response(errorMessage, {
      status: errorStatus,
      headers: {
        'content-type': 'text/plain;charset=UTF-8',
      }
    });
  }
}
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  };
  return types[ext] || 'text/plain';
};
async function handleWebSocket(req: Request): Promise<Response> {
  const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
  const url = new URL(req.url);
  const targetUrl = `wss://generativelanguage.googleapis.com${url.pathname}${url.search}`;
  console.log('Target URL:', targetUrl);
  const pendingMessages: string[] = [];
  const targetWs = new WebSocket(targetUrl);
  targetWs.onopen = () => {
    console.log('Connected to Gemini');
    pendingMessages.forEach(msg => targetWs.send(msg));
    pendingMessages.length = 0;
  };
  clientWs.onmessage = (event) => {
    console.log('Client message received');
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(event.data);
    } else {
      pendingMessages.push(event.data);
    }
  };
  targetWs.onmessage = (event) => {
    console.log('Gemini message received');
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(event.data);
    }
  };
  clientWs.onclose = (event) => {
    console.log('Client connection closed');
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.close(1000, event.reason);
    }
  };
  targetWs.onclose = (event) => {
    console.log('Gemini connection closed');
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(event.code, event.reason);
    }
  };
  targetWs.onerror = (error) => {
    console.error('Gemini WebSocket error:', error);
  };
  return response;
}
async function handleAPIRequest(req: Request): Promise<Response> {
  try {
    const worker = await import('./api_proxy/worker.mjs');
    return await worker.default.fetch(req);
  } catch (error) {
    console.error('API request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStatus = (error as { status?: number }).status || 500;
    return new Response(errorMessage, {
      status: errorStatus,
      headers: {
        'content-type': 'text/plain;charset=UTF-8',
      }
    });
  }
}
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  console.log('Request URL:', req.url);
  // WebSocket 处理
  if (req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
    return handleWebSocket(req);
  }
  if (url.pathname.endsWith("/chat/completions") ||
      url.pathname.endsWith("/embeddings") ||
      url.pathname.endsWith("/models")) {
    return handleAPIRequest(req);
  }
  // 静态文件处理
  try {
    let filePath = url.pathname;
    if (filePath === '/' || filePath === '/index.html') {
      filePath = '/index.html';
    }
    const fullPath = `${Deno.cwd()}/src/static${filePath}`;
    const file = await Deno.readFile(fullPath);
    const contentType = getContentType(filePath);
    return new Response(file, {
      headers: {
        'content-type': `${contentType};charset=UTF-8`,
      },
    });
  } catch (e) {
    console.error('Error details:', e);
    return new Response('Not Found', { 
      status: 404,
      headers: {
        'content-type': 'text/plain;charset=UTF-8',
      }
    });
  }
}
Deno.serve(handleRequest); 
Deno.serve(handleRequest); 
 