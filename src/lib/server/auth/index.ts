import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import * as schema from '../db/schema';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { getOrCreateDefaultNamingProject } from '../db/naming-project';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite', // or "mysql", "sqlite"
		schema: schema
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [sveltekitCookies(getRequestEvent)],
	secret: process.env.BETTER_AUTH_SECRET,
	baseUrl: process.env.BETTER_AUTH_URL,
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// One-time onboarding project, not a "keep at least one" guarantee —
					// deleting it later should not resurrect it.
					await getOrCreateDefaultNamingProject(user.id);
				}
			}
		}
	}
});
