<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getAllNames } from './all-names.remote.js';
	import { rateName } from '../names.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { columns, type NameRow } from './columns.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import ListIcon from '@lucide/svelte/icons/list';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import XIcon from '@lucide/svelte/icons/x';

	type RatingFilter = 'liked-loved' | 'unrated' | 'disliked' | null;

	const ratingFilter = $derived(page.url.searchParams.get('rating') as RatingFilter);

	function setRatingFilter(value: RatingFilter) {
		const url = new URL(page.url.href);
		if (value) url.searchParams.set('rating', value);
		else url.searchParams.delete('rating');
		goto(url, { replace: true, reset: false });
	}

	function filterByRating(names: NameRow[], filter: RatingFilter) {
		if (filter === 'liked-loved')
			return names.filter((n) => n.rating === 'like' || n.rating === 'love');
		if (filter === 'unrated') return names.filter((n) => n.rating === null);
		if (filter === 'disliked') return names.filter((n) => n.rating === 'dislike');
		return names;
	}

	const filteredNames = $derived(filterByRating(await getAllNames(), ratingFilter));

	async function bulkDislike(selectedIds: string[], clearSelection: () => void) {
		await Promise.all(selectedIds.map((id) => rateName({ firstNameId: id, rating: 'dislike' })));
		clearSelection();
		await getAllNames().refresh();
	}
</script>

<div class="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-4 p-4">
	<svelte:boundary>
		{#key ratingFilter}
			<DataTable
				data={filteredNames}
				{columns}
				filterColumnId="name"
				filterPlaceholder="Filter by name…"
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
							variant={ratingFilter === null ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show all names"
							aria-pressed={ratingFilter === null}
							onclick={() => setRatingFilter(null)}
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
			</DataTable>
		{/key}

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>
</div>
