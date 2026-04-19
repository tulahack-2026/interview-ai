# Stage 1: Установка зависимостей
FROM node:22-alpine AS deps

WORKDIR /app

# Копируем только файлы зависимостей для кэширования слоя
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci --frozen-lockfile

# Stage 2: Сборка приложения
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments для NEXT_PUBLIC_* переменных (инлайнятся при сборке)
ARG NEXT_PUBLIC_API_URL=https://api.interview-ai.ru
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию Next.js при сборке
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем приложение
RUN npm run build

# Stage 3: Production образ
FROM node:22-alpine AS runner

WORKDIR /app

# Устанавливаем переменные окружения для production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём непривилегированного пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем статические файлы и собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Устанавливаем владельца файлов
RUN chown -R nextjs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
