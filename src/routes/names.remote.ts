import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { firstName, nameRating } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { eq, notInArray, sql } from 'drizzle-orm';

const RATINGS = ['dislike', 'like', 'love'] as const;
type Rating = (typeof RATINGS)[number];

export const getNamesToRate = query(async () => {
	const user = requireUser();

	const ratedIds = db
		.select({ id: nameRating.firstNameId })
		.from(nameRating)
		.where(eq(nameRating.userId, user.id));

	return db
		.select({ id: firstName.id, name: firstName.name })
		.from(firstName)
		.where(notInArray(firstName.id, ratedIds))
		.orderBy(sql`random()`)
		.limit(1);
});

export const rateName = command(
	'unchecked',
	async (input: { firstNameId: string; rating: Rating }) => {
		const user = requireUser();

		if (!RATINGS.includes(input.rating)) error(400, 'Invalid rating.');
		if (!input.firstNameId) error(400, 'Missing name id.');

		await db
			.insert(nameRating)
			.values({ userId: user.id, firstNameId: input.firstNameId, rating: input.rating })
			.onConflictDoUpdate({
				target: [nameRating.userId, nameRating.firstNameId],
				set: { rating: input.rating }
			});
	}
);
