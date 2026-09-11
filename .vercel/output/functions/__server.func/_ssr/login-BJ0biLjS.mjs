import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-T8KKt-Rv.mjs";
import { i as Route$5 } from "./router-CYQmk1Am.mjs";
import { n as Button, t as AxonMark } from "./axon-mark-C4BCwm3a.mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-COfNRrzZ.mjs";
import { t as Input } from "./input-D4aGTNTQ.mjs";
import { t as Label } from "./label-CnXvTw_d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-BJ0biLjS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { redirect } = Route$5.useSearch();
	const callbackURL = redirect ?? "/";
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function handleProvider(providerId) {
		setError(null);
		try {
			await signIn(providerId, { callbackURL });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed.");
		}
	}
	async function handleEmail(mode) {
		setError(null);
		setPending(true);
		try {
			if (mode === "up") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || email.split("@")[0] || "Member"
				});
				if (err) throw new Error(err.message ?? "Could not create the account.");
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password
				});
				if (err) throw new Error(err.message ?? "Could not sign in.");
			}
			window.location.href = callbackURL;
		} catch (err) {
			setError(err instanceof Error ? err.message : "That did not work.");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-background px-4 py-12 text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "mb-8 flex items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AxonMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg tracking-tight",
						children: "Axon"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-medium tracking-tight",
					children: "Enter the market"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Sign in to acquire agents, list your own, and run the ones you own."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "secondary",
								className: "w-full",
								onClick: () => void handleProvider(p.providerId),
								children: ["Continue with ", p.label]
							}, p.providerId))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 text-xs tracking-[0.18em] text-subtle uppercase",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
								"or email",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							defaultValue: "in",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "w-full",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "in",
										className: "flex-1",
										children: "Sign in"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "up",
										className: "flex-1",
										children: "Create account"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
									value: "in",
									className: "mt-4 space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Email",
											htmlFor: "email-in",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "email-in",
												type: "email",
												autoComplete: "email",
												value: email,
												onChange: (e) => setEmail(e.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Password",
											htmlFor: "pass-in",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "pass-in",
												type: "password",
												autoComplete: "current-password",
												value: password,
												onChange: (e) => setPassword(e.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "w-full",
											disabled: pending || !email || password.length < 8,
											onClick: () => void handleEmail("in"),
											children: pending ? "Working…" : "Sign in"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
									value: "up",
									className: "mt-4 space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Name",
											htmlFor: "name-up",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "name-up",
												autoComplete: "name",
												value: name,
												onChange: (e) => setName(e.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Email",
											htmlFor: "email-up",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "email-up",
												type: "email",
												autoComplete: "email",
												value: email,
												onChange: (e) => setEmail(e.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											label: "Password",
											htmlFor: "pass-up",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "pass-up",
												type: "password",
												autoComplete: "new-password",
												value: password,
												onChange: (e) => setPassword(e.target.value)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "w-full",
											disabled: pending || !email || password.length < 8,
											onClick: () => void handleEmail("up"),
											children: pending ? "Working…" : "Create account"
										})
									]
								})
							]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: error
						})
					]
				})
			]
		})
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
export { Login as component };
