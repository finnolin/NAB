<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import XIcon from '@lucide/svelte/icons/x';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import HeartIcon from '@lucide/svelte/icons/heart';

	let {
		id,
		rating,
		onRate
	}: {
		id: string;
		rating: 'dislike' | 'like' | 'love' | null;
		onRate: (id: string, rating: 'dislike' | 'like' | 'love') => void;
	} = $props();
</script>

<div class="flex items-center justify-end">
	<ButtonGroup>
		<Button
			variant={rating === 'dislike' ? 'destructive' : 'outline'}
			size="icon-sm"
			aria-label="Dislike"
			aria-pressed={rating === 'dislike'}
			onclick={() => onRate(id, 'dislike')}
		>
			<XIcon />
		</Button>
		<Button
			variant={rating === 'like' ? 'default' : 'outline'}
			size="icon-sm"
			aria-label="Like"
			aria-pressed={rating === 'like'}
			onclick={() => onRate(id, 'like')}
		>
			<ThumbsUpIcon />
		</Button>
		<Button
			variant={rating === 'love' ? 'default' : 'outline'}
			size="icon-sm"
			aria-label="Love"
			aria-pressed={rating === 'love'}
			onclick={() => onRate(id, 'love')}
		>
			<HeartIcon />
		</Button>
	</ButtonGroup>
</div>
