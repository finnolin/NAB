<script lang="ts">
	import { page } from '$app/state';
	import { getProjectCollections, addCollection, removeCollection } from './settings.remote.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';

	const projectId = $derived(page.params.id!);

	async function toggle(collectionId: string, next: boolean) {
		if (next) {
			await addCollection({ projectId, collectionId });
		} else {
			await removeCollection({ projectId, collectionId });
		}
		await getProjectCollections(projectId).refresh();
	}
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-6 p-4">
	<div>
		<h1 class="text-xl font-semibold">Project settings</h1>
		<p class="text-sm text-muted-foreground">
			Choose which name collections this project pulls names from.
		</p>
	</div>

	<svelte:boundary>
		{@const collections = await getProjectCollections(projectId)}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				{#each collections as collection (collection.id)}
					<Label class="flex items-center gap-3 font-normal">
						<Checkbox
							checked={collection.linked}
							onCheckedChange={(checked) => toggle(collection.id, !!checked)}
						/>
						{collection.label}
					</Label>
				{:else}
					<p class="text-sm text-muted-foreground">No collections exist yet.</p>
				{/each}
			</Card.Content>
		</Card.Root>

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>

	<a href="/projects/{projectId}" class="text-sm text-muted-foreground hover:underline">
		← Back to names
	</a>
</div>
