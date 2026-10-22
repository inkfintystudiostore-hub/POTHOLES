import React, { useState } from 'react';
import { X, MapPin, Calendar, ThumbsUp, AlertTriangle, Shield, CheckCircle2, Share2, Compass, Check, ArrowRight, Camera, Send } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import UploadFixedModal from './UploadFixedModal';

const LIFECYCLE_STAGES = [
  { id: 'reported', label: 'Reported', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
  { id: 'verified', label: 'Verified (3+)', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  { id: 'in_repair', label: 'In Repair', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  { id: 'fixed', label: 'Fixed & Patched', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
];

export default function InspectionSidebar({
  pothole,
  onClose,
  onUpvote,
  onMarkFixed,
  onOpenGrievance,
}) {
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);

  if (!pothole) return null;

  const currentStatus = pothole.status || 'reported';
  const isFixed = currentStatus === 'fixed';

  const getStageIndex = (status) => {
    switch (status) {
      case 'fixed': return 3;
      case 'in_repair': return 2;
      case 'verified': return 1;
      case 'reported':
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(currentStatus);

  return (
    <>
      <aside className="absolute bottom-4 right-4 top-20 md:top-24 w-[calc(100vw-32px)] md:w-[420px] glass-panel rounded-3xl p-5 z-[1000] flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-right duration-300 shadow-2xl border-2 border-slate-700/80">
        <div>
          {/* Top Status & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${isFixed ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}
              />
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isFixed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }`}
              >
                {isFixed ? '🟢 REPAIR VERIFIED (FIXED)' : '🔴 ACTIVE ROAD HAZARD'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4-Stage Lifecycle Stepper */}
          <div className="my-3.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Civic Repair Lifecycle:</span>
              <span className="text-white font-mono">{currentStageIdx + 1}/4 Complete</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const isActive = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div key={stage.id} className="flex flex-col items-center">
                    <div
                      className={`w-full h-1.5 rounded-full mb-1.5 transition-all ${
                        isActive
                          ? idx === 3
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                            : idx === 2
                            ? 'bg-blue-500'
                            : idx === 1
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                          : 'bg-slate-800'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-bold leading-tight ${
                        isCurrent
                          ? 'text-white'
                          : isActive
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Presentation: Interactive Slider IF Fixed, else Standard Image */}
          {isFixed && pothole.fixedPhotoUrl ? (
            <div className="mt-2">
              <BeforeAfterSlider
                beforeImage={pothole.photoUrl}
                afterImage={pothole.fixedPhotoUrl}
              />
              <div className="mt-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-[11px] text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Patched on {pothole.fixedAt ? new Date(pothole.fixedAt).toLocaleDateString() : 'Recently'} by {pothole.fixedBy || 'PWD Road Squad'}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-slate-700 aspect-video bg-slate-900 group">
              <img
                src={pothole.photoUrl}
                alt={pothole.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-white">
                <Compass className="w-3 h-3 text-blue-400" />
                <span>{pothole.latitude.toFixed(4)}, {pothole.longitude.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div className="mt-4">
            <h2 className="text-base font-extrabold text-white leading-snug">
              {pothole.title || pothole.address}
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {pothole.description}
            </p>
          </div>

          {/* Location & Time Info */}
          <div className="mt-3.5 space-y-2 bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Location:
              </span>
              <span className="text-slate-200 font-bold truncate max-w-[200px]">
                {pothole.address}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Reported:
              </span>
              <span className="text-slate-200">
                {new Date(pothole.reportedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
          {/* Civic Grievance & Export Button */}
          <button
            onClick={() => onOpenGrievance(pothole)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>File Civic Grievance & Tweet PWD</span>
          </button>

          {!isFixed && (
            <button
              onClick={() => setIsFixedModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Verify Road Repaired (Upload Fixed Proof)</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpvote(pothole.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 active:scale-98 transition-all"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>
                {isFixed ? 'Thank Repair Crew' : 'Confirm Hazard'} ({pothole.upvotes || 0})
              </span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Road Hazard: ${pothole.latitude}, ${pothole.longitude} - ${pothole.title}`
                );
                alert('Coordinates copied to clipboard!');
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Share Location"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Upload Fixed Proof Modal */}
      <UploadFixedModal
        isOpen={isFixedModalOpen}
        onClose={() => setIsFixedModalOpen(false)}
        pothole={pothole}
        onSubmitFixedProof={onMarkFixed}
      />
    </>
  );
}
