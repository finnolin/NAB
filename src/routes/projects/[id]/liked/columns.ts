import { createColumnHelper, renderComponent } from '@tanstack/svelte-table';
import type { DataTableFeatures } from '#lib/components/data-table/data-table-features.js';
import { numberCell } from '#lib/components/data-table/number-cell.js';
import DataTableColumnHeader from '#lib/components/data-table/data-table-column-header.svelte';
import RaterBadges from '../rater-badges.svelte';
import type { LikedNameRow } from './liked-names.remote.js';

const columnHelper = createColumnHelper<DataTableFeatures, LikedNameRow>();

export const columns = columnHelper.columns([
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
	columnHelper.accessor('ratings', {
		header: 'Ratings',
		enableSorting: false,
		cell: ({ row }) => renderComponent(RaterBadges, { ratings: row.original.ratings })
	})
]);
