import { command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { nameRating } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';

const RATINGS = ['dislike', 'like', 'love'] as const;
type Rating = (typeof RATINGS)[number];

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
