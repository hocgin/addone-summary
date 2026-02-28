import * as webllm from '@mlc-ai/web-llm'
import { jsonrepair } from 'jsonrepair'
import type { StructuredSummary, WebLLMProgress } from '../types'
import { DEFAULT_MODEL, ERROR_MESSAGES } from '../utils/constants'
import { Prompts } from '../utils/prompts'
import {
    ChatCompletionRequestStreaming
} from "@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion";
import { Type, Static } from "@sinclair/typebox";

export class WebLLMManager {
  private static instance: WebLLMManager | null = null
  private engine: webllm.MLCEngine | null = null
  private model: string
  private isInitialized: boolean = false
  private initProgress: number = 0
  private progressStage: string = ''
  private startTime: number = 0

  private constructor(model: string = DEFAULT_MODEL) {
    this.model = model
  }

  static getInstance(model?: string): WebLLMManager {
    if (!WebLLMManager.instance) {
      WebLLMManager.instance = new WebLLMManager(model)
    }
    return WebLLMManager.instance
  }

  /**
   * 获取当前使用的模型
   */
  getModel(): string {
    return this.model
  }

  /**
   * 切换到新模型（需要重新初始化）
   */
  async switchModel(newModel: string, progressCallback?: (progress: WebLLMProgress) => void): Promise<void> {
    console.log(`[WebLLM] 切换模型: ${this.model} -> ${newModel}`)

    // 如果是同一个模型，跳过
    if (this.model === newModel && this.isInitialized) {
      console.log('[WebLLM] 模型相同且已初始化，跳过')
      return
    }

    // 先卸载旧模型
    if (this.isInitialized) {
      await this.dispose()
    }

    // 更新模型并重新初始化
    this.model = newModel
    await this.initialize(progressCallback)
  }

  async initialize(progressCallback?: (progress: WebLLMProgress) => void): Promise<void> {
    if (this.isInitialized && this.engine) {
      console.log('[WebLLM] 模型已初始化，跳过')
      return
    }

    try {
      console.log('[WebLLM] 开始初始化模型...')
      this.initProgress = 0
      this.progressStage = '准备中'
      this.startTime = Date.now()

      const initProgressCallback = (report: webllm.InitProgressReport) => {
        this.initProgress = report.progress
        const elapsed = Date.now() - this.startTime

        // 确定当前阶段
        let stage = this.progressStage
        if (report.progress < 0.1) {
          stage = '初始化 WebGPU 环境'
        } else if (report.progress < 0.2) {
          stage = '加载模型配置'
        } else if (report.progress < 0.5) {
          stage = '下载模型权重文件'
        } else if (report.progress < 0.8) {
          stage = '编译模型到 WebGPU'
        } else if (report.progress < 0.95) {
          stage = '准备推理引擎'
        } else {
          stage = '初始化完成'
        }
        this.progressStage = stage

        // 计算下载信息
        const details: {
          downloaded?: string
          total?: string
          speed?: string
          remaining?: string
        } = {}

        if (report.progress > 0) {
          // 估算总大小为 1GB
          const totalSize = 1000 // MB
          const downloadedMB = (report.progress * totalSize).toFixed(0)
          const speedMBps = ((report.progress * totalSize) / (elapsed / 1000)).toFixed(1)
          const remainingSec = report.progress > 0
            ? Math.round(((1 - report.progress) * elapsed) / report.progress / 1000)
            : 0

          details.downloaded = `${downloadedMB} MB`
          details.total = `${totalSize} MB`
          details.speed = `${speedMBps} MB/s`
          details.remaining = remainingSec > 0 ? `${remainingSec}秒` : '即将完成'
        }

        const progressInfo: WebLLMProgress = {
          progress: report.progress,
          timeElapsed: elapsed,
          stage,
          ...details
        }

        console.log(`[WebLLM] 进度: ${(report.progress * 100).toFixed(1)}% | 阶段: ${stage}`, details)

        progressCallback?.(progressInfo)
      }

      this.engine = await webllm.CreateMLCEngine(
        this.model,
        {
          initProgressCallback
        }
      )

      this.isInitialized = true
      console.log('[WebLLM] 模型初始化完成')
    } catch (error) {
      console.error('[WebLLM] 初始化失败:', error)
      throw new Error(ERROR_MESSAGES.MODEL_LOAD_FAILED)
    }
  }

  async summarize(text: string, progressCallback?: (progress: number) => void): Promise<StructuredSummary> {
    if (!this.engine || !this.isInitialized) {
      throw new Error('WebLLM engine not initialized')
    }
      // 定义 JSON 结构的 schema
      const WebPageSummarySchemaT = Type.Object({
          abstract: Type.String({ description: "网页内容的简明摘要" }),
          keyPoints: Type.Array(Type.String(), { description: "关键要点列表" }),
          topics: Type.Array(Type.String(), { description: "涉及的主题标签" }),
          sentiment: Type.Union([
              Type.Literal("positive"),
              Type.Literal("negative"),
              Type.Literal("neutral")
          ], { description: "情感倾向" }),
          confidence: Type.Number({
              minimum: 0,
              maximum: 1,
              description: "模型对结果的置信度（0~1）"
          })
      });
      type WebPageSummarySchemaT = Static<typeof WebPageSummarySchemaT>;
      const schema = JSON.stringify(WebPageSummarySchemaT);

    try {
      const prompt = Prompts.User.SUMMARIZE(text)

      progressCallback?.(0)

      const request: ChatCompletionRequestStreaming = {
        messages: [
          {
            role: 'system',
            content: Prompts.System.DEFAULT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,  // 降低温度以获得更确定性的输出
        max_tokens: 128000,
        stream: true,
        response_format: {
              type: "json_object",
              schema: schema,
        } as webllm.ResponseFormat,
      };

      console.log('[WebLLM] 请求配置:', {
        temperature: request.temperature,
        response_format: request.response_format,
        hasSystem: !!request.messages[0]?.content,
        hasUser: !!request.messages[1]?.content,
        promptLength: prompt.length
      })

      const chunks = await this.engine.chat.completions.create(request)

      let fullResponse = ''
      let chunkCount = 0

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || ''
        fullResponse += content
        chunkCount++

        // 估算进度，假设大概 50-100 个 chunk
        const estimatedProgress = Math.min(Math.round(chunkCount * 1.5), 95)
        progressCallback?.(estimatedProgress)
      }

      progressCallback?.(100)

      return this.parseSummary(fullResponse)
    } catch (error) {
      console.error('Summarization failed:', error)
      throw new Error(ERROR_MESSAGES.GENERATION_FAILED)
    }
  }

  private parseSummary(response: string): StructuredSummary {
    const parseStartTime = Date.now()
    console.log('[ParseSummary] 开始解析，原始响应长度:', response.length)

    // 第一步：从 markdown 代码块提取 JSON
    const step1Result = this.extractJSONFromMarkdown(response)
    if (step1Result.success) {
      console.log('[ParseSummary] 步骤1成功 - 从代码块提取')
      return this.finalizeSummary(step1Result.data!, response, parseStartTime, 'markdown-code-block')
    }

    // 第二步：使用花括号边界查找
    const step2Result = this.findJSONBoundaries(response)
    if (step2Result.success) {
      console.log('[ParseSummary] 步骤2成功 - 花括号边界查找')
      return this.finalizeSummary(step2Result.data!, response, parseStartTime, 'brace-boundaries')
    }

    // 第三步：使用 jsonrepair 尝试修复并解析
    console.log('[ParseSummary] 步骤3 - 尝试 jsonrepair 修复')
    const step3Result = this.attemptJsonRepair(response)
    if (step3Result.success) {
      console.log('[ParseSummary] 步骤3成功 - jsonrepair 修复')
      return this.finalizeSummary(step3Result.data!, response, parseStartTime, 'jsonrepair')
    }

    // 所有方法都失败，使用降级策略
    console.warn('[ParseSummary] 所有解析方法失败，使用降级策略')
    return this.createFallbackSummary(response)
  }

  /**
   * 步骤1：从标签或 markdown 代码块提取 JSON
   */
  private extractJSONFromMarkdown(response: string): { success: boolean; data?: any } {
    try {
      const trimmed = response.trim()

      // 优先匹配 <json>...</json> 标签
      const tagRegex = /<json>\s*([\s\S]*?)\s*<\/json>/i
      let match = trimmed.match(tagRegex)
      if (match && match[1]) {
        console.log('[ExtractJSON] 找到 <json> 标签')
        const extracted = match[1].trim()
        const parsed = JSON.parse(jsonrepair(extracted))
        return { success: true, data: parsed }
      }

      // 其次匹配 ```json...``` 或 ```...```
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
      match = trimmed.match(codeBlockRegex)
      if (match && match[1]) {
        console.log('[ExtractJSON] 找到 markdown 代码块')
        const extracted = match[1].trim()
        const parsed = JSON.parse(jsonrepair(extracted))
        return { success: true, data: parsed }
      }

      return { success: false }
    } catch (error) {
      console.log('[ExtractJSON] 失败:', error instanceof Error ? error.message : 'Unknown error')
      return { success: false }
    }
  }

  /**
   * 步骤2：智能查找 JSON 边界
   */
  private findJSONBoundaries(response: string): { success: boolean; data?: any } {
    try {
      const trimmed = response.trim()
      const start = trimmed.indexOf('{')
      const end = trimmed.lastIndexOf('}')

      if (start === -1 || end === -1 || end <= start) {
        return { success: false }
      }

      // 提取花括号内的内容
      let extracted = trimmed.slice(start, end + 1)

      // 尝试平衡花括号（处理嵌套情况）
      extracted = this.balanceBraces(extracted)

      const parsed = JSON.parse(jsonrepair(extracted))
      return { success: true, data: parsed }
    } catch (error) {
      console.log('[FindJSONBoundaries] 失败:', error instanceof Error ? error.message : 'Unknown error')
      return { success: false }
    }
  }

  /**
   * 步骤3：使用 jsonrepair 尝试修复
   */
  private attemptJsonRepair(response: string): { success: boolean; data?: any } {
    try {
      // 先清理一些常见的格式问题
      let cleaned = response.trim()
        .replace(/^[^{]*/, '') // 移除开头的非JSON内容
        .replace(/[^}]*$/, '') // 移除结尾的非JSON内容

      const repaired = jsonrepair(cleaned)
      const parsed = JSON.parse(repaired)
      return { success: true, data: parsed }
    } catch (error) {
      console.log('[AttemptJsonRepair] 失败:', error instanceof Error ? error.message : 'Unknown error')
      return { success: false }
    }
  }

  /**
   * 平衡花括号，处理嵌套 JSON
   */
  private balanceBraces(json: string): string {
    let depth = 0
    let lastValidIndex = -1

    for (let i = 0; i < json.length; i++) {
      const char = json[i]
      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0) {
          lastValidIndex = i
        }
      }
    }

    // 如果找到了平衡的结尾，使用它；否则使用原始字符串
    return lastValidIndex > 0 ? json.slice(0, lastValidIndex + 1) : json
  }

  /**
   * 验证摘要结构的完整性
   */
  private validateSummaryStructure(data: any): boolean {
    const hasAbstract = typeof data.abstract === 'string'
    const hasKeyPoints = Array.isArray(data.keyPoints)
    const hasTopics = Array.isArray(data.topics)
    const hasSentiment = ['positive', 'neutral', 'negative'].includes(data.sentiment)
    const hasConfidence = typeof data.confidence === 'number'
    // language 字段是可选的，不强求验证

    const isValid = hasAbstract && hasKeyPoints && hasTopics && hasSentiment && hasConfidence

    if (!isValid) {
      console.log('[ValidateSummary] 验证失败:', {
        hasAbstract,
        hasKeyPoints,
        hasTopics,
        hasSentiment,
        hasConfidence
      })
    }

    return isValid
  }

  /**
   * 最终化并规范化摘要
   */
  private finalizeSummary(
    data: any,
    rawResponse: string,
    startTime: number,
    parseMethod: string
  ): StructuredSummary {
    const elapsed = Date.now() - startTime
    console.log(`[FinalizeSummary] 解析完成，方法: ${parseMethod}，耗时: ${elapsed}ms`)

    // 验证结构
    if (!this.validateSummaryStructure(data)) {
      console.warn('[FinalizeSummary] 结构验证失败，使用降级策略')
      return this.createFallbackSummary(rawResponse)
    }

    const summary: StructuredSummary = {
      abstract: this.sanitizeString(data.abstract) || '',
      keyPoints: this.sanitizeArray(data.keyPoints, 5),
      topics: this.sanitizeArray(data.topics, 5),
      sentiment: ['positive', 'neutral', 'negative'].includes(data.sentiment)
        ? data.sentiment
        : 'neutral',
      confidence: this.clampNumber(data.confidence, 0, 1)
    }

    console.log('[FinalizeSummary] 最终摘要:', {
      abstractLength: summary.abstract.length,
      keyPointsCount: summary.keyPoints.length,
      topicsCount: summary.topics.length,
      sentiment: summary.sentiment,
      confidence: summary.confidence
    })

    return summary
  }

  /**
   * 创建降级摘要（当解析失败时）
   */
  private createFallbackSummary(rawResponse: string): StructuredSummary {
    console.warn('[FallbackSummary] 创建降级摘要')

    // 清理响应文本作为 abstract
    const cleanedText = rawResponse
      .replace(/```(?:json)?|```/g, '')
      .replace(/\n+/g, ' ')
      .trim()

    const abstract = cleanedText.slice(0, 200)

    console.log('[FallbackSummary] 使用清理后的文本作为摘要，长度:', abstract.length)

    return {
      abstract,
      keyPoints: [],
      topics: [],
      sentiment: 'neutral',
      confidence: 0.3
    }
  }

  /**
   * 清理字符串
   */
  private sanitizeString(value: any): string {
    if (typeof value !== 'string') return ''
    return value.trim().slice(0, 500) // 限制最大长度
  }

  /**
   * 清理并限制数组
   */
  private sanitizeArray(value: any, maxItems: number): string[] {
    if (!Array.isArray(value)) return []
    return value
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, maxItems)
  }

  /**
   * 限制数字范围
   */
  private clampNumber(value: any, min: number, max: number): number {
    if (typeof value !== 'number') return (min + max) / 2
    return Math.max(min, Math.min(max, value))
  }

  isReady(): boolean {
    return this.isInitialized && this.engine !== null
  }

  getInitProgress(): number {
    return this.initProgress
  }

  async dispose(): Promise<void> {
    if (this.engine) {
      await this.engine.unload()
      this.engine = null
      this.isInitialized = false
      this.initProgress = 0
    }
  }
}
