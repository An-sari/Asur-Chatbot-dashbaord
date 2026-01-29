
import { ChatMessage } from '../types';

export const runAnsuryEngine = async (
  prompt: string, 
  history: ChatMessage[], 
  config: any
) => {
  const env = (import.meta as any).env || {};
  const baseUrl = env.VITE_APP_URL || window.location.origin;
  const apiUrl = `${baseUrl}/api/chat`;

  // Standardize message format to send to backend
  const messages = [
    ...history,
    { role: 'user', content: prompt }
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: config.id,
      messages: messages
    })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch AI response';
    try {
      const err = await response.json();
      errorMessage = err.error || errorMessage;
    } catch (e) {
      // Handle non-JSON errors
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.text;
};
