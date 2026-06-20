import { v4 as uuidv4 } from 'uuid';
import { MOMENT_TYPES, MOMENT_PRIORITY } from './constants.js';

const ESCALATION_KEYWORDS = /\b(cancel|refund|manager|lawsuit|ridiculous|unacceptable)\b/gi;

const EMPATHY_PATTERNS = [
  /i.*understand/i,
  /i.?m sorry/i,
  /i apologise/i,
  /i can see why/i
];

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

export function detectMoments(turns = []) {
  const safeTurns = Array.isArray(turns) ? turns : [];
  const moments = [];

  safeTurns.forEach((turn, i) => {
    if (!turn || typeof turn !== 'object') return;
    const { speaker = '', text = '', t = 0 } = turn;
    const cleanText = typeof text === 'string' ? text : '';
    const cleanT = typeof t === 'number' && !isNaN(t) ? t : 0;
    const cleanSpeaker = typeof speaker === 'string' ? speaker : '';

    // Dead air: gap from previous turn > 15s, flagged at the resuming turn
    if (i > 0 && safeTurns[i - 1]) {
      const prevT = typeof safeTurns[i - 1].t === 'number' && !isNaN(safeTurns[i - 1].t) ? safeTurns[i - 1].t : 0;
      const gap = cleanT - prevT;
      if (gap > 15) {
        moments.push({
          id: uuidv4(),
          type: MOMENT_TYPES.DEAD_AIR,
          turnIndex: i,
          t: cleanT,
          speaker: cleanSpeaker,
          matchedText: `${gap}s silence`,
          priority: MOMENT_PRIORITY.dead_air
        });
      }
    }

    // Escalation signal: customer turns only
    if (cleanSpeaker === 'customer') {
      const matches = cleanText.match(ESCALATION_KEYWORDS);
      if (matches) {
        const unique = [...new Set(matches.map(m => m.toLowerCase()))];
        moments.push({
          id: uuidv4(),
          type: MOMENT_TYPES.ESCALATION,
          turnIndex: i,
          t: cleanT,
          speaker: cleanSpeaker,
          matchedText: unique.join(', '),
          priority: MOMENT_PRIORITY.escalation
        });
      }
    }

    // Empathy statement: agent turns only — regex catches "I completely understand" etc.
    if (cleanSpeaker === 'agent') {
      const matchedPattern = EMPATHY_PATTERNS.find(p => p.test(cleanText));
      if (matchedPattern) {
        const m = cleanText.match(matchedPattern);
        moments.push({
          id: uuidv4(),
          type: MOMENT_TYPES.EMPATHY,
          turnIndex: i,
          t: cleanT,
          speaker: cleanSpeaker,
          matchedText: m ? m[0].slice(0, 60) : cleanText.slice(0, 60),
          priority: MOMENT_PRIORITY.empathy
        });
      }
    }

    // Long monologue: any speaker, word count > 50
    if (wordCount(cleanText) > 50) {
      moments.push({
        id: uuidv4(),
        type: MOMENT_TYPES.LONG_MONOLOGUE,
        turnIndex: i,
        t: cleanT,
        speaker: cleanSpeaker,
        matchedText: cleanText.slice(0, 60) + '…',
        priority: MOMENT_PRIORITY.long_monologue
      });
    }
  });

  // Priority desc, then timestamp asc
  moments.sort((a, b) => b.priority - a.priority || a.t - b.t);

  return moments;
}
