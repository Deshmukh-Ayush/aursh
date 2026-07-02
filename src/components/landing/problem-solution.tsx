import { ArrowRightLeft, FileText, Link2, MessageSquareText, ShieldCheck } from "lucide-react";

export function ProblemSolution() {
  return (
    <section className="relative bg-black py-32 px-6 md:px-12 border-t border-white/5 overflow-hidden">
      <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-primary/10 opacity-20 blur-[100px] pointer-events-none" />
      
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white text-balance">
            Stop fighting fragmented workflows.
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto text-balance">
            When your deliverables live in Trello, your files in Drive, your communication in Slack, and your contracts in DocuSign—project scope is guaranteed to become disputed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* The Problem */}
          <div className="space-y-6 opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-12 border-t border-zinc-700" />
              <span className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">The Old Way</span>
            </div>
            
            <div className="grid gap-4">
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-zinc-500" />
                <span className="text-zinc-300">"Where is the latest signed SOW?"</span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-sm ml-4">
                <Link2 className="h-5 w-5 text-zinc-500" />
                <span className="text-zinc-300">"Can you reshare that Drive link?"</span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4 backdrop-blur-sm ml-8">
                <MessageSquareText className="h-5 w-5 text-zinc-500" />
                <span className="text-zinc-300">"I approved this on Slack yesterday."</span>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div className="space-y-6 relative">
            <div className="absolute -left-6 lg:-left-12 top-1/2 -translate-y-1/2 hidden md:block">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 border-t border-primary/50" />
              <span className="text-sm font-semibold tracking-widest text-primary uppercase">The Scrunity Way</span>
            </div>
            
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <ShieldCheck className="h-6 w-6 text-primary/40" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">The Immutable Workspace</h3>
              <ul className="space-y-4 text-zinc-400">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p>Agreements are signed directly in the platform.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p>Deliverable timelines are automatically generated from the signed contract.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p>Every file, comment, and approval is traced back to the original agreement.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
