import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThoughtProcess } from "./ThoughtProcess";
import { runResearch, IS_DEMO, type TraceStep } from "@/lib/agent-stream";

type Turn = {
  id: string;
  question: string;
  steps: TraceStep[];
  answer?: string;
  error?: string;
  running: boolean;
};

/** Renders markdown-ish answer text with [paper_id] citation pills. */
function AnswerBody({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-3 text-sm leading-6">
      {markdown.split("\n\n").map((para, i) => (
        <p key={i}>
          {para.split(/(\[[\w.\-/]+\]|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
            if (/^\[[\w.\-/]+\]$/.test(part))
              return (
                <span
                  key={j}
                  className="mx-0.5 inline-flex cursor-default items-center rounded-full border border-accent/60 px-1.5 py-px font-mono text-[10px] text-accent"
                >
                  {part.slice(1, -1)}
                </span>
              );
            if (/^\*\*[^*]+\*\*$/.test(part))
              return (
                <strong key={j} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            if (/^`[^`]+`$/.test(part))
              return (
                <code
                  key={j}
                  className="rounded bg-panel-raised px-1 py-px font-mono text-[11px] text-accent"
                >
                  {part.slice(1, -1)}
                </code>
              );
            return <span key={j}>{part}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-border bg-panel">
        <Sparkles className="size-5 text-accent" />
      </span>
      <h2 className="mt-5 text-lg font-semibold">Ask the corpus</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Every answer comes with the real LangGraph node trace behind it —
        planning, retrieval, evaluation, citation traversal and verification.
      </p>
    </div>
  );
}

export function ChatView() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const busy = turns.some((t) => t.running);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<(() => void) | null>(null);

  useEffect(() => composer.current?.focus(), []);
  useEffect(() => () => abort.current?.(), []);
  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  const send = () => {
    const question = input.trim();
    if (!question || busy) return;
    const id = crypto.randomUUID();
    setInput("");
    setTurns((prev) => [
      ...prev,
      { id, question, steps: [], running: true },
    ]);

    const patch = (fn: (t: Turn) => Turn) =>
      setTurns((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));

    abort.current = runResearch(question, (event) => {
      if (event.type === "step") {
        patch((t) => ({
          ...t,
          steps: [
            ...t.steps.map((s) => ({ ...s, status: "done" as const })),
            { ...event.step, status: "active" as const },
          ],
        }));
      } else if (event.type === "answer") {
        patch((t) => ({
          ...t,
          answer: event.markdown,
          steps: t.steps.map((s) => ({ ...s, status: "done" as const })),
        }));
      } else if (event.type === "error") {
        patch((t) => ({ ...t, error: event.message, running: false }));
      } else {
        patch((t) => ({
          ...t,
          running: false,
          steps: t.steps.map((s) => ({ ...s, status: "done" as const })),
        }));
      }
    });
    requestAnimationFrame(() => composer.current?.focus());
  };

  return (
    <>
      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-10">
          {turns.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-10">
              {turns.map((turn) => (
                <div key={turn.id} className="space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] animate-[bubble-in_260ms_ease-out] rounded-2xl rounded-br-sm border border-border bg-panel-raised px-4 py-2.5 text-sm">
                      {turn.question}
                    </div>
                  </div>
                  <div>
                    <ThoughtProcess steps={turn.steps} running={turn.running} />
                    {turn.answer && (
                      <div className="animate-[bubble-in_260ms_ease-out] rounded-2xl rounded-tl-sm border border-border bg-panel px-4 py-3.5">
                        <AnswerBody markdown={turn.answer} />
                      </div>
                    )}
                    {turn.error && (
                      <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {turn.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-5 py-4">
          <div
            className={cn(
              "flex items-end gap-2 rounded-2xl border border-border bg-panel px-3 py-2 transition-colors focus-within:border-accent",
            )}
          >
            <textarea
              ref={composer}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a question about the corpus…"
              className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send question"
              className="mb-1 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {IS_DEMO
              ? "Demo trace — set VITE_AGENT_API_URL to stream real LangGraph node events."
              : "Streaming live LangGraph node events."}
          </p>
        </div>
      </div>
    </>
  );
}
