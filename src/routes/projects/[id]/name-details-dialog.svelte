<script lang="ts">
	import NameStatsCard from './name-stats-card.svelte';
	import RaterBadges from './rater-badges.svelte';
	import { getNameRatings, getProjectAffixes, rateName } from './project.remote.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
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
	{@const affixes = await getProjectAffixes(projectId)}
	{@const prefixes = affixes.filter((a) => a.type === 'prefix')}
	{@const suffixes = affixes.filter((a) => a.type === 'suffix')}
	{#if prefixes.length > 0 || suffixes.length > 0}
		<div class="flex flex-col gap-2">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Preview</p>
			<div class="flex flex-wrap gap-1">
				{#each prefixes as p (p.id)}
					<Badge variant="outline">{p.value}{name}</Badge>
				{/each}
				{#each suffixes as s (s.id)}
					<Badge variant="outline">{name}{s.value}</Badge>
				{/each}
			</div>
		</div>
	{/if}

	{#snippet pending()}{/snippet}
</svelte:boundary>

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
