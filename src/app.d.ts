// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { auth } from '#lib/server/auth/index.ts';
declare global {
  namespace App {
    interface Locals {
			session: typeof auth.$Infer.Session.session | null;
			user: typeof auth.$Infer.Session.user | null;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
