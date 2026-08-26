<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getProjectNames, rateName } from './project.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { createColumns, type NameRow } from './columns.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import NameDetailsDialog from './name-details-dialog.svelte';
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

	type Rating = 'dislike' | 'like' | 'love';

	// Optimistic overrides layered on top of the last-fetched data. Rating a
	// name updates the visible (and filtered) list instantly instead of
	// waiting on a full-list refresh, which re-fetches thousands of rows and
	// can take a while, especially on mobile.
	let pendingRatings = $state<Record<string, Rating>>({});

	function withPendingRatings(rows: NameRow[]) {
		if (Object.keys(pendingRatings).length === 0) return rows;
		return rows.map((row) =>
			row.id in pendingRatings ? { ...row, rating: pendingRatings[row.id] } : row
		);
	}

	function clearPending(...nameIds: string[]) {
		if (nameIds.every((id) => !(id in pendingRatings))) return;
		const next = { ...pendingRatings };
		for (const id of nameIds) delete next[id];
		pendingRatings = next;
	}

	// Isolated from the filtering/overlay below: this only re-awaits when
	// getProjectNames actually refreshes, not whenever pendingRatings changes.
	const rawNames = $derived(await getProjectNames(projectId));

	// Plain sync derived — no `await` in this expression — so applying an
	// optimistic rating never waits on any network activity.
	const filteredNames = $derived(filterByRating(withPendingRatings(rawNames), ratingFilter));

	async function rateOptimistically(nameId: string, rating: Rating) {
		pendingRatings = { ...pendingRatings, [nameId]: rating };
		try {
			await rateName({ namingProjectId: projectId, nameId, rating });
		} catch {
			clearPending(nameId);
			return;
		}
		// Reconcile with the server in the background — don't block on it.
		getProjectNames(projectId)
			.refresh()
			.then(() => clearPending(nameId));
	}

	const columns = createColumns(rateOptimistically);

	async function bulkDislike(selectedIds: string[], clearSelection: () => void) {
		pendingRatings = {
			...pendingRatings,
			...Object.fromEntries(selectedIds.map((id) => [id, 'dislike' as const]))
		};
		clearSelection();
		await Promise.all(
			selectedIds.map((id) =>
				rateName({ namingProjectId: projectId, nameId: id, rating: 'dislike' })
			)
		);
		getProjectNames(projectId)
			.refresh()
			.then(() => clearPending(...selectedIds));
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
					<NameDetailsDialog
						{projectId}
						nameId={row.id}
						name={row.name}
						rankAllTime={row.rankAllTime}
						amountAllTime={row.amountAllTime}
						rankRecent={row.rankRecent}
						amountRecent={row.amountRecent}
						onRated={() => getProjectNames(projectId).refresh()}
					/>
				{/snippet}
			</DataTable>
		{/key}

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>
</div>
