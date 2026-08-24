import { createColumnHelper, renderComponent, renderSnippet } from '@tanstack/svelte-table';
import { createRawSnippet } from 'svelte';
import type { DataTableFeatures } from '#lib/components/data-table/data-table-features.js';
import { numberCell } from '#lib/components/data-table/number-cell.js';
import { badgeVariants } from '#lib/components/ui/badge/index.js';
import DataTableColumnHeader from '#lib/components/data-table/data-table-column-header.svelte';

export type RatedName = {
	id: string;
	name: string;
	rating: 'dislike' | 'like' | 'love';
	rankAllTime: number | null;
	amountAllTime: number;
	rankRecent: number | null;
	amountRecent: number;
};

const columnHelper = createColumnHelper<DataTableFeatures, RatedName>();

export const columns = columnHelper.columns([
	columnHelper.accessor('name', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Name',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		sortFn: 'alphanumeric'
	}),
	columnHelper.accessor('rating', {
		header: 'Rating',
		enableSorting: false,
		cell: ({ row }) => {
			const snippet = createRawSnippet<[{ rating: 'dislike' | 'like' | 'love' }]>((getData) => {
				const { rating } = getData();
				const cls = badgeVariants({ variant: rating === 'love' ? 'default' : 'secondary' });
				return { render: () => `<span class="${cls} capitalize">${rating}</span>` };
			});
			return renderSnippet(snippet, { rating: row.original.rating });
		}
	}),
	columnHelper.accessor('rankAllTime', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Rank (all-time)',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => numberCell(() => row.original.rankAllTime),
		sortFn: 'basic'
	}),
	columnHelper.accessor('amountAllTime', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Amount (all-time)',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => numberCell(() => row.original.amountAllTime),
		sortFn: 'basic'
	}),
	columnHelper.accessor('rankRecent', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Rank (2025)',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => numberCell(() => row.original.rankRecent),
		sortFn: 'basic'
	}),
	columnHelper.accessor('amountRecent', {
		header: ({ column }) =>
			renderComponent(DataTableColumnHeader, {
				label: 'Amount (2025)',
				sorted: column.getIsSorted(),
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => numberCell(() => row.original.amountRecent),
		sortFn: 'basic'
	})
]);
