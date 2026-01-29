
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Accept',
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  // Fix: Removed manual process.env bridging to resolve "Property 'process' does not exist on type 'typeof globalThis'"
  // Following @google/genai guideline: "Do not define process.env".
  // Assume process.env.API_KEY is pre-configured and accessible in the execution context.

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

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are missing on the server.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: configError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: `Configuration for '${clientId}' not found. Verify record in Supabase.` }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fix: Initialize Gemini using mandated pattern
    // Always use new GoogleGenAI({ apiKey: process.env.API_KEY });
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // Ensure roles alternate correctly for the Gemini SDK (user/model)
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
        // Removed maxOutputTokens as per guidelines to avoid response blocking when using thinkingConfig.
        thinkingConfig: config.thinking_enabled ? { 
          thinkingBudget: Math.min(config.thinking_budget || 4000, 32768) 
        } : undefined
      },
    });

    // Fix: Access response.text directly (property, not method)
    if (!response.text) {
      throw new Error("Empty response from AI.");
    }

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
};
