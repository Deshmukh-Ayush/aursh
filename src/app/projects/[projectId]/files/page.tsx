import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { files, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { FilesVaultClient } from "@/components/projects/files/files-vault-client";

export const metadata: Metadata = {
  title: "Files",
  description: "Upload and manage project files and deliverable attachments.",
};

async function FilesData({ projectId }: { projectId: string }) {
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

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <FilesData projectId={projectId} />
    </Suspense>
  );
}
