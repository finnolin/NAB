<script lang="ts">
	import { page } from '$app/state';
	import { getCollection, getCollectionNames, addName } from './collection-names.remote.js';
	import DataTable from '#lib/components/data-table/data-table.svelte';
	import { columns } from './columns.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';

	const projectId = $derived(page.params.id!);
	const collectionId = $derived(page.params.collectionId!);

	let newName = $state('');
	let addNameError = $state<string | null>(null);

	async function handleAddName(event: SubmitEvent) {
		event.preventDefault();
		if (!newName.trim()) return;
		addNameError = null;
		try {
			await addName({ projectId, collectionId, name: newName });
			newName = '';
			await getCollectionNames({ projectId, collectionId }).refresh();
		} catch (err) {
			addNameError = err instanceof Error ? err.message : 'Failed to add name.';
		}
	}
</script>

<div class="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-4 p-4">
	<svelte:boundary>
		{@const collection = await getCollection({ projectId, collectionId })}
		<div>
			<h1 class="text-xl font-semibold">{collection.label}</h1>
			<p class="text-sm text-muted-foreground">Add or remove names in this collection.</p>
		</div>

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>

	<form class="flex items-center gap-2" onsubmit={handleAddName}>
		<Input placeholder="Add a name…" bind:value={newName} class="h-8 max-w-sm" />
		<Button type="submit" size="sm">Add</Button>
	</form>
	{#if addNameError}
		<Alert.Root variant="destructive">
			<Alert.Description>{addNameError}</Alert.Description>
		</Alert.Root>
	{/if}

	<svelte:boundary>
		{#key collectionId}
			<DataTable
				data={await getCollectionNames({ projectId, collectionId })}
				{columns}
				filterColumnId="name"
				filterPlaceholder="Search..."
				pageSize={100}
				emptyMessage="No names in this collection yet."
			/>
		{/key}

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>

	<a href="/projects/{projectId}/settings" class="text-sm text-muted-foreground hover:underline">
		← Back to settings
	</a>
</div>
