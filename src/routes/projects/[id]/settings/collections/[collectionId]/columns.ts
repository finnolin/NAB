import { createColumnHelper, renderComponent } from '@tanstack/svelte-table';
import type { DataTableFeatures } from '#lib/components/data-table/data-table-features.js';
import { numberCell } from '#lib/components/data-table/number-cell.js';
import DataTableColumnHeader from '#lib/components/data-table/data-table-column-header.svelte';
import RemoveNameCell from './remove-name-cell.svelte';

export type CollectionNameRow = {
	id: string;
	name: string;
	rankAllTime: number | null;
	amountAllTime: number;
	rankRecent: number | null;
	amountRecent: number;
};

const columnHelper = createColumnHelper<DataTableFeatures, CollectionNameRow>();

export const columns = columnHelper.columns([
	columnHelper.accessor('name', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Name',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		sortFn: 'alphanumeric',
		size: 200
	}),
	columnHelper.accessor('amountAllTime', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Amount',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => numberCell(() => row.original.amountAllTime),
		sortFn: 'basic',
		size: 100
	}),
	columnHelper.display({
		id: 'remove',
		cell: ({ row }) =>
			renderComponent(RemoveNameCell, { id: row.original.id, name: row.original.name }),
		size: 60
	})
]);
