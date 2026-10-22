import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

export default function LocationSearch({ onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Debounced search using the free global Photon (OSM) API
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
        );
        const data = await res.json();

        if (data && data.features) {
          const formatted = data.features.map((f) => {
            const p = f.properties;
            const parts = [p.name, p.city, p.state, p.country].filter(Boolean);
            const label = [...new Set(parts)].join(', ');

            return {
              id: f.properties.osm_id || Math.random(),
              name: p.name,
              label,
              type: p.type || p.osm_value || 'location',
              coordinates: [f.geometry.coordinates[1], f.geometry.coordinates[0]], // [lat, lng]
            };
          });
          setResults(formatted);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelectLocation(item);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm pointer-events-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search city, town, state, or village..."
          className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-xs font-medium pl-9 pr-8 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-400 absolute right-3 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 z-[2000] max-h-60 overflow-y-auto animate-in fade-in duration-150">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-blue-600/20 border-b border-slate-800/60 last:border-0 flex items-start gap-2.5 transition-colors group"
            >
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.label}</div>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
