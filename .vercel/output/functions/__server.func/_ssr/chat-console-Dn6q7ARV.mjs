import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { r as authMiddleware } from "./categories-DC-a2B4Z.mjs";
import { i as createSsrRpc } from "./market-YtcRXDJh.mjs";
import { u as ArrowUp } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Button, r as cn } from "./axon-mark-C4BCwm3a.mjs";
import { t as AgentSigil } from "./agent-sigil-uI5ei_zP.mjs";
import { u as isUnauthorized } from "./site-shell-Eanh1iuW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat-console-Dn6q7ARV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var chatWithAgent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const messages = (input.messages ?? []).filter((m) => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
	if (messages.length > 20) throw new Error("Conversation is too long. Start a fresh thread.");
	const last = messages[messages.length - 1];
	if (!last || last.role !== "user") throw new Error("Say something first.");
	const text = last.content.trim();
	if (text.length < 1) throw new Error("Say something first.");
	if (text.length > 1800) throw new Error("Keep the message under 1,800 characters.");
	return {
		agentId: String(input.agentId),
		messages: messages.slice(-12).map((m) => ({
			role: m.role,
			content: m.content.slice(0, 1800)
		}))
	};
}).handler(createSsrRpc("4f1bc86d28cc3ef8a442abc2cb35d297240a668aecd98c000f34036601d9f22c"));
function ChatConsole({ agent, purchased, onNeedSignIn, onAcquire }) {
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	const scroller = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = scroller.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [messages, pending]);
	async function send() {
		const text = draft.trim();
		if (!text || pending) return;
		const next = [...messages, {
			role: "user",
			content: text
		}];
		setMessages(next);
		setDraft("");
		setPending(true);
		try {
			const result = await chatWithAgent({ data: {
				agentId: agent.id,
				messages: next
			} });
			if (!result.ok) {
				if (result.trialSpent) onAcquire?.();
				toast.error(result.error);
				return;
			}
			setMessages([...next, {
				role: "assistant",
				content: result.text
			}]);
		} catch (err) {
			if (isUnauthorized(err)) {
				onNeedSignIn?.();
				toast.error("Sign in to run this agent.");
				return;
			}
			toast.error(err instanceof Error ? err.message : "The run failed.");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[28rem] flex-col overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentSigil, {
					seed: agent.slug,
					letter: agent.sigil,
					className: "size-10"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-display text-base font-medium",
						children: agent.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-muted-foreground",
						children: purchased ? "Full run" : "Trial · three turns"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: scroller,
				className: "flex-1 space-y-4 overflow-y-auto px-4 py-4",
				children: [
					messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted-foreground",
						children: agent.tagline
					}),
					messages.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"),
							children: m.content
						})
					}, `${m.role}-${i}`)),
					pending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shimmer-text text-sm text-muted-foreground",
						children: "Thinking"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex items-end gap-2 border-t border-border p-3",
				onSubmit: (e) => {
					e.preventDefault();
					send();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							send();
						}
					},
					rows: 2,
					placeholder: `Ask ${agent.name}…`,
					className: "min-h-11 flex-1 resize-none rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-subtle focus-visible:shadow-[0_0_0_1px_rgb(216_212_200/0.55)]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon",
					disabled: pending || !draft.trim(),
					"aria-label": "Send",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
				})]
			})
		]
	});
}
//#endregion
export { ChatConsole as t };
