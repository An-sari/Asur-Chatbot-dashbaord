
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { runAnsuryEngine } from '../lib/ai';
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
  const [config, setConfig] = useState({...DEFAULT_CONFIG, thinking_enabled: false, thinking_budget: 0});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (data) setConfig(data);
    };
    fetchConfig();

    const channel = supabase.channel(`live-${clientId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${clientId}` }, 
      (payload) => setConfig(payload.new as any))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  useEffect(() => {
    if (messages.length === 0) setMessages([{ role: 'assistant', content: config.greeting }]);
  }, [config.greeting]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || showLeadForm) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsTyping(true);

    if (messages.filter(m => m.role === 'user').length >= 2) {
      setShowLeadForm(true);
    }

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const aiResponse = await runAnsuryEngine(userText, history, config);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse || "I am analyzing your request..." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection peak reached. One moment..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[999999] font-sans">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: config.primary_color }}
          className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 group"
        >
          <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      ) : (
        <div className="bg-white w-[420px] h-[680px] rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="p-8 text-white flex justify-between items-center" style={{ backgroundColor: config.primary_color }}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-xl">{config.name.charAt(0)}</div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight leading-none mb-1">{config.name}</h3>
                <div className="flex items-center text-[10px] font-bold uppercase tracking-widest opacity-80">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  AI Concierge Active
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                <div className={`max-w-[88%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {showLeadForm && (
              <div className="bg-white p-8 rounded-[2rem] border border-indigo-50 shadow-xl space-y-5 animate-in zoom-in-95">
                <div className="text-center">
                  <h4 className="font-bold text-slate-900 text-lg">VIP Consultation</h4>
                  <p className="text-xs text-slate-500">Secure your private strategy session below.</p>
                </div>
                <form className="space-y-3">
                  <input placeholder="Name" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                  <input type="email" placeholder="Business Email" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                  <button type="button" className="w-full text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all" style={{ backgroundColor: config.primary_color }}>
                    Join the Waitlist
                  </button>
                </form>
              </div>
            )}

            {isTyping && (
              <div className="flex space-x-1.5 p-2 items-center text-slate-400 italic text-[10px] uppercase font-bold tracking-widest">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span>{config.thinking_enabled ? 'Analyzing Strategy...' : 'Typing...'}</span>
              </div>
            )}
          </div>

          {!showLeadForm && (
            <div className="p-8 bg-white border-t border-slate-50">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about our premium services..." 
                  className="w-full bg-slate-100 border-none rounded-[1.5rem] pl-6 pr-14 py-4.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 p-3 rounded-2xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-0"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function mount(element: HTMLElement, props: any) {
  ReactDOM.createRoot(element).render(<ChatWidget {...props} />);
}

export default ChatWidget;
