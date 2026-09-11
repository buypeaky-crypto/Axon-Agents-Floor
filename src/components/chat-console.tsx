import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { AgentSigil } from "@/components/agent-sigil";
import { Button } from "@/components/ui/button";
import { ChatRequestError, streamAgentChat } from "@/lib/chat-stream";
import { isUnauthorized } from "@/lib/is-unauthorized";
import type { AgentRecord, AgentSummary, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChatConsole({
  agent,
  purchased,
  onNeedSignIn,
  onAcquire,
}: {
  agent: Pick<AgentRecord, "id" | "slug" | "name" | "sigil" | "tagline"> | AgentSummary;
  purchased: boolean;
  onNeedSignIn?: () => void;
  onAcquire?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, streaming]);

  async function send() {
    const text = draft.trim();
    if (!text || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    setPending(true);
    setStreaming(false);
    let started = false;
    try {
      await streamAgentChat(agent.id, next, (event) => {
        if (event.type === "delta") {
          started = true;
          setStreaming(true);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [...prev.slice(0, -1), { role: "assistant", content: last.content + event.text }];
            }
            return [...prev, { role: "assistant", content: event.text }];
          });
        }
        if (event.type === "error") {
          if (event.trialSpent) onAcquire?.();
          toast.error(event.error);
        }
      });
      if (!started) {
        toast.error("The agent returned silence.");
      }
    } catch (err) {
      if (err instanceof ChatRequestError) {
        if (err.status === 401 || isUnauthorized(err)) {
          onNeedSignIn?.();
          toast.error("Sign in to run this agent.");
          return;
        }
        if (err.trialSpent) onAcquire?.();
        toast.error(err.message);
        return;
      }
      if (isUnauthorized(err)) {
        onNeedSignIn?.();
        toast.error("Sign in to run this agent.");
        return;
      }
      toast.error(err instanceof Error ? err.message : "The run failed.");
    } finally {
      setPending(false);
      setStreaming(false);
    }
  }

  return (
    <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <AgentSigil seed={agent.slug} letter={agent.sigil} className="size-10" />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-medium">{agent.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {purchased ? "Full run" : "Trial · three turns"}
          </p>
        </div>
      </div>
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">{agent.tagline}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground",
              )}
            >
              {m.content}
              {streaming && i === messages.length - 1 && m.role === "assistant" ? (
                <span className="ml-0.5 inline-block h-3 w-px translate-y-px bg-foreground/70" />
              ) : null}
            </div>
          </div>
        ))}
        {pending && !streaming && (
          <p className="shimmer-text text-sm text-muted-foreground">Thinking</p>
        )}
      </div>
      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder={`Ask ${agent.name}…`}
          className="min-h-11 flex-1 resize-none rounded-lg bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-subtle focus-visible:shadow-[0_0_0_1px_rgb(216_212_200/0.55)]"
        />
        <Button type="submit" size="icon" disabled={pending || !draft.trim()} aria-label="Send">
          <ArrowUp className="size-4" />
        </Button>
      </form>
    </div>
  );
}
