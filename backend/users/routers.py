from typing import Annotated, List

from fastapi import APIRouter, Depends, Form

from users.models import User
from users.schemas import RefreshAccessToken, UserCreate, UserResponse, UserUpdate
from users.services import UserService

user_router = APIRouter(tags=["user"], prefix="/user")


@user_router.post("/register")
async def register(user_create: UserCreate) -> RefreshAccessToken:
    _, tokens = await UserService().create(user_create)
    return tokens


@user_router.post("/refresh")
async def refresh_token_route(
    refresh_token: Annotated[str, Form()]
) -> RefreshAccessToken:
    return await UserService().refresh_token(refresh_token)


@user_router.post("/token")
async def login_for_access_token(
    username: Annotated[str, Form()], password: Annotated[str, Form()]
) -> RefreshAccessToken:
    return await UserService().login_user(username, password)


@user_router.get("/self")
async def get_self(
    current_user: Annotated[User, Depends(UserService().get_current_user)],
) -> UserResponse:
    return UserResponse(**current_user.model_dump())


@user_router.delete("")
async def delete_user(
    current_user: Annotated[User, Depends(UserService().get_current_user)],
) -> dict:
    await UserService().delete_user(current_user)
    return {"success": "ok"}


@user_router.put("")
async def update_user(
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    user_update: UserUpdate,
) -> UserResponse:
    user = await UserService().update(current_user, user_update)
    return UserResponse(**user.model_dump())


@user_router.get("/all")
async def get_all_users(
    current_user: Annotated[User, Depends(UserService().get_current_user)],
) -> List[UserResponse]:
    users = await UserService().get_all_users_admin(current_user)
    return [UserResponse(**user.model_dump()) for user in users]


@user_router.get("/email")
async def get_user_by_email(email: str) -> UserResponse:
    user = await UserService().get_user_by_email(email)
    return UserResponse(**user.model_dump())
