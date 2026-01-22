
export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  columns: string[];
  rowCount: number;
  preview: any[];
  data: any[];
  analysis?: FileAnalysis;
}

export interface FileAnalysis {
  dataTypes: Record<string, string>;
  summary: string;
}

export interface CrossFileAnalysis {
  commonColumns: string[];
  similarColumns: Array<{ col1: string; col2: string; files: string[] }>;
  duplicateCount: number;
  structureMatch: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: string[]; // URLs or IDs of generated files
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  CHATTING = 'CHATTING',
  PROCESSING = 'PROCESSING'
}
