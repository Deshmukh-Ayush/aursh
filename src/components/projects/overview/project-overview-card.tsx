type ProjectOverviewCardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md";
};

export function ProjectOverviewCard({
  children,
  className = "",
  padding = "md",
}: ProjectOverviewCardProps) {
  const paddingClass = padding === "sm" ? "p-4" : "p-5";

  return (
    <div
      className={`rounded-xl bg-background shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.04)] ${paddingClass} ${className}`}
    >
      {children}
    </div>
  );
}
