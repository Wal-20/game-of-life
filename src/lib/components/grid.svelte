<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import {
		game,
		on,
		refs,
		CELL,
		MIN_SCALE,
		MAX_SCALE,
		birthCell,
		killCell,
		gameLoop,
		centerView
	} from '../game.svelte';

	let viewport: HTMLElement;
	let dragging = $state(false);
	let startX = 0;
	let startY = 0;
	let originX = 0;
	let originY = 0;
	let moved = 0;
	let drawing = false;

	// active pointers, for pinch
	const pointers = new Map<number, { x: number; y: number }>();
	let pinchDist = 0;
	let pinchMidX = 0;
	let pinchMidY = 0;

	const FADE_MS = 150;
	const fadeMs = $derived(game.fade ? FADE_MS : 0);

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

	// zoom to `target`, keeping the screen point (mx, my) fixed
	function zoomAt(mx: number, my: number, target: number) {
		const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, target));
		const ratio = next / game.scale;
		game.offsetX = mx - (mx - game.offsetX) * ratio;
		game.offsetY = my - (my - game.offsetY) * ratio;
		game.scale = next;
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		const rect = viewport.getBoundingClientRect();
		zoomAt(
			event.clientX - rect.left,
			event.clientY - rect.top,
			game.scale * Math.exp(-event.deltaY * 0.002)
		);
	}

	function cellAt(event: PointerEvent) {
		const rect = viewport.getBoundingClientRect();
		const size = CELL * game.scale;
		const cx = Math.floor((event.clientX - rect.left - game.offsetX) / size);
		const cy = Math.floor((event.clientY - rect.top - game.offsetY) / size);
		return [cx, cy];
	}

	// mouse: ctrl draws. touch / pen: the draw mode toggle draws.
	function wantsDraw(event: PointerEvent) {
		return event.pointerType === 'mouse' ? event.ctrlKey : game.drawMode;
	}

	function startDrag(event: PointerEvent) {
		if (event.button !== 0) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

		if (pointers.size === 2) {
			// second finger: abandon the single-finger action, start a pinch
			dragging = false;
			drawing = false;
			const [a, b] = [...pointers.values()];
			pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
			pinchMidX = (a.x + b.x) / 2;
			pinchMidY = (a.y + b.y) / 2;
			return;
		}
		if (pointers.size > 2) return;

		if (wantsDraw(event)) {
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
		if (pointers.has(event.pointerId)) {
			pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		}

		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			const dist = Math.hypot(a.x - b.x, a.y - b.y);
			const mx = (a.x + b.x) / 2;
			const my = (a.y + b.y) / 2;
			const rect = viewport.getBoundingClientRect();

			// two-finger pan, then zoom around the midpoint
			game.offsetX += mx - pinchMidX;
			game.offsetY += my - pinchMidY;
			zoomAt(mx - rect.left, my - rect.top, (game.scale * dist) / pinchDist);

			pinchDist = dist;
			pinchMidX = mx;
			pinchMidY = my;
			return;
		}

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
		pointers.delete(event.pointerId);
		if (drawing) {
			drawing = false;
			return;
		}
		if (!dragging) return;
		dragging = false;
		if (moved < 4) clickAt(event); // treat as click, not drag
	}

	function cancelDrag(event: PointerEvent) {
		pointers.delete(event.pointerId);
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
		class={['canvas', game.playing && 'active']}
		style:width="{game.half * 2 * CELL}px"
		style:height="{game.half * 2 * CELL}px"
		style:transform="translate({game.offsetX}px, {game.offsetY}px) scale({game.scale}) translate({-game.half *
			CELL}px, {-game.half * CELL}px)"
	>
		{#each [...on] as key (key)}
			{@const [x, y] = key.split(',').map(Number)}
			<div
				class="cell"
				class:glow={game.glow}
				style:left="{(x + game.half) * CELL}px"
				style:top="{(y + game.half) * CELL}px"
				in:fade={{ duration: fadeMs }}
				out:fade={{ duration: fadeMs }}
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
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		touch-action: none;
		background-color: var(--bg);
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
		background-size: 10px 10px;
		background-color: var(--bg);
	}

	.canvas:not(.active) {
		border: 1px solid var(--fg);
	}

	.cell {
		position: absolute;
		width: 10px;
		height: 10px;
		background-color: var(--fg);
	}
	.cell.glow {
		box-shadow: 0 0 6px var(--fg);
	}
</style>
