
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { DEFAULT_CONFIG } from '../constants';
import { ChatWidgetProps, ChatMessage } from '../types';

const ChatWidget: React.FC<ChatWidgetProps> = ({ clientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadInfo, setLeadInfo] = useState({ name: '', email: '', phone: '' });
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Config + Real-time Sync
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (data) setConfig(data);
    };

    fetchConfig();

    const channel = supabase
      .channel(`widget-${clientId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'clients', 
        filter: `id=eq.${clientId}` 
      }, (payload) => {
        setConfig(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  // 2. Initial Greeting Logic
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: config.greeting }]);
    }
  }, [config.greeting]);

  // 3. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, showLeadForm]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || showLeadForm) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Trigger Lead Form after 3 user interactions
    const userMsgCount = messages.filter(m => m.role === 'user').length + 1;
    if (userMsgCount === 3) {
      setTimeout(() => setShowLeadForm(true), 1200);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: input }] }],
        config: { 
          systemInstruction: config.system_instruction,
          temperature: 0.7 
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('leads').insert({
      client_id: clientId,
      ...leadInfo,
      chat_transcript: messages
    });
    
    if (!error) {
      setShowLeadForm(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Thank you! Your information has been received. Our team will contact you shortly." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2147483647] font-sans antialiased">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: config.primary_color }}
          className="w-16 h-16 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-300 group"
        >
          <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[400px] h-[640px] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-12 fade-in duration-500">
          {/* Premium Header */}
          <div className="p-6 flex justify-between items-center text-white" style={{ backgroundColor: config.primary_color }}>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold text-lg">
                {config.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base leading-none mb-1">{config.name}</h3>
                <div className="flex items-center text-[10px] opacity-80 uppercase tracking-widest font-bold">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                  Always Active
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Chat Canvas */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {showLeadForm && (
              <div className="bg-white border border-indigo-50 p-6 rounded-3xl shadow-xl space-y-4 animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-slate-900">Book Your Strategy Session</h4>
                  <p className="text-xs text-slate-500">Our specialists are ready to help you scale.</p>
                </div>
                <form onSubmit={submitLead} className="space-y-3">
                  <input required placeholder="Name" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setLeadInfo({...leadInfo, name: e.target.value})} />
                  <input required type="email" placeholder="Business Email" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setLeadInfo({...leadInfo, email: e.target.value})} />
                  <input required placeholder="Phone Number" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" onChange={e => setLeadInfo({...leadInfo, phone: e.target.value})} />
                  <button type="submit" className="w-full text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:brightness-110 active:scale-[0.98] transition-all" style={{ backgroundColor: config.primary_color }}>
                    Secure Your Spot
                  </button>
                </form>
              </div>
            )}

            {isTyping && (
              <div className="flex items-center space-x-2 p-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          {!showLeadForm && (
            <div className="p-6 bg-white border-t border-slate-50">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask a question..." 
                  disabled={isTyping}
                  className="w-full bg-slate-100 border-none rounded-2xl pl-5 pr-14 py-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50" 
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 p-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-0"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </form>
              <div className="mt-3 text-center">
                <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Powered by Ansury Systems</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
