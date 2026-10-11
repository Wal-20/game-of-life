<script lang="ts">
	import { onMount } from 'svelte';
	import { game, on, refs, CELL, MIN_SCALE, MAX_SCALE, birthCell, killCell, gameLoop, centerView } from '../game.svelte';

	let viewport: HTMLElement;
	let dragging = $state(false);
	let startX = 0;
	let startY = 0;
	let originX = 0;
	let originY = 0;
	let moved = 0;
	let drawing = false;

	onMount(() => {
		refs.viewport = viewport;
		centerView();

		// non-passive so preventDefault works
		viewport.addEventListener('wheel', onWheel, { passive: false });
		return () => viewport.removeEventListener('wheel', onWheel);
	});

	$effect(() => {
		if (!game.playing) return;
		const id = setInterval(gameLoop, game.tickMs);
		return () => clearInterval(id);
	});

	function onWheel(event: WheelEvent) {
		event.preventDefault();

		const rect = viewport.getBoundingClientRect();
		const mx = event.clientX - rect.left;
		const my = event.clientY - rect.top;

		const next = Math.min(
			MAX_SCALE,
			Math.max(MIN_SCALE, game.scale * Math.exp(-event.deltaY * 0.002))
		);
		const ratio = next / game.scale;

		// keep the point under the cursor fixed
		game.offsetX = mx - (mx - game.offsetX) * ratio;
		game.offsetY = my - (my - game.offsetY) * ratio;
		game.scale = next;
	}

	function cellAt(event: PointerEvent) {
		const rect = viewport.getBoundingClientRect();
		const size = CELL * game.scale;
		const cx = Math.floor((event.clientX - rect.left - game.offsetX) / size);
		const cy = Math.floor((event.clientY - rect.top - game.offsetY) / size);
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
		originX = game.offsetX;
		originY = game.offsetY;
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
		game.offsetX = originX + dx;
		game.offsetY = originY + dy;
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
		if (game.playing) return;
		const [cx, cy] = cellAt(event);
		birthCell(cx, cy); // add() on a Set is idempotent, so re-visiting a cell is harmless
	}

	function clickAt(event: PointerEvent) {
		if (game.playing) return;
		const [cx, cy] = cellAt(event);
		if (!on.has(`${cx},${cy}`)) {
			birthCell(cx, cy);
		} else killCell(cx, cy);
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
		style:width="{game.half * 2 * CELL}px"
		style:height="{game.half * 2 * CELL}px"
		style:transform="translate({game.offsetX}px, {game.offsetY}px) scale({game.scale}) translate({-game.half *
			CELL}px, {-game.half * CELL}px)"
	>
		{#each [...on] as key (key)}
			{@const [x, y] = key.split(',').map(Number)}
			<div
				class="cell"
				style:left="{(x + game.half) * CELL}px"
				style:top="{(y + game.half) * CELL}px"
			></div>
		{/each}
	</div>
</div>

<svelte:window
	onkeydown={(e) => {
		if (e.code !== 'Space') return;
		e.preventDefault();
		game.playing = !game.playing;
	}}
/>

<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') game.playing = false;
	}}
/>

<style>
	.viewport {
		flex: 1;
		min-width: 0;
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
