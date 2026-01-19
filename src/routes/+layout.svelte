<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';

	let { children } = $props();
</script>

<TopBar />
<main>
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		background: #f8f9fa;
	}

	main {
		min-height: calc(100vh - 60px);
	}
</style>
