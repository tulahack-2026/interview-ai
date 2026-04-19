from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

from interviews.models import (
    InterviewLevelEnum,
    InterviewModeEnum,
    InterviewTrackEnum,
)


class InterviewCreate(BaseModel):
    track: InterviewTrackEnum
    level: InterviewLevelEnum
    mode: InterviewModeEnum = InterviewModeEnum.TECHNICAL
    stress: bool = False
    max_turns: int = Field(default=8, ge=1, le=30)


class InterviewMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=50_000)


class InterviewMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class InterviewSessionOut(BaseModel):
    id: int
    track: str
    level: str
    mode: str
    stress: bool
    status: str
    max_turns: int
    created_at: str
    completed_at: Optional[str] = None


class InterviewCreateResponse(BaseModel):
    session: InterviewSessionOut
    assistant_message: InterviewMessageOut


class InterviewReplyResponse(BaseModel):
    session: InterviewSessionOut
    assistant_message: InterviewMessageOut
    interview_finished: bool


class InterviewReportOut(BaseModel):
    id: int
    session_id: int
    summary_text: str
    scores: dict[str, Any]
    recommendations: list[Any]
    weak_areas: list[Any]
    study_plan: list[Any]
    created_at: str


class InterviewDetailResponse(BaseModel):
    session: InterviewSessionOut
    messages: list[InterviewMessageOut]


class InterviewListItem(BaseModel):
    session: InterviewSessionOut
    overall_score: Optional[float] = None


class InterviewListResponse(BaseModel):
    items: list[InterviewListItem]
    total: int


class ProgressSummaryResponse(BaseModel):
    sessions_completed: int
    average_overall_score: Optional[float]
    common_weak_areas: list[str]
