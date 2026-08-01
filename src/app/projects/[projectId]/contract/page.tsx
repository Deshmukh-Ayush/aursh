import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contract",
  description: "Review, upload, and sign project contracts.",
};

import { db } from "@/utils/db";
import { contract, signature, projectMember, user, project, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadContractForm } from "../../../../components/projects/contracts/upload-contract-form";
import { ContractActionButtons } from "../../../../components/projects/contracts/contract-action-buttons";

export default async function ContractPage({ params }: { params: Promise<{ projectId: string }> }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return null;

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;
  const userId = session.user.id;

  // Check role
  const member = await db.select().from(projectMember).where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));
  const role = member[0]?.role;

  // Fetch project to get orgId
  const proj = await db.select().from(project).where(eq(project.id, projectId));
  const org = await db.select().from(organization).where(eq(organization.id, proj[0].organizationId as string));
  const orgPlan = org[0]?.plan || "free";

  // Fetch contract
  const existingContracts = await db.select().from(contract).where(eq(contract.projectId, projectId));
  const activeContract = existingContracts[0];

  if (!activeContract) {
    if (role === 'owner') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Contract</h2>
          </div>
          <Card className="shadow-sm border-border/40">
            <CardHeader>
              <CardTitle>Upload Project Contract</CardTitle>
              <CardDescription>Upload a PDF contract for your client to review and sign before beginning work.</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadContractForm projectId={projectId} />
            </CardContent>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Contract</h2>
          </div>
          <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-xl bg-muted/20 border-border/40 shadow-sm">
            <div className="rounded-full bg-muted p-4 mb-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground">No Contract Yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">The project owner has not uploaded a contract yet. Please check back later.</p>
          </div>
        </div>
      );
    }
  }

  // Contract exists, fetch signatures
  const signatures = await db
    .select({
      sig: signature,
      usr: user
    })
    .from(signature)
    .innerJoin(user, eq(signature.userId, user.id))
    .where(eq(signature.contractId, activeContract.id));

  const mySignature = signatures.find(s => s.sig.userId === userId);
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Contract</h2>
          <Badge variant={
            activeContract.status === 'signed' ? 'default' : 
            activeContract.status === 'pending_signature' ? 'secondary' : 'outline'
          } className="capitalize font-medium">
            {activeContract.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden flex flex-col h-[700px] shadow-sm">
          <div className="bg-muted/50 px-4 py-3 text-sm text-muted-foreground border-b flex justify-between items-center">
            <span className="font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              {activeContract.fileName}
            </span>
            <a href={activeContract.signedDocumentUrl || activeContract.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 font-medium hover:underline">Download</a>
          </div>
          <iframe 
            src={activeContract.signedDocumentUrl || activeContract.fileUrl} 
            className="w-full flex-1 border-0" 
            title="Contract Document"
          />
        </Card>

        <div className="space-y-6">
          <Card className="h-fit shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Signatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signatures.map(s => (
                  <div key={s.sig.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <span className="text-sm font-medium">{s.usr.name}</span>
                    {s.sig.signedAt ? (
                      <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600">Signed</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Waiting</Badge>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Draft State Action */}
              {activeContract.status === 'draft' && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed flex flex-col items-center text-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Contract is currently a draft. Signatures cannot be collected until requested.
                  </p>
                  <ContractActionButtons 
                    contractId={activeContract.id} 
                    status={activeContract.status} 
                    role={role as any} 
                    hasSigned={!!mySignature?.sig.signedAt} 
                    orgPlan={orgPlan}
                  />
                </div>
              )}

              {/* Pending Signature State Action */}
              {activeContract.status === 'pending_signature' && (
                <div className="mt-6">
                  <ContractActionButtons 
                    contractId={activeContract.id} 
                    status={activeContract.status} 
                    role={role} 
                    hasSigned={!!mySignature?.sig.signedAt} 
                    orgPlan={orgPlan}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
