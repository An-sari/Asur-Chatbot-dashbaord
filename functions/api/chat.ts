
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Accept',
};

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

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { clientId, messages } = body;

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Missing clientId' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let config = null;

    // 1. Try to fetch from Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();
        
        if (data && !error) {
          config = data;
        }
      } catch (dbError) {
        console.error('Database connection failed, checking mocks...');
      }
    }

    // 2. If not in DB, check hardcoded mocks for demo purposes
    if (!config) {
      config = MOCK_BACKEND_CONFIGS[clientId];
    }

    // 3. If still nothing, throw 404
    if (!config) {
      return new Response(JSON.stringify({ error: `Intelligence Node '${clientId}' not found in Database or Demo Cache.` }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 4. Initialize Gemini (Mandated Pattern)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Select model based on thinking requirement
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

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

    if (!response.text) {
      throw new Error("Empty response from AI engine.");
    }

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('API Engine Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
};
