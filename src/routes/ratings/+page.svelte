<script lang="ts">
	import { authClient } from '#lib/local/auth-client.js';
	import { getRatedNames } from './ratings.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { columns } from './columns.js';

	const session = authClient.useSession();
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<h1 class="text-2xl font-semibold">Liked & loved names</h1>

	{#if $session.data}
		<svelte:boundary>
			<DataTable
				data={await getRatedNames()}
				{columns}
				filterColumnId="name"
				filterPlaceholder="Filter by name…"
				emptyMessage="No rated names yet."
			/>

			{#snippet pending()}
				<p class="text-muted-foreground">Loading…</p>
			{/snippet}
		</svelte:boundary>
	{:else}
		<p class="text-muted-foreground">Sign in to see your ratings.</p>
	{/if}
</div>
