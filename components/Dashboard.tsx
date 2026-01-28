
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClientConfig, ApiKey } from '../types';

interface DashboardProps {
  initialConfig: ClientConfig;
  onUpdate: (newConfig: ClientConfig) => void;
}

type Tab = 'settings' | 'api_keys';

const Dashboard: React.FC<DashboardProps> = ({ initialConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [config, setConfig] = useState<ClientConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // Fetch API Keys when tab switches
  useEffect(() => {
    if (activeTab === 'api_keys') {
      fetchApiKeys();
    }
  }, [activeTab]);

  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('client_id', config.id);
    
    if (!error && data) {
      setApiKeys(data);
    }
    setIsLoadingKeys(false);
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    
    const newKey = `ansury_${Math.random().toString(36).substr(2, 24)}`;
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        client_id: config.id,
        key: newKey,
        name: newKeyName
      })
      .select()
      .single();

    if (!error && data) {
      setApiKeys([...apiKeys, data]);
      setNewKeyName('');
    } else {
      console.error("Error generating key:", error);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (!error) {
      setApiKeys(apiKeys.filter(k => k.id !== id));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('clients').upsert(config);
    if (!error) {
      onUpdate(config);
      alert('Settings saved successfully!');
    } else {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">Ansury Portal</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <span>Widget Settings</span>
          </button>
          <button 
            onClick={() => setActiveTab('api_keys')}
            className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${activeTab === 'api_keys' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            <span>API Keys</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {activeTab === 'settings' ? (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Widget Configuration</h1>
                  <p className="text-slate-500">Customize how Ansury appears and behaves on your site.</p>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-4">Brand Identity</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Display Name</label>
                    <input 
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({...config, name: e.target.value})}
                      className="w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Primary Brand Color</label>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                        className="h-10 w-20 rounded border-slate-300 cursor-pointer"
                      />
                      <span className="text-sm font-mono text-slate-500">{config.primary_color}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Welcome Message</label>
                    <textarea 
                      rows={3}
                      value={config.greeting}
                      onChange={(e) => setConfig({...config, greeting: e.target.value})}
                      className="w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-4">AI Intelligence</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">System Instruction (The Brain)</label>
                    <textarea 
                      rows={10}
                      value={config.system_instruction}
                      onChange={(e) => setConfig({...config, system_instruction: e.target.value})}
                      placeholder="You are a helpful assistant..."
                      className="w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 border text-sm"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900">API Access</h1>
                <p className="text-slate-500">Manage API keys to authenticate requests from your custom integration.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input 
                      type="text"
                      placeholder="Key Name (e.g. Production Website)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    />
                  </div>
                  <button 
                    onClick={handleGenerateKey}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Generate New Key
                  </button>
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">API Key</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Created</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoadingKeys ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading keys...</td></tr>
                      ) : apiKeys.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No API keys found. Generate one to get started.</td></tr>
                      ) : (
                        apiKeys.map((k) => (
                          <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">{k.name}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                              <span className="bg-slate-100 px-2 py-1 rounded select-all">{k.key}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{new Date(k.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => handleRevokeKey(k.id)}
                                className="text-red-600 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex space-x-3">
                <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Developer Documentation</p>
                  <p>When using custom integrations, include the API key in the <code>x-api-key</code> header of your POST requests to <code>/api/chat</code>.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
