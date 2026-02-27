import { Readability } from '@mozilla/readability'
import { UNWANTED_SELECTORS, MAX_TEXT_LENGTH } from '../utils/constants'
import type { ExtractedContent } from '../types'

/**
 * 内容质量验证结果
 */
interface ContentValidationResult {
  valid: boolean
  reason?: string
  quality: 'high' | 'medium' | 'low'
  characterCount: number
  wordCount: number
}

/**
 * 验证提取的内容质量
 */
function validateContentQuality(text: string): ContentValidationResult {
  const characterCount = text.length
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length

  // 极短文本
  if (characterCount < 50) {
    return {
      valid: false,
      reason: `文本过短 (${characterCount} 字符)，无法生成有效摘要`,
      quality: 'low',
      characterCount,
      wordCount
    }
  }

  // 短文本
  if (characterCount < 100) {
    return {
      valid: true,
      reason: `文本较短 (${characterCount} 字符)，摘要质量可能受限`,
      quality: 'low',
      characterCount,
      wordCount
    }
  }

  // 中等文本
  if (characterCount < 500) {
    return {
      valid: true,
      quality: 'medium',
      characterCount,
      wordCount
    }
  }

  // 长文本 - 高质量
  return {
    valid: true,
    quality: 'high',
    characterCount,
    wordCount
  }
}

/**
 * 提取页面主要内容
 */
function extractPageContent(): string {
  console.log('[Extractor] 开始提取页面内容')
  console.log('[Extractor] 当前页面 URL:', window.location.href)
  console.log('[Extractor] Document ready state:', document.readyState)

  // 检查 document.body 是否存在
  if (!document.body) {
    console.error('[Extractor] document.body 不存在，页面可能还未加载')
    return ''
  }

  // 第一步：使用 Readability 提取
  const readabilityResult = extractWithReadability()
  if (readabilityResult && readabilityResult.length > 0) {
    const validation = validateContentQuality(readabilityResult)
    console.log('[Extractor] Readability 提取结果:', validation)

    // 即使质量低，只要有内容就使用
    return readabilityResult
  }

  console.warn('[Extractor] Readability 未提取到内容，使用降级方案')

  // 第二步：降级到基础提取
  console.log('[Extractor] 使用降级方案：基础文本提取')
  const fallbackResult = extractWithFallback()

  console.log('[Extractor] 降级提取完成，长度:', fallbackResult.length)

  return fallbackResult
}

/**
 * 使用 Readability 提取内容
 */
function extractWithReadability(): string | null {
  try {
    const startTime = performance.now()

    // 创建 document 的克隆以避免修改原始页面
    const documentClone = document.cloneNode(true) as Document

    // 改进的 Readability 配置
    const reader = new Readability(documentClone, {
      charThreshold: 500,  // 提高阈值，确保只提取有意义的内容块
      keepClasses: false  // 不保留类名
    })

    const article = reader.parse()
    const elapsed = performance.now() - startTime

    if (article && article.textContent) {
      const text = article.textContent
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_TEXT_LENGTH)

      console.log(`[Extractor] Readability 成功，耗时: ${elapsed.toFixed(2)}ms，提取长度: ${text.length}`)
      return text
    }

    console.warn('[Extractor] Readability 未找到文章内容')
    return null
  } catch (error) {
    console.warn('[Extractor] Readability 解析失败:', error)
    return null
  }
}

/**
 * 降级方案：基础文本提取
 */
function extractWithFallback(): string {
  try {
    const startTime = performance.now()

    // 创建 body 的克隆
    const clone = document.body.cloneNode(true) as HTMLElement

    // 移除不需要的选择器
    UNWANTED_SELECTORS.forEach(selector => {
      try {
        clone.querySelectorAll(selector).forEach(el => el.remove())
      } catch {
        // 忽略无效选择器
      }
    })

    // 移除所有脚本和样式元素
    const elementsToRemove = ['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'video', 'audio']
    elementsToRemove.forEach(tag => {
      clone.querySelectorAll(tag).forEach(el => el.remove())
    })

    // 提取文本
    let text = clone.innerText
      .replace(/\s+/g, ' ')
      .trim()

    // 如果文本为空或非常短，尝试提取可见文本
    if (!text || text.length < 50) {
      console.log('[Extractor] 提取的文本过短，尝试其他方法')
      // 尝试获取所有段落的文本
      const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, article, section'))
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .join(' ')

      if (paragraphs.length > 50) {
        text = paragraphs
      } else {
        // 最后的降级：使用页面标题和 meta 描述
        const title = document.title || ''
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        text = `${title}. ${metaDesc}`.trim()
      }
    }

    // 过滤掉过短的段落（可能是导航、页脚等噪音）
    if (text.includes('\n') || text.includes('  ')) {
      const paragraphs = text.split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 20)  // 只保留超过20字符的段落

      if (paragraphs.length > 0) {
        text = paragraphs.join(' ')
      }
    }

    // 限制最大长度
    text = text.slice(0, MAX_TEXT_LENGTH)

    const elapsed = performance.now() - startTime
    console.log(`[Extractor] 降级提取完成，耗时: ${elapsed.toFixed(2)}ms，提取长度: ${text.length}`)

    // 至少返回一些内容（即使很少）
    if (!text) {
      console.warn('[Extractor] 所有方法均未提取到内容，返回页面标题')
      return document.title || ''
    }

    return text
  } catch (error) {
    console.error('[Extractor] 降级提取失败:', error)
    // 返回页面标题作为最后手段
    return document.title || ''
  }
}

function getPageMetadata(): { title: string; url: string } {
  return {
    title: document.title || '未知标题',
    url: window.location.href
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // PING 消息 - 用于验证脚本是否加载
  if (message.type === 'PING') {
    console.log('[Extractor] 收到 PING，返回 PONG')
    sendResponse({ type: 'PONG' })
    return true
  }

  if (message.type === 'EXTRACT_CONTENT') {
    try {
      const text = extractPageContent()
      const metadata = getPageMetadata()

      sendResponse({
        type: 'CONTENT_EXTRACTED',
        text,
        ...metadata
      } as ExtractedContent)
    } catch (error) {
      console.error('Content extraction failed:', error)
      sendResponse({
        type: 'CONTENT_EXTRACTED',
        text: '',
        title: document.title || '未知标题',
        url: window.location.href
      })
    }
    return true
  }
})

console.log('WebLLM-X Content Script loaded')
