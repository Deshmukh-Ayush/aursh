"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ContractGate({ 
  isSigned, 
  projectId, 
  children 
}: { 
  isSigned: boolean, 
  projectId: string, 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isContractRoute = pathname.endsWith(`/projects/${projectId}/contract`);

  useEffect(() => {
    if (!isSigned && !isContractRoute) {
      router.push(`/projects/${projectId}/contract`);
    }
  }, [isSigned, isContractRoute, projectId, router]);

  // Prevent flash of unauthorized content
  if (!isSigned && !isContractRoute) {
    return null; 
  }

  return children;
}
