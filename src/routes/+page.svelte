<script lang="ts">
	import { authClient } from '#lib/local/auth-client.js';
	import { getNamesToRate, rateName } from './names.remote.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardFooter, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';

	const session = authClient.useSession();

	async function rate(firstNameId: string, rating: 'dislike' | 'like' | 'love') {
		await rateName({ firstNameId, rating });
		await getNamesToRate().refresh();
	}
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
	<h1 class="text-2xl font-semibold">Welcome to SvelteKit</h1>
	<p>
		Visit <a class="underline" href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the
		documentation
	</p>

	{#if $session.data}
		<svelte:boundary>
			<div class="grid gap-4 sm:grid-cols-3">
				{#each await getNamesToRate() as name (name.id)}
					<Card>
						<CardHeader>
							<CardTitle>{name.name}</CardTitle>
						</CardHeader>
						<CardFooter class="flex gap-2">
							<Button variant="outline" onclick={() => rate(name.id, 'dislike')}>Dislike</Button>
							<Button variant="secondary" onclick={() => rate(name.id, 'like')}>Like</Button>
							<Button onclick={() => rate(name.id, 'love')}>Love</Button>
						</CardFooter>
					</Card>
				{:else}
					<p class="text-muted-foreground">You've rated every name!</p>
				{/each}
			</div>

			{#snippet pending()}
				<p class="text-muted-foreground">Loading names…</p>
			{/snippet}
		</svelte:boundary>
	{/if}
</div>
