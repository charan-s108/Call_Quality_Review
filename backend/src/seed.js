import { saveCall, callExists } from './storage.js';
import { detectMoments } from './detectMoments.js';
import { computeSummary } from './summary.js';

const EXAMPLE_CALL = {
  callId: 'c001',
  agentName: 'Priya',
  duration: 240,
  turns: [
    {
      speaker: 'agent',
      text: 'Thank you for calling support, how can I help you today?',
      t: 0,
    },
    {
      speaker: 'customer',
      text: "I've been waiting three weeks for my refund and I still haven't received anything. This is completely unacceptable.",
      t: 7,
    },
    {
      speaker: 'agent',
      text: "I completely understand your frustration and I'm really sorry about the delay.",
      t: 18,
    },
    {
      speaker: 'customer',
      text: "I want to speak to a manager. I'm going to cancel my account if this isn't resolved today.",
      t: 25,
    },
    {
      speaker: 'agent',
      text: 'Absolutely, let me pull up your account right now and get this sorted for you.',
      t: 48,
    },
  ],
};

export function seedExampleCall() {
  if (callExists(EXAMPLE_CALL.callId)) return;
  const moments = detectMoments(EXAMPLE_CALL.turns);
  const summary = computeSummary(EXAMPLE_CALL.turns, moments, EXAMPLE_CALL.duration);
  saveCall(EXAMPLE_CALL.callId, {
    ...EXAMPLE_CALL,
    moments,
    summary,
    createdAt: new Date().toISOString(),
    totalMoments: moments.length,
    momentDensity: summary.momentDensity,
  });
  console.log(`[seed] Loaded example call ${EXAMPLE_CALL.callId} — ${moments.length} moments detected`);
}
