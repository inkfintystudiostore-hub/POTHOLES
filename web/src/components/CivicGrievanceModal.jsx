import React, { useState } from 'react';
import { X, Send, Share2, Mail, Copy, Check, ExternalLink, ShieldAlert, FileText, MapPin, Calendar, Compass, AlertTriangle } from 'lucide-react';

export default function CivicGrievanceModal({ isOpen, onClose, pothole }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('social'); // 'social' | 'formal'

  if (!isOpen || !pothole) return null;

  const mapsUrl = `https://www.google.com/maps?q=${pothole.latitude},${pothole.longitude}`;
  const grievanceRef = `CIVIC-RD-${pothole.id.slice(-6).toUpperCase()}`;

  // Pre-drafted Tweet / Social message
  const tweetText = `URGENT ROAD HAZARD: Severe road crater reported at ${pothole.address || 'Urban Arterial Road'} (GPS: ${pothole.latitude.toFixed(4)}, ${pothole.longitude.toFixed(4)}).
Causing hazardous wheel impacts & accident risks. Immediate repair requested under Citizen Road Charter.
Inspection: ${mapsUrl}
Ref: #${grievanceRef} @PWD_Roads @MunicipalCorp #FixOurRoads #RoadSafetyNow`;

  // Pre-drafted Formal Civic Notice to Municipal Commissioner / Public Works Department
  const formalLetter = `To:
The Executive Engineer & Municipal Commissioner
Public Works Department (Roads & Infrastructure)

Subject: URGENT ROAD REPAIR NOTICE - SEVERE HAZARD AT ${pothole.address?.toUpperCase() || 'PUBLIC ARTERIAL ROAD'}
Grievance Reference ID: ${grievanceRef}

Respected Authority,

This is a formal notification regarding a verified road crater / structural hazard detected via the RoadWatch Citizen Monitoring Network.

INCIDENT & GEOGRAPHIC SPECIFICATIONS:
• Exact Coordinates: ${pothole.latitude}, ${pothole.longitude}
• Location: ${pothole.address}
• Severity Level: ${pothole.severity?.toUpperCase()} (Rim strike / vehicle suspension damage risk)
• Community Validations: ${pothole.confirmations || 1} independent citizen confirmations
• Initial Report Date: ${new Date(pothole.reportedAt).toLocaleString()}
• Direct Satellite Location: ${mapsUrl}

Under the Public Safety & Municipal Maintenance Guidelines, immediate inspection and hot-mix patching are requested within 72 hours to prevent road accidents, two-wheeler skidding, and vehicle damage.

Submitted on behalf of local citizens & commuters,
RoadWatch Civic Accountability Network`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenTweet = () => {
    const encoded = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent(`URGENT: Road Hazard Repair Notice - Ref #${grievanceRef}`);
    const body = encodeURIComponent(formalLetter);
    window.open(`mailto:grievances@municipal.gov.in?subject=${subject}&body=${body}`, '_blank');
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(`🚨 ROAD HAZARD WARNING: Deep pothole reported at ${pothole.address} (${pothole.latitude}, ${pothole.longitude}). View live hazard map: ${mapsUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[2900] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 shadow-2xl border-2 border-slate-700/80 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Civic Grievance & Social Export</h3>
              <p className="text-[11px] text-slate-400">Escalate directly to civic authorities & social media</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official Civic Report Card Preview */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-mono font-black text-blue-400">REF #{grievanceRef}</span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
              {pothole.severity?.toUpperCase()} SEVERITY
            </span>
          </div>

          <div className="flex gap-3">
            <img
              src={pothole.photoUrl}
              alt="Hazard proof"
              className="w-24 h-24 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-700"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-xs font-bold text-white truncate">{pothole.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">{pothole.description}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono pt-1">
                <Compass className="w-3 h-3 text-blue-400" />
                <span>{pothole.latitude.toFixed(5)}, {pothole.longitude.toFixed(5)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Validated by {pothole.confirmations || 1} Commuters</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tab Selector: Social Post vs Formal Authority Letter */}
        <div className="mt-4 flex rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'social'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Twitter / Social Grievance
          </button>
          <button
            onClick={() => setActiveTab('formal')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'formal'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Formal Authority Letter (PWD/Municipal)
          </button>
        </div>

        {/* Pre-drafted Text Viewer */}
        <div className="mt-3 relative">
          <textarea
            readOnly
            rows={activeTab === 'social' ? 4 : 7}
            value={activeTab === 'social' ? tweetText : formalLetter}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 font-mono leading-relaxed resize-none focus:outline-none"
          />
          <button
            onClick={() => handleCopy(activeTab === 'social' ? tweetText : formalLetter)}
            className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-slate-700 shadow"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Tweet / X Button */}
          <button
            onClick={handleOpenTweet}
            className="py-2.5 px-3 rounded-xl bg-black hover:bg-slate-900 border border-slate-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-black/40 active:scale-98 transition-all"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Post on X / Tweet</span>
          </button>

          {/* Email Grievance */}
          <button
            onClick={handleOpenEmail}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-98 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email Official</span>
          </button>

          {/* WhatsApp Alert */}
          <button
            onClick={handleOpenWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
