import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, SlidersHorizontal, ArrowUpDown, TrendingUp, ShieldAlert, Smile, Phone, Activity, ChevronRight, Copy, Check, Trash2 } from 'lucide-react';
import { fetchCalls, deleteCall } from '@/api.js';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import TranscriptUpload from './TranscriptUpload.jsx';
import { cn } from '@/lib/utils.js';

function formatDuration(seconds) {
  if (seconds == null || typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) return '0m 00s';
  const cleanS = Math.max(0, Math.floor(seconds));
  const m = Math.floor(cleanS / 60);
  const s = cleanS % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function EmpathyScoreGauge({ score }) {
  const safeScore = typeof score === 'number' && !isNaN(score) && isFinite(score) ? score : 0;
  const percentage = Math.min(Math.max(safeScore * 100, 0), 100);
  const color = safeScore >= 0.7 ? 'bg-w-green' : safeScore >= 0.4 ? 'bg-w-orange' : 'bg-w-red';
  const textColor = safeScore >= 0.7 ? 'text-w-green' : safeScore >= 0.4 ? 'text-w-orange' : 'text-w-red';
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 bg-white/5 rounded-full h-1.5 overflow-hidden flex-shrink-0">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${percentage}%` }} />
      </div>
      <span className={cn('font-bold text-xs tabular-nums', textColor)}>
        {safeScore.toFixed(2)}
      </span>
    </div>
  );
}

export default function CallList() {
  const [calls, setCalls] = useState([]);
  const [agentFilter, setAgentFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'duration' | 'empathy' | 'escalation' | 'moments'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async (agentParam) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch calls from backend API (includes agent filtering)
      const data = await fetchCalls(agentParam);
      setCalls(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(agentFilter), agentFilter ? 250 : 0);
    return () => clearTimeout(t);
  }, [agentFilter, load]);

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async (e, callId) => {
    e.stopPropagation();
    setDeletingInProgress(true);
    try {
      await deleteCall(callId);
      setConfirmDeleteId(null);
      await load(agentFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingInProgress(false);
    }
  };

  // Dynamic statistics calculated on the frontend based on the active calls list
  const metrics = useMemo(() => {
    if (!Array.isArray(calls) || calls.length === 0) {
      return { total: 0, avgEmpathy: 0, totalEscalations: 0, criticalRatio: 0 };
    }
    
    const total = calls.length;
    const sumEmpathy = calls.reduce((acc, c) => {
      const score = c && typeof c.empathyScore === 'number' && !isNaN(c.empathyScore) && isFinite(c.empathyScore) ? c.empathyScore : 0;
      return acc + score;
    }, 0);
    const totalEscalations = calls.reduce((acc, c) => acc + (c && typeof c.escalationCount === 'number' && !isNaN(c.escalationCount) ? c.escalationCount : 0), 0);
    const criticalCalls = calls.filter(c => c && typeof c.escalationCount === 'number' && c.escalationCount > 0).length;
    
    return {
      total,
      avgEmpathy: total > 0 ? sumEmpathy / total : 0,
      totalEscalations,
      criticalRatio: total > 0 ? (criticalCalls / total) * 100 : 0
    };
  }, [calls]);

  // Filter calls by sentiment and sort them client-side
  const processedCalls = useMemo(() => {
    let result = [...calls];
    
    // Sentiment filter
    if (sentimentFilter !== 'ALL') {
      result = result.filter(c => c.sentimentArc?.toUpperCase() === sentimentFilter);
    }

    // Sort calls
    result.sort((a, b) => {
      let valA, valB;
      
      switch (sortBy) {
        case 'duration':
          valA = a.duration;
          valB = b.duration;
          break;
        case 'empathy':
          valA = a.empathyScore;
          valB = b.empathyScore;
          break;
        case 'escalation':
          valA = a.escalationCount || 0;
          valB = b.escalationCount || 0;
          break;
        case 'moments':
          valA = a.momentCount || 0;
          valB = b.momentCount || 0;
          break;
        case 'date':
        default:
          // Keep backend order or use callId
          valA = a.callId;
          valB = b.callId;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [calls, sentimentFilter, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const hasCalls = !loading && !error && calls.length > 0;
  const isEmpty  = !loading && !error && calls.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full space-y-6">

      {/* ── Dashboard Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-w-yellow font-display tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-w-yellow animate-pulse" />
            Supervisor Inbox
          </h1>
          <p className="text-xs text-w-hint mt-0.5">
            Real-time quality review and conversation insights dashboard
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant={showUpload ? 'outline' : 'default'}
            size="default"
            onClick={() => setShowUpload(v => !v)}
            className="gap-2 font-semibold shadow-lg shadow-w-yellow/5 hover:scale-[1.02] transition-transform duration-150"
          >
            {showUpload
              ? <><X className="w-4 h-4" /> Close Uploader</>
              : <><Plus className="w-4 h-4" /> Ingest Transcript</>
            }
          </Button>
        </div>
      </div>

      {/* ── Metrics Cards Grid ── */}
      {hasCalls && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-w-card/40 border border-w-border/80 rounded-xl p-4 flex items-center gap-4 hover:border-w-border transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-w-blue/10 flex items-center justify-center text-w-blue flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-w-hint">Total Calls</span>
              <h2 className="text-2xl font-bold text-w-text leading-none mt-1 tabular-nums">{metrics.total}</h2>
            </div>
          </div>

          <div className="bg-w-card/40 border border-w-border/80 rounded-xl p-4 flex items-center gap-4 hover:border-w-border transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-w-green/10 flex items-center justify-center text-w-green flex-shrink-0">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-w-hint">Avg Empathy</span>
              <h2 className="text-2xl font-bold text-w-green leading-none mt-1 tabular-nums">
                {typeof metrics.avgEmpathy === 'number' && !isNaN(metrics.avgEmpathy) ? metrics.avgEmpathy.toFixed(2) : '0.00'}
              </h2>
            </div>
          </div>

          <div className="bg-w-card/40 border border-w-border/80 rounded-xl p-4 flex items-center gap-4 hover:border-w-border transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-w-red/10 flex items-center justify-center text-w-red flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-w-hint">Escalations</span>
              <h2 className="text-2xl font-bold text-w-red leading-none mt-1 tabular-nums">{metrics.totalEscalations}</h2>
            </div>
          </div>

          <div className="bg-w-card/40 border border-w-border/80 rounded-xl p-4 flex items-center gap-4 hover:border-w-border transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-w-orange/10 flex items-center justify-center text-w-orange flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-w-hint">Critical Calls</span>
              <h2 className="text-2xl font-bold text-w-orange leading-none mt-1 tabular-nums">
                {typeof metrics.criticalRatio === 'number' && !isNaN(metrics.criticalRatio) ? metrics.criticalRatio.toFixed(0) : '0'}%
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Area ── */}
      {(showUpload || isEmpty) && (
        <div className={cn('transition-all duration-300', isEmpty && 'max-w-lg mx-auto py-8')}>
          <TranscriptUpload onSuccess={() => { setShowUpload(false); load(''); }} />
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-lg border border-w-red/20 bg-w-red/5 text-w-red px-4 py-3 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filters & Tools ── */}
      {hasCalls && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-w-card/20 border border-w-border/60 rounded-xl">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Agent Search */}
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-w-hint" />
              <Input
                placeholder="Filter by agent..."
                value={agentFilter}
                onChange={e => setAgentFilter(e.target.value)}
                className="pl-9 h-9 bg-w-card/60 border-w-border/80 text-xs"
              />
            </div>

            {/* Sentiment Segment Control */}
            <div className="flex bg-[#0f0e18] p-1 rounded-lg border border-w-border/80">
              {['ALL', 'IMPROVED', 'NEUTRAL', 'DECLINED'].map(variant => (
                <button
                  key={variant}
                  onClick={() => setSentimentFilter(variant)}
                  type="button"
                  className={cn(
                    'px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all duration-150',
                    sentimentFilter === variant
                      ? 'bg-w-yellow/10 text-w-yellow border border-w-yellow/20'
                      : 'text-w-hint hover:text-w-text border border-transparent'
                  )}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Sort Panel */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-w-hint mr-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-w-hint mr-1">Sort:</span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'date', label: 'ID' },
                { id: 'duration', label: 'Duration' },
                { id: 'empathy', label: 'Empathy' },
                { id: 'escalation', label: 'Escalations' },
                { id: 'moments', label: 'Moments' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleSort(opt.id)}
                  type="button"
                  className={cn(
                    'px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors border',
                    sortBy === opt.id
                      ? 'bg-[#1b1c2b] text-w-text border-w-yellow/30'
                      : 'bg-transparent text-w-hint border-transparent hover:text-w-text'
                  )}
                >
                  {opt.label}
                  {sortBy === opt.id && (
                    <ArrowUpDown className={cn('w-3 h-3 transition-transform', sortOrder === 'asc' ? 'rotate-180' : '')} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Loading Spinner ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-w-yellow/25 border-t-w-yellow rounded-full animate-spin" />
          <p className="text-w-hint text-xs font-medium">Fetching conversation inbox...</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {isEmpty && !showUpload && (
        <div className="flex flex-col items-center justify-center py-20 bg-w-card/10 border border-w-border/30 rounded-2xl text-center p-6 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-w-yellow/10 flex items-center justify-center text-w-yellow mb-3">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-w-text font-bold text-base mb-1">No call data available</h3>
          <p className="text-w-hint text-xs max-w-[280px] mb-4">
            Upload a supervisor call transcript JSON file to analyze signals.
          </p>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            Upload Call JSON
          </Button>
        </div>
      )}

      {/* ── Dashboard Grid / Cards ── */}
      {hasCalls && processedCalls.length === 0 && (
        <div className="text-center py-16 text-w-hint text-xs border border-dashed border-w-border/60 rounded-xl bg-w-card/5">
          No calls matches your active filters ({agentFilter && `agent: "${agentFilter}"`}{sentimentFilter !== 'ALL' && ` sentiment: "${sentimentFilter}"`}).
        </div>
      )}

      {hasCalls && processedCalls.length > 0 && (
        <div className="space-y-3">
          {/* Table Header labels */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.25fr_1fr_1.25fr_72px] items-center gap-4 px-5 text-[10px] font-bold tracking-widest uppercase text-w-hint">
            <span>Agent / ID</span>
            <span className="text-center md:text-left">Duration</span>
            <span className="text-center md:text-left">Moments</span>
            <span>Sentiment Arc</span>
            <span>Empathy Score</span>
            <span>Escalations</span>
            <span />
          </div>

          {/* Cards List */}
          <div className="space-y-2.5">
            {processedCalls.map(call => {
              const initials = call.agentName ? call.agentName.substring(0, 2).toUpperCase() : 'AG';
              const isCritical = (call.escalationCount || 0) > 0;
              
              return (
                <div
                  key={call.callId}
                  onClick={() => confirmDeleteId !== call.callId && navigate(`/calls/${call.callId}`)}
                  className={cn(
                    'grid grid-cols-[1.5fr_1fr_1fr_1.25fr_1fr_1.25fr_72px] items-center gap-4',
                    'bg-w-card/30 backdrop-blur-sm border rounded-xl px-5 py-3.5',
                    'cursor-pointer transition-all duration-300 group',
                    confirmDeleteId === call.callId
                      ? 'border-w-red/50 bg-w-red/[0.03] shadow-[0_0_15px_rgba(252,83,91,0.06)]'
                      : isCritical
                        ? 'border-w-red/20 hover:border-w-red/40 hover:shadow-[0_0_15px_rgba(252,83,91,0.04)] bg-w-red/[0.005]'
                        : 'border-w-border hover:border-w-yellow/30 hover:bg-white/[0.015] hover:shadow-[0_0_15px_rgba(244,247,61,0.03)]'
                  )}
                >
                  {/* Agent Column */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shadow-inner flex-shrink-0',
                      isCritical
                        ? 'bg-w-red/10 text-w-red border border-w-red/20'
                        : 'bg-[#1b1c2b] text-w-yellow border border-w-border/80 group-hover:border-w-yellow/30'
                    )}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-w-text text-sm leading-tight tracking-tight group-hover:text-w-yellow transition-colors truncate">
                        {call.agentName}
                      </p>
                      <button
                        onClick={(e) => copyToClipboard(e, call.callId)}
                        type="button"
                        className="text-[10px] text-w-hint font-mono mt-0.5 flex items-center gap-1 hover:text-w-text transition-colors select-all"
                      >
                        {call.callId}
                        {copiedId === call.callId ? (
                          <Check className="w-2.5 h-2.5 text-w-green" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Duration Column */}
                  <span className="text-w-muted text-xs font-medium font-mono tabular-nums text-center md:text-left">
                    {formatDuration(call.duration)}
                  </span>

                  {/* Moments Badge */}
                  <div className="text-center md:text-left">
                    <Badge variant="yellow" className="bg-[#1b1c2b] border-w-yellow/20 px-2 py-0.5">
                      {call.momentCount} moment{call.momentCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Sentiment Arc Badge */}
                  <div>
                    <Badge variant={call.sentimentArc} className="font-bold tracking-wider px-2 py-0.5 shadow-sm">
                      {call.sentimentArc}
                    </Badge>
                  </div>

                  {/* Empathy Score Gauge */}
                  <div>
                    <EmpathyScoreGauge score={call.empathyScore} />
                  </div>

                  {/* Escalation Column */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'text-xs font-bold tabular-nums px-2 py-0.5 rounded',
                      isCritical
                        ? 'bg-w-red/10 text-w-red border border-w-red/20'
                        : 'text-w-hint bg-white/5 border border-transparent'
                    )}>
                      {call.escalationCount || 0}
                    </span>
                    {isCritical && (
                      <span className="w-1.5 h-1.5 rounded-full bg-w-red animate-ping flex-shrink-0" />
                    )}
                  </div>

                  {/* Delete / Navigate Actions */}
                  {confirmDeleteId === call.callId ? (
                    <div className="flex justify-end items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Confirm delete"
                        disabled={deletingInProgress}
                        onClick={e => handleDelete(e, call.callId)}
                        className="p-1.5 rounded-md bg-w-red/10 hover:bg-w-red/20 text-w-red border border-w-red/20 transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Cancel"
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-w-hint border border-w-border/60 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end items-center gap-1">
                      <button
                        type="button"
                        title="Delete call"
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(call.callId); }}
                        className="p-1.5 rounded-md text-w-hint opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-w-red hover:bg-w-red/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-w-hint group-hover:text-w-yellow transition-colors">
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
