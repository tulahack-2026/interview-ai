"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgressSummary } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { interviewQueryKeys } from "@/hooks/use-interview-session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: interviewQueryKeys.progressSummary,
    queryFn: getProgressSummary,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [isError, error]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Тренируйте интервью с AI: выберите направление, уровень и формат — и
            получите разбор ответов и план роста.
          </p>
        </div>
        <Link
          href="/interview/new"
          className={cn(buttonVariants({ size: "lg" }), "inline-flex gap-2")}
        >
          Начать интервью
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              Прогресс
            </CardTitle>
            <CardDescription>Сводка по завершённым сессиям</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {!isLoading && data && (
              <>
                <div>
                  <p className="text-sm text-zinc-500">Завершено сессий</p>
                  <p className="text-3xl font-semibold tabular-nums">
                    {data.sessions_completed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Средняя оценка</p>
                  <p className="text-3xl font-semibold tabular-nums">
                    {data.average_overall_score != null
                      ? data.average_overall_score.toFixed(1)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-zinc-500">Частые слабые зоны</p>
                  <ul className="space-y-1">
                    {data.common_weak_areas.length === 0 && (
                      <li className="text-sm text-zinc-500">Пока нет данных</li>
                    )}
                    {data.common_weak_areas.map((a) => (
                      <li key={a} className="text-sm text-muted-foreground break-words leading-snug">
                        • {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Как это работает
            </CardTitle>
            <CardDescription>Коротко о сценарии</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              1. Настройте направление (Backend, Frontend, QA, DevOps), уровень и
              режим: техническое, HR или смешанное.
            </p>
            <p>
              2. Отвечайте на вопросы по одному — AI уточняет и углубляется по
              ходу диалога.
            </p>
            <p>
              3. После сессии получите оценку, рекомендации и персональный план
              подготовки.
            </p>
            <Link
              href="/history"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 inline-flex w-full sm:w-auto"
              )}
            >
              Смотреть историю
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
