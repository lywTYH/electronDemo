export interface ModelConfig {
  id: string;
  name: string;
  systemPrompt: string;
  topP: number;
  temperature: number;
  createdAt: number;
}

export interface LLMConfig {
  id: string;
  name: string;
  apiHost: string;
  apiKey: string;
  modelName: string;
  createdAt: number;
  modelConfigId?: string;
}

export interface Settings {
  llmConfigs: LLMConfig[];
  defaultLLMId?: string;
  modelConfigs: ModelConfig[];
  defaultModelConfigId?: string;
  fontSize: 'small' | 'medium' | 'large';
  // promptLists: PromptListConfig[]
}
