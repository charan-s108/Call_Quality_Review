import { Card, CardContent, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils.js';
import { useState } from 'react';
import { Smile, ShieldAlert, TrendingUp, Sparkles, BookOpen, Download, Check, Clipboard, Copy } from 'lucide-react';

function MetricRow({ icon: Icon, label, children }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-w-border/60 last:border-0">
      <span className="text-xs text-w-hint flex items-center gap-1.5 font-medium">
        {Icon && <Icon className="w-3.5 h-3.5 text-w-hint" />}
        {label}
      </span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  );
}

export default function SummaryPanel({ summary }) {
  const [copiedReport, setCopiedReport] = useState(false);
  
  const { 
    talkRatio = { agent: 0, customer: 0 }, 
    escalationCount = 0, 
    empathyScore = 1.0, 
    sentimentArc = 'neutral', 
    totalMoments = 0, 
    momentDensity = 0, 
    coachingNote = 'Call completed without notable coaching concerns.' 
  } = summary || {};

  const safeEmpathyScore = typeof empathyScore === 'number' && !isNaN(empathyScore) ? empathyScore : 1.0;
  const safeMomentDensity = typeof momentDensity === 'number' && !isNaN(momentDensity) ? momentDensity : 0;

  const empathyColor =
    safeEmpathyScore >= 0.7 ? 'text-w-green' : safeEmpathyScore >= 0.4 ? 'text-w-orange' : 'text-w-red';

  const copyReportText = () => {
    const textReport = `CALL QUALITY REVIEW REPORT
----------------------------
Talk Ratio: Agent ${talkRatio?.agent ?? 0}% | Customer ${talkRatio?.customer ?? 0}%
Escalations: ${escalationCount}
Empathy Score: ${safeEmpathyScore.toFixed(2)}
Sentiment Arc: ${(sentimentArc || 'neutral').toUpperCase()}
Total Flagged Moments: ${totalMoments}
Moment Density: ${safeMomentDensity.toFixed(2)}/min

COACHING ADVISORY:
"${coachingNote}"`;

    navigator.clipboard.writeText(textReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-3.5">
      {/* Talk Ratio */}
      <Card className="bg-[#151722]/50 border-w-border/80 shadow-md">
        <CardContent className="pt-4">
          <CardTitle className="text-w-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-w-yellow" />
            Talk Ratio
          </CardTitle>
          <div className="flex justify-between text-xs mb-2 font-semibold">
            <span className="text-w-yellow">Agent {typeof talkRatio?.agent === 'number' && !isNaN(talkRatio.agent) ? talkRatio.agent : 0}%</span>
            <span className="text-w-muted">Customer {typeof talkRatio?.customer === 'number' && !isNaN(talkRatio.customer) ? talkRatio.customer : 0}%</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-w-yellow/80 to-w-yellow transition-all duration-500 rounded-l-full"
              style={{ width: `${typeof talkRatio?.agent === 'number' && !isNaN(talkRatio.agent) ? talkRatio.agent : 0}%` }}
            />
            <div
              className="h-full bg-white/10 transition-all duration-500 rounded-r-full"
              style={{ width: `${typeof talkRatio?.customer === 'number' && !isNaN(talkRatio.customer) ? talkRatio.customer : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <Card className="bg-[#151722]/50 border-w-border/80 shadow-md">
        <CardContent className="pt-4">
          <CardTitle className="text-w-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-w-yellow animate-pulse" />
            Performance Metrics
          </CardTitle>
          
          <MetricRow icon={ShieldAlert} label="Escalations">
            <span className={cn('font-bold tabular-nums', escalationCount > 0 ? 'text-w-red' : 'text-w-hint')}>
              {escalationCount}
            </span>
          </MetricRow>
          
          <MetricRow icon={Smile} label="Empathy Score">
            <span className={cn('font-bold tabular-nums', empathyColor)}>{safeEmpathyScore.toFixed(2)}</span>
          </MetricRow>
          
          <MetricRow icon={TrendingUp} label="Sentiment Arc">
            <Badge variant={sentimentArc} className="font-bold px-2 py-0.5 tracking-wider shadow-sm">
              {sentimentArc}
            </Badge>
          </MetricRow>
          
          <MetricRow icon={TrendingUp} label="Total Moments">
            <span className="text-w-yellow font-bold tabular-nums">{totalMoments}</span>
          </MetricRow>
          
          <MetricRow icon={TrendingUp} label="Moment Density">
            <span className="text-w-muted text-xs tabular-nums font-mono">{safeMomentDensity.toFixed(2)}/min</span>
          </MetricRow>
        </CardContent>
      </Card>

      {/* Coaching Note */}
      {coachingNote && (
        <Card className="border-w-yellow/20 bg-w-yellow/[0.01] shadow-lg shadow-w-yellow/[0.005]">
          <CardContent className="pt-4">
            <CardTitle className="text-w-yellow/80 flex items-center gap-1.5 font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              Supervisor Advisory
            </CardTitle>
            <div className="bg-[#1d1b22] border border-w-yellow/10 rounded-lg p-3 mt-1">
              <p className="text-xs text-w-yellow/90 font-medium italic leading-relaxed">
                "{coachingNote}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <button
        onClick={copyReportText}
        type="button"
        className={cn(
          'w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200',
          copiedReport
            ? 'bg-w-green/10 text-w-green border-w-green/30'
            : 'bg-w-card hover:bg-white/[0.02] text-w-muted border-w-border/80 hover:text-w-text hover:border-w-yellow/30'
        )}
      >
        {copiedReport ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Report Copied!
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy Review Summary
          </>
        )}
      </button>
    </div>
  );
}
