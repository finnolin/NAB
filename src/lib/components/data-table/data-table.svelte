<script lang="ts" generics="TData extends RowData & { id: string }">
	import type { Snippet } from 'svelte';
	import {
		type ColumnDef,
		type RowData,
		createTable,
		renderComponent,
		FlexRender
	} from '@tanstack/svelte-table';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { features, type DataTableFeatures } from './data-table-features.js';

	type BulkActionProps = { selectedIds: string[]; clearSelection: () => void };
	type MatchMode = 'contains' | 'startsWith' | 'endsWith';

	const MATCH_MODE_LABELS: Record<MatchMode, string> = {
		contains: 'Contains',
		startsWith: 'Starts with',
		endsWith: 'Ends with'
	};

	type DataTableProps<TData extends RowData & { id: string }> = {
		columns: ColumnDef<DataTableFeatures, TData>[];
		data: TData[];
		filterColumnId: string;
		filterPlaceholder?: string;
		pageSize?: number;
		emptyMessage?: string;
		toolbarEnd?: Snippet;
		selectable?: boolean;
		bulkActions?: Snippet<[BulkActionProps]>;
		rowDetails?: Snippet<[TData]>;
	};

	let {
		data,
		columns,
		filterColumnId,
		filterPlaceholder = 'Filter…',
		pageSize = 100,
		emptyMessage = 'No results.',
		toolbarEnd,
		selectable = false,
		bulkActions,
		rowDetails
	}: DataTableProps<TData> = $props();

	let detailRow: TData | null = $state(null);

	function openRowDetails(event: MouseEvent, row: TData) {
		if (!rowDetails) return;
		if ((event.target as HTMLElement).closest('button, a, input, [role="checkbox"]')) return;
		detailRow = row;
	}

	let matchMode = $state('contains');
	let filterText = $state('');

	function textMatchFilterFn(
		row: { getValue: (columnId: string) => unknown },
		columnId: string,
		filterValue: { mode: MatchMode; text: string }
	) {
		const { mode, text } = filterValue;
		if (!text) return true;
		const value = String(row.getValue(columnId) ?? '').toLowerCase();
		const needle = text.toLowerCase();
		if (mode === 'startsWith') return value.startsWith(needle);
		if (mode === 'endsWith') return value.endsWith(needle);
		return value.includes(needle);
	}
	textMatchFilterFn.autoRemove = (value: { text?: string } | undefined) => !value?.text;

	const selectColumn: ColumnDef<DataTableFeatures, TData> = {
		id: 'select',
		header: ({ table }) =>
			renderComponent(Checkbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
				'aria-label': 'Select all'
			}),
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		size: 32
	};

	const effectiveColumns = $derived.by(() => {
		const withSelect = selectable ? [selectColumn, ...columns] : columns;
		return withSelect.map((col) =>
			'accessorKey' in col && col.accessorKey === filterColumnId
				? { ...col, filterFn: textMatchFilterFn }
				: col
		);
	});

	const table = createTable({
		features,
		get data() {
			return data;
		},
		get columns() {
			return effectiveColumns;
		},
		getRowId: (row: TData) => row.id,
		autoResetPageIndex: false,
		initialState: {
			pagination: { pageIndex: 0, pageSize }
		}
	});

	$effect(() => {
		table
			.getColumn(filterColumnId)
			?.setFilterValue(filterText ? { mode: matchMode as MatchMode, text: filterText } : undefined);
		table.setPageIndex(0);
	});

	const pagination = $derived(table.atoms.pagination.get());
	const rowSelection = $derived(table.atoms.rowSelection.get());
	const selectedIds = $derived(
		Object.entries(rowSelection ?? {})
			.filter(([, selected]) => selected)
			.map(([id]) => id)
	);

	function clearSelection() {
		table.resetRowSelection();
	}
</script>

{#snippet colgroup()}
	<colgroup>
		{#each table.getFlatHeaders() as header (header.id)}
			<col style="width: {header.getSize()}px" />
		{/each}
	</colgroup>
{/snippet}

<div class="flex max-h-full min-h-0 w-full flex-col">
	<div class="flex shrink-0 flex-col gap-2 pb-4">
		<div class="flex flex-row items-center gap-2">
			<InputGroup.Root class="h-8 max-w-sm">
				<InputGroup.Input placeholder={filterPlaceholder} bind:value={filterText} />
				<InputGroup.Addon align="inline-end">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<InputGroup.Button {...props} size="xs" class="text-xs">
									{MATCH_MODE_LABELS[matchMode as MatchMode]}
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

			{#if toolbarEnd}
				{@render toolbarEnd()}
			{/if}
		</div>

		{#if selectable && selectedIds.length > 0}
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">{selectedIds.length} selected</span>
				<Button variant="ghost" size="sm" onclick={clearSelection}>Clear</Button>
				{#if bulkActions}
					{@render bulkActions({ selectedIds, clearSelection })}
				{/if}
			</div>
		{/if}
	</div>

	<div class="flex min-h-0 flex-col rounded-md border">
		<Table.Root containerClass="shrink-0" class="table-fixed">
			{@render colgroup()}
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head>
								{#if !header.isPlaceholder}
									<FlexRender {header} />
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
		</Table.Root>

		<ScrollArea class="min-h-0">
			<Table.Root containerClass="" class="table-fixed">
				{@render colgroup()}
				<Table.Body>
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row
							data-state={row.getIsSelected() && 'selected'}
							class={rowDetails ? 'cursor-pointer' : undefined}
							onclick={(event) => openRowDetails(event, row.original)}
						>
							{#each row.getAllCells() as cell (cell.id)}
								<Table.Cell>
									<FlexRender {cell} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={effectiveColumns.length} class="h-24 text-center">
								{emptyMessage}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</ScrollArea>
	</div>

	<div class="flex shrink-0 items-center justify-between gap-4 pt-4">
		<div class="text-sm text-muted-foreground">
			Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)} · {table.getRowCount()}
			results
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</Button>
		</div>
	</div>

	{#if rowDetails}
		<Dialog.Root
			open={detailRow !== null}
			onOpenChange={(open) => {
				if (!open) detailRow = null;
			}}
		>
			<Dialog.Content>
				{#if detailRow}
					{@render rowDetails(detailRow)}
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
