import { auth } from '#lib/server/auth/index.js';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/env';
import { redirect } from '@sveltejs/kit';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth'];

export async function handle({ event, resolve }) {
	// Fetch current session from Better Auth
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// Make session and user available on server
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const isPublicPath = PUBLIC_PATHS.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith(path + '/')
	);
	// sec-fetch-dest: document only shows up on real page navigations, not on
	// remote-function fetches — those stay 401s handled by requireUser().
	const isPageNavigation =
		event.request.method === 'GET' && event.request.headers.get('sec-fetch-dest') === 'document';

	if (!session && !isPublicPath && isPageNavigation) {
		redirect(303, '/login');
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
