
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClientConfig, ApiKey, Lead } from '../types';

interface DashboardProps {
  initialConfig: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

type Tab = 'settings' | 'api_keys' | 'leads';

const Dashboard: React.FC<DashboardProps> = ({ initialConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [config, setConfig] = useState<ClientConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    if (activeTab === 'api_keys') fetchApiKeys();
    if (activeTab === 'leads') fetchLeads();
  }, [activeTab]);

  const fetchApiKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from('api_keys').select('*').eq('client_id', config.id);
    if (data) setApiKeys(data);
    setLoading(false);
  };

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase.from('leads').select('*').eq('client_id', config.id).order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('clients').upsert(config);
    if (!error) {
      onUpdate(config);
      alert('Updated! All widgets currently live on client sites have been refreshed with new settings.');
    }
    setIsSaving(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg tracking-tight flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            Ansury Engine
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" label="Config" />
          <NavBtn active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" label="Pipeline" badge={leads.length > 0 ? leads.length.toString() : undefined} />
          <NavBtn active={activeTab === 'api_keys'} onClick={() => setActiveTab('api_keys')} icon="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" label="Developer" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900">Widget Studio</h1>
                  <p className="text-slate-500">Real-time design and intelligence controls.</p>
                </div>
                <button onClick={handleSaveSettings} disabled={isSaving} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {isSaving ? 'Deploying...' : 'Deploy to Production'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-3">Branding</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bot Identity</label>
                      <input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Theme Color</label>
                      <div className="flex items-center space-x-3">
                         <input type="color" value={config.primary_color} onChange={e => setConfig({...config, primary_color: e.target.value})} className="h-12 w-full rounded-lg border-none cursor-pointer p-0" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 border-b pb-3">AI Engine Rules</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Greeting Message</label>
                      <input value={config.greeting} onChange={e => setConfig({...config, greeting: e.target.value})} className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">System Instructions (Prompt)</label>
                      <textarea rows={10} value={config.system_instruction} onChange={e => setConfig({...config, system_instruction: e.target.value})} className="w-full border-slate-200 rounded-lg p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="You are a luxury sales concierge..." />
                      <p className="text-[10px] text-slate-400 mt-2 italic">Pro-Tip: Use professional adjectives to shape the AI's tone.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-slate-900">Sales Pipeline</h1>
                <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-green-200">
                  {leads.length} Active Leads
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Prospect</th>
                      <th className="p-6 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Contact Channel</th>
                      <th className="p-6 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Date Acquired</th>
                      <th className="p-6 font-bold text-slate-600 uppercase tracking-widest text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                        <td className="p-6">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all uppercase">
                               {lead.name.charAt(0)}
                             </div>
                             <span className="font-bold text-slate-900">{lead.name}</span>
                           </div>
                        </td>
                        <td className="p-6">
                          <p className="font-medium text-slate-700">{lead.email}</p>
                          <p className="text-xs text-slate-400">{lead.phone || 'No phone provided'}</p>
                        </td>
                        <td className="p-6 text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                        <td className="p-6">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Pending Review
                          </span>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <div className="flex flex-col items-center opacity-30">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-xl font-bold">No leads captured yet</p>
                            <p className="text-sm">Embed the widget and start engaging with prospects.</p>
                          </div>
                        </td>
                      </tr>
                    )}
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

const NavBtn = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-slate-800 text-slate-400'}`}>
    <div className="flex items-center space-x-3">
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
      <span className="font-semibold text-sm tracking-wide">{label}</span>
    </div>
    {badge && (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-slate-700 text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);

export default Dashboard;
