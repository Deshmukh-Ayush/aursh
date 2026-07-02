import Link from "next/link";
import { Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black py-16 px-6 md:px-12 border-t border-white/10">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-400">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <span>&copy; {new Date().getFullYear()} Scrunity. Open-source client collaboration.</span>
        </div>
        
        <div className="flex items-center gap-8 text-sm font-medium text-zinc-500">
          <Link href="https://github.com/Deshmukh-Ayush/Scrunity" target="_blank" className="hover:text-white transition-colors">GitHub</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
