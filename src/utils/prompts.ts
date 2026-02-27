/**
 * 获取用户系统语言名称（用于提示词）
 */
function getLanguageName(systemLanguage: string): string {
  if (systemLanguage.startsWith('zh')) {
    return 'Chinese'
  }
  return 'English'
}

/**
 * 根据用户系统语言获取提示词
 */
function getPromptsForLanguage(systemLanguage: string) {
  const langName = getLanguageName(systemLanguage)

  return {
    system: `
你是一个网页内容分析助手。你的任务是将网页内容分析并生成 JSON 格式的摘要。

重要：必须用${systemLanguage}生成所有字段的内容

字段说明：
- abstract: 按照 5W1H 准确概括内容
- keyPoints: 提取3-5个最重要的关键点，每个要点简洁
- topics: 提炼3-5个代表性话题标签
- sentiment: 情感倾向，只能是 positive 或 neutral 或 negative
- confidence: 0到1之间的数字，表示分析置信度
`,

    user: (text: string) => `Analyze the content in ${langName}.
${text}`
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
      console.log('[Prompts] 生成摘要，系统语言:', lang)
      return getPromptsForLanguage(lang).user(text)
    }
  }
}
