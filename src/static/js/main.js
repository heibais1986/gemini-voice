/**
 * @fileoverview Main entry point for the application.
 * Initializes and manages the UI, audio, video, and WebSocket interactions.
 */

import { MultimodalLiveClient } from './core/websocket-client.js';
import { AudioStreamer } from './audio/audio-streamer.js';
import { AudioRecorder } from './audio/audio-recorder.js';
import { CONFIG } from './config/config.js';
import { Logger } from './utils/logger.js';
import { VideoManager } from './video/video-manager.js';
import { ScreenRecorder } from './video/screen-recorder.js';
import { languages } from './language-selector.js';

// 用户认证管理
class UserAuthManager {
    constructor() {
        this.sessionToken = this.getSessionTokenFromCookie() || localStorage.getItem('sessionToken');
        this.currentUser = null;
        this.isAuthenticated = false;
        this.infoModalShown = false; // 添加弹窗显示标志
    }

    fileContent = fileContent.replace(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="auth-required" content="true">'
      );
      
    
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
        console.log('🔐 checkAuth() 开始执行...');
        console.log('📍 当前路径:', window.location.pathname);
        console.log('🎫 当前sessionToken:', this.sessionToken ? '存在' : '不存在');

        // 首先检查页面是否有auth-required meta标签
        const authRequiredMeta = document.querySelector('meta[name="auth-required"]');
        if (authRequiredMeta && authRequiredMeta.getAttribute('content') === 'true') {
            console.log('🔒 检测到auth-required meta标签，显示登录遮罩');
            this.showLoginOverlay();
            return false;
        }
        
        // 如果后端已经重定向到登录页，说明认证失败，不需要前端再次检查
        if (window.location.pathname === '/login.html') {
            console.log('📄 当前在登录页，跳过认证检查');
            return false;
        }

        // 如果有sessionToken，尝试获取用户信息
        if (this.sessionToken) {
            console.log('🎫 有sessionToken，验证有效性...');
            try {
                const response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${this.sessionToken}`
                    }
                });
                console.log('📡 API响应状态:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    this.updateUserUI();
                    this.hideLoginOverlay();
                    
                    // 登录成功后显示信息弹窗
                    console.log('🎯 准备显示信息弹窗...');
                    this.showInfoModal();
                    
                    console.log('✅ 认证成功，用户:', data.user.username);
                    return true;
                } else {
                    // token无效，清除并显示登录提示
                    console.log('❌ token无效，清除认证信息');
                    this.clearSessionToken();
                    this.showLoginOverlay();
                    return false;
                }
            } catch (error) {
                console.error('❌ 认证检查失败:', error);
                this.showLoginOverlay();
                return false;
            }
        } else {
            // 没有token，显示登录提示
            console.log('❌ 没有sessionToken，显示登录遮罩');
            this.showLoginOverlay();
            return false;
        }
    }

    redirectToLogin() {
        // 优先显示登录遮罩，而不是直接重定向
        this.showLoginOverlay();
    }

    showLoginOverlay() {
        console.log('🔓 尝试显示登录遮罩...');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            console.log('✅ 登录遮罩已显示');
        } else {
            console.error('❌ 找不到login-overlay元素');
        }
    }

    hideLoginOverlay() {
        console.log('🔒 隐藏登录遮罩...');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            console.log('✅ 登录遮罩已隐藏');
        } else {
            console.error('❌ 找不到login-overlay元素');
        }
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
        } else {
            userInfo.style.display = 'none';
            apiKeyInput.style.display = 'block';
        }
    }

    // 显示信息弹窗
    showInfoModal() {
        console.log('🎯 showInfoModal() 被调用');
        
        // 检查是否已经设置过"不再显示"
        const dontShowAgain = localStorage.getItem('dontShowInfoModal');
        console.log('🔍 localStorage dontShowInfoModal:', dontShowAgain);
        if (dontShowAgain === 'true') {
            console.log('❌ 用户已设置不再显示，跳过弹窗');
            return;
        }

        // 检查是否已经显示过弹窗（防止重复显示）
        if (this.infoModalShown) {
            console.log('❌ 弹窗已显示过，跳过');
            return;
        }

        const modal = document.getElementById('info-modal');
        console.log('🔍 查找弹窗元素:', modal ? '找到' : '未找到');
        
        if (modal) {
            console.log('✅ 显示信息弹窗');
            modal.style.display = 'flex';
            this.infoModalShown = true; // 设置标志，防止重复显示
            
            // 绑定关闭按钮事件
            const closeBtn = document.getElementById('close-info-modal');
            const confirmBtn = document.getElementById('confirm-info-modal');
            const dontShowCheckbox = document.getElementById('dont-show-again');

            console.log('🔍 查找按钮元素:');
            console.log('  - closeBtn:', closeBtn ? '找到' : '未找到');
            console.log('  - confirmBtn:', confirmBtn ? '找到' : '未找到');
            console.log('  - dontShowCheckbox:', dontShowCheckbox ? '找到' : '未找到');

            if (closeBtn) {
                closeBtn.onclick = () => {
                    console.log('🔒 点击关闭按钮');
                    this.hideInfoModal();
                };
            }

            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    console.log('🔒 点击确定按钮');
                    // 检查是否勾选了"不再显示"
                    if (dontShowCheckbox && dontShowCheckbox.checked) {
                        localStorage.setItem('dontShowInfoModal', 'true');
                        console.log('✅ 已设置不再显示');
                    }
                    this.hideInfoModal();
                };
            }

            // 点击遮罩层关闭弹窗
            modal.onclick = (e) => {
                if (e.target === modal) {
                    console.log('🔒 点击遮罩层关闭弹窗');
                    this.hideInfoModal();
                }
            };
        } else {
            console.error('❌ 找不到info-modal元素');
        }
    }

    // 隐藏信息弹窗
    hideInfoModal() {
        const modal = document.getElementById('info-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// 创建用户认证管理器实例
const userAuth = new UserAuthManager();

// 全局变量
let client = null;
let isConnected = false;
let isRecording = false;
let isVideoActive = false;
let isScreenSharing = false;
let isUsingTool = false;
let audioCtx = null;
let audioStreamer = null;
let audioRecorder = null;
let videoManager = null;
let screenRecorder = null;

// DOM 元素变量
let logsContainer, messageInput, sendButton, micButton, micIcon, audioVisualizer;
let connectButton, cameraButton, cameraIcon, stopVideoButton, screenButton, screenIcon;
let screenContainer, screenPreview, inputAudioVisualizer, apiKeyInput, voiceSelect;
let languageSelect, fpsInput, configToggle, configContainer, systemInstructionInput;
let applyConfigButton, responseTypeSelect, goLoginBtn;

// 初始化 DOM 元素
function initializeDOMElements() {
    logsContainer = document.getElementById('logs-container');
    messageInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-button');
    micButton = document.getElementById('mic-button');
    micIcon = document.getElementById('mic-icon');
    audioVisualizer = document.getElementById('audio-visualizer');
    connectButton = document.getElementById('connect-button');
    cameraButton = document.getElementById('camera-button');
    cameraIcon = document.getElementById('camera-icon');
    stopVideoButton = document.getElementById('stop-video');
    screenButton = document.getElementById('screen-button');
    screenIcon = document.getElementById('screen-icon');
    screenContainer = document.getElementById('screen-container');
    screenPreview = document.getElementById('screen-preview');
    inputAudioVisualizer = document.getElementById('input-audio-visualizer');
    apiKeyInput = document.getElementById('api-key');
    voiceSelect = document.getElementById('voice-select');
    languageSelect = document.getElementById('language-select');
    fpsInput = document.getElementById('fps-input');
    configToggle = document.getElementById('config-toggle');
    configContainer = document.getElementById('config-container');
    systemInstructionInput = document.getElementById('system-instruction');
    applyConfigButton = document.getElementById('apply-config');
    responseTypeSelect = document.getElementById('response-type-select');
    goLoginBtn = document.getElementById('go-login');

    // 初始化系统指令
    if (systemInstructionInput) {
        systemInstructionInput.value = CONFIG.SYSTEM_INSTRUCTION.TEXT;
    }

    // 加载保存的值或使用默认值
    const savedApiKey = localStorage.getItem('gemini_api_key');
    const savedVoice = localStorage.getItem('gemini_voice') || CONFIG.DEFAULTS.VOICE;
    const savedLanguage = localStorage.getItem('gemini_language') || CONFIG.DEFAULTS.LANGUAGE;
    const savedFPS = localStorage.getItem('video_fps');

    if (savedApiKey && apiKeyInput) {
        apiKeyInput.value = savedApiKey;
    }

    if (voiceSelect) {
        voiceSelect.value = savedVoice;
    }
    if (responseTypeSelect) {
        responseTypeSelect.value = localStorage.getItem('response_type') || 'audio';
    }

    if (savedFPS && fpsInput) {
        fpsInput.value = savedFPS;
    }

    // 填充语言选择器
    if (languageSelect) {
        Object.entries(languages).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            languageSelect.appendChild(option);
        });
        languageSelect.value = savedLanguage;
    }

    // 检查页面元素是否存在（某些页面可能没有这些元素）
    if (goLoginBtn) {
        goLoginBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }
}

/**
 * Logs a message to the console and UI.
 * @param {string} message - The message to log.
 * @param {string} type - The type of message ('user', 'ai', 'system').
 */
function logMessage(message, type = 'system') {
    if (!logsContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;

    const timestamp = new Date().toLocaleTimeString();
    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = `[${timestamp}] `;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    logEntry.appendChild(timeSpan);
    logEntry.appendChild(messageSpan);

    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

/**
 * Logs a system message.
 * @param {string} message - The system message to log.
 */
function logSystem(message) {
    logMessage(message, 'system');
}

/**
 * Logs a user message.
 * @param {string} message - The user message to log.
 */
function logUser(message) {
    logMessage(message, 'user');
}

/**
 * Logs an AI message.
 * @param {string} message - The AI message to log.
 */
function logAI(message) {
    logMessage(message, 'ai');
}

/**
 * Updates the audio visualizer based on the audio volume.
 * @param {number} volume - The audio volume (0.0 to 1.0).
 * @param {boolean} [isInput=false] - Whether the visualizer is for input audio.
 */
function updateAudioVisualizer(volume, isInput = false) {
    const visualizer = isInput ? inputAudioVisualizer : audioVisualizer;
    if (!visualizer) return;
    
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
        audioStreamer = new AudioStreamer();
        await audioStreamer.init(audioCtx);
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

            // 显示音频可视化器
            const audioVisualizersContainer = document.querySelector('.audio-visualizers');
            if (audioVisualizersContainer) {
                audioVisualizersContainer.style.display = 'block';
            }
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

        // 隐藏音频可视化器
        const audioVisualizersContainer = document.querySelector('.audio-visualizers');
        if (audioVisualizersContainer) {
            audioVisualizersContainer.style.display = 'none';
        }
    }
}

/**
 * Updates the microphone icon based on recording state.
 */
function updateMicIcon() {
    if (!micIcon || !micButton) return;
    
    if (isRecording) {
        micIcon.textContent = 'mic_off';
        micButton.classList.add('active');
    } else {
        micIcon.textContent = 'mic';
        micButton.classList.remove('active');
    }
}

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
            await videoManager.start(fpsInput.value, (frameData) => {
                if (isConnected) {
                    client.sendRealtimeInput([frameData]);
                }
            });

            isVideoActive = true;
            if (cameraIcon) cameraIcon.textContent = 'videocam_off';
            if (cameraButton) cameraButton.classList.add('active');
            Logger.info('Camera started successfully');
            logSystem('Camera started');

            // 显示视频容器
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                videoContainer.style.display = 'block';
            }
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
    if (cameraIcon) cameraIcon.textContent = 'videocam';
    if (cameraButton) cameraButton.classList.remove('active');
    logMessage('Camera stopped', 'system');

    // 隐藏视频容器
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
        videoContainer.style.display = 'none';
    }
}

/**
 * Handles the screen share toggle. Starts or stops screen sharing.
 * @returns {Promise<void>}
 */
async function handleScreenShare() {
    if (!isScreenSharing) {
        try {
            if (!screenRecorder) {
                screenRecorder = new ScreenRecorder();
            }
            await screenRecorder.start((frameData) => {
                if (isConnected) {
                    client.sendRealtimeInput([frameData]);
                }
            });

            isScreenSharing = true;
            if (screenIcon) screenIcon.textContent = 'stop_screen_share';
            if (screenButton) screenButton.classList.add('active');
            if (screenContainer) screenContainer.style.display = 'block';
            logSystem('Screen sharing started');
        } catch (error) {
            Logger.error('Screen sharing error:', error);
            logSystem(`Screen sharing error: ${error.message}`);
            alert(`屏幕共享错误: ${error.message}`);
        }
    } else {
        stopScreenShare();
    }
}

/**
 * Stops screen sharing.
 */
function stopScreenShare() {
    if (screenRecorder) {
        screenRecorder.stop();
        screenRecorder = null;
    }
    isScreenSharing = false;
    if (screenIcon) screenIcon.textContent = 'screen_share';
    if (screenButton) screenButton.classList.remove('active');
    if (screenContainer) screenContainer.style.display = 'none';
    logSystem('Screen sharing stopped');
}

/**
 * Connects to the WebSocket server.
 */
async function connectToWebsocket() {
    if (!apiKeyInput) {
        alert('API Key 输入框未找到');
        return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('请输入 Gemini API Key');
        return;
    }

    try {
        await ensureAudioInitialized();

        client = new MultimodalLiveClient({
            url: CONFIG.WEBSOCKET_URL,
            apiKey: apiKey,
            model: CONFIG.MODEL,
            systemInstruction: (systemInstructionInput ? systemInstructionInput.value : '') || CONFIG.SYSTEM_INSTRUCTION.TEXT,
            voice: voiceSelect ? voiceSelect.value : CONFIG.DEFAULTS.VOICE,
            language: languageSelect ? languageSelect.value : CONFIG.DEFAULTS.LANGUAGE,
            responseType: responseTypeSelect ? responseTypeSelect.value : 'audio'
        });

        await client.connect();

        client.on('open', () => {
            isConnected = true;
            if (connectButton) {
                connectButton.textContent = '断开连接';
                connectButton.classList.add('connected');
            }
            if (micButton) micButton.disabled = false;
            if (cameraButton) cameraButton.disabled = false;
            if (screenButton) screenButton.disabled = false;
            logSystem('已连接到 Gemini Live API');

            // 保存API Key
            localStorage.setItem('gemini_api_key', apiKey);
        });

        client.on('message', (data) => {
            if (data.serverContent && data.serverContent.modelTurn) {
                const parts = data.serverContent.modelTurn.parts;
                if (parts) {
                    parts.forEach(part => {
                        if (part.text) {
                            logAI(part.text);
                        }
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                            playAudioResponse(part.inlineData.data);
                        }
                    });
                }
            }
        });

        client.on('close', () => {
            disconnectFromWebsocket();
        });

        client.on('error', (error) => {
            Logger.error('WebSocket error:', error);
            logSystem(`连接错误: ${error.message}`);
            disconnectFromWebsocket();
        });

    } catch (error) {
        Logger.error('Connection failed:', error);
        logSystem(`连接失败: ${error.message}`);
        alert(`连接失败: ${error.message}`);
    }
}

/**
 * Connects to WebSocket with authentication.
 */
async function connectToWebsocketWithAuth() {
    if (!userAuth.isAuthenticated) {
        const authSuccess = await userAuth.checkAuth();
        if (!authSuccess) {
            userAuth.showLoginOverlay();
            return;
        }
    }

    try {
        await ensureAudioInitialized();

        client = new MultimodalLiveClient({
            url: CONFIG.WEBSOCKET_URL,
            sessionToken: userAuth.sessionToken,
            model: CONFIG.MODEL,
            systemInstruction: (systemInstructionInput ? systemInstructionInput.value : '') || CONFIG.SYSTEM_INSTRUCTION.TEXT,
            voice: voiceSelect ? voiceSelect.value : CONFIG.DEFAULTS.VOICE,
            language: languageSelect ? languageSelect.value : CONFIG.DEFAULTS.LANGUAGE,
            responseType: responseTypeSelect ? responseTypeSelect.value : 'audio'
        });

        await client.connect();

        client.on('open', () => {
            isConnected = true;
            if (connectButton) {
                connectButton.textContent = '断开连接';
                connectButton.classList.add('connected');
            }
            if (micButton) micButton.disabled = false;
            if (cameraButton) cameraButton.disabled = false;
            if (screenButton) screenButton.disabled = false;
            logSystem('已连接到 Gemini Live API');
        });

        client.on('message', (data) => {
            if (data.serverContent && data.serverContent.modelTurn) {
                const parts = data.serverContent.modelTurn.parts;
                if (parts) {
                    parts.forEach(part => {
                        if (part.text) {
                            logAI(part.text);
                        }
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                            playAudioResponse(part.inlineData.data);
                        }
                    });
                }
            }
        });

        client.on('close', () => {
            disconnectFromWebsocket();
        });

        client.on('error', (error) => {
            Logger.error('WebSocket error:', error);
            logSystem(`连接错误: ${error.message}`);
            disconnectFromWebsocket();
        });

    } catch (error) {
        Logger.error('Connection failed:', error);
        logSystem(`连接失败: ${error.message}`);
        alert(`连接失败: ${error.message}`);
    }
}

/**
 * Disconnects from the WebSocket server.
 */
function disconnectFromWebsocket() {
    if (client) {
        client.disconnect();
        client = null;
    }

    isConnected = false;
    if (connectButton) {
        connectButton.textContent = '连接';
        connectButton.classList.remove('connected');
    }
    if (micButton) micButton.disabled = true;
    if (cameraButton) cameraButton.disabled = true;
    if (screenButton) screenButton.disabled = true;

    // 停止所有活动
    if (isRecording) {
        handleMicToggle();
    }
    if (isVideoActive) {
        stopVideo();
    }
    if (isScreenSharing) {
        stopScreenShare();
    }

    logSystem('已断开连接');
}

/**
 * Plays audio response from base64 data.
 * @param {string} base64Data - Base64 encoded audio data.
 */
async function playAudioResponse(base64Data) {
    try {
        const audioData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);

        for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
        }

        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        // 连接到音频可视化器
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        // 更新可视化器
        const updateVisualizer = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = Math.max(...dataArray) / 255;
            updateAudioVisualizer(volume, false);

            if (!source.ended) {
                requestAnimationFrame(updateVisualizer);
            }
        };

        source.start();
        updateVisualizer();

        source.onended = () => {
            updateAudioVisualizer(0, false);
        };

    } catch (error) {
        Logger.error('Audio playback error:', error);
        logSystem(`音频播放错误: ${error.message}`);
    }
}

/**
 * Handles sending a text message.
 */
function handleSendMessage() {
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message || !isConnected) return;

    logUser(message);
    client.sendRealtimeInput([{
        mimeType: "text/plain",
        data: message
    }]);

    messageInput.value = '';
}

/**
 * Applies configuration changes.
 */
function applyConfig() {
    if (!voiceSelect || !languageSelect || !responseTypeSelect || !systemInstructionInput) return;
    
    const voice = voiceSelect.value;
    const language = languageSelect.value;
    const responseType = responseTypeSelect.value;

    // 保存设置
    localStorage.setItem('gemini_voice', voice);
    localStorage.setItem('gemini_language', language);
    localStorage.setItem('response_type', responseType);

    // 如果已连接，更新客户端配置
    if (client && isConnected) {
        client.updateConfig({
            voice: voice,
            language: language,
            responseType: responseType,
            systemInstruction: systemInstructionInput.value
        });
    }

    logSystem('配置已更新');
}

/**
 * Toggles the configuration panel.
 */
function toggleConfig() {
    if (!configContainer) return;
    
    const isVisible = configContainer.style.display === 'block';
    configContainer.style.display = isVisible ? 'none' : 'block';
}

// 绑定事件监听器
function bindEventListeners() {
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
            }
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    if (micButton) {
        micButton.addEventListener('click', handleMicToggle);
    }
    if (cameraButton) {
        cameraButton.addEventListener('click', handleVideoToggle);
    }
    if (stopVideoButton) {
        stopVideoButton.addEventListener('click', stopVideo);
    }
    if (screenButton) {
        screenButton.addEventListener('click', handleScreenShare);
    }
    if (configToggle) {
        configToggle.addEventListener('click', toggleConfig);
    }
    if (applyConfigButton) {
        applyConfigButton.addEventListener('click', applyConfig);
    }

    // 连接按钮事件监听器
    if (connectButton) {
        connectButton.addEventListener('click', () => {
            if (isConnected) {
                disconnectFromWebsocket();
            } else {
                // 根据用户认证状态选择连接方式
                if (userAuth.isAuthenticated) {
                    connectToWebsocketWithAuth();
                } else {
                    connectToWebsocket();
                }
            }
        });
    }

    // 屏幕容器关闭按钮
    if (screenContainer) {
        const closeButton = screenContainer.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                stopScreenShare();
            });
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 页面初始化开始...');

    // 初始化 DOM 元素
    initializeDOMElements();
    
    // 绑定事件监听器
    bindEventListeners();

    // 检查服务器是否要求认证
    const authRequired = document.querySelector('meta[name="auth-required"]');
    console.log('🔍 检查auth-required meta标签:', authRequired);
    if (authRequired) {
        console.log('📋 meta标签内容:', authRequired.content);
    }

    if (authRequired && authRequired.content === 'true') {
        console.log('✅ 发现auth-required=true，显示登录遮罩');
        userAuth.showLoginOverlay();
    } else {
        console.log('❌ 未发现auth-required=true，继续认证检查');
    }

    // 检查用户认证状态
    console.log('🔐 开始用户认证检查...');
    await userAuth.checkAuth();

    // 初始状态设置
    if (micButton) micButton.disabled = true;
    if (cameraButton) cameraButton.disabled = true;
    if (screenButton) screenButton.disabled = true;

    logSystem('应用已初始化，请连接到 Gemini Live API');
    console.log('✅ 页面初始化完成');
});
