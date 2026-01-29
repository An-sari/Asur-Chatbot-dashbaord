
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

    // 3. Simple Auth (Origin Check or API Key)
    const origin = request.headers.get('origin');
    if (!apiKeyHeader && config.authorized_origins?.[0] !== '*' && !config.authorized_origins?.includes(origin || '')) {
       return new Response(JSON.stringify({ error: 'Unauthorized origin' }), { 
         status: 403, 
         headers: corsHeaders 
       });
    }

    // 4. Initialize Gemini
    // Fix: Obtained API key exclusively from process.env.API_KEY as required by coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // 5. Prepare Payload
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const lastMessage = messages[messages.length - 1].content;

    // 6. Generate Content
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMessage }] }
      ],
      config: {
        systemInstruction: config.system_instruction,
        temperature: 0.7,
        thinkingConfig: config.thinking_enabled ? { thinkingBudget: config.thinking_budget || 2000 } : undefined
      },
    });

    // Fix: Access .text property directly (not a method) as per guidelines.
    return new Response(JSON.stringify({ text: response.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Pages Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
