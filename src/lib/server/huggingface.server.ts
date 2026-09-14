import { env } from "@/lib/env.server";

export type HfModel = {
  id: string;
  pipeline: string;
  likes: number;
  downloads: number;
  url: string;
  private: boolean;
};

export type HfStatus = {
  watching: true;
  configured: boolean;
  username: string;
  model: string;
  router: string;
  models: HfModel[];
  note: string;
};

function token(): string | undefined {
  return env("HF_TOKEN") || env("HUGGINGFACE_API_KEY") || env("HUGGINGFACE_HUB_TOKEN");
}

export function huggingfaceUsername(): string {
  return env("HF_USERNAME") || env("HUGGINGFACE_USERNAME") || "buypeaky-crypto";
}

export function huggingfaceRouterModel(): string {
  return env("HF_MODEL") || env("HUGGINGFACE_MODEL") || "Qwen/Qwen2.5-7B-Instruct";
}

export function huggingfaceConfigured(): boolean {
  return Boolean(token());
}

export async function listHuggingFaceModels(user?: string): Promise<HfModel[]> {
  const author = (user || huggingfaceUsername()).trim();
  if (!author) return [];
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": "Axon-Conduit/1.0" };
  const key = token();
  if (key) headers.Authorization = `Bearer ${key}`;
  try {
    const res = await fetch(
      `https://huggingface.co/api/models?author=${encodeURIComponent(author)}&limit=24&sort=likes&direction=-1`,
      { headers, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      id?: string;
      pipeline_tag?: string;
      likes?: number;
      downloads?: number;
      private?: boolean;
    }[];
    if (!Array.isArray(json)) return [];
    return json
      .filter((row) => row.id)
      .map((row) => ({
        id: String(row.id),
        pipeline: String(row.pipeline_tag ?? "unknown"),
        likes: Number(row.likes ?? 0),
        downloads: Number(row.downloads ?? 0),
        url: `https://huggingface.co/${row.id}`,
        private: Boolean(row.private),
      }));
  } catch {
    return [];
  }
}

export async function getHuggingFaceStatus(): Promise<HfStatus> {
  const username = huggingfaceUsername();
  const configured = huggingfaceConfigured();
  const models = await listHuggingFaceModels(username);
  return {
    watching: true,
    configured,
    username,
    model: huggingfaceRouterModel(),
    router: "https://router.huggingface.co/v1",
    models,
    note: configured
      ? "HF_TOKEN is bound. Floor runs can use the Hugging Face router instead of the house xAI key."
      : "Set HF_TOKEN (a Hugging Face access token with inference) and optional HF_USERNAME / HF_MODEL. Until then the desk still lists public models for this account.",
  };
}
