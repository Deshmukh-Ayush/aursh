"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function CompletionChart({ projects }: { projects: any[] }) {
  let total = 0;
  let approved = 0;

  projects.filter(p => p.proj.status === 'active').forEach(p => {
    total += p.deliverables.length;
    approved += p.deliverables.filter((d: any) => d.status === 'approved').length;
  });

  const percentage = total === 0 ? 0 : Math.round((approved / total) * 100);
  const data = [
    { name: "Approved", value: approved },
    { name: "Pending", value: total - approved }
  ];

  // Colors: primary for approved, muted for pending
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <Card className="shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-border/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[120px] flex flex-col items-center justify-center text-muted-foreground mt-4">
            <span className="text-3xl font-bold">0%</span>
            <span className="text-xs mt-1">No deliverables</span>
          </div>
        ) : (
          <div className="h-[140px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <Label
                    value={`${percentage}%`}
                    position="center"
                    className="fill-foreground font-bold text-xl"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
