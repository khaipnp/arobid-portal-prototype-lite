<script lang="ts">
import { ModeWatcher } from "mode-watcher"
import "./layout.css"
import favicon from "$lib/assets/favicon.svg"

let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
	<style>
		:root {
			--font-sans: 'Outfit', 'Roboto', sans-serif;
			font-family: var(--font-sans);
		}
	</style>
</svelte:head>

<ModeWatcher />

{@render children()}
