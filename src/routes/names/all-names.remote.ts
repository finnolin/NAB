import { query, getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { firstName, nameRating } from '#lib/server/db/schema.js';
import { and, asc, eq } from 'drizzle-orm';

export const getAllNames = query(async () => {
	const { locals } = getRequestEvent();
	// A userId that can never match a real row, so logged-out visitors get `rating: null` for every name.
	const userId = locals.user?.id ?? '';

	return db
		.select({
			id: firstName.id,
			name: firstName.name,
			rankAllTime: firstName.rankAllTime,
			amountAllTime: firstName.amountAllTime,
			rankRecent: firstName.rankRecent,
			amountRecent: firstName.amountRecent,
			rating: nameRating.rating
		})
		.from(firstName)
		.leftJoin(
			nameRating,
			and(eq(nameRating.firstNameId, firstName.id), eq(nameRating.userId, userId))
		)
		.orderBy(asc(firstName.name));
});
