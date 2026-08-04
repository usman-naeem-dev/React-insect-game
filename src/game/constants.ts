/** Tuning knobs for the difficulty curve. Times are in seconds, speeds in px/s. */

export const STARTING_LIVES = 3;

/** Seconds between auto-spawns at the start of a run... */
export const SPAWN_INTERVAL_START = 1.8;
/** ...and the floor it decays toward. */
export const SPAWN_INTERVAL_MIN = 0.55;
/** Seconds of play it takes to reach roughly the minimum interval. */
export const SPAWN_RAMP_SECONDS = 90;

/** How long an insect survives before it escapes and costs a life. */
export const LIFETIME_START = 7;
export const LIFETIME_MIN = 3;

/** Crawl speed multiplier grows from 1x to this over the ramp. */
export const SPEED_SCALE_MAX = 2.1;

/** An insect starts blinking this many seconds before it escapes. */
export const WARN_BEFORE_ESCAPE = 1.5;

/** Rendered insect size in px; used for playfield clamping and hit tests. */
export const INSECT_SIZE = 72;

/** Every N catches adds +1 to the score multiplier, capped at MAX_MULTIPLIER. */
export const COMBO_STEP = 5;
export const MAX_MULTIPLIER = 5;

export const HIGH_SCORE_KEY = 'owl-insect-game:high-score';

/** Multiplier earned by a combo of `combo` consecutive catches. */
export const multiplierFor = (combo: number) =>
  Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / COMBO_STEP));

/** 0 at the start of a run, approaching 1 as the run gets long. */
export const rampProgress = (elapsed: number) =>
  Math.min(1, elapsed / SPAWN_RAMP_SECONDS);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const spawnIntervalAt = (elapsed: number) =>
  lerp(SPAWN_INTERVAL_START, SPAWN_INTERVAL_MIN, rampProgress(elapsed));

export const lifetimeAt = (elapsed: number) =>
  lerp(LIFETIME_START, LIFETIME_MIN, rampProgress(elapsed));

export const speedScaleAt = (elapsed: number) =>
  lerp(1, SPEED_SCALE_MAX, rampProgress(elapsed));
