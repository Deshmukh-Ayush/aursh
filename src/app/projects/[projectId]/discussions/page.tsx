export default function DiscussionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center rounded-xl border border-dashed bg-muted/10">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold">Discussions</h3>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Centralized communication for the project. Say goodbye to scattered email threads! Coming soon in Day 5!
      </p>
    </div>
  );
}
