import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as useRouterState, v as Link, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { o as formatCredits } from "./categories-DC-a2B4Z.mjs";
import { s as getMyProfile } from "./market-YtcRXDJh.mjs";
import { t as formatFeePercent } from "./fee-BMu_kIqU.mjs";
import { a as hasGateSessionMarker } from "./server-T8KKt-Rv.mjs";
import { s as Menu, t as X } from "../_libs/lucide-react.mjs";
import { n as Button, r as cn, t as AxonMark } from "./axon-mark-C4BCwm3a.mjs";
import { i as signOut, t as authClient } from "./client-B40BzJxt.mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogClose, o as DialogTitle, r as DialogContent, s as DialogTrigger, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-shell-Eanh1iuW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function isUnauthorized(err) {
	if (!err || typeof err !== "object") return false;
	const e = err;
	if (e.status === 401) return true;
	if (typeof e.message === "string" && e.message.includes("Unauthorized")) return true;
	return false;
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Axon · a market for trained agents · ",
				formatFeePercent(),
				" house take"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-x-4 gap-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/install",
					className: "text-muted-foreground hover:text-foreground",
					children: "Get the app"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Listings are sold as-is. Runs spend the house ledger, not your card." })]
			})]
		})
	});
}
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	ref,
	className: cn("fixed inset-0 z-50 bg-ink/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var SheetContent = import_react.forwardRef(({ className, children, side = "right", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn("fixed z-50 flex h-full flex-col bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:duration-200", side === "right" && "inset-y-0 right-0 w-[min(100%,20rem)] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0", side === "left" && "inset-y-0 left-0 w-[min(100%,20rem)] data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute top-4 right-4 rounded-sm text-muted-foreground opacity-70 transition-opacity duration-150 hover:opacity-100",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
SheetContent.displayName = DialogContent.displayName;
function SheetHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col gap-1.5 pr-8", className),
		...props
	});
}
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("font-display text-lg font-medium", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-secondary", className),
		...props
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var WALLET_EVENT = "axon:wallet";
function emitWallet(credits) {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: credits }));
}
var NAV = [
	{
		to: "/",
		label: "Market"
	},
	{
		to: "/library",
		label: "Library"
	},
	{
		to: "/studio",
		label: "Studio"
	}
];
function CreditsChip() {
	const { user, isPending } = useCurrentUserState();
	const [credits, setCredits] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!user) {
			setCredits(null);
			return;
		}
		let cancelled = false;
		getMyProfile().then((p) => {
			if (!cancelled) setCredits(p.credits);
		}).catch((err) => {
			if (!cancelled && !isUnauthorized(err)) setCredits(null);
		});
		const onWallet = (event) => {
			const detail = event.detail;
			if (typeof detail === "number") setCredits(detail);
		};
		window.addEventListener(WALLET_EVENT, onWallet);
		return () => {
			cancelled = true;
			window.removeEventListener(WALLET_EVENT, onWallet);
		};
	}, [user]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-9 w-20 rounded-full" });
	if (!user || credits === null) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex h-9 items-center rounded-full bg-secondary px-3 font-mono text-xs tabular-nums text-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.1)]",
		children: formatCredits(credits)
	});
}
function AuthSlot() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-9 rounded-full" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		size: "sm",
		variant: "secondary",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			children: "Sign in"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hidden min-w-0 items-center sm:flex",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
	});
}
function SiteHeader() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxonMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg tracking-tight",
						children: "Axon"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "ml-4 hidden items-center gap-1 md:flex",
					children: NAV.map((item) => {
						const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							className: cn("rounded-md px-3 py-2 text-sm transition-colors duration-150", active ? "text-foreground" : "text-muted-foreground hover:text-foreground"),
							children: item.label
						}, item.to);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditsChip, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							variant: "ghost",
							className: "hidden sm:inline-flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/install",
								children: "Get the app"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							className: "hidden sm:inline-flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/studio/new",
								children: "List an agent"
							})
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							variant: "secondary",
							className: "hidden sm:inline-flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/studio/new",
								children: "List an agent"
							})
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthSlot, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
							open,
							onOpenChange: setOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "md:hidden",
									"aria-label": "Open menu",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
								side: "right",
								className: "gap-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Axon" }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
										className: "flex flex-col gap-1",
										children: [
											NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: item.to,
												onClick: () => setOpen(false),
												className: "rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent",
												children: item.label
											}, item.to)),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/install",
												onClick: () => setOpen(false),
												className: "rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent",
												children: "Get the app"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/studio/new",
												onClick: () => setOpen(false),
												className: "rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent",
												children: "List an agent"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/login",
												onClick: () => setOpen(false),
												className: "rounded-lg px-3 py-3 text-base text-muted-foreground hover:bg-accent",
												children: "Sign in"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
									})
								]
							})]
						})
					]
				})
			]
		})
	});
}
var deferred = null;
var installed = false;
var listeners = /* @__PURE__ */ new Set();
function notify() {
	for (const listener of listeners) listener();
}
function subscribePwa(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function getDeferredPrompt() {
	return deferred;
}
function isStandaloneApp() {
	if (typeof window === "undefined") return false;
	const media = window.matchMedia("(display-mode: standalone)").matches;
	const ios = "standalone" in window.navigator && Boolean(window.navigator.standalone);
	return media || ios || installed;
}
function detectPlatform() {
	if (typeof navigator === "undefined") return "desktop";
	const ua = navigator.userAgent || "";
	const touch = navigator.maxTouchPoints || 0;
	if (/iPhone|iPad|iPod/.test(ua) || /Macintosh/.test(ua) && touch > 1) return "ios";
	if (/Android/i.test(ua)) return "android";
	return "desktop";
}
var started = false;
function initPwaInstall() {
	if (typeof window === "undefined" || started) return;
	started = true;
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferred = event;
		notify();
	});
	window.addEventListener("appinstalled", () => {
		deferred = null;
		installed = true;
		notify();
	});
}
async function promptInstall() {
	if (!deferred) return "unavailable";
	const event = deferred;
	deferred = null;
	notify();
	await event.prompt();
	const { outcome } = await event.userChoice;
	if (outcome === "accepted") installed = true;
	notify();
	return outcome;
}
function iosInstallHref() {
	if (typeof window === "undefined") return "/?install=1&platform=ios";
	const url = new URL(window.location.href);
	url.searchParams.set("install", "1");
	url.searchParams.set("platform", "ios");
	url.pathname = "/";
	return `${url.pathname}?${url.searchParams.toString()}`;
}
function SiteShell({ children }) {
	(0, import_react.useEffect)(() => {
		initPwaInstall();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { emitWallet as a, iosInstallHref as c, promptInstall as d, subscribePwa as f, detectPlatform as i, isStandaloneApp as l, SiteShell as n, getDeferredPrompt as o, useCurrentUserState as p, Skeleton as r, initPwaInstall as s, RedirectToSignIn as t, isUnauthorized as u };
