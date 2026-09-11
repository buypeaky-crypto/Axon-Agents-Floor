import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as CATEGORIES } from "./categories-DC-a2B4Z.mjs";
import { t as formatFeePercent } from "./fee-BMu_kIqU.mjs";
import { o as Search } from "../_libs/lucide-react.mjs";
import { a as Route$8 } from "./router-CYQmk1Am.mjs";
import { r as cn } from "./axon-mark-C4BCwm3a.mjs";
import { n as SiteShell } from "./site-shell-Eanh1iuW.mjs";
import { t as AgentCard } from "./agent-card-Bti84QhU.mjs";
import { t as Input } from "./input-D4aGTNTQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-IaIfkFyg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const agents = Route$8.useLoaderData();
	const search = Route$8.useSearch();
	const navigate = Route$8.useNavigate();
	const [draft, setDraft] = (0, import_react.useState)(search.q ?? "");
	const featured = agents.filter((a) => a.featured).slice(0, 4);
	const rest = search.category || search.q ? agents : agents.filter((a) => !a.featured);
	function setCategory(category) {
		navigate({ search: (prev) => ({
			...prev,
			category
		}) });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative overflow-hidden border-b border-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 opacity-40",
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroNet, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stagger-in max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-3 text-xs tracking-[0.22em] text-muted-foreground uppercase",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Axon market" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px w-8 bg-border" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Vol. 01" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-5 font-display text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-7xl",
						children: ["Trained agents,", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
							className: "italic",
							children: " listed."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-5 max-w-md text-base leading-relaxed text-muted-foreground",
						children: [
							"Specialists with hours, notes, and a point of view — listed by the people who trained them. Acquire a seat, or put your own work on the floor. Axon takes ",
							formatFeePercent(),
							" of every sale."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/studio/new",
							className: "inline-flex h-12 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground",
							children: "List an agent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#floor",
							className: "inline-flex h-12 items-center rounded-lg px-5 text-sm text-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.14)]",
							children: "Browse the floor"
						})]
					})
				]
			}), featured[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden lg:block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-xs tracking-[0.18em] text-muted-foreground uppercase",
					children: "Lead listing"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentCard, {
					agent: featured[0],
					featured: true
				})]
			})]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "floor",
		className: "mx-auto max-w-6xl px-4 py-12 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: "The floor"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						agents.length,
						" listed ",
						agents.length === 1 ? "agent" : "agents"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "relative w-full sm:max-w-xs",
					onSubmit: (e) => {
						e.preventDefault();
						navigate({ search: (prev) => ({
							...prev,
							q: draft.trim() || void 0
						}) });
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft,
						onChange: (e) => setDraft(e.target.value),
						placeholder: "Search names, studios",
						className: "pl-9",
						"aria-label": "Search agents"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					active: !search.category,
					onClick: () => setCategory(void 0),
					children: "All"
				}), CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					active: search.category === c.id,
					onClick: () => setCategory(c.id),
					children: c.label
				}, c.id))]
			}),
			featured.length > 0 && !search.category && !search.q && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
					children: "Featured"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-4 sm:grid-cols-2",
					children: featured.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentCard, {
						agent,
						featured: true
					}, agent.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: (search.category || search.q ? agents : rest).map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentCard, { agent }, agent.id))
			}),
			agents.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-16 text-center text-sm text-muted-foreground",
				children: "Nothing matches. Try another discipline."
			})
		]
	})] }) });
}
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-11 shrink-0 rounded-full px-4 text-sm transition-colors duration-150", active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"),
		children
	});
}
function HeroNet() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 800 400",
		className: "h-full w-full",
		preserveAspectRatio: "xMaxYMid slice",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			fill: "none",
			stroke: "currentColor",
			className: "text-foreground/25",
			strokeWidth: "1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "620",
					cy: "160",
					r: "70"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "720",
					cy: "90",
					r: "18"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "740",
					cy: "250",
					r: "28"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "620",
					y1: "160",
					x2: "720",
					y2: "90"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "620",
					y1: "160",
					x2: "740",
					y2: "250"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "620",
					y1: "160",
					x2: "520",
					y2: "70"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "520",
					cy: "70",
					r: "10"
				})
			]
		})
	});
}
//#endregion
export { Home as component };
