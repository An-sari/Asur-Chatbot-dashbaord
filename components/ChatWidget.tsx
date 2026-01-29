import React, { useState, useEffect, useRef } from 'react';
import { runAnsuryEngine } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { DEFAULT_CONFIG } from '../constants';
import { ChatWidgetProps, ChatMessage, ClientConfig } from '../types';

const ChatWidget: React.FC<ChatWidgetProps> = ({ clientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadInfo, setLeadInfo] = useState({ name: '', email: '', phone: '' });
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoadError(null);
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (data) {
        setConfig(data);
      } else {
        console.warn('Supabase record not found for ID:', clientId);
        setLoadError(`Configuration for '${clientId}' not found in database.`);
      }
    };
    fetchConfig();

    const channel = supabase.channel(`live-${clientId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${clientId}` }, 
      (payload) => setConfig(payload.new as any))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  useEffect(() => {
    if (config) {
      setMessages([{ role: 'assistant', content: config.greeting }]);
    } else if (loadError) {
      setMessages([{ role: 'assistant', content: `System Status: ${loadError} Please go to the dashboard and "Initialize Node" for this client.` }]);
    }
  }, [config, loadError]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || showLeadForm) return;
    if (!config) {
      alert("Cannot send message: Configuration not loaded.");
      return;
    }

    const userText = input;
    const currentMessages = [...messages];
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsTyping(true);

    const userCount = currentMessages.filter(m => m.role === 'user').length + 1;
    if (userCount >= 3) setShowLeadForm(true);

    try {
      const aiResponse = await runAnsuryEngine(userText, currentMessages, config);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse || "I am processing your high-priority request." }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Engine Error: ${error.message || "Connection interrupted."}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('leads').insert({
      client_id: clientId,
      name: leadInfo.name,
      email: leadInfo.email,
      chat_transcript: messages
    });
    if (!error) {
      setShowLeadForm(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Thank you. An executive will contact you shortly." }]);
    } else {
      alert(`Lead submission failed: ${error.message}`);
    }
  };

  const activeConfig = config || DEFAULT_CONFIG;

  return (
    <div className="fixed bottom-8 right-8 z-[2147483647] font-sans selection:bg-indigo-100">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: activeConfig.primary_color }}
          className="w-16 h-16 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95 group border border-white/20"
        >
          <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      ) : (
        <div className="bg-white w-[420px] h-[720px] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border border-slate-200/50 animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-500">
          <div className="p-10 text-white relative overflow-hidden" style={{ backgroundColor: activeConfig.primary_color }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.25rem] flex items-center justify-center font-black text-2xl shadow-inner">
                  {activeConfig.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight leading-none mb-1.5">{activeConfig.name}</h3>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                    Priority Session
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#FAFBFE]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] px-6 py-4.5 rounded-[2rem] text-[14px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-[0_4px_12px_rgba(0,0,0,0.03)]'}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {showLeadForm && (
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-6 animate-in zoom-in-95 ring-1 ring-slate-100">
                <div className="text-center">
                  <h4 className="font-black text-slate-900 text-xl tracking-tight">Confirm Identity</h4>
                  <p className="text-xs text-slate-500 font-medium">To proceed with high-ticket verification.</p>
                </div>
                <form onSubmit={submitLead} className="space-y-3">
                  <input required placeholder="Full Name" className="w-full bg-slate-50 border-none rounded-2xl p-4.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium" onChange={e => setLeadInfo({...leadInfo, name: e.target.value})} />
                  <input required type="email" placeholder="Business Email" className="w-full bg-slate-50 border-none rounded-2xl p-4.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium" onChange={e => setLeadInfo({...leadInfo, email: e.target.value})} />
                  <button type="submit" className="w-full text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all active:scale-95" style={{ backgroundColor: activeConfig.primary_color }}>
                    Apply for Access
                  </button>
                </form>
              </div>
            )}

            {isTyping && (
              <div className="flex items-center space-x-3 text-slate-400">
                <div className="flex space-x-1.5 bg-white border border-slate-100 px-4 py-3 rounded-full shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {activeConfig.thinking_enabled ? 'Synthesizing Intelligence' : 'Processing'}
                </span>
              </div>
            )}
          </div>

          {!showLeadForm && (
            <div className="p-10 bg-white border-t border-slate-50">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your inquiry..." 
                  className="w-full bg-slate-100/80 border-none rounded-[2rem] pl-8 pr-16 py-5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || !config}
                  className="absolute right-2 p-4 rounded-2xl text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-0"
                  style={{ backgroundColor: activeConfig.primary_color }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </form>
              <div className="mt-4 text-center">
                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">Ansury Systems Elite</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;