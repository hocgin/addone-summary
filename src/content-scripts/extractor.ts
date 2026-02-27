import { UNWANTED_SELECTORS, MAX_TEXT_LENGTH } from '../utils/constants'
import type { ExtractedContent } from '../types'

function extractPageContent(): string {
  const unwantedSelectors = UNWANTED_SELECTORS

  const clone = document.body.cloneNode(true) as HTMLElement

  unwantedSelectors.forEach(selector => {
    try {
      clone.querySelectorAll(selector).forEach(el => el.remove())
    } catch {
      // 忽略无效选择器
    }
  })

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
