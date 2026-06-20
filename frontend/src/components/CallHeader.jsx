import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, ShieldAlert, UserCheck, Download, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

function formatDuration(seconds) {
  if (seconds == null || typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) return '0m 00s';
  const cleanS = Math.max(0, Math.floor(seconds));
  const m = Math.floor(cleanS / 60);
  const s = cleanS % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function CallHeader({ call, onDelete }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { agentName = 'Agent', duration = 0, totalMoments = 0, summary = {}, callId = '' } = call || {};
  const { sentimentArc = 'neutral', escalationCount = 0 } = summary || {};
  const initials = agentName ? agentName.substring(0, 2).toUpperCase() : 'AG';
  const hasEscalations = escalationCount > 0;

  return (
    <div className="bg-[#10131c] border-b border-w-border/80 px-6 py-4 flex-shrink-0 space-y-3">
      {/* Breadcrumbs and navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-w-hint font-medium">
          <button 
            onClick={() => navigate('/')} 
            className="hover:text-w-yellow transition-colors flex items-center gap-0.5"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-w-muted font-mono">{callId}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="h-7 text-w-hint hover:text-w-text hover:bg-white/5 gap-1 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to list
        </Button>
      </div>

      {/* Main header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Agent Avatar */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-lg shadow-black/30 border flex-shrink-0',
            hasEscalations 
              ? 'bg-w-red/10 text-w-red border-w-red/20' 
              : 'bg-[#1b1c2b] text-w-yellow border-w-border'
          )}>
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-w-text">
                {agentName}
              </h1>
              <span className="text-[10px] text-w-hint bg-[#161925] border border-w-border px-2 py-0.5 rounded font-mono select-all">
                ID: {callId}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-w-hint">
              <span className="flex items-center gap-1 font-mono text-w-muted tabular-nums">
                <Clock className="w-3.5 h-3.5 text-w-hint" />
                {formatDuration(duration)}
              </span>
              <span className="text-w-border/80 select-none">•</span>
              <span className="text-w-muted">
                {totalMoments} Flagged Moment{totalMoments !== 1 ? 's' : ''}
              </span>
              <span className="text-w-border/80 select-none">•</span>
              <Badge variant={sentimentArc} className="font-bold tracking-wider px-2 py-0.5">
                {sentimentArc}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action / Flag status widget */}
        <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
          {/* Delete Call Button (2-step confirm) */}
          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => { setConfirmDelete(false); onDelete(); }}
                  className="h-10 text-xs font-semibold border-w-red/40 text-w-red hover:bg-w-red/10 hover:border-w-red/70 gap-1.5 animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirm Delete
                </Button>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => setConfirmDelete(false)}
                  className="h-10 text-xs text-w-hint hover:text-w-text hover:bg-white/5 gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="default"
                onClick={() => setConfirmDelete(true)}
                className="h-10 text-xs font-semibold border-w-border text-w-hint hover:border-w-red/40 hover:text-w-red hover:bg-w-red/5 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Call
              </Button>
            )
          )}

          {/* Export PDF Button */}
          <Button
            variant="outline"
            size="default"
            onClick={() => window.print()}
            className="h-10 text-xs font-semibold hover:border-w-yellow/50 gap-1.5 flex bg-w-card"
          >
            <Download className="w-3.5 h-3.5 text-w-hint" />
            Export to PDF
          </Button>

          {hasEscalations ? (
            <div className="bg-w-red/10 border border-w-red/20 rounded-xl px-4 py-2 flex items-center gap-3 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-w-red/25 flex items-center justify-center text-w-red animate-pulse">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-w-red leading-none tabular-nums">
                  {escalationCount}
                </div>
                <div className="text-[9px] font-bold text-w-red/80 tracking-wider uppercase mt-0.5">
                  Escalation{escalationCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-w-green/10 border border-w-green/20 rounded-xl px-4 py-2 flex items-center gap-3 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-w-green/25 flex items-center justify-center text-w-green">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-w-green leading-none">
                  CLEAN CALL
                </div>
                <div className="text-[9px] font-bold text-w-green/80 tracking-wider uppercase mt-1">
                  No Escalations
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
