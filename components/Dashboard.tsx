
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClientConfig, Lead } from '../types';

interface DashboardProps {
  initialConfig: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ initialConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'leads'>('settings');
  const [config, setConfig] = useState<ClientConfig>(initialConfig);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').eq('client_id', config.id).order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.from('clients').upsert(config);
    onUpdate(config);
    setIsSaving(false);
    alert("Enterprise configuration deployed.");
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-64 bg-slate-900 p-6 flex flex-col">
        <div className="text-white font-black text-xl mb-12 tracking-tighter">ANSURY ADMIN</div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800'}`}>Widget Studio</button>
          <button onClick={() => setActiveTab('leads')} className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'leads' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800'}`}>Sales Pipeline</button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-12">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'settings' ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Core</h1>
                <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:bg-indigo-600 transition-all">
                  {isSaving ? 'Deploying...' : 'Publish Live'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Branding</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Agent Name</label>
                    <input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-4" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Primary HEX</label>
                    <input type="color" value={config.primary_color} onChange={e => setConfig({...config, primary_color: e.target.value})} className="w-full h-12 rounded-xl" />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Intelligence</h3>
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-indigo-900">Thinking Mode</h4>
                      <p className="text-[10px] text-indigo-600">Enhanced sales logic via Gemini 3 Pro.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={config.thinking_enabled} 
                      onChange={e => setConfig({...config, thinking_enabled: e.target.checked})}
                      className="w-6 h-6 rounded-lg border-none accent-indigo-600"
                    />
                  </div>
                  {config.thinking_enabled && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Reasoning Budget (Tokens)</label>
                      <input type="number" value={config.thinking_budget} onChange={e => setConfig({...config, thinking_budget: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Global Instructions</h3>
                <textarea rows={8} value={config.system_instruction} onChange={e => setConfig({...config, system_instruction: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-6 font-mono text-sm" />
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Lead Pipeline</h1>
               <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <tr>
                        <th className="p-8">Prospect</th>
                        <th className="p-8">Contact</th>
                        <th className="p-8">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {leads.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-8 font-bold text-slate-900">{l.name}</td>
                          <td className="p-8 text-slate-500 text-sm">{l.email}</td>
                          <td className="p-8"><span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase">Qualified</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
