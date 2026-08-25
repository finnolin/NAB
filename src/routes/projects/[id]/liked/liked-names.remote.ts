import { query } from '$app/server';
import { db } from '#lib/server/db/index.js';
import {
	names,
	nameRating,
	namingProjectCollection,
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
	ratings: { userId: string; userName: string; rating: 'like' | 'love' }[];
};

export const getLikedNames = query('unchecked', async (id: string): Promise<LikedNameRow[]> => {
	const requester = requireUser();
	await requireProjectAccess(requester, id);

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
		.from(nameRating)
		.innerJoin(names, eq(nameRating.nameId, names.id))
		.innerJoin(
			namingProjectCollection,
			and(
				eq(namingProjectCollection.collectionId, names.collectionId),
				eq(namingProjectCollection.namingProjectId, id)
			)
		)
		.innerJoin(userTable, eq(userTable.id, nameRating.userId))
		.where(and(eq(nameRating.namingProjectId, id), inArray(nameRating.rating, ['like', 'love'])))
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
				ratings: []
			};
			byName.set(row.nameId, entry);
		}
		entry.ratings.push({
			userId: row.userId,
			userName: row.userName,
			rating: row.rating as 'like' | 'love'
		});
	}

	return [...byName.values()];
});
