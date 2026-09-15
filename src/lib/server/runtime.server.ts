export type RuntimeProvider = {
  id: string;
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** Open-weight / free-tier hosts only. The house xAI key is never used. */
export function listRuntimeProviders(): RuntimeProvider[] {
  const out: RuntimeProvider[] = [];
  const hf = env("HF_TOKEN") || env("HUGGINGFACE_API_KEY") || env("HUGGINGFACE_HUB_TOKEN");
  if (hf) {
    out.push({
      id: "huggingface",
      label: "Hugging Face",
      baseUrl: (env("HF_BASE_URL") || "https://router.huggingface.co/v1").replace(/\/$/, ""),
      apiKey: hf,
      model: env("HF_MODEL") || env("HUGGINGFACE_MODEL") || "Qwen/Qwen2.5-7B-Instruct",
    });
  }
  const groq = env("GROQ_API_KEY");
  if (groq) {
    out.push({
      id: "groq",
      label: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groq,
      model: env("GROQ_MODEL") || "openai/gpt-oss-20b",
    });
  }
  const openrouter = env("OPENROUTER_API_KEY");
  if (openrouter) {
    out.push({
      id: "openrouter",
      label: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: openrouter,
      model: env("OPENROUTER_MODEL") || "openrouter/free",
    });
  }
  const gemini = env("GEMINI_API_KEY") || env("GOOGLE_API_KEY");
  if (gemini) {
    out.push({
      id: "gemini",
      label: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: gemini,
      model: env("GEMINI_MODEL") || "gemini-2.0-flash",
    });
  }
  const cerebras = env("CEREBRAS_API_KEY");
  if (cerebras) {
    out.push({
      id: "cerebras",
      label: "Cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      apiKey: cerebras,
      model: env("CEREBRAS_MODEL") || "llama3.1-8b",
    });
  }
  const compatUrl = env("OPENAI_COMPAT_BASE_URL") || env("CONDUIT_LLM_BASE_URL");
  const compatKey = env("OPENAI_COMPAT_API_KEY") || env("CONDUIT_LLM_API_KEY") || "none";
  if (compatUrl) {
    out.push({
      id: "compat",
      label: "Open LLM host",
      baseUrl: compatUrl.replace(/\/$/, "").replace(/\/chat\/completions$/i, ""),
      apiKey: compatKey,
      model: env("OPENAI_COMPAT_MODEL") || env("CONDUIT_LLM_MODEL") || "llama3.1",
    });
  }
  return out;
}

export function runtimeConfigured(): boolean {
  return listRuntimeProviders().length > 0;
}

export function xaiQuotaSpent(): boolean {
  return true;
}

function humanUpstreamError(status: number, body: string, provider: RuntimeProvider): string {
  if (status === 401 || status === 403) {
    return `${provider.label} refused the key.`;
  }
  const json = (() => {
    try {
      return JSON.parse(body) as { error?: { message?: string } | string; message?: string };
    } catch {
      return null;
    }
  })();
  const msg =
    (typeof json?.error === "string" ? json.error : json?.error?.message) || json?.message || "";
  if (msg && msg.length < 240 && !/html/i.test(msg)) return msg;
  return `${provider.label} could not complete the run (${status}).`;
}

export type ChatPayload = {
  model: string;
  max_tokens: number;
  temperature: number;
  stream: boolean;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
};

export type RuntimeFetch =
  | { ok: true; body: ReadableStream<Uint8Array>; provider: RuntimeProvider }
  | { ok: false; error: string; status: number };

export async function fetchRuntime(
  payload: ChatPayload,
  signal?: AbortSignal,
): Promise<RuntimeFetch> {
  const providers = listRuntimeProviders();
  if (providers.length === 0) {
    return {
      ok: false,
      status: 503,
      error:
        "No open runtime bound. Set HF_TOKEN, GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, CEREBRAS_API_KEY, or OPENAI_COMPAT_BASE_URL. The house xAI key is not used.",
    };
  }
  let last: RuntimeFetch = {
    ok: false,
    status: 502,
    error: "The agent could not be reached.",
  };
  for (const provider of providers) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (provider.apiKey && provider.apiKey !== "none") {
        headers.Authorization = `Bearer ${provider.apiKey}`;
      }
      if (provider.id === "openrouter") {
        headers["HTTP-Referer"] = "https://mint-tango-apple-lotus.grok.me";
        headers["X-Title"] = "Axon";
      }
      const res = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...payload,
          model: provider.model,
        }),
        signal,
      });
      const ctype = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        last = { ok: false, status: res.status, error: humanUpstreamError(res.status, text, provider) };
        continue;
      }
      if (payload.stream) {
        if (!res.body) {
          last = { ok: false, status: 502, error: `${provider.label} returned silence.` };
          continue;
        }
        return { ok: true, body: res.body, provider };
      }
      const json = ctype.includes("json") ? await res.json() : { choices: [{ message: { content: await res.text() } }] };
      const text =
        (json as { choices?: { message?: { content?: string }; delta?: { content?: string } }[] }).choices?.[0]
          ?.message?.content ?? "";
      const encoded = new TextEncoder().encode(
        `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`,
      );
      return {
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoded);
            controller.close();
          },
        }),
        provider,
      };
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") throw err;
      last = {
        ok: false,
        status: 502,
        error: err instanceof Error ? err.message : `${provider.label} dropped.`,
      };
    }
  }
  return last;
}

export async function completeRuntime(payload: ChatPayload, signal?: AbortSignal): Promise<
  { ok: true; text: string; provider: string } | { ok: false; error: string }
> {
  const result = await fetchRuntime({ ...payload, stream: false }, signal);
  if (!result.ok) return { ok: false, error: result.error };
  const reader = result.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
  }
  buf += decoder.decode();
  for (const line of buf.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      if (!text) {
        try {
          const json = JSON.parse(buf) as { choices?: { message?: { content?: string } }[] };
          text = json.choices?.[0]?.message?.content ?? text;
        } catch {
          /* ignore */
        }
      }
      continue;
    }
    const payloadLine = trimmed.slice(5).trim();
    if (!payloadLine || payloadLine === "[DONE]") continue;
    try {
      const json = JSON.parse(payloadLine) as {
        choices?: { delta?: { content?: string }; message?: { content?: string } }[];
      };
      text += json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
    } catch {
      /* skip */
    }
  }
  if (!text.trim()) return { ok: false, error: "The agent returned silence." };
  return { ok: true, text: text.trim(), provider: result.provider.id };
}
