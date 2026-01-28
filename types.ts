
export interface ClientConfig {
  id: string;
  user_id: string; // Linked to Auth
  name: string;
  primary_color: string;
  greeting: string;
  system_instruction: string;
  logo_url?: string;
  authorized_origins: string[];
  created_at?: string;
}

export interface ApiKey {
  id: string;
  client_id: string;
  key: string;
  name: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatWidgetProps {
  clientId: string;
  configOverride?: Partial<ClientConfig>;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
}
