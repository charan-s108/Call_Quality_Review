// Hex values for inline styles (timeline dots, etc.)
export const MOMENT_COLORS = {
  escalation:     '#fc535b',
  empathy:        '#1D9E75',
  dead_air:       '#fabc2d',
  long_monologue: '#1378d1',
};

export const MOMENT_LABELS = {
  escalation:     'ESCALATION',
  empathy:        'EMPATHY',
  dead_air:       'DEAD AIR',
  long_monologue: 'LONG MONOLOGUE',
};

// Static Tailwind class maps — must use full class strings so JIT includes them
export const MOMENT_TURN_CLASSES = {
  escalation:     'border-l-w-red     bg-w-red/[0.04]',
  empathy:        'border-l-w-green   bg-w-green/[0.04]',
  dead_air:       'border-l-w-orange  bg-w-orange/[0.04]',
  long_monologue: 'border-l-w-blue    bg-w-blue/[0.04]',
};

export const MOMENT_ITEM_CLASSES = {
  escalation:     'border-l-w-red',
  empathy:        'border-l-w-green',
  dead_air:       'border-l-w-orange',
  long_monologue: 'border-l-w-blue',
};

// Badge variant names match the Badge component variants
export const MOMENT_BADGE_VARIANT = {
  escalation:     'escalation',
  empathy:        'empathy',
  dead_air:       'dead_air',
  long_monologue: 'long_monologue',
};
