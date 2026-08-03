// Shared UI primitives for the internal developer docs page.
// Extracted from docs/page.tsx to reduce component size.

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-[20px] font-bold tracking-tight text-foreground mb-4 pb-2.5 border-b border-border/40">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[14px] font-semibold text-foreground/90 mt-6 mb-2 tracking-tight">
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-[1.75] text-muted-foreground mb-3 text-pretty">
      {children}
    </p>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[12.5px] font-mono bg-muted/50 px-1.5 py-0.5 rounded-md text-foreground">
      {children}
    </code>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-[12.5px] font-mono bg-muted/20 border border-border/40 rounded-[10px] p-4 overflow-x-auto leading-[1.7] text-foreground/90 my-3">
      <code>{children}</code>
    </pre>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3 rounded-[10px] border border-border/40">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80 border-b border-border/40 bg-muted/10 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="group hover:bg-muted/10 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`py-2 px-3.5 ${ri < rows.length - 1 ? 'border-b border-border/30' : ''} ${ci === 0 ? 'text-foreground font-medium whitespace-nowrap font-mono text-[12.5px]' : 'text-muted-foreground text-[13px]'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[13px] leading-[1.6] text-amber-600 dark:text-amber-500">
      <strong className="font-semibold text-amber-700 dark:text-amber-400">Note: </strong>
      <span className="text-amber-700/80 dark:text-amber-400/80">{children}</span>
    </div>
  );
}
