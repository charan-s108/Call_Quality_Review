import { Badge } from '@/components/ui/badge.jsx';
import { MOMENT_TURN_CLASSES, MOMENT_BADGE_VARIANT } from '@/constants.js';
import { cn } from '@/lib/utils.js';
import { Smile, AlertTriangle, User, Headphones } from 'lucide-react';

function formatTime(s) {
  if (s == null || typeof s !== 'number' || isNaN(s) || !isFinite(s)) return '0:00';
  const cleanS = Math.max(0, Math.floor(s));
  const m = Math.floor(cleanS / 60);
  const sec = cleanS % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Highlight escalation and empathy keywords in text for immediate visual context
function highlightTriggers(text, moments = []) {
  if (!moments || moments.length === 0) return text;
  
  let highlighted = text;
  
  // We want to highlight specific trigger words that caused escalations or empathy flags
  const escalationWords = ['cancel', 'refund', 'manager', 'lawsuit', 'ridiculous', 'unacceptable'];
  const empathyWords = ['understand', 'sorry', 'apologise', 'apologize', 'see why'];

  let hasEscalationFlag = moments.some(m => m.type === 'escalation');
  let hasEmpathyFlag = moments.some(m => m.type === 'empathy');

  if (hasEscalationFlag) {
    escalationWords.forEach(word => {
      const regex = new RegExp(`\\b(${word}s?)\\b`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="bg-w-red/15 text-w-red border-b-2 border-w-red px-1 rounded-sm font-semibold">$1</span>');
    });
  }

  if (hasEmpathyFlag) {
    empathyWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="bg-w-green/15 text-w-green border-b-2 border-w-green px-1 rounded-sm font-semibold">$1</span>');
    });
  }

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

export default function TranscriptView({ annotatedTurns = [], activeMomentFilter = 'ALL', currentPlayingTurnIndex = null, isPlaying = false }) {
  const safeTurns = Array.isArray(annotatedTurns) ? annotatedTurns : [];
  if (safeTurns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-w-hint bg-w-card/5 border border-dashed border-w-border m-6 rounded-xl">
        <p className="font-semibold text-w-muted text-sm">No transcript data found</p>
        <p className="text-xs text-w-hint mt-1">Ingest a valid JSON to see turns here</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4 max-w-4xl mx-auto">
      {safeTurns.map((turn, i) => {
        const turnMoments = turn.moments || [];
        // Filter moments shown on the transcript based on the sidebar filter selection
        const filteredMoments = activeMomentFilter === 'ALL'
          ? turnMoments
          : turnMoments.filter(m => m.type === activeMomentFilter);
        
        const hasMoments = filteredMoments.length > 0;
        const topMoment = hasMoments
          ? filteredMoments.reduce((a, b) => (a.priority >= b.priority ? a : b))
          : null;
        
        // Custom background and border styles for turns with moments
        const highlightClasses = topMoment ? MOMENT_TURN_CLASSES[topMoment.type] : null;
        const isAgent = turn.speaker === 'agent';
        
        // Check if this turn is currently being spoken by the TTS engine
        const isActivePlaying = isPlaying && currentPlayingTurnIndex === i;

        return (
          <div
            key={i}
            id={`turn-${i}`}
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl border border-w-border/40 scroll-mt-24 transition-all duration-300 relative group',
              isAgent 
                ? 'bg-w-card/15 hover:bg-w-card/25 ml-0 md:ml-12' 
                : 'bg-w-bg-deep/40 hover:bg-w-bg-deep/70 mr-0 md:mr-12',
              hasMoments ? cn(highlightClasses, 'border-l-4 shadow-sm') : 'border-l-w-border/80',
              isActivePlaying && 'border-w-yellow/50 bg-[#161925]/60 shadow-[0_0_15px_rgba(244,247,61,0.06)]'
            )}
          >
            {/* Monogram Speaker Avatar */}
            <div className="flex-shrink-0 relative">
              {isAgent ? (
                <div className="w-9 h-9 rounded-lg bg-w-yellow/10 border border-w-yellow/30 flex items-center justify-center text-w-yellow text-[11px] font-bold shadow-sm select-none" title="Agent">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-w-border/60 flex items-center justify-center text-w-muted text-[11px] font-bold shadow-sm select-none" title="Customer">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Pulsing voice wave bars indicator overlay when turn is playing */}
              {isActivePlaying && (
                <div className="absolute -bottom-1 -right-1 bg-[#10131c] border border-w-yellow/40 rounded px-1 py-0.5 flex gap-[1.5px] items-center h-4 shadow-md z-10">
                  <div className="w-[1.5px] bg-w-yellow rounded-full animate-wave-1" />
                  <div className="w-[1.5px] bg-w-yellow rounded-full animate-wave-2" />
                  <div className="w-[1.5px] bg-w-yellow rounded-full animate-wave-3" />
                </div>
              )}
            </div>

            {/* Conversation Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold uppercase tracking-wider', isAgent ? 'text-w-yellow' : 'text-w-muted')}>
                  {isAgent ? 'Agent' : 'Customer'}
                </span>
                <span className="text-[10px] text-w-hint font-mono tabular-nums bg-black/25 px-1.5 py-0.5 rounded border border-w-border/40">
                  {formatTime(turn.t)}
                </span>
              </div>
              
              <p className={cn(
                'text-sm leading-relaxed min-w-0 break-words',
                hasMoments ? 'text-w-text' : 'text-w-muted group-hover:text-w-text/90 transition-colors'
              )}>
                {highlightTriggers(turn.text, filteredMoments)}
              </p>
            </div>

            {/* Moment badges list aligned on the right */}
            {hasMoments && (
              <div className="flex-shrink-0 flex flex-col gap-1 items-end self-center">
                {filteredMoments.map((m, idx) => (
                  <Badge 
                    key={m.id || idx} 
                    variant={MOMENT_BADGE_VARIANT[m.type]} 
                    className="shadow-sm border-w-border px-2 py-0.5"
                  >
                    <span className="flex items-center gap-1">
                      {m.type === 'escalation' && <AlertTriangle className="w-2.5 h-2.5" />}
                      {m.type === 'empathy' && <Smile className="w-2.5 h-2.5" />}
                      {m.type === 'dead_air' ? 'DEAD AIR' :
                       m.type === 'long_monologue' ? 'MONOLOGUE' :
                       m.type.toUpperCase()}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
