import { db } from "@/utils/db";
import { files, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { UploadFileButton } from "./upload-file-button";
import { Card, CardContent } from "@/components/ui/card";
import { FileIcon, Download, FileText } from "lucide-react";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Files</h1>
          <p className="text-muted-foreground mt-1">
            Upload and share files with your project members.
          </p>
        </div>
        <UploadFileButton projectId={projectId} />
      </div>

      {projectFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-muted/10">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No files uploaded yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Any project member can upload files here. Uploads are shared instantly.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projectFiles.map(({ file, uploader }) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 sm:px-6">
                  <div className="flex items-center gap-4 truncate">
                    <div className="bg-muted p-2 rounded-lg flex-shrink-0">
                      <FileIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>Uploaded by {uploader.name}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={file.url} 
                    download 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors ml-4 flex-shrink-0 bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-md"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
