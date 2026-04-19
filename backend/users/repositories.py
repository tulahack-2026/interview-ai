from typing import List, Optional

from ormar import MultipleMatches

from users.passwords import get_password_hash

from .exceptions import RepositoryUserAlreadyExistsException
from .models import User
from .schemas import UserCreate, UserUpdate


class UserRepository:
    """Repository for managing User objects."""

    @staticmethod
    async def create(user_create: UserCreate) -> User:
        if await User.objects.get_or_none(email=user_create.email):
            raise RepositoryUserAlreadyExistsException()

        password = user_create.password
        user_create.password = get_password_hash(password)

        user = User(**user_create.model_dump())
        await user.save()

        return user

    @staticmethod
    async def get_by_email(email: str) -> Optional[User]:
        try:
            if user := await User.objects.get_or_none(email=email):
                return user
        except MultipleMatches:
            return await User.objects.first(email=email)

    @staticmethod
    async def get_by_id(user_id: int) -> Optional[User]:
        return await User.objects.get_or_none(id=user_id)

    @staticmethod
    async def delete_user(user: User) -> None:
        await user.delete()

    @staticmethod
    async def get_all_users(offset: int = 0, limit: int = 20) -> List[User]:
        return await User.objects.limit(limit).offset(offset).all()

    @staticmethod
    async def set_password(user: User, new_password: str) -> None:
        await user.update(password=get_password_hash(new_password))

    @staticmethod
    async def update(user: User, user_update: UserUpdate) -> User:
        return await user.update(**user_update.model_dump(exclude_unset=True))
