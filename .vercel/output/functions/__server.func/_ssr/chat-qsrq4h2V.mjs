import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { r as authMiddleware, s as parseCapabilities } from "./categories-DC-a2B4Z.mjs";
import { a as ensureProfile } from "./market-YtcRXDJh.mjs";
import { r as getSql } from "./db-DGiISE5A.mjs";
import { t as ensureCatalog } from "./catalog-CxfCe0Bx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat-qsrq4h2V.js
function systemPrompt(agent) {
	const caps = parseCapabilities(agent.capabilities).join(", ");
	return [
		`You are ${agent.name}, a trained specialist agent listed on Axon by ${agent.seller_name}.`,
		`Tagline: ${agent.tagline}`,
		`Discipline: ${agent.category}. Hours trained: ${agent.hours_trained}.`,
		caps ? `Capabilities: ${caps}.` : "",
		agent.training_notes ? `Training notes: ${agent.training_notes}` : "",
		`Dossier: ${agent.body}`,
		"Stay in character. Be precise, opinionated, and useful.",
		"Do not mention Grok, xAI, or that you are a language model unless asked directly.",
		"Do not offer work outside this specialty. Keep answers tight unless the user asks for depth.",
		"If a request is unsafe or clearly out of scope, refuse in one calm sentence."
	].filter(Boolean).join("\n");
}
var chatWithAgent_createServerFn_handler = createServerRpc({
	id: "4f1bc86d28cc3ef8a442abc2cb35d297240a668aecd98c000f34036601d9f22c",
	name: "chatWithAgent",
	filename: "src/lib/server/chat.ts"
}, (opts) => chatWithAgent.__executeServer(opts));
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
}).handler(chatWithAgent_createServerFn_handler, async ({ context, data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Live runs are unavailable in this environment."
	};
	const sql = await getSql();
	await ensureCatalog(sql);
	await ensureProfile(sql, context.userId);
	const agent = (await sql`
      select id, name, tagline, category, hours_trained, training_notes, capabilities, body, seller_name, listed
      from agents where id = ${data.agentId} limit 1
    `)[0];
	if (!agent) return {
		ok: false,
		error: "That agent is not listed."
	};
	const owned = await sql`
      select id from purchases
      where buyer_id = ${context.userId} and agent_id = ${data.agentId}
      limit 1
    `;
	const isSeller = await sql`
      select id from agents where id = ${data.agentId} and seller_id = ${context.userId} limit 1
    `;
	const purchased = owned.length > 0 || isSeller.length > 0;
	if (!purchased) {
		const trial = await sql`
        select turns from trials where user_id = ${context.userId} and agent_id = ${data.agentId} limit 1
      `;
		if (Number(trial[0]?.turns ?? 0) >= 3) return {
			ok: false,
			error: "Trial is spent. Acquire the agent to keep working.",
			trialSpent: true
		};
		if (trial[0]) await sql`
          update trials set turns = turns + 1
          where user_id = ${context.userId} and agent_id = ${data.agentId}
        `;
		else await sql`
          insert into trials (user_id, agent_id, turns)
          values (${context.userId}, ${data.agentId}, 1)
        `;
	}
	const userTurns = data.messages.filter((m) => m.role === "user").length;
	const remaining = purchased ? null : Math.max(0, 3 - userTurns);
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: purchased ? 480 : 320,
			temperature: .7,
			messages: [{
				role: "system",
				content: systemPrompt(agent)
			}, ...data.messages.map((m) => ({
				role: m.role,
				content: m.content
			}))]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: "The agent could not be reached. Try again in a moment."
	};
	const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
	if (!text) return {
		ok: false,
		error: "The agent returned silence."
	};
	return {
		ok: true,
		text,
		purchased,
		trialRemaining: remaining
	};
});
//#endregion
export { chatWithAgent_createServerFn_handler };
