import { ipcMain } from 'electron';
import { createParser } from 'eventsource-parser';

import { AI_EVENT } from '../constant';
import { normalizeUrl, toErrorMessage } from '../uitls';

export interface LLMConfig {
  apiHost: string;
  apiKey: string;
  modelName: string;
}

export interface ModelConfig {
  systemPrompt: string;
  topP: number;
  temperature: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  localPath: string;
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content:
    | string
    | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
  attachments?: FileAttachment[];
}

export interface AIRequest {
  requestId: string;
  llmConfig: LLMConfig;
  modelConfig: ModelConfig;
  messages: ChatMessage[];
}

export interface AIStreamChunk {
  type: 'chunk' | 'complete' | 'error' | 'reasoning_content';
  content?: string;
  reasoning_content?: string;
  error?: string;
}

const decoder = new TextDecoder();

const defaultModelConfig: ModelConfig = {
  systemPrompt: '',
  topP: 1,
  temperature: 1
};

class StreamContext {
  readonly event: Electron.IpcMainInvokeEvent;
  readonly eventChannel: string;
  response = '';
  reasoning = '';
  completed = false;

  constructor(event: Electron.IpcMainInvokeEvent, eventChannel: string) {
    this.event = event;
    this.eventChannel = eventChannel;
  }

  sendChunk(content: string) {
    this.response += content;
    this.event.sender.send(this.eventChannel, { type: 'chunk', content } as AIStreamChunk);
  }

  sendReasoning(content: string) {
    this.reasoning += content;
    this.event.sender.send(this.eventChannel, {
      type: 'reasoning_content',
      reasoning_content: content
    } as AIStreamChunk);
  }

  sendComplete() {
    this.event.sender.send(this.eventChannel, {
      type: 'complete',
      content: this.response,
      reasoning_content: this.reasoning || undefined
    } as AIStreamChunk);
  }

  sendError(error: string) {
    this.event.sender.send(this.eventChannel, { type: 'error', error } as AIStreamChunk);
  }
}

class AIHandler {
  private abortControllers = new Map<string, AbortController>();

  async sendMessageStreaming(ctx: StreamContext, request: AIRequest): Promise<void> {
    const abortController = new AbortController();
    this.abortControllers.set(request.requestId, abortController);

    try {
      const modelConfig = request.modelConfig || defaultModelConfig;
      const apiMessages = this.prepareApiMessages(request.messages, modelConfig);

      const response = await this.fetchStreamingResponse(
        request,
        apiMessages,
        modelConfig,
        abortController
      );

      if (!response.ok) {
        ctx.sendError(`HTTP error! status: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        ctx.sendError('No response body reader available');
        return;
      }

      const parser = this.createStreamParser(ctx);
      await this.processStreamResponse(reader, parser, ctx);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        ctx.sendComplete();
      } else {
        ctx.sendError(toErrorMessage(error));
      }
    } finally {
      this.abortControllers.delete(request.requestId);
    }
  }

  stopStreaming(requestId: string): void {
    const abortController = this.abortControllers.get(requestId);
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(requestId);
    }
  }

  async testConnection(config: LLMConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(normalizeUrl(config.apiHost, '/chat/completions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.modelName,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });

      return response.ok
        ? { success: true }
        : {
            success: false,
            error: `HTTP ${response.status}: ${(await response.text()) || response.statusText}`
          };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, 'Connection failed') };
    }
  }

  async getModels(
    config: LLMConfig
  ): Promise<{ success: boolean; models?: string[]; error?: string }> {
    try {
      const response = await fetch(normalizeUrl(config.apiHost, '/models'), {
        method: 'GET',
        headers: { Authorization: `Bearer ${config.apiKey}` }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      const models: string[] = data.data?.map((m: { id: string }) => m.id) || [];
      return { success: true, models };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, 'Failed to fetch models') };
    }
  }

  private prepareApiMessages(messages: ChatMessage[], modelConfig: ModelConfig): ChatMessage[] {
    const apiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    if (
      modelConfig.systemPrompt &&
      (apiMessages.length === 0 || apiMessages[0].role !== 'system')
    ) {
      apiMessages.unshift({ role: 'system', content: modelConfig.systemPrompt });
    }

    return apiMessages;
  }

  private fetchStreamingResponse(
    request: AIRequest,
    apiMessages: ChatMessage[],
    modelConfig: ModelConfig,
    abortController: AbortController
  ): Promise<Response> {
    return fetch(normalizeUrl(request.llmConfig.apiHost, '/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.llmConfig.apiKey}`
      },
      body: JSON.stringify({
        model: request.llmConfig.modelName,
        messages: apiMessages,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        stream: true
      }),
      signal: abortController.signal
    });
  }

  private createStreamParser(ctx: StreamContext) {
    return createParser({
      onEvent: (eventData) => {
        if (eventData.data === '[DONE]') {
          ctx.completed = true;
          ctx.sendComplete();
          return;
        }

        try {
          const parsed = JSON.parse(eventData.data);
          const delta = parsed.choices?.[0]?.delta;
          const content = delta?.content;
          const reasoningContent =
            delta?.reasoning_content ||
            delta?.reasoning ||
            parsed.reasoning_content ||
            parsed.reasoning;

          if (content) ctx.sendChunk(content);
          if (reasoningContent) ctx.sendReasoning(reasoningContent);
        } catch {
          console.warn('Failed to parse streaming data');
        }
      }
    });
  }

  private async processStreamResponse(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    parser: ReturnType<typeof createParser>,
    ctx: StreamContext
  ): Promise<void> {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }

      if (!ctx.completed) ctx.sendComplete();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (!ctx.completed) ctx.sendComplete();
      } else {
        ctx.sendError(toErrorMessage(error));
      }
    }
  }
}

const aiHandler = new AIHandler();

export const registerAIHandlers = () => {
  ipcMain.handle(AI_EVENT.SEND_STREAM, (event, request: AIRequest, eventChannel: string) =>
    aiHandler.sendMessageStreaming(new StreamContext(event, eventChannel), request)
  );
  ipcMain.handle(AI_EVENT.STOP_STREAM, (_event, requestId: string) =>
    aiHandler.stopStreaming(requestId)
  );
  ipcMain.handle(AI_EVENT.TEST_CONNECTION, (_event, config: LLMConfig) =>
    aiHandler.testConnection(config)
  );
  ipcMain.handle(AI_EVENT.GET_MODELS, (_event, config: LLMConfig) => aiHandler.getModels(config));
};
