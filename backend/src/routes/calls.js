import { Router } from 'express';
import { saveCall, getCall, getAllCalls, callExists, deleteCall } from '../storage.js';
import { detectMoments } from '../detectMoments.js';
import { computeSummary } from '../summary.js';

const router = Router();

// Fill in missing or invalid `t` values via linear interpolation between known neighbours.
// Turns with a valid `t` are untouched; turns without one get a timestamp inferred from
// the closest preceding and following turns that do have one.
function inferTimestamps(turns) {
  const result = turns.map(t => ({ ...t }));

  const isValid = t => t != null && typeof t === 'number' && !isNaN(t) && isFinite(t) && t >= 0;

  for (let i = 0; i < result.length; i++) {
    if (isValid(result[i].t)) continue;

    // Nearest preceding known t
    let prevIdx = -1, prevT = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (isValid(result[j].t)) { prevIdx = j; prevT = result[j].t; break; }
    }

    // Nearest following known t
    let nextIdx = -1, nextT = prevT;
    for (let j = i + 1; j < result.length; j++) {
      if (isValid(result[j].t)) { nextIdx = j; nextT = result[j].t; break; }
    }

    if (nextIdx === -1) {
      // Nothing after — hold at prev
      result[i].t = prevT;
    } else if (prevIdx === -1) {
      // Nothing before — split the gap to the first known t
      result[i].t = Math.round(nextT / 2);
    } else {
      // Linearly interpolate between the two known anchors
      const span = nextIdx - prevIdx;
      result[i].t = Math.round(prevT + ((nextT - prevT) * (i - prevIdx)) / span);
    }
  }

  return result;
}

// POST /calls — ingest transcript, run detection + summary, store and return callId + momentCount
router.post('/calls', (req, res) => {
  const { callId, agentName, duration, turns } = req.body ?? {};

  if (!callId || typeof callId !== 'string' || !callId.trim()) {
    return res.status(400).json({ error: 'callId is required and must be a non-empty string' });
  }
  if (!agentName || typeof agentName !== 'string' || !agentName.trim()) {
    return res.status(400).json({ error: 'agentName is required and must be a non-empty string' });
  }
  if (duration == null || typeof duration !== 'number' || isNaN(duration) || !isFinite(duration) || duration < 0) {
    return res.status(400).json({ error: 'duration is required and must be a non-negative finite number (seconds)' });
  }
  if (!Array.isArray(turns)) {
    return res.status(400).json({ error: 'turns is required and must be an array' });
  }
  if (callExists(callId)) {
    return res.status(400).json({ error: `Call '${callId}' already exists` });
  }

  // Validate each turn
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (!turn || typeof turn !== 'object') {
      return res.status(400).json({ error: `turn at index ${i} must be a valid object` });
    }
    if (turn.speaker !== 'agent' && turn.speaker !== 'customer') {
      return res.status(400).json({ error: `turn at index ${i} must have speaker 'agent' or 'customer'` });
    }
    if (typeof turn.text !== 'string') {
      return res.status(400).json({ error: `turn at index ${i} must have a text string` });
    }
    // t is optional — missing values are inferred below via interpolation
    if (turn.t != null && (typeof turn.t !== 'number' || isNaN(turn.t) || !isFinite(turn.t) || turn.t < 0)) {
      return res.status(400).json({ error: `turn at index ${i}: 't' must be a non-negative number when provided` });
    }
  }

  const resolvedTurns = inferTimestamps(turns);

  const moments = detectMoments(resolvedTurns);
  const summary = computeSummary(resolvedTurns, moments, duration);

  const callData = {
    callId,
    agentName,
    duration,
    turns: resolvedTurns,
    moments,
    summary,
    createdAt: new Date().toISOString(),
    totalMoments: moments.length,
    momentDensity: summary.momentDensity
  };

  saveCall(callId, callData);

  return res.status(201).json({ callId, momentCount: moments.length });
});

// GET /calls — list all calls; optional ?agent= filter
router.get('/calls', (req, res) => {
  const { agent } = req.query;
  let calls = getAllCalls();

  if (agent) {
    const filter = agent.toLowerCase();
    calls = calls.filter(c => c.agentName.toLowerCase().includes(filter));
  }

  const result = calls.map(c => ({
    callId: c.callId,
    agentName: c.agentName,
    duration: c.duration,
    momentCount: c.totalMoments,
    empathyScore: c.summary.empathyScore,
    sentimentArc: c.summary.sentimentArc,
    escalationCount: c.summary.escalationCount,
    createdAt: c.createdAt
  }));

  return res.json(result);
});

// GET /calls/:id — full annotated turns + summary
router.get('/calls/:id', (req, res) => {
  const call = getCall(req.params.id);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }

  const momentsByTurn = {};
  for (const moment of call.moments) {
    if (!momentsByTurn[moment.turnIndex]) momentsByTurn[moment.turnIndex] = [];
    momentsByTurn[moment.turnIndex].push(moment);
  }

  const annotatedTurns = call.turns.map((turn, i) => ({
    ...turn,
    turnIndex: i,
    moments: momentsByTurn[i] ?? []
  }));

  return res.json({
    callId: call.callId,
    agentName: call.agentName,
    duration: call.duration,
    annotatedTurns,
    summary: call.summary,
    totalMoments: call.totalMoments,
    momentDensity: call.momentDensity
  });
});

// DELETE /calls/:id — remove a call from the store
router.delete('/calls/:id', (req, res) => {
  const call = getCall(req.params.id);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  deleteCall(req.params.id);
  return res.json({ deleted: req.params.id });
});

// GET /calls/:id/moments — moments list only (priority-sorted)
router.get('/calls/:id/moments', (req, res) => {
  const call = getCall(req.params.id);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  return res.json(call.moments);
});

export default router;
