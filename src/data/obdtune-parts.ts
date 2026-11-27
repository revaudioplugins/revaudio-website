/**
 * The OBDTUNE one-pager's readings: one short reading per part of the scan tool. A press on the plugin (or the page the
 * plugin's screen is on) picks the reading. Round 2 (Dan 2026-11-27, "minimize all text, make them punchy and clear to
 * understand"; he picked style A of three): a headline, one line, the value box. Facts only from Gil's 2026-11-25 page
 * (its STEPS + DATA, the longer copy in git at 9965fa0) and the plugin's own labels; no new claims.
 */
export interface Reading {
  /** the index number the reading shares with its parent part */
  n: string;
  /** the part's name, as the plugin prints it (the screen's header row) */
  label: string;
  /** the headline, at most five words */
  h: string;
  /** one line */
  p: string;
  /** the numbers, in the value box */
  spec: string;
}

export const READINGS: Record<string, Reading> = {
  home: {
    n: '00', label: 'OBDTUNE',
    h: 'Press any part.', p: 'It reads every note you sing and finds the key by itself.', spec: 'TUNE · HARMONY · FX',
  },
  detect: {
    n: '01', label: 'DETECT',
    h: 'Don\'t know the key?', p: 'Plug in the connector, sing, and OBDTUNE sets KEY and SCALE.', spec: 'UNDO? FOR 8 SEC',
  },
  tune: {
    n: '02', label: 'TUNE',
    h: 'Hard snap to no trace.', p: 'At 1 ms it snaps; near 200 ms nobody hears a tuner.', spec: '1–200 MS · 13 SCALES',
  },
  voice: {
    n: '02', label: 'TUNE · VOICE',
    h: 'Tell it who is singing.', p: 'VOICE sets the range OBDTUNE listens in.', spec: 'SOPRANO · ALTO · TENOR',
  },
  notes: {
    n: '03', label: 'NOTES',
    h: 'Cut a note out.', p: 'Turn a note off and OBDTUNE never lands there.', spec: '12 NOTE SWITCHES',
  },
  fx: {
    n: '04', label: 'FX',
    h: 'Finish the vocal here.', p: 'EQ, SQUEEZE, ECHO and REVERB, built into the tool.', spec: '4 EFFECTS',
  },
  eq: {
    n: '04', label: 'FX · EQ',
    h: 'Shape it.', p: 'Cut the lows and highs, and add two bells.', spec: '2 CUTS · 2 BELLS',
  },
  sqz: {
    n: '04', label: 'FX · SQUEEZE',
    h: 'Squeeze it.', p: 'A FET-style parallel compressor for the vocal.', spec: 'FET-STYLE · PARALLEL',
  },
  echo: {
    n: '04', label: 'FX · ECHO',
    h: 'Echo on the beat.', p: 'An echo that syncs to your DAW\'s tempo.', spec: 'TEMPO SYNC',
  },
  verb: {
    n: '04', label: 'FX · REVERB',
    h: 'Put it in a room.', p: 'Choose the space the vocal sits in.', spec: 'ROOM · PLATE · HALL',
  },
  harm: {
    n: '05', label: 'HARMONY',
    h: 'Stack the harmonies.', p: 'Add two voices that follow your key and scale.', spec: '2 VOICES · ±1 OCTAVE',
  },
  pos: {
    n: '05', label: 'HARMONY · POSITION',
    h: 'Early or late.', p: 'Each harmony voice moves in ms, or locks to your tempo.', spec: '−250 MS TO +2 S',
  },
  live: {
    n: '06', label: 'LIVE DATA',
    h: 'Read every note.', p: 'See each note you sing and how many cents off it is.', spec: 'NOTE · CENTS · GRAPH',
  },
  custom: {
    n: '07', label: 'CUSTOM',
    h: 'Draw your own line.', p: 'Capture a take, then drag each note where you want it.', spec: 'NOTE BY NOTE',
  },
  codes: {
    n: '08', label: 'CHECK ENGINE',
    h: 'Four lamps. No guessing.', p: 'T, H, F, C light when TUNE, HARMONY, FX or CUSTOM sounds.', spec: 'CODES NAME WHAT\'S OFF',
  },
  power: {
    n: '09', label: 'POWER',
    h: 'One switch, whole plugin.', p: 'Bypass it all; before and after stay lined up in time.', spec: 'SAME LATENCY ON OR OFF',
  },
  keys: {
    n: '10', label: 'BACK · OK',
    h: 'Drive it like a scanner.', p: 'Move with the D-pad, enter with OK, step back with BACK.', spec: 'DRAG ANY VALUE',
  },
  service: {
    n: '11', label: 'SERVICE',
    h: 'Float it, or bench it.', p: 'FLOATING hovers it over your session; ROOM sets it on the bench.', spec: 'DRAG CORNER TO RESIZE',
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
