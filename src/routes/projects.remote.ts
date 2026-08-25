import { query } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { namingProject, namingProjectUser } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { and, asc, eq, or } from 'drizzle-orm';

export const getUserProjects = query(async () => {
	const user = requireUser();

	const projects = await db
		.select({ id: namingProject.id, label: namingProject.label, ownerId: namingProject.userId })
		.from(namingProject)
		.leftJoin(
			namingProjectUser,
			and(
				eq(namingProjectUser.namingProjectId, namingProject.id),
				eq(namingProjectUser.userId, user.id)
			)
		)
		.where(or(eq(namingProject.userId, user.id), eq(namingProjectUser.userId, user.id)))
		.orderBy(asc(namingProject.createdAt));

	return projects.map((p) => ({ ...p, isOwner: p.ownerId === user.id }));
});
