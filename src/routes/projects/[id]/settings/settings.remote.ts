import { query, command } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { nameCollection, namingProjectCollection } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { requireOwnedProject } from '#lib/server/db/naming-project.js';
import { and, asc, eq } from 'drizzle-orm';

export const getProjectCollections = query('unchecked', async (projectId: string) => {
	const user = requireUser();
	await requireOwnedProject(user, projectId);

	const collections = await db
		.select({ id: nameCollection.id, label: nameCollection.label })
		.from(nameCollection)
		.orderBy(asc(nameCollection.label));

	const linked = await db
		.select({ collectionId: namingProjectCollection.collectionId })
		.from(namingProjectCollection)
		.where(eq(namingProjectCollection.namingProjectId, projectId));
	const linkedIds = new Set(linked.map((l) => l.collectionId));

	return collections.map((c) => ({ ...c, linked: linkedIds.has(c.id) }));
});

export const addCollection = command(
	'unchecked',
	async (input: { projectId: string; collectionId: string }) => {
		const user = requireUser();
		await requireOwnedProject(user, input.projectId);

		await db
			.insert(namingProjectCollection)
			.values({ namingProjectId: input.projectId, collectionId: input.collectionId })
			.onConflictDoNothing();
	}
);

export const removeCollection = command(
	'unchecked',
	async (input: { projectId: string; collectionId: string }) => {
		const user = requireUser();
		await requireOwnedProject(user, input.projectId);

		await db
			.delete(namingProjectCollection)
			.where(
				and(
					eq(namingProjectCollection.namingProjectId, input.projectId),
					eq(namingProjectCollection.collectionId, input.collectionId)
				)
			);
	}
);
