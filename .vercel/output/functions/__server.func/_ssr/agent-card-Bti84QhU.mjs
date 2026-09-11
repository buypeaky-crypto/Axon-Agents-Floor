import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as formatCount, i as categoryLabel, o as formatCredits } from "./categories-DC-a2B4Z.mjs";
import { r as cn } from "./axon-mark-C4BCwm3a.mjs";
import { t as AgentSigil } from "./agent-sigil-uI5ei_zP.mjs";
import { t as Stars } from "./stars-Dqv7W006.mjs";
import { t as Badge } from "./badge-BIY0cFYH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agent-card-Bti84QhU.js
var import_jsx_runtime = require_jsx_runtime();
function AgentCard({ agent, featured = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/agents/$slug",
		params: { slug: agent.slug },
		className: cn("group flex flex-col rounded-2xl bg-card p-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[0_0_0_1px_rgb(236_234_228/0.16)]", featured && "p-5 sm:p-6"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentSigil, {
					seed: agent.slug,
					letter: agent.sigil,
					className: featured ? "size-14" : "size-12"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: categoryLabel(agent.category) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: cn("mt-4 font-display font-medium tracking-tight text-foreground group-hover:text-paper", featured ? "text-2xl" : "text-xl"),
				children: agent.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground",
				children: agent.tagline
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex items-end justify-between gap-3 pt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-sm tabular-nums text-foreground",
						children: formatCredits(agent.priceCents)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1.5 text-xs text-subtle",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stars, { value: agent.ratingAvg }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatCount(agent.salesCount)
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs tracking-wide text-muted-foreground",
					children: agent.sellerName
				})]
			})
		]
	});
}
//#endregion
export { AgentCard as t };
