<script lang="ts">
	import Grid from '../lib/components/grid.svelte';
	import SidePanel from '../lib/components/sidePanel.svelte';
</script>

<div class="layout">
	<SidePanel />
	<Grid />
</div>

<style>
	.layout { display: flex; height: 100vh; }
</style>
