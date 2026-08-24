import { query } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { namingProject } from '#lib/server/db/schema.js';
import { requireUser } from '#lib/server/auth/require-user.js';
import { getOrCreateDefaultNamingProject } from '#lib/server/db/naming-project.js';
import { asc, eq } from 'drizzle-orm';

export const getUserProjects = query(async () => {
	const user = requireUser();
	await getOrCreateDefaultNamingProject(user.id);

	return db
		.select({ id: namingProject.id, label: namingProject.label })
		.from(namingProject)
		.where(eq(namingProject.userId, user.id))
		.orderBy(asc(namingProject.createdAt));
});
