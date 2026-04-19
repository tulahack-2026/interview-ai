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

const schema = z.object({
  name: z.string().min(1, "Обязательное поле"),
  patronymic: z.string().min(1, "Обязательное поле"),
  surname: z.string().min(1, "Обязательное поле"),
  date_of_birth: z.string().min(1, "Укажите дату"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        name: values.name,
        patronymic: values.patronymic,
        surname: values.surname,
        date_of_birth: values.date_of_birth,
        email: values.email,
        password: values.password,
      });
      toast.success("Аккаунт создан");
      router.replace("/");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Не удалось зарегистрироваться"));
    }
  };

  return (
    <PublicOnly>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Заполните данные для создания аккаунта</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="surname">Фамилия</Label>
              <Input id="surname" {...register("surname")} />
              {errors.surname && (
                <p className="text-sm text-red-600">{errors.surname.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patronymic">Отчество</Label>
              <Input id="patronymic" {...register("patronymic")} />
              {errors.patronymic && (
                <p className="text-sm text-red-600">{errors.patronymic.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="date_of_birth">Дата рождения</Label>
              <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
              {errors.date_of_birth && (
                <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Создание…" : "Создать аккаунт"}
            </Button>
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Уже есть аккаунт
            </Link>
          </CardFooter>
        </form>
      </Card>
    </PublicOnly>
  );
}
