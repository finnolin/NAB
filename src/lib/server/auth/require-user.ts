import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export function requireUser() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'You must be signed in.');
	return locals.user;
}
