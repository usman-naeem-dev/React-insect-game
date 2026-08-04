import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { randomSpecies, speciesByName, type InsectSpecies } from '../data/insectsData';
import {
  INSECT_SIZE,
  WARN_BEFORE_ESCAPE,
  lifetimeAt,
  multiplierFor,
  spawnIntervalAt,
  speedScaleAt,
} from './constants';
import { initialState, readHighScore, reducer, writeHighScore } from './reducer';
import type { GameState, Insect, InsectType } from './types';

/** Live position/velocity for one insect. Kept out of React state — it changes every frame. */
interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds of life left before the insect escapes. */
  ttl: number;
  fleeing: boolean;
  /** Set by the tap/keyboard path: the insect flies here, then is eaten. */
  flyTo?: { x: number; y: number };
}

/** How fast a tapped insect sails into the owl's mouth. */
const FLY_SPEED = 1400;

export interface ScorePopup {
  id: number;
  text: string;
  x: number;
  y: number;
}

/** A frame longer than this means the tab was backgrounded — don't fast-forward the game. */
const MAX_FRAME_SECONDS = 0.05;

/** Insects wander rather than travelling in straight lines. */
const WANDER_RADIANS_PER_SECOND = 1.4;

let nextId = 1;
const makeId = () => nextId++;

export function useGameEngine() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(readHighScore()));
  const [popups, setPopups] = useState<ScorePopup[]>([]);

  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const mouthRef = useRef<HTMLElement | null>(null);

  const bodies = useRef(new Map<number, Body>());
  const elements = useRef(new Map<number, HTMLElement>());

  /** The loop reads these instead of closing over render-time values. */
  const statusRef = useRef(state.status);
  const rosterRef = useRef(state.insects);
  const comboRef = useRef(state.combo);
  const draggingRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const spawnClockRef = useRef(0);
  const boundsRef = useRef({ width: 0, height: 0 });

  statusRef.current = state.status;
  rosterRef.current = state.insects;
  comboRef.current = state.combo;

  // --- geometry -------------------------------------------------------------

  const measure = useCallback(() => {
    const el = playfieldRef.current;
    if (!el) return;
    boundsRef.current = { width: el.clientWidth, height: el.clientHeight };
  }, []);

  useEffect(() => {
    measure();
    const el = playfieldRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const maxX = () => Math.max(0, boundsRef.current.width - INSECT_SIZE);
  const maxY = () => Math.max(0, boundsRef.current.height - INSECT_SIZE);

  const draw = useCallback((id: number, body: Body) => {
    const el = elements.current.get(id);
    if (!el) return;
    el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
  }, []);

  // --- spawning -------------------------------------------------------------

  /** Insects crawl in from the edges so they never appear on top of the owl. */
  const spawnBody = useCallback((species: InsectSpecies): Body => {
    const mx = maxX();
    const my = maxY();
    const edge = Math.floor(Math.random() * 4);
    const along = Math.random();

    let x: number;
    let y: number;
    let heading: number;
    if (edge === 0) {
      x = along * mx;
      y = 0;
      heading = Math.PI / 2;
    } else if (edge === 1) {
      x = mx;
      y = along * my;
      heading = Math.PI;
    } else if (edge === 2) {
      x = along * mx;
      y = my;
      heading = -Math.PI / 2;
    } else {
      x = 0;
      y = along * my;
      heading = 0;
    }

    // Aim inward, with up to +/-60 degrees of spread.
    heading += (Math.random() - 0.5) * (Math.PI / 1.5);
    const speed = species.speed * speedScaleAt(elapsedRef.current);

    return {
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      ttl: lifetimeAt(elapsedRef.current),
      fleeing: false,
    };
  }, []);

  const spawn = useCallback(
    (species: InsectSpecies) => {
      const insect: Insect = {
        id: makeId(),
        type: species.name,
        imgSrc: species.imgSrc,
        points: species.points,
      };
      bodies.current.set(insect.id, spawnBody(species));
      dispatch({ type: 'SPAWN', insect });
    },
    [spawnBody],
  );

  /** Used by the insect buttons — the player can add extra targets for extra risk. */
  const addInsect = useCallback(
    (name: InsectType | string) => {
      if (statusRef.current !== 'playing') return;
      const species = speciesByName(name);
      if (species) spawn(species);
    },
    [spawn],
  );

  // --- scoring feedback -----------------------------------------------------

  const showPopup = useCallback((text: string, x: number, y: number) => {
    const popup: ScorePopup = { id: makeId(), text, x, y };
    setPopups((current) => [...current, popup]);
    window.setTimeout(() => {
      setPopups((current) => current.filter((p) => p.id !== popup.id));
    }, 900);
  }, []);

  const eat = useCallback(
    (id: number) => {
      const insect = rosterRef.current.find((i) => i.id === id);
      const body = bodies.current.get(id);
      if (!insect || statusRef.current !== 'playing') return;

      if (body) {
        showPopup(`+${insect.points * multiplierFor(comboRef.current)}`, body.x, body.y);
      }
      bodies.current.delete(id);
      elements.current.delete(id);
      // Close the beak — the chomp animation takes over from here.
      mouthRef.current?.classList.remove('mouth-zone--hot');
      dispatch({ type: 'EAT', id });
    },
    [showPopup],
  );

  /** The rAF loop calls this without taking `eat` as a dependency. */
  const eatRef = useRef(eat);
  eatRef.current = eat;

  /**
   * The pointer-free path: tapping an insect or activating it from the keyboard
   * sends it flying into the mouth. Same target practice, no dragging required.
   */
  const feed = useCallback((id: number) => {
    const body = bodies.current.get(id);
    const mouth = mouthRef.current?.getBoundingClientRect();
    const field = playfieldRef.current?.getBoundingClientRect();
    if (!body || body.flyTo || statusRef.current !== 'playing') return;

    if (!mouth || !field) {
      eatRef.current(id);
      return;
    }
    // Open the beak ahead of the insect arriving.
    mouthRef.current?.classList.add('mouth-zone--hot');
    body.flyTo = {
      x: mouth.left + mouth.width / 2 - field.left - INSECT_SIZE / 2,
      y: mouth.top + mouth.height / 2 - field.top - INSECT_SIZE / 2,
    };
  }, []);

  // --- the loop -------------------------------------------------------------

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(MAX_FRAME_SECONDS, (now - last) / 1000);
      last = now;

      if (statusRef.current !== 'playing') return;

      elapsedRef.current += dt;
      const mx = maxX();
      const my = maxY();

      // Drop bodies whose insect has left the roster (eaten, escaped, or reset).
      if (bodies.current.size > rosterRef.current.length) {
        const live = new Set(rosterRef.current.map((i) => i.id));
        for (const id of bodies.current.keys()) {
          if (!live.has(id)) {
            bodies.current.delete(id);
            elements.current.delete(id);
          }
        }
      }

      for (const insect of rosterRef.current) {
        const body = bodies.current.get(insect.id);
        if (!body) continue;

        if (draggingRef.current === insect.id) {
          // Held insects neither move on their own nor run out of time.
          continue;
        }

        // Tapped insects sail into the mouth and are eaten on arrival.
        if (body.flyTo) {
          const dx = body.flyTo.x - body.x;
          const dy = body.flyTo.y - body.y;
          const distance = Math.hypot(dx, dy);
          const step = FLY_SPEED * dt;
          if (distance <= step) {
            eatRef.current(insect.id);
          } else {
            body.x += (dx / distance) * step;
            body.y += (dy / distance) * step;
            draw(insect.id, body);
          }
          continue;
        }

        body.ttl -= dt;
        if (body.ttl <= 0) {
          dispatch({ type: 'ESCAPE', id: insect.id });
          bodies.current.delete(insect.id);
          elements.current.delete(insect.id);
          continue;
        }

        const fleeing = body.ttl < WARN_BEFORE_ESCAPE;
        if (fleeing !== body.fleeing) {
          body.fleeing = fleeing;
          elements.current.get(insect.id)?.classList.toggle('insect--fleeing', fleeing);
        }

        // Wander: rotate the velocity a little each frame.
        const turn = (Math.random() - 0.5) * WANDER_RADIANS_PER_SECOND * dt * 2;
        const cos = Math.cos(turn);
        const sin = Math.sin(turn);
        const vx = body.vx * cos - body.vy * sin;
        const vy = body.vx * sin + body.vy * cos;
        body.vx = vx;
        body.vy = vy;

        body.x += body.vx * dt;
        body.y += body.vy * dt;

        // Bounce off the playfield edges.
        if (body.x < 0) {
          body.x = 0;
          body.vx = Math.abs(body.vx);
        } else if (body.x > mx) {
          body.x = mx;
          body.vx = -Math.abs(body.vx);
        }
        if (body.y < 0) {
          body.y = 0;
          body.vy = Math.abs(body.vy);
        } else if (body.y > my) {
          body.y = my;
          body.vy = -Math.abs(body.vy);
        }

        draw(insect.id, body);
      }

      // Auto-spawn, accelerating as the run goes on.
      spawnClockRef.current += dt;
      if (spawnClockRef.current >= spawnIntervalAt(elapsedRef.current)) {
        spawnClockRef.current = 0;
        spawn(randomSpecies());
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [draw, spawn]);

  // --- dragging (pointer events: one path for mouse, touch and pen) ---------

  const grabOffset = useRef({ x: 0, y: 0 });

  const registerInsect = useCallback(
    (id: number, el: HTMLElement | null) => {
      if (!el) {
        elements.current.delete(id);
        return;
      }
      elements.current.set(id, el);
      const body = bodies.current.get(id);
      if (body) draw(id, body);
    },
    [draw],
  );

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = playfieldRef.current?.getBoundingClientRect();
    return rect
      ? { x: clientX - rect.left, y: clientY - rect.top }
      : { x: clientX, y: clientY };
  }, []);

  const grab = useCallback(
    (id: number, clientX: number, clientY: number) => {
      const body = bodies.current.get(id);
      if (!body || statusRef.current !== 'playing') return;
      measure();
      const local = toLocal(clientX, clientY);
      grabOffset.current = { x: local.x - body.x, y: local.y - body.y };
      draggingRef.current = id;
    },
    [measure, toLocal],
  );

  const dragTo = useCallback(
    (id: number, clientX: number, clientY: number) => {
      if (draggingRef.current !== id) return;
      const body = bodies.current.get(id);
      if (!body) return;
      const local = toLocal(clientX, clientY);
      body.x = Math.max(0, Math.min(maxX(), local.x - grabOffset.current.x));
      body.y = Math.max(0, Math.min(maxY(), local.y - grabOffset.current.y));
      draw(id, body);
    },
    [draw, toLocal],
  );

  /** True when the pointer is over the owl's mouth. */
  const isOverMouth = useCallback((clientX: number, clientY: number) => {
    const rect = mouthRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }, []);

  const release = useCallback(
    (id: number, clientX: number, clientY: number) => {
      if (draggingRef.current !== id) return false;
      draggingRef.current = null;
      const fed = isOverMouth(clientX, clientY);
      if (fed) eat(id);
      return fed;
    },
    [eat, isOverMouth],
  );

  // --- lifecycle ------------------------------------------------------------

  const start = useCallback(() => {
    bodies.current.clear();
    elements.current.clear();
    draggingRef.current = null;
    elapsedRef.current = 0;
    spawnClockRef.current = 0;
    mouthRef.current?.classList.remove('mouth-zone--hot');
    setPopups([]);
    measure();
    dispatch({ type: 'START' });
  }, [measure]);

  useEffect(() => {
    if (state.status === 'over') writeHighScore(state.highScore);
  }, [state.status, state.highScore]);

  /**
   * Split deliberately: `actions` is referentially stable for the life of the
   * game, so memoized insects never re-render when the score changes.
   */
  const actions = useMemo(
    () => ({
      playfieldRef,
      mouthRef,
      registerInsect,
      addInsect,
      grab,
      dragTo,
      release,
      isOverMouth,
      eat,
      feed,
      start,
    }),
    [registerInsect, addInsect, grab, dragTo, release, isOverMouth, eat, feed, start],
  );

  const view = useMemo<GameView>(() => ({ ...state, popups }), [state, popups]);

  return { view, actions };
}

export interface GameView extends GameState {
  popups: ScorePopup[];
}

export type GameActions = ReturnType<typeof useGameEngine>['actions'];
