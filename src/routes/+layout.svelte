<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { authClient } from '#lib/local/auth-client.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import HeartIcon from '@lucide/svelte/icons/heart';

	let { children } = $props();

	const session = authClient.useSession();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen flex-col">
	<header class="shrink-0 border-b">
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
			<nav class="flex items-center gap-4">
				<a href="/" class="font-semibold">Bebika</a>
				<a href="/names" class="text-sm text-muted-foreground hover:text-foreground">All Names</a>
			</nav>
			{#if $session.data}
				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">{$session.data.user.name}</span>
					<Button
						variant="outline"
						size="icon"
						href="/names?rating=liked-loved"
						aria-label="My ratings"
					>
						<HeartIcon />
					</Button>
					<Button variant="outline" onclick={() => authClient.signOut()}>Sign Out</Button>
				</div>
			{:else}
				<Button href="/login">Login</Button>
			{/if}
		</div>
	</header>

	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
