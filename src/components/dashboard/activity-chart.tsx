"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function ActivityChart({ data }: { data: { date: string; actions: number }[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalActions = data.reduce((acc, curr) => acc + curr.actions, 0);

  return (
    <Card className="shadow-[0_2px_10px_rgba(0,0,0,0.04)] border-border/40 md:col-span-2 lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Activity Overview (Last 14 Days)</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {!isMounted ? (
          <div className="h-45 w-full mt-4 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
            Loading activity chart...
          </div>
        ) : totalActions === 0 ? (
          <div className="h-45 w-full mt-4 flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
            <Activity className="h-5 w-5 mb-1.5 opacity-50" />
            <span>No activity recorded in the last 14 days</span>
          </div>
        ) : (
          <div className="h-45 min-h-[180px] w-full mt-4 text-foreground dark:text-muted-foreground">
            <ResponsiveContainer width="100%" height="100%" minHeight={180} minWidth={100}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  itemStyle={{ color: "currentColor", fontSize: "12px", fontWeight: "bold" }}
                  labelStyle={{ color: "currentColor", fontSize: "12px", marginBottom: "4px" }}
                />
                <Bar
                  dataKey="actions"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
