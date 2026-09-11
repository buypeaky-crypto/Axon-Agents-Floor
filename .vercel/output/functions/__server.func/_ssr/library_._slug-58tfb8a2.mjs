import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getMyRelation } from "./market-YtcRXDJh.mjs";
import { n as Route$2 } from "./router-CYQmk1Am.mjs";
import { n as SiteShell, p as useCurrentUserState, r as Skeleton, t as RedirectToSignIn, u as isUnauthorized } from "./site-shell-Eanh1iuW.mjs";
import { t as ChatConsole } from "./chat-console-Dn6q7ARV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library_._slug-58tfb8a2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RunPage() {
	const { agent } = Route$2.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [allowed, setAllowed] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setAllowed(false);
			return;
		}
		let cancelled = false;
		getMyRelation({ data: agent.id }).then((r) => {
			if (!cancelled) setAllowed(r.purchased || r.isSeller);
		}).catch((err) => {
			if (cancelled) return;
			if (isUnauthorized(err)) setAllowed(false);
			else setAllowed(false);
		});
		return () => {
			cancelled = true;
		};
	}, [
		user,
		isPending,
		agent.id
	]);
	if (isPending || allowed === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-3xl px-4 py-14",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[28rem] rounded-2xl" })
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!allowed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Not in your library"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: [
					"Acquire ",
					agent.name,
					" from the floor to run it here."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/agents/$slug",
				params: { slug: agent.slug },
				className: "mt-6 inline-flex h-11 items-center text-sm underline-offset-4 hover:underline",
				children: "Open listing"
			})
		]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-3xl px-4 py-10 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
				children: "Library run"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl font-medium tracking-tight",
				children: agent.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 mb-8 text-sm text-muted-foreground",
				children: agent.tagline
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatConsole, {
				agent,
				purchased: true
			})
		]
	}) });
}
//#endregion
export { RunPage as component };
