"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
type OrgLike = { name?: string | null; logoUrl?: string | null };
type SidebarBrandProps = {
    projectName: string;
    org?: OrgLike;
    canWhitelabel: boolean;
    isCollapsed: boolean;
};
export function SidebarBrand({
    projectName,
    org,
    canWhitelabel,
    isCollapsed,
}: SidebarBrandProps) {
    return (
        <Link
            href="/dashboard"
            className="flex items-center gap-2 min-w-0 group outline-none flex-1"
        >
            {" "}
            <div
                className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md bg-foreground/6 shrink-0 group-hover:bg-foreground/10 transition-colors",
                    isCollapsed && "mx-auto",
                )}
            >
                {" "}
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />{" "}
            </div>{" "}
            {!isCollapsed &&
                (canWhitelabel && org?.logoUrl ? (
                    <div className="flex items-center gap-2 shrink-0">
                        <Image
                        src={org.logoUrl}
                        alt={org.name || projectName}
                        className="h-8 w-auto object-contain max-w-30 rounded-[3px]"
                        width={100}
                        height={100}
                    />
                    <span>{org.name || projectName}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 shrink-0">
                        {" "}
                        <Image
                            width={100}
                            height={100}
                            src="/logo/scrunity_logo_svg.svg"
                            alt="Scrunity"
                            className="h-8 w-auto object-contain dark:invert"
                        />{" "}
                        <span className="text-[13px] font-semibold truncate text-foreground">
                            {" "}
                            {projectName}{" "}
                        </span>{" "}
                    </div>
                ))}{" "}
        </Link>
    );
}
