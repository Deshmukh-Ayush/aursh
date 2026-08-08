"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  FilePdfIcon,
  FileImageIcon,
  FileZipIcon,
  FileCodeIcon,
  FileIcon,
  DownloadSimpleIcon,
  TrashIcon,
  UploadSimpleIcon,
  FolderSimpleIcon
} from "@phosphor-icons/react";
import { FilesStorageChart } from "./files-storage-chart";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FileItem = {
  file: {
    id: string;
    name: string;
    size: number;
    url: string;
    createdAt: Date;
  };
  uploader: {
    name: string | null;
  };
};

type FilesVaultClientProps = {
  projectId: string;
  files: FileItem[];
};

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function FilesVaultClient({ projectId, files }: FilesVaultClientProps) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const res = await axios.post('/api/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("File uploaded to vault");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const getFileConfig = (fileName: string) => {
    if (/\.(pdf)$/i.test(fileName)) {
      return { Icon: FilePdfIcon, color: "text-red-500", tag: "PDF" };
    }
    if (/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(fileName)) {
      return { Icon: FileImageIcon, color: "text-emerald-500", tag: "IMG" };
    }
    if (/\.(zip|rar|tar|gz)$/i.test(fileName)) {
      return { Icon: FileZipIcon, color: "text-amber-500", tag: "ZIP" };
    }
    if (/\.(js|ts|json|py|html|css)$/i.test(fileName)) {
      return { Icon: FileCodeIcon, color: "text-purple-500", tag: "CODE" };
    }
    return { Icon: FileIcon, color: "text-sky-500", tag: "FILE" };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full pb-20 antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-foreground text-balance leading-tight">
            Project Files
          </h1>
        </div>

        <div className="relative self-start sm:self-auto">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            aria-label="Upload file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <button
            disabled={isUploading}
            className="active:scale-[0.96] transition-transform h-9 px-4 rounded-full bg-[#00AAF7] text-white font-semibold text-sm flex items-center gap-1.5"
          >
            <UploadSimpleIcon className="w-5 h-5 stroke-3" />
            <span>{isUploading ? "Uploading..." : "Upload File"}</span>
          </button>
        </div>
      </div>

      {/* EvilCharts Files Storage Vault Chart */}
      <FilesStorageChart files={files} />

      {/* Vaulted Files List Section */}
      <section aria-label="Project Files Vault" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground text-balance">
            All Vaulted Files (<span className="tabular-nums">{files.length}</span>)
          </h2>
        </div>

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
              <FolderSimpleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground tracking-tight text-balance">No Files Uploaded Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed text-pretty">
              Upload documents, media assets, design mockups, or code deliverables to share instantly with project members.
            </p>
          </div>
        ) : (
          <div>
            {files.map(({ file, uploader }, index) => {
              const fileConfig = getFileConfig(file.name);
              const FileTypeIcon = fileConfig.Icon;
              const dateObj = new Date(file.createdAt);

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors rounded-md"
                >
                  {/* Left: Icon, File Name & Tag */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileTypeIcon className={`w-5 h-5 shrink-0 ${fileConfig.color}`} />

                    <span className="text-sm font-medium tracking-tight text-foreground truncate max-w-60 sm:max-w-md text-balance">
                      {file.name}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-muted/60 text-muted-foreground border border-border/30 shrink-0">
                      {fileConfig.tag}
                    </span>
                  </div>

                  {/* Right: File Size, Uploader, Date & Actions */}
                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 ml-8 sm:ml-0">
                    <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                      Uploaded by <span className="font-semibold text-foreground">{uploader.name || "User"}</span>
                    </div>

                    <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {format(dateObj, "dd MMM")}
                    </div>

                    <div className="text-sm font-semibold tabular-nums tracking-tight min-w-16 text-right">
                      {formatBytes(file.size)}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <a
                        href={file.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 h-7 px-3 text-[12px] font-medium rounded-full bg-[#00AAF7] text-white hover:bg-[#0088c4] transition-colors active:scale-[0.96]"
                        aria-label={`Download file ${file.name}`}
                      >
                        <DownloadSimpleIcon className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
