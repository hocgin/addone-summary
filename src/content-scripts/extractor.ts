import { Readability } from '@mozilla/readability'
import { UNWANTED_SELECTORS, MAX_TEXT_LENGTH } from '../utils/constants'
import type { ExtractedContent } from '../types'

function extractPageContent(): string {
  try {
    // 创建 document 的克隆以避免修改原始页面
    const documentClone = document.cloneNode(true) as Document
    const reader = new Readability(documentClone, {
      charThreshold: 0,
      keepClasses: false
    })
    const article = reader.parse()

    if (article && article.textContent) {
      const text = article.textContent
        .replace(/\s+/g, ' ')
        .trim()
      
      return text.slice(0, MAX_TEXT_LENGTH)
    }
  } catch (error) {
    console.warn('Readability parsing failed, falling back to basic extraction:', error)
  }

  // 降级方案：基本的文本提取
  const unwantedSelectors = UNWANTED_SELECTORS

  const clone = document.body.cloneNode(true) as HTMLElement

  unwantedSelectors.forEach(selector => {
    try {
      clone.querySelectorAll(selector).forEach(el => el.remove())
    } catch {
      // 忽略无效选择器
    }
  })

  // 移除所有脚本和样式
  clone.querySelectorAll('script, style, noscript, iframe, svg').forEach(el => el.remove())

  const text = clone.innerText
    .replace(/\s+/g, ' ')
    .trim()

  return text.slice(0, MAX_TEXT_LENGTH)
}

function getPageMetadata(): { title: string; url: string } {
  return {
    title: document.title || '未知标题',
    url: window.location.href
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
