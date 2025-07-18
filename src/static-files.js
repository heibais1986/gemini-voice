 
/**
 * 静态文件内容
 * 由于Cloudflare Workers的限制，需要将静态文件内容嵌入到代码中
 */
// 读取文件内容的函数
import { readFileSync } from 'fs';
import { join } from 'path';
// 静态文件映射
const staticFiles = new Map();
// 在构建时读取文件内容
function loadStaticFile(filePath) {
  try {
    const fullPath = join(process.cwd(), 'src/static', filePath);
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.warn(`Failed to load static file: ${filePath}`);
    return null;
  }
}
// 预加载所有静态文件
function initializeStaticFiles() {
  const files = [
    'index.html',
    'login.html',
    'css/style.css',
    'css/login.css',
    'js/main.js',
    'js/login.js',
    // 添加其他需要的文件
  ];
  files.forEach(file => {
    const content = loadStaticFile(file);
    if (content) {
      staticFiles.set(file, content);
    }
  });
}
// 获取静态文件内容
export function getStaticFileContent(filePath) {
  // 移除开头的斜杠
  const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  // 如果是根路径，返回index.html
  if (normalizedPath === '' || normalizedPath === 'index.html') {
    return staticFiles.get('index.html') || getDefaultIndexHtml();
  }
  return staticFiles.get(normalizedPath) || null;
}
// 默认的index.html内容
function getDefaultIndexHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini Playground</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
</head>
<body>
    <div id="app">
        <div class="settings">
            <!-- 用户信息显示 -->
            <div id="user-info" class="user-info" style="display: none;">
                <img id="user-avatar" class="user-avatar" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggOEMxMC4yMDkxIDggMTIgNi4yMDkxNCAxMiA0QzEyIDEuNzkwODYgMTAuMjA5MSAwIDggMEM1Ljc5MDg2IDAgNCA1Ljc5MDg2IDQgNEM0IDYuMjA5MTQgNS43OTA4NiA4IDggOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik04IDEwQzQuOTA0IDEwIDIuNDAwMDEgMTIuNTA0IDIuNDAwMDEgMTUuNlYxNkgxMy42VjE1LjZDMTMuNiAxMi41MDQgMTEuMDk2IDEwIDggMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+Cg==" alt="用户头像">
                <span id="user-name" class="user-name">用户名</span>
                <span id="user-type" class="user-type">免费用户</span>
                <button id="user-menu" class="material-symbols-outlined">account_circle</button>
            </div>
            <!-- API Key 输入（仅免费用户显示） -->
            <input type="password" id="api-key" placeholder="请输入 Gemini API Key" style="display: none;" />
            <button id="config-toggle" class="material-symbols-outlined">settings</button>
        </div>
        <!-- 配置面板 -->
        <div id="config-container" class="config-container">
            <div class="config-section">
                <h3>基本设置</h3>
                <div class="config-group">
                    <label for="voice-select">语音选择:</label>
                    <select id="voice-select">
                        <option value="Puck">Puck (男声)</option>
                        <option value="Charon">Charon (男声)</option>
                        <option value="Kore">Kore (女声)</option>
                        <option value="Fenrir">Fenrir (男声)</option>
                        <option value="Aoede">Aoede (女声)</option>
                    </select>
                </div>
                <div class="config-group">
                    <label for="language-select">语言选择:</label>
                    <select id="language-select"></select>
                </div>
                <div class="config-group">
                    <label for="response-type-select">响应类型:</label>
                    <select id="response-type-select">
                        <option value="AUDIO">仅语音</option>
                        <option value="TEXT">仅文本</option>
                    </select>
                </div>
            </div>
            <div class="config-section">
                <h3>视频设置</h3>
                <div class="config-group">
                    <label for="fps-input">帧率 (FPS):</label>
                    <input type="number" id="fps-input" min="1" max="30" value="1">
                    <span class="fps-help">建议使用1-5 FPS以节省带宽</span>
                </div>
            </div>
            <div class="config-section">
                <h3>系统指令</h3>
                <div class="config-group">
                    <textarea id="system-instruction" rows="4" placeholder="输入系统指令..."></textarea>
                </div>
            </div>
            <div class="config-actions">
                <button id="apply-config" class="apply-btn">应用设置</button>
            </div>
        </div>
        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 控制按钮 -->
            <div class="controls">
                <button id="connect-button" class="control-btn primary">连接</button>
                <button id="mic-button" class="control-btn" disabled>
                    <span id="mic-icon" class="material-symbols-outlined">mic</span>
                </button>
                <button id="camera-button" class="control-btn" disabled>
                    <span id="camera-icon" class="material-symbols-outlined">videocam</span>
                </button>
                <button id="screen-button" class="control-btn" disabled>
                    <span id="screen-icon" class="material-symbols-outlined">screen_share</span>
                </button>
            </div>
            <!-- 音频可视化 -->
            <div class="audio-visualizers">
                <div class="visualizer-container">
                    <label>输入音频:</label>
                    <div id="input-audio-visualizer" class="audio-visualizer"></div>
                </div>
                <div class="visualizer-container">
                    <label>输出音频:</label>
                    <div id="audio-visualizer" class="audio-visualizer"></div>
                </div>
            </div>
            <!-- 屏幕共享容器 -->
            <div id="screen-container" class="screen-container" style="display: none;">
                <video id="screen-preview" class="screen-preview" autoplay muted></video>
                <button id="stop-video" class="stop-btn">停止共享</button>
            </div>
            <!-- 消息输入 -->
            <div class="message-input-container">
                <input type="text" id="message-input" placeholder="输入消息..." disabled>
                <button id="send-button" class="send-btn" disabled>
                    <span class="material-symbols-outlined">send</span>
                </button>
            </div>
            <!-- 日志容器 -->
            <div id="logs-container" class="logs-container"></div>
        </div>
    </div>
    <script type="module" src="/js/main.js"></script>
</body>
</html>`;
}
// 获取文件的Content-Type
export function getContentType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const types = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  };
  return types[ext] || 'text/plain';
}
// 初始化静态文件（在模块加载时执行）
// 注意：在Cloudflare Workers环境中，这个函数可能不会工作
// 因为Workers不支持文件系统访问
// 在实际部署时，需要使用构建工具将文件内容嵌入到代码中
try {
  initializeStaticFiles();
} catch (error) {
  console.warn('Static files initialization failed, using fallback content');
}
 