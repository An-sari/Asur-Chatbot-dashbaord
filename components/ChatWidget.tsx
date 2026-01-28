
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { MOCK_CLIENTS, DEFAULT_CONFIG } from '../constants';
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

  // 1. Initial Config Fetch + Real-time Subscription
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (data) setConfig(data);
    };

    fetchConfig();

    const channel = supabase
      .channel('config-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${clientId}` }, 
      (payload) => {
        setConfig(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  // 2. Set Initial Greeting
  useEffect(() => {
    setMessages([{ role: 'assistant', content: config.greeting }]);
  }, [config.greeting]);

  // 3. Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Trigger Lead Form after 3 user messages
    const userMsgCount = messages.filter(m => m.role === 'user').length + 1;
    if (userMsgCount === 3) {
      setTimeout(() => setShowLeadForm(true), 1500);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: input }] }],
        config: { systemInstruction: config.system_instruction, temperature: 0.7 }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "" }]);
    } catch (error) {
      console.error(error);
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
      setMessages(prev => [...prev, { role: 'assistant', content: "Perfect! One of our experts will contact you shortly." }]);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[99999] font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: config.primary_color }}
          className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[380px] h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5">
          <div className="p-5 flex justify-between items-center text-white" style={{ backgroundColor: config.primary_color }}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">A</div>
              <h3 className="font-bold">{config.name}</h3>
            </div>
            <button onClick={() => setIsOpen(false)}><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {showLeadForm && (
              <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-lg space-y-4 animate-in zoom-in-95">
                <h4 className="font-bold text-slate-800 text-center">Book a Consultation</h4>
                <p className="text-xs text-slate-500 text-center">Enter your details and an advisor will reach out.</p>
                <form onSubmit={submitLead} className="space-y-3">
                  <input required placeholder="Full Name" className="w-full border rounded-lg p-2 text-sm" onChange={e => setLeadInfo({...leadInfo, name: e.target.value})} />
                  <input required type="email" placeholder="Email Address" className="w-full border rounded-lg p-2 text-sm" onChange={e => setLeadInfo({...leadInfo, email: e.target.value})} />
                  <input required placeholder="Phone Number" className="w-full border rounded-lg p-2 text-sm" onChange={e => setLeadInfo({...leadInfo, phone: e.target.value})} />
                  <button type="submit" className="w-full text-white py-2 rounded-lg font-bold text-sm shadow-md" style={{ backgroundColor: config.primary_color }}>Submit Inquiry</button>
                </form>
              </div>
            )}

            {isTyping && <div className="text-xs text-slate-400 italic">Typing...</div>}
          </div>

          {!showLeadForm && (
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex space-x-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type message..." className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none" />
              <button type="submit" className="p-2 rounded-full text-white" style={{ backgroundColor: config.primary_color }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
