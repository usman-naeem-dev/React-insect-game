# Feed the Owl

A small arcade game built with React, TypeScript, Vite and MUI.

Insects crawl in from the edges of the playfield. Drag one into the owl's mouth —
or just tap it — before it escapes. Three escapes ends the run. Catches in a row
build a score multiplier, and your best score is kept in `localStorage`.

## Getting started

Requires Node.js 18 or newer.

```bash
git clone https://github.com/USMAN-PRO-TECH/React-insect-game.git
cd React-insect-game
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| command | does |
| --- | --- |
| `npm run dev` | start the Vite dev server |
| `npm run build` | typecheck, then build to `dist/` |
| `npm run preview` | serve the production build locally |
| `npm run lint` | run ESLint |

There is no test suite yet — [`src/game/reducer.ts`](src/game/reducer.ts) is
written as a pure function specifically so it can be unit tested first.

## How it works

```text
src/
  game/
    constants.ts      difficulty curve (spawn rate, lifetime, speed, multiplier)
    types.ts          Insect, GameState, Action
    reducer.ts        pure game-state transitions + high-score persistence
    useGameEngine.ts  requestAnimationFrame loop, spawning, pointer dragging
  context/
    gameContext.ts    the two contexts and their hooks
    Context.tsx       the provider
  components/         Owl, Mouth, Insect, Hud, Overlay, Navbar, ...
```

Three design points worth knowing before changing things:

**Positions never live in React state.** Every insect's position and velocity is
held in a ref and written straight to the DOM as a `transform` by the animation
loop. React only re-renders when an insect is added or removed. Routing
per-frame movement through `useState` would re-render the whole board 60 times a
second — the same reason eye tracking in `Owl.tsx` listens on `window` and
writes transforms directly.

**State and actions are separate contexts.** `ActionsContext` is referentially
stable for the life of the game, so memoized insects don't re-render when the
score changes; `ViewContext` carries the changing state and is read only by the
HUD and overlays.

**The mouth's hit zone and its visual are different elements.** The engine
measures the hit zone with `getBoundingClientRect`, so it must never be scaled —
a closed mouth would otherwise shrink the drop target to nothing. The inner
element carries the open/chomp animation.

## Input

Dragging uses Pointer Events, so mouse, touch and pen all take the same code
path. Insects are also focusable: tab to one and press Enter or Space to send it
to the owl, which keeps the game playable without a pointer. Animations respect
`prefers-reduced-motion`.

## Tuning the difficulty

Everything that shapes the difficulty curve lives in
[`src/game/constants.ts`](src/game/constants.ts) — spawn interval, insect
lifetime, speed scaling, and how fast the combo multiplier builds. Per-species
points, speed and spawn weight are in
[`src/data/insectsData.ts`](src/data/insectsData.ts).
