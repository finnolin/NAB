<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';

	let {
		label,
		sorted,
		onclick
	}: {
		label: string;
		sorted: false | 'asc' | 'desc';
		onclick: ((event: unknown) => void) | undefined;
	} = $props();
</script>

<Button variant="ghost" size="sm" class="-ms-3" {onclick}>
	{label}
	{#if sorted === 'asc'}
		<ArrowUpIcon class="ms-2 size-4" />
	{:else if sorted === 'desc'}
		<ArrowDownIcon class="ms-2 size-4" />
	{:else}
		<ArrowUpDownIcon class="ms-2 size-4" />
	{/if}
</Button>
