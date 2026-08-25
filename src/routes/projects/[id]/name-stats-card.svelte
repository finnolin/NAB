<script lang="ts">
	import { formatNumber } from '#lib/components/data-table/number-cell.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Card from '#lib/components/ui/card/index.js';

	let {
		name,
		rankAllTime,
		amountAllTime,
		rankRecent,
		amountRecent
	}: {
		name: string;
		rankAllTime: number | null;
		amountAllTime: number;
		rankRecent: number | null;
		amountRecent: number;
	} = $props();
</script>

<Dialog.Header>
	<Dialog.Title class="text-2xl">{name}</Dialog.Title>
	<Dialog.Description>Rank and birth counts</Dialog.Description>
</Dialog.Header>
<Card.Root>
	<Card.Content class="grid grid-cols-2 gap-4">
		<div>
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">All-time rank</p>
			<p class="text-2xl font-semibold tabular-nums">
				{rankAllTime ? `#${formatNumber(rankAllTime)}` : '—'}
			</p>
		</div>
		<div>
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				All-time births
			</p>
			<p class="text-2xl font-semibold tabular-nums">{formatNumber(amountAllTime)}</p>
		</div>
		<div>
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">2025 rank</p>
			<p class="text-2xl font-semibold tabular-nums">
				{rankRecent ? `#${formatNumber(rankRecent)}` : '—'}
			</p>
		</div>
		<div>
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">2025 births</p>
			<p class="text-2xl font-semibold tabular-nums">{formatNumber(amountRecent)}</p>
		</div>
	</Card.Content>
</Card.Root>
