import { CheckCircle2, FileSignature, FolderGit2, MessagesSquare } from "lucide-react";

export function Features() {
  return (
    <section className="relative bg-background py-32 px-6 md:px-12 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground text-balance">
            Everything you need. <br />
            <span className="text-muted-foreground font-normal">Nothing you don't.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl text-balance">
            Scrunity gives you the exact tools required to take a project from agreement to completion without ever leaving the workspace.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
          
          {/* Feature 1: Contracts (Large) */}
          <div className="md:col-span-2 group relative rounded-[2rem] bg-zinc-950 border border-white/10 p-8 transition-all hover:bg-zinc-900 overflow-hidden shadow-2xl flex flex-col justify-end">
            <div className="absolute top-0 right-0 p-8 text-white/5 transition-transform group-hover:scale-110 duration-700">
              <FileSignature className="w-48 h-48" />
            </div>
            <div className="relative z-10 w-full max-w-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <FileSignature className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">Immutable Contracts</h3>
              <p className="text-zinc-400 leading-relaxed text-balance">
                Upload PDFs, request signatures, and track status. Once signed, the agreement locks in as the project's unbreakable foundation.
              </p>
            </div>
          </div>

          {/* Feature 2: Deliverables (Tall) */}
          <div className="md:row-span-2 group relative rounded-[2rem] bg-zinc-950 border border-white/10 p-8 transition-all hover:bg-zinc-900 overflow-hidden shadow-2xl flex flex-col">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white">Deliverable Tracking</h3>
            <p className="text-zinc-400 leading-relaxed text-balance">
              Milestones tied directly to the contract. Clients know exactly what is due, when it is due, and can approve work with a single click.
            </p>
            
            <div className="mt-auto pt-8">
              {/* Decorative UI element */}
              <div className="flex flex-col gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-primary/50" />
                    <div className="h-2 w-24 rounded bg-white/20" />
                  </div>
                </div>
                <div className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-inner translate-x-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border border-white/20" />
                    <div className="h-2 w-16 rounded bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Files */}
          <div className="group relative rounded-[2rem] bg-zinc-950 border border-white/10 p-8 transition-all hover:bg-zinc-900 overflow-hidden shadow-2xl flex flex-col justify-end">
            <div className="relative z-10 w-full">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <FolderGit2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">Centralized Files</h3>
              <p className="text-zinc-400 leading-relaxed text-balance">
                Stop digging through Drive folders. Everything related to the project lives right here.
              </p>
            </div>
          </div>

          {/* Feature 4: Discussions */}
          <div className="group relative rounded-[2rem] bg-zinc-950 border border-white/10 p-8 transition-all hover:bg-zinc-900 overflow-hidden shadow-2xl flex flex-col justify-end">
            <div className="relative z-10 w-full">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <MessagesSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">Contextual Discussions</h3>
              <p className="text-zinc-400 leading-relaxed text-balance">
                Comment threads attached directly to deliverables so no feedback ever gets lost.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
