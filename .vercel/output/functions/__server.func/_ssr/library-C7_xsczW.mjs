import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { u as listLibrary } from "./market-YtcRXDJh.mjs";
import { n as Button } from "./axon-mark-C4BCwm3a.mjs";
import { n as SiteShell, p as useCurrentUserState, r as Skeleton, t as RedirectToSignIn, u as isUnauthorized } from "./site-shell-Eanh1iuW.mjs";
import { t as AgentCard } from "./agent-card-Bti84QhU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-C7_xsczW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LibraryPage() {
	const { user, isPending } = useCurrentUserState();
	const [agents, setAgents] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) return;
		let cancelled = false;
		listLibrary().then((rows) => {
			if (!cancelled) setAgents(rows);
		}).catch((err) => {
			if (cancelled) return;
			if (isUnauthorized(err)) return;
			setError(err instanceof Error ? err.message : "Could not load the library.");
		});
		return () => {
			cancelled = true;
		};
	}, [user, isPending]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-14 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-48" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 rounded-2xl" })]
		})]
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-12 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
				children: "Your seats"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl font-medium tracking-tight",
				children: "Library"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-lg text-sm text-muted-foreground",
				children: "Agents you have acquired. Open one to run it with the full dossier in context."
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-destructive",
				children: error
			}),
			agents && agents.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-12 max-w-md rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Empty. Acquire a specialist from the floor."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "Browse the market"
					})
				})]
			}),
			agents && agents.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentCard, { agent }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "secondary",
						size: "sm",
						className: "self-start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/library/$slug",
							params: { slug: agent.slug },
							children: "Run"
						})
					})]
				}, agent.id))
			})
		]
	}) });
}
//#endregion
export { LibraryPage as component };
