
import { ChatMessage } from '../types';

export const runAnsuryEngine = async (
  prompt: string, 
  history: ChatMessage[], 
  config: any
) => {
  const env = (import.meta as any).env || {};
  const origin = window.location.origin;
  
  // Cleanly construct the URL by removing trailing slash from base and leading slash from path
  const baseUrl = (env.VITE_APP_URL || origin).replace(/\/$/, '');
  const apiUrl = `${baseUrl}/api/chat`;

  // Standardize message format to send to backend
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
      let errorMessage = `API Error: ${response.status}`;
      try {
        const err = await response.json();
        errorMessage = err.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        if (text) errorMessage = text.substring(0, 100);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.text) {
      throw new Error('Incomplete response from AI engine');
    }
    return data.text;
  } catch (error: any) {
    console.error('Engine connection failed:', error);
    throw error;
  }
};
