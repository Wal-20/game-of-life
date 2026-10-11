<script lang="ts">
	import Grid from '../lib/components/grid.svelte';
	import SidePanel from '../lib/components/sidePanel.svelte';
	import { game, color_palettes } from '../lib/game.svelte';
	const colors = $derived(color_palettes[game.selectedColorPalette]);

	const allowed = (e: Event) =>
		(e.target as HTMLElement)?.closest?.('textarea, input[type="text"]');
	const block = (e: Event) => {
		if (!allowed(e)) e.preventDefault();
	};
</script>

<svelte:document
	onselectstart={block}
	oncopy={block}
	oncut={block}
	ondragstart={block}
	oncontextmenu={block}
/>

<div class="layout chivo-mono-1" style:--bg={colors[0]} style:--fg={colors[1]}>
	<SidePanel />
	<Grid />
</div>

<style>
	.layout {
		position: relative;
		height: 100vh;
		overflow: hidden;
	}
</style>
