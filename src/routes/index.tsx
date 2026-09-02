import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ChatView } from "@/components/ChatView";
import { CorpusBuilder } from "@/components/CorpusBuilder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Research Paper Agent — Corpus Chat with Visible Reasoning" },
      {
        name: "description",
        content:
          "Chat with an arXiv paper corpus and watch the real LangGraph reasoning trace, plus build the corpus from the UI with live ingestion progress.",
      },
      {
        property: "og:title",
        content: "Research Paper Agent — Corpus Chat with Visible Reasoning",
      },
      {
        property: "og:description",
        content:
          "Query your paper corpus and see the agent's real node-by-node thought process, from planning to citation traversal to verification.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <span className="size-2 rounded-full bg-accent" aria-hidden />
          <h1 className="flex-1 text-sm font-semibold tracking-tight">
            Research Paper Agent
          </h1>
          <button
            onClick={() => setBuilderOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <Plus className="size-3.5" />
            Build Corpus
          </button>
        </div>
      </header>

      <ChatView />
      <CorpusBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </div>
  );
}
