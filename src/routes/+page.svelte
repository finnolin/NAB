<script lang="ts">
	import { authClient } from '#lib/local/auth-client.js';
	import { getUserProjects } from './projects.remote.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';

	const session = authClient.useSession();
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6 p-4">
	{#if $session.data}
		<svelte:boundary>
			{@const projects = await getUserProjects()}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each projects as project (project.id)}
					<a href="/projects/{project.id}">
						<Card.Root class="transition-shadow hover:shadow-lg">
							<Card.Header class="flex items-center justify-between">
								<Card.Title>{project.label}</Card.Title>
								{#if !project.isOwner}
									<Badge variant="secondary">Shared</Badge>
								{/if}
							</Card.Header>
						</Card.Root>
					</a>
				{/each}
			</div>

			{#snippet pending()}
				<p class="text-muted-foreground">Loading…</p>
			{/snippet}
		</svelte:boundary>
	{:else}
		<p class="text-muted-foreground">Sign in to see your naming projects.</p>
	{/if}
</div>
