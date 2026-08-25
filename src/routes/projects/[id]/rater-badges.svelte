<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		ratings
	}: {
		ratings: { userId: string; userName: string; rating: 'dislike' | 'like' | 'love' }[];
	} = $props();
</script>

<div class="flex flex-wrap gap-1">
	{#each ratings as r (r.userId)}
		<Badge
			variant={r.rating === 'love'
				? 'default'
				: r.rating === 'dislike'
					? 'destructive'
					: 'secondary'}
		>
			{#if r.rating === 'love'}
				<HeartIcon data-icon="inline-start" />
			{:else if r.rating === 'dislike'}
				<XIcon data-icon="inline-start" />
			{:else}
				<ThumbsUpIcon data-icon="inline-start" />
			{/if}
			{r.userName}
		</Badge>
	{/each}
</div>
