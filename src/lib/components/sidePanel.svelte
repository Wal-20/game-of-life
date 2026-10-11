<script lang="ts">
	import { game, on, restart } from '../game.svelte';
</script>

<aside class="panel">
	<p>Live cells: {on.size}</p>
	<p>Grid: {game.half * 2} × {game.half * 2}</p>

	<label>
		Speed ({game.tickMs} ms)
		<input type="range" min="50" max="1000" step="50" bind:value={game.tickMs} />
	</label>
</aside>

<div class="controls">
	<button onclick={() => (game.playing = !game.playing)} aria-label={game.playing ? 'Pause' : 'Play'}>
		<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
			{#if game.playing}
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

<style>
	.panel {
		width: 240px;
		padding: 16px;
	}

	.controls {
		position: fixed;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 8px;
		z-index: 10;
	}

	.controls button {
		cursor: pointer;
		border: 1px solid black;
		padding: 5px 12px;
		display: flex;
		align-items: center;
		background: white;
	}
</style>
