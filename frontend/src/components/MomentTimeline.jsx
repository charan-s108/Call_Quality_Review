import { useState } from 'react';
import { MOMENT_COLORS, MOMENT_LABELS } from '@/constants.js';
import { Activity, Clock } from 'lucide-react';

function formatTime(s) {
  if (s == null || typeof s !== 'number' || isNaN(s) || !isFinite(s)) return '0:00';
  const cleanS = Math.max(0, Math.floor(s));
  const m = Math.floor(cleanS / 60);
  const sec = cleanS % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function MomentTimeline({ moments = [], duration = 0, onMomentClick }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="bg-[#10131c] border-b border-w-border/80 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-w-hint flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-w-yellow" />
          Interactive Signal Timeline
        </p>
        <span className="text-[10px] text-w-hint font-mono bg-[#161925] px-2 py-0.5 border border-w-border rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Click pin to jump to transcript turn
        </span>
      </div>

      {/* Track container */}
      <div className="relative py-2.5">
        {/* Track BG */}
        <div className="relative h-2 bg-w-card/80 border border-w-border/60 rounded-full shadow-inner overflow-hidden">
          {/* Subtle striped background for visual depth */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        </div>

        {/* Markers */}
        {moments.map((m, idx) => {
          const pct = duration > 0 ? Math.min((m.t / duration) * 100, 97) : 0;
          const color = MOMENT_COLORS[m.type] || '#888';
          
          return (
            <button
              key={m.id || idx}
              type="button"
              onClick={() => onMomentClick(m.turnIndex)}
              onMouseEnter={() => setTooltip({ id: m.id, pct, label: MOMENT_LABELS[m.type], time: formatTime(m.t), speaker: m.speaker.toUpperCase() })}
              onMouseLeave={() => setTooltip(null)}
              style={{
                left: `${pct}%`,
                background: color,
                boxShadow: `0 0 10px ${color}bb`,
              }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#10131c] cursor-pointer hover:scale-125 hover:shadow-[0_0_15px_rgba(255,255,255,1)] hover:border-w-text transition-all z-10 focus:outline-none"
            />
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{ left: `${tooltip.pct}%` }}
            className="absolute bottom-[28px] -translate-x-1/2 bg-[#1b1c2b] border border-w-border/80 rounded-lg p-2 text-[11px] text-w-text whitespace-nowrap shadow-xl pointer-events-none z-30 flex flex-col gap-0.5"
          >
            <div className="flex items-center justify-between gap-3 font-semibold text-w-yellow">
              <span>{tooltip.label}</span>
              <span className="font-mono text-w-hint">{tooltip.time}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-w-hint font-medium">
              Speaker: {tooltip.speaker}
            </span>
          </div>
        )}
      </div>

      {/* Axis markers */}
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[10px] text-w-hint/60 font-mono font-bold">0:00 START</span>
        
        {/* Subtle midway indicators */}
        <span className="text-[9px] text-w-hint/30 font-mono hidden sm:inline-block">MIDPOINT ({formatTime(Math.floor(duration/2))})</span>
        
        <span className="text-[10px] text-w-hint/60 font-mono font-bold">{formatTime(duration)} END</span>
      </div>
    </div>
  );
}
