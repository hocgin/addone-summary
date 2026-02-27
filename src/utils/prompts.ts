/**
 * Few-Shot Learning 示例
 */
const EXAMPLES = {
  EXAMPLE_1: {
    input: '这是一篇关于人工智能发展的文章，介绍了深度学习在医疗诊断中的应用，以及面临的伦理挑战。',
    output: {
      abstract: '文章探讨了深度学习技术在医疗诊断领域的创新应用，同时分析了AI医疗所面临的伦理考量和挑战。',
      keyPoints: [
        '深度学习提升诊断准确率',
        'AI辅助医生决策过程',
        '数据隐私保护至关重要',
        '算法偏见需要关注',
        '人机协作是未来趋势'
      ],
      topics: ['人工智能', '医疗科技', '深度学习', '伦理', '数据隐私'],
      sentiment: 'positive',
      confidence: 0.88
    }
  },
  EXAMPLE_2: {
    input: '气候变暖导致极端天气事件频发，科学家呼吁各国加快减排，但实施效果仍存在不确定性。',
    output: {
      abstract: '科学家警告气候变化加剧极端天气，敦促各国加强减排措施，然而政策落实和实际成效仍面临重大挑战。',
      keyPoints: [
        '极端天气事件显著增加',
        '全球减排行动刻不容缓',
        '政策执行存在差异',
        '经济成本成主要障碍',
        '国际合作仍需加强'
      ],
      topics: ['气候变化', '环境保护', '极端天气', '减排', '国际政策'],
      sentiment: 'neutral',
      confidence: 0.82
    }
  },
  EXAMPLE_3: {
    input: '这款新产品发布后遭到用户大量投诉，性能不稳定且价格过高，公司面临严重的公关危机。',
    output: {
      abstract: '新产品上市后因性能问题和定价策略引发广泛用户不满，公司正遭遇严重的声誉危机和信任危机。',
      keyPoints: [
        '产品稳定性存在严重缺陷',
        '定价超出用户心理预期',
        '用户投诉量激增',
        '品牌形象受损',
        '公司需紧急应对危机'
      ],
      topics: ['产品问题', '用户投诉', '定价策略', '品牌危机', '质量'],
      sentiment: 'negative',
      confidence: 0.91
    }
  }
}

export const Prompts = {
  System: {
    DEFAULT: `你是一个专业的网页内容分析助手。你的任务是分析网页内容并生成结构化摘要。

## 重要要求
1. 必须严格以 JSON 格式返回结果
2. 不要包含任何解释性文字或 markdown 标记
3. JSON 必须包含所有必需字段
4. 数组字段必须包含确切数量的元素

## 字段约束
- abstract: 简洁准确的2-3句话摘要，概括核心内容
- keyPoints: 3-5个关键要点，每个要点15字以内
- topics: 3-5个话题标签，每个标签5字以内
- sentiment: 只能是 positive/neutral/negative 之一
- confidence: 0-1之间的数字，表示对分析结果的置信度`
  },

  User: {
    SUMMARIZE: (text: string) => `分析以下网页内容并生成结构化摘要。

## 示例输出格式

示例1:
${JSON.stringify(EXAMPLES.EXAMPLE_1.output, null, 2)}

示例2:
${JSON.stringify(EXAMPLES.EXAMPLE_2.output, null, 2)}

示例3:
${JSON.stringify(EXAMPLES.EXAMPLE_3.output, null, 2)}

## 分析要求

- **abstract**: 用2-3句话准确概括内容核心，避免冗余
- **keyPoints**: 提取3-5个最重要的关键点，每个要点简洁有力（15字以内）
- **topics**: 提炼3-5个代表性话题标签（5字以内），去重
- **sentiment**: 根据内容情感倾向判断
  - positive: 积极、正面、有利
  - neutral: 中立、客观、平衡
  - negative: 消极、负面、不利
- **confidence**: 根据内容清晰度和分析准确性评估置信度（0-1）

## 网页内容

\`\`\`
${text}
\`\`\`

## 输出格式

请只返回 JSON 对象，不要包含任何其他内容、解释或标记。

<output>
{
  "abstract": "...",
  "keyPoints": ["...", "...", "..."],
  "topics": ["...", "...", "..."],
  "sentiment": "positive/neutral/negative",
  "confidence": 0.85
}
</output>`
  }
}
