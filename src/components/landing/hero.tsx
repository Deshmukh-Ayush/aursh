import { ArrowRight, FileSignature, Folder, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 text-center pt-20">
      {/* Dynamic ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 opacity-30 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          The single source of truth
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-balance leading-[1.05] text-foreground drop-shadow-sm">
          Where agreements <br />
          <span className="font-serif italic text-muted-foreground/80 pr-2 font-normal">become projects.</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground text-balance font-medium mt-4">
          Replace the chaos of Slack, Drive, and DocuSign with a single, immutable workspace for your agency and clients.
        </p>
        
        <div className="flex items-center gap-4 mt-8">
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base active:scale-[0.96] transition-transform shadow-xl shadow-primary/20 group">
            <Link href="/sign-in">
              Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Signature Animated Visual: Fragmentation to Unification */}
      <div className="relative z-10 mt-20 flex w-full max-w-5xl flex-col items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
        <div className="relative w-full h-[400px] flex items-center justify-center">
          
          {/* Central Scrunity Workspace */}
          <div className="absolute z-20 w-80 rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-700 hover:scale-[1.02] flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <FileSignature className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-white">MSA & SOW</span>
                <span className="text-xs text-primary font-medium">Signed & Active</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Deliverables</span>
                <span>2/5 Completed</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-2/5 bg-primary rounded-full" />
              </div>
            </div>
          </div>

          {/* Orbiting Fragmented Tools (Decorative) */}
          <div className="absolute w-full max-w-[600px] aspect-square rounded-full border border-white/5 border-dashed animate-[spin_60s_linear_infinite] opacity-50">
            {/* Tool 1 */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 shadow-xl animate-[spin_60s_linear_infinite_reverse]">
              <MessageSquare className="h-5 w-5 text-zinc-400" />
            </div>
            {/* Tool 2 */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 shadow-xl animate-[spin_60s_linear_infinite_reverse]">
              <Folder className="h-5 w-5 text-zinc-400" />
            </div>
            {/* Tool 3 */}
            <div className="absolute top-1/2 -left-6 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 shadow-xl animate-[spin_60s_linear_infinite_reverse]">
              <FileSignature className="h-5 w-5 text-zinc-400" />
            </div>
          </div>

          {/* Connection Lines (Gradient) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_70%)]" />

        </div>
      </div>
    </section>
  );
}
