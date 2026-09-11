import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { n as CATEGORY_IDS, r as authMiddleware, s as parseCapabilities } from "./categories-DC-a2B4Z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market-YtcRXDJh.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var STARTING_CREDITS = 1e4;
async function displayNameFor(sql, userId) {
	const name = (await sql`
    select name from "user" where id = ${userId} limit 1
  `)[0]?.name?.trim();
	return name && name.length > 0 ? name : "Member";
}
async function ensureProfile(sql, userId) {
	if ((await sql`
    select user_id from profiles where user_id = ${userId} limit 1
  `).length > 0) return;
	const name = await displayNameFor(sql, userId);
	await sql`
    insert into profiles (user_id, display_name, studio_name, credits)
    values (${userId}, ${name}, ${name}, ${STARTING_CREDITS})
    on conflict (user_id) do nothing
  `;
}
var listAgents = createServerFn({ method: "GET" }).validator((input) => ({
	category: input.category?.trim() || void 0,
	q: input.q?.trim() || void 0
})).handler(createSsrRpc("3f9638840ca8670c903b440c5538e900b95d156b652cd6514e8fc158ef807dd7"));
var getAgent = createServerFn({ method: "GET" }).validator((slug) => slug.trim()).handler(createSsrRpc("cb580bfcfe5655213c20b1ea5525d93bc57d73287d876443b81c27f73574407a"));
var getMyRelation = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((agentId) => agentId).handler(createSsrRpc("09bf70ec6eb50a54e1dbdffe0322f551f31f562be1b07bf620bac4f1dd33c215"));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f78beb305e1e3f60e0b59e404c387b034bfc95e6d0015f4fc37e5a4ef9f04e42"));
var buyAgent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((agentId) => agentId).handler(createSsrRpc("a506642fd90fd285e1e50b09b6c76f5549abf9eff1ae9520653159b2388b5a35"));
var listLibrary = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("68befd6c3ed0371ca7fa47cd1f99c5610b5fbb08a611fa6d83cfa49ed7807814"));
var listMyListings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("71c55d12c0a8327015751740af3237b41fc3776fe0107aa495062592ca233257"));
function cleanListing(input) {
	const name = input.name.trim();
	const tagline = input.tagline.trim();
	const description = input.description.trim();
	const body = input.body.trim();
	const category = input.category.trim();
	const modelLabel = input.modelLabel.trim() || "House mix";
	const trainingNotes = input.trainingNotes.trim();
	const caps = parseCapabilities(input.capabilities);
	const priceDollars = Number(input.priceDollars);
	const hoursTrained = Math.round(Number(input.hoursTrained));
	if (name.length < 2 || name.length > 60) throw new Error("Give the agent a name (2–60 characters).");
	if (tagline.length < 8 || tagline.length > 160) throw new Error("Tagline should be a short sentence.");
	if (description.length < 20 || description.length > 400) throw new Error("Description needs a bit more flesh.");
	if (body.length < 40 || body.length > 5e3) throw new Error("Dossier should read like a brief, not a tweet.");
	if (!CATEGORY_IDS.includes(category)) throw new Error("Pick a discipline.");
	if (!Number.isFinite(priceDollars) || priceDollars < 5 || priceDollars > 200) throw new Error("Price sits between $5 and $200.");
	if (!Number.isFinite(hoursTrained) || hoursTrained < 1 || hoursTrained > 1e5) throw new Error("Hours trained looks off.");
	if (caps.length < 1 || caps.length > 8) throw new Error("List one to eight capabilities.");
	if (modelLabel.length > 40) throw new Error("Model label is too long.");
	return {
		name,
		tagline,
		description,
		body,
		category,
		priceCents: Math.round(priceDollars * 100),
		hoursTrained,
		modelLabel,
		capabilities: caps,
		trainingNotes
	};
}
var createListing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => cleanListing(input)).handler(createSsrRpc("8155ead007aa7ca2eb333602de197b4eee27186e837b5f62c800450cc35a8276"));
var setListingLive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("824d597a4ace462299a742cf9a1f0ee1648acb3ee550d9399a97c383ede8864e"));
var addReview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const body = input.body.trim();
	const rating = Math.round(Number(input.rating));
	if (rating < 1 || rating > 5) throw new Error("Rate from 1 to 5.");
	if (body.length < 8 || body.length > 600) throw new Error("A short note, 8–600 characters.");
	return {
		agentId: input.agentId,
		rating,
		body
	};
}).handler(createSsrRpc("cc1f7612264c98ac74d6885e9d9b9734b58a87af8dad2f347c7e48689a1a3178"));
//#endregion
export { ensureProfile as a, getMyRelation as c, listMyListings as d, setListingLive as f, createSsrRpc as i, listAgents as l, buyAgent as n, getAgent as o, createListing as r, getMyProfile as s, addReview as t, listLibrary as u };
