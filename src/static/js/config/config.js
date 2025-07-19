export const CONFIG = {
    API: {
        VERSION: 'v1beta',
        MODEL_NAME: 'models/gemini-live-2.5-flash-preview'
    },
    // WebSocket配置
    WEBSOCKET_URL: '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
    MODEL: 'gemini-2.0-flash-exp',
    // 默认系统指令改为中文，并添加时区信息
    SYSTEM_INSTRUCTION: {
        TEXT: '你是我的智能助手。你可以看到和听到我，并用语音和文字回复。如果被问到不知道的事情，你可以使用谷歌搜索工具来寻找答案。当前时区为东八区(UTC+8)，请使用北京时间来回答时间相关的问题。',
    },
    // 默认设置
    DEFAULTS: {
        LANGUAGE: 'cmn-CN',  // 默认中文
        VOICE: 'Aoede',      // 默认语音
        RESPONSE_TYPE: 'audio' // 默认语音输出
    },
    // 默认音频设置
    AUDIO: {
        SAMPLE_RATE: 16000,
        OUTPUT_SAMPLE_RATE: 24000,
        BUFFER_SIZE: 2048,
        CHANNELS: 1
    }
};
export default CONFIG; 
