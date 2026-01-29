
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

// Handle Preflight requests
export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const { clientId, messages } = await request.json();
    const apiKeyHeader = request.headers.get('x-api-key');

    // 1. Initialize Supabase
    // Using env provided by Cloudflare context
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
    );

    // 2. Fetch Client Config
    const { data: config, error: configError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (configError || !config) {
      console.error('Config fetch error:', configError);
      return new Response(JSON.stringify({ error: 'Client configuration not found' }), { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // 3. Auth Validation
    const origin = request.headers.get('origin');
    if (!apiKeyHeader && config.authorized_origins?.[0] !== '*' && !config.authorized_origins?.includes(origin || '')) {
       return new Response(JSON.stringify({ error: 'Unauthorized access origin' }), { 
         status: 403, 
         headers: corsHeaders 
       });
    }

    // 4. Initialize Gemini
    // CRITICAL: Cloudflare Pages environment variables are in env, not process.env
    const geminiApiKey = env.API_KEY || process.env.API_KEY;
    if (!geminiApiKey) {
        return new Response(JSON.stringify({ error: 'API Key configuration missing on server' }), { 
          status: 500, 
          headers: corsHeaders 
        });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    // Use gemini-3-pro-preview for complex sales tasks or when thinking is enabled
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // 5. Prepare Payload with correct role mapping
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.parts?.[0]?.text }]
    }));

    // 6. Generate Content
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: config.system_instruction,
        temperature: 0.7,
        // When setting thinkingBudget, maxOutputTokens MUST be set per guidelines
        maxOutputTokens: config.thinking_enabled ? 16384 : undefined,
        thinkingConfig: config.thinking_enabled ? { 
          thinkingBudget: Math.min(config.thinking_budget || 4000, 32768) 
        } : undefined
      },
    });

    if (!response.text) {
        throw new Error("Model failed to generate a text response.");
    }

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Pages Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
