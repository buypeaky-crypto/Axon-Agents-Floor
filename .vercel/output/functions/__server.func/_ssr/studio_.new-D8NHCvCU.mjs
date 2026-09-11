import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { o as formatCredits, t as CATEGORIES } from "./categories-DC-a2B4Z.mjs";
import { r as createListing } from "./market-YtcRXDJh.mjs";
import { r as sellerNetCents, t as formatFeePercent } from "./fee-BMu_kIqU.mjs";
import { c as ChevronDown, l as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Button, r as cn } from "./axon-mark-C4BCwm3a.mjs";
import { n as SiteShell, p as useCurrentUserState, t as RedirectToSignIn, u as isUnauthorized } from "./site-shell-Eanh1iuW.mjs";
import { t as Textarea } from "./textarea-BDSbhh3a.mjs";
import { t as Input } from "./input-D4aGTNTQ.mjs";
import { t as Label } from "./label-CnXvTw_d.mjs";
import { a as SelectItemIndicator, c as SelectTrigger$1, i as SelectItem$1, l as SelectValue$1, n as SelectContent$1, o as SelectItemText, r as SelectIcon, s as SelectPortal, t as Select$1, u as SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio_.new-D8NHCvCU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-11 w-full items-center justify-between gap-2 rounded-md bg-secondary px-3 text-sm shadow-[0_0_0_1px_rgb(236_234_228/0.1)] outline-none transition-[box-shadow] duration-150 focus-visible:shadow-[0_0_0_1px_rgb(216_212_200/0.55)] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-muted-foreground" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-72 min-w-32 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.12),0_16px_40px_rgb(0_0_0/0.4)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
		className: cn("p-1", position === "popper" && "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"),
		children
	})
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-pointer items-center rounded-md py-2 pr-8 pl-2 text-sm outline-none select-none focus:bg-accent data-disabled:pointer-events-none data-disabled:opacity-40", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex size-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
function NewListing() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [pending, setPending] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		tagline: "",
		description: "",
		body: "",
		category: "code",
		priceDollars: "32",
		hoursTrained: "400",
		modelLabel: "House mix",
		capabilities: "",
		trainingNotes: ""
	});
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { className: "mx-auto max-w-2xl px-4 py-14" }) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	function set(key, value) {
		setForm((prev) => ({
			...prev,
			[key]: value
		}));
	}
	async function submit(e) {
		e.preventDefault();
		setPending(true);
		try {
			const created = await createListing({ data: {
				name: form.name,
				tagline: form.tagline,
				description: form.description,
				body: form.body,
				category: form.category,
				priceDollars: Number(form.priceDollars),
				hoursTrained: Number(form.hoursTrained),
				modelLabel: form.modelLabel,
				capabilities: form.capabilities,
				trainingNotes: form.trainingNotes
			} });
			toast.success(`${form.name} is on the floor.`);
			await navigate({
				to: "/agents/$slug",
				params: { slug: created.slug }
			});
		} catch (err) {
			if (isUnauthorized(err)) return;
			toast.error(err instanceof Error ? err.message : "Could not list the agent.");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-2xl px-4 py-12 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
				children: "New listing"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl font-medium tracking-tight",
				children: "List a trained agent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: [
					"Name the specialist, the hours, and the notes a buyer should read before they acquire it. Axon takes ",
					formatFeePercent(),
					" of the listed price on every sale."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (e) => void submit(e),
				className: "mt-10 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						htmlFor: "name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "name",
							value: form.name,
							onChange: (e) => set("name", e.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Tagline",
						htmlFor: "tagline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "tagline",
							value: form.tagline,
							onChange: (e) => set("tagline", e.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Discipline",
							htmlFor: "category",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.category,
								onValueChange: (v) => set("category", v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "category",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: c.id,
									children: c.label
								}, c.id)) })]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Price (USD)",
							htmlFor: "price",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "price",
								type: "number",
								min: 5,
								max: 200,
								step: "1",
								value: form.priceDollars,
								onChange: (e) => set("priceDollars", e.target.value)
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceSplit, { dollars: form.priceDollars }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Hours trained",
							htmlFor: "hours",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "hours",
								type: "number",
								min: 1,
								value: form.hoursTrained,
								onChange: (e) => set("hoursTrained", e.target.value)
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Weights label",
							htmlFor: "model",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "model",
								value: form.modelLabel,
								onChange: (e) => set("modelLabel", e.target.value)
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Short description",
						htmlFor: "desc",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "desc",
							value: form.description,
							onChange: (e) => set("description", e.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Dossier",
						htmlFor: "body",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "body",
							className: "min-h-36",
							value: form.body,
							onChange: (e) => set("body", e.target.value),
							required: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Capabilities (comma separated)",
						htmlFor: "caps",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "caps",
							value: form.capabilities,
							onChange: (e) => set("capabilities", e.target.value),
							placeholder: "PR review, API design"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Training notes",
						htmlFor: "notes",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "notes",
							value: form.trainingNotes,
							onChange: (e) => set("trainingNotes", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: pending,
						className: "w-full sm:w-auto",
						children: pending ? "Listing…" : "Publish listing"
					})
				]
			})
		]
	}) });
}
function PriceSplit({ dollars }) {
	const priceCents = Math.round(Number(dollars) * 100);
	if (!Number.isFinite(priceCents) || priceCents < 500) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground",
		children: [
			"Buyer pays ",
			formatCredits(priceCents),
			". You keep ",
			formatCredits(sellerNetCents(priceCents)),
			". Axon takes ",
			formatFeePercent(),
			"."
		]
	});
}
function Field({ label, htmlFor, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor,
			children: label
		}), children]
	});
}
//#endregion
export { NewListing as component };
