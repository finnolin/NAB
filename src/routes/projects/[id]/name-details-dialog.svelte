<script lang="ts">
	import NameStatsCard from './name-stats-card.svelte';
	import RaterBadges from './rater-badges.svelte';
	import { getNameRatings, rateName } from './project.remote.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import XIcon from '@lucide/svelte/icons/x';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import HeartIcon from '@lucide/svelte/icons/heart';

	let {
		projectId,
		nameId,
		name,
		rankAllTime,
		amountAllTime,
		rankRecent,
		amountRecent,
		onRated
	}: {
		projectId: string;
		nameId: string;
		name: string;
		rankAllTime: number | null;
		amountAllTime: number;
		rankRecent: number | null;
		amountRecent: number;
		onRated?: () => void | Promise<void>;
	} = $props();

	async function rate(rating: 'dislike' | 'like' | 'love') {
		await rateName({ namingProjectId: projectId, nameId, rating });
		await getNameRatings({ projectId, nameId }).refresh();
		await onRated?.();
	}
</script>

<NameStatsCard {name} {rankAllTime} {amountAllTime} {rankRecent} {amountRecent} />

<svelte:boundary>
	{@const { ratings, myRating } = await getNameRatings({ projectId, nameId })}
	<div class="flex flex-col gap-2">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Rated by</p>
		<RaterBadges {ratings} />
	</div>

	<div class="flex items-center justify-between">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Your rating</p>
		<ButtonGroup>
			<Button
				variant={myRating === 'dislike' ? 'destructive' : 'outline'}
				size="icon-sm"
				aria-label="Dislike"
				aria-pressed={myRating === 'dislike'}
				onclick={() => rate('dislike')}
			>
				<XIcon />
			</Button>
			<Button
				variant={myRating === 'like' ? 'default' : 'outline'}
				size="icon-sm"
				aria-label="Like"
				aria-pressed={myRating === 'like'}
				onclick={() => rate('like')}
			>
				<ThumbsUpIcon />
			</Button>
			<Button
				variant={myRating === 'love' ? 'default' : 'outline'}
				size="icon-sm"
				aria-label="Love"
				aria-pressed={myRating === 'love'}
				onclick={() => rate('love')}
			>
				<HeartIcon />
			</Button>
		</ButtonGroup>
	</div>

	{#snippet pending()}
		<p class="text-sm text-muted-foreground">Loading ratings…</p>
	{/snippet}
</svelte:boundary>
