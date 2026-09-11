import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/categories-DC-a2B4Z.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-B40BzJxt.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-C-wnbOTP.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
function formatCredits(cents) {
	const dollars = cents / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: dollars % 1 === 0 ? 0 : 2
	}).format(dollars);
}
function formatCount(n) {
	if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`;
	return String(n);
}
function parseCapabilities(raw) {
	if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
	if (typeof raw === "string") try {
		return parseCapabilities(JSON.parse(raw));
	} catch {
		return raw.split(",").map((s) => s.trim()).filter(Boolean);
	}
	return [];
}
var CATEGORIES = [
	{
		id: "code",
		label: "Code",
		blurb: "Reviewers, testers, and pair programmers."
	},
	{
		id: "research",
		label: "Research",
		blurb: "Literature maps, synthesis, briefings."
	},
	{
		id: "ops",
		label: "Operations",
		blurb: "Incidents, runbooks, release nerves."
	},
	{
		id: "creative",
		label: "Creative",
		blurb: "Voice, narrative, brand systems."
	},
	{
		id: "support",
		label: "Support",
		blurb: "Frontline desks with a trained tone."
	},
	{
		id: "data",
		label: "Data",
		blurb: "Messy tables, quiet conclusions."
	},
	{
		id: "security",
		label: "Security",
		blurb: "Threat models, config, review."
	},
	{
		id: "legal",
		label: "Legal",
		blurb: "Clauses, risk flags, plain language."
	}
];
var CATEGORY_IDS = CATEGORIES.map((c) => c.id);
function categoryLabel(id) {
	return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
//#endregion
export { formatCount as a, categoryLabel as i, CATEGORY_IDS as n, formatCredits as o, authMiddleware as r, parseCapabilities as s, CATEGORIES as t };
