from typing import Annotated, List

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from users.passwords import verify_password

from .auth import (
    TokenTypesEnum,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from .exceptions import (
    CredentialsException,
    IncorrectPasswordException,
    UserAlreadyExistsException,
    UserNotFoundException,
    UserNotAdminException,
)
from .models import User, UserRoleEnum
from .repositories import RepositoryUserAlreadyExistsException, UserRepository
from .schemas import RefreshAccessToken, UserCreate, UserUpdate

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/token")


class UserService:
    """Service layer for managing users."""

    repository = UserRepository()

    async def login_user(self, username: str, password: str) -> RefreshAccessToken:
        user = await self.repository.get_by_email(username)

        if not user:
            raise IncorrectPasswordException()

        if not verify_password(password, user.password):
            raise IncorrectPasswordException()

        access_token = create_access_token(user)
        refresh_token = create_refresh_token(user)

        return RefreshAccessToken(
            access_token=access_token, refresh_token=refresh_token
        )

    async def refresh_token(self, refresh_token: str) -> RefreshAccessToken:
        token_data = verify_token(refresh_token, TokenTypesEnum.refresh)
        user = await self.repository.get_by_id(int(token_data.user_id))
        if user is None:
            raise CredentialsException()
        new_access_token = create_access_token(user)
        return RefreshAccessToken(
            access_token=new_access_token, refresh_token=refresh_token
        )

    async def get_current_user(
        self, token: Annotated[str, Depends(oauth2_scheme)]
    ) -> User:
        token_data = verify_token(token, TokenTypesEnum.access)
        user = await self.repository.get_by_id(int(token_data.user_id))
        if user is None:
            raise CredentialsException()
        return user

    async def create(self, user_create: UserCreate) -> (User, RefreshAccessToken):
        try:
            user = await self.repository.create(user_create)
        except RepositoryUserAlreadyExistsException:
            raise UserAlreadyExistsException()
        access_token = create_access_token(user)
        refresh_token = create_refresh_token(user)

        return user, RefreshAccessToken(
            access_token=access_token, refresh_token=refresh_token
        )

    async def delete_user(self, user: User) -> None:
        await self.repository.delete_user(user)

    async def update(self, user: User, user_update: UserUpdate) -> User:
        return await self.repository.update(user, user_update)

    async def get_all_users_admin(self, current_user: User) -> List[User]:
        if current_user.role != UserRoleEnum.ADMIN.value:
            raise UserNotAdminException()
        return await self.repository.get_all_users()

    async def get_user_by_email(self, email: str) -> User:
        user = await self.repository.get_by_email(email)
        if user is None:
            raise UserNotFoundException(email)
        return user
