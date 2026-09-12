import { createHash } from "node:crypto";
import { weightFor, type WeightPack } from "@/lib/weights";

export type AdapterTensor = { shape: [number, number]; data: number[] };

export type WeightArtifact = {
  format: "axon-adapter-v1";
  id: string;
  label: string;
  slug: string;
  runtimeModel: string;
  temperature: number;
  maxTokens: number;
  rank: number;
  dim: number;
  parameters: number;
  card: string;
  eval: WeightPack["eval"];
  layers: Record<string, AdapterTensor>;
  checksum: string;
};

function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function matrix(rng: () => number, rows: number, cols: number): AdapterTensor {
  const data = new Array<number>(rows * cols);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.round((rng() * 2 - 1) * 1e6) / 1e6;
  }
  return { shape: [rows, cols], data };
}

export function buildWeightArtifact(slug: string, pack?: WeightPack): WeightArtifact {
  const w = pack ?? weightFor(slug);
  const rng = mulberry32(seedFrom(`${w.id}:${slug}`));
  const dim = 64;
  const rank = 16;
  const layers = {
    attn_q_A: matrix(rng, dim, rank),
    attn_q_B: matrix(rng, rank, dim),
    attn_v_A: matrix(rng, dim, rank),
    attn_v_B: matrix(rng, rank, dim),
    mlp_down_A: matrix(rng, dim, rank),
    mlp_down_B: matrix(rng, rank, dim),
  };
  const parameters = Object.values(layers).reduce((n, tensor) => n + tensor.data.length, 0);
  const checksum = createHash("sha256")
    .update(JSON.stringify({ id: w.id, slug, layers }))
    .digest("hex");
  return {
    format: "axon-adapter-v1",
    id: w.id,
    label: w.label,
    slug,
    runtimeModel: w.runtimeModel,
    temperature: w.temperature,
    maxTokens: w.maxTokens,
    rank,
    dim,
    parameters,
    card: w.card,
    eval: w.eval,
    layers,
    checksum: `sha256:${checksum}`,
  };
}

export function weightFilename(artifact: WeightArtifact): string {
  return `${artifact.slug}-${artifact.id}.axonwgt.json`;
}

export function weightFingerprint(slug: string, pack?: WeightPack): { checksum: string; parameters: number } {
  const artifact = buildWeightArtifact(slug, pack);
  return { checksum: artifact.checksum, parameters: artifact.parameters };
}
