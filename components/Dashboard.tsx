
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClientConfig, Lead, DashboardStats } from '../types';

interface DashboardProps {
  initialConfig: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group ml-2 inline-block">
    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 cursor-help group-hover:bg-indigo-600 group-hover:text-white transition-colors">?</div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/10 backdrop-blur-md">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ initialConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'leads'>('overview');
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientConfig>(initialConfig);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalLeads: 0, activeAgents: 0, messagesProcessed: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationStep, setCreationStep] = useState<'input' | 'success'>('input');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // This should ideally be your Worker URL (e.g., https://loader.ansury.systems)
  const [loaderBaseUrl, setLoaderBaseUrl] = useState(window.location.origin);

  const [newClientData, setNewClientData] = useState({
    name: '',
    greeting: 'Welcome. How may I assist your inquiry into our premium services today?',
    instruction: 'You are an elite sales advisor. Your objective is to qualify prospects based on intent and budget before booking a call.',
  });

  useEffect(() => {
    fetchClients();
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab, selectedClient]);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) console.error("Fetch clients error:", error);
    if (data && data.length > 0) {
      setClients(data);
      if (activeTab === 'overview' || !selectedClient.id) setSelectedClient(data[0]);
    }
  };

  const fetchGlobalStats = async () => {
    const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    setStats({
      totalLeads: leadCount || 0,
      activeAgents: clientCount || 0,
      messagesProcessed: (leadCount || 0) * 14.2
    });
  };

  const fetchLeads = async () => {
    if (!selectedClient?.id) return;
    const { data, error } = await supabase.from('leads')
      .select('*')
      .eq('client_id', selectedClient.id)
      .order('created_at', { ascending: false });
    if (error) console.error("Fetch leads error:", error);
    if (data) setLeads(data);
  };

  const handleCreateClient = async () => {
    if (!newClientData.name) return;
    
    const generatedId = `ansury-${newClientData.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    
    const payload: ClientConfig = {
      id: generatedId,
      user_id: 'user_123',
      name: newClientData.name,
      primary_color: '#0F172A',
      greeting: newClientData.greeting,
      system_instruction: newClientData.instruction,
      thinking_enabled: true,
      thinking_budget: 4000,
      authorized_origins: ['*']
    };

    const { error } = await supabase.from('clients').insert(payload);
    if (!error) {
      setClients([payload, ...clients]);
      setSelectedClient(payload);
      setCreationStep('success');
      onUpdate(payload);
      fetchGlobalStats();
    } else {
      console.error("Initialization failed details:", error);
      alert(`Initialization failed: ${error.message}`);
    }
  };

  const applyTemplate = (type: 'real-estate' | 'saas' | 'consulting') => {
    const templates = {
      'real-estate': {
        greeting: "Welcome to our exclusive property portfolio. Are you looking for a primary residence or an investment opportunity today?",
        instruction: "You are an elite real estate advisor for a luxury firm. Focus on exclusive amenities, architectural significance, and lifestyle. Qualify leads by asking for their preferred location and investment range ($2M+). Be sophisticated and patient."
      },
      'saas': {
        greeting: "Hi! Ready to streamline your operations? I can show you how our platform delivers 3x ROI in the first quarter.",
        instruction: "You are a technical sales consultant for a high-growth SaaS platform. Focus on efficiency, integration capabilities, and measurable ROI. Ask about their current tech stack and team size to provide tailored value propositions. Your goal is to secure a live demo."
      },
      'consulting': {
        greeting: "Hello. I help businesses optimize their strategic growth. What is the biggest bottleneck in your operations right now?",
        instruction: "You are a high-level strategic consultant. Be analytical, professional, and authoritative. Your goal is identify specific business pain points and suggest how a consultation can solve them. Qualify based on annual revenue and decision-making authority."
      }
    };
    
    setActiveTemplate(type);
    setNewClientData({
      ...newClientData,
      greeting: templates[type].greeting,
      instruction: templates[type].instruction
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('clients').upsert(selectedClient);
    if (!error) {
      onUpdate(selectedClient);
      fetchClients();
    } else {
      alert(`Save failed: ${error.message}`);
    }
    setIsSaving(false);
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Warning: This will permanently remove this agent. Proceed?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      fetchClients();
      setActiveTab('overview');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      <aside className="w-80 bg-slate-950 flex flex-col border-r border-slate-800">
        <div className="p-8 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-indigo-500/20">A</div>
            <div className="text-white font-black text-lg tracking-tighter uppercase">Ansury Titan</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span>Network Overview</span>
            </button>
          </nav>

          <div>
            <div className="px-4 mb-4 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sales Agents</span>
              <button 
                onClick={() => { setCreationStep('input'); setActiveTemplate(null); setShowCreateModal(true); }} 
                className="text-indigo-400 hover:text-white p-1 bg-indigo-500/10 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="space-y-1">
              {clients.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedClient(c); setActiveTab('settings'); }}
                  className={`w-full group text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${selectedClient?.id === c.id && activeTab !== 'overview' ? 'bg-slate-900 text-white ring-1 ring-slate-800 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: c.primary_color }}></div>
                    <span className="truncate w-32">{c.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/50 backdrop-blur border-t border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">AR</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Alex Rivera</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-black">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F9FAFB] relative scroll-smooth">
        <div className="max-w-6xl mx-auto p-12">
          
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-2">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">Enterprise Console</h1>
                <p className="text-slate-500 font-medium text-lg">System healthy. Currently managing {stats.activeAgents} specialized sales environments.</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-indigo-600 transition-colors">Qualified Leads</p>
                  <h2 className="text-5xl font-black text-slate-900">{stats.totalLeads}</h2>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-indigo-600 transition-colors">Active Nodes</p>
                  <h2 className="text-5xl font-black text-slate-900">{stats.activeAgents}</h2>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-indigo-600 transition-colors">Intelligence Cycles</p>
                  <h2 className="text-5xl font-black text-slate-900">{stats.messagesProcessed.toFixed(0)}</h2>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">Ecosystem Activity</h3>
                  <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800">Clear Logs</button>
                </div>
                <div className="p-20 text-center text-slate-400">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <p className="text-sm font-medium italic">"Real-time stream will initiate upon prospect interaction."</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && selectedClient && (
            <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">Config Center</span>
                    <span className="text-slate-400 text-[10px] font-mono">UID: {selectedClient.id}</span>
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight">{selectedClient.name}</h1>
                </div>
                <div className="flex space-x-4">
                  <button onClick={() => deleteClient(selectedClient.id)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-red-500 transition-colors">Archive Node</button>
                  <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4">
                    {isSaving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span>Publish Updates</span>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-10">
                <div className="col-span-2 space-y-10">
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Visual Identity</h3>
                    <div className="grid grid-cols-2 gap-10">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Public Name</label>
                        <input value={selectedClient.name} onChange={e => setSelectedClient({...selectedClient, name: e.target.value})} className="w-full bg-slate-50 border-slate-100 rounded-2xl p-5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Theme HEX</label>
                        <div className="flex items-center space-x-4">
                          <input type="color" value={selectedClient.primary_color} onChange={e => setSelectedClient({...selectedClient, primary_color: e.target.value})} className="w-16 h-16 rounded-2xl border-none p-1 bg-white shadow-inner cursor-pointer" />
                          <input value={selectedClient.primary_color} onChange={e => setSelectedClient({...selectedClient, primary_color: e.target.value})} className="flex-1 bg-slate-50 border-slate-100 rounded-2xl p-5 font-mono text-sm uppercase outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Intelligence Directives</h3>
                      <div className="flex items-center space-x-6">
                         <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thinking Mode</span>
                            <button 
                              onClick={() => setSelectedClient({...selectedClient, thinking_enabled: !selectedClient.thinking_enabled})}
                              className={`w-12 h-6 rounded-full transition-all relative ${selectedClient.thinking_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedClient.thinking_enabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                         </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Instruction (The "Brain")</label>
                        <textarea 
                          rows={10} 
                          value={selectedClient.system_instruction} 
                          onChange={e => setSelectedClient({...selectedClient, system_instruction: e.target.value})} 
                          className="w-full bg-slate-50 border-slate-100 rounded-[2rem] p-8 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-slate-900 rounded-[3rem] p-6 shadow-2xl relative overflow-hidden group">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-6 text-center">Live Preview</p>
                      <div className="h-[500px] bg-[#F8FAFC] rounded-[2.5rem] overflow-hidden flex flex-col">
                        <div className="p-8 text-white" style={{ backgroundColor: selectedClient.primary_color }}>
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">{selectedClient.name.charAt(0)}</div>
                             <p className="font-black text-sm">{selectedClient.name}</p>
                           </div>
                        </div>
                        <div className="flex-1 p-6 space-y-4">
                           <div className="max-w-[85%] bg-white p-5 rounded-2xl rounded-bl-none text-[12px] shadow-sm leading-relaxed text-slate-700">
                             {selectedClient.greeting}
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl">
                      <h4 className="font-black text-xl mb-3">Deployment Hub</h4>
                      <p className="text-xs text-indigo-100 leading-relaxed mb-6">Embed this ID in your loader to connect.</p>
                      <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-400/30 font-mono text-sm break-all select-all">
                        {selectedClient.id}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              {creationStep === 'input' ? (
                <div className="p-12 space-y-8 overflow-y-auto max-h-[90vh]">
                  <div className="space-y-3 text-center">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Initialize Sales Node</h3>
                    <p className="text-slate-500 font-medium">Select a blueprint or build from zero.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Industry Blueprints</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => applyTemplate('real-estate')} className={`p-4 rounded-2xl border transition-all text-left flex flex-col space-y-2 group ${activeTemplate === 'real-estate' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-slate-200">🏠</div>
                        <span className="text-[11px] font-black uppercase text-slate-900">Real Estate</span>
                      </button>
                      <button onClick={() => applyTemplate('saas')} className={`p-4 rounded-2xl border transition-all text-left flex flex-col space-y-2 group ${activeTemplate === 'saas' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-slate-200">⚡</div>
                        <span className="text-[11px] font-black uppercase text-slate-900">SaaS Growth</span>
                      </button>
                      <button onClick={() => applyTemplate('consulting')} className={`p-4 rounded-2xl border transition-all text-left flex flex-col space-y-2 group ${activeTemplate === 'consulting' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-slate-200">🏛️</div>
                        <span className="text-[11px] font-black uppercase text-slate-900">Consulting</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Agent Name</label>
                      <input value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold outline-none" placeholder="e.g. Titan Sales" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Greeting</label>
                      <input value={newClientData.greeting} onChange={e => setNewClientData({...newClientData, greeting: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold outline-none" />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400">Abort</button>
                    <button onClick={handleCreateClient} disabled={!newClientData.name} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-2xl disabled:opacity-20">Initialize Node</button>
                  </div>
                </div>
              ) : (
                <div className="p-20 text-center space-y-10 bg-white relative">
                  <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Node Live</h3>
                    <p className="text-slate-500 font-medium">Configure your loader to begin capturing leads.</p>
                  </div>

                  <div className="space-y-6 text-left max-w-md mx-auto">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">1. Your Public Loader URL (Worker URL)</label>
                      <input 
                        type="text" 
                        value={loaderBaseUrl} 
                        onChange={(e) => setLoaderBaseUrl(e.target.value)}
                        placeholder="https://loader.your-site.com"
                        className="w-full bg-slate-100 p-4 rounded-xl text-sm font-mono border-none outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                       <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-4">Paste this into your HTML</p>
                       <code className="text-slate-300 text-xs break-all leading-relaxed block select-all font-mono">
                         &lt;script src="{loaderBaseUrl}/loader.js" data-client-id="{selectedClient.id}"&gt;&lt;/script&gt;
                       </code>
                    </div>
                  </div>

                  <button onClick={() => { setShowCreateModal(false); setActiveTab('settings'); }} className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm">Open Command Center</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
