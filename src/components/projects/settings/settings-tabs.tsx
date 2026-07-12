"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Settings, Users, ShieldAlert } from "lucide-react";

export function SettingsTabs({ children }: { children: React.ReactNode[] }) {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'advanced', label: 'Advanced', icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12">
      <aside className="w-full md:w-56 shrink-0">
        <nav className="flex md:flex-col gap-1 md:gap-1.5 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] whitespace-nowrap",
                  isActive 
                    ? "bg-foreground/5 text-foreground shadow-sm" 
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-60")} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>
      
      <main className="flex-1 max-w-3xl min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both" key={activeTab}>
          {children[activeTab]}
        </div>
      </main>
    </div>
  );
}
