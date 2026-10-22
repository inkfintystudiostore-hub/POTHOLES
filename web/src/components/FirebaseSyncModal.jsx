import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured
} from '../services/firebaseConfig';
import { reconnectFirebase } from '../services/firebaseSync';

export default function FirebaseSyncModal({ isOpen, onClose, isLiveConnected, onConfigUpdated }) {
  const [config, setConfig] = useState(getSavedFirebaseConfig());
  const [snippetInput, setSnippetInput] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getSavedFirebaseConfig());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value.trim()
    }));
  };

  // Helper to parse pasted Firebase config JS snippet
  const handleParseSnippet = () => {
    try {
      const apiKeyMatch = snippetInput.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = snippetInput.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = snippetInput.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = snippetInput.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = snippetInput.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = snippetInput.match(/appId:\s*["']([^"']+)["']/);

      if (!projectIdMatch || !apiKeyMatch) {
        setStatusMessage({
          type: 'error',
          text: 'Could not find apiKey or projectId in pasted snippet. Please fill the fields manually.'
        });
        return;
      }

      const parsed = {
        apiKey: apiKeyMatch ? apiKeyMatch[1] : '',
        authDomain: authDomainMatch ? authDomainMatch[1] : '',
        projectId: projectIdMatch ? projectIdMatch[1] : '',
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : '',
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : '',
        appId: appIdMatch ? appIdMatch[1] : ''
      };

      setConfig(parsed);
      setSnippetInput('');
      setStatusMessage({
        type: 'success',
        text: 'Configuration successfully extracted from snippet! Click "Save & Connect".'
      });
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: 'Error parsing snippet. Please enter values manually.'
      });
    }
  };

  const handleSave = () => {
    if (!config.projectId || !config.apiKey) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide at least a Project ID and an API Key.'
      });
      return;
    }

    const saved = saveFirebaseConfig(config);
    if (saved) {
      reconnectFirebase(config);
      if (onConfigUpdated) onConfigUpdated(config);
      setStatusMessage({
        type: 'success',
        text: '✅ Firebase configuration saved! Connecting live to Cloud Firestore...'
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleDisconnect = () => {
    clearFirebaseConfig();
    const emptyConfig = {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
    setConfig(emptyConfig);
    reconnectFirebase(emptyConfig);
    if (onConfigUpdated) onConfigUpdated(emptyConfig);
    setStatusMessage({
      type: 'info',
      text: 'Disconnected. Falling back to local prototype storage.'
    });
  };

  const configured = isFirebaseConfigured(config);

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111625] border border-amber-500/30 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Live Cloud Sync Setup
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  $0 Free Spark Tier
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Connect Firebase Firestore for instant multi-device live radar pulses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="my-4 p-3.5 rounded-xl bg-[#192237] border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isLiveConnected ? 'bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse' : configured ? 'bg-amber-400' : 'bg-gray-500'}`} />
            <div>
              <p className="text-xs font-semibold text-gray-200">
                {isLiveConnected
                  ? 'Cloud Firestore: Real-time Live Stream Active'
                  : configured
                  ? 'Connecting to Firestore...'
                  : 'Running in Local Prototype Mode'}
              </p>
              <p className="text-[11px] text-gray-400">
                {isLiveConnected
                  ? `Syncing live with Firebase Project: ${config.projectId}`
                  : 'Submissions are stored in local session cache.'}
              </p>
            </div>
          </div>
          {configured && (
            <button
              onClick={handleDisconnect}
              className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Quick Paste Snippet */}
        <div className="mb-4 p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
          <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
            <span>⚡ Quick Paste Config Snippet</span>
            <span className="text-[10px] text-gray-500">From Firebase Console</span>
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={snippetInput}
              onChange={(e) => setSnippetInput(e.target.value)}
              placeholder="Paste `const firebaseConfig = { apiKey: '...', projectId: '...' };` here..."
              className="w-full bg-[#0d121f] border border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleParseSnippet}
              disabled={!snippetInput.trim()}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium shrink-0 disabled:opacity-40 transition"
            >
              Parse
            </button>
          </div>
        </div>

        {/* Manual Config Fields */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Project ID *</label>
              <input
                type="text"
                value={config.projectId || ''}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                placeholder="roadwatch-12345"
                className="w-full bg-[#0d121f] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">API Key *</label>
              <input
                type="text"
                value={config.apiKey || ''}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="AIzaSyB..."
                className="w-full bg-[#0d121f] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Auth Domain</label>
              <input
                type="text"
                value={config.authDomain || ''}
                onChange={(e) => handleInputChange('authDomain', e.target.value)}
                placeholder="roadwatch.firebaseapp.com"
                className="w-full bg-[#0d121f] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Storage Bucket</label>
              <input
                type="text"
                value={config.storageBucket || ''}
                onChange={(e) => handleInputChange('storageBucket', e.target.value)}
                placeholder="roadwatch.appspot.com"
                className="w-full bg-[#0d121f] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Messaging Sender ID</label>
              <input
                type="text"
                value={config.messagingSenderId || ''}
                onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
                placeholder="1048291..."
                className="w-full bg-[#0d121f] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">App ID</label>
              <input
                type="text"
                value={config.appId || ''}
                onChange={(e) => handleInputChange('appId', e.target.value)}
                placeholder="1:1048291:web:..."
                className="w-full bg-[#0d121f] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Free Spark Tier Guide */}
        <div className="mb-6 p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 text-[11px] text-gray-400 space-y-2">
          <p className="font-semibold text-gray-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            How to get your free credentials in 2 minutes ($0 Cost):
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-gray-400">
            <li>
              Go to{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 underline inline-flex items-center gap-0.5"
              >
                console.firebase.google.com <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              and create a free project.
            </li>
            <li>In the left sidebar, click <strong>Build → Firestore Database</strong> → Create Database (select <em>Test mode</em>).</li>
            <li>Click the ⚙️ Gear icon (top left) → <strong>Project Settings</strong> → click the <strong>&lt;/&gt; Web app</strong> icon.</li>
            <li>Copy the generated config and paste it here!</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25 transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Save & Connect Live
          </button>
        </div>

      </div>
    </div>
  );
}
