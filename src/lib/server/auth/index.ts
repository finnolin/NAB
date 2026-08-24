import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema';
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite", // or "mysql", "sqlite"
      schema: schema
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [ sveltekitCookies(getRequestEvent)],
    secret: process.env.BETTER_AUTH_SECRET,
    baseUrl: process.env.BETTER_AUTH_URL
});
