"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listInterviews } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { interviewQueryKeys } from "@/hooks/use-interview-session";

export default function HistoryPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: interviewQueryKeys.list(0, 50),
    queryFn: () => listInterviews(0, 50),
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [isError, error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">История интервью</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Всего сессий: {data?.total ?? "—"}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && data && data.items.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Пока пусто</CardTitle>
            <CardDescription>Запустите первое интервью с главной страницы.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/interview/new" className={cn(buttonVariants())}>
              Новое интервью
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {data?.items.map(({ session, overall_score }) => {
          const isDone =
            session.status?.toLowerCase() === "completed" || !!session.completed_at;
          return (
            <Card key={session.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-lg">
                    {session.track} · {session.level}
                  </CardTitle>
                  <CardDescription>
                    {new Date(session.created_at).toLocaleString("ru-RU")} · {session.mode}
                    {session.stress && " · стресс"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{session.status}</Badge>
                  {overall_score != null && (
                    <Badge variant="secondary">Оценка: {overall_score.toFixed(1)}</Badge>
                  )}
                  <Link
                    href={`/interview/${session.id}`}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Открыть
                  </Link>
                  {isDone && (
                    <Link
                      href={`/interview/${session.id}/report`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Итог
                    </Link>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
