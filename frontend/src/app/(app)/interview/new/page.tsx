"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { createInterview } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { interviewQueryKeys } from "@/hooks/use-interview-session";
import type { components } from "@/types/api";

type Track = components["schemas"]["InterviewTrackEnum"];
type Level = components["schemas"]["InterviewLevelEnum"];
type Mode = components["schemas"]["InterviewModeEnum"];

const schema = z.object({
  track: z.enum(["Backend", "Frontend", "QA", "DevOps"]),
  level: z.enum(["Junior", "Middle", "Senior"]),
  mode: z.enum(["technical", "hr", "mixed"]),
  stress: z.boolean(),
  max_turns: z.number().int().min(1).max(30),
});

type FormValues = z.infer<typeof schema>;

export default function NewInterviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      track: "Frontend",
      level: "Middle",
      mode: "technical",
      stress: false,
      max_turns: 8,
    },
  });

  const mutation = useMutation({
    mutationFn: createInterview,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void queryClient.invalidateQueries({ queryKey: interviewQueryKeys.progressSummary });
      router.push(`/interview/${data.session.id}`);
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Не удалось начать интервью"));
    },
  });

  const onSubmit = (values: FormValues) => {
    const body: components["schemas"]["InterviewCreate"] = {
      track: values.track as Track,
      level: values.level as Level,
      mode: values.mode as Mode,
      stress: values.stress,
      max_turns: values.max_turns,
    };
    mutation.mutate(body);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Новое интервью</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Выберите параметры — AI начнёт диалог как на реальном собеседовании.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Параметры сессии</CardTitle>
          <CardDescription>Направление, уровень и формат</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Направление</Label>
              <Select
                value={form.watch("track")}
                onValueChange={(v) => form.setValue("track", v as FormValues["track"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Направление" />
                </SelectTrigger>
                <SelectContent>
                  {(["Backend", "Frontend", "QA", "DevOps"] as const).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Уровень</Label>
              <Select
                value={form.watch("level")}
                onValueChange={(v) => form.setValue("level", v as FormValues["level"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Уровень" />
                </SelectTrigger>
                <SelectContent>
                  {(["Junior", "Middle", "Senior"] as const).map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Режим</Label>
              <Select
                value={form.watch("mode")}
                onValueChange={(v) => form.setValue("mode", v as FormValues["mode"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Режим" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Техническое</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="mixed">Смешанное</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div>
                <Label htmlFor="stress">Стресс-интервью</Label>
                <p className="text-xs text-zinc-500">
                  Повышенное давление и неудобные вопросы
                </p>
              </div>
              <Switch
                id="stress"
                checked={form.watch("stress")}
                onCheckedChange={(v) => form.setValue("stress", v)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_turns">Максимум ходов (1–30)</Label>
              <Input
                id="max_turns"
                type="number"
                min={1}
                max={30}
                {...form.register("max_turns", { valueAsNumber: true })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Запуск…" : "Начать интервью"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
