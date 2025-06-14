
export interface AIChatProps {
  data: any[];
  columns: any[];
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

export interface Column {
  key: string;
  label: string;
  type: string;
}
