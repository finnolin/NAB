import { query } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { names, nameRating } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { and, desc, eq, inArray } from 'drizzle-orm';

export const getRatedNames = query(async () => {
	const user = requireUser();

	return db
		.select({
			id: names.id,
			name: names.name,
			rating: nameRating.rating,
			rankAllTime: names.rankAllTime,
			amountAllTime: names.amountAllTime,
			rankRecent: names.rankRecent,
			amountRecent: names.amountRecent
		})
		.from(nameRating)
		.innerJoin(names, eq(nameRating.nameId, names.id))
		.where(and(eq(nameRating.userId, user.id), inArray(nameRating.rating, ['like', 'love'])))
		.orderBy(desc(nameRating.updatedAt));
});
