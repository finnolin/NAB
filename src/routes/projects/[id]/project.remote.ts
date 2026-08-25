import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import {
	names,
	nameRating,
	namingProjectAffix,
	namingProjectCollection,
	user as userTable
} from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { requireProjectAccess } from '#lib/server/db/naming-project.js';
import { and, asc, eq } from 'drizzle-orm';

const RATINGS = ['dislike', 'like', 'love'] as const;
type Rating = (typeof RATINGS)[number];

const AFFIX_TYPES = ['prefix', 'suffix'] as const;
type AffixType = (typeof AFFIX_TYPES)[number];

export const getNamingProject = query('unchecked', async (id: string) => {
	const user = requireUser();
	return requireProjectAccess(user, id);
});

export const getProjectNames = query('unchecked', async (id: string) => {
	const user = requireUser();
	await requireProjectAccess(user, id);

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
		.leftJoin(
			nameRating,
			and(
				eq(nameRating.nameId, names.id),
				eq(nameRating.namingProjectId, id),
				eq(nameRating.userId, user.id)
			)
		)
		.where(eq(namingProjectCollection.namingProjectId, id))
		.orderBy(asc(names.name));
});

export const getNameRatings = query(
	'unchecked',
	async (input: { projectId: string; nameId: string }) => {
		const requester = requireUser();
		await requireProjectAccess(requester, input.projectId);

		const allRatings = await db
			.select({ userId: userTable.id, userName: userTable.name, rating: nameRating.rating })
			.from(nameRating)
			.innerJoin(userTable, eq(userTable.id, nameRating.userId))
			.where(
				and(eq(nameRating.namingProjectId, input.projectId), eq(nameRating.nameId, input.nameId))
			);

		const mine = allRatings.find((r) => r.userId === requester.id);

		return {
			ratings: allRatings
				.filter((r) => r.rating === 'like' || r.rating === 'love')
				.map((r) => ({
					userId: r.userId,
					userName: r.userName,
					rating: r.rating as 'like' | 'love'
				})),
			myRating: (mine?.rating as Rating | undefined) ?? null
		};
	}
);

export const getProjectAffixes = query('unchecked', async (id: string) => {
	const user = requireUser();
	await requireProjectAccess(user, id);

	return db
		.select({
			id: namingProjectAffix.id,
			type: namingProjectAffix.type,
			value: namingProjectAffix.value
		})
		.from(namingProjectAffix)
		.where(eq(namingProjectAffix.namingProjectId, id))
		.orderBy(asc(namingProjectAffix.createdAt));
});

export const addAffix = command(
	'unchecked',
	async (input: { projectId: string; type: AffixType; value: string }) => {
		const user = requireUser();

		if (!AFFIX_TYPES.includes(input.type)) error(400, 'Invalid affix type.');
		// Leading/trailing spaces are meaningful here (e.g. a suffix like " Smith"),
		// so only check for blank input — don't trim what actually gets stored.
		if (!input.value.trim()) error(400, 'Affix cannot be empty.');

		await requireProjectAccess(user, input.projectId);

		await db
			.insert(namingProjectAffix)
			.values({ namingProjectId: input.projectId, type: input.type, value: input.value });
	}
);

export const removeAffix = command(
	'unchecked',
	async (input: { projectId: string; affixId: string }) => {
		const user = requireUser();
		await requireProjectAccess(user, input.projectId);

		await db
			.delete(namingProjectAffix)
			.where(
				and(
					eq(namingProjectAffix.namingProjectId, input.projectId),
					eq(namingProjectAffix.id, input.affixId)
				)
			);
	}
);

export const rateName = command(
	'unchecked',
	async (input: { namingProjectId: string; nameId: string; rating: Rating }) => {
		const user = requireUser();

		if (!RATINGS.includes(input.rating)) error(400, 'Invalid rating.');
		if (!input.nameId) error(400, 'Missing name id.');

		await requireProjectAccess(user, input.namingProjectId);

		await db
			.insert(nameRating)
			.values({
				userId: user.id,
				namingProjectId: input.namingProjectId,
				nameId: input.nameId,
				rating: input.rating
			})
			.onConflictDoUpdate({
				target: [nameRating.namingProjectId, nameRating.nameId, nameRating.userId],
				set: { rating: input.rating }
			});
	}
);
