
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

// Define tools for the AI to interact with the "MCP" data layer
const getProductDetails: FunctionDeclaration = {
  name: 'get_product_details',
  parameters: {
    type: Type.OBJECT,
    description: 'Get detailed specifications and pricing for a high-ticket item.',
    properties: {
      productId: { type: Type.STRING, description: 'The unique ID or name of the product.' }
    },
    required: ['productId']
  }
};

export const runAnsuryEngine = async (
  prompt: string, 
  history: any[], 
  config: any
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: config.system_instruction,
      temperature: 0.7,
      thinkingConfig: config.thinking_enabled ? { 
        thinkingBudget: config.thinking_budget || 2000 
      } : undefined,
      tools: [{ functionDeclarations: [getProductDetails] }]
    }
  });

  // Handle Tool Calls (Simple Mock for now, can be connected to Supabase)
  if (response.functionCalls) {
    console.log('AI requested data:', response.functionCalls);
    // In a real scenario, we'd execute the function and send tool response back
  }

  return response.text;
};
