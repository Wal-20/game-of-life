import { birthCell, game, restart } from "./game.svelte";

export function parseRLE(text: string): [number, number][] {
  const cells: [number, number][] = [];

  // drop comments and the header, keep the data
  const data = text
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('x'))
    .join('');

  let x = 0;
  let y = 0;
  let count = '';

  for (const ch of data) {
    if (ch >= '0' && ch <= '9') {
      count += ch;
      continue;
    }

    const n = count ? parseInt(count) : 1;
    count = '';

    if (ch === 'b') x += n;
    else if (ch === 'o') {
      for (let i = 0; i < n; i++) cells.push([x + i, y]);
      x += n;
    } else if (ch === '$') {
      y += n;
      x = 0;
    } else if (ch === '!') break;
  }

  return cells;
}

export function loadRLE(text: string) {
  const cells = parseRLE(text);
  if (!cells.length) return;

  restart();

  const w = Math.max(...cells.map(([x]) => x)) + 1;
  const h = Math.max(...cells.map(([, y]) => y)) + 1;

  // grow the grid until the pattern fits strictly inside the border
  while (w >= game.half * 2 - 2 || h >= game.half * 2 - 2) game.half += 10;

  const ox = -Math.floor(w / 2);
  const oy = -Math.floor(h / 2);
  for (const [x, y] of cells) birthCell(x + ox, y + oy);
}
