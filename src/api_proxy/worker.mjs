//Author: PublicAffairs
//Project: https://github.com/PublicAffairs/openai-gemini
//MIT License : https://github.com/PublicAffairs/openai-gemini/blob/main/LICENSE

// Web标准的base64编码函数，替代Node.js Buffer
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

const fixCors = ({ headers, status, statusText }) => {
  headers = new Headers(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return { headers, status, statusText };
};

const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    }
  });
};

// 支持可配置的基础URL，解决中国大陆访问限制问题
const getBaseUrl = (env) => {
  // 优先使用环境变量配置的URL
  if (env && env.GEMINI_API_BASE_URL) {
    return env.GEMINI_API_BASE_URL;
  }
  // 默认使用官方域名
  return "https://generativelanguage.googleapis.com";
};

// 获取备用URL列表
const getFallbackUrls = (env) => {
  if (env && env.GEMINI_API_FALLBACK_URLS) {
    return env.GEMINI_API_FALLBACK_URLS.split(',').map(url => url.trim());
  }
  return ["https://generativelanguage.googleapis.com"];
};

const API_VERSION = "v1beta";

// 带有重试机制的fetch函数，支持多个备用URL
const fetchWithFallback = async (path, options, env) => {
  const baseUrl = getBaseUrl(env);
  const fallbackUrls = getFallbackUrls(env);

  // 首先尝试主URL
  const primaryUrl = `${baseUrl}${path}`;
  console.log(`Trying primary URL: ${primaryUrl}`);

  try {
    const response = await fetch(primaryUrl, options);
    if (response.ok || response.status < 500) {
      return response;
    }
    console.log(`Primary URL failed with status: ${response.status}`);
  } catch (error) {
    console.log(`Primary URL failed with error: ${error.message}`);
  }

  // 如果主URL失败，尝试备用URL
  for (const fallbackUrl of fallbackUrls) {
    if (fallbackUrl === baseUrl) continue; // 跳过已经尝试过的主URL

    const url = `${fallbackUrl}${path}`;
    console.log(`Trying fallback URL: ${url}`);

    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        console.log(`Fallback URL succeeded: ${url}`);
        return response;
      }
      console.log(`Fallback URL failed with status: ${response.status}`);
    } catch (error) {
      console.log(`Fallback URL failed with error: ${error.message}`);
    }
  }

  // 所有URL都失败，抛出错误
  throw new HttpError("All API endpoints failed. Please check your network connection or try using a proxy.", 503);
};

// https://github.com/google-gemini/generative-ai-js/blob/cf223ff4a1ee5a2d944c53cddb8976136382bee6/src/requests/request.ts#L71
const API_CLIENT = "genai-js/0.21.0"; // npm view @google/generative-ai version

const makeHeaders = (apiKey, more) => ({
  "x-goog-api-client": API_CLIENT,
  ...(apiKey && { "x-goog-api-key": apiKey }),
  ...more
});

async function handleModels(apiKey, env) {
  const response = await fetchWithFallback(`/${API_VERSION}/models`, {
    headers: makeHeaders(apiKey),
  }, env);

  let { body } = response;
  if (response.ok) {
    const { models } = JSON.parse(await response.text());
    body = JSON.stringify({
      object: "list",
      data: models.map(({ name }) => ({
        id: name.replace("models/", ""),
        object: "model",
        created: 0,
        owned_by: "",
      })),
    }, null, "  ");
  }
  return new Response(body, fixCors(response));
}

const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-004";

async function handleEmbeddings(req, apiKey, env) {
  if (typeof req.model !== "string") {
    throw new HttpError("model is not specified", 400);
  }

  if (!Array.isArray(req.input)) {
    req.input = [req.input];
  }

  let model;
  if (req.model.startsWith("models/")) {
    model = req.model;
  } else {
    req.model = DEFAULT_EMBEDDINGS_MODEL;
    model = "models/" + req.model;
  }

  const response = await fetchWithFallback(`/${API_VERSION}/${model}:batchEmbedContents`, {
    method: "POST",
    headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      requests: req.input.map(input => ({
        model,
        content: { parts: [{ text: input }] }
      }))
    })
  }, env);

  let { body } = response;
  if (response.ok) {
    const { embeddings } = JSON.parse(await response.text());
    body = JSON.stringify({
      object: "list",
      data: embeddings.map((embedding, index) => ({
        object: "embedding",
        embedding: embedding.values,
        index
      })),
      model: req.model,
      usage: {
        prompt_tokens: 0,
        total_tokens: 0
      }
    });
  }
  return new Response(body, fixCors(response));
}

// 图片解析函数
const parseImg = async (url) => {
  let mimeType, data;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} (${url})`);
      }
      mimeType = response.headers.get("content-type");
      data = arrayBufferToBase64(await response.arrayBuffer());
    } catch (err) {
      throw new Error("Error fetching image: " + err.toString());
    }
  } else {
    const match = url.match(/^data:(?<mimeType>.*?)(;base64)?,(?<data>.*)$/);
    if (!match) {
      throw new Error("Invalid image data: " + url);
    }
    ({ mimeType, data } = match.groups);
  }

  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

// 安全设置
const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
];

// 转换配置
const transformConfig = (req) => {
  const config = {};

  if (req.max_tokens) config.maxOutputTokens = req.max_tokens;
  if (req.temperature !== undefined) config.temperature = req.temperature;
  if (req.top_p !== undefined) config.topP = req.top_p;
  if (req.top_k !== undefined) config.topK = req.top_k;
  if (req.stop) config.stopSequences = Array.isArray(req.stop) ? req.stop : [req.stop];

  return config;
};

// 转换消息内容
const transformMsg = async (msg) => {
  if (typeof msg.content === "string") {
    return { parts: [{ text: msg.content }] };
  }

  const parts = [];
  for (const item of msg.content) {
    if (item.type === "text") {
      parts.push({ text: item.text });
    } else if (item.type === "image_url") {
      parts.push(await parseImg(item.image_url.url));
    }
  }
  return { parts };
};

// 转换消息数组
const transformMessages = async (messages) => {
  const contents = [];
  let system_instruction;

  for (const item of messages) {
    if (item.role === "system") {
      delete item.role;
      system_instruction = await transformMsg(item);
    } else {
      item.role = item.role === "assistant" ? "model" : "user";
      contents.push(await transformMsg(item));
    }
  }

  if (system_instruction && contents.length === 0) {
    contents.push({ role: "model", parts: { text: " " } });
  }

  return { system_instruction, contents };
};

// 转换请求
const transformRequest = async (req) => ({
  ...await transformMessages(req.messages),
  safetySettings,
  generationConfig: transformConfig(req),
});

// 生成聊天完成ID
const generateChatcmplId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomChar = () => characters[Math.floor(Math.random() * characters.length)];
  return "chatcmpl-" + Array.from({ length: 29 }, randomChar).join("");
};

// 原因映射
const reasonsMap = {
  "STOP": "stop",
  "MAX_TOKENS": "length",
  "SAFETY": "content_filter",
  "RECITATION": "content_filter",
};

const SEP = "\n\n|>";

// 转换候选项
const transformCandidates = (key, cand) => ({
  index: cand.index || 0,
  [key]: {
    role: "assistant",
    content: cand.content?.parts.map(p => p.text).join(SEP)
  },
  logprobs: null,
  finish_reason: reasonsMap[cand.finishReason] || cand.finishReason,
});

const transformCandidatesMessage = transformCandidates.bind(null, "message");
const transformCandidatesDelta = transformCandidates.bind(null, "delta");

// 转换使用情况
const transformUsage = (data) => ({
  completion_tokens: data.candidatesTokenCount,
  prompt_tokens: data.promptTokenCount,
  total_tokens: data.totalTokenCount
});

// 处理完成响应
const processCompletionsResponse = (data, model, id) => {
  return JSON.stringify({
    id,
    choices: data.candidates.map(transformCandidatesMessage),
    created: Math.floor(Date.now()/1000),
    model,
    object: "chat.completion",
    usage: transformUsage(data.usageMetadata),
  });
};

// 流处理相关函数
const responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;

async function parseStream(chunk, controller) {
  chunk = await chunk;
  if (!chunk) { return; }
  this.buffer += chunk;

  do {
    const match = this.buffer.match(responseLineRE);
    if (!match) { break; }
    controller.enqueue(match[1]);
    this.buffer = this.buffer.substring(match[0].length);
  } while (true);
}

async function parseStreamFlush(controller) {
  if (this.buffer) {
    console.error("Invalid data:", this.buffer);
    controller.enqueue(this.buffer);
  }
}

function transformResponseStream(data, stop, first) {
  const item = transformCandidatesDelta(data.candidates[0]);
  if (stop) { item.delta = {}; } else { item.finish_reason = null; }
  if (first) { item.delta.content = ""; } else { delete item.delta.role; }

  const output = {
    id: this.id,
    choices: [item],
    created: Math.floor(Date.now()/1000),
    model: this.model,
    object: "chat.completion.chunk",
  };

  if (data.usageMetadata && this.streamIncludeUsage) {
    output.usage = stop ? transformUsage(data.usageMetadata) : null;
  }

  return "data: " + JSON.stringify(output) + delimiter;
}

const delimiter = "\n\n";

async function toOpenAiStream(chunk, controller) {
  const transform = transformResponseStream.bind(this);
  const line = await chunk;
  if (!line) { return; }

  let data;
  try {
    data = JSON.parse(line);
  } catch (err) {
    console.error(line);
    console.error(err);
    const length = this.last.length || 1;
    const candidates = Array.from({ length }, (_, index) => ({
      finishReason: "error",
      content: { parts: [{ text: err }] },
      index,
    }));
    data = { candidates };
  }

  const cand = data.candidates[0];
  console.assert(data.candidates.length === 1, "Unexpected candidates count: %d", data.candidates.length);
  cand.index = cand.index || 0;

  if (!this.last[cand.index]) {
    controller.enqueue(transform(data, false, "first"));
  }

  this.last[cand.index] = data;
  if (cand.content) {
    controller.enqueue(transform(data));
  }
}

async function toOpenAiStreamFlush(controller) {
  const transform = transformResponseStream.bind(this);
  if (this.last.length > 0) {
    for (const data of this.last) {
      controller.enqueue(transform(data, "stop"));
    }
    controller.enqueue("data: [DONE]" + delimiter);
  }
}

// 默认模型映射
const DEFAULT_MODEL = "gemini-1.5-flash";
const modelMap = {
  "gpt-3.5-turbo": "gemini-1.5-flash",
  "gpt-4": "gemini-1.5-pro",
  "gpt-4-turbo": "gemini-1.5-pro",
  "gpt-4o": "gemini-1.5-pro",
  "gpt-4o-mini": "gemini-1.5-flash",
};

// 处理聊天完成请求
async function handleCompletions(req, apiKey, env) {
  if (typeof req.model !== "string") {
    throw new HttpError("model is not specified", 400);
  }

  // 模型映射
  let model = req.model;
  if (modelMap[model]) {
    model = modelMap[model];
  }
  if (!model.startsWith("models/")) {
    model = "models/" + (model || DEFAULT_MODEL);
  }

  const id = generateChatcmplId();
  const body = JSON.stringify(await transformRequest(req));

  const endpoint = req.stream
    ? `/${API_VERSION}/${model}:streamGenerateContent?alt=sse`
    : `/${API_VERSION}/${model}:generateContent`;

  const response = await fetchWithFallback(endpoint, {
    method: "POST",
    headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
    body
  }, env);

  if (!response.ok) {
    return new Response(await response.text(), fixCors(response));
  }

  if (req.stream) {
    const stream = new ReadableStream({
      start(controller) {
        this.buffer = "";
        this.last = [];
        this.id = id;
        this.model = req.model;
        this.streamIncludeUsage = req.stream_options?.include_usage;
      },
      transform: toOpenAiStream,
      flush: toOpenAiStreamFlush
    });

    const transformedStream = response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TransformStream({
        start(controller) {
          this.buffer = "";
        },
        transform: parseStream,
        flush: parseStreamFlush
      }))
      .pipeThrough(stream);

    return new Response(transformedStream, fixCors({
      ...response,
      headers: {
        ...response.headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    }));
  } else {
    const data = await response.json();
    const responseBody = processCompletionsResponse(data, req.model, id);
    return new Response(responseBody, fixCors({
      ...response,
      headers: {
        ...response.headers,
        "Content-Type": "application/json"
      }
    }));
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return handleOPTIONS();
    }

    const errHandler = (err) => {
      console.error(err);
      return new Response(err.message, fixCors({ status: err.status ?? 500 }));
    };

    try {
      const auth = request.headers.get("Authorization");
      const apiKey = auth?.split(" ")[1];

      const assert = (success) => {
        if (!success) {
          throw new HttpError("The specified HTTP method is not allowed for the requested resource", 400);
        }
      };

      const { pathname } = new URL(request.url);

      switch (true) {
        case pathname.endsWith("/chat/completions"):
          assert(request.method === "POST");
          return handleCompletions(await request.json(), apiKey, env)
            .catch(errHandler);

        case pathname.endsWith("/embeddings"):
          assert(request.method === "POST");
          return handleEmbeddings(await request.json(), apiKey, env)
            .catch(errHandler);

        case pathname.endsWith("/models"):
          assert(request.method === "GET");
          return handleModels(apiKey, env)
            .catch(errHandler);

        default:
          throw new HttpError("404 Not Found", 404);
      }
    } catch (err) {
      return errHandler(err);
    }
  }
};
