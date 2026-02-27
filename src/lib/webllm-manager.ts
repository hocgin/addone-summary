import * as webllm from '@mlc-ai/web-llm'
import type { StructuredSummary, WebLLMProgress } from '../types'
import { DEFAULT_MODEL, SUMMARY_PROMPT, ERROR_MESSAGES } from '../utils/constants'

export class WebLLMManager {
  private static instance: WebLLMManager | null = null
  private engine: webllm.MLCEngine | null = null
  private readonly model: string
  private isInitialized: boolean = false
  private initProgress: number = 0
  private progressStage: string = ''
  private startTime: number = 0

  private constructor(model: string = DEFAULT_MODEL) {
    this.model = model
  }

  static getInstance(): WebLLMManager {
    if (!WebLLMManager.instance) {
      WebLLMManager.instance = new WebLLMManager()
    }
    return WebLLMManager.instance
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

    try {
      const prompt = SUMMARY_PROMPT.replace('{text}', text)

      progressCallback?.(0)

      const chunks = await this.engine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: '你是一个专业的网页内容分析助手，擅长提取关键信息和生成结构化摘要。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
      })

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
    try {
      let cleaned = response.trim()
      
      // 尝试提取 markdown 代码块内容
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
      const match = cleaned.match(codeBlockRegex)
      
      if (match && match[1]) {
        cleaned = match[1].trim()
      } else {
        // 如果没有完整的代码块，尝试去除开头和结尾的标记
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(cleaned)

      return {
        abstract: parsed.abstract || '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
          ? parsed.sentiment
          : 'neutral',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
      }
    } catch (error) {
      console.error('Failed to parse summary:', error)
      console.log('Raw response:', response)
      return {
        abstract: response.replace(/```(?:json)?|```/g, '').trim().slice(0, 500),
        keyPoints: [],
        topics: [],
        sentiment: 'neutral',
        confidence: 0.3
      }
    }
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
