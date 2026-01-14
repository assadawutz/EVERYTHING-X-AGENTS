
export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

export interface AppState {
  code: string;
  logs: LogEntry[];
  isProcessing: boolean;
  theme: 'light' | 'dark';
}

export type ModelTier = 'fast' | 'smart' | 'ultra';

export interface ModelConfig {
  id: string;
  tier: ModelTier;
  name: string;
  description: string;
  thinkingBudget: number; // 0 for disabled
  inputCostPer1M: number; // USD
  outputCostPer1M: number; // USD
}

export interface GenerateOptions {
  modelConfig: ModelConfig;
  systemInstruction?: string;
}
