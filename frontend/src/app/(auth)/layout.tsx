export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">AI Interview Coach</h1>
        <p className="mt-1 text-sm text-zinc-500">Подготовка к собеседованиям с AI</p>
      </div>
      {children}
    </div>
  );
}
