# AI 平台 API 文档清单（TypeScript 接入）

面向 TypeScript / JavaScript 项目接入。建议后端调用 API，避免在浏览器端暴露 API Key。

## 优先推荐的接入策略

如果你的项目要支持多个 AI 平台，建议优先考虑两种路线：

1. **统一 SDK 路线**：用 Vercel AI SDK / OpenRouter / OpenAI-compatible API 做统一封装。
2. **官方 SDK 路线**：每个平台分别接官方 TypeScript SDK，控制力更强，但维护成本更高。

---

## 一、统一多平台接入

| 平台 / 工具 | 适合场景 | TypeScript 文档 | 安装 |
|---|---|---|---|
| Vercel AI SDK | Next.js / React / Node 项目，多模型统一调用、流式输出 | https://ai-sdk.dev/docs/introduction | `npm i ai` |
| OpenRouter | AI API 聚合 / 路由服务商；一个 API 接入多个模型供应商，适合快速切换模型 | https://openrouter.ai/docs/quickstart | 可用官方 TS SDK 或 OpenAI SDK |
| OpenRouter TypeScript SDK | 想要 OpenRouter 的类型安全 SDK | https://openrouter.ai/docs/client-sdks/typescript/overview | 查看官方文档 |

### 建议

- 如果你做的是 **Next.js / Web App / 教学工具 / Chat UI**：优先看 **Vercel AI SDK**。
- 如果你希望 **一个 key 调多个模型**：优先看 **OpenRouter**。
- 如果你已经写了 OpenAI SDK 代码：优先选择 **OpenAI-compatible API** 的平台。

---

## 二、主流闭源模型平台

| 平台 | 官方 TypeScript / JavaScript 文档 | REST / API Reference | 安装 |
|---|---|---|---|
| OpenAI | https://developers.openai.com/api/reference/typescript/ | https://platform.openai.com/docs | `npm i openai` |
| Anthropic Claude | https://platform.claude.com/docs/en/api/sdks/typescript | https://platform.claude.com/docs/en/api/overview | `npm i @anthropic-ai/sdk` |
| Google Gemini | https://ai.google.dev/gemini-api/docs/quickstart | https://ai.google.dev/api | `npm i @google/genai` |
| xAI Grok | https://docs.x.ai/developers/quickstart | https://docs.x.ai/ | 按官方 quickstart |
| Azure OpenAI | https://learn.microsoft.com/en-us/javascript/api/overview/azure/openai-readme?view=azure-node-latest | Azure OpenAI 文档 | `npm i openai @azure/openai` 或按 Azure 文档 |
| AWS Bedrock | https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_bedrock-runtime_code_examples.html | https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html | `npm i @aws-sdk/client-bedrock-runtime` |

---

## 三、开放模型 / 推理平台

| 平台 | 适合场景 | TypeScript 文档 | 安装 |
|---|---|---|---|
| Mistral AI | Mistral 自家模型、RAG、函数调用 | https://docs.mistral.ai/resources/sdks | `npm i @mistralai/mistralai` 或按官方文档 |
| Groq | 高速推理，常用于 Llama / Whisper 等 | https://console.groq.com/docs/libraries | `npm i groq-sdk` |
| Together AI | 开源模型推理、微调、OpenAI-compatible API | https://docs.together.ai/intro | `npm i together-ai` 或 `npm i ai @ai-sdk/togetherai` |
| Hugging Face Inference Providers | 调 Hugging Face Hub 上的模型 | https://huggingface.co/docs/inference-providers/index | `npm i @huggingface/inference` |
| Replicate | 图像、视频、音频、开源模型部署 | https://sdks.replicate.com/typescript | `npm i replicate` |

---

## 四、OpenAI-compatible 平台

这些平台通常可以用 OpenAI SDK，只需要改 `baseURL` 和 API key。

| 平台 | 文档 | 备注 |
|---|---|---|
| DeepSeek | https://api-docs.deepseek.com/ | 官方说明兼容 OpenAI / Anthropic API 格式 |
| OpenRouter | https://openrouter.ai/docs/quickstart | AI API 聚合 / 路由服务商；不是基础模型厂商，本身主要提供统一 API、模型路由、计费和 fallback |
| Together AI | https://docs.together.ai/intro | 文档说明支持 OpenAI-compatible API |
| Groq | https://console.groq.com/docs/api-reference | 提供 OpenAI 风格接口 |
| Cohere Compatibility API | https://docs.cohere.com/docs/compatibility-api | 可用 OpenAI SDK 调 Cohere 模型 |

### OpenAI-compatible TypeScript 示例

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: "https://example-provider.com/v1",
});

const response = await client.chat.completions.create({
  model: "provider-model-name",
  messages: [{ role: "user", content: "你好，介绍一下你自己" }],
});

console.log(response.choices[0]?.message?.content);
```

---

## 五、按项目类型选型

### 1. 做 ChatBot / 教学问答 / Web App

优先：

- Vercel AI SDK
- OpenAI
- Anthropic Claude
- Gemini
- OpenRouter

### 2. 要低成本或开源模型

优先：

- DeepSeek
- Mistral AI
- Together AI
- Groq
- Hugging Face

### 3. 要图像 / 视频 / 多模态生成

优先：

- OpenAI
- Gemini
- Replicate
- Hugging Face

### 4. 企业云环境

优先：

- Azure OpenAI
- AWS Bedrock
- Google Vertex AI / Gemini

---

## 六、适合你项目的设计：用户手动配置 baseURL + API Key

你的需求更适合做成 **自定义模型 Provider 配置**，而不是把每个平台写死。

核心思路：

- 用户填写 `baseURL`
- 用户填写 `apiKey`
- 用户选择协议格式：`openai-compatible` 或 `anthropic-compatible`
- 用户填写模型名，例如 `gpt-4.1-mini`、`claude-3-5-sonnet-latest`、`deepseek-chat`、`openrouter/auto` 等
- 软件内部根据协议格式调用不同的适配器

### Provider 配置类型

```ts
export type ProviderProtocol = "openai-compatible" | "anthropic-compatible";

export interface CustomAIProviderConfig {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  baseURL: string;
  apiKey: string;
  defaultModel: string;
}
```

### 统一消息类型

建议软件内部使用自己的统一消息结构，不要直接暴露某个平台的格式。

```ts
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  provider: CustomAIProviderConfig;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
```

### OpenAI-compatible 调用示例

适合：OpenAI、DeepSeek、OpenRouter、Groq、Together、部分本地模型服务、LiteLLM、vLLM、Ollama OpenAI-compatible endpoint 等。

```ts
import OpenAI from "openai";

export async function callOpenAICompatible(req: ChatRequest) {
  const client = new OpenAI({
    apiKey: req.provider.apiKey,
    baseURL: req.provider.baseURL,
  });

  const response = await client.chat.completions.create({
    model: req.model ?? req.provider.defaultModel,
    messages: req.messages,
    temperature: req.temperature,
    max_tokens: req.maxTokens,
    stream: false,
  });

  return response.choices[0]?.message?.content ?? "";
}
```

### Anthropic-compatible 调用示例

Anthropic 的 Messages API 和 OpenAI 的 Chat Completions 格式不完全一样。主要差异：

- Anthropic 的 `system` 通常是顶层字段，不放进 `messages` 数组。
- `messages` 里一般只放 `user` 和 `assistant`。
- `max_tokens` 通常是必填项。

```ts
import Anthropic from "@anthropic-ai/sdk";

function splitAnthropicMessages(messages: ChatMessage[]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("

");

  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  return { system, chatMessages };
}

export async function callAnthropicCompatible(req: ChatRequest) {
  const client = new Anthropic({
    apiKey: req.provider.apiKey,
    baseURL: req.provider.baseURL,
  });

  const { system, chatMessages } = splitAnthropicMessages(req.messages);

  const response = await client.messages.create({
    model: req.model ?? req.provider.defaultModel,
    system: system || undefined,
    messages: chatMessages,
    temperature: req.temperature,
    max_tokens: req.maxTokens ?? 4096,
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}
```

### 统一调用入口

```ts
export async function callAI(req: ChatRequest) {
  switch (req.provider.protocol) {
    case "openai-compatible":
      return callOpenAICompatible(req);

    case "anthropic-compatible":
      return callAnthropicCompatible(req);

    default:
      throw new Error(`Unsupported provider protocol: ${req.provider.protocol}`);
  }
}
```

### UI 表单建议

可以让用户配置这些字段：

| 字段 | 示例 | 说明 |
|---|---|---|
| Provider 名称 | `DeepSeek` | 用户自定义显示名 |
| 协议格式 | `OpenAI-compatible` / `Anthropic-compatible` | 决定调用适配器 |
| Base URL | `https://api.deepseek.com` | 不同平台不同 |
| API Key | `sk-...` | 加密保存，不能明文暴露到前端 |
| 默认模型 | `deepseek-chat` | 用户可改 |
| 是否启用流式输出 | `true` / `false` | 后续可支持 |

### 推荐的内置模板

```ts
export const providerTemplates = [
  {
    name: "OpenAI",
    protocol: "openai-compatible",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1-mini",
  },
  {
    name: "DeepSeek",
    protocol: "openai-compatible",
    baseURL: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
  },
  {
    name: "OpenRouter",
    protocol: "openai-compatible",
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4.1-mini",
  },
  {
    name: "Anthropic",
    protocol: "anthropic-compatible",
    baseURL: "https://api.anthropic.com",
    defaultModel: "claude-3-5-sonnet-latest",
  },
];
```

### 重要提醒

- API Key 不要存 localStorage，除非只是本地单机工具。Web 服务建议后端加密保存。
- 前端不要直接请求第三方模型 API，避免泄露 key。
- `baseURL` 要做 URL 校验，防止用户填入危险地址。
- 建议加“测试连接”按钮：用当前配置发送一个极短请求，验证是否可用。
- 不同 OpenAI-compatible 平台对模型名、tool calling、vision、streaming 的支持不完全一致，最好做能力开关。

---

## 七、最小推荐组合

如果只是先把项目跑起来：

1. **OpenAI SDK**：作为基准实现。
2. **Vercel AI SDK**：处理流式输出、前端 UI、Provider 抽象。
3. **OpenRouter 或 DeepSeek**：做低成本 / 多模型备选。
4. **Anthropic / Gemini**：做高质量模型备选。

---

## 八、安全提醒

- API Key 不要写进前端代码。
- 在 Node / Serverless / Edge Function 里调用模型。
- `.env` 加入 `.gitignore`。
- 统一设置超时、重试、限流和日志。
- 流式输出建议统一抽象，避免每个平台单独处理一套。

