<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { SvelteSet } from 'svelte/reactivity';
	import { getProjectNamesPage, rateName } from './project.remote.js';
	import NameDetailsDialog from './name-details-dialog.svelte';
	import RatingCell from './rating-cell.svelte';
	import DataTableColumnHeader from '#lib/components/data-table/data-table-column-header.svelte';
	import { formatNumber } from '#lib/components/data-table/number-cell.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ButtonGroup } from '#lib/components/ui/button-group/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { cn } from '#lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import XIcon from '@lucide/svelte/icons/x';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import ListIcon from '@lucide/svelte/icons/list';

	let { projectId }: { projectId: string } = $props();

	type Rating = 'dislike' | 'like' | 'love';
	type RatingFilter = 'all' | 'liked-loved' | 'unrated' | 'disliked';
	type MatchMode = 'contains' | 'startsWith' | 'endsWith';

	const MATCH_MODE_LABELS: Record<MatchMode, string> = {
		contains: 'Contains',
		startsWith: 'Starts with',
		endsWith: 'Ends with'
	};

	const PAGE_SIZE = 100;

	const ratingFilter = $derived(
		(page.url.searchParams.get('rating') as RatingFilter | null) ?? 'unrated'
	);

	function setRatingFilter(value: RatingFilter) {
		const url = new URL(page.url.href);
		url.searchParams.set('rating', value);
		goto(url, { replace: true, reset: false });
	}

	let searchText = $state('');
	let debouncedSearchText = $state('');
	let matchMode = $state<MatchMode>('contains');
	let sortBy = $state<'name' | 'amountAllTime'>('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let pageIndex = $state(0);
	const selectedIds = new SvelteSet<string>();

	$effect(() => {
		const value = searchText;
		const timeout = setTimeout(() => {
			debouncedSearchText = value;
		}, 200);
		return () => clearTimeout(timeout);
	});

	// New search/filter/sort criteria invalidate the current page and selection.
	$effect(() => {
		void ratingFilter;
		void debouncedSearchText;
		void matchMode;
		void sortBy;
		void sortDirection;
		pageIndex = 0;
		selectedIds.clear();
	});

	function toggleSort(column: 'name' | 'amountAllTime') {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'asc';
		}
	}

	const queryArgs = $derived({
		projectId,
		ratingFilter,
		search: debouncedSearchText ? { mode: matchMode, text: debouncedSearchText } : null,
		sortBy,
		sortDirection,
		pageIndex,
		pageSize: PAGE_SIZE
	});

	// Isolated async layer: only re-awaits when the query args actually change
	// or getProjectNamesPage is explicitly refreshed.
	const currentPage = $derived(await getProjectNamesPage(queryArgs));

	// Optimistic overrides layered on top of the current page's rows — plain
	// sync computation, no `await` here, so rating something can't end up
	// waiting on any network activity.
	let pendingRatings = $state<Record<string, Rating>>({});

	function clearPending(...nameIds: string[]) {
		if (nameIds.every((id) => !(id in pendingRatings))) return;
		const next = { ...pendingRatings };
		for (const id of nameIds) delete next[id];
		pendingRatings = next;
	}

	const rows = $derived(
		currentPage.rows.map((row) =>
			row.id in pendingRatings ? { ...row, rating: pendingRatings[row.id] } : row
		)
	);

	async function rateOptimistically(nameId: string, rating: Rating) {
		pendingRatings = { ...pendingRatings, [nameId]: rating };
		try {
			await rateName({ namingProjectId: projectId, nameId, rating });
		} catch {
			clearPending(nameId);
			return;
		}
		// Reconcile with the server in the background — don't block on it.
		getProjectNamesPage(queryArgs)
			.refresh()
			.then(() => clearPending(nameId));
	}

	async function bulkDislike() {
		const ids = [...selectedIds];
		pendingRatings = {
			...pendingRatings,
			...Object.fromEntries(ids.map((id) => [id, 'dislike' as const]))
		};
		selectedIds.clear();
		await Promise.all(
			ids.map((id) => rateName({ namingProjectId: projectId, nameId: id, rating: 'dislike' }))
		);
		getProjectNamesPage(queryArgs)
			.refresh()
			.then(() => clearPending(...ids));
	}

	function toggleRow(id: string, checked: boolean) {
		if (checked) selectedIds.add(id);
		else selectedIds.delete(id);
	}

	function toggleAll(checked: boolean) {
		selectedIds.clear();
		if (checked) for (const r of rows) selectedIds.add(r.id);
	}

	let detailRow = $state<(typeof rows)[number] | null>(null);

	function openRowDetails(event: MouseEvent, row: (typeof rows)[number]) {
		if ((event.target as HTMLElement).closest('button, a, input, [role="checkbox"]')) return;
		detailRow = row;
	}

	const pageCount = $derived(Math.max(Math.ceil(currentPage.rowCount / PAGE_SIZE), 1));

	let scrollViewport: HTMLElement | null = $state(null);

	$effect(() => {
		void pageIndex;
		scrollViewport?.scrollTo({ top: 0 });
	});
</script>

<div class="flex max-h-full min-h-0 w-full flex-col">
	<div class="flex shrink-0 flex-col gap-2 pb-4">
		<div class="flex flex-row items-center justify-between gap-2">
			<InputGroup.Root class="h-8 max-w-sm flex-1">
				<InputGroup.Input placeholder="Search..." bind:value={searchText} />
				<InputGroup.Addon align="inline-end">
					{#if searchText}
						<InputGroup.Button
							size="icon-xs"
							aria-label="Clear filter"
							onclick={() => (searchText = '')}
						>
							<XIcon />
						</InputGroup.Button>
					{/if}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<InputGroup.Button {...props} size="xs" class="text-xs">
									{MATCH_MODE_LABELS[matchMode]}
									<ChevronDownIcon />
								</InputGroup.Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.RadioGroup bind:value={matchMode}>
								<DropdownMenu.RadioItem value="contains">Contains</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="startsWith">Starts with</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="endsWith">Ends with</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</InputGroup.Addon>
			</InputGroup.Root>

			<ButtonGroup>
				<Button
					variant={ratingFilter === 'unrated' ? 'default' : 'outline'}
					size="icon-sm"
					aria-label="Show names not rated by me"
					aria-pressed={ratingFilter === 'unrated'}
					onclick={() => setRatingFilter('unrated')}
				>
					<CircleDashedIcon />
				</Button>
				<Button
					variant={ratingFilter === 'liked-loved' ? 'default' : 'outline'}
					size="icon-sm"
					aria-label="Show liked and loved names"
					aria-pressed={ratingFilter === 'liked-loved'}
					onclick={() => setRatingFilter('liked-loved')}
				>
					<HeartIcon />
				</Button>
				<Button
					variant={ratingFilter === 'all' ? 'default' : 'outline'}
					size="icon-sm"
					aria-label="Show all names"
					aria-pressed={ratingFilter === 'all'}
					onclick={() => setRatingFilter('all')}
				>
					<ListIcon />
				</Button>
				<Button
					variant={ratingFilter === 'disliked' ? 'default' : 'outline'}
					size="icon-sm"
					aria-label="Show disliked names"
					aria-pressed={ratingFilter === 'disliked'}
					onclick={() => setRatingFilter('disliked')}
				>
					<XIcon />
				</Button>
			</ButtonGroup>
		</div>

		{#if selectedIds.size > 0}
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">{selectedIds.size} selected</span>
				<Button variant="ghost" size="sm" onclick={() => selectedIds.clear()}>Clear</Button>
				<Button variant="destructive" size="sm" onclick={bulkDislike}>
					<XIcon />
					Dislike selected
				</Button>
			</div>
		{/if}
	</div>

	{#snippet colgroup()}
		<colgroup>
			<col style="width: 32px" />
			<col style="width: 150px" />
			<col style="width: 100px" />
			<col style="width: 100px" />
		</colgroup>
	{/snippet}

	<svelte:boundary>
		<div class="flex min-h-0 flex-col rounded-md border">
			<Table.Root containerClass="shrink-0" class="table-fixed">
				{@render colgroup()}
				<Table.Header>
					<Table.Row>
						<Table.Head>
							<Checkbox
								checked={rows.length > 0 && selectedIds.size === rows.length}
								indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
								onCheckedChange={(checked) => toggleAll(!!checked)}
								aria-label="Select all"
							/>
						</Table.Head>
						<Table.Head>
							<DataTableColumnHeader
								label="Name"
								sorted={sortBy === 'name' ? sortDirection : false}
								onclick={() => toggleSort('name')}
							/>
						</Table.Head>
						<Table.Head>
							<DataTableColumnHeader
								label="Amount"
								sorted={sortBy === 'amountAllTime' ? sortDirection : false}
								onclick={() => toggleSort('amountAllTime')}
							/>
						</Table.Head>
						<Table.Head>Your rating</Table.Head>
					</Table.Row>
				</Table.Header>
			</Table.Root>

			<ScrollArea class="min-h-0" bind:viewportRef={scrollViewport}>
				<Table.Root containerClass="" class="table-fixed">
					{@render colgroup()}
					<Table.Body>
						{#each rows as row (row.id)}
							<Table.Row
								class={cn('cursor-pointer')}
								onclick={(event) => openRowDetails(event, row)}
							>
								<Table.Cell>
									<Checkbox
										checked={selectedIds.has(row.id)}
										onCheckedChange={(checked) => toggleRow(row.id, !!checked)}
										aria-label="Select row"
									/>
								</Table.Cell>
								<Table.Cell>{row.name}</Table.Cell>
								<Table.Cell class="text-end tabular-nums">
									{formatNumber(row.amountAllTime)}
								</Table.Cell>
								<Table.Cell>
									<RatingCell id={row.id} rating={row.rating} onRate={rateOptimistically} />
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={4} class="h-24 text-center">No names found.</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</ScrollArea>
		</div>

		<div class="flex shrink-0 items-center justify-between gap-4 pt-4">
			<div class="text-sm text-muted-foreground">
				Page {pageIndex + 1} of {pageCount} · {formatNumber(currentPage.rowCount)} results
			</div>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => (pageIndex = Math.max(pageIndex - 1, 0))}
					disabled={pageIndex === 0}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => (pageIndex = pageIndex + 1)}
					disabled={pageIndex + 1 >= pageCount}
				>
					Next
				</Button>
			</div>
		</div>

		{#snippet pending()}
			<p class="text-muted-foreground">Loading…</p>
		{/snippet}
	</svelte:boundary>

	<Dialog.Root
		open={detailRow !== null}
		onOpenChange={(open) => {
			if (!open) detailRow = null;
		}}
	>
		<Dialog.Content>
			{#if detailRow}
				<NameDetailsDialog
					{projectId}
					nameId={detailRow.id}
					name={detailRow.name}
					rankAllTime={detailRow.rankAllTime}
					amountAllTime={detailRow.amountAllTime}
					rankRecent={detailRow.rankRecent}
					amountRecent={detailRow.amountRecent}
					onRated={() => getProjectNamesPage(queryArgs).refresh()}
				/>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
</div>
