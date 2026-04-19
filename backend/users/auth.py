import enum
from datetime import datetime, timedelta, timezone

import jwt

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REFRESH_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
)
from users.exceptions import CredentialsException
from users.models import User
from users.schemas import TokenData


class TokenTypesEnum(enum.Enum):
    access = "access"
    refresh = "refresh"


def create_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user: User) -> str:
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # PyJWT requires string "sub" claim (RFC 7519 string semantics).
    data = {"sub": str(user.id), "type": TokenTypesEnum.access.value}
    return create_token(data, expires_delta)


def create_refresh_token(user: User) -> str:
    data = {"sub": str(user.id), "type": TokenTypesEnum.refresh.value}
    expires_delta = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    return create_token(data, expires_delta)


def verify_token(token: str, token_type: TokenTypesEnum) -> TokenData:
    try:
        token = token.strip()
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload["type"] != token_type.value:
            raise CredentialsException(detail="Invalid token")
        sub = payload.get("sub")
        if sub is None:
            raise CredentialsException(detail="Invalid token payload")
        try:
            user_id = int(sub)
        except (TypeError, ValueError):
            raise CredentialsException(detail="Invalid token payload")
        return TokenData(user_id=user_id)
    except jwt.DecodeError:
        raise CredentialsException(detail="Could not decode token")
    except jwt.ExpiredSignatureError:
        raise CredentialsException(detail="Token expired")
    except jwt.InvalidTokenError:
        raise CredentialsException(detail="Invalid token")
    except KeyError:
        raise CredentialsException(detail="Invalid token payload")
