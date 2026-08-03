import type { LucideIcon } from "lucide-react";
import {
    Activity,
    CheckSquare,
    FileText,
    Files,
    LayoutDashboard,
    MessageSquare,
    Settings,
    FileSignature,
    CreditCard,
} from "lucide-react";

export type NavItem = { name: string; href: string; icon: LucideIcon };

export const mainNavItems: NavItem[] = [
    { name: "Overview", href: "", icon: LayoutDashboard },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Proposal", href: "/proposal", icon: FileSignature },
    { name: "Deliverables", href: "/deliverables", icon: CheckSquare },
    { name: "Files", href: "/files", icon: Files },
    { name: "Contract", href: "/contract", icon: FileText },
];

export const secondaryNavItems: NavItem[] = [
    { name: "Discussions", href: "/discussions", icon: MessageSquare },
    { name: "Activity", href: "/activity", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
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
