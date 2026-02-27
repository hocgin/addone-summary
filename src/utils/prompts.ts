/**
 * 根据用户系统语言获取提示词
 */
function getPromptsForLanguage(systemLanguage: string) {
  return {
    system: `You are a web content analyzer. Analyze content in ${systemLanguage} and output JSON.`,
    user: (text: string) => `Analyze content in ${systemLanguage} and output JSON.

Response JSON format:
{
  "abstract": "summary",
  "keyPoints": ["points"],
  "topics": ["topics"],
  "sentiment": "positive",
  "confidence": 0.8
}

Content:
${text}

Requirement: Analyze in ${systemLanguage}, output JSON only.`
  }
}

/**
 * 获取用户系统语言
 */
export function getUserLanguage(): string {
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    const lang = chrome.i18n.getUILanguage() || 'en'
    console.log('[Prompts] 用户系统语言:', lang)
    return lang
  }

  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || 'en'
    console.log('[Prompts] 浏览器语言:', lang)
    return lang
  }

  console.log('[Prompts] 使用默认语言: en')
  return 'en'
}

export const Prompts = {
  System: {
    DEFAULT: (() => {
      const lang = getUserLanguage()
      return getPromptsForLanguage(lang).system
    })()
  },

  User: {
    SUMMARIZE: (text: string) => {
      const lang = getUserLanguage()
      return getPromptsForLanguage(lang).user(text)
    }
  }
}
