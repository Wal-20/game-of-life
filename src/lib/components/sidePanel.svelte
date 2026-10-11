<script lang="ts">
	import { game, restart, color_palettes } from '../game.svelte';
	import { loadRLE } from '../rleParser';
	let panelHidden = $state(false);
	let open = $state(false);

	let rle = $state('');

	function load() {
		loadRLE(rle);
		rle = '';
	}
</script>

<div class={panelHidden ? 'hide' : ''}>
	<aside class="panel" class:open>
		<section>
			<h3>Speed <b>{game.tickMs} ms</b></h3>
			<input
				class="range"
				type="range"
				min="50"
				max="1000"
				step="50"
				bind:value={game.tickMs}
				style:--pct="{((game.tickMs - 50) / 950) * 100}%"
			/>
		</section>

		<section>
			<label class="toggle">
				<span>Glow</span>
				<input type="checkbox" bind:checked={game.glow} />
			</label>
			<label class="toggle">
				<span>Fade</span>
				<input type="checkbox" bind:checked={game.fade} />
			</label>
			<section>
				<h3>Import RLE</h3>
				<textarea
					bind:value={rle}
					rows="4"
					placeholder="x = 3, y = 3, rule = B3/S23&#10;bob$2bo$3o!"
					spellcheck="false"></textarea>
				<button class="load" onclick={load} disabled={!rle.trim()}>Load</button>
			</section>
		</section>

		<section>
			<div class="palettes">
				{#each color_palettes as [bg, fg], i (i)}
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
		</section>
	</aside>
	<div class="controls">
		<button
			class="draw"
			class:active={game.drawMode}
			onclick={() => (game.drawMode = !game.drawMode)}
			aria-label="Draw mode"
			aria-pressed={game.drawMode}
		>
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
				<path d="M12 20h9" />
				<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
			</svg>
		</button>
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
		<button class="menu" onclick={() => (open = !open)} aria-label="Settings" aria-expanded={open}>
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			>
				<path d="M4 6h16M4 12h16M4 18h16" />
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
		width: 240px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		border-radius: 20px;
		color: var(--fg);
		background: color-mix(in srgb, var(--bg) 80%, transparent);
		border: 1px solid color-mix(in srgb, var(--fg) 35%, transparent);
		backdrop-filter: blur(10px);
		font-size: 13px;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	h3 {
		margin: 0;
		display: flex;
		justify-content: space-between;
	}

	h3 b {
		opacity: 1;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
	}

	/* slider */
	.range {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 6px;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
		background: linear-gradient(
			to right,
			var(--fg) var(--pct),
			color-mix(in srgb, var(--fg) 25%, transparent) var(--pct)
		);
	}

	.range::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--fg);
		border: 3px solid var(--bg);
		box-shadow: 0 0 0 1px var(--fg);
	}

	.range::-moz-range-thumb {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--fg);
		border: 3px solid var(--bg);
		box-shadow: 0 0 0 1px var(--fg);
	}

	.range:focus-visible::-webkit-slider-thumb {
		outline: 2px solid var(--fg);
		outline-offset: 2px;
	}

	/* switches */
	.toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		font-size: 14px;
	}

	.toggle input {
		-webkit-appearance: none;
		appearance: none;
		position: relative;
		width: 34px;
		height: 20px;
		margin: 0;
		border-radius: 10px;
		cursor: pointer;
		background: color-mix(in srgb, var(--fg) 25%, transparent);
		transition: background 0.15s;
	}

	.toggle input::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--bg);
		transition: transform 0.15s;
	}

	.toggle input:checked {
		background: var(--fg);
	}

	.toggle input:checked::after {
		transform: translateX(14px);
	}

	.toggle input:focus-visible {
		outline: 2px solid var(--fg);
		outline-offset: 2px;
	}

	.palettes {
		margin-top: 10px;
		display: grid;
		grid-template-columns: repeat(3, 30px);
		gap: 8px;
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
		transition: transform 0.12s;
	}

	.swatch:hover {
		transform: scale(1.08);
	}

	.swatch.selected {
		outline: 2px solid var(--fg);
		outline-offset: 2px;
	}

	/* play / restart */
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
		border: 1px solid var(--fg);
		padding: 5px 12px;
		display: flex;
		align-items: center;
		color: var(--fg);
		background: var(--bg);
	}

	.controls button:hover {
		background: color-mix(in srgb, var(--fg) 15%, var(--bg));
	}
	.controls .menu {
		display: none;
	}

	@media (max-width: 1000px) {
		.controls .menu {
			display: flex;
		}

		.panel {
			display: none;
			top: auto;
			bottom: 72px; /* clears the controls row */
			left: 12px;
			right: 12px;
			width: auto;
			max-height: 55vh;
			overflow-y: auto;
			box-sizing: border-box;
			transform: none; /* drops the desktop vertical centering */
		}

		.panel.open {
			display: flex;
		}

		.palettes {
			grid-template-columns: repeat(auto-fill, 30px);
		}
	}
	.controls .draw {
		display: none; /* hidden on mouse devices */
	}

	@media (pointer: coarse) {
		.controls .draw {
			display: flex;
		}
	}

	.controls button.active {
		background: var(--fg);
		color: var(--bg);
	}
</style>
