import React from 'react';
import { Key } from 'lucide-react';
import { ApiKeys } from '../types';

interface ApiKeyModalProps {
    isOpen: boolean;
    apiKeys: ApiKeys;
    setApiKeys: (keys: ApiKeys) => void;
    saveKeys: (keys: ApiKeys) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
    isOpen,
    apiKeys,
    setApiKeys,
    saveKeys,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <Key size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">API Configuration</h2>
                        <p className="text-sm text-slate-500">Enter your provider keys to enable AI features.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Google Gemini Key <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="AIzaSy..."
                            value={apiKeys.google}
                            onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1">Required for main generation features.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Model Name</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="gemini-2.5-flash"
                            value={apiKeys.model}
                            onChange={(e) => setApiKeys({ ...apiKeys, model: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1">Specify the Gemini model version (default: gemini-2.5-flash).</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-semibold text-slate-400 mb-1">OpenAI Key (Optional)</label>
                        <input
                            type="password"
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-500 focus:bg-white transition-colors outline-none"
                            placeholder="sk-..."
                            value={apiKeys.openai || ''}
                            onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                            disabled
                        />
                        <p className="text-xs text-slate-400 mt-1">Currently disabled in this demo version.</p>
                    </div>

                    <div className="">
                        <label className="block text-sm font-semibold text-slate-400 mb-1">Claude Key (Optional)</label>
                        <input
                            type="password"
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-500 focus:bg-white transition-colors outline-none"
                            placeholder="sk-ant-..."
                            value={apiKeys.claude || ''}
                            onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                            disabled
                        />
                        <p className="text-xs text-slate-400 mt-1">Currently disabled in this demo version.</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => saveKeys(apiKeys)}
                        disabled={!apiKeys.google}
                        className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                        title="Save keys and close modal"
                    >
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
