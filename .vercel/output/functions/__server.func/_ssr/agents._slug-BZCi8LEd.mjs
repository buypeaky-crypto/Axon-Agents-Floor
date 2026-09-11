import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as formatCount, i as categoryLabel, o as formatCredits } from "./categories-DC-a2B4Z.mjs";
import { c as getMyRelation, n as buyAgent, t as addReview } from "./market-YtcRXDJh.mjs";
import { r as sellerNetCents, t as formatFeePercent } from "./fee-BMu_kIqU.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as Route$3 } from "./router-CYQmk1Am.mjs";
import { n as Button, r as cn } from "./axon-mark-C4BCwm3a.mjs";
import { t as AgentSigil } from "./agent-sigil-uI5ei_zP.mjs";
import { a as emitWallet, n as SiteShell, p as useCurrentUserState, t as RedirectToSignIn, u as isUnauthorized } from "./site-shell-Eanh1iuW.mjs";
import { t as ChatConsole } from "./chat-console-Dn6q7ARV.mjs";
import { t as Stars } from "./stars-Dqv7W006.mjs";
import { t as Badge } from "./badge-BIY0cFYH.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-COfNRrzZ.mjs";
import { t as Textarea } from "./textarea-BDSbhh3a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agents._slug-BZCi8LEd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AgentPage() {
	const { agent, reviews } = Route$3.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [relation, setRelation] = (0, import_react.useState)(null);
	const [buying, setBuying] = (0, import_react.useState)(false);
	const [needSignIn, setNeedSignIn] = (0, import_react.useState)(false);
	const [rating, setRating] = (0, import_react.useState)(5);
	const [note, setNote] = (0, import_react.useState)("");
	const [sendingReview, setSendingReview] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!user) {
			setRelation(null);
			return;
		}
		let cancelled = false;
		getMyRelation({ data: agent.id }).then((r) => {
			if (!cancelled) setRelation(r);
		}).catch((err) => {
			if (!cancelled && isUnauthorized(err)) setRelation(null);
		});
		return () => {
			cancelled = true;
		};
	}, [user, agent.id]);
	if (needSignIn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const owned = Boolean(relation?.purchased || relation?.isSeller);
	const canReview = Boolean(relation?.purchased && !relation?.hasReviewed);
	async function acquire() {
		if (!user) {
			setNeedSignIn(true);
			return;
		}
		setBuying(true);
		try {
			const result = await buyAgent({ data: agent.id });
			emitWallet(result.credits);
			setRelation((prev) => prev ? {
				...prev,
				purchased: true,
				credits: result.credits
			} : {
				purchased: true,
				isSeller: false,
				hasReviewed: false,
				credits: result.credits,
				trialTurns: 0,
				trialLimit: 3
			});
			toast.success(result.already ? "Already in your library." : `${agent.name} is yours.`);
		} catch (err) {
			if (isUnauthorized(err)) {
				setNeedSignIn(true);
				return;
			}
			toast.error(err instanceof Error ? err.message : "Could not complete the sale.");
		} finally {
			setBuying(false);
		}
	}
	async function submitReview() {
		setSendingReview(true);
		try {
			await addReview({ data: {
				agentId: agent.id,
				rating,
				body: note
			} });
			toast.success("Review noted.");
			setRelation((prev) => prev ? {
				...prev,
				hasReviewed: true
			} : prev);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save the review.");
		} finally {
			setSendingReview(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-10 lg:grid-cols-[1fr_20rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs tracking-[0.18em] text-muted-foreground uppercase",
					children: [
						categoryLabel(agent.category),
						" · ",
						agent.sellerName
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-start gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentSigil, {
						seed: agent.slug,
						letter: agent.sigil,
						className: "size-16"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl font-medium tracking-tight sm:text-5xl",
						children: agent.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-base text-muted-foreground",
						children: agent.tagline
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 flex flex-wrap gap-2",
					children: agent.capabilities.map((cap) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: cap
					}, cap))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "dossier",
					className: "mt-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "dossier",
								children: "Dossier"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "notes",
								children: "Training"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "reviews",
								children: "Reviews"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "run",
								children: "Run"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "dossier",
							className: "mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-foreground/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: agent.description }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: agent.body
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "notes",
							className: "mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "grid grid-cols-2 gap-4 text-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs tracking-wide text-subtle uppercase",
										children: "Hours trained"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 font-mono tabular-nums",
										children: formatCount(agent.hoursTrained)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs tracking-wide text-subtle uppercase",
										children: "Version"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 font-mono",
										children: agent.version
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs tracking-wide text-subtle uppercase",
										children: "Weights"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1",
										children: agent.modelLabel
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs tracking-wide text-subtle uppercase",
										children: "Studio"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1",
										children: agent.sellerName
									})] })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6",
								children: agent.trainingNotes || "The seller left the notes blank."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "reviews",
							className: "mt-6 max-w-2xl space-y-6",
							children: [
								canReview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl bg-secondary p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium",
											children: "Leave a note"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-3 flex gap-1",
											children: [
												1,
												2,
												3,
												4,
												5
											].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setRating(n),
												className: cn("size-11 rounded-md text-sm", n <= rating ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"),
												children: n
											}, n))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											className: "mt-3",
											value: note,
											onChange: (e) => setNote(e.target.value),
											placeholder: "How did it behave on a real task?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "mt-3",
											size: "sm",
											disabled: sendingReview || note.trim().length < 8,
											onClick: () => void submitReview(),
											children: sendingReview ? "Saving…" : "Publish review"
										})
									]
								}),
								reviews.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "No reviews yet."
								}),
								reviews.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "border-b border-border pb-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium",
											children: r.authorName
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stars, { value: r.rating })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm leading-relaxed text-muted-foreground",
										children: r.body
									})]
								}, r.id))
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "run",
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatConsole, {
								agent,
								purchased: owned,
								onNeedSignIn: () => setNeedSignIn(true),
								onAcquire: () => void acquire()
							})
						})
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "lg:sticky lg:top-24 h-fit rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-3xl tabular-nums",
						children: formatCredits(agent.priceCents)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stars, { value: agent.ratingAvg }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums",
							children: [
								agent.reviewCount,
								" · ",
								formatCount(agent.salesCount),
								" acquired"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs leading-relaxed text-subtle",
						children: [
							"You pay ",
							formatCredits(agent.priceCents),
							". The studio keeps",
							" ",
							formatCredits(sellerNetCents(agent.priceCents)),
							" after Axon's ",
							formatFeePercent(),
							" take."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 space-y-2",
						children: [owned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							className: "w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/library/$slug",
								params: { slug: agent.slug },
								children: "Open in library"
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							disabled: buying || isPending,
							onClick: () => void acquire(),
							children: buying ? "Settling…" : user ? "Acquire" : "Sign in to acquire"
						}), relation && !owned && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center text-xs text-subtle",
							children: ["Ledger ", formatCredits(relation.credits)]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-6 space-y-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Hours",
								value: formatCount(agent.hoursTrained)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Version",
								value: agent.version
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Weights",
								value: agent.modelLabel
							})
						]
					})
				]
			})]
		})
	}) });
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-mono text-xs tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { AgentPage as component };
