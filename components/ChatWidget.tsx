
import React, { useState, useEffect, useRef } from 'react';
import { runAnsuryEngine } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { DEFAULT_CONFIG, MOCK_CLIENTS } from '../constants';
import { ChatWidgetProps, ChatMessage, ClientConfig } from '../types';

const ChatWidget: React.FC<ChatWidgetProps> = ({ clientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle cross-window communication for embedding
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: isOpen ? 'ansury-expand' : 'ansury-collapse' }, '*');
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (data && !error) {
          setConfig(data);
          setIsLive(true);
        } else {
          if (MOCK_CLIENTS[clientId]) {
            setConfig(MOCK_CLIENTS[clientId]);
            setIsLive(false);
          } else {
            setLoadError(`Node '${clientId}' not initialized.`);
          }
        }
      } catch (err: any) {
        if (MOCK_CLIENTS[clientId]) {
          setConfig(MOCK_CLIENTS[clientId]);
          setIsLive(false);
        } else {
          setLoadError('Database sync offline.');
        }
      }
    };

    fetchConfig();
  }, [clientId]);

  useEffect(() => {
    if (config) {
      setMessages([{ role: 'assistant', content: config.greeting }]);
    }
  }, [config]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || showLeadForm) return;
    
    const activeConfig = config || DEFAULT_CONFIG;
    const userText = input;
    const currentMessages = [...messages];
    
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await runAnsuryEngine(userText, currentMessages, activeConfig);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: error.message }]);
    } finally {
      setIsTyping(false);
    }
  };

  const displayConfig = config || MOCK_CLIENTS[clientId] || DEFAULT_CONFIG;

  return (
    <div className={`fixed bottom-4 right-4 z-[2147483647] font-sans transition-all duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-0'}`}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: displayConfig.primary_color }}
          className="w-16 h-16 rounded-3xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all border border-white/20"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      ) : (
        <div className="bg-white w-[380px] h-[600px] sm:w-[400px] sm:h-[650px] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 text-white relative" style={{ backgroundColor: displayConfig.primary_color }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl">
                  {displayConfig.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{displayConfig.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-amber-400 animate-pulse'}`}></span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
                      {isLive ? 'Verified Live Node' : 'Simulated Session'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest">Generating Insight</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Inquire..." 
                className="w-full bg-slate-100 border-none rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
              <button type="submit" disabled={!input.trim()} className="absolute right-1.5 p-3 rounded-full text-white shadow-lg transition-all active:scale-95 disabled:opacity-0" style={{ backgroundColor: displayConfig.primary_color }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
