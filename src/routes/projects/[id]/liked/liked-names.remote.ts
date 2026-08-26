import { query } from '$app/server';
import { db } from '#lib/server/db/index.js';
import {
	names,
	nameRating,
	namingProjectCollection,
	namingProjectUser,
	user as userTable
} from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { requireProjectAccess } from '#lib/server/db/naming-project.js';
import { and, asc, eq, inArray } from 'drizzle-orm';

export type LikedNameRow = {
	id: string;
	name: string;
	rankAllTime: number | null;
	amountAllTime: number;
	rankRecent: number | null;
	amountRecent: number;
	ratings: { userId: string; userName: string; rating: 'dislike' | 'like' | 'love' }[];
	myRating: 'dislike' | 'like' | 'love' | null;
	// Every member of the project (owner included) rated this name like/love.
	matched: boolean;
};

export const getLikedNames = query('unchecked', async (id: string): Promise<LikedNameRow[]> => {
	const requester = requireUser();
	await requireProjectAccess(requester, id);

	// Owner plus everyone added via naming_project_user (requireProjectAccess's
	// own definition of project membership).
	const extraMembers = await db
		.select({ userId: namingProjectUser.userId })
		.from(namingProjectUser)
		.where(eq(namingProjectUser.namingProjectId, id));
	const memberCount = extraMembers.length + 1;

	// Names in this project's collections that at least one member liked/loved.
	const qualifying = await db
		.selectDistinct({ nameId: names.id })
		.from(names)
		.innerJoin(
			namingProjectCollection,
			and(
				eq(namingProjectCollection.collectionId, names.collectionId),
				eq(namingProjectCollection.namingProjectId, id)
			)
		)
		.innerJoin(
			nameRating,
			and(
				eq(nameRating.nameId, names.id),
				eq(nameRating.namingProjectId, id),
				inArray(nameRating.rating, ['like', 'love'])
			)
		);
	if (qualifying.length === 0) return [];
	const qualifyingIds = qualifying.map((q) => q.nameId);

	// Every rating (dislikes included) for those names, so the column shows the full picture.
	const rows = await db
		.select({
			nameId: names.id,
			name: names.name,
			rankAllTime: names.rankAllTime,
			amountAllTime: names.amountAllTime,
			rankRecent: names.rankRecent,
			amountRecent: names.amountRecent,
			userId: userTable.id,
			userName: userTable.name,
			rating: nameRating.rating
		})
		.from(names)
		.innerJoin(nameRating, and(eq(nameRating.nameId, names.id), eq(nameRating.namingProjectId, id)))
		.innerJoin(userTable, eq(userTable.id, nameRating.userId))
		.where(inArray(names.id, qualifyingIds))
		.orderBy(asc(names.name));

	const byName = new Map<string, LikedNameRow>();
	for (const row of rows) {
		let entry = byName.get(row.nameId);
		if (!entry) {
			entry = {
				id: row.nameId,
				name: row.name,
				rankAllTime: row.rankAllTime,
				amountAllTime: row.amountAllTime,
				rankRecent: row.rankRecent,
				amountRecent: row.amountRecent,
				ratings: [],
				myRating: null,
				matched: false
			};
			byName.set(row.nameId, entry);
		}
		entry.ratings.push({
			userId: row.userId,
			userName: row.userName,
			rating: row.rating
		});
		if (row.userId === requester.id) entry.myRating = row.rating;
	}

	const entries = [...byName.values()];
	for (const entry of entries) {
		entry.matched =
			entry.ratings.length === memberCount && entry.ratings.every((r) => r.rating !== 'dislike');
	}

	return entries;
});
