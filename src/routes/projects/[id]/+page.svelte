<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getProjectNames, rateName } from './project.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { formatNumber } from '#lib/components/data-table/number-cell.js';
	import { columns, type NameRow } from './columns.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import ListIcon from '@lucide/svelte/icons/list';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import XIcon from '@lucide/svelte/icons/x';

	const projectId = $derived(page.params.id!);

	type RatingFilter = 'all' | 'liked-loved' | 'unrated' | 'disliked';

	const ratingFilter = $derived(
		(page.url.searchParams.get('rating') as RatingFilter | null) ?? 'unrated'
	);

	function setRatingFilter(value: RatingFilter) {
		const url = new URL(page.url.href);
		url.searchParams.set('rating', value);
		goto(url, { replace: true, reset: false });
	}

	function filterByRating(names: NameRow[], filter: RatingFilter) {
		if (filter === 'liked-loved')
			return names.filter((n) => n.rating === 'like' || n.rating === 'love');
		if (filter === 'unrated') return names.filter((n) => n.rating === null);
		if (filter === 'disliked') return names.filter((n) => n.rating === 'dislike');
		return names;
	}

	const filteredNames = $derived(filterByRating(await getProjectNames(projectId), ratingFilter));

	async function bulkDislike(selectedIds: string[], clearSelection: () => void) {
		await Promise.all(
			selectedIds.map((id) =>
				rateName({ namingProjectId: projectId, nameId: id, rating: 'dislike' })
			)
		);
		clearSelection();
		await getProjectNames(projectId).refresh();
	}
</script>

<div class="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-4 p-4">
	<svelte:boundary>
		{#key projectId}
			<DataTable
				data={filteredNames}
				{columns}
				filterColumnId="name"
				filterPlaceholder="Search..."
				pageSize={100}
				emptyMessage="No names found."
				selectable
			>
				{#snippet bulkActions({ selectedIds, clearSelection })}
					<Button
						variant="destructive"
						size="sm"
						onclick={() => bulkDislike(selectedIds, clearSelection)}
					>
						<XIcon />
						Dislike selected
					</Button>
				{/snippet}
				{#snippet toolbarEnd()}
					<ButtonGroup>
						<Button
							variant={ratingFilter === 'unrated' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show names not rated by me"
							aria-pressed={ratingFilter === 'unrated'}
							onclick={() => setRatingFilter('unrated')}
						>
							<CircleDashedIcon />
						</Button>
						<Button
							variant={ratingFilter === 'liked-loved' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show liked and loved names"
							aria-pressed={ratingFilter === 'liked-loved'}
							onclick={() => setRatingFilter('liked-loved')}
						>
							<HeartIcon />
						</Button>

						<Button
							variant={ratingFilter === 'all' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show all names"
							aria-pressed={ratingFilter === 'all'}
							onclick={() => setRatingFilter('all')}
						>
							<ListIcon />
						</Button>
						<Button
							variant={ratingFilter === 'disliked' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show disliked names"
							aria-pressed={ratingFilter === 'disliked'}
							onclick={() => setRatingFilter('disliked')}
						>
							<XIcon />
						</Button>
					</ButtonGroup>
				{/snippet}
				{#snippet rowDetails(row: NameRow)}
					<Dialog.Header>
						<Dialog.Title class="text-2xl">{row.name}</Dialog.Title>
						<Dialog.Description>Rank and birth counts</Dialog.Description>
					</Dialog.Header>
					<Card.Root>
						<Card.Content class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									All-time rank
								</p>
								<p class="text-2xl font-semibold tabular-nums">
									{row.rankAllTime ? `#${formatNumber(row.rankAllTime)}` : '—'}
								</p>
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									All-time births
								</p>
								<p class="text-2xl font-semibold tabular-nums">
									{formatNumber(row.amountAllTime)}
								</p>
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									2025 rank
								</p>
								<p class="text-2xl font-semibold tabular-nums">
									{row.rankRecent ? `#${formatNumber(row.rankRecent)}` : '—'}
								</p>
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									2025 births
								</p>
								<p class="text-2xl font-semibold tabular-nums">
									{formatNumber(row.amountRecent)}
								</p>
							</div>
						</Card.Content>
					</Card.Root>
				{/snippet}
			</DataTable>
		{/key}

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>
</div>
