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

/** the index, in the order a hand meets the tool */
export const INDEX = ['detect', 'tune', 'notes', 'fx', 'harm', 'live', 'custom', 'codes', 'power', 'keys', 'service'] as const;

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
