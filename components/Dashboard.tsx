
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClientConfig, Lead, DashboardStats } from '../types';

interface DashboardProps {
  initialConfig: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ initialConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'leads'>('overview');
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientConfig>(initialConfig);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalLeads: 0, activeAgents: 0, messagesProcessed: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationStep, setCreationStep] = useState<'input' | 'success'>('input');
  
  // New Client State
  const [newClient, setNewClient] = useState({
    name: '',
    greeting: 'Welcome! How can I assist you with our premium services today?',
    instruction: 'You are an elite sales advisor. Your goal is to qualify high-ticket leads by understanding their specific needs and budget.',
  });

  useEffect(() => {
    fetchClients();
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab, selectedClient]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setClients(data);
      if (activeTab !== 'settings') setSelectedClient(data[0]);
    }
  };

  const fetchGlobalStats = async () => {
    const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    setStats({
      totalLeads: leadCount || 0,
      activeAgents: clientCount || 0,
      messagesProcessed: (leadCount || 0) * 8.4 // Simulated metric
    });
  };

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads')
      .select('*')
      .eq('client_id', selectedClient.id)
      .order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const handleCreateClient = async () => {
    if (!newClient.name) return;
    const id = newClient.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    
    const clientPayload: ClientConfig = {
      id,
      user_id: 'user_123',
      name: newClient.name,
      primary_color: '#4F46E5',
      greeting: newClient.greeting,
      system_instruction: newClient.instruction,
      thinking_enabled: true,
      thinking_budget: 2000,
      authorized_origins: ['*']
    };

    const { error } = await supabase.from('clients').insert(clientPayload);
    if (!error) {
      setClients([clientPayload, ...clients]);
      setSelectedClient(clientPayload);
      setCreationStep('success');
      onUpdate(clientPayload);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.from('clients').upsert(selectedClient);
    onUpdate(selectedClient);
    setIsSaving(false);
    fetchClients();
  };

  const applyTemplate = (type: 'luxury' | 'saas' | 'consulting') => {
    const templates = {
      luxury: {
        greeting: "Welcome to our exclusive collection. How may I guide your discovery of our finest properties today?",
        instruction: "You are a sophisticated concierge for a luxury brand. Use refined language, focus on exclusivity, and always qualify the prospect's investment capacity early but gracefully."
      },
      saas: {
        greeting: "Hi! Ready to see how we can optimize your team's workflow?",
        instruction: "You are a technical sales engineer. Focus on ROI, integration speed, and solving specific pain points. Drive the conversation toward booking a demo."
      },
      consulting: {
        greeting: "Hello. We help businesses scale through strategic advisory. What's the biggest bottleneck in your growth right now?",
        instruction: "You are a high-level strategic consultant. Ask deep, probing questions about their business model. Position yourself as an authority before offering a discovery call."
      }
    };
    setNewClient({
      ...newClient,
      greeting: templates[type].greeting,
      instruction: templates[type].instruction
    });
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure? This will delete all leads for this agent.')) return;
    await supabase.from('clients').delete().eq('id', id);
    fetchClients();
    setActiveTab('overview');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* NAVIGATION SIDEBAR */}
      <aside className="w-80 bg-slate-950 flex flex-col border-r border-slate-800">
        <div className="p-8 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-white italic">A</div>
            <div className="text-white font-black text-lg tracking-tighter">ANSURY ADMIN</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span>Global Overview</span>
            </button>
          </nav>

          <div>
            <div className="px-4 mb-4 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sales Agents</span>
              <button onClick={() => { setCreationStep('input'); setShowCreateModal(true); }} className="text-indigo-400 hover:text-white p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="space-y-1">
              {clients.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedClient(c); setActiveTab('settings'); }}
                  className={`w-full group text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${selectedClient?.id === c.id && activeTab !== 'overview' ? 'bg-slate-900 text-white ring-1 ring-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.primary_color }}></div>
                    <span className="truncate w-32">{c.name}</span>
                  </div>
                  {selectedClient?.id === c.id && activeTab !== 'overview' && (
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold">AR</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Alex Rivera</p>
              <p className="text-[10px] text-slate-500 truncate">Elite Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-[#F9FAFB] relative">
        <div className="max-w-6xl mx-auto p-12">
          
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="space-y-2">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">Enterprise Overview</h1>
                <p className="text-slate-500 font-medium">Monitoring {stats.activeAgents} high-ticket AI agents across all deployments.</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Leads</p>
                  <h2 className="text-4xl font-black text-slate-900">{stats.totalLeads}</h2>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Agents</p>
                  <h2 className="text-4xl font-black text-slate-900">{stats.activeAgents}</h2>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Efficiency Rating</p>
                  <h2 className="text-4xl font-black text-slate-900">98.4%</h2>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Recent Global Activity</h3>
                  <button className="text-xs font-bold text-indigo-600">View All Logs</button>
                </div>
                <div className="p-12 text-center text-slate-400">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                   </div>
                   <p className="text-sm font-medium">Your agent network is ready to scale.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && selectedClient && (
            <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase tracking-widest">Agent Settings</span>
                    <span className="text-slate-300 text-[10px]">ID: {selectedClient.id}</span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">{selectedClient.name}</h1>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => deleteClient(selectedClient.id)} className="px-6 py-4 rounded-2xl font-bold text-slate-400 hover:text-red-500 transition-colors">Archive Agent</button>
                  <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:bg-indigo-600 transition-all flex items-center space-x-3">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Deploy Updates</span>}
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 border-b border-slate-200">
                <button className="px-4 py-3 text-sm font-bold text-slate-900 border-b-2 border-slate-900">Branding & AI</button>
                <button onClick={() => setActiveTab('leads')} className="px-4 py-3 text-sm font-bold text-slate-400 hover:text-slate-600">Captured Leads</button>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                      <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Visuals</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                          <input value={selectedClient.name} onChange={e => setSelectedClient({...selectedClient, name: e.target.value})} className="w-full bg-slate-50 border-slate-100 rounded-xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Theme Color</label>
                          <div className="flex items-center space-x-4">
                            <input type="color" value={selectedClient.primary_color} onChange={e => setSelectedClient({...selectedClient, primary_color: e.target.value})} className="w-16 h-16 rounded-2xl cursor-pointer border-none shadow-inner p-1 bg-slate-100" />
                            <input value={selectedClient.primary_color} onChange={e => setSelectedClient({...selectedClient, primary_color: e.target.value})} className="flex-1 bg-slate-50 border-slate-100 rounded-xl p-4 font-mono text-sm uppercase" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                      <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Intelligence</h3>
                      <div className="space-y-6">
                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div>
                             <h4 className="font-bold text-slate-900 text-sm">Thinking Engine</h4>
                             <p className="text-[10px] text-slate-500">Advanced logic enabled.</p>
                           </div>
                           <button 
                             onClick={() => setSelectedClient({...selectedClient, thinking_enabled: !selectedClient.thinking_enabled})}
                             className={`w-12 h-6 rounded-full transition-all relative ${selectedClient.thinking_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedClient.thinking_enabled ? 'left-7' : 'left-1'}`}></div>
                           </button>
                         </div>
                         {selectedClient.thinking_enabled && (
                            <div>
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Thinking Budget</label>
                              <input type="number" value={selectedClient.thinking_budget} onChange={e => setSelectedClient({...selectedClient, thinking_budget: parseInt(e.target.value)})} className="w-full bg-slate-50 border-slate-100 rounded-xl p-4 font-bold text-slate-900" />
                            </div>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">System Directives</h3>
                    <textarea 
                      rows={8} 
                      value={selectedClient.system_instruction} 
                      onChange={e => setSelectedClient({...selectedClient, system_instruction: e.target.value})} 
                      className="w-full bg-slate-50 border-slate-100 rounded-3xl p-8 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                    />
                  </div>
                </div>

                <div className="sticky top-12 space-y-6">
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Live Preview</h3>
                  <div className="h-[600px] bg-slate-900 rounded-[3rem] p-4 shadow-2xl relative overflow-hidden">
                     <div className="h-full w-full bg-[#FAFBFE] rounded-[2.5rem] overflow-hidden flex flex-col shadow-inner">
                        <div className="p-8 text-white relative" style={{ backgroundColor: selectedClient.primary_color }}>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">{selectedClient.name.charAt(0)}</div>
                            <p className="font-bold text-sm leading-none">{selectedClient.name}</p>
                          </div>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-hidden">
                           <div className="max-w-[80%] bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none text-[11px] shadow-sm leading-relaxed">
                             {selectedClient.greeting}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">{selectedClient.name} Leads</h1>
               <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
                  {leads.length > 0 ? (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-10 py-6">Prospect</th>
                          <th className="px-10 py-6">Status</th>
                          <th className="px-10 py-6">Captured</th>
                          <th className="px-10 py-6">Transcript</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {leads.map(l => (
                          <tr key={l.id} className="group hover:bg-slate-50/50 transition-all">
                            <td className="px-10 py-8">
                                <p className="font-bold text-slate-900">{l.name}</p>
                                <p className="text-xs text-slate-500">{l.email}</p>
                            </td>
                            <td className="px-10 py-8">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Qualified</span>
                            </td>
                            <td className="px-10 py-8">
                               <p className="text-sm font-medium text-slate-600">{new Date(l.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-10 py-8">
                               <button className="text-indigo-600 text-xs font-bold hover:underline">View History</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center text-slate-400">No leads captured yet.</div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE CLIENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              {creationStep === 'input' ? (
                <div className="p-16 space-y-10">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">Architect New Agent</h3>
                    <p className="text-slate-500 font-medium italic">"Every high-ticket sale starts with a perfect architected conversation."</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => applyTemplate('luxury')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-500 transition-all text-left">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Template</p>
                       <p className="font-bold text-slate-800">Luxury Concierge</p>
                    </button>
                    <button onClick={() => applyTemplate('saas')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-500 transition-all text-left">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Template</p>
                       <p className="font-bold text-slate-800">SaaS Growth</p>
                    </button>
                    <button onClick={() => applyTemplate('consulting')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-500 transition-all text-left">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Template</p>
                       <p className="font-bold text-slate-800">Strategic Advisor</p>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Client/Project Name</label>
                      <input 
                        value={newClient.name} 
                        onChange={e => setNewClient({...newClient, name: e.target.value})}
                        placeholder="e.g. Paramount Yacht Club"
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Primary Greeting</label>
                      <input 
                        value={newClient.greeting} 
                        onChange={e => setNewClient({...newClient, greeting: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Intelligence Directive (System Prompt)</label>
                      <textarea 
                        rows={4}
                        value={newClient.instruction} 
                        onChange={e => setNewClient({...newClient, instruction: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 py-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                    <button onClick={handleCreateClient} disabled={!newClient.name} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-2xl hover:bg-indigo-600 disabled:opacity-30 transition-all">Initialize Ecosystem</button>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center space-y-10">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">Ecosystem Live</h3>
                    <p className="text-slate-500 font-medium">Your high-ticket agent is generated and ready for deployment.</p>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Your Deployment ID (API KEY)</p>
                       <code className="text-indigo-600 font-black text-lg select-all">{selectedClient.id}</code>
                    </div>
                    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-inner">
                       <p className="text-[10px] font-black uppercase text-slate-500 mb-4">Universal Embed Code</p>
                       <code className="text-slate-300 text-xs break-all leading-relaxed block select-all">
                         &lt;script src="https://ansurysystems.online/loader.js" data-client-id="{selectedClient.id}"&gt;&lt;/script&gt;
                       </code>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setShowCreateModal(false); setActiveTab('settings'); }} 
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black tracking-widest uppercase text-sm shadow-2xl hover:bg-indigo-600 transition-all"
                  >
                    Enter Command Center
                  </button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
