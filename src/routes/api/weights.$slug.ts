import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/server/catalog";
import { buildWeightArtifact, weightFilename } from "@/lib/weight-artifact";
import { weightFor } from "@/lib/weights";

export const Route = createFileRoute("/api/weights/$slug")({
  server: {
    handlers: {
      GET: ({ params }) => handleGet(params.slug),
    },
  },
});

async function handleGet(slug: string): Promise<Response> {
  const key = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
    return Response.json({ error: "Unknown pack." }, { status: 404 });
  }
  const sql = await getSql();
  await ensureCatalog(sql);
  const rows = await sql<{ slug: string; listed: boolean | number | string; category: string }>`
    select slug, listed, category from agents where slug = ${key} limit 1
  `;
  const row = rows[0];
  if (!row || !(row.listed === true || row.listed === "t" || row.listed === 1 || row.listed === "1")) {
    return Response.json({ error: "Not listed." }, { status: 404 });
  }
  const artifact = buildWeightArtifact(row.slug, weightFor(row.slug, row.category));
  const body = JSON.stringify(artifact);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${weightFilename(artifact)}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Axon-Checksum": artifact.checksum,
    },
  });
}
