export const DEFAULT_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'

export const MAX_TEXT_LENGTH = 10000

export const UNWANTED_SELECTORS = [
  'nav',
  'footer',
  'header',
  '.navigation',
  '.sidebar',
  '.ads',
  'script',
  'style',
  'noscript',
  '.advertisement',
  '.cookie-banner',
  '.popup',
  '.modal',
  '[role="complementary"]'
]

export const SUMMARY_PROMPT = `请分析以下网页内容并提供结构化摘要，以 JSON 格式返回，包含以下字段：
- abstract: 2-3句话的内容摘要
- keyPoints: 3-5个关键要点数组
- topics: 3-5个主要话题标签数组
- sentiment: 情感倾向（positive/neutral/negative）
- confidence: 可信度（0-1之间的数字）

网页内容：
{text}

请只返回 JSON，不要包含其他内容。`

export const ERROR_MESSAGES = {
  WEBGPU_NOT_AVAILABLE: '您的浏览器不支持 WebGPU，请使用 Chrome 113+ 或启用 WebGPU 功能',
  INSUFFICIENT_MEMORY: '设备内存不足，请关闭其他标签页后重试',
  MODEL_LOAD_FAILED: '模型加载失败，请检查网络连接',
  EXTRACTION_FAILED: '页面内容提取失败',
  GENERATION_FAILED: '摘要生成失败',
  UNKNOWN: '未知错误，请重试'
} as const
