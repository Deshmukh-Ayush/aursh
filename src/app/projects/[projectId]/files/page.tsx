import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Files",
  description: "Upload and manage project files and deliverable attachments.",
};

import { db } from "@/utils/db";
import { files, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FilesVaultClient } from "@/components/projects/files/files-vault-client";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return redirect("/sign-in");

  const { projectId } = await params;

  const projectFiles = await db
    .select({
      file: files,
      uploader: user,
    })
    .from(files)
    .innerJoin(user, eq(files.uploadedBy, user.id))
    .where(eq(files.projectId, projectId))
    .orderBy(desc(files.createdAt));

  return <FilesVaultClient projectId={projectId} files={projectFiles} />;
}
