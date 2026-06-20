# Plan: Call Quality Review Tool — Observe.Al Challenge + Wavvy Enhancements

## Context
Building an internal supervisor tool from scratch in a blank directory. The tool ingests call transcripts, automatically detects escalation signals, empathy statements, dead air, and long monologues, then presents a clean dark-theme UI for reviewing flagged moments. Core assignment requirements are implemented exactly as specified; Wavvy-inspired enhancements are additive on top of the same architecture.

---

## Architecture

**Monorepo with two packages:**
```
/backend   — Node.js + Express API
/frontend  — React + Vite SPA
```

No TypeScript, no ORM, no external state libs, no LLMs. Fetch API on frontend. CORS on backend.

---

## Color Palette
- Background: `#0a0a0a` | Surface: `#111111` / `#1c1c1c`
- Primary text: `#ffffff` | Accent: `#ffd700` (yellow)
- Moment colors: escalation `#ff4d4d` · empathy `#44d48a` · dead_air `#ff8c42` · long_monologue `#4d9eff`

---

## Backend Files

### `backend/package.json`
```json
{ "type": "module", "main": "src/index.js", dependencies: express, cors, uuid }
```

### `backend/src/constants.js`
```js
export const MOMENT_TYPES = {
  ESCALATION: 'escalation',
  EMPATHY: 'empathy',
  DEAD_AIR: 'dead_air',
  LONG_MONOLOGUE: 'long_monologue'
};

export const MOMENT_PRIORITY = {
  escalation: 4,
  dead_air: 3,
  long_monologue: 2,
  empathy: 1
};
```

### `backend/src/storage.js` ← **swappable module**
```js
const calls = new Map();
export function saveCall(id, data) { calls.set(id, data); }
export function getCall(id) { return calls.get(id) ?? null; }
export function getAllCalls() { return [...calls.values()]; }
```

**Stored shape per call:**
```js
{
  callId, agentName, duration,
  turns,            // raw input
  moments,          // computed, sorted by priority desc then t asc
  summary,          // computed (includes coachingNote + momentDensity)
  createdAt,        // ISO timestamp
  totalMoments,     // moments.length — denormalised for list view
  momentDensity     // totalMoments / (duration / 60)
}
```
Switching to a DB = edit only this file.

### `backend/src/detectMoments.js`
`detectMoments(turns)` → `[{ id, type, turnIndex, t, speaker, matchedText, priority }]`

`id` via `uuidv4()`. `priority` from `MOMENT_PRIORITY[type]`.

**Rules** (one turn → multiple moments):

| Type | Who | Detection |
|---|---|---|
| `escalation` | customer | `/\b(cancel\|refund\|manager\|lawsuit\|ridiculous\|unacceptable)\b/i` |
| `empathy` | agent | any of `/i.*understand/i`, `/i.?m sorry/i`, `/i apologise/i`, `/i can see why/i` — regex catches "I completely understand" |
| `dead_air` | either | `turns[i].t - turns[i-1].t > 15` → flag resuming turn; matchedText = `"${gap}s silence"` |
| `long_monologue` | either | word count > 50; matchedText = first 60 chars + "…" |

**Sort output:** priority desc, then `t` asc — sidebar shows highest-priority moments first.

### `backend/src/coaching.js`
`generateCoachingNote(turns, moments)` → `string`

Pure deterministic rules, no AI:
```
escalationCount > 0 && empathyCount === 0
  → "Customer escalated with no empathy response detected. Consider acknowledging concerns earlier."

escalationCount > 0 && firstEmpathyIndex > firstEscalationIndex
  → "Customer escalated before empathy was shown. Consider acknowledging concerns earlier."

deadAirCount >= 2
  → "Multiple dead air periods detected. Review account lookup and hold workflows."

deadAirCount === 1
  → "Dead air detected. Avoid extended silences during account lookup."

longMonologueCount > 0 && speaker === 'customer'
  → "Customer delivered a long monologue. Consider proactive clarification earlier."

longMonologueCount > 0 && speaker === 'agent'
  → "Agent delivered a long monologue. Keep responses concise."

empathyCount > 0 && escalationCount === 0
  → "Strong empathy demonstrated throughout the call."

default
  → "Call completed without notable coaching concerns."
```
Rules checked in priority order; first match wins.

### `backend/src/summary.js`
`computeSummary(turns, moments, duration)` → `{ talkRatio, escalationCount, empathyScore, sentimentArc, totalMoments, momentDensity, coachingNote }`

- **talkRatio**: `{ agent: N, customer: N }` integer percentage of total turn count
- **escalationCount**: filter by type
- **totalMoments**: `moments.length`
- **momentDensity**: `+(totalMoments / (duration / 60)).toFixed(2)`
- **empathyScore**: escalations === 0 → `1.0`; else `Math.min(1.0, empathy / (empathy + escalation))` rounded to 2 dp
- **sentimentArc**: mid = `Math.floor(turns.length / 2)`; firstHalf escalations < mid, secondHalf ≥ mid → "improved" / "declined" / "neutral"
- **coachingNote**: `generateCoachingNote(turns, moments)`

### `backend/src/routes/calls.js`
All four required routes:

| Method | Route | Behaviour |
|---|---|---|
| POST | `/calls` | Validate (`callId`, `agentName`, `duration`, `turns[]`). 400 if invalid or duplicate. Run detectMoments → computeSummary. saveCall full shape. Return `{ callId, momentCount }` |
| GET | `/calls` | getAllCalls(), optional `?agent=` case-insensitive filter. Return `[{ callId, agentName, duration, momentCount: totalMoments, empathyScore, sentimentArc }]` |
| GET | `/calls/:id` | 404 if not found. Return `{ callId, agentName, duration, annotatedTurns, summary }`. annotatedTurns = each turn with `moments: []` attached |
| GET | `/calls/:id/moments` | Return moments array (priority-sorted) |

### `backend/src/index.js`
Express, json middleware, CORS `*`, mount routes, `PORT=3001`.

---

## Frontend Files

### `frontend/vite.config.js`
Proxy `/calls` → `http://localhost:3001`.

### `frontend/src/constants.js`
```js
export const MOMENT_COLORS = {
  escalation: '#ff4d4d',
  empathy: '#44d48a',
  dead_air: '#ff8c42',
  long_monologue: '#4d9eff'
};

export const MOMENT_LABELS = {
  escalation: 'ESCALATION',
  empathy: 'EMPATHY',
  dead_air: 'DEAD AIR',
  long_monologue: 'LONG MONOLOGUE'
};

export const MOMENT_PRIORITY = { escalation: 4, dead_air: 3, long_monologue: 2, empathy: 1 };
```

### `frontend/src/api.js`
`fetchCalls(agent?)`, `fetchCall(id)`, `fetchMoments(id)`, `ingestCall(body)`.

### `frontend/src/App.jsx`
`react-router-dom` v6:
- `/` → `<CallList />`
- `/calls/:id` → `<CallDetail />`

### `frontend/src/components/CallList.jsx`
- Yellow-bordered agent-name filter input
- Grid of call cards: agentName · duration (mm:ss) · total moments · sentiment arc badge · empathy score
- "No calls ingested yet" empty state

### `frontend/src/components/CallDetail.jsx`
Fetches `/calls/:id` and `/calls/:id/moments` in parallel.

Layout:
```
[ CallHeader ]                                      ← compact summary bar
[ MomentTimeline ]                                  ← visual timeline strip
[ TranscriptView (flex-grow) ] | [ SummaryPanel  ]  ← right panel ~320px
                               | [ MomentsSidebar ] ← priority-ordered
```

### `frontend/src/components/CallHeader.jsx`  ← **Wavvy: supervisor-first hierarchy**
Compact header strip above everything:
```
Priya
4m 00s • 6 Moments • Improved
2 Escalations
```
Fields: agentName, formatted duration, totalMoments, sentimentArc badge, escalationCount in red badge.
Supervisor understands the call within seconds before reading a word.

### `frontend/src/components/MomentTimeline.jsx`  ← **Wavvy: timeline navigation**
Full-width horizontal bar representing call duration. Each moment = colored dot marker at `(moment.t / duration) * 100%` position.
- Color matches MOMENT_COLORS
- Clicking a marker scrolls TranscriptView to that turn via `document.getElementById('turn-{turnIndex}').scrollIntoView()`
- Tooltip on hover: type label + timestamp
- Dead air markers at resuming turn's t value

### `frontend/src/components/TranscriptView.jsx`
Each turn row (id=`turn-{index}` for timeline scroll targeting):
```
[AGENT]  00:48   Absolutely, let me pull up your account...   [DEAD AIR] [EMPATHY]
```
- Speaker chip: AGENT = yellow fill, CUSTOMER = white outline
- Timestamp: mm:ss
- Turns with moments: colored left-border (highest priority moment color) + subtle bg tint `rgba(color, 0.08)`
- Moment type badges inline at row end
- Clean row for turns with no moments

### `frontend/src/components/SummaryPanel.jsx`  ← **extended required panel**
Card with:
- Talk ratio: two-segment horizontal bar (yellow = agent, white/dim = customer) + % labels
- Escalation count: red badge
- Empathy score: colored (green ≥ 0.7, yellow ≥ 0.4, red < 0.4)
- Sentiment arc: pill badge
- Total moments + moment density: "6 moments detected · 1.5 per minute"
- Coaching note: italic yellow text in a distinct sub-card

### `frontend/src/components/MomentsSidebar.jsx`  ← **priority-ordered**
Scrollable list from `GET /calls/:id/moments` (already priority-sorted by backend).
Each item: colored type badge · mm:ss · speaker label · matchedText snippet.
"No moments detected" empty state.

### `frontend/src/index.css`
```css
body { background: #0a0a0a; color: #fff; font-family: system-ui; margin: 0 }
```
Yellow focus rings, surface cards `#1c1c1c`, scrollbar `#2a2a2a`.

---

## README.md (root)

**Architecture Decisions section:**
- Why repository pattern → single file to swap for PostgreSQL
- Why in-memory → zero infrastructure, self-contained demo
- Why detectMoments is pure → trivially testable, no I/O
- Why deterministic coaching → explainable, no hallucinations, no API cost

**Product Thinking / Future Enhancements section:**
- Real-time transcript ingestion from telephony platforms
- Live supervisor escalation alerts
- Escalation prediction with ML scoring
- Silence trend analysis across agents
- Agent coaching recommendations over time
- Multi-call analytics and agent scorecards
- Team-level quality dashboards

---

## Implementation Order

1. `backend/` — constants.js → storage.js → detectMoments.js → coaching.js → summary.js → routes/calls.js → index.js
2. `frontend/` — package.json + vite.config.js + index.html + main.jsx + App.jsx + api.js + constants.js + index.css
3. Frontend components (order): CallList → CallHeader → MomentTimeline → TranscriptView → SummaryPanel → MomentsSidebar → CallDetail (wires them together)
4. README.md

---

## Validation Plan

1. POST example transcript (frustrated customer, t=0/7/18/25/48) to `POST /calls`
   - Expect `{ callId: "c001", momentCount: N }`
2. `GET /calls` — call appears; `?agent=Priya` filter works
3. `GET /calls/c001`:
   - dead_air on turn at t=48 (23 s gap from t=25)
   - escalation on "cancel" / "manager" customer turns
   - empathy on "I completely understand" (regex, not .includes)
   - annotatedTurns have moments arrays attached
4. `GET /calls/c001/moments` — priority-sorted: escalations first
5. UI at `localhost:5173`:
   - CallHeader shows agent, duration, moments, arc, escalation count
   - MomentTimeline shows colored dots at correct positions; clicking scrolls
   - Transcript: highlighted rows with left borders and badges
   - SummaryPanel: all fields including coaching note and moment density
   - MomentsSidebar: priority order matches escalation > dead_air > empathy

---

## Error Handling

- POST: 400 for missing fields, non-array turns, duplicate callId; JSON error body
- GET /:id: 404 `{ error: "Call not found" }`
- Frontend: loading state → error banner → empty state, in priority order
- Invalid `?agent=` param: return empty array (not 400)
