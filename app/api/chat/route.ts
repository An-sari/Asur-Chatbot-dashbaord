
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { clientId, messages } = await req.json();
    const apiKeyHeader = req.headers.get('x-api-key');

    // 1. Fetch Client Config from Supabase
    const { data: config, error: configError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (configError || !config) {
      console.error('Supabase config fetch error:', configError);
      return new Response('Client configuration not found', { status: 404 });
    }

    // 2. Authentication: Check API Key if present, otherwise fallback to Origin check
    // In a high-ticket system, we prefer explicit API keys.
    if (apiKeyHeader) {
      const { data: keyRecord, error: keyError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('client_id', clientId)
        .eq('key', apiKeyHeader)
        .single();

      if (keyError || !keyRecord) {
        return new Response('Invalid API Key', { status: 401 });
      }
    } else {
      // Basic security: Validate Origin if no API key is provided
      const origin = req.headers.get('origin');
      const authorizedOrigins = config.authorized_origins || ['*'];
      if (authorizedOrigins[0] !== '*' && !authorizedOrigins.includes(origin || '')) {
        return new Response('Unauthorized Access. Provide an API key or use an authorized origin.', { status: 403 });
      }
    }

    // 3. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 4. Prepare Chat Context
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));
    const lastMessage = messages[messages.length - 1].content;

    // 5. Generate Content
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMessage }] }
      ],
      config: {
        systemInstruction: config.system_instruction,
        temperature: 0.7,
      },
    });

    return new Response(JSON.stringify({ text: response.text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
