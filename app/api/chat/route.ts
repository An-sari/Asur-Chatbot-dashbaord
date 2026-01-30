
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../../lib/supabase';

const MOCK_BACKEND_CONFIGS: Record<string, any> = {
  'ansury-lux-123': {
    name: 'Elite Estates AI',
    system_instruction: 'You are an elite sales concierge for a luxury real estate firm. Be sophisticated, professional, and focus on high-ticket property details.',
    thinking_enabled: true,
    thinking_budget: 4000
  },
  'ansury-saas-456': {
    name: 'TechFlow Assistant',
    system_instruction: 'You are a helpful SaaS sales engineer. Your goal is to get the user to book a demo.',
    thinking_enabled: false,
    thinking_budget: 0
  }
};

export async function POST(req: Request) {
  try {
    const { clientId, messages } = await req.json();
    
    // VALIDATION: Critical check for Gemini API Key
    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Gemini API_KEY is missing in the environment. Please add it to your project settings.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
      console.warn('Supabase lookup failed, falling back to mock...');
    }

    // 2. Fallback to mock
    if (!config) {
      config = MOCK_BACKEND_CONFIGS[clientId];
    }

    if (!config) {
      return new Response(JSON.stringify({ error: `Node '${clientId}' not initialized.` }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const result = await ai.models.generateContent({
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

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return new Response(JSON.stringify({ 
      error: `Gemini Error: ${error.message || 'Unknown internal error'}` 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
