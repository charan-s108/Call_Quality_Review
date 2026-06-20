import { MOMENT_TYPES } from './constants.js';
import { generateCoachingNote } from './coaching.js';

export function computeSummary(turns = [], moments = [], duration = 0) {
  const safeTurns = Array.isArray(turns) ? turns : [];
  const safeMoments = Array.isArray(moments) ? moments : [];
  const safeDuration = typeof duration === 'number' && !isNaN(duration) && isFinite(duration) ? Math.max(0, duration) : 0;

  const total = safeTurns.length;
  const agentTurns = safeTurns.filter(t => t && t.speaker === 'agent').length;
  const customerTurns = Math.max(0, total - agentTurns);

  const talkRatio = {
    agent: total > 0 ? Math.round((agentTurns / total) * 100) : 0,
    customer: total > 0 ? Math.round((customerTurns / total) * 100) : 0
  };

  const escalationMoments = safeMoments.filter(m => m && m.type === MOMENT_TYPES.ESCALATION);
  const empathyMoments = safeMoments.filter(m => m && m.type === MOMENT_TYPES.EMPATHY);
  const escalationCount = escalationMoments.length;
  const empathyCount = empathyMoments.length;
  const totalMoments = safeMoments.length;

  const empathyScore =
    escalationCount === 0
      ? 1.0
      : +(Math.min(1.0, empathyCount / (empathyCount + escalationCount)).toFixed(2));

  const mid = Math.floor(total / 2);
  const firstHalfEscalations = escalationMoments.filter(m => m && typeof m.turnIndex === 'number' && m.turnIndex < mid).length;
  const secondHalfEscalations = escalationMoments.filter(m => m && typeof m.turnIndex === 'number' && m.turnIndex >= mid).length;

  let sentimentArc;
  if (firstHalfEscalations > 0 && secondHalfEscalations === 0) {
    sentimentArc = 'improved';
  } else if (firstHalfEscalations === 0 && secondHalfEscalations > 0) {
    sentimentArc = 'declined';
  } else {
    sentimentArc = 'neutral';
  }

  const momentDensity = safeDuration > 0 ? +(totalMoments / (safeDuration / 60)).toFixed(2) : 0;
  const finalMomentDensity = isNaN(momentDensity) || !isFinite(momentDensity) ? 0 : momentDensity;

  const coachingNote = generateCoachingNote(safeTurns, safeMoments);

  return {
    talkRatio,
    escalationCount,
    empathyScore: isNaN(empathyScore) || !isFinite(empathyScore) ? 1.0 : empathyScore,
    sentimentArc,
    totalMoments,
    momentDensity: finalMomentDensity,
    coachingNote
  };
}
