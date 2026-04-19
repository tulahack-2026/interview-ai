"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Mic2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Главная" },
  { href: "/interview/new", label: "Новое интервью" },
  { href: "/history", label: "История" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Mic2 className="h-6 w-6 text-violet-600" aria-hidden />
            <span className="font-semibold tracking-tight">AI Interview Coach</span>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  pathname === item.href && "bg-zinc-100 dark:bg-zinc-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
                {user.name} {user.surname}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="mr-1 h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
