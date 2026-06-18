export default function DeliverablesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center rounded-xl border border-dashed bg-muted/10">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold">Deliverables</h3>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Track project milestones and sign off on completed deliverables. Coming soon in Day 5!
      </p>
    </div>
  );
}
