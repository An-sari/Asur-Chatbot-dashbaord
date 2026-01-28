
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
        if (data) setConfig(data);
        if (error) console.error('Config Fetch Error:', error);
      } catch (e) {
        console.error('Network Error:', e);
      }
    };

    fetchConfig();

    const channel = supabase
      .channel(`live-${clientId}`)
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

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: config.greeting }]);
    }
  }, [config.greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, showLeadForm]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || showLeadForm) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const userMsgCount = messages.filter(m => m.role === 'user').length + 1;
    if (userMsgCount === 3) {
      setTimeout(() => setShowLeadForm(true), 1000);
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
        config: { systemInstruction: config.system_instruction, temperature: 0.7 }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "..." }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Our team is currently offline. Please leave your details." }]);
      setShowLeadForm(true);
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
      setMessages(prev => [...prev, { role: 'assistant', content: "Success! We will reach out within 24 hours." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2147483647] font-sans antialiased text-slate-900">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: config.primary_color }}
          className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-all duration-300 group"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[400px] h-[640px] rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8">
          <div className="p-6 flex justify-between items-center text-white" style={{ backgroundColor: config.primary_color }}>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center font-bold">{config.name.charAt(0)}</div>
              <div>
                <h3 className="font-bold text-sm leading-none">{config.name}</h3>
                <span className="text-[10px] opacity-75 font-semibold uppercase tracking-wider">Verified Agent</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-lg"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border text-slate-700 shadow-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {showLeadForm && (
              <div className="bg-white border border-indigo-100 p-6 rounded-2xl shadow-lg space-y-4 animate-in zoom-in-95">
                <div className="text-center">
                  <h4 className="font-bold text-slate-900">Final Step</h4>
                  <p className="text-[11px] text-slate-500">Provide your contact info to continue this session with a human.</p>
                </div>
                <form onSubmit={submitLead} className="space-y-3">
                  <input required placeholder="Name" className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500" onChange={e => setLeadInfo({...leadInfo, name: e.target.value})} />
                  <input required type="email" placeholder="Email" className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500" onChange={e => setLeadInfo({...leadInfo, email: e.target.value})} />
                  <input required placeholder="Phone" className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500" onChange={e => setLeadInfo({...leadInfo, phone: e.target.value})} />
                  <button type="submit" className="w-full text-white py-3 rounded-xl font-bold text-xs shadow-md" style={{ backgroundColor: config.primary_color }}>Talk to an Expert</button>
                </form>
              </div>
            )}

            {isTyping && <div className="flex space-x-1 p-2"><div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
          </div>

          {!showLeadForm && (
            <div className="p-4 bg-white border-t border-slate-50">
              <form onSubmit={handleSendMessage} className="relative">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your inquiry..." className="w-full bg-slate-100 border-none rounded-xl pl-4 pr-12 py-3 text-xs focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" disabled={!input.trim()} className="absolute right-2 top-1.5 p-1.5 rounded-lg text-white disabled:opacity-0 transition-opacity" style={{ backgroundColor: config.primary_color }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
              <div className="mt-2 text-center text-[9px] text-slate-400 uppercase tracking-widest font-bold">Secure Ansury Link</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Library Export Logic
export function mount(element: HTMLElement, props: ChatWidgetProps) {
  const root = ReactDOM.createRoot(element);
  root.render(<ChatWidget {...props} />);
}

export default ChatWidget;
