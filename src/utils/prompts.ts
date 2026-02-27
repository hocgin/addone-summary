export const Prompts = {
  System: {
    DEFAULT: `你是一个网页内容分析助手。你的任务是将网页内容分析并生成 JSON 格式的摘要。

必须返回 JSON，不能包含其他文字。`
  },

  User: {
    SUMMARIZE: (text: string) => `分析下面的内容，生成 JSON 格式的摘要。

返回格式要求：
{
  "abstract": "两句话概括内容",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "topics": ["话题1", "话题2"],
  "sentiment": "positive",
  "confidence": 0.8
}

字段说明：
- abstract: 2句话摘要
- keyPoints: 3-5个要点，每条15字内
- topics: 3-5个话题，每个5字内
- sentiment: 只能是 positive 或 neutral 或 negative
- confidence: 0到1之间的数字

内容：
${text.slice(0, 8000)}

只返回 JSON，不要其他内容。结果用<json>和</json>标签包围。`
  }
}
