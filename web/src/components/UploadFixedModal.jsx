import React, { useState } from 'react';
import { X, CheckCircle2, Camera, Sparkles, Upload } from 'lucide-react';

const REPAIRED_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
];

export default function UploadFixedModal({
  isOpen,
  onClose,
  pothole,
  onSubmitFixedProof,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(REPAIRED_SAMPLE_PHOTOS[0]);
  const [contractorNote, setContractorNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !pothole) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onSubmitFixedProof(pothole.id, {
        fixedPhotoUrl: selectedPhoto,
        fixedAt: new Date().toISOString(),
        fixedNote: contractorNote.trim() || 'Hot-mix asphalt patch laid and roller-compacted.',
        fixedBy: 'Citizen Verification Patrol',
      });
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[2800] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-slate-700/80 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Verify Road Repair</h3>
              <p className="text-[11px] text-slate-400">Mark as fixed with proof photo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Select Proof Photo of Repaired Asphalt:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {REPAIRED_SAMPLE_PHOTOS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhoto(url)}
                  className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all ${
                    selectedPhoto === url
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-102'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Repaired road" className="w-full h-full object-cover" />
                  {selectedPhoto === url && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-[9px]">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Repair Details / Note:
            </label>
            <textarea
              rows={2}
              value={contractorNote}
              onChange={(e) => setContractorNote(e.target.value)}
              placeholder="e.g. Hot-mix bitumen laid, curb reinforced, road reopened."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Fixed Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
