"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  completeInterview,
  getInterview,
  postInterviewMessage,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { InterviewChat } from "@/features/interview/components/interview-chat";
import { interviewQueryKeys } from "@/hooks/use-interview-session";
import type { components } from "@/types/api";

type InterviewDetailResponse = components["schemas"]["InterviewDetailResponse"];

export default function InterviewSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = Number(params.sessionId);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [finished, setFinished] = useState(false);

  const detailQuery = useQuery({
    queryKey: interviewQueryKeys.detail(sessionId),
    queryFn: () => getInterview(sessionId),
    enabled: Number.isFinite(sessionId),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeInterview(sessionId),
    onSuccess: (report) => {
      queryClient.setQueryData(interviewQueryKeys.report(sessionId), report);
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void queryClient.invalidateQueries({ queryKey: interviewQueryKeys.progressSummary });
      router.push(`/interview/${sessionId}/report`);
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Не удалось завершить интервью"));
    },
  });

  const messageMutation = useMutation({
    mutationFn: (content: string) =>
      postInterviewMessage(sessionId, { content }),
    onSuccess: async (data) => {
      const prior = queryClient.getQueryData<InterviewDetailResponse>(
        interviewQueryKeys.detail(sessionId)
      );
      const priorUserTurns =
        prior?.messages.filter((m) => m.role === "user").length ?? 0;
      const userTurnsAfter = priorUserTurns + 1;
      const maxTurns = data.session.max_turns;

      await queryClient.invalidateQueries({ queryKey: interviewQueryKeys.detail(sessionId) });

      const shouldAutoComplete =
        data.interview_finished || userTurnsAfter >= maxTurns;

      if (shouldAutoComplete) {
        setFinished(true);
        toast.message("Интервью завершено, формируем итог…");
        completeMutation.mutate();
      }
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Не удалось отправить ответ"));
    },
  });

  if (!Number.isFinite(sessionId)) {
    return <p className="text-sm text-red-600">Некорректный идентификатор сессии</p>;
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Загрузка…</CardTitle>
          <CardDescription>Подготовка интервью</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { session, messages } = detailQuery.data;
  const isComplete =
    session.status?.toLowerCase() === "completed" || !!session.completed_at;
  const inputDisabled =
    finished || isComplete || messageMutation.isPending || completeMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Интервью</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Статус: {session.status}
            {isComplete && " — сессия уже завершена"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isComplete && (
            <Link
              href={`/interview/${sessionId}/report`}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Смотреть итог
            </Link>
          )}
          <Button
            variant="secondary"
            disabled={completeMutation.isPending || isComplete}
            onClick={() => completeMutation.mutate()}
          >
            {completeMutation.isPending ? "Итог…" : "Завершить и получить итог"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Диалог</CardTitle>
          <CardDescription>
            Отвечайте развёрнуто. Enter — отправить, Shift+Enter — новая строка.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterviewChat
            session={session}
            messages={messages}
            loading={messageMutation.isPending}
            inputDisabled={inputDisabled}
            voiceEnabled={voiceEnabled}
            onVoiceEnabledChange={setVoiceEnabled}
            onSend={async (content) => {
              await messageMutation.mutateAsync(content);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
