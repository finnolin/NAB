import { query } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { firstName, nameRating } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { and, desc, eq, inArray } from 'drizzle-orm';

export const getRatedNames = query(async () => {
	const user = requireUser();

	return db
		.select({
			id: firstName.id,
			name: firstName.name,
			rating: nameRating.rating,
			rankAllTime: firstName.rankAllTime,
			amountAllTime: firstName.amountAllTime,
			rankRecent: firstName.rankRecent,
			amountRecent: firstName.amountRecent
		})
		.from(nameRating)
		.innerJoin(firstName, eq(nameRating.firstNameId, firstName.id))
		.where(and(eq(nameRating.userId, user.id), inArray(nameRating.rating, ['like', 'love'])))
		.orderBy(desc(nameRating.updatedAt));
});
