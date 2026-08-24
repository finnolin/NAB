import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import {
	names,
	nameRating,
	namingProject,
	namingProjectCollection
} from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { and, asc, eq } from 'drizzle-orm';

const RATINGS = ['dislike', 'like', 'love'] as const;
type Rating = (typeof RATINGS)[number];

async function requireOwnedProject(user: { id: string }, projectId: string) {
	const [project] = await db
		.select({ id: namingProject.id, label: namingProject.label })
		.from(namingProject)
		.where(and(eq(namingProject.id, projectId), eq(namingProject.userId, user.id)));
	if (!project) error(404, 'Project not found.');
	return project;
}

export const getNamingProject = query('unchecked', async (id: string) => {
	const user = requireUser();
	return requireOwnedProject(user, id);
});

export const getProjectNames = query('unchecked', async (id: string) => {
	const user = requireUser();
	await requireOwnedProject(user, id);

	return db
		.select({
			id: names.id,
			name: names.name,
			rankAllTime: names.rankAllTime,
			amountAllTime: names.amountAllTime,
			rankRecent: names.rankRecent,
			amountRecent: names.amountRecent,
			rating: nameRating.rating
		})
		.from(names)
		.innerJoin(
			namingProjectCollection,
			eq(namingProjectCollection.collectionId, names.collectionId)
		)
		.leftJoin(nameRating, and(eq(nameRating.nameId, names.id), eq(nameRating.namingProjectId, id)))
		.where(eq(namingProjectCollection.namingProjectId, id))
		.orderBy(asc(names.name));
});

export const rateName = command(
	'unchecked',
	async (input: { namingProjectId: string; nameId: string; rating: Rating }) => {
		const user = requireUser();

		if (!RATINGS.includes(input.rating)) error(400, 'Invalid rating.');
		if (!input.nameId) error(400, 'Missing name id.');

		await requireOwnedProject(user, input.namingProjectId);

		await db
			.insert(nameRating)
			.values({
				userId: user.id,
				namingProjectId: input.namingProjectId,
				nameId: input.nameId,
				rating: input.rating
			})
			.onConflictDoUpdate({
				target: [nameRating.namingProjectId, nameRating.nameId],
				set: { rating: input.rating }
			});
	}
);
