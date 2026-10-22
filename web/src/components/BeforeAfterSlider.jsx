import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'BEFORE (CRATER)',
  afterLabel = 'AFTER (PATCHED)',
}) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchMove={handleTouchMove}
      className="relative w-full aspect-video rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-700 bg-slate-900 shadow-xl"
    >
      {/* After Image (Background, full width) */}
      <img
        src={afterImage}
        alt="After repair"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-black text-emerald-400 uppercase tracking-wider backdrop-blur-md">
        {afterLabel}
      </div>

      {/* Before Image (Foreground, clipped by slider width) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before repair"
          className="absolute inset-0 max-w-none w-full h-full object-cover"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
        />
        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/40 text-[10px] font-black text-red-400 uppercase tracking-wider backdrop-blur-md">
          {beforeLabel}
        </div>
      </div>

      {/* Vertical Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Draggable Circular Knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-white shadow-2xl flex items-center justify-center text-white">
          <MoveHorizontal className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Top Helper Tooltip */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-extrabold text-slate-300 pointer-events-none">
        Drag slider to compare ⬌
      </div>
    </div>
  );
}
