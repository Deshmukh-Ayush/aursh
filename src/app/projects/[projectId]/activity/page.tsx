export default function ActivityPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center rounded-xl border border-dashed bg-muted/10">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold">Activity Log</h3>
      <p className="text-muted-foreground mt-2 max-w-sm">
        A complete audit trail of all project events, file uploads, and contract signatures. Coming soon in Day 5!
      </p>
    </div>
  );
}
