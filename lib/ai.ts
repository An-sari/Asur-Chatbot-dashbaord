
import { ChatMessage } from '../types';

/**
 * Ansury Systems - AI Orchestration Engine
 * Handles communication with the backend inference nodes.
 */
export const runAnsuryEngine = async (
  prompt: string, 
  history: ChatMessage[], 
  config: any
) => {
  const env = (import.meta as any).env || {};
  const origin = window.location.origin;
  
  // Try to use relative API path first for maximum compatibility
  const apiUrl = '/api/chat';

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

    const data = await response.json();

    if (!response.ok) {
      // Return the actual error message from the server if available
      if (data.error) {
        throw new Error(data.error);
      }

      switch (response.status) {
        case 401:
          throw new Error("Security verification failed. Invalid API credentials.");
        case 404:
          throw new Error(`Intelligence Node '${config.id}' not found.`);
        case 429:
          throw new Error("Rate limit exceeded. Please wait a moment.");
        case 500:
          throw new Error("Internal Engine Error (500). Please check your environment variables.");
        default:
          throw new Error(`Engine Link Failure (${response.status})`);
      }
    }

    return data.text;
  } catch (error: any) {
    console.error('Ansury Engine Link Failure:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Network error. Unable to reach the AI backbone.");
    }
    throw error;
  }
};
