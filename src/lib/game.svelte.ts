import { SvelteSet } from 'svelte/reactivity';

export const color_palettes = [
  ['#FFF8B0', '#AEEED3'], // sky blue
  ['#FCF1D0', '#22396F'], // Beige / Dark blue
  ['#EEEAD7', '#757D6F'], // camo color
  ['#FFFBE9', '#A4BE7B'], // Beige / green
  ['#E1DCC9', '#1F150C'], // Beige / brown
  ['#000', '#FFF'], // Black / White
  ['#393E46', '#FFF'], // Grey / White
];

export const CELL = 10;
export const INITIAL_CELLS = 500;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
const dirs = [-1, 0, 1];

export const game = $state({
  offsetX: 0, // screen position of cell (0,0)
  offsetY: 0,
  scale: 1,
  playing: false,
  half: INITIAL_CELLS / 2,
  tickMs: 200,
  selectedColorPalette: 6,
  glow: false,
  fade: false,
});

export const on = new SvelteSet<string>(); // "x,y" keys of ON cells

// set by Grid on mount, used to center the view
export const refs: { viewport: HTMLElement | null } = { viewport: null };

export function centerView() {
  if (!refs.viewport) return;
  game.offsetX = refs.viewport.clientWidth / 2;
  game.offsetY = refs.viewport.clientHeight / 2;
}

export function restart() {
  game.playing = false;
  game.scale = 1;
  game.half = INITIAL_CELLS / 2;
  on.clear();
  centerView();
}

export function birthCell(cx: number, cy: number) {
  const half = game.half;
  if (cx < -half || cx >= half || cy < -half || cy >= half) return;
  on.add(`${cx},${cy}`);
  const atBorder = cx === -half || cx === half - 1 || cy === -half || cy === half - 1;
  if (game.playing && atBorder) game.half += 10;
}

export function killCell(cx: number, cy: number) {
  const half = game.half;
  if (cx < -half || cx >= half || cy < -half || cy >= half) return;
  on.delete(`${cx},${cy}`);
}

function countLiveNeighbors(cx: number, cy: number) {
  let n = 0;
  for (const dx of dirs) {
    for (const dy of dirs) {
      if (dx === 0 && dy === 0) continue;
      if (on.has(`${cx + dx},${cy + dy}`)) n++;
    }
  }
  return n;
}

function willSurvive(cx: number, cy: number) {
  const alive = on.has(`${cx},${cy}`);
  const liveNeighbors = countLiveNeighbors(cx, cy);
  if (alive && liveNeighbors < 2) return false;
  if (alive && liveNeighbors <= 3) return true;
  if (alive && liveNeighbors > 3) return false;
  return liveNeighbors === 3;
}

function growGridFor(cx: number, cy: number) {
  while (cx <= -game.half || cx >= game.half - 1 || cy <= -game.half || cy >= game.half - 1)
    game.half += 10;
}

export function gameLoop() {
  const candidates = new SvelteSet<string>();
  for (const key of on) {
    const [x, y] = key.split(',').map(Number);
    for (const dx of dirs) for (const dy of dirs) candidates.add(`${x + dx},${y + dy}`);
  }

  const births: [number, number][] = [];
  const deaths: [number, number][] = [];
  for (const key of candidates) {
    const [cx, cy] = key.split(',').map(Number);
    const alive = on.has(key);
    const survives = willSurvive(cx, cy);
    if (survives && !alive) births.push([cx, cy]);
    else if (!survives && alive) deaths.push([cx, cy]);
  }

  for (const [cx, cy] of deaths) killCell(cx, cy);
  for (const [cx, cy] of births) {
    growGridFor(cx, cy);
    birthCell(cx, cy);
  }
}
