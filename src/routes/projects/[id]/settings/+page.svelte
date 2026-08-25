<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		getProjectCollections,
		addCollection,
		removeCollection,
		getProjectMembers,
		addProjectMember,
		removeProjectMember,
		deleteProject
	} from './settings.remote.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import XIcon from '@lucide/svelte/icons/x';

	const projectId = $derived(page.params.id!);

	async function toggle(collectionId: string, next: boolean) {
		if (next) {
			await addCollection({ projectId, collectionId });
		} else {
			await removeCollection({ projectId, collectionId });
		}
		await getProjectCollections(projectId).refresh();
	}

	let email = $state('');
	let addMemberError = $state<string | null>(null);
	let addingMember = $state(false);

	async function handleAddMember(event: SubmitEvent) {
		event.preventDefault();
		addMemberError = null;
		addingMember = true;
		try {
			await addProjectMember({ projectId, email });
			email = '';
			await getProjectMembers(projectId).refresh();
		} catch (err) {
			addMemberError = err instanceof Error ? err.message : 'Failed to add member.';
		} finally {
			addingMember = false;
		}
	}

	async function handleRemoveMember(userId: string) {
		await removeProjectMember({ projectId, userId });
		await getProjectMembers(projectId).refresh();
	}

	async function handleDeleteProject() {
		await deleteProject(projectId);
		await goto('/');
	}
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-8 p-4">
	<div>
		<h1 class="text-xl font-semibold">Project settings</h1>
	</div>

	<div class="flex flex-col gap-2">
		<h2 class="text-sm font-medium">Collections</h2>
		<p class="text-sm text-muted-foreground">
			Choose which name collections this project pulls names from.
		</p>
		<svelte:boundary>
			{@const { isOwner, collections } = await getProjectCollections(projectId)}
			<Card.Root>
				<Card.Content class="flex flex-col gap-4">
					{#each collections as collection (collection.id)}
						<Label class="flex items-center gap-3 font-normal">
							<Checkbox
								checked={collection.linked}
								disabled={!isOwner}
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
	</div>

	<div class="flex flex-col gap-2">
		<h2 class="text-sm font-medium">Members</h2>
		<p class="text-sm text-muted-foreground">
			Add other users by email so they can view and rate names in this project.
		</p>
		<svelte:boundary>
			{@const { isOwner, owner, members } = await getProjectMembers(projectId)}
			<Card.Root>
				<Card.Content class="flex flex-col gap-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium">{owner.name}</p>
							<p class="text-sm text-muted-foreground">{owner.email}</p>
						</div>
						<span class="text-xs text-muted-foreground">Owner</span>
					</div>
					{#each members as member (member.id)}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium">{member.name}</p>
								<p class="text-sm text-muted-foreground">{member.email}</p>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Remove member"
								disabled={!isOwner}
								onclick={() => handleRemoveMember(member.id)}
							>
								<XIcon />
							</Button>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>

			<form class="flex items-center gap-2" onsubmit={handleAddMember}>
				<Input
					type="email"
					placeholder="person@example.com"
					bind:value={email}
					required
					disabled={!isOwner}
					class="max-w-sm"
				/>
				<Button type="submit" disabled={!isOwner || addingMember}>Add</Button>
			</form>
			{#if addMemberError}
				<Alert.Root variant="destructive">
					<Alert.Description>{addMemberError}</Alert.Description>
				</Alert.Root>
			{/if}

			{#snippet pending()}
				<p class="text-muted-foreground">Loading…</p>
			{/snippet}
		</svelte:boundary>
	</div>

	<div class="flex flex-col gap-2">
		<h2 class="text-sm font-medium text-destructive">Danger zone</h2>
		<p class="text-sm text-muted-foreground">
			Permanently delete this project, its collection links, memberships, and every rating made in
			it. This can't be undone.
		</p>
		<svelte:boundary>
			{@const { isOwner } = await getProjectMembers(projectId)}
			<AlertDialog.Root>
				<AlertDialog.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="destructive" disabled={!isOwner} class="w-fit">
							Delete project
						</Button>
					{/snippet}
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Delete this project?</AlertDialog.Title>
						<AlertDialog.Description>
							This permanently deletes the project and every rating made in it, for every member.
							This can't be undone.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action variant="destructive" onclick={handleDeleteProject}>
							Delete project
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>

			{#snippet pending()}
				<p class="text-muted-foreground">Loading…</p>
			{/snippet}
		</svelte:boundary>
	</div>

	<a href="/projects/{projectId}" class="text-sm text-muted-foreground hover:underline">
		← Back to names
	</a>
</div>
