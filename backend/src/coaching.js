import { MOMENT_TYPES } from './constants.js';

export function generateCoachingNote(turns = [], moments = []) {
  const safeTurns = Array.isArray(turns) ? turns : [];
  const safeMoments = Array.isArray(moments) ? moments : [];

  const escalations = safeMoments.filter(m => m && m.type === MOMENT_TYPES.ESCALATION);
  const empathies = safeMoments.filter(m => m && m.type === MOMENT_TYPES.EMPATHY);
  const deadAirs = safeMoments.filter(m => m && m.type === MOMENT_TYPES.DEAD_AIR);
  const longMonologues = safeMoments.filter(m => m && m.type === MOMENT_TYPES.LONG_MONOLOGUE);

  const escalationCount = escalations.length;
  const empathyCount = empathies.length;
  const deadAirCount = deadAirs.length;
  const longMonologueCount = longMonologues.length;

  // Rules checked in priority order; first match wins
  if (escalationCount > 0 && empathyCount === 0) {
    return 'Customer escalated with no empathy response detected. Consider acknowledging concerns earlier.';
  }

  if (escalationCount > 0 && empathyCount > 0) {
    const escIndices = escalations.map(m => m.turnIndex).filter(idx => typeof idx === 'number' && !isNaN(idx));
    const empIndices = empathies.map(m => m.turnIndex).filter(idx => typeof idx === 'number' && !isNaN(idx));
    if (escIndices.length > 0 && empIndices.length > 0) {
      const firstEscalationIdx = Math.min(...escIndices);
      const firstEmpathyIdx = Math.min(...empIndices);
      if (firstEmpathyIdx > firstEscalationIdx) {
        return 'Customer escalated before empathy was shown. Consider acknowledging concerns earlier.';
      }
    }
  }

  if (deadAirCount >= 2) {
    return 'Multiple dead air periods detected. Review account lookup and hold workflows.';
  }

  if (deadAirCount === 1) {
    return 'Dead air detected. Avoid extended silences during account lookup.';
  }

  if (longMonologueCount > 0) {
    const customerMonologue = longMonologues.find(m => m && m.speaker === 'customer');
    if (customerMonologue) {
      return 'Customer delivered a long monologue. Consider proactive clarification earlier.';
    }
    return 'Agent delivered a long monologue. Keep responses concise and targeted.';
  }

  if (empathyCount > 0 && escalationCount === 0) {
    return 'Strong empathy demonstrated throughout the call. No escalations detected.';
  }

  return 'Call completed without notable coaching concerns.';
}
