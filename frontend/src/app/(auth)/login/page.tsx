"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublicOnly } from "@/components/public-only";
import { useAuthStore } from "@/stores/auth-store";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const JUDGE_EMAIL = "test@test.com";
const JUDGE_PASSWORD = "testtest";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      toast.success("Вход выполнен");
      router.replace("/");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Не удалось войти"));
    }
  };

  const loginAsJudge = async () => {
    try {
      await login(JUDGE_EMAIL, JUDGE_PASSWORD);
      toast.success("Вход выполнен");
      router.replace("/");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Не удалось войти"));
    }
  };


  return (
    <PublicOnly>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Введите email и пароль</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="mb-2 text-sm font-medium text-blue-800">Быстрый вход для судей</p>
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={loginAsJudge}
                disabled={isSubmitting}
              >
                Войти как судья
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Вход…" : "Войти"}
            </Button>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
            >
              Регистрация
            </Link>
          </CardFooter>
        </form>
      </Card>
    </PublicOnly>
  );
}
