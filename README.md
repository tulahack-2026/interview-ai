# Interview AI

Платформа для подготовки к техническим и HR-интервью с использованием ИИ. Система симулирует реальное собеседование: задаёт вопросы по выбранному треку и уровню, оценивает ответы и генерирует детальный отчёт с рекомендациями.

## Возможности

- **Треки**: Backend, Frontend, QA, DevOps
- **Уровни сложности**: Junior, Middle, Senior
- **Режимы**: Технический, HR, смешанный
- **Стресс-режим**: симуляция давления на кандидата
- **История интервью**: просмотр прошлых сессий и отчётов
- **ИИ-отчёт**: итоговый балл, слабые места, план обучения

## Стек

| Компонент | Технология |
|-----------|-----------|
| Backend | Python 3.11, FastAPI, PostgreSQL 17, Ormar, Alembic |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| LLM | Yandex Cloud AI (OpenAI-совместимый API) |
| Auth | JWT (access + refresh tokens) |
| Инфраструктура | Docker, Docker Compose |

## Быстрый старт

### 1. Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose v2+
- Доступ к Yandex Cloud AI (Folder ID и API Key)

### 2. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Обязательные
SECRET_KEY=your-secret-key-min-32-chars
YANDEX_CLOUD_FOLDER=your-folder-id
YANDEX_CLOUD_API_KEY=your-api-key

# База данных (опционально, есть значения по умолчанию)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=app_api

# LLM-модель (опционально)
YANDEX_CLOUD_MODEL=qwen3.5-35b-a3b-fp8/latest
YANDEX_CLOUD_BASE_URL=https://ai.api.cloud.yandex.net/v1
LLM_TIMEOUT_SECONDS=120

# URL бэкенда для фронтенда (опционально)
# По умолчанию: http://localhost:8078
NEXT_PUBLIC_API_URL=http://localhost:8078
```

> **Получить ключи Yandex Cloud AI**: [console.yandex.cloud](https://console.yandex.cloud) → Сервисные аккаунты → Создать API-ключ

### 3. Запуск

```bash
# Сборка и запуск всех сервисов
docker compose up --build

# Или в фоновом режиме
docker compose up --build -d
```

После запуска:

| Сервис | URL |
|--------|-----|
| Фронтенд | http://localhost:3000 |
| Бэкенд API | http://localhost:8078 |
| Swagger UI | http://localhost:8078/docs |
| PostgreSQL | localhost:54325 |

### 4. Остановка

```bash
docker compose down

# С удалением данных БД
docker compose down -v
```

## Разработка без Docker

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Запустить локальную БД (или использовать docker compose up api_database)
# Настроить .env с DB_HOST=localhost, DB_PORT=54325

alembic upgrade head

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Документация API: http://localhost:8000/docs

### Frontend

```bash
cd frontend

npm install

# Указать URL бэкенда
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Приложение: http://localhost:3000

## Архитектура

```
┌─────────────────────┐
│  Frontend (Next.js) │  :3000
│  React 19 + Zustand │
└────────┬────────────┘
         │ REST API
┌────────▼────────────┐
│  Backend (FastAPI)  │  :8078
│  Python + Alembic   │
└────────┬────────────┘
         │
┌────────▼────────────┐    ┌────────────────────┐
│  PostgreSQL 17      │    │  Yandex Cloud AI   │
│  :54325             │    │  (LLM-провайдер)   │
└─────────────────────┘    └────────────────────┘
```

## Структура проекта

```
interview-ai/
├── docker-compose.yml       # Единый compose для всего проекта
├── backend/
│   ├── Dockerfile
│   ├── main.py              # FastAPI приложение
│   ├── interviews/          # Логика интервью и LLM-интеграция
│   ├── users/               # Аутентификация и пользователи
│   ├── alembic/             # Миграции БД
│   └── requirements.txt
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── app/             # Next.js App Router (страницы)
    │   ├── components/      # UI-компоненты
    │   ├── stores/          # Zustand-хранилища
    │   └── lib/             # API-клиент с JWT-интерцептором
    └── package.json
```
