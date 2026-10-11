<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	const CELL = 10; // px per cell
	const INITIAL_CELLS = 20; // 100px / 10px
	const MIN_SCALE = 0.1;
	const MAX_SCALE = 5;
	const TICK_MS = 200;
	const dirs = [-1, 0, 1];

	let offsetX = $state(0); // screen position of cell (0,0)
	let offsetY = $state(0);
	let scale = $state(1);
	let dragging = $state(false);
	let playing = $state(false);

	// grid spans cells [-half, half) on both axes, centered on the canvas origin
	let half = $state(INITIAL_CELLS / 2);
	const on = new SvelteSet<string>(); // "x,y" keys of ON cells

	let viewport: HTMLElement;
	let startX = 0;
	let startY = 0;
	let originX = 0;
	let originY = 0;
	let moved = 0;
	let drawing = false;

	onMount(() => {
		offsetX = viewport.clientWidth / 2;
		offsetY = viewport.clientHeight / 2;

		// non-passive so preventDefault works
		viewport.addEventListener('wheel', onWheel, { passive: false });
		return () => viewport.removeEventListener('wheel', onWheel);
	});

	function restart() {
		playing = false;
		offsetX = viewport.clientWidth / 2;
		offsetY = viewport.clientHeight / 2;
		scale = 1;
		on.clear();
		half = INITIAL_CELLS / 2;
	}

	$effect(() => {
		if (!playing) return;
		const id = setInterval(gameLoop, TICK_MS);
		return () => clearInterval(id);
	});

	function onWheel(event: WheelEvent) {
		event.preventDefault();

		const rect = viewport.getBoundingClientRect();
		const mx = event.clientX - rect.left;
		const my = event.clientY - rect.top;

		const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * Math.exp(-event.deltaY * 0.002)));
		const ratio = next / scale;

		// keep the point under the cursor fixed
		offsetX = mx - (mx - offsetX) * ratio;
		offsetY = my - (my - offsetY) * ratio;
		scale = next;
	}

	function cellAt(event: PointerEvent) {
		const rect = viewport.getBoundingClientRect();
		const size = CELL * scale;
		const cx = Math.floor((event.clientX - rect.left - offsetX) / size);
		const cy = Math.floor((event.clientY - rect.top - offsetY) / size);
		return [cx, cy];
	}

	function startDrag(event: PointerEvent) {
		if (event.button !== 0) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

		if (event.ctrlKey) {
			drawing = true;
			drawAt(event);
			return;
		}

		dragging = true;
		moved = 0;
		startX = event.clientX;
		startY = event.clientY;
		originX = offsetX;
		originY = offsetY;
	}

	function moveDrag(event: PointerEvent) {
		if (drawing) {
			drawAt(event);
			return;
		}
		if (!dragging) return;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		moved = Math.max(moved, Math.hypot(dx, dy));
		offsetX = originX + dx;
		offsetY = originY + dy;
	}

	function endDrag(event: PointerEvent) {
		if (drawing) {
			drawing = false;
			return;
		}
		if (!dragging) return;
		dragging = false;
		if (moved < 4) clickAt(event); // treat as click, not drag
	}

	function cancelDrag() {
		dragging = false;
		drawing = false;
	}

	function drawAt(event: PointerEvent) {
		if (playing) return;
		const [cx, cy] = cellAt(event);
		birthCell(cx, cy); // add() on a Set is idempotent, so re-visiting a cell is harmless
	}

	function clickAt(event: PointerEvent) {
		if (playing) return;
		const [cx, cy] = cellAt(event);
		const key = `${cx},${cy}`;
		if (!on.has(key)) {
			birthCell(cx, cy);
		} else killCell(cx, cy);
	}

	function birthCell(cx: number, cy: number) {
		if (cx < -half || cx >= half || cy < -half || cy >= half) return; // outside grid
		const key = `${cx},${cy}`;
		on.add(key);

		const atBorder = cx === -half || cx === half - 1 || cy === -half || cy === half - 1;
		if (playing && atBorder) half *= 2; // double grid size
	}

	function killCell(cx: number, cy: number) {
		if (cx < -half || cx >= half || cy < -half || cy >= half) return; // outside grid
		const key = `${cx},${cy}`;
		on.delete(key);
	}

	function countLiveNeighbors(cx: number, cy: number) {
		let liveNeighbors = 0;
		for (const dx of dirs) {
			for (const dy of dirs) {
				if (dx === 0 && dy === 0) continue;
				const key = `${cx + dx},${cy + dy}`;
				if (on.has(key)) liveNeighbors++;
			}
		}
		return liveNeighbors;
	}

	/*
	- Underpopulation: Any live cell with fewer than 2 live neighbors dies.
	- Survival: Any live cell with 2 or 3 live neighbors stays alive to the next generation.
	- Overpopulation: Any live cell with more than 3 live neighbors dies.
	- Reproduction: Any dead cell with exactly 3 live neighbors becomes a live cell.
	*/
	function willSurvive(cx: number, cy: number) {
		const alive = on.has(`${cx},${cy}`);
		const liveNeighbors = countLiveNeighbors(cx, cy);

		if (alive && liveNeighbors < 2) return false;
		if (alive && liveNeighbors <= 3) return true;
		if (alive && liveNeighbors > 3) return false;
		return liveNeighbors === 3; // dead cell
	}

	// make sure (cx, cy) is inside the grid and not on the border
	function growGridFor(cx: number, cy: number) {
		while (cx <= -half || cx >= half - 1 || cy <= -half || cy >= half - 1) half *= 2;
	}

	function gameLoop() {
		// only live cells and their neighbors can change state
		const candidates = new SvelteSet<string>();
		for (const key of on) {
			const [x, y] = key.split(',').map(Number);
			for (const dx of dirs) {
				for (const dy of dirs) {
					candidates.add(`${x + dx},${y + dy}`);
				}
			}
		}

		// decide everything against the current state first...
		const births: [number, number][] = [];
		const deaths: [number, number][] = [];
		for (const key of candidates) {
			const [cx, cy] = key.split(',').map(Number);
			const alive = on.has(key);
			const survives = willSurvive(cx, cy);

			if (survives && !alive) births.push([cx, cy]);
			else if (!survives && alive) deaths.push([cx, cy]);
		}

		// ...then apply it
		for (const [cx, cy] of deaths) killCell(cx, cy);
		for (const [cx, cy] of births) {
			growGridFor(cx, cy);
			birthCell(cx, cy);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={viewport}
	class:dragging
	class="viewport"
	onpointerdown={startDrag}
	onpointermove={moveDrag}
	onpointerup={endDrag}
	onpointercancel={cancelDrag}
	oncontextmenu={(e) => e.preventDefault()}
>
	<div
		class="canvas"
		style:width="{half * 2 * CELL}px"
		style:height="{half * 2 * CELL}px"
		style:transform="translate({offsetX}px, {offsetY}px) scale({scale}) translate({-half * CELL}px, {-half *
			CELL}px)"
	>
		{#each [...on] as key (key)}
			{@const [x, y] = key.split(',').map(Number)}
			<div class="cell" style:left="{(x + half) * CELL}px" style:top="{(y + half) * CELL}px"></div>
		{/each}
	</div>
</div>

<svelte:window
	onkeydown={(e) => {
		if (e.code !== 'Space') return;
		e.preventDefault();
		playing = !playing;
	}}
/>

<div class="controls">
	<button onclick={() => (playing = !playing)} aria-label={playing ? 'Pause' : 'Play'}>
		<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
			{#if playing}
				<rect x="6" y="5" width="4" height="14" />
				<rect x="14" y="5" width="4" height="14" />
			{:else}
				<path d="M7 4v16l13-8z" />
			{/if}
		</svg>
	</button>

	<button onclick={restart} aria-label="Restart">
		<svg
			viewBox="0 0 24 24"
			width="20"
			height="20"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M3 12a9 9 0 1 0 3-6.7" />
			<path d="M3 4v5h5" />
		</svg>
	</button>
</div>

<svelte:document on:visibilitychange={() => { if (document.visibilityState === 'hidden') playing = false} }/>

<style>
	.controls {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 8px;
	}

	.controls button {
		cursor: pointer;
		border: 1px solid black;
		padding: 5px 12px;
		display: flex;
		align-items: center;
		background: white;
	}

	.viewport {
		width: 100%;
		height: 100%;
		min-height: 100vh; /* remove if the parent already gives it a height */
		position: relative;
		overflow: hidden;
		touch-action: none;
		background-color: #f8fafc;
	}

	.viewport.dragging {
		cursor: grabbing;
		user-select: none;
	}

	.canvas {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		will-change: transform;
		background-color: white;
		background-size: 10px 10px;
		outline: 1px solid lightgray;
	}

	.cell {
		position: absolute;
		width: 10px;
		height: 10px;
		background: #3b82f6;
	}
</style>
