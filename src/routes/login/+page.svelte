<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/local/auth-client.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		loading = true;

		const { error: signInError } = await authClient.signIn.email({ email, password });

		loading = false;

		if (signInError) {
			error = signInError.message ?? 'Failed to sign in.';
			return;
		}

		await goto('/');
	}
</script>

<div class="flex min-h-svh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>Sign in</Card.Title>
			<Card.Description>Enter your email and password to access your account.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form class="flex flex-col gap-4" onsubmit={handleSubmit}>
				{#if error}
					<Alert.Root variant="destructive">
						<Alert.Description>{error}</Alert.Description>
					</Alert.Root>
				{/if}
				<div class="flex flex-col gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" autocomplete="email" bind:value={email} required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						autocomplete="current-password"
						bind:value={password}
						required
					/>
				</div>
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Signing in…' : 'Sign in'}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center text-sm text-muted-foreground">
			Don't have an account?
			<a href="/register" class="ml-1 font-medium text-primary underline-offset-4 hover:underline">
				Sign up
			</a>
		</Card.Footer>
	</Card.Root>
</div>
