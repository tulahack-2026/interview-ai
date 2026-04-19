import sqlalchemy
import ormar
from ormar.databases.connection import DatabaseConnection

from config import DATABASE_URL

metadata = sqlalchemy.MetaData()


def _to_async_postgres_url(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    raise ValueError("DATABASE_URL must use postgresql:// or postgresql+asyncpg://")


database = DatabaseConnection(_to_async_postgres_url(DATABASE_URL))
engine = sqlalchemy.create_engine(DATABASE_URL)

base_ormar_config = ormar.OrmarConfig(
    metadata=metadata,
    database=database,
    engine=engine,
)
