<script lang="ts">
	import { page } from '$app/state';
	import ProjectNamesTable from './project-names-table.svelte';

	const projectId = $derived(page.params.id!);
</script>

<div class="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-4 p-4">
	{#key projectId}
		<ProjectNamesTable {projectId} />
	{/key}
</div>
