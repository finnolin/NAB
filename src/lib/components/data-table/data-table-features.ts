import {
	columnFilteringFeature,
	columnSizingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFn_includesString,
	sortFn_alphanumeric,
	sortFn_basic,
	tableFeatures
} from '@tanstack/svelte-table';

export const features = tableFeatures({
	columnFilteringFeature,
	columnSizingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	filteredRowModel: createFilteredRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	sortedRowModel: createSortedRowModel(),
	filterFns: { includesString: filterFn_includesString },
	sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic }
});

export type DataTableFeatures = typeof features;
