
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClientConfig, Lead, DashboardStats, ApiKey } from '../types';

interface DashboardProps {
  initialConfig: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group ml-2 inline-block">
    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 cursor-help group-hover:bg-indigo-600 group-hover:text-white transition-colors">?</div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 text-white text-[10px] font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/10 backdrop-blur-md">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ initialConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'leads' | 'security'>('overview');
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientConfig>(initialConfig);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalLeads: 0, activeAgents: 0, messagesProcessed: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationStep, setCreationStep] = useState<'input' | 'success'>('input');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
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
    if (activeTab === 'security') fetchApiKeys();
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

  const fetchApiKeys = async () => {
    if (!selectedClient?.id) return;
    const { data, error } = await supabase.from('api_keys')
      .select('*')
      .eq('client_id', selectedClient.id)
      .order('created_at', { ascending: false });
    if (error) console.error("Fetch API keys error:", error);
    if (data) setApiKeys(data);
  };

  const generateNewApiKey = async () => {
    if (!selectedClient?.id) return;
    setIsGeneratingKey(true);
    const newKey = `ansury_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const { error } = await supabase.from('api_keys').insert({
      client_id: selectedClient.id,
      key: newKey
    });
    if (error) {
      alert(`Failed to generate key: ${error.message}`);
    } else {
      fetchApiKeys();
    }
    setIsGeneratingKey(false);
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm('Warning: This will immediately disable all integrations using this key. Proceed?')) return;
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (!error) fetchApiKeys();
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
    setNewClientData({ ...newClientData, greeting: templates[type].greeting, instruction: templates[type].instruction });
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
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span>Network Overview</span>
            </button>
            {selectedClient.id && (
              <>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>Node Settings</span>
                </button>
                <button onClick={() => setActiveTab('security')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span>Security & Keys</span>
                </button>
                <button onClick={() => setActiveTab('leads')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'leads' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <span>Qualified Leads</span>
                </button>
              </>
            )}
          </nav>
          <div>
            <div className="px-4 mb-4 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sales Agents</span>
              <button onClick={() => { setCreationStep('input'); setActiveTemplate(null); setShowCreateModal(true); }} className="text-indigo-400 hover:text-white p-1 bg-indigo-500/10 rounded-md transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="space-y-1">
              {clients.map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setActiveTab('settings'); }} className={`w-full group text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${selectedClient?.id === c.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.primary_color }}></div>
                    <span className="truncate w-32">{c.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-[#F9FAFB] relative scroll-smooth p-12">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">Enterprise Console</h1>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Qualified Leads</p><h2 className="text-5xl font-black text-slate-900">{stats.totalLeads}</h2></div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Nodes</p><h2 className="text-5xl font-black text-slate-900">{stats.activeAgents}</h2></div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Intelligence Cycles</p><h2 className="text-5xl font-black text-slate-900">{stats.messagesProcessed.toFixed(0)}</h2></div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h1 className="text-5xl font-black text-slate-900 tracking-tight">Security & API Keys</h1>
                  <p className="text-slate-500 font-medium">Manage access credentials for {selectedClient.name}.</p>
                </div>
                <button onClick={generateNewApiKey} disabled={isGeneratingKey} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-600 transition-all flex items-center space-x-3">
                  {isGeneratingKey ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
                  <span>Generate New Key</span>
                </button>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Key Identifier</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                      <th className="px-10 py-5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apiKeys.length > 0 ? apiKeys.map(k => (
                      <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6">
                          <div className="font-mono text-sm bg-slate-100 px-4 py-2 rounded-lg text-slate-600 flex items-center justify-between group">
                            <span className="truncate max-w-[200px]">{k.key.substring(0, 15)}...</span>
                            <button onClick={() => { navigator.clipboard.writeText(k.key); alert('Copied to clipboard'); }} className="opacity-0 group-hover:opacity-100 text-indigo-600 hover:text-indigo-800 transition-all">Copy</button>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase">Active</span>
                        </td>
                        <td className="px-10 py-6 text-sm text-slate-500 font-medium">{new Date(k.created_at).toLocaleDateString()}</td>
                        <td className="px-10 py-6 text-right">
                          <button onClick={() => revokeApiKey(k.id)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition-colors">Revoke</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-400 italic">No API keys active for this node.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">{selectedClient.name}</h1>
                <div className="flex space-x-4">
                  <button onClick={() => deleteClient(selectedClient.id)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-red-500 transition-colors">Archive</button>
                  <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-600 transition-all">
                    {isSaving ? "Saving..." : "Publish Updates"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-10">
                <div className="col-span-2 space-y-10">
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Visual Identity</h3>
                    <div className="grid grid-cols-2 gap-10">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Public Name
                          <InfoTooltip text="The name visible to your customers at the top of the chat window." />
                        </label>
                        <input value={selectedClient.name} onChange={e => setSelectedClient({...selectedClient, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 font-bold text-slate-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Theme HEX
                          <InfoTooltip text="Your brand's signature color. This affects buttons, headers, and highlights." />
                        </label>
                        <input type="color" value={selectedClient.primary_color} onChange={e => setSelectedClient({...selectedClient, primary_color: e.target.value})} className="w-full h-16 rounded-2xl p-1 bg-white cursor-pointer" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Intelligence Directives</h3>
                      <div className="flex items-center space-x-6">
                         <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Thinking Mode
                              <InfoTooltip text="Enables deep reasoning for complex sales logic. This may slightly increase response time." />
                            </span>
                            <button 
                              onClick={() => setSelectedClient({...selectedClient, thinking_enabled: !selectedClient.thinking_enabled})}
                              className={`w-12 h-6 rounded-full transition-all relative ${selectedClient.thinking_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedClient.thinking_enabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                         </div>
                         {selectedClient.thinking_enabled && (
                            <div className="flex items-center space-x-2">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 Budget
                                 <InfoTooltip text="Maximum number of reasoning tokens allowed. Higher values enable deeper logic (max 32,768)." />
                               </span>
                               <input 
                                 type="number" 
                                 min="0" 
                                 max="32768" 
                                 value={selectedClient.thinking_budget} 
                                 onChange={e => setSelectedClient({...selectedClient, thinking_budget: parseInt(e.target.value) || 0})}
                                 className="w-24 bg-slate-50 border-slate-100 rounded-lg p-2 font-bold text-xs text-slate-900 outline-none" 
                               />
                            </div>
                         )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        System Instruction (The "Brain")
                        <InfoTooltip text="The 'DNA' of your AI. Define its personality, sales goals, and what information it should (or shouldn't) share." />
                      </label>
                      <textarea 
                        rows={10} 
                        value={selectedClient.system_instruction} 
                        onChange={e => setSelectedClient({...selectedClient, system_instruction: e.target.value})} 
                        className="w-full bg-slate-50 rounded-[2rem] p-8 font-mono text-sm leading-relaxed outline-none" 
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-[3rem] p-6 shadow-2xl h-fit">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-6 text-center">Live Preview</p>
                  <div className="h-[400px] bg-white rounded-[2rem] overflow-hidden flex flex-col">
                    <div className="p-6 text-white" style={{ backgroundColor: selectedClient.primary_color }}><p className="font-black text-sm">{selectedClient.name}</p></div>
                    <div className="flex-1 p-6"><div className="bg-slate-100 p-4 rounded-xl text-[12px] text-slate-700">{selectedClient.greeting}</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <h1 className="text-5xl font-black text-slate-900 tracking-tight">Leads for {selectedClient.name}</h1>
               <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Prospect</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Captured</th>
                      <th className="px-10 py-5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.length > 0 ? leads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="px-10 py-6">
                          <div className="font-bold text-slate-900">{l.name}</div>
                          <div className="text-xs text-slate-500">{l.email}</div>
                        </td>
                        <td className="px-10 py-6 text-sm text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="px-10 py-6 text-right"><button className="text-indigo-600 font-bold text-xs uppercase">Transcript</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="p-20 text-center text-slate-400 italic">No qualified leads yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden">
              {creationStep === 'input' ? (
                <div className="p-12 space-y-8">
                  <h3 className="text-4xl font-black text-slate-900 text-center uppercase italic">Initialize Sales Node</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => applyTemplate('real-estate')} className={`p-4 rounded-2xl border ${activeTemplate === 'real-estate' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}><span className="text-[11px] font-black uppercase">Real Estate</span></button>
                    <button onClick={() => applyTemplate('saas')} className={`p-4 rounded-2xl border ${activeTemplate === 'saas' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}><span className="text-[11px] font-black uppercase">SaaS</span></button>
                    <button onClick={() => applyTemplate('consulting')} className={`p-4 rounded-2xl border ${activeTemplate === 'consulting' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}><span className="text-[11px] font-black uppercase">Consulting</span></button>
                  </div>
                  <input value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 font-bold outline-none" placeholder="Agent Name" />
                  <div className="flex space-x-4"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400">Abort</button><button onClick={handleCreateClient} disabled={!newClientData.name} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs">Initialize</button></div>
                </div>
              ) : (
                <div className="p-20 text-center space-y-10">
                  <h3 className="text-4xl font-black text-slate-900 uppercase italic">Node Live</h3>
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl text-left">
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-4">Paste this into your HTML</p>
                    <code className="text-slate-300 text-xs break-all block font-mono">&lt;script src="{loaderBaseUrl}/loader.js" data-client-id="{selectedClient.id}"&gt;&lt;/script&gt;</code>
                  </div>
                  <button onClick={() => { setShowCreateModal(false); setActiveTab('settings'); }} className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm">Open Console</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
