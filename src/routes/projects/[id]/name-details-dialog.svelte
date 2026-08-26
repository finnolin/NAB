<script lang="ts">
	import RaterBadges from './rater-badges.svelte';
	import { getNameRatings, getProjectAffixes, rateName } from './project.remote.js';
	import { formatNumber } from '#lib/components/data-table/number-cell.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
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

	// Isolated from pendingRating below: this only re-awaits when
	// getNameRatings actually refreshes, not on every optimistic update.
	const nameRatings = $derived(await getNameRatings({ projectId, nameId }));

	// Optimistic override so the buttons update instantly instead of waiting
	// on getNameRatings' refresh. undefined = defer to the fetched value.
	let pendingRating = $state<'dislike' | 'like' | 'love' | undefined>(undefined);

	async function rate(rating: 'dislike' | 'like' | 'love') {
		pendingRating = rating;
		try {
			await rateName({ namingProjectId: projectId, nameId, rating });
		} catch {
			pendingRating = undefined;
			return;
		}
		// Reconcile with the server (and let the underlying list know) in the
		// background — don't block the buttons on either of these.
		getNameRatings({ projectId, nameId })
			.refresh()
			.then(() => {
				pendingRating = undefined;
			});
		onRated?.();
	}
</script>

<Dialog.Header class="items-center text-center">
	<Dialog.Title class="text-3xl font-semibold">{name}</Dialog.Title>
</Dialog.Header>

<svelte:boundary>
	{@const affixes = await getProjectAffixes(projectId)}
	{@const prefixes = affixes.filter((a) => a.type === 'prefix')}
	{@const suffixes = affixes.filter((a) => a.type === 'suffix')}
	{#if prefixes.length > 0 || suffixes.length > 0}
		<div class="-mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
			{#each prefixes as p (p.id)}
				<span>{p.value}{name}</span>
			{/each}
			{#each suffixes as s (s.id)}
				<span>{name}{s.value}</span>
			{/each}
		</div>
	{/if}

	{#snippet pending()}{/snippet}
</svelte:boundary>

<div class="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
	<p>
		All-time #{rankAllTime ? formatNumber(rankAllTime) : '—'} · {formatNumber(amountAllTime)} births
	</p>
	<p>2025 #{rankRecent ? formatNumber(rankRecent) : '—'} · {formatNumber(amountRecent)} births</p>
</div>

<svelte:boundary>
	{@const ratings = nameRatings.ratings}
	{@const myRating = pendingRating !== undefined ? pendingRating : nameRatings.myRating}
	<div class="flex flex-col items-center gap-3">
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
		{#if ratings.length > 0}
			<div class="flex justify-center">
				<RaterBadges {ratings} />
			</div>
		{/if}
	</div>

	{#snippet pending()}
		<p class="text-center text-sm text-muted-foreground">Loading ratings…</p>
	{/snippet}
</svelte:boundary>
