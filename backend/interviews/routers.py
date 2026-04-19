from typing import Annotated

from fastapi import APIRouter, Depends, Query

from interviews.schemas import (
    InterviewCreate,
    InterviewDetailResponse,
    InterviewListResponse,
    InterviewMessageCreate,
    InterviewReportOut,
    InterviewCreateResponse,
    InterviewReplyResponse,
    ProgressSummaryResponse,
)
from interviews.service import InterviewService, get_interview_service
from users.models import User
from users.services import UserService

interview_router = APIRouter(prefix="/interviews", tags=["interviews"])


@interview_router.post("", response_model=InterviewCreateResponse)
async def create_interview(
    payload: InterviewCreate,
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    service: Annotated[InterviewService, Depends(get_interview_service)],
) -> InterviewCreateResponse:
    return await service.create_session(current_user, payload)


@interview_router.post("/{session_id}/messages", response_model=InterviewReplyResponse)
async def post_interview_message(
    session_id: int,
    body: InterviewMessageCreate,
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    service: Annotated[InterviewService, Depends(get_interview_service)],
) -> InterviewReplyResponse:
    return await service.post_message(current_user, session_id, body.content)


@interview_router.post("/{session_id}/complete", response_model=InterviewReportOut)
async def complete_interview(
    session_id: int,
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    service: Annotated[InterviewService, Depends(get_interview_service)],
) -> InterviewReportOut:
    return await service.complete_session(current_user, session_id)


@interview_router.get("", response_model=InterviewListResponse)
async def list_interviews(
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    service: Annotated[InterviewService, Depends(get_interview_service)],
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> InterviewListResponse:
    return await service.list_sessions(current_user, offset=offset, limit=limit)


@interview_router.get("/progress/summary", response_model=ProgressSummaryResponse)
async def interview_progress_summary(
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    service: Annotated[InterviewService, Depends(get_interview_service)],
) -> ProgressSummaryResponse:
    return await service.progress_summary(current_user)


@interview_router.get("/{session_id}", response_model=InterviewDetailResponse)
async def get_interview(
    session_id: int,
    current_user: Annotated[User, Depends(UserService().get_current_user)],
    service: Annotated[InterviewService, Depends(get_interview_service)],
) -> InterviewDetailResponse:
    return await service.get_session_detail(current_user, session_id)
