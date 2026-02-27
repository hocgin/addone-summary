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

export const ERROR_MESSAGES = {
  WEBGPU_NOT_AVAILABLE: '您的浏览器不支持 WebGPU，请使用 Chrome 113+ 或启用 WebGPU 功能',
  INSUFFICIENT_MEMORY: '设备内存不足，请关闭其他标签页后重试',
  MODEL_LOAD_FAILED: '模型加载失败，请检查网络连接',
  EXTRACTION_FAILED: '页面内容提取失败',
  GENERATION_FAILED: '摘要生成失败',
  UNKNOWN: '未知错误，请重试',
  MODEL_NOT_READY: 'MODEL_NOT_READY'
} as const
