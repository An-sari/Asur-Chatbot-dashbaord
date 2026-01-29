
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
  
  const baseUrlString = env.VITE_APP_URL || origin;
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
      // Ansury High-Ticket Branded Error Handling
      switch (response.status) {
        case 401:
          throw new Error("Security verification failed. This domain is not authorized for the requested AI node.");
        case 403:
          throw new Error("Access denied. Please ensure your subscription or API key is active.");
        case 404:
          throw new Error("Intelligence Node not found. The agent configuration may have been moved or deleted.");
        case 429:
          throw new Error("Priority traffic limit exceeded. Please wait a moment for the engine to clear its queue.");
        case 500:
          throw new Error("Synthesizer offline. Our high-performance compute node is currently restarting.");
        case 503:
          throw new Error("The system is undergoing scheduled maintenance. Please return in a few minutes.");
        default: {
          const errorText = await response.text();
          try {
            const errJson = JSON.parse(errorText);
            throw new Error(errJson.error || `System Latency (${response.status})`);
          } catch (e) {
            throw new Error(`Connection interrupted (${response.status}). Please verify your network link.`);
          }
        }
      }
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('Ansury Engine Link Failure:', error);
    // If it's a native fetch error (like DNS or offline)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Network connectivity lost. Unable to reach the Ansury intelligence backbone.");
    }
    throw error;
  }
};
