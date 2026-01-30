
import React, { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import Dashboard from './components/Dashboard';
import { MOCK_CLIENTS } from './constants';
import { ClientConfig } from './types';
import { useAuth } from './lib/auth';

const App: React.FC = () => {
  const [view, setView] = useState<'preview' | 'dashboard' | 'widget-only'>('preview');
  const [selectedClientId, setSelectedClientId] = useState<string>('ansury-lux-123');
  const auth = useAuth();

  // Handle URL parameters for embedding and client selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('clientId');
    const embedded = params.get('embedded');

    if (clientId) {
      setSelectedClientId(clientId);
    }

    if (embedded === 'true') {
      setView('widget-only');
      // Set body to transparent and no scroll for iframe
      document.body.style.overflow = 'hidden';
      document.body.style.background = 'transparent';
      // Important for iframes to allow transparency
      const html = document.documentElement;
      html.style.background = 'transparent';
    }
  }, []);

  const [liveConfig, setLiveConfig] = useState<ClientConfig>({
    id: 'ansury-lux-123',
    user_id: 'user_123',
    name: 'Elite Estates AI',
    primary_color: '#B8860B',
    greeting: 'Welcome to Elite Estates. How can I assist you?',
    system_instruction: 'You are an elite sales concierge...',
    thinking_enabled: true,
    thinking_budget: 4000,
    authorized_origins: ['*']
  });

  if (view === 'widget-only') {
    return (
      <div className="h-screen w-screen bg-transparent overflow-hidden">
        <ChatWidget clientId={selectedClientId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-50">
        <div className="flex items-center space-x-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ansury Systems</h1>
          </div>
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('preview')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Live Site Preview
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Client Dashboard
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {view === 'preview' && (
            <div className="flex items-center space-x-2 mr-4 pr-4 border-r border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulate Client:</span>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="rounded-md border-slate-300 text-xs focus:ring-indigo-500 focus:border-indigo-500 p-1 border"
              >
                {Object.keys(MOCK_CLIENTS).map(id => (
                  <option key={id} value={id}>{MOCK_CLIENTS[id].name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-900">{auth.data.user.name}</p>
              <p className="text-xs text-slate-500">{auth.data.user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
              AR
            </div>
          </div>
        </div>
      </header>

      {view === 'preview' ? (
        <main className="flex-1 overflow-y-auto p-12">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl p-16 shadow-xl border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
              <div className="max-w-2xl space-y-8 relative z-10">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase tracking-widest">Client Website Simulator</span>
                <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Experience the future of <span className="text-indigo-600">High-Ticket Sales</span>.
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  The Ansury widget below is currently acting as <strong className="text-slate-900">{MOCK_CLIENTS[selectedClientId].name}</strong>. 
                  Try changing the client in the header or switching to the Dashboard to see real-time updates.
                </p>
              </div>
            </div>
          </div>
          <ChatWidget clientId={selectedClientId} />
        </main>
      ) : (
        <Dashboard 
          initialConfig={liveConfig} 
          onUpdate={(cfg) => setLiveConfig(cfg)}
        />
      )}
    </div>
  );
};

export default App;
