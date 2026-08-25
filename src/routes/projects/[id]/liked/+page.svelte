<script lang="ts">
	import { page } from '$app/state';
	import { getLikedNames, type LikedNameRow } from './liked-names.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { columns } from './columns.js';
	import NameDetailsDialog from '../name-details-dialog.svelte';

	const projectId = $derived(page.params.id!);

	function rowClass(row: LikedNameRow) {
		return row.myRating ? 'bg-muted' : undefined;
	}
</script>

<div class="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-4 p-4">
	<svelte:boundary>
		{#key projectId}
			<DataTable
				data={await getLikedNames(projectId)}
				{columns}
				filterColumnId="name"
				filterPlaceholder="Search..."
				pageSize={100}
				emptyMessage="No liked or loved names yet."
				{rowClass}
			>
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
