
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MOCK_CLIENTS, DEFAULT_CONFIG } from '../constants';
import { ChatWidgetProps, ChatMessage } from '../types';

const ChatWidget: React.FC<ChatWidgetProps> = ({ clientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const clientData = MOCK_CLIENTS[clientId];
  // Map snake_case or camelCase consistently
  const config = {
    name: clientData?.name || DEFAULT_CONFIG.name,
    // Fix: Access primary_color instead of primaryColor from ClientConfig
    primaryColor: clientData?.primary_color || DEFAULT_CONFIG.primary_color,
    greeting: clientData?.greeting || DEFAULT_CONFIG.greeting,
    // Fix: Access system_instruction instead of systemInstruction from ClientConfig
    systemInstruction: clientData?.system_instruction || DEFAULT_CONFIG.system_instruction
  };

  useEffect(() => {
    setMessages([{ role: 'assistant', content: config.greeting }]);
  }, [clientId, config.greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Fix: Initialize GoogleGenAI using named parameter and direct process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history,
            { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          systemInstruction: config.systemInstruction,
          temperature: 0.7,
        }
      });

      // Fix: Use response.text property directly (not a method)
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI engine." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="ansury-widget-container fixed bottom-8 right-8 z-[1000] font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: config.primaryColor }}
          className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transform hover:scale-110 transition-all duration-300"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[400px] h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-5 flex justify-between items-center text-white" style={{ backgroundColor: config.primaryColor }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">{config.name.charAt(0)}</div>
              <div>
                <h3 className="font-bold text-sm">{config.name}</h3>
                <p className="text-[10px] opacity-80">Highly Secured Connection</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-1 rounded-full"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="bg-white border p-3 rounded-2xl animate-pulse text-xs text-slate-400">AI is thinking...</div></div>}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center space-x-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': config.primaryColor } as any}
            />
            <button type="submit" disabled={isTyping} className="p-2 rounded-full text-white" style={{ backgroundColor: config.primaryColor }}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
