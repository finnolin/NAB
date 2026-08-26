<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getLikedNames, type LikedNameRow } from './liked-names.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { columns } from './columns.js';
	import NameDetailsDialog from '../name-details-dialog.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import ListIcon from '@lucide/svelte/icons/list';

	const projectId = $derived(page.params.id!);

	type StatusFilter = 'unrated' | 'matched' | 'all';

	const statusFilter = $derived(
		(page.url.searchParams.get('status') as StatusFilter | null) ?? 'all'
	);

	function setStatusFilter(value: StatusFilter) {
		const url = new URL(page.url.href);
		url.searchParams.set('status', value);
		goto(url, { replace: true, reset: false });
	}

	function matchesStatus(row: LikedNameRow, filter: StatusFilter) {
		if (filter === 'unrated') return row.myRating === null;
		if (filter === 'matched') return row.matched;
		return true;
	}

	// Isolated from statusFilter: only re-awaits when getLikedNames itself
	// refreshes, so switching tabs doesn't wait on the async boundary.
	const likedNames = $derived(await getLikedNames(projectId));
	const filteredNames = $derived(likedNames.filter((row) => matchesStatus(row, statusFilter)));

	function rowClass(row: LikedNameRow) {
		return row.myRating ? 'bg-muted' : undefined;
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
				emptyMessage="No liked or loved names yet."
				{rowClass}
			>
				{#snippet toolbarEnd()}
					<ButtonGroup>
						<Button
							variant={statusFilter === 'unrated' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show names I haven't rated yet"
							aria-pressed={statusFilter === 'unrated'}
							onclick={() => setStatusFilter('unrated')}
						>
							<CircleDashedIcon />
						</Button>
						<Button
							variant={statusFilter === 'matched' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show names every member liked or loved"
							aria-pressed={statusFilter === 'matched'}
							onclick={() => setStatusFilter('matched')}
						>
							<CheckCheckIcon />
						</Button>
						<Button
							variant={statusFilter === 'all' ? 'default' : 'outline'}
							size="icon-sm"
							aria-label="Show all liked and loved names"
							aria-pressed={statusFilter === 'all'}
							onclick={() => setStatusFilter('all')}
						>
							<ListIcon />
						</Button>
					</ButtonGroup>
				{/snippet}

				{#snippet rowDetails(row: LikedNameRow)}
					<NameDetailsDialog
						{projectId}
						nameId={row.id}
						name={row.name}
						rankAllTime={row.rankAllTime}
						amountAllTime={row.amountAllTime}
						rankRecent={row.rankRecent}
						amountRecent={row.amountRecent}
						onRated={() => getLikedNames(projectId).refresh()}
					/>
				{/snippet}
			</DataTable>
		{/key}

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>
</div>
