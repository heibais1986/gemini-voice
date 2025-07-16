import { MultimodalLiveClient } from './core/websocket-client.js';
// 用户认证管理
class UserAuthManager {
    constructor() {
        this.sessionToken = this.getSessionTokenFromCookie() || localStorage.getItem('sessionToken');
        this.currentUser = null;
        this.isAuthenticated = false;
    }
    // 从Cookie获取会话令牌
    getSessionTokenFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionToken') {
                return decodeURIComponent(value);
            }
        }
        return null;
    }
    // 设置会话令牌到Cookie
    setSessionTokenToCookie(token, expiresAt) {
        const expires = new Date(expiresAt);
        document.cookie = `sessionToken=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; secure; samesite=strict`;
        localStorage.setItem('sessionToken', token);
    }
    // 清除会话令牌
    clearSessionToken() {
        document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('sessionToken');
        this.sessionToken = null;
    }
    async checkAuth() {
        if (!this.sessionToken) {
            this.redirectToLogin();
            return false;
        }
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateUserUI();
                return true;
            } else {
                this.clearSessionToken();
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }
    // 重定向到登录页
    redirectToLogin() {
        window.location.href = '/login.html';
    }
    // 登出处理
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        this.clearSessionToken();
        this.redirectToLogin();
    }
    updateUserUI() {
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userType = document.getElementById('user-type');
        const apiKeyInput = document.getElementById('api-key');
        if (this.currentUser) {
            userInfo.style.display = 'flex';
            userName.textContent = this.currentUser.username || '用户';
            userType.textContent = this.currentUser.user_type === 'premium' ? '付费用户' : '免费用户';
            if (this.currentUser.avatar_url) {
                userAvatar.src = this.currentUser.avatar_url;
            }
            // 付费用户隐藏API Key输入框
            if (this.currentUser.user_type === 'premium') {
                apiKeyInput.style.display = 'none';
            } else {
                apiKeyInput.style.display = 'block';
            }
        }
    }
    getAuthHeaders() {
        return this.sessionToken ? {
            'Authorization': `Bearer ${this.sessionToken}`
        } : {};
    }
}
// 创建用户认证管理器实例
const userAuth = new UserAuthManager();
// DOM Elements
const logsContainer = document.getElementById('logs-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const micIcon = document.getElementById('mic-icon');
const audioVisualizer = document.getElementById('audio-visualizer');
const connectButton = document.getElementById('connect-button');
const cameraButton = document.getElementById('camera-button');
const cameraIcon = document.getElementById('camera-icon');
const stopVideoButton = document.getElementById('stop-video');
const screenButton = document.getElementById('screen-button');
const screenIcon = document.getElementById('screen-icon');
const screenContainer = document.getElementById('screen-container');
const screenPreview = document.getElementById('screen-preview');
const inputAudioVisualizer = document.getElementById('input-audio-visualizer');
const apiKeyInput = document.getElementById('api-key');
const voiceSelect = document.getElementById('voice-select');
const languageSelect = document.getElementById('language-select');
const fpsInput = document.getElementById('fps-input');
const configToggle = document.getElementById('config-toggle');
const configContainer = document.getElementById('config-container');
const systemInstructionInput = document.getElementById('system-instruction');
systemInstructionInput.value = CONFIG.SYSTEM_INSTRUCTION.TEXT;
const applyConfigButton = document.getElementById('apply-config');
const responseTypeSelect = document.getElementById('response-type-select');
// 用户认证管理
class UserAuthManager {
    constructor() {
        this.sessionToken = this.getSessionTokenFromCookie() || localStorage.getItem('sessionToken');
        this.currentUser = null;
        this.isAuthenticated = false;
    }
    // 从Cookie获取会话令牌
    getSessionTokenFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionToken') {
                return decodeURIComponent(value);
            }
        }
        return null;
    }
    // 设置会话令牌到Cookie
    setSessionTokenToCookie(token, expiresAt) {
        const expires = new Date(expiresAt);
        document.cookie = `sessionToken=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; secure; samesite=strict`;
        localStorage.setItem('sessionToken', token);
    }
    // 清除会话令牌
    clearSessionToken() {
        document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('sessionToken');
        this.sessionToken = null;
    }
    async checkAuth() {
        if (!this.sessionToken) {
            this.redirectToLogin();
            return false;
        }
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateUserUI();
                return true;
            } else {
                this.clearSessionToken();
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }
    // 重定向到登录页
    redirectToLogin() {
        window.location.href = '/login.html';
    }
    // 登出处理
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        this.clearSessionToken();
        this.redirectToLogin();
    }
// 用户认证管理
class UserAuthManager {
    constructor() {
        this.sessionToken = this.getSessionTokenFromCookie() || localStorage.getItem('sessionToken');
        this.currentUser = null;
        this.isAuthenticated = false;
    }
    // 从Cookie获取会话令牌
    getSessionTokenFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionToken') {
                return decodeURIComponent(value);
            }
        }
        return null;
    }
    // 设置会话令牌到Cookie
    setSessionTokenToCookie(token, expiresAt) {
        const expires = new Date(expiresAt);
        document.cookie = `sessionToken=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; secure; samesite=strict`;
        localStorage.setItem('sessionToken', token);
    }
    // 清除会话令牌
    clearSessionToken() {
        document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('sessionToken');
        this.sessionToken = null;
// 检查页面元素是否存在（某些页面可能没有这些元素）
const goLoginBtn = document.getElementById('go-login');
if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
    });
}
// 用户菜单事件处理
document.getElementById('user-menu').addEventListener('click', () => {
    // 显示用户菜单选项
    const confirmed = confirm('是否要退出登录？');
    if (confirmed) {
        userAuth.logout();
    }
});
    }
    if (isAuthenticated) {
        // 用户已登录，初始化页面
        console.log('User authenticated:', userAuth.currentUser);
        // 如果是付费用户，自动填充API Key（这里使用会话令牌）
        if (userAuth.currentUser && userAuth.currentUser.user_type === 'premium') {
            // 付费用户不需要输入API Key，使用会话令牌作为标识
            apiKeyInput.value = 'premium_user_token';
        }
    }
    // 如果未认证，checkAuth方法会自动重定向到登录页
});
    async checkAuth() {
        if (!this.sessionToken) {
            this.redirectToLogin();
            return false;
        }
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateUserUI();
                return true;
            } else {
                this.clearSessionToken();
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }
    // 重定向到登录页
    redirectToLogin() {
        window.location.href = '/login.html';
    }
    // 登出处理
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        this.clearSessionToken();
        this.redirectToLogin();
    }
    updateUserUI() {
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userType = document.getElementById('user-type');
        const apiKeyInput = document.getElementById('api-key');
        if (this.currentUser) {
            userInfo.style.display = 'flex';
            userName.textContent = this.currentUser.username || '用户';
            userType.textContent = this.currentUser.user_type === 'premium' ? '付费用户' : '免费用户';
            if (this.currentUser.avatar_url) {
                userAvatar.src = this.currentUser.avatar_url;
            }
            // 付费用户隐藏API Key输入框
            if (this.currentUser.user_type === 'premium') {
                apiKeyInput.style.display = 'none';
            } else {
                apiKeyInput.style.display = 'block';
            }
        }
    }
    getAuthHeaders() {
        return this.sessionToken ? {
            'Authorization': `Bearer ${this.sessionToken}`
        } : {};
    }
}
// 创建用户认证管理器实例
const userAuth = new UserAuthManager();
// DOM Elements
const logsContainer = document.getElementById('logs-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const micIcon = document.getElementById('mic-icon');
const audioVisualizer = document.getElementById('audio-visualizer');
const connectButton = document.getElementById('connect-button');
const cameraButton = document.getElementById('camera-button');
const cameraIcon = document.getElementById('camera-icon');
const stopVideoButton = document.getElementById('stop-video');
const screenButton = document.getElementById('screen-button');
const screenIcon = document.getElementById('screen-icon');
const screenContainer = document.getElementById('screen-container');
const screenPreview = document.getElementById('screen-preview');
const inputAudioVisualizer = document.getElementById('input-audio-visualizer');
const apiKeyInput = document.getElementById('api-key');
const voiceSelect = document.getElementById('voice-select');
const languageSelect = document.getElementById('language-select');
const fpsInput = document.getElementById('fps-input');
const configToggle = document.getElementById('config-toggle');
const configContainer = document.getElementById('config-container');
const systemInstructionInput = document.getElementById('system-instruction');
systemInstructionInput.value = CONFIG.SYSTEM_INSTRUCTION.TEXT;
const applyConfigButton = document.getElementById('apply-config');
const responseTypeSelect = document.getElementById('response-type-select');
import { AudioStreamer } from './audio/audio-streamer.js';
import { AudioRecorder } from './audio/audio-recorder.js';
// 用户认证管理
class UserAuthManager {
    constructor() {
        this.sessionToken = localStorage.getItem('sessionToken');
        this.currentUser = null;
        this.isAuthenticated = false;
    }
    async checkAuth() {
        if (!this.sessionToken) {
            this.showLoginOverlay();
            return false;
        }
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateUserUI();
                return true;
            } else {
                localStorage.removeItem('sessionToken');
                this.sessionToken = null;
                this.showLoginOverlay();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLoginOverlay();
            return false;
        }
    }
    showLoginOverlay() {
        document.getElementById('login-overlay').style.display = 'flex';
    }
    hideLoginOverlay() {
        document.getElementById('login-overlay').style.display = 'none';
    }
    updateUserUI() {
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userType = document.getElementById('user-type');
        const apiKeyInput = document.getElementById('api-key');
        if (this.currentUser) {
            userInfo.style.display = 'flex';
            userName.textContent = this.currentUser.username || '用户';
            userType.textContent = this.currentUser.user_type === 'premium' ? '付费用户' : '免费用户';
            if (this.currentUser.avatar_url) {
                userAvatar.src = this.currentUser.avatar_url;
            }
            // 付费用户隐藏API Key输入框
            if (this.currentUser.user_type === 'premium') {
                apiKeyInput.style.display = 'none';
            } else {
                apiKeyInput.style.display = 'block';
            }
        }
    }
    getAuthHeaders() {
        return this.sessionToken ? {
            'Authorization': `Bearer ${this.sessionToken}`
        } : {};
    }
}
// 创建用户认证管理器实例
const userAuth = new UserAuthManager();
// DOM Elements
const logsContainer = document.getElementById('logs-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const micIcon = document.getElementById('mic-icon');
const audioVisualizer = document.getElementById('audio-visualizer');
const connectButton = document.getElementById('connect-button');
const cameraButton = document.getElementById('camera-button');
const cameraIcon = document.getElementById('camera-icon');
const stopVideoButton = document.getElementById('stop-video');
const screenButton = document.getElementById('screen-button');
const screenIcon = document.getElementById('screen-icon');
const screenContainer = document.getElementById('screen-container');
const screenPreview = document.getElementById('screen-preview');
const inputAudioVisualizer = document.getElementById('input-audio-visualizer');
const apiKeyInput = document.getElementById('api-key');
const voiceSelect = document.getElementById('voice-select');
const languageSelect = document.getElementById('language-select');
const fpsInput = document.getElementById('fps-input');
const configToggle = document.getElementById('config-toggle');
const configContainer = document.getElementById('config-container');
const systemInstructionInput = document.getElementById('system-instruction');
systemInstructionInput.value = CONFIG.SYSTEM_INSTRUCTION.TEXT;
const applyConfigButton = document.getElementById('apply-config');
const responseTypeSelect = document.getElementById('response-type-select');
import { CONFIG } from './config/config.js';
import { Logger } from './utils/logger.js';
import { VideoManager } from './video/video-manager.js';
import { ScreenRecorder } from './video/screen-recorder.js';
import { languages } from './language-selector.js';
/**
 * @fileoverview Main entry point for the application.
 * Initializes and manages the UI, audio, video, and WebSocket interactions.
 */
// DOM Elements
const logsContainer = document.getElementById('logs-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const micIcon = document.getElementById('mic-icon');
const audioVisualizer = document.getElementById('audio-visualizer');
const connectButton = document.getElementById('connect-button');
const cameraButton = document.getElementById('camera-button');
const cameraIcon = document.getElementById('camera-icon');
const stopVideoButton = document.getElementById('stop-video');
const screenButton = document.getElementById('screen-button');
const screenIcon = document.getElementById('screen-icon');
const screenContainer = document.getElementById('screen-container');
const screenPreview = document.getElementById('screen-preview');
const inputAudioVisualizer = document.getElementById('input-audio-visualizer');
const apiKeyInput = document.getElementById('api-key');
const voiceSelect = document.getElementById('voice-select');
const languageSelect = document.getElementById('language-select');
const fpsInput = document.getElementById('fps-input');
const configToggle = document.getElementById('config-toggle');
const configContainer = document.getElementById('config-container');
const systemInstructionInput = document.getElementById('system-instruction');
systemInstructionInput.value = CONFIG.SYSTEM_INSTRUCTION.TEXT;
const applyConfigButton = document.getElementById('apply-config');
const responseTypeSelect = document.getElementById('response-type-select');
// 加载保存的值或使用默认值
const savedApiKey = localStorage.getItem('gemini_api_key');
const savedVoice = localStorage.getItem('gemini_voice') || CONFIG.DEFAULTS.VOICE;
const savedLanguage = localStorage.getItem('gemini_language') || CONFIG.DEFAULTS.LANGUAGE;
const savedFPS = localStorage.getItem('video_fps');
const savedSystemInstruction = localStorage.getItem('system_instruction') || CONFIG.SYSTEM_INSTRUCTION.TEXT;
const savedResponseType = localStorage.getItem('response_type') || CONFIG.DEFAULTS.RESPONSE_TYPE;
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
}
voiceSelect.value = savedVoice;
languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    languageSelect.appendChild(option);
});
languageSelect.value = savedLanguage;
responseTypeSelect.value = savedResponseType;
if (savedFPS) {
    fpsInput.value = savedFPS;
}
systemInstructionInput.value = savedSystemInstruction;
CONFIG.SYSTEM_INSTRUCTION.TEXT = savedSystemInstruction;
// Handle configuration panel toggle
configToggle.addEventListener('click', () => {
    configContainer.classList.toggle('active');
    configToggle.classList.toggle('active');
});
applyConfigButton.addEventListener('click', () => {
    // 保存设置到localStorage
    localStorage.setItem('gemini_api_key', apiKeyInput.value);
    localStorage.setItem('gemini_voice', voiceSelect.value);
    localStorage.setItem('gemini_language', languageSelect.value);
    localStorage.setItem('system_instruction', systemInstructionInput.value);
    localStorage.setItem('response_type', responseTypeSelect.value);
    localStorage.setItem('video_fps', fpsInput.value);
    // 更新配置
    CONFIG.SYSTEM_INSTRUCTION.TEXT = systemInstructionInput.value;
    // 关闭配置面板
    configContainer.classList.remove('active');
    configToggle.classList.remove('active');
});
// State variables
let isRecording = false;
let audioStreamer = null;
let audioCtx = null;
let isConnected = false;
let audioRecorder = null;
let isVideoActive = false;
let videoManager = null;
let isScreenSharing = false;
let screenRecorder = null;
let isUsingTool = false;
// Multimodal Client
const client = new MultimodalLiveClient();
/**
 * Logs a message to the UI.
 * @param {string} message - The message to log.
 * @param {string} [type='system'] - The type of the message (system, user, ai).
 */
function logMessage(message, type = 'system') {
    // 只显示用户和AI的消息，过滤掉系统消息
    if (type !== 'user' && type !== 'ai') {
        return;
    }
    const logEntry = document.createElement('div');
    logEntry.classList.add('log-entry', type);
    const emoji = document.createElement('span');
    emoji.classList.add('emoji');
    switch (type) {
        case 'user':
            emoji.textContent = '🫵';
            break;
        case 'ai':
            emoji.textContent = '🤖';
            break;
    }
    logEntry.appendChild(emoji);
    const messageText = document.createElement('span');
    messageText.textContent = message;
    logEntry.appendChild(messageText);
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}
// 添加一个专门的系统日志函数，用于开发调试（不显示在UI上）
function logSystem(message) {
    console.log(`[System] ${message}`);
}
/**
 * Updates the microphone icon based on the recording state.
 */
function updateMicIcon() {
    micIcon.textContent = isRecording ? 'mic_off' : 'mic';
    micButton.style.backgroundColor = isRecording ? '#ea4335' : '#4285f4';
}
/**
 * Updates the audio visualizer based on the audio volume.
 * @param {number} volume - The audio volume (0.0 to 1.0).
 * @param {boolean} [isInput=false] - Whether the visualizer is for input audio.
 */
function updateAudioVisualizer(volume, isInput = false) {
    const visualizer = isInput ? inputAudioVisualizer : audioVisualizer;
    const audioBar = visualizer.querySelector('.audio-bar') || document.createElement('div');
    if (!visualizer.contains(audioBar)) {
        audioBar.classList.add('audio-bar');
        visualizer.appendChild(audioBar);
    }
    audioBar.style.width = `${volume * 100}%`;
    if (volume > 0) {
        audioBar.classList.add('active');
    } else {
        audioBar.classList.remove('active');
    }
}
/**
 * Initializes the audio context and streamer if not already initialized.
 * @returns {Promise<AudioStreamer>} The audio streamer instance.
 */
async function ensureAudioInitialized() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (!audioStreamer) {
        audioStreamer = new AudioStreamer(audioCtx);
        await audioStreamer.addWorklet('vumeter-out', 'js/audio/worklets/vol-meter.js', (ev) => {
            updateAudioVisualizer(ev.data.volume);
        });
    }
    return audioStreamer;
}
/**
 * Handles the microphone toggle. Starts or stops audio recording.
 * @returns {Promise<void>}
 */
async function handleMicToggle() {
    if (!isRecording) {
        try {
            await ensureAudioInitialized();
            audioRecorder = new AudioRecorder();
            const inputAnalyser = audioCtx.createAnalyser();
            inputAnalyser.fftSize = 256;
            const inputDataArray = new Uint8Array(inputAnalyser.frequencyBinCount);
            await audioRecorder.start((base64Data) => {
                if (isUsingTool) {
                    client.sendRealtimeInput([{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data,
                        interrupt: true
                    }]);
                } else {
                    client.sendRealtimeInput([{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data
                    }]);
                }
                inputAnalyser.getByteFrequencyData(inputDataArray);
                const inputVolume = Math.max(...inputDataArray) / 255;
                updateAudioVisualizer(inputVolume, true);
            });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(inputAnalyser);
            await audioStreamer.resume();
            isRecording = true;
            Logger.info('Microphone started');
            logSystem('Microphone started');
            updateMicIcon();
        } catch (error) {
            Logger.error('Microphone error:', error);
            logSystem(`Microphone error: ${error.message}`);
            isRecording = false;
            updateMicIcon();
        }
    } else {
        if (audioRecorder && isRecording) {
            audioRecorder.stop();
        }
        isRecording = false;
        logSystem('Microphone stopped');
        updateMicIcon();
        updateAudioVisualizer(0, true);
    }
}
/**
 * Resumes the audio context if it's suspended.
 * @returns {Promise<void>}
 */
async function resumeAudioContext() {
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
}
/**
 * Connects to the WebSocket server.
 * @returns {Promise<void>}
 */
async function connectToWebsocket() {
    if (!apiKeyInput.value) {
        alert('请输入 API Key');
        return;
    }
    // Save values to localStorage
    localStorage.setItem('gemini_api_key', apiKeyInput.value);
    localStorage.setItem('gemini_voice', voiceSelect.value);
    localStorage.setItem('gemini_language', languageSelect.value);
    localStorage.setItem('system_instruction', systemInstructionInput.value);
    localStorage.setItem('response_type', responseTypeSelect.value);
    // 获取当前北京时间
    const beijingTime = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
    });
    // 在系统指令中添加当前时间信息
    const systemInstructionWithTime = `${systemInstructionInput.value}\n\n当前北京时间：${beijingTime}`;
    const config = {
        model: CONFIG.API.MODEL_NAME,
        generationConfig: {
            responseModalities: responseTypeSelect.value,
            speechConfig: {
                languageCode: languageSelect.value,
                voiceConfig: { 
                    prebuiltVoiceConfig: { 
                        voiceName: voiceSelect.value
                    }
                }
            },
        },
        systemInstruction: {
            parts: [{
                text: systemInstructionWithTime
            }],
        }
    };  
    try {
        await client.connect(config,apiKeyInput.value);
        isConnected = true;
        await resumeAudioContext();
        connectButton.textContent = '断开连接';
        connectButton.classList.add('connected');
        messageInput.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false;
        cameraButton.disabled = false;
        screenButton.disabled = false;
        logSystem('Connected to Gemini Multimodal Live API');
    } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        Logger.error('Connection error:', error);
        logSystem(`Connection error: ${errorMessage}`);
        alert(`连接失败: ${errorMessage}`);
        isConnected = false;
        connectButton.textContent = '连接';
        connectButton.classList.remove('connected');
        messageInput.disabled = true;
        sendButton.disabled = true;
        micButton.disabled = true;
        cameraButton.disabled = true;
        screenButton.disabled = true;
    }
}
/**
 * Disconnects from the WebSocket server.
 */
function disconnectFromWebsocket() {
    client.disconnect();
    isConnected = false;
    if (audioStreamer) {
        audioStreamer.stop();
        if (audioRecorder) {
            audioRecorder.stop();
            audioRecorder = null;
        }
        isRecording = false;
        updateMicIcon();
    }
    connectButton.textContent = '连接';
    connectButton.classList.remove('connected');
    messageInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;
    cameraButton.disabled = true;
    screenButton.disabled = true;
    logSystem('Disconnected from server');
    if (videoManager) {
        stopVideo();
    }
    if (screenRecorder) {
        stopScreenSharing();
    }
}
/**
 * Handles sending a text message.
 */
function handleSendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        logMessage(message, 'user');
        client.send({ text: message });
        messageInput.value = '';
    }
}
// Event Listeners
client.on('open', () => {
    logSystem('WebSocket connection opened');
});
client.on('log', (log) => {
    logSystem(`${log.type}: ${JSON.stringify(log.message)}`);
});
client.on('close', (event) => {
    logSystem(`WebSocket connection closed (code ${event.code})`);
});
client.on('audio', async (data) => {
    try {
        await resumeAudioContext();
        const streamer = await ensureAudioInitialized();
        streamer.addPCM16(new Uint8Array(data));
    } catch (error) {
        logSystem(`Error processing audio: ${error.message}`);
    }
});
client.on('content', (data) => {
    if (data.modelTurn) {
        if (data.modelTurn.parts.some(part => part.functionCall)) {
            isUsingTool = true;
            Logger.info('Model is using a tool');
        } else if (data.modelTurn.parts.some(part => part.functionResponse)) {
            isUsingTool = false;
            Logger.info('Tool usage completed');
        }
        const text = data.modelTurn.parts.map(part => part.text).join('');
        if (text) {
            logMessage(text, 'ai');
        }
    }
});
client.on('interrupted', () => {
    audioStreamer?.stop();
    isUsingTool = false;
    Logger.info('Model interrupted');
    logSystem('Model interrupted');
});
client.on('setupcomplete', () => {
    logSystem('Setup complete');
});
client.on('turncomplete', () => {
    isUsingTool = false;
    logSystem('Turn complete');
});
client.on('error', (error) => {
    if (error instanceof ApplicationError) {
        Logger.error(`Application error: ${error.message}`, error);
    } else {
        Logger.error('Unexpected error', error);
    }
    logSystem(`Error: ${error.message}`);
});
client.on('message', (message) => {
    if (message.error) {
        Logger.error('Server error:', message.error);
        logSystem(`Server error: ${message.error}`);
    }
});
client.on('reconnecting', () => {
    logSystem('Connection lost, reconnecting...');
});
client.on('reconnected', () => {
    logSystem('Reconnected successfully');
});
client.on('reconnectFailed', (error) => {
    logSystem(`Reconnection failed: ${error.message}`);
    disconnectFromWebsocket();
});
sendButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
});
micButton.addEventListener('click', handleMicToggle);
connectButton.addEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocket();
    }
});
messageInput.disabled = true;
sendButton.disabled = true;
micButton.disabled = true;
connectButton.textContent = 'Connect';
/**
 * Handles the video toggle. Starts or stops video streaming.
 * @returns {Promise<void>}
 */
async function handleVideoToggle() {
    Logger.info('Video toggle clicked, current state:', { isVideoActive, isConnected });
    localStorage.setItem('video_fps', fpsInput.value);
    if (!isVideoActive) {
        try {
            Logger.info('Attempting to start video');
            if (!videoManager) {
                videoManager = new VideoManager();
            }
            await videoManager.start(fpsInput.value,(frameData) => {
                if (isConnected) {
                    client.sendRealtimeInput([frameData]);
                }
            });
            isVideoActive = true;
            cameraIcon.textContent = 'videocam_off';
            cameraButton.classList.add('active');
            Logger.info('Camera started successfully');
            logSystem('Camera started');
        } catch (error) {
            Logger.error('Camera error:', error);
            logSystem(`Camera error: ${error.message}`);
            alert(`摄像头错误: ${error.message}`);
            isVideoActive = false;
            videoManager = null;
            cameraIcon.textContent = 'videocam';
            cameraButton.classList.remove('active');
        }
    } else {
        Logger.info('Stopping video');
        stopVideo();
    }
}
/**
 * Stops the video streaming.
 */
function stopVideo() {
    if (videoManager) {
        videoManager.stop();
        videoManager = null;
    }
    isVideoActive = false;
    cameraIcon.textContent = 'videocam';
    cameraButton.classList.remove('active');
    logMessage('Camera stopped', 'system');
}
cameraButton.addEventListener('click', handleVideoToggle);
stopVideoButton.addEventListener('click', stopVideo);
cameraButton.disabled = true;
/**
 * Handles the screen share toggle. Starts or stops screen sharing.
 * @returns {Promise<void>}
 */
async function handleScreenShare() {
    if (!isScreenSharing) {
        try {
            screenContainer.style.display = 'block';
            screenRecorder = new ScreenRecorder();
            await screenRecorder.start(screenPreview, (frameData) => {
                if (isConnected) {
                    client.sendRealtimeInput([{
                        mimeType: "image/jpeg",
                        data: frameData
                    }]);
                }
            });
            isScreenSharing = true;
            screenIcon.textContent = 'stop_screen_share';
            screenButton.classList.add('active');
            Logger.info('Screen sharing started');
            logMessage('Screen sharing started', 'system');
        } catch (error) {
            Logger.error('Screen sharing error:', error);
            logMessage(`Error: ${error.message}`, 'system');
            isScreenSharing = false;
            screenIcon.textContent = 'screen_share';
            screenButton.classList.remove('active');
            screenContainer.style.display = 'none';
        }
    } else {
        stopScreenSharing();
    }
}
/**
 * Stops the screen sharing.
 */
function stopScreenSharing() {
    if (screenRecorder) {
        screenRecorder.stop();
        screenRecorder = null;
    }
    isScreenSharing = false;
    screenIcon.textContent = 'screen_share';
    screenButton.classList.remove('active');
    screenContainer.style.display = 'none';
    logMessage('Screen sharing stopped', 'system');
}
screenButton.addEventListener('click', handleScreenShare);
screenButton.disabled = true;
screenButton.addEventListener('click', handleScreenShare);
screenButton.disabled = true;
// 登录相关事件处理
document.getElementById('go-login').addEventListener('click', () => {
    window.location.href = '/login.html';
});
// 用户菜单事件处理
document.getElementById('user-menu').addEventListener('click', () => {
    // 这里可以添加用户菜单功能，比如显示下拉菜单
    window.location.href = '/login.html';
});
// 页面加载时检查用户认证状态
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await userAuth.checkAuth();
    if (isAuthenticated) {
        // 用户已登录，隐藏登录遮罩
        userAuth.hideLoginOverlay();
        // 如果是付费用户，自动填充API Key（这里使用会话令牌）
        if (userAuth.currentUser && userAuth.currentUser.user_type === 'premium') {
            // 付费用户不需要输入API Key，使用会话令牌作为标识
            apiKeyInput.value = 'premium_user_token';
        }
    } else {
        // 用户未登录，显示登录遮罩
        userAuth.showLoginOverlay();
    }
});
// 修改连接函数，支持用户认证
async function connectToWebsocketWithAuth() {
    // 检查用户认证状态
    if (!userAuth.isAuthenticated) {
        alert('请先登录');
        userAuth.showLoginOverlay();
        return;
    }
    // 付费用户不需要输入API Key
    if (userAuth.currentUser.user_type === 'premium') {
        apiKeyInput.value = 'premium_user_token';
    } else if (!apiKeyInput.value) {
        alert('请输入 API Key');
        return;
    }
    // 其余逻辑与原来的connectToWebsocket相同
    await connectToWebsocket();
}
// 替换原来的连接按钮事件处理
connectButton.removeEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocket();
    }
});
connectButton.addEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocketWithAuth();
    }
});
screenButton.addEventListener('click', handleScreenShare);
screenButton.disabled = true;
// 检查页面元素是否存在（某些页面可能没有这些元素）
const goLoginBtn = document.getElementById('go-login');
if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
    });
}
// 用户菜单事件处理
document.getElementById('user-menu').addEventListener('click', () => {
    // 显示用户菜单选项
    const confirmed = confirm('是否要退出登录？');
    if (confirmed) {
        userAuth.logout();
    }
});
// 页面加载时检查用户认证状态
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await userAuth.checkAuth();
    if (isAuthenticated) {
        // 用户已登录，初始化页面
        console.log('User authenticated:', userAuth.currentUser);
        // 如果是付费用户，自动填充API Key（这里使用会话令牌）
        if (userAuth.currentUser && userAuth.currentUser.user_type === 'premium') {
            // 付费用户不需要输入API Key，使用会话令牌作为标识
            apiKeyInput.value = 'premium_user_token';
        }
    }
    // 如果未认证，checkAuth方法会自动重定向到登录页
});
// 修改连接函数，支持用户认证
async function connectToWebsocketWithAuth() {
    // 检查用户认证状态
    if (!userAuth.isAuthenticated) {
        alert('请先登录');
        userAuth.showLoginOverlay();
        return;
    }
    // 付费用户不需要输入API Key
    if (userAuth.currentUser.user_type === 'premium') {
        apiKeyInput.value = 'premium_user_token';
    } else if (!apiKeyInput.value) {
        alert('请输入 API Key');
        return;
    }
    // 其余逻辑与原来的connectToWebsocket相同
    await connectToWebsocket();
}
// 替换原来的连接按钮事件处理
connectButton.removeEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocket();
    }
});
connectButton.addEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocketWithAuth();
    }
});
screenButton.addEventListener('click', handleScreenShare);
screenButton.disabled = true;
// 检查页面元素是否存在（某些页面可能没有这些元素）
const goLoginBtn = document.getElementById('go-login');
if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
    });
}
// 用户菜单事件处理
document.getElementById('user-menu').addEventListener('click', () => {
    // 显示用户菜单选项
    const confirmed = confirm('是否要退出登录？');
    if (confirmed) {
        userAuth.logout();
    }
});
// 页面加载时检查用户认证状态
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await userAuth.checkAuth();
    if (isAuthenticated) {
        // 用户已登录，初始化页面
        console.log('User authenticated:', userAuth.currentUser);
        // 如果是付费用户，自动填充API Key（这里使用会话令牌）
        if (userAuth.currentUser && userAuth.currentUser.user_type === 'premium') {
            // 付费用户不需要输入API Key，使用会话令牌作为标识
            apiKeyInput.value = 'premium_user_token';
        }
    }
    // 如果未认证，checkAuth方法会自动重定向到登录页
});
// 修改连接函数，支持用户认证
async function connectToWebsocketWithAuth() {
    // 检查用户认证状态
    if (!userAuth.isAuthenticated) {
        alert('请先登录');
        userAuth.showLoginOverlay();
        return;
    }
    // 付费用户不需要输入API Key
    if (userAuth.currentUser.user_type === 'premium') {
        apiKeyInput.value = 'premium_user_token';
    } else if (!apiKeyInput.value) {
        alert('请输入 API Key');
        return;
    }
    // 其余逻辑与原来的connectToWebsocket相同
    await connectToWebsocket();
}
// 替换原来的连接按钮事件处理
connectButton.removeEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocket();
    }
});
connectButton.addEventListener('click', () => {
    if (isConnected) {
        disconnectFromWebsocket();
    } else {
        connectToWebsocketWithAuth();
    }
});
 