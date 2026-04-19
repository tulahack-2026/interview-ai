"use client";

import * as React from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const METRICS = [
  { key: "overall", label: "Общая" },
  { key: "technical_depth", label: "Тех. глубина" },
  { key: "communication", label: "Коммуникация" },
  { key: "problem_solving", label: "Задачи" },
] as const;

function coerceScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

const chartConfig = {
  score: {
    label: "Баллы",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function InterviewScoresRadar({
  scores,
}: {
  scores: Record<string, unknown> | null | undefined;
}) {
  const chartData = React.useMemo(
    () =>
      METRICS.map(({ key, label }) => ({
        key,
        label,
        score: coerceScore(scores?.[key]),
      })),
    [scores]
  );

  const maxDomain = React.useMemo(() => {
    const peak = Math.max(...chartData.map((d) => d.score), 1);
    return Math.max(10, Math.ceil(peak));
  }, [chartData]);

  return (
    <div className="space-y-4">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[min(320px,85vw)] w-full max-w-md"
        initialDimension={{ width: 360, height: 360 }}
      >
        <RadarChart data={chartData} outerRadius="75%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <PolarGrid className="stroke-border" radialLines />
          <PolarAngleAxis dataKey="label" tickLine={false} tick={{ fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxDomain]}
            tickCount={5}
            tickLine={false}
            axisLine={false}
            className="text-[10px] text-muted-foreground"
          />
          <Radar
            name="score"
            dataKey="score"
            stroke="var(--color-score)"
            fill="var(--color-score)"
            fillOpacity={0.35}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </RadarChart>
      </ChartContainer>
      <dl className="grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
        {chartData.map(({ key, label, score }) => (
          <div key={key} className="rounded-lg border border-border/60 bg-muted/30 px-2 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono text-base font-semibold tabular-nums text-foreground">
              {score}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
