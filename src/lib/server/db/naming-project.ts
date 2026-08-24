import { error } from '@sveltejs/kit';
import { db } from './index.js';
import {
	nameCollection,
	namingProject,
	namingProjectCollection,
	namingProjectUser
} from './schema.js';
import { and, asc, eq, or } from 'drizzle-orm';

// Strict: only the project's owner passes. Used for owner-level management
// (collections, membership).
export async function requireProjectOwner(user: { id: string }, projectId: string) {
	const [project] = await db
		.select({ id: namingProject.id, label: namingProject.label, ownerId: namingProject.userId })
		.from(namingProject)
		.where(and(eq(namingProject.id, projectId), eq(namingProject.userId, user.id)));
	if (!project) error(404, 'Project not found.');
	return project;
}

// The owner or anyone added via naming_project_user. Used for viewing/rating.
export async function requireProjectAccess(user: { id: string }, projectId: string) {
	const [project] = await db
		.select({ id: namingProject.id, label: namingProject.label, ownerId: namingProject.userId })
		.from(namingProject)
		.leftJoin(
			namingProjectUser,
			and(
				eq(namingProjectUser.namingProjectId, namingProject.id),
				eq(namingProjectUser.userId, user.id)
			)
		)
		.where(
			and(
				eq(namingProject.id, projectId),
				or(eq(namingProject.userId, user.id), eq(namingProjectUser.userId, user.id))
			)
		);
	if (!project) error(404, 'Project not found.');
	return project;
}

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
