import type { LucideIcon } from "lucide-react";
import { AppWindowIcon, ChatCircleTextIcon, CheckCircleIcon, CreditCardIcon, FilesIcon, GearSixIcon, NotebookIcon, PulseIcon, ScrollIcon  } from "@phosphor-icons/react";

export type NavItem = { name: string; href: string; icon: LucideIcon };

export const mainNavItems: NavItem[] = [
    { name: "Overview", href: "", icon: AppWindowIcon },
    { name: "Payments", href: "/payments", icon: CreditCardIcon  },
    { name: "Proposal", href: "/proposal", icon: ScrollIcon },
    { name: "Deliverables", href: "/deliverables", icon: CheckCircleIcon },
    { name: "Files", href: "/files", icon: FilesIcon },
    { name: "Contract", href: "/contract", icon: NotebookIcon },
];

export const secondaryNavItems: NavItem[] = [
    { name: "Discussions", href: "/discussions", icon: ChatCircleTextIcon },
    { name: "Activity", href: "/activity", icon: PulseIcon },
    { name: "Settings", href: "/settings", icon: GearSixIcon },
];

export const unreadTypeMap: Record<string, string[]> = {
    "/payments": ["payment_requested", "payment_completed", "payment_overdue", "milestone_created"],
    "/deliverables": [
        "deliverable_created",
        "deliverable_approved",
        "revision_requested",
        "deliverable_completed",
        "deliverable_in_review",
    ],
    "/proposal": ["proposal_sent", "proposal_accepted", "proposal_declined"],
    "/files": ["file_uploaded"],
    "/contract": ["contract_uploaded", "contract_signed"],
    "/discussions": ["comment_added"],
    "/activity": ["project_completed", "member_joined"],
};
