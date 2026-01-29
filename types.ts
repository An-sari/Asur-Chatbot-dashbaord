
export interface ClientConfig {
  id: string;
  user_id: string;
  name: string;
  primary_color: string;
  greeting: string;
  system_instruction: string;
  thinking_enabled: boolean;
  thinking_budget: number;
  authorized_origins: string[];
  created_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
  isThinking?: boolean;
}

export interface ChatWidgetProps {
  clientId: string;
  configOverride?: Partial<ClientConfig>;
}

export interface Lead {
  id: string;
  client_id: string;
  name: string;
  email: string;
  phone: string;
  chat_transcript: any;
  created_at: string;
}

export interface ApiKey {
  id: string;
  client_id: string;
  key: string;
  name: string;
  created_at: string;
}
