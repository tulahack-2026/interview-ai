from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, Optional

import ormar

from database import base_ormar_config
from users.models import User


class InterviewTrackEnum(str, enum.Enum):
    BACKEND = "Backend"
    FRONTEND = "Frontend"
    QA = "QA"
    DEVOPS = "DevOps"


class InterviewLevelEnum(str, enum.Enum):
    JUNIOR = "Junior"
    MIDDLE = "Middle"
    SENIOR = "Senior"


class InterviewModeEnum(str, enum.Enum):
    TECHNICAL = "technical"
    HR = "hr"
    MIXED = "mixed"


class InterviewStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"


class MessageRoleEnum(str, enum.Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class InterviewSession(ormar.Model):
    ormar_config = base_ormar_config.copy(tablename="interview_sessions")

    id: int = ormar.Integer(primary_key=True)
    user: User = ormar.ForeignKey(User, name="user_id")

    track: InterviewTrackEnum = ormar.String(max_length=50)
    level: InterviewLevelEnum = ormar.String(max_length=50)
    mode: InterviewModeEnum = ormar.String(max_length=50)
    stress: bool = ormar.Boolean(default=False)

    status: InterviewStatusEnum = ormar.String(
        max_length=50, default=InterviewStatusEnum.ACTIVE.value
    )
    max_turns: int = ormar.Integer(default=8)

    extra_metadata: Optional[dict[str, Any]] = ormar.JSON(nullable=True)

    created_at: str = ormar.String(
        max_length=200, default=lambda: datetime.now().isoformat() + "Z"
    )
    completed_at: Optional[str] = ormar.String(max_length=200, nullable=True)


class InterviewMessage(ormar.Model):
    ormar_config = base_ormar_config.copy(tablename="interview_messages")

    id: int = ormar.Integer(primary_key=True)
    session: InterviewSession = ormar.ForeignKey(InterviewSession, name="session_id")

    role: MessageRoleEnum = ormar.String(max_length=20)
    content: str = ormar.Text()
    raw_llm_payload: Optional[dict[str, Any]] = ormar.JSON(nullable=True)

    created_at: str = ormar.String(
        max_length=200, default=lambda: datetime.now().isoformat() + "Z"
    )


class InterviewReport(ormar.Model):
    ormar_config = base_ormar_config.copy(tablename="interview_reports")

    id: int = ormar.Integer(primary_key=True)
    session: InterviewSession = ormar.ForeignKey(
        InterviewSession, name="session_id", unique=True
    )

    summary_text: str = ormar.Text()
    scores: dict[str, Any] = ormar.JSON()
    recommendations: list[Any] = ormar.JSON()
    weak_areas: list[Any] = ormar.JSON()
    study_plan: list[Any] = ormar.JSON()

    created_at: str = ormar.String(
        max_length=200, default=lambda: datetime.now().isoformat() + "Z"
    )
