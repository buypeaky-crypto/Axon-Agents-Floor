import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Share, i as Smartphone, l as Check } from "../_libs/lucide-react.mjs";
import { n as Button, t as AxonMark } from "./axon-mark-C4BCwm3a.mjs";
import { c as iosInstallHref, d as promptInstall, f as subscribePwa, i as detectPlatform, l as isStandaloneApp, n as SiteShell, o as getDeferredPrompt, s as initPwaInstall } from "./site-shell-Eanh1iuW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/install-GjaDFiNr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InstallPage() {
	const [platform, setPlatform] = (0, import_react.useState)("desktop");
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	const [canPrompt, setCanPrompt] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		initPwaInstall();
		setPlatform(detectPlatform());
		setStandalone(isStandaloneApp());
		setCanPrompt(Boolean(getDeferredPrompt()));
		return subscribePwa(() => {
			setStandalone(isStandaloneApp());
			setCanPrompt(Boolean(getDeferredPrompt()));
		});
	}, []);
	async function install() {
		setBusy(true);
		try {
			await promptInstall();
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.22em] text-muted-foreground uppercase",
				children: "On your phone"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxonMark, { className: "size-10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-medium tracking-tight sm:text-5xl",
					children: "Get Axon"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-lg text-base leading-relaxed text-muted-foreground",
				children: "Axon is a web app you install to the home screen — same market, same ledger, in its own window. It is not listed in the Apple App Store or on Google Play; those stores require Apple and Google developer accounts and a native review this builder cannot file."
			}),
			standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 flex items-start gap-3 rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-5 text-success" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "Already on this device"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "You are running the installed app. Open it from the home screen next time."
				})] })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 space-y-3",
				children: [canPrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "h-12 w-full sm:w-auto",
					disabled: busy,
					onClick: () => void install(),
					children: busy ? "Waiting…" : "Install Axon"
				}), platform === "ios" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "secondary",
					className: "h-12 w-full sm:w-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: iosInstallHref(),
						children: "iPhone install walkthrough"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-12 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Step, {
						n: "01",
						title: "iPhone",
						children: [
							"Open Axon in Safari. Tap Share",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, { className: "mx-1 inline size-3.5 align-text-bottom" }),
							"then Add to Home Screen. The walkthrough above shows each tap."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "02",
						title: "Android",
						children: "Open Axon in Chrome. Use Install Axon if it appears, or the browser menu: Install app / Add to Home screen."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "03",
						title: "Computer",
						children: "Chrome and Edge can install from the icon in the address bar. After that, Axon opens in its own window."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-12 text-sm text-subtle",
				children: "Want it in the stores later? That is a separate Apple / Google submission with your developer accounts — not something this app can complete from here."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-6 inline-flex h-11 items-center text-sm underline-offset-4 hover:underline",
				children: "Back to the floor"
			})
		]
	}) });
}
function Step({ n, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-center gap-3 text-xs tracking-[0.18em] text-muted-foreground uppercase",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono tabular-nums",
					children: n
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-3.5" }),
				title
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted-foreground",
			children
		})]
	});
}
//#endregion
export { InstallPage as component };
