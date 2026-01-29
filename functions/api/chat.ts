
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

  try {
    const body = await request.json();
    const { clientId, messages } = body;
    const apiKeyHeader = request.headers.get('x-api-key');

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Missing clientId' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Initialize Supabase using environment variables passed in context
    // Cloudflare Pages Functions pass env vars through the context.env object
    const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are missing on the server.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Client Config
    const { data: config, error: configError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: `Client configuration for '${clientId}' not found. Ensure the client exists in your database.` }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Origin Validation
    const originHeader = request.headers.get('origin');
    const authorizedOrigins = config.authorized_origins || ['*'];
    if (!apiKeyHeader && authorizedOrigins[0] !== '*' && !authorizedOrigins.includes(originHeader || '')) {
       return new Response(JSON.stringify({ error: 'Unauthorized access origin' }), { 
         status: 403, 
         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       });
    }

    // Initialize Gemini following SDK Coding Guidelines strictly
    // Use process.env.API_KEY directly (assumed to be shimmed or available)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Model Selection based on configuration
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // Prepare contents and ensure roles alternate (user, model, user, model)
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Generate Content
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: config.system_instruction,
        temperature: 0.7,
        // reserved tokens for the response after thinking
        maxOutputTokens: config.thinking_enabled ? 16384 : undefined,
        thinkingConfig: config.thinking_enabled ? { 
          thinkingBudget: Math.min(config.thinking_budget || 4000, 32768) 
        } : undefined
      },
    });

    if (!response.text) {
      throw new Error("The AI model returned an empty response.");
    }

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('API Handler Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
};
