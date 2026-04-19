import os
import uuid

import pytest

# Must run before importing application modules (database URL in config).
# Use assignment (not setdefault) so tests are isolated from the developer shell / .env.
os.environ["DB_HOST"] = os.environ.get("DB_HOST", "127.0.0.1")
os.environ["DB_PORT"] = os.environ.get("DB_PORT", "54325")
os.environ["DB_NAME"] = os.environ.get("DB_NAME", "app_api")
os.environ["DB_USER"] = os.environ.get("DB_USER", "postgres")
os.environ["DB_PASSWORD"] = os.environ.get("DB_PASSWORD", "postgres")
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"
os.environ["YANDEX_CLOUD_FOLDER"] = "b1gtestfolder"
os.environ["YANDEX_CLOUD_API_KEY"] = "test-yandex-api-key"
os.environ["YANDEX_CLOUD_BASE_URL"] = "https://ai.api.cloud.yandex.net/v1"


@pytest.fixture
def unique_email() -> str:
    return f"u_{uuid.uuid4().hex[:12]}@test.local"

