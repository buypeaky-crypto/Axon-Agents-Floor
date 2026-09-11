import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as formatCount, o as formatCredits } from "./categories-DC-a2B4Z.mjs";
import { d as listMyListings, f as setListingLive } from "./market-YtcRXDJh.mjs";
import { t as formatFeePercent } from "./fee-BMu_kIqU.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Button } from "./axon-mark-C4BCwm3a.mjs";
import { n as SiteShell, p as useCurrentUserState, r as Skeleton, t as RedirectToSignIn, u as isUnauthorized } from "./site-shell-Eanh1iuW.mjs";
import { t as Badge } from "./badge-BIY0cFYH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-m2pHGUzM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StudioPage() {
	const { user, isPending } = useCurrentUserState();
	const [data, setData] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		let cancelled = false;
		listMyListings().then((rows) => {
			if (!cancelled) setData(rows);
		}).catch((err) => {
			if (!cancelled && !isUnauthorized(err)) toast.error("Could not load the studio.");
		});
		return () => {
			cancelled = true;
		};
	}, [user, isPending]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-6xl px-4 py-14",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-40" })
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	async function toggle(agent) {
		try {
			await setListingLive({ data: {
				agentId: agent.id,
				listed: !agent.listed
			} });
			setData((prev) => prev ? {
				...prev,
				agents: prev.agents.map((a) => a.id === agent.id ? {
					...a,
					listed: !a.listed
				} : a)
			} : prev);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update listing.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-12 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
						children: "Seller desk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl font-medium tracking-tight",
						children: "Studio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: [
							"List trained agents. Axon takes ",
							formatFeePercent(),
							" off every sale — you keep the rest."
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/studio/new",
						children: "New listing"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Gross",
						value: formatCredits(data?.grossCents ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "You keep",
						value: formatCredits(data?.netCents ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: `Axon take (${formatFeePercent()})`,
						value: formatCredits(data?.takeCents ?? 0)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 space-y-3",
				children: [data && data.agents.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No listings yet. Put a trained agent on the floor."
					})
				}), data?.agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-medium",
								children: agent.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: agent.listed ? "solid" : "outline",
								children: agent.listed ? "Live" : "Hidden"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: agent.tagline
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-xs tabular-nums text-subtle",
							children: [
								formatCredits(agent.priceCents),
								" · ",
								formatCount(agent.salesCount),
								" sales"
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							variant: "secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/agents/$slug",
								params: { slug: agent.slug },
								children: "View"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => void toggle(agent),
							children: agent.listed ? "Unlist" : "List"
						})]
					})]
				}, agent.id))]
			})
		]
	}) });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-wide text-subtle uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-mono text-2xl tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { StudioPage as component };
