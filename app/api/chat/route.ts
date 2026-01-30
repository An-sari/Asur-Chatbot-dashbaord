
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../../lib/supabase';

// Hardcoded fallbacks for testing/demo purposes
const MOCK_BACKEND_CONFIGS: Record<string, any> = {
  'ansury-lux-123': {
    name: 'Elite Estates AI',
    system_instruction: 'You are an elite sales concierge for a luxury real estate firm. Be sophisticated, professional, and focus on high-ticket property details. Always try to qualify the lead by asking about their budget or preferred location.',
    thinking_enabled: true,
    thinking_budget: 4000
  },
  'ansury-saas-456': {
    name: 'TechFlow Assistant',
    system_instruction: 'You are a helpful SaaS sales engineer. Focus on technical features, ROI, and ease of integration. Your goal is to get the user to book a demo.',
    thinking_enabled: false,
    thinking_budget: 0
  }
};

export async function POST(req: Request) {
  try {
    const { clientId, messages } = await req.json();
    const apiKeyHeader = req.headers.get('x-api-key');

    let config = null;

    // 1. Try to fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (data && !error) {
        config = data;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, checking demo cache...');
    }

    // 2. Fallback to mock for demo purposes
    if (!config) {
      config = MOCK_BACKEND_CONFIGS[clientId];
    }

    if (!config) {
      return new Response(JSON.stringify({ error: `Intelligence Node '${clientId}' not found.` }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Authentication check (Skip for mock IDs)
    if (!MOCK_BACKEND_CONFIGS[clientId]) {
      if (apiKeyHeader) {
        const { data: keyRecord } = await supabase
          .from('api_keys')
          .select('*')
          .eq('client_id', clientId)
          .eq('key', apiKeyHeader)
          .single();

        if (!keyRecord) {
          return new Response('Invalid API Key', { status: 401 });
        }
      } else {
        const origin = req.headers.get('origin');
        const authorizedOrigins = config.authorized_origins || ['*'];
        if (authorizedOrigins[0] !== '*' && !authorizedOrigins.includes(origin || '')) {
          return new Response('Unauthorized Access.', { status: 403 });
        }
      }
    }

    // 4. Initialize Gemini (Correct SDK pattern)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Choose model based on capability
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: config.system_instruction,
        temperature: 0.7,
        thinkingConfig: config.thinking_enabled ? { 
          thinkingBudget: Math.min(config.thinking_budget || 4000, 32768) 
        } : undefined
      },
    });

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
