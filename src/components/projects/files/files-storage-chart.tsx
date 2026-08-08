"use client";

import {
  EChartsRadialChart,
  type ChartConfig,
} from "@/components/evilcharts/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";
import { FolderSimpleIcon } from "@phosphor-icons/react";

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

type FilesStorageChartProps = {
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

export function FilesStorageChart({ files }: FilesStorageChartProps) {
  const totalCount = files.length;
  const totalSizeBytes = files.reduce((sum, f) => sum + (f.file.size || 0), 0);

  const isDoc = (name: string) => /\.(pdf|doc|docx|txt|rtf)$/i.test(name);
  const isImage = (name: string) => /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(name);
  const isCodeOrArchive = (name: string) => /\.(zip|rar|tar|gz|js|ts|json|py|html|css)$/i.test(name);

  const docSizeBytes = files.filter((f) => isDoc(f.file.name)).reduce((sum, f) => sum + f.file.size, 0);
  const imgSizeBytes = files.filter((f) => isImage(f.file.name)).reduce((sum, f) => sum + f.file.size, 0);
  const codeSizeBytes = files.filter((f) => isCodeOrArchive(f.file.name)).reduce((sum, f) => sum + f.file.size, 0);
  const otherSizeBytes = Math.max(0, totalSizeBytes - docSizeBytes - imgSizeBytes - codeSizeBytes);

  const calcPercent = (bytes: number) => {
    if (totalSizeBytes <= 0) return 0;
    return Math.round((bytes / totalSizeBytes) * 100);
  };

  const chartData = [
    {
      name: "documents",
      label: "PDFs & Documents",
      value: calcPercent(docSizeBytes),
      count: files.filter((f) => isDoc(f.file.name)).length,
      sizeText: formatBytes(docSizeBytes),
      swatch: "bg-sky-500 dark:bg-sky-400",
    },
    {
      name: "images",
      label: "Images & Media",
      value: calcPercent(imgSizeBytes),
      count: files.filter((f) => isImage(f.file.name)).length,
      sizeText: formatBytes(imgSizeBytes),
      swatch: "bg-emerald-500 dark:bg-emerald-400",
    },
    {
      name: "code",
      label: "Code & Archives",
      value: calcPercent(codeSizeBytes),
      count: files.filter((f) => isCodeOrArchive(f.file.name)).length,
      sizeText: formatBytes(codeSizeBytes),
      swatch: "bg-purple-600 dark:bg-purple-600",
    },
    {
      name: "others",
      label: "Other Attachments",
      value: calcPercent(otherSizeBytes),
      count: files.filter((f) => !isDoc(f.file.name) && !isImage(f.file.name) && !isCodeOrArchive(f.file.name)).length,
      sizeText: formatBytes(otherSizeBytes),
      swatch: "bg-amber-500 dark:bg-amber-400",
    },
  ];

  const chartConfig = {
    documents: {
      label: "PDFs & Documents",
      colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] },
    },
    images: {
      label: "Images & Media",
      colors: { light: ["#10b981"], dark: ["#34d399"] },
    },
    code: {
      label: "Code & Archives",
      colors: { light: ["#9333ea"], dark: ["#9333ea"] },
    },
    others: {
      label: "Other Attachments",
      colors: { light: ["#f59e0b"], dark: ["#fbbf24"] },
    },
  } satisfies ChartConfig;

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <span className="flex items-center gap-1 text-[12px] font-medium dark:text-neutral-400 py-0.5">
        <FolderSimpleIcon className="h-5 w-5 text-sky-500" /> Storage Vault & Attachment Breakdown
      </span>
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950">
        {/* Header Section */}
        <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-border/20 mb-6">
          <div>
            <span className="text-[18px] font-semibold block dark:text-neutral-300">
              Total Storage Vault
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {totalCount} file{totalCount !== 1 ? "s" : ""} uploaded across team & clients
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground font-medium block">Total Storage</span>
            <span className="text-[18px] font-semibold tabular-nums dark:text-neutral-200">
              {formatBytes(totalSizeBytes)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Radial Charts */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative py-1">
            <div className="flex items-center justify-between gap-2 px-2 w-full max-w-xs">
              {chartData.slice(0, 3).map((row) => (
                <div key={row.name} className="flex flex-col items-center gap-1.5">
                  <div className="aspect-square w-14 h-14">
                    <EChartsRadialChart
                      data={[row]}
                      config={chartConfig}
                      nameKey="name"
                      max={100}
                      innerRadius="70%"
                      outerRadius="100%"
                      className="h-full w-full"
                    >
                      <EChartsRadialChart.RadialBar
                        dataKey="value"
                        barSize={7}
                        cornerRadius={6}
                      />
                    </EChartsRadialChart>
                  </div>
                  <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">
                    {row.label.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown Rows */}
          <div className="md:col-span-7 flex flex-col gap-1.5">
            {chartData.map(({ name, label, value, sizeText, swatch }, index) => (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors",
                  index % 2 === 0
                    ? "bg-muted/20 hover:bg-muted/40"
                    : "hover:bg-muted/20"
                )}
              >
                <span className={cn("size-3 shrink-0 rounded-xs", swatch)} />

                <span className="min-w-[3.5ch] text-xs font-bold text-foreground tabular-nums">
                  {value}%
                </span>

                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>

                <span className="ml-auto text-xs font-semibold text-foreground tabular-nums">
                  {sizeText}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
