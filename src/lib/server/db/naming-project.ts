import { db } from './index.js';
import { nameCollection, namingProject, namingProjectCollection } from './schema.js';
import { asc, eq } from 'drizzle-orm';

// Every user gets one auto-provisioned default naming project until real
// project creation/selection UI exists. Linked to every collection that
// exists at the time it's created, so it behaves like "see everything".
export async function getOrCreateDefaultNamingProject(userId: string) {
	const [existing] = await db
		.select({ id: namingProject.id })
		.from(namingProject)
		.where(eq(namingProject.userId, userId))
		.orderBy(asc(namingProject.createdAt))
		.limit(1);
	if (existing) return existing;

	const [created] = await db
		.insert(namingProject)
		.values({ userId, label: 'My Names' })
		.returning({ id: namingProject.id });

	const collections = await db.select({ id: nameCollection.id }).from(nameCollection);
	if (collections.length > 0) {
		await db
			.insert(namingProjectCollection)
			.values(collections.map((c) => ({ namingProjectId: created.id, collectionId: c.id })));
	}

	return created;
}
