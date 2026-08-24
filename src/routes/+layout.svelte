<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { authClient } from '#lib/local/auth-client.js';
	import { getNamingProject } from './projects/[id]/project.remote.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SettingsIcon from '@lucide/svelte/icons/settings-2';

	let { children } = $props();

	const session = authClient.useSession();
	const projectId = $derived(page.params.id);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen flex-col">
	<header class="shrink-0 border-b">
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
			<nav class="flex items-center gap-4">
				{#if projectId}
					<svelte:boundary>
						{@const project = await getNamingProject(projectId)}
						<a href="/" class="font-semibold">NAB: {project.label}</a>
						<Button href="/projects/{projectId}/settings" variant="ghost" size="icon-sm">
							<SettingsIcon />
							<span class="sr-only">Project settings</span>
						</Button>

						{#snippet pending()}
							<a href="/" class="font-semibold">NAB</a>
						{/snippet}
					</svelte:boundary>
				{:else}
					<a href="/" class="font-semibold">NAB</a>
				{/if}
			</nav>
			{#if $session.data}
				{@const userName = $session.data.user.name}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>
								{userName}
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={() => authClient.signOut()}>
							<LogOutIcon />
							Sign Out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<Button href="/login">Login</Button>
			{/if}
		</div>
	</header>

	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
