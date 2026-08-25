<script lang="ts">
	import { page } from '$app/state';
	import { removeName, getCollectionNames } from './collection-names.remote.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import XIcon from '@lucide/svelte/icons/x';

	let { id, name }: { id: string; name: string } = $props();

	const projectId = $derived(page.params.id!);
	const collectionId = $derived(page.params.collectionId!);

	async function handleRemove() {
		await removeName({ projectId, collectionId, nameId: id });
		await getCollectionNames({ projectId, collectionId }).refresh();
	}
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-sm" aria-label="Remove {name}">
				<XIcon />
			</Button>
		{/snippet}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Remove "{name}"?</AlertDialog.Title>
			<AlertDialog.Description>
				This removes the name from the collection and deletes any ratings anyone has made on it in
				every project. This can't be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={handleRemove}>Remove</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
