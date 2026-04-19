import os
from typing import Any, Dict

from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

METRICS = os.environ.get("METRICS", "") == "true"

DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT")
DB_NAME = os.environ.get("DB_NAME")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

PRODUCTION = os.environ.get("PRODUCTION") == "true"

PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 * 6

# Yandex Cloud AI (OpenAI-compatible API)
LLM_TIMEOUT_SECONDS = float(os.environ.get("LLM_TIMEOUT_SECONDS", "120"))
YANDEX_CLOUD_FOLDER = os.environ.get("YANDEX_CLOUD_FOLDER", "").strip()
YANDEX_CLOUD_API_KEY = os.environ.get("YANDEX_CLOUD_API_KEY", "").strip()
YANDEX_CLOUD_MODEL = os.environ.get(
    "YANDEX_CLOUD_MODEL", "qwen3.5-35b-a3b-fp8/latest"
).strip()
YANDEX_CLOUD_BASE_URL = os.environ.get(
    "YANDEX_CLOUD_BASE_URL", "https://ai.api.cloud.yandex.net/v1"
).rstrip("/")

# LOGGING
LOGGING_CONFIG: Dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(asctime)s | %(name)s | %(levelprefix)s %(message)s",
            "use_colors": None,
        },
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": '%(asctime)s | %(name)s | %(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',
        },
        "my_formatter": {
            "()": "logging.Formatter",
            "fmt": "%(asctime)s | %(name)s | %(levelname)-8s | [%(pathname)s:%(lineno)d] | %(message)s",
        },
    },
    "handlers": {
        "my_handler": {
            "formatter": "my_formatter",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "app": {"handlers": ["my_handler"], "level": "DEBUG", "propagate": False},
        "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
    },
}
