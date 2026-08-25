<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { authClient } from '#lib/local/auth-client.js';
	import { getNamingProject } from './projects/[id]/project.remote.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SettingsIcon from '@lucide/svelte/icons/settings-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ListIcon from '@lucide/svelte/icons/list';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	let { children } = $props();

	const session = authClient.useSession();
	const projectId = $derived(page.params.id);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<div class="flex h-dvh flex-col">
	<header class="shrink-0 border-b">
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
			<nav class="flex items-center gap-4">
				{#if projectId}
					<svelte:boundary>
						{@const project = await getNamingProject(projectId)}
						<a href="/" class="font-semibold">NAB: {project.label}</a>

						{#snippet pending()}
							<a href="/" class="font-semibold">NAB</a>
						{/snippet}
					</svelte:boundary>
				{:else}
					<a href="/" class="font-semibold">NAB</a>
				{/if}
			</nav>
			<div class="flex items-center gap-2">
				{#if projectId}
					<Button href="/projects/{projectId}" variant="ghost" size="icon-sm">
						<ListIcon />
						<span class="sr-only">All names</span>
					</Button>
					<Button href="/projects/{projectId}/liked" variant="ghost" size="icon-sm">
						<UsersIcon />
						<span class="sr-only">Liked &amp; loved names</span>
					</Button>
					<Button href="/projects/{projectId}/settings" variant="ghost" size="icon-sm">
						<SettingsIcon />
						<span class="sr-only">Project settings</span>
					</Button>
				{/if}
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
							<DropdownMenu.Item onclick={toggleMode}>
								<SunIcon class="dark:hidden" />
								<MoonIcon class="hidden dark:block" />
								Toggle theme
							</DropdownMenu.Item>
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
		</div>
	</header>

	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
