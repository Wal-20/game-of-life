<script lang="ts">
	import Grid from '../lib/components/grid.svelte';
	import SidePanel from '../lib/components/sidePanel.svelte';
	import { game, color_palettes } from '../lib/game.svelte';
	const colors = $derived(color_palettes[game.selectedColorPalette]);
</script>

<div class="layout" style:--bg={colors[0]} style:--fg={colors[1]}>
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
