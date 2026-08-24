import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import {
	nameCollection,
	namingProjectCollection,
	namingProjectUser,
	user
} from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { requireProjectAccess, requireProjectOwner } from '#lib/server/db/naming-project.js';
import { and, asc, eq } from 'drizzle-orm';

export const getProjectCollections = query('unchecked', async (projectId: string) => {
	const requester = requireUser();
	const project = await requireProjectAccess(requester, projectId);

	const collections = await db
		.select({ id: nameCollection.id, label: nameCollection.label })
		.from(nameCollection)
		.orderBy(asc(nameCollection.label));

	const linked = await db
		.select({ collectionId: namingProjectCollection.collectionId })
		.from(namingProjectCollection)
		.where(eq(namingProjectCollection.namingProjectId, projectId));
	const linkedIds = new Set(linked.map((l) => l.collectionId));

	return {
		isOwner: project.ownerId === requester.id,
		collections: collections.map((c) => ({ ...c, linked: linkedIds.has(c.id) }))
	};
});

export const addCollection = command(
	'unchecked',
	async (input: { projectId: string; collectionId: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);

		await db
			.insert(namingProjectCollection)
			.values({ namingProjectId: input.projectId, collectionId: input.collectionId })
			.onConflictDoNothing();
	}
);

export const removeCollection = command(
	'unchecked',
	async (input: { projectId: string; collectionId: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);

		await db
			.delete(namingProjectCollection)
			.where(
				and(
					eq(namingProjectCollection.namingProjectId, input.projectId),
					eq(namingProjectCollection.collectionId, input.collectionId)
				)
			);
	}
);

export const getProjectMembers = query('unchecked', async (projectId: string) => {
	const requester = requireUser();
	const project = await requireProjectAccess(requester, projectId);

	const [owner] = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(eq(user.id, project.ownerId));

	const members = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(namingProjectUser)
		.innerJoin(user, eq(user.id, namingProjectUser.userId))
		.where(eq(namingProjectUser.namingProjectId, projectId))
		.orderBy(asc(user.name));

	return { isOwner: project.ownerId === requester.id, owner, members };
});

export const addProjectMember = command(
	'unchecked',
	async (input: { projectId: string; email: string }) => {
		const requester = requireUser();
		const project = await requireProjectOwner(requester, input.projectId);

		const [invitee] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, input.email.trim().toLowerCase()));
		if (!invitee) error(404, 'No user found with that email.');
		if (invitee.id === project.ownerId) error(400, 'That user already owns this project.');

		await db
			.insert(namingProjectUser)
			.values({ namingProjectId: input.projectId, userId: invitee.id })
			.onConflictDoNothing();
	}
);

export const removeProjectMember = command(
	'unchecked',
	async (input: { projectId: string; userId: string }) => {
		const requester = requireUser();
		await requireProjectOwner(requester, input.projectId);

		await db
			.delete(namingProjectUser)
			.where(
				and(
					eq(namingProjectUser.namingProjectId, input.projectId),
					eq(namingProjectUser.userId, input.userId)
				)
			);
	}
);
