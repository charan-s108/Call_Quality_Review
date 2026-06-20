import { Card, CardContent, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { MOMENT_ITEM_CLASSES, MOMENT_BADGE_VARIANT, MOMENT_LABELS } from '@/constants.js';
import { cn } from '@/lib/utils.js';
import { Filter, AlertTriangle, Smile, Clock, VolumeX, MessageSquare } from 'lucide-react';

function formatTime(s) {
  if (s == null || typeof s !== 'number' || isNaN(s) || !isFinite(s)) return '0:00';
  const cleanS = Math.max(0, Math.floor(s));
  const m = Math.floor(cleanS / 60);
  const sec = cleanS % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function MomentsSidebar({ moments = [], onMomentClick, activeMomentFilter = 'ALL', setActiveMomentFilter }) {
  const safeMoments = Array.isArray(moments) ? moments : [];
  // Filter moments listed on the sidebar based on active selection
  const filteredMoments = activeMomentFilter === 'ALL'
    ? safeMoments
    : safeMoments.filter(m => m && m.type === activeMomentFilter);

  const momentCounts = {
    ALL: safeMoments.length,
    escalation: safeMoments.filter(m => m && m.type === 'escalation').length,
    empathy: safeMoments.filter(m => m && m.type === 'empathy').length,
    dead_air: safeMoments.filter(m => m && m.type === 'dead_air').length,
    long_monologue: safeMoments.filter(m => m && m.type === 'long_monologue').length,
  };

  const filterOptions = [
    { id: 'ALL', label: 'All', icon: Filter },
    { id: 'escalation', label: 'Escalations', icon: AlertTriangle },
    { id: 'empathy', label: 'Empathy', icon: Smile },
    { id: 'dead_air', label: 'Silence', icon: VolumeX },
    { id: 'long_monologue', label: 'Monologues', icon: MessageSquare }
  ];

  return (
    <Card className="bg-[#151722]/50 border-w-border/80 shadow-md">
      <CardContent className="pt-4 space-y-3">
        <CardTitle className="text-w-muted flex items-center justify-between">
          <span>Signal Indicators</span>
          <span className="text-[10px] bg-black/35 px-2 py-0.5 rounded font-mono font-bold text-w-hint select-none">
            {filteredMoments.length} of {safeMoments.length}
          </span>
        </CardTitle>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 pb-2 border-b border-w-border/40">
          {filterOptions.map(opt => {
            const count = momentCounts[opt.id];
            if (count === 0 && opt.id !== 'ALL') return null; // Hide categories that don't have moments
            
            const Icon = opt.icon;
            const isActive = activeMomentFilter === opt.id;
            
            return (
              <button
                key={opt.id}
                onClick={() => setActiveMomentFilter(opt.id)}
                type="button"
                className={cn(
                  'px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-all duration-150 border',
                  isActive
                    ? 'bg-w-yellow/10 text-w-yellow border-w-yellow/30'
                    : 'bg-black/20 text-w-hint border-transparent hover:text-w-text hover:bg-black/40'
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{opt.label}</span>
                <span className="opacity-60 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Moments List */}
        {filteredMoments.length === 0 ? (
          <p className="text-w-hint text-xs text-center py-8">No matching signals found</p>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-0.5">
            {filteredMoments.map((moment, idx) => (
              <button
                key={moment.id || idx}
                type="button"
                onClick={() => onMomentClick(moment.turnIndex)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg border-l-3',
                  'bg-[#12111d]/60 border border-w-border border-l-2',
                  MOMENT_ITEM_CLASSES[moment.type],
                  'hover:bg-white/[0.03] hover:border-w-border/80 transition-all cursor-pointer shadow-sm relative group',
                  'focus:outline-none focus:ring-1 focus:ring-w-yellow/30'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={MOMENT_BADGE_VARIANT[moment.type]} className="px-1.5 py-0.2 tracking-wider">
                    {MOMENT_LABELS[moment.type]}
                  </Badge>
                  <span className="text-[10px] text-w-hint font-mono flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(moment.t)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-[9px] text-w-hint uppercase tracking-wider font-bold mb-1">
                  <span>{moment.speaker}</span>
                </div>

                <p className="text-xs text-w-muted leading-relaxed line-clamp-2 italic group-hover:text-w-text transition-colors">
                  "{moment.matchedText}"
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
