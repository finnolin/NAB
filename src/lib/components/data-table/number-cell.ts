import { renderSnippet } from '@tanstack/svelte-table';
import { createRawSnippet } from 'svelte';

const numberFormat = new Intl.NumberFormat('de-AT');

export function formatNumber(value: number | null) {
	return value === null ? '—' : numberFormat.format(value);
}

export function numberCell(getValue: () => number | null) {
	const snippet = createRawSnippet<[{ value: number | null }]>((getData) => {
		const { value } = getData();
		return { render: () => `<div class="text-end tabular-nums">${formatNumber(value)}</div>` };
	});
	return renderSnippet(snippet, { value: getValue() });
}
