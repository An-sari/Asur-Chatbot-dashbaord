
import { ChatMessage } from '../types';

export const runAnsuryEngine = async (
  prompt: string, 
  history: ChatMessage[], 
  config: any
) => {
  const env = (import.meta as any).env || {};
  const origin = window.location.origin;
  
  // Hardened URL construction
  const baseUrlString = env.VITE_APP_URL || origin;
  // Use URL constructor to handle slashes safely
  const apiUrl = new URL('/api/chat', baseUrlString.replace(/\/$/, '')).toString();

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        clientId: config.id,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errJson = JSON.parse(errorText);
        errorMessage = errJson.error || errorMessage;
      } catch (e) {
        if (errorText) errorMessage = errorText.substring(0, 100);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('Engine connection failed:', error);
    throw error;
  }
};
