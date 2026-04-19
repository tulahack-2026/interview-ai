import enum
from datetime import datetime

import ormar

from database import base_ormar_config


class UserRoleEnum(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(ormar.Model):
    ormar_config = base_ormar_config.copy(tablename="users")

    id: int = ormar.Integer(primary_key=True)
    name: str = ormar.String(max_length=200)
    patronymic: str = ormar.String(max_length=200)
    surname: str = ormar.String(max_length=200)
    email: str = ormar.String(max_length=200)
    password: str = ormar.String(max_length=200)
    date_of_birth: str = ormar.String(max_length=200)
    role: UserRoleEnum = ormar.String(max_length=200, default=UserRoleEnum.USER.value)

    created_at: str = ormar.String(
        max_length=200, default=lambda: datetime.now().isoformat() + "Z"
    )
    updated_at: str = ormar.String(
        max_length=200, default=lambda: datetime.now().isoformat() + "Z"
    )
