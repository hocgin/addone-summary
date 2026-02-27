export const Prompts = {
  System: {
    DEFAULT: '你是一个专业的网页内容分析助手，擅长提取关键信息和生成结构化摘要。'
  },
  User: {
    SUMMARIZE: (text: string) => `请分析以下网页内容并提供结构化摘要，以 JSON 格式返回，包含以下字段：
- abstract: 2-3句话的内容摘要
- keyPoints: 3-5个关键要点数组
- topics: 3-5个主要话题标签数组
- sentiment: 情感倾向（positive/neutral/negative）
- confidence: 可信度（0-1之间的数字）

网页内容：
${text}

请只返回 JSON，不要包含其他内容。`
  }
}
