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
import { and, asc, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';

const RATINGS = ['dislike', 'like', 'love'] as const;
type Rating = (typeof RATINGS)[number];

const AFFIX_TYPES = ['prefix', 'suffix'] as const;
type AffixType = (typeof AFFIX_TYPES)[number];

const RATING_FILTERS = ['all', 'liked-loved', 'unrated', 'disliked'] as const;
type RatingFilter = (typeof RATING_FILTERS)[number];

const MATCH_MODES = ['contains', 'startsWith', 'endsWith'] as const;
type MatchMode = (typeof MATCH_MODES)[number];

export const getNamingProject = query('unchecked', async (id: string) => {
	const user = requireUser();
	return requireProjectAccess(user, id);
});

// Escape LIKE's own wildcard characters so a literal %/_ typed by the user
// doesn't act as one, then wrap per match mode.
function likePattern(text: string, mode: MatchMode) {
	const escaped = text.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`);
	if (mode === 'startsWith') return `${escaped}%`;
	if (mode === 'endsWith') return `%${escaped}`;
	return `%${escaped}%`;
}

export const getProjectNamesPage = query(
	'unchecked',
	async (input: {
		projectId: string;
		ratingFilter: RatingFilter;
		search: { mode: MatchMode; text: string } | null;
		sortBy: 'name' | 'amountAllTime';
		sortDirection: 'asc' | 'desc';
		pageIndex: number;
		pageSize: number;
	}) => {
		const user = requireUser();

		if (!RATING_FILTERS.includes(input.ratingFilter)) error(400, 'Invalid rating filter.');
		if (input.search && !MATCH_MODES.includes(input.search.mode))
			error(400, 'Invalid search match mode.');

		await requireProjectAccess(user, input.projectId);

		const conditions: SQL[] = [eq(namingProjectCollection.namingProjectId, input.projectId)];

		if (input.ratingFilter === 'unrated') conditions.push(isNull(nameRating.rating));
		else if (input.ratingFilter === 'liked-loved')
			conditions.push(inArray(nameRating.rating, ['like', 'love']));
		else if (input.ratingFilter === 'disliked') conditions.push(eq(nameRating.rating, 'dislike'));

		if (input.search?.text) {
			conditions.push(
				sql`lower(${names.name}) LIKE ${likePattern(input.search.text, input.search.mode)} ESCAPE '\\'`
			);
		}

		const where = and(...conditions);
		const orderColumn = input.sortBy === 'amountAllTime' ? names.amountAllTime : names.name;
		const orderFn = input.sortDirection === 'desc' ? desc : asc;

		const [rows, [{ count }]] = await Promise.all([
			db
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
						eq(nameRating.namingProjectId, input.projectId),
						eq(nameRating.userId, user.id)
					)
				)
				.where(where)
				.orderBy(orderFn(orderColumn), asc(names.id))
				.limit(input.pageSize)
				.offset(input.pageIndex * input.pageSize),
			db
				.select({ count: sql<number>`count(*)` })
				.from(names)
				.innerJoin(
					namingProjectCollection,
					eq(namingProjectCollection.collectionId, names.collectionId)
				)
				.leftJoin(
					nameRating,
					and(
						eq(nameRating.nameId, names.id),
						eq(nameRating.namingProjectId, input.projectId),
						eq(nameRating.userId, user.id)
					)
				)
				.where(where)
		]);

		return { rows, rowCount: count };
	}
);

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
			ratings: allRatings,
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
