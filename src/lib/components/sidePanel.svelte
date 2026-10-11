<script lang="ts">
	import { game, on, restart, color_palettes } from '../game.svelte';
	let panelHidden = $state(false);
</script>

<div class={panelHidden ? 'hide' : ''}>
	<aside class="panel">
		<p>Live cells: {on.size}</p>
		<p>Grid: {game.half * 2} × {game.half * 2}</p>

		<label class="speed">
			<span>Speed <b>{game.tickMs} ms</b></span>
			<input type="range" min="50" max="1000" step="50" bind:value={game.tickMs} />
		</label>
		<label><input type="checkbox" bind:checked={game.glow} /> Glow</label>
		<label><input type="checkbox" bind:checked={game.fade} /> Fade</label>

		<div class="palettes">
			{#each color_palettes as [bg, fg], i}
				<button
					class="swatch"
					class:selected={game.selectedColorPalette === i}
					style:--a={bg}
					style:--b={fg}
					onclick={() => (game.selectedColorPalette = i)}
					aria-label="Palette {i + 1}"
					aria-pressed={game.selectedColorPalette === i}
				></button>
			{/each}
		</div>
	</aside>

	<div class="controls">
		<button
			onclick={() => (game.playing = !game.playing)}
			aria-label={game.playing ? 'Pause' : 'Play'}
		>
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
</div>

<style>
	.hide {
		display: none;
	}
	.panel {
		position: absolute;
		left: 24px;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 220px;
		padding: 16px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--bg, white) 85%, transparent);
		border: 1px solid var(--fg, gray);
		backdrop-filter: blur(6px);
		color: var(--fg);
	}
	.palettes {
	    margin-top: 10px;
		display: grid;
		grid-template-columns: repeat(3, 35px);
	}

	.swatch {
		width: 30px;
		height: 30px;
		padding: 0;
		border: 1px solid var(--fg, gray);
		border-radius: 8px;
		cursor: pointer;
		/* hard stop at 50% = two solid halves */
		background: linear-gradient(to right, var(--a) 50%, var(--b) 50%);
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

	.speed {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
		font-size: 14px;
		color: var(--fg, black);
	}
	
	.speed span {
		display: flex;
		justify-content: space-between;
	}
	
	.speed input {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: color-mix(in srgb, var(--fg, black) 30%, transparent);
		outline: none;
		cursor: pointer;
	}
	
	/* thumb: Chrome, Safari, Edge */
	.speed input::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--fg, black);
		border: 2px solid var(--bg, white);
		box-shadow: 0 0 0 1px var(--fg, black);
	}
	
	/* thumb: Firefox */
	.speed input::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--fg, black);
		border: 2px solid var(--bg, white);
		box-shadow: 0 0 0 1px var(--fg, black);
	}
	
	.speed input::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: color-mix(in srgb, var(--fg, black) 30%, transparent);
	}
	
	.speed input:focus-visible::-webkit-slider-thumb {
		outline: 2px solid var(--fg, black);
		outline-offset: 2px;
	}
</style>
