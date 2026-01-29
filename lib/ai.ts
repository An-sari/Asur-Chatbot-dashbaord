
import { ChatMessage } from '../types';

export const runAnsuryEngine = async (
  prompt: string, 
  history: any[], 
  config: any
) => {
  // When embedded as a widget, we need the absolute URL to your Cloudflare Pages deployment
  // Set VITE_APP_URL in your Cloudflare Pages environment variables
  // Fix: Use type assertion for import.meta.env to resolve TS error
  const env = (import.meta as any).env || {};
  const baseUrl = env.VITE_APP_URL || window.location.origin;
  const apiUrl = `${baseUrl}/api/chat`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: config.id,
      messages: [...history, { role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch AI response';
    try {
      const err = await response.json();
      errorMessage = err.error || errorMessage;
    } catch (e) {
      // Not JSON response
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.text;
};
