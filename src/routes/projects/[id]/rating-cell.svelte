<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import { rateName, getProjectNames } from './project.remote.js';
	import XIcon from '@lucide/svelte/icons/x';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import HeartIcon from '@lucide/svelte/icons/heart';

	let { id, rating }: { id: string; rating: 'dislike' | 'like' | 'love' | null } = $props();

	async function rate(next: 'dislike' | 'like' | 'love') {
		await rateName({ namingProjectId: page.params.id!, nameId: id, rating: next });
		await getProjectNames(page.params.id!).refresh();
	}
</script>

<div class="flex items-center justify-end">
	<ButtonGroup>
		<Button
			variant={rating === 'dislike' ? 'destructive' : 'outline'}
			size="icon-sm"
			aria-label="Dislike"
			aria-pressed={rating === 'dislike'}
			onclick={() => rate('dislike')}
		>
			<XIcon />
		</Button>
		<Button
			variant={rating === 'like' ? 'default' : 'outline'}
			size="icon-sm"
			aria-label="Like"
			aria-pressed={rating === 'like'}
			onclick={() => rate('like')}
		>
			<ThumbsUpIcon />
		</Button>
		<Button
			variant={rating === 'love' ? 'default' : 'outline'}
			size="icon-sm"
			aria-label="Love"
			aria-pressed={rating === 'love'}
			onclick={() => rate('love')}
		>
			<HeartIcon />
		</Button>
	</ButtonGroup>
</div>
