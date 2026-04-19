"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Volume2, Mic } from "lucide-react";
import type { components } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InterviewMessageOut = components["schemas"]["InterviewMessageOut"];
type InterviewSessionOut = components["schemas"]["InterviewSessionOut"];

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

const modeLabels: Record<string, string> = {
  technical: "Техническое",
  hr: "HR",
  mixed: "Смешанное",
};

export function InterviewChat({
  session,
  messages,
  loading,
  inputDisabled,
  onSend,
  voiceEnabled,
  onVoiceEnabledChange,
}: {
  session: InterviewSessionOut;
  messages: InterviewMessageOut[];
  loading: boolean;
  inputDisabled: boolean;
  onSend: (content: string) => Promise<void>;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (v: boolean) => void;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);

  const userTurns = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakLastAssistant = useCallback(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(last.content);
    u.lang = "ru-RU";
    window.speechSynthesis.speak(u);
  }, [messages]);

  const toggleListen = () => {
    if (!voiceEnabled) {
      toast.message("Включите голосовой режим");
      return;
    }
    const rec = getSpeechRecognition();
    if (!rec) {
      toast.error("Распознавание речи не поддерживается в этом браузере");
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
      return;
    }
    rec.lang = "ru-RU";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const said = ev.results[0][0].transcript;
      setText((t) => (t ? `${t} ${said}` : said));
    };
    rec.onerror = (ev) => {
      toast.error(`Микрофон: ${ev.error}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      toast.error("Не удалось запустить распознавание речи");
    }
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading || inputDisabled) return;
    setText("");
    await onSend(trimmed);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <Badge variant="outline">{session.track}</Badge>
        <Badge variant="outline">{session.level}</Badge>
        <Badge variant="outline">{modeLabels[session.mode] ?? session.mode}</Badge>
        {session.stress && <Badge variant="destructive">Стресс</Badge>}
        <span className="ml-auto tabular-nums">
          Ходов: {userTurns}/{session.max_turns}
        </span>
      </div>

      <ScrollArea className="h-[min(420px,50vh)] rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4 pr-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                m.role === "assistant"
                  ? "ml-0 bg-violet-50 text-zinc-900 dark:bg-violet-950/50 dark:text-zinc-50"
                  : "ml-auto bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              )}
            >
              <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                {m.role === "assistant" ? "Интервьюер" : "Вы"}
              </p>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Ваш ответ…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={inputDisabled || loading}
            rows={4}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="voice"
                checked={voiceEnabled}
                onCheckedChange={onVoiceEnabledChange}
              />
              <Label htmlFor="voice" className="text-sm">
                Голосовой режим
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => speakLastAssistant()}
                disabled={messages.length === 0}
              >
                <Volume2 className="mr-1 h-4 w-4" />
                Озвучить вопрос
              </Button>
              <Button
                type="button"
                variant={listening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleListen}
                disabled={inputDisabled || loading}
              >
                <Mic className="mr-1 h-4 w-4" />
                {listening ? "Стоп" : "Диктовать"}
              </Button>
            </div>
          </div>
        </div>
        <Button
          className="h-11 sm:h-[calc(100%-0px)]"
          onClick={() => void submit()}
          disabled={loading || inputDisabled || !text.trim()}
        >
          <Send className="mr-2 h-4 w-4" />
          Отправить
        </Button>
      </div>
    </div>
  );
}
