import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { names, nameCollection } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { requireProjectOwner } from '#lib/server/db/naming-project.js';
import { and, asc, eq } from 'drizzle-orm';

async function requireCollection(collectionId: string) {
	const [collection] = await db
		.select({ id: nameCollection.id, label: nameCollection.label })
		.from(nameCollection)
		.where(eq(nameCollection.id, collectionId));
	if (!collection) error(404, 'Collection not found.');
	return collection;
}

export const getCollection = query(
	'unchecked',
	async (input: { projectId: string; collectionId: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);
		return requireCollection(input.collectionId);
	}
);

export const getCollectionNames = query(
	'unchecked',
	async (input: { projectId: string; collectionId: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);
		await requireCollection(input.collectionId);

		return db
			.select({
				id: names.id,
				name: names.name,
				rankAllTime: names.rankAllTime,
				amountAllTime: names.amountAllTime,
				rankRecent: names.rankRecent,
				amountRecent: names.amountRecent
			})
			.from(names)
			.where(eq(names.collectionId, input.collectionId))
			.orderBy(asc(names.name));
	}
);

export const addName = command(
	'unchecked',
	async (input: { projectId: string; collectionId: string; name: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);
		await requireCollection(input.collectionId);

		const name = input.name.trim();
		if (!name) error(400, 'Name cannot be empty.');

		const [existing] = await db
			.select({ id: names.id })
			.from(names)
			.where(and(eq(names.collectionId, input.collectionId), eq(names.name, name)));
		if (existing) error(400, 'That name already exists in this collection.');

		await db.insert(names).values({ collectionId: input.collectionId, name });
	}
);

export const removeName = command(
	'unchecked',
	async (input: { projectId: string; collectionId: string; nameId: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);
		await requireCollection(input.collectionId);

		// Cascades to name_rating — removes anyone's ratings on this name too.
		await db
			.delete(names)
			.where(and(eq(names.id, input.nameId), eq(names.collectionId, input.collectionId)));
	}
);
