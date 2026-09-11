import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { n as CATEGORY_IDS, r as authMiddleware, s as parseCapabilities } from "./categories-DC-a2B4Z.mjs";
import { n as houseFeeCents, r as sellerNetCents } from "./fee-BMu_kIqU.mjs";
import { r as getSql } from "./db-DGiISE5A.mjs";
import { t as ensureCatalog } from "./catalog-CxfCe0Bx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market-XWdm0SRl.js
var STARTING_CREDITS = 1e4;
var TRIAL_TURNS = 3;
var HOUSE_ID = "axon";
function asIso(value) {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string") return value;
	return (/* @__PURE__ */ new Date()).toISOString();
}
function asBool(value) {
	return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}
function mapAgent(row) {
	return {
		id: row.id,
		slug: row.slug,
		sellerId: row.seller_id,
		sellerName: row.seller_name,
		name: row.name,
		tagline: row.tagline,
		description: row.description,
		body: row.body,
		category: row.category,
		priceCents: Number(row.price_cents),
		version: row.version,
		hoursTrained: Number(row.hours_trained),
		modelLabel: row.model_label,
		capabilities: parseCapabilities(row.capabilities),
		trainingNotes: row.training_notes,
		sigil: row.sigil,
		featured: asBool(row.featured),
		listed: asBool(row.listed),
		ratingAvg: Number(row.rating_avg),
		reviewCount: Number(row.review_count),
		salesCount: Number(row.sales_count),
		createdAt: asIso(row.created_at)
	};
}
function toSummary(agent) {
	return {
		id: agent.id,
		slug: agent.slug,
		sellerId: agent.sellerId,
		sellerName: agent.sellerName,
		name: agent.name,
		tagline: agent.tagline,
		description: agent.description,
		category: agent.category,
		priceCents: agent.priceCents,
		version: agent.version,
		hoursTrained: agent.hoursTrained,
		modelLabel: agent.modelLabel,
		capabilities: agent.capabilities,
		sigil: agent.sigil,
		featured: agent.featured,
		listed: agent.listed,
		ratingAvg: agent.ratingAvg,
		reviewCount: agent.reviewCount,
		salesCount: agent.salesCount,
		createdAt: agent.createdAt
	};
}
async function readySql() {
	const sql = await getSql();
	await ensureCatalog(sql);
	await ensureHouse(sql);
	return sql;
}
async function ensureHouse(sql) {
	await sql.query(`
    create table if not exists house (
      id text primary key,
      fee_bps integer not null default 800,
      treasury_cents integer not null default 0
    )
  `);
	await sql.query(`
    alter table purchases add column if not exists fee_cents integer not null default 0
  `);
	await sql.query(`
    alter table purchases add column if not exists seller_net_cents integer not null default 0
  `);
	await sql`
    insert into house (id, fee_bps, treasury_cents)
    values (${HOUSE_ID}, ${800}, ${0})
    on conflict (id) do nothing
  `;
}
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
function slugify(name) {
	const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
	const suffix = Math.random().toString(36).slice(2, 6);
	return `${base || "agent"}-${suffix}`;
}
var listAgents_createServerFn_handler = createServerRpc({
	id: "3f9638840ca8670c903b440c5538e900b95d156b652cd6514e8fc158ef807dd7",
	name: "listAgents",
	filename: "src/lib/server/market.ts"
}, (opts) => listAgents.__executeServer(opts));
var listAgents = createServerFn({ method: "GET" }).validator((input) => ({
	category: input.category?.trim() || void 0,
	q: input.q?.trim() || void 0
})).handler(listAgents_createServerFn_handler, async ({ data }) => {
	const sql = await readySql();
	const pattern = data.q ? `%${data.q}%` : null;
	let rows;
	if (data.category && pattern) rows = await sql`
        select * from agents
        where listed = true
          and category = ${data.category}
          and (name ilike ${pattern} or tagline ilike ${pattern} or seller_name ilike ${pattern})
        order by featured desc, sales_count desc, created_at desc
      `;
	else if (data.category) rows = await sql`
        select * from agents
        where listed = true and category = ${data.category}
        order by featured desc, sales_count desc, created_at desc
      `;
	else if (pattern) rows = await sql`
        select * from agents
        where listed = true
          and (name ilike ${pattern} or tagline ilike ${pattern} or seller_name ilike ${pattern} or description ilike ${pattern})
        order by featured desc, sales_count desc, created_at desc
      `;
	else rows = await sql`
        select * from agents
        where listed = true
        order by featured desc, sales_count desc, created_at desc
      `;
	return rows.map((row) => toSummary(mapAgent(row)));
});
var getAgent_createServerFn_handler = createServerRpc({
	id: "cb580bfcfe5655213c20b1ea5525d93bc57d73287d876443b81c27f73574407a",
	name: "getAgent",
	filename: "src/lib/server/market.ts"
}, (opts) => getAgent.__executeServer(opts));
var getAgent = createServerFn({ method: "GET" }).validator((slug) => slug.trim()).handler(getAgent_createServerFn_handler, async ({ data: slug }) => {
	const sql = await readySql();
	const rows = await sql`select * from agents where slug = ${slug} limit 1`;
	if (!rows[0] || !asBool(rows[0].listed)) return null;
	const agent = mapAgent(rows[0]);
	return {
		agent,
		reviews: (await sql`
      select id, agent_id, author_name, rating, body, created_at
      from reviews
      where agent_id = ${agent.id}
      order by created_at desc
      limit 40
    `).map((row) => ({
			id: Number(row.id),
			agentId: row.agent_id,
			authorName: row.author_name,
			rating: Number(row.rating),
			body: row.body,
			createdAt: asIso(row.created_at),
			isMine: false
		}))
	};
});
var getMyRelation_createServerFn_handler = createServerRpc({
	id: "09bf70ec6eb50a54e1dbdffe0322f551f31f562be1b07bf620bac4f1dd33c215",
	name: "getMyRelation",
	filename: "src/lib/server/market.ts"
}, (opts) => getMyRelation.__executeServer(opts));
var getMyRelation = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((agentId) => agentId).handler(getMyRelation_createServerFn_handler, async ({ context, data: agentId }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	const [owned, mine, reviewed, profile, trialRows] = await Promise.all([
		sql`
        select id from purchases where buyer_id = ${context.userId} and agent_id = ${agentId} limit 1
      `,
		sql`
        select seller_id from agents where id = ${agentId} limit 1
      `,
		sql`
        select id from reviews where agent_id = ${agentId} and author_id = ${context.userId} limit 1
      `,
		sql`
        select credits from profiles where user_id = ${context.userId} limit 1
      `,
		sql`
        select turns from trials where user_id = ${context.userId} and agent_id = ${agentId} limit 1
      `
	]);
	return {
		purchased: owned.length > 0,
		isSeller: mine[0]?.seller_id === context.userId,
		hasReviewed: reviewed.length > 0,
		credits: Number(profile[0]?.credits ?? 0),
		trialTurns: Number(trialRows[0]?.turns ?? 0),
		trialLimit: TRIAL_TURNS
	};
});
var getMyProfile_createServerFn_handler = createServerRpc({
	id: "f78beb305e1e3f60e0b59e404c387b034bfc95e6d0015f4fc37e5a4ef9f04e42",
	name: "getMyProfile",
	filename: "src/lib/server/market.ts"
}, (opts) => getMyProfile.__executeServer(opts));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyProfile_createServerFn_handler, async ({ context }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	const row = (await sql`
      select user_id, display_name, studio_name, bio, credits
      from profiles where user_id = ${context.userId} limit 1
    `)[0];
	return {
		userId: context.userId,
		displayName: row?.display_name ?? "Member",
		studioName: row?.studio_name ?? "Member",
		bio: row?.bio ?? "",
		credits: Number(row?.credits ?? 0)
	};
});
var buyAgent_createServerFn_handler = createServerRpc({
	id: "a506642fd90fd285e1e50b09b6c76f5549abf9eff1ae9520653159b2388b5a35",
	name: "buyAgent",
	filename: "src/lib/server/market.ts"
}, (opts) => buyAgent.__executeServer(opts));
var buyAgent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((agentId) => agentId).handler(buyAgent_createServerFn_handler, async ({ context, data: agentId }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	const rows = await sql`select * from agents where id = ${agentId} limit 1`;
	const agent = rows[0] ? mapAgent(rows[0]) : null;
	if (!agent || !agent.listed) throw new Error("That listing is gone.");
	if (agent.sellerId === context.userId) throw new Error("You already train this one.");
	if ((await sql`
      select id from purchases where buyer_id = ${context.userId} and agent_id = ${agentId} limit 1
    `).length > 0) {
		const profile = await sql`
        select credits from profiles where user_id = ${context.userId} limit 1
      `;
		return {
			ok: true,
			credits: Number(profile[0]?.credits ?? 0),
			already: true
		};
	}
	const price = agent.priceCents;
	const fee = houseFeeCents(price);
	const net = sellerNetCents(price);
	const deducted = await sql`
      update profiles
      set credits = credits - ${price}
      where user_id = ${context.userId} and credits >= ${price}
      returning credits
    `;
	if (!deducted[0]) throw new Error("Not enough credit in the ledger.");
	await sql`
      insert into purchases (id, buyer_id, agent_id, price_cents, fee_cents, seller_net_cents)
      values (${crypto.randomUUID()}, ${context.userId}, ${agentId}, ${price}, ${fee}, ${net})
    `;
	await sql`
      update agents set sales_count = sales_count + 1 where id = ${agentId}
    `;
	if ((await sql`
      select user_id from profiles where user_id = ${agent.sellerId} limit 1
    `)[0]) {
		await sql`
        update profiles set credits = credits + ${net} where user_id = ${agent.sellerId}
      `;
		await sql`
        update house set treasury_cents = treasury_cents + ${fee} where id = ${HOUSE_ID}
      `;
	} else await sql`
        update house set treasury_cents = treasury_cents + ${price} where id = ${HOUSE_ID}
      `;
	return {
		ok: true,
		credits: Number(deducted[0].credits),
		already: false,
		feeCents: fee,
		sellerNetCents: net
	};
});
var listLibrary_createServerFn_handler = createServerRpc({
	id: "68befd6c3ed0371ca7fa47cd1f99c5610b5fbb08a611fa6d83cfa49ed7807814",
	name: "listLibrary",
	filename: "src/lib/server/market.ts"
}, (opts) => listLibrary.__executeServer(opts));
var listLibrary = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listLibrary_createServerFn_handler, async ({ context }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	return (await sql`
      select a.*, p.created_at as purchased_at
      from purchases p
      join agents a on a.id = p.agent_id
      where p.buyer_id = ${context.userId}
      order by p.created_at desc
    `).map((row) => ({
		...toSummary(mapAgent(row)),
		purchasedAt: asIso(row.purchased_at)
	}));
});
var listMyListings_createServerFn_handler = createServerRpc({
	id: "71c55d12c0a8327015751740af3237b41fc3776fe0107aa495062592ca233257",
	name: "listMyListings",
	filename: "src/lib/server/market.ts"
}, (opts) => listMyListings.__executeServer(opts));
var listMyListings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyListings_createServerFn_handler, async ({ context }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	const rows = await sql`
      select * from agents where seller_id = ${context.userId} order by created_at desc
    `;
	const earnings = await sql`
      select
        coalesce(sum(p.price_cents), 0)::int as gross,
        coalesce(sum(p.seller_net_cents), 0)::int as net,
        coalesce(sum(p.fee_cents), 0)::int as take
      from purchases p
      join agents a on a.id = p.agent_id
      where a.seller_id = ${context.userId}
    `;
	const gross = Number(earnings[0]?.gross ?? 0);
	const recordedNet = Number(earnings[0]?.net ?? 0);
	const recordedTake = Number(earnings[0]?.take ?? 0);
	const net = recordedNet > 0 || recordedTake > 0 ? recordedNet : sellerNetCents(gross);
	const take = recordedTake > 0 || recordedNet > 0 ? recordedTake : houseFeeCents(gross);
	return {
		agents: rows.map((row) => mapAgent(row)),
		grossCents: gross,
		netCents: net,
		takeCents: take
	};
});
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
var createListing_createServerFn_handler = createServerRpc({
	id: "8155ead007aa7ca2eb333602de197b4eee27186e837b5f62c800450cc35a8276",
	name: "createListing",
	filename: "src/lib/server/market.ts"
}, (opts) => createListing.__executeServer(opts));
var createListing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => cleanListing(input)).handler(createListing_createServerFn_handler, async ({ context, data }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	const profile = await sql`
      select studio_name, display_name from profiles where user_id = ${context.userId} limit 1
    `;
	const sellerName = profile[0]?.studio_name?.trim() || profile[0]?.display_name?.trim() || "Independent";
	const id = crypto.randomUUID();
	let slug = slugify(data.name);
	for (let i = 0; i < 5; i += 1) {
		if (!(await sql`select id from agents where slug = ${slug} limit 1`)[0]) break;
		slug = slugify(data.name);
	}
	const sigil = data.name.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase() || "A";
	await sql`
      insert into agents (
        id, slug, seller_id, seller_name, name, tagline, description, body,
        category, price_cents, version, hours_trained, model_label, capabilities,
        training_notes, sigil, featured, listed
      ) values (
        ${id}, ${slug}, ${context.userId}, ${sellerName},
        ${data.name}, ${data.tagline}, ${data.description}, ${data.body},
        ${data.category}, ${data.priceCents}, ${"1.0"}, ${data.hoursTrained},
        ${data.modelLabel}, ${JSON.stringify(data.capabilities)}, ${data.trainingNotes},
        ${sigil}, ${false}, ${true}
      )
    `;
	return {
		id,
		slug
	};
});
var setListingLive_createServerFn_handler = createServerRpc({
	id: "824d597a4ace462299a742cf9a1f0ee1648acb3ee550d9399a97c383ede8864e",
	name: "setListingLive",
	filename: "src/lib/server/market.ts"
}, (opts) => setListingLive.__executeServer(opts));
var setListingLive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setListingLive_createServerFn_handler, async ({ context, data }) => {
	if (!(await (await readySql())`
      update agents
      set listed = ${data.listed}
      where id = ${data.agentId} and seller_id = ${context.userId}
      returning id
    `)[0]) throw new Error("Listing not found.");
	return { ok: true };
});
var addReview_createServerFn_handler = createServerRpc({
	id: "cc1f7612264c98ac74d6885e9d9b9734b58a87af8dad2f347c7e48689a1a3178",
	name: "addReview",
	filename: "src/lib/server/market.ts"
}, (opts) => addReview.__executeServer(opts));
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
}).handler(addReview_createServerFn_handler, async ({ context, data }) => {
	const sql = await readySql();
	await ensureProfile(sql, context.userId);
	if (!(await sql`
      select id from purchases
      where buyer_id = ${context.userId} and agent_id = ${data.agentId}
      limit 1
    `)[0]) throw new Error("Acquire the agent before reviewing.");
	const name = await displayNameFor(sql, context.userId);
	await sql`
      insert into reviews (agent_id, author_id, author_name, rating, body)
      values (${data.agentId}, ${context.userId}, ${name}, ${data.rating}, ${data.body})
      on conflict (agent_id, author_id) do update
        set rating = excluded.rating, body = excluded.body, author_name = excluded.author_name
    `;
	const stats = await sql`
      select coalesce(avg(rating), 0)::float as avg, count(*)::int as n
      from reviews where agent_id = ${data.agentId}
    `;
	await sql`
      update agents
      set rating_avg = ${Number(stats[0]?.avg ?? 0)}, review_count = ${Number(stats[0]?.n ?? 0)}
      where id = ${data.agentId}
    `;
	return { ok: true };
});
//#endregion
export { addReview_createServerFn_handler, buyAgent_createServerFn_handler, createListing_createServerFn_handler, getAgent_createServerFn_handler, getMyProfile_createServerFn_handler, getMyRelation_createServerFn_handler, listAgents_createServerFn_handler, listLibrary_createServerFn_handler, listMyListings_createServerFn_handler, setListingLive_createServerFn_handler };
