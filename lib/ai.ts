
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from '@google/genai';
import { supabase } from './supabase';

/**
 * MCP-Style Tool Definitions
 * These allow the AI to interact with your business data dynamically.
 */
const get_business_info: FunctionDeclaration = {
  name: 'get_business_info',
  parameters: {
    type: Type.OBJECT,
    description: 'Get real-time details about products, pricing, or company history.',
    properties: {
      query: { type: Type.STRING, description: 'Specific information needed (e.g., "pricing for penthouse", "team background").' }
    },
    required: ['query']
  }
};

const check_availability: FunctionDeclaration = {
  name: 'check_availability',
  parameters: {
    type: Type.OBJECT,
    description: 'Check if a specific time slot or product is available.',
    properties: {
      item_name: { type: Type.STRING, description: 'The name of the service or product.' },
      date: { type: Type.STRING, description: 'The date/time in question.' }
    },
    required: ['item_name']
  }
};

const tools = [{ functionDeclarations: [get_business_info, check_availability] }];

export const runAnsuryEngine = async (
  prompt: string, 
  history: any[], 
  config: any
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = config.thinking_enabled ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  // 1. Initial Call to Model
  let response = await ai.models.generateContent({
    model: modelName,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: config.system_instruction,
      temperature: 0.7,
      thinkingConfig: config.thinking_enabled ? { 
        thinkingBudget: config.thinking_budget || 4000 
      } : undefined,
      tools: tools
    }
  });

  // 2. Recursive Tool Execution Loop (The "MCP" Layer)
  // If the model asks for tools, we execute them and send results back
  if (response.candidates?.[0]?.content?.parts.some(p => p.functionCall)) {
    const parts: any[] = [];
    
    for (const part of response.candidates[0].content.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        console.log(`Executing Tool: ${name}`, args);

        let toolResult = "Information not found.";
        
        // Mocking Data Fetches - In production, these query Supabase tables
        if (name === 'get_business_info') {
          toolResult = `Context for "${args.query}": We offer premium bespoke consulting starting at $50k/mo. Team includes ex-Fortune 500 CEOs.`;
        } else if (name === 'check_availability') {
          toolResult = `Status for ${args.item_name}: Only 2 slots remaining for Q3.`;
        }

        parts.push({
          functionResponse: {
            name: name,
            response: { result: toolResult }
          }
        });
      }
    }

    // Call model again with Tool results
    const secondResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] },
        response.candidates[0].content, // The tool call message
        { parts: parts } // The tool response message
      ],
      config: { 
        systemInstruction: config.system_instruction,
        thinkingConfig: config.thinking_enabled ? { thinkingBudget: config.thinking_budget } : undefined 
      }
    });

    return secondResponse.text;
  }

  return response.text;
};
