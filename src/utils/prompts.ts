/**
 * 根据语言获取提示词
 */
function getPromptsForLanguage(_language: string) {
    return {
        system: `你是一个网页内容分析助手。你的任务是将网页内容分析并生成 JSON 格式的摘要。

重要：必须用中文生成所有字段的内容。必须返回 JSON，不能包含其他文字。`,

        user: (text: string) => `分析下面的内容，生成 JSON 格式的中文摘要。

返回格式参考例子：
{
  "abstract": "按照 5W1H 准确概括内容",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "topics": ["话题1", "话题2"],
  "sentiment": "positive",
  "confidence": 0.8
}

字段说明：
- abstract: 按照 5W1H 准确概括内容
- keyPoints: 提取3-5个最重要的关键点，每个要点简洁
- topics: 提炼3-5个代表性话题标签
- sentiment: 情感倾向，只能是 positive 或 neutral 或 negative
- confidence: 0到1之间的数字，表示分析置信度

内容：
${text}

只返回 JSON，不要其他内容。结果用<json>和</json>标签包围。`
    }
}

/**
 * 获取用户系统语言
 */
export function getUserLanguage(): string {
  // 尝试从 Chrome 获取语言设置
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    const lang = chrome.i18n.getUILanguage() || 'en'
    console.log('[Prompts] 检测到 UI 语言:', lang)
    return lang
  }

  // 降级到浏览器语言
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || 'en'
    console.log('[Prompts] 检测到浏览器语言:', lang)
    return lang
  }

  console.log('[Prompts] 使用默认语言: en')
  return 'en'
}

export const Prompts = {
  System: {
    DEFAULT: (() => {
      const lang = getUserLanguage()
      const prompts = getPromptsForLanguage(lang)
      console.log('[Prompts] 使用语言提示词:', lang.startsWith('zh') ? '中文' : 'English')
      return prompts.system
    })()
  },

  User: {
    SUMMARIZE: (text: string) => {
      const lang = getUserLanguage()
      const prompts = getPromptsForLanguage(lang)
      console.log('[Prompts] 生成摘要使用语言:', lang.startsWith('zh') ? '中文' : 'English')
      return prompts.user(text)
    }
  }
}
