/**
 * The OBDTUNE one-pager's readings (2026-11-26, look A "Sheet"): one short reading per part of the scan tool. A press
 * on the plugin (or the page the plugin's screen is on) picks the reading. Copy is taken from Gil's 2026-11-25 page
 * (its STEPS + DATA) and the plugin's own labels; no new claims.
 */
export interface Reading {
  /** the index number the reading shares with its parent part */
  n: string;
  /** the part's name, as the plugin prints it */
  label: string;
  /** one short line, Bebas */
  h: string;
  /** two or three lines, Inter */
  p: string;
  /** the numbers, mono */
  spec: string;
}

export const READINGS: Record<string, Reading> = {
  home: {
    n: '00', label: 'OBDTUNE',
    h: 'Plug in. Read the note. Tune it.',
    p: 'Vocal pitch correction built like a shop scan tool. It reads every note you sing, finds the key by itself and puts each note where it belongs.',
    spec: 'PRESS ANY PART OF IT',
  },
  detect: {
    n: '01', label: 'DETECT',
    h: "Don't know the key? Ask it.",
    p: 'Plug in the connector and sing a few bars. OBDTUNE sets KEY and SCALE by itself, every note switched back on. Wrong answer? For 8 seconds the screen reads UNDO?',
    spec: 'KEY + SCALE · 8 S UNDO',
  },
  tune: {
    n: '02', label: 'TUNE',
    h: 'From hard snap to no trace.',
    p: 'At 1 ms the voice jumps note to note: the sound everybody knows. Near 200 ms it glides home and nobody hears a tuner. HUMANIZE lets held notes breathe; FLEX leaves small intonation alone.',
    spec: '1–200 MS · 13 SCALES',
  },
  voice: {
    n: '02', label: 'TUNE · VOICE',
    h: 'Tell it who is singing.',
    p: 'Soprano, alto or tenor: VOICE sets the range OBDTUNE listens in.',
    spec: 'SOPRANO · ALTO · TENOR',
  },
  notes: {
    n: '03', label: 'NOTES',
    h: 'Cut a note out.',
    p: 'Twelve switches, one per note. Turn one off and OBDTUNE never lands there: the voice goes to the nearest note you kept.',
    spec: '12 SWITCHES · GRID OR KEYBOARD',
  },
  fx: {
    n: '04', label: 'FX',
    h: 'Its own EQ, squeeze, echo and reverb.',
    p: 'Low and high cut with two bells, a FET-style parallel compressor, an echo synced to your tempo, and a room, plate or hall.',
    spec: 'EQ · SQUEEZE · ECHO · REVERB',
  },
  eq: {
    n: '04', label: 'FX · EQ',
    h: 'Shape it.',
    p: 'A low cut, a high cut and two bells, on the tuned voice.',
    spec: 'LOW CUT · 2 BELLS · HIGH CUT',
  },
  sqz: {
    n: '04', label: 'FX · SQUEEZE',
    h: 'Squeeze it.',
    p: 'A FET-style parallel compressor.',
    spec: 'FET-STYLE · PARALLEL',
  },
  echo: {
    n: '04', label: 'FX · ECHO',
    h: 'Echo on the beat.',
    p: 'An echo synced to your tempo.',
    spec: 'SYNCED TO THE HOST',
  },
  verb: {
    n: '04', label: 'FX · REVERB',
    h: 'Put it in a room.',
    p: 'A room, a plate or a hall.',
    spec: 'ROOM · PLATE · HALL',
  },
  harm: {
    n: '05', label: 'HARMONY',
    h: 'Stack the harmonies.',
    p: 'Two voices that follow your key and scale, an octave down to an octave up, each with its own level, pan and formant. MIX blends them against the lead.',
    spec: '2 VOICES · 12 INTERVALS',
  },
  pos: {
    n: '05', label: 'HARMONY · POSITION',
    h: 'Early or late.',
    p: 'POSITION pulls a harmony voice early or pushes it late, in ms or locked to your tempo.',
    spec: '−250 MS – +2 S',
  },
  live: {
    n: '06', label: 'LIVE DATA',
    h: 'Read every note.',
    p: 'The note you sing, how far off it is in cents, and the line OBDTUNE tunes it to, drawn as you sing.',
    spec: 'NOTE · CENTS · LIVE GRAPH',
  },
  custom: {
    n: '07', label: 'CUSTOM',
    h: 'Draw your own line.',
    p: 'Capture a take, then drag each note where you want it.',
    spec: 'CAPTURE · DRAG',
  },
  codes: {
    n: '08', label: 'CHECK ENGINE',
    h: 'Four lamps. No guessing.',
    p: 'T, H, F and C light for what sounds: tune, harmony, FX, custom. When something is off, a code names it and opens its page.',
    spec: 'T · H · F · C',
  },
  power: {
    n: '09', label: 'POWER',
    h: 'One switch, the whole plugin.',
    p: 'POWER bypasses tuning, harmony and FX at the same latency, so before and after line up. Only want the harmonies and FX? Switch AUTOTUNE off on the TUNE page.',
    spec: 'CONSTANT 48 MS LATENCY',
  },
  keys: {
    n: '10', label: 'BACK · OK',
    h: 'Drive it like the tool.',
    p: 'Tap a tile to open it. BACK goes up a level, the D-pad and OK walk the screen, and any value drags.',
    spec: 'BACK · OK ENTER · DRAG A VALUE',
  },
  service: {
    n: '11', label: 'SERVICE',
    h: 'Float it, or bench it.',
    p: 'The screw opens the SERVICE card. FLOATING hovers the tool over your session, ROOM sets it on the bench. Drag the corner to resize.',
    spec: 'FLOATING · ROOM',
  },
};

/** the index (Dan 2026-11-27, bench round 1: "make it much more appealing and intuitive to press"): the eight parts that
 * open a page or start a scan, in the order a hand meets the tool. POWER, BACK · OK and SERVICE keep their readings when
 * pressed on the tool itself. */
export const INDEX = ['detect', 'tune', 'notes', 'fx', 'harm', 'live', 'custom', 'codes'] as const;
/** the index keys' own short names (the reading's header row keeps the full one) */
export const KEY_LABEL: Record<string, string> = {
  detect: 'DETECT', tune: 'TUNE', notes: 'NOTES', fx: 'FX', harm: 'HARMONY', live: 'LIVE', custom: 'CUSTOM', codes: 'CODES',
};

/** the short readings (Dan 2026-11-27: "minimize all text, make them punchy and clear to understand"), three ways of
 * writing them for his pick (?read=a|b|c, dev only): A a headline + one line + the value box, B a headline + LCD rows,
 * C a headline + the value box. Facts only from READINGS above (Gil's copy + the plugin's labels). */
export type ReadStyle = 'a' | 'b' | 'c';
export interface Short { h: string; p?: string; rows?: [string, string][]; spec?: string }
export const SHORT: Record<ReadStyle, Partial<Record<string, Short>>> = {
  a: {
    home: { h: 'Press any part.', p: 'It reads every note you sing and finds the key by itself.', spec: 'TUNE · HARMONY · FX' },
    detect: { h: 'Don\'t know the key?', p: 'Plug in the connector, sing, and OBDTUNE sets KEY and SCALE.', spec: 'UNDO? FOR 8 SEC' },
    tune: { h: 'Hard snap to no trace.', p: 'At 1 ms it snaps; near 200 ms nobody hears a tuner.', spec: '1–200 MS · 13 SCALES' },
    voice: { h: 'Tell it who is singing.', p: 'VOICE sets the range OBDTUNE listens in.', spec: 'SOPRANO · ALTO · TENOR' },
    notes: { h: 'Cut a note out.', p: 'Turn a note off and OBDTUNE never lands there.', spec: '12 NOTE SWITCHES' },
    fx: { h: 'Finish the vocal here.', p: 'EQ, SQUEEZE, ECHO and REVERB, built into the tool.', spec: '4 EFFECTS' },
    eq: { h: 'Shape it.', p: 'Cut the lows and highs, and add two bells.', spec: '2 CUTS · 2 BELLS' },
    sqz: { h: 'Squeeze it.', p: 'A FET-style parallel compressor for the vocal.', spec: 'FET-STYLE · PARALLEL' },
    echo: { h: 'Echo on the beat.', p: 'An echo that syncs to your DAW\'s tempo.', spec: 'TEMPO SYNC' },
    verb: { h: 'Put it in a room.', p: 'Choose the space the vocal sits in.', spec: 'ROOM · PLATE · HALL' },
    harm: { h: 'Stack the harmonies.', p: 'Add two voices that follow your key and scale.', spec: '2 VOICES · ±1 OCTAVE' },
    pos: { h: 'Early or late.', p: 'Each harmony voice moves in ms, or locks to your tempo.', spec: '−250 MS TO +2 S' },
    live: { h: 'Read every note.', p: 'See each note you sing and how many cents off it is.', spec: 'NOTE · CENTS · GRAPH' },
    custom: { h: 'Draw your own line.', p: 'Capture a take, then drag each note where you want it.', spec: 'NOTE BY NOTE' },
    codes: { h: 'Four lamps. No guessing.', p: 'T, H, F, C light when TUNE, HARMONY, FX or CUSTOM sounds.', spec: 'CODES NAME WHAT\'S OFF' },
    power: { h: 'One switch, whole plugin.', p: 'Bypass it all; before and after stay lined up in time.', spec: 'SAME LATENCY ON OR OFF' },
    keys: { h: 'Drive it like a scanner.', p: 'Move with the D-pad, enter with OK, step back with BACK.', spec: 'DRAG ANY VALUE' },
    service: { h: 'Float it, or bench it.', p: 'FLOATING hovers it over your session; ROOM sets it on the bench.', spec: 'DRAG CORNER TO RESIZE' },
  },
  b: {
    home: { h: 'Press any part.', rows: [['TYPE', 'PITCH CORRECTION'], ['INPUT', 'VOCALS'], ['KEY', 'FOUND BY DETECT']] },
    detect: { h: 'Don\'t know the key?', rows: [['KEY', 'FOUND BY ITSELF'], ['SCALE', 'FOUND TOO'], ['UNDO?', 'FOR 8 SECONDS']] },
    tune: { h: 'Snap hard or glide.', rows: [['SPEED', '1–200 MS'], ['HUMANIZE', 'HELD NOTES BREATHE'], ['FLEX', 'SMALL ERRORS KEPT']] },
    voice: { h: 'Who is singing?', rows: [['OPTIONS', 'SOPRANO/ALTO/TENOR'], ['RANGE', 'WHERE IT LISTENS']] },
    notes: { h: 'Cut a note out.', rows: [['SWITCHES', '12, ONE PER NOTE'], ['NOTE OFF', 'SKIPPED'], ['TARGET', 'NEAREST NOTE KEPT']] },
    fx: { h: 'Finish the vocal.', rows: [['BUILT IN', 'EQ · SQUEEZE'], ['PLUS', 'ECHO · REVERB']] },
    eq: { h: 'Shape it.', rows: [['CUTS', 'LOW + HIGH'], ['BELLS', '2'], ['ON', 'THE TUNED VOICE']] },
    sqz: { h: 'Squeeze it.', rows: [['TYPE', 'FET-STYLE COMP'], ['ROUTING', 'PARALLEL']] },
    echo: { h: 'Echo in time.', rows: [['TEMPO', 'FROM YOUR DAW'], ['REPEATS', 'ON THE BEAT']] },
    verb: { h: 'Pick a space.', rows: [['SPACES', '3'], ['TYPES', 'ROOM, PLATE, HALL']] },
    harm: { h: 'Stack the harmonies.', rows: [['VOICES', '2'], ['KEY', 'FOLLOWS YOURS'], ['RANGE', '±1 OCTAVE']] },
    pos: { h: 'Early or late.', rows: [['RANGE', '−250 MS TO +2 S'], ['TIMING', 'FREE OR TEMPO SYNC'], ['VOICES', 'EACH ON ITS OWN']] },
    live: { h: 'Read every note.', rows: [['NOTE', 'WHAT YOU SING'], ['CENTS', 'HOW FAR OFF'], ['GRAPH', 'THE TUNED LINE']] },
    custom: { h: 'Draw your own line.', rows: [['STEP 1', 'CAPTURE A TAKE'], ['STEP 2', 'DRAG EACH NOTE']] },
    codes: { h: 'Four lamps. No guessing.', rows: [['T · H', 'TUNE · HARMONY'], ['F · C', 'FX · CUSTOM'], ['CODE', 'NAMES WHAT IS OFF']] },
    power: { h: 'One switch, whole plugin.', rows: [['BYPASS', 'TUNE, HARMONY, FX'], ['LATENCY', 'SAME, ON OR OFF'], ['A/B', 'LINES UP IN TIME']] },
    keys: { h: 'Drive the tool.', rows: [['BACK', 'UP A LEVEL'], ['D-PAD', 'MOVE AROUND'], ['OK', 'ENTER']] },
    service: { h: 'Float or bench it.', rows: [['FLOATING', 'OVER YOUR SESSION'], ['ROOM', 'ON THE BENCH'], ['RESIZE', 'DRAG THE CORNER']] },
  },
  c: {
    home: { h: 'Read the note. Tune it.', spec: 'PRESS ANY PART OF IT' },
    detect: { h: 'Sing. It finds the key.', spec: 'KEY + SCALE · 8 S UNDO' },
    tune: { h: 'Tune hard, or tune soft.', spec: '1–200 MS · 13 SCALES' },
    voice: { h: 'Tell it who is singing.', spec: 'SOPRANO · ALTO · TENOR' },
    notes: { h: 'Cut a note from the scale.', spec: '12 NOTE SWITCHES' },
    fx: { h: 'Finish the vocal here.', spec: 'EQ SQUEEZE ECHO REVERB' },
    eq: { h: 'Shape the tuned voice.', spec: 'LOW/HIGH CUT · 2 BELLS' },
    sqz: { h: 'Compress it in parallel.', spec: 'FET-STYLE' },
    echo: { h: 'Echo on the beat.', spec: 'SYNCED TO YOUR TEMPO' },
    verb: { h: 'Put it in a room.', spec: 'ROOM · PLATE · HALL' },
    harm: { h: 'Stack the harmonies.', spec: '2 VOICES · IN YOUR KEY' },
    pos: { h: 'Each voice, early or late.', spec: '−250 MS TO +2 S' },
    live: { h: 'See every note you sing.', spec: 'NOTE · CENTS · GRAPH' },
    custom: { h: 'Drag each note by hand.', spec: 'CAPTURE, THEN DRAG' },
    codes: { h: 'Something off? A code names it.', spec: 'T H F C LAMPS · CODES' },
    power: { h: 'One switch bypasses it all.', spec: 'SAME LATENCY ON OR OFF' },
    keys: { h: 'Move around the screen.', spec: 'D-PAD · OK · BACK' },
    service: { h: 'Float the tool, or bench it.', spec: 'FLOATING/ROOM · RESIZE' },
  },
};
/** the reading for a key in a style; falls back to the long reading while a set is incomplete */
export const shortFor = (style: string, k: string): Short => {
  const s = SHORT[(style as ReadStyle)]?.[k];
  if (s) return s;
  const r = READINGS[k];
  return { h: r.h, p: r.p, spec: r.spec };
};

/** the plugin's screen page -> its reading (OBD.ui.page, obdtune.js PAGE_LABEL) */
export const PAGE_TO_KEY: Record<string, string> = {
  home: 'home', tune: 'tune', voice: 'voice', notes: 'notes', harm: 'harm', 'harm-pos': 'pos', live: 'live',
  custom: 'custom', fx: 'fx', 'fx-eq': 'eq', 'fx-sqz': 'sqz', 'fx-echo': 'echo', 'fx-verb': 'verb', codes: 'codes',
  service: 'service', licence: 'service', setup: 'service',
};

/** a press on a part that doesn't change the page -> its reading (data-part in obdtune.js) */
export const PART_TO_KEY: Record<string, string> = {
  detect: 'detect', power: 'power', codes: 'codes', info: 'service', close: 'service', grip: 'service',
  back: 'keys', up: 'keys', down: 'keys', left: 'keys', right: 'keys',
};

/** an index press -> the screen page it opens (the rest only change the reading) */
export const KEY_TO_PAGE: Record<string, string> = {
  tune: 'tune', notes: 'notes', fx: 'fx', harm: 'harm', live: 'live', custom: 'custom', codes: 'codes', service: 'service',
};
