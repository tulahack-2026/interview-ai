"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { components } from "@/types/api";
import { interviewQueryKeys } from "@/hooks/use-interview-session";
import { completeInterview } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { InterviewScoresRadar } from "@/features/interview/components/interview-scores-radar";

type InterviewReportOut = components["schemas"]["InterviewReportOut"];

function renderUnknownList(items: unknown[]) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
      {items.map((item, i) => (
        <li key={i}>
          {typeof item === "string" ? item : JSON.stringify(item, null, 2)}
        </li>
      ))}
    </ul>
  );
}

export default function InterviewReportPage() {
  const params = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const sessionId = Number(params.sessionId);

  const cached = queryClient.getQueryData<InterviewReportOut>(
    interviewQueryKeys.report(sessionId)
  );

  const {
    data: fetched,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: interviewQueryKeys.report(sessionId),
    queryFn: () => completeInterview(sessionId),
    enabled: Number.isFinite(sessionId) && cached === undefined,
    staleTime: Infinity,
  });

  const report = cached ?? fetched;

  if (!Number.isFinite(sessionId)) {
    return (
      <p className="text-sm text-red-600">Некорректный идентификатор сессии</p>
    );
  }

  if (cached === undefined && isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <p className="text-sm text-zinc-500">Загружаем отчёт…</p>
      </div>
    );
  }

  if (cached === undefined && isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Не удалось загрузить отчёт</CardTitle>
          <CardDescription>
            {getApiErrorMessage(error, "Повторите попытку или откройте сессию из истории.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void refetch()}>
            Повторить
          </Button>
          <Link href="/interview/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Новое интервью
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Отчёт недоступен</CardTitle>
          <CardDescription>
            Не удалось получить данные. Попробуйте снова позже.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/interview/new" className={cn(buttonVariants())}>
            Новое интервью
          </Link>
        </CardContent>
      </Card>
    );
  }

  const scoreEntries = Object.entries(report.scores ?? {});
  const radarKeys = new Set([
    "overall",
    "technical_depth",
    "communication",
    "problem_solving",
  ]);
  const extraScoreEntries = scoreEntries.filter(([k]) => !radarKeys.has(k));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Итоги интервью</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Сессия #{report.session_id}
          </p>
        </div>
        <Link href="/history" className={cn(buttonVariants({ variant: "outline" }))}>
          История
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль оценок</CardTitle>
          <CardDescription>
            Сравнение по четырём критериям из отчёта API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterviewScoresRadar scores={report.scores} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Общая оценка</CardTitle>
          <CardDescription>Краткое резюме</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{report.summary_text}</p>
          {extraScoreEntries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extraScoreEntries.map(([k, v]) => (
                <Badge key={k} variant="secondary">
                  {k}: {typeof v === "number" ? v : String(v)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Рекомендации</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(report.recommendations) &&
              renderUnknownList(report.recommendations as unknown[])}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Слабые зоны</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(report.weak_areas) &&
              renderUnknownList(report.weak_areas as unknown[])}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">План подготовки</CardTitle>
          <CardDescription>Персональные шаги</CardDescription>
        </CardHeader>
        <CardContent>
          {Array.isArray(report.study_plan) &&
            renderUnknownList(report.study_plan as unknown[])}
        </CardContent>
      </Card>

      <Link href="/interview/new" className={cn(buttonVariants())}>
        Новое интервью
      </Link>
    </div>
  );
}
