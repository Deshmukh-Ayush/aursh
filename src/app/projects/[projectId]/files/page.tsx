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
import { getProjectAccess } from "@/lib/project-auth";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session || !session.user) return redirect("/sign-in");

  const { projectId } = await params;

  const { proj, isAuthorized } = await getProjectAccess(projectId, session.user.id);
  if (!isAuthorized || !proj) return redirect("/dashboard");

  const projectFiles = await db
    .select({
      file: files,
      uploader: user,
    })
    .from(files)
    .innerJoin(user, eq(files.uploadedBy, user.id))
    .where(eq(files.projectId, projectId))
    .orderBy(desc(files.createdAt));

  const filesForClient = projectFiles.map(({ file, uploader }) => ({
    file: { ...file, url: `/api/files/download?fileId=${encodeURIComponent(file.id)}` },
    uploader,
  }));
  return <FilesVaultClient projectId={projectId} files={filesForClient} />;
}
