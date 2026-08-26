import { createColumnHelper, renderComponent } from '@tanstack/svelte-table';
import type { DataTableFeatures } from '#lib/components/data-table/data-table-features.js';
import { numberCell } from '#lib/components/data-table/number-cell.js';
import DataTableColumnHeader from '#lib/components/data-table/data-table-column-header.svelte';
import RatingCell from './rating-cell.svelte';

export type NameRow = {
	id: string;
	name: string;
	rankAllTime: number | null;
	amountAllTime: number;
	rankRecent: number | null;
	amountRecent: number;
	rating: 'dislike' | 'like' | 'love' | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, NameRow>();

export function createColumns(onRate: (id: string, rating: 'dislike' | 'like' | 'love') => void) {
	return columnHelper.columns([
		columnHelper.accessor('name', {
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					label: 'Name',
					sorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			sortFn: 'alphanumeric',
			size: 150
		}),
		// columnHelper.accessor('rankAllTime', {
		// 	header: ({ column }) =>
		// 		renderComponent(DataTableColumnHeader, {
		// 			label: 'Rank',
		// 			sorted: column.getIsSorted(),
		// 			onclick: column.getToggleSortingHandler()
		// 		}),
		// 	cell: ({ row }) => numberCell(() => row.original.rankAllTime),
		// 	sortFn: 'basic'
		// }),
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
		// columnHelper.accessor('rankRecent', {
		// 	header: ({ column }) =>
		// 		renderComponent(DataTableColumnHeader, {
		// 			label: 'Rank (2025)',
		// 			sorted: column.getIsSorted(),
		// 			onclick: column.getToggleSortingHandler()
		// 		}),
		// 	cell: ({ row }) => numberCell(() => row.original.rankRecent),
		// 	sortFn: 'basic'
		// }),
		// columnHelper.accessor('amountRecent', {
		// 	header: ({ column }) =>
		// 		renderComponent(DataTableColumnHeader, {
		// 			label: 'Amount (2025)',
		// 			sorted: column.getIsSorted(),
		// 			onclick: column.getToggleSortingHandler()
		// 		}),
		// 	cell: ({ row }) => numberCell(() => row.original.amountRecent),
		// 	sortFn: 'basic'
		// }),
		columnHelper.accessor('rating', {
			header: 'Your rating',
			enableSorting: false,
			cell: ({ row }) =>
				renderComponent(RatingCell, { id: row.original.id, rating: row.original.rating, onRate }),
			size: 100
		})
	]);
}
