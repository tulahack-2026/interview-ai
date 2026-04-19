from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any, Optional

from interviews.exceptions import (
    InterviewConflictException,
    InterviewNotFoundException,
    LLMUnavailableException,
)
from interviews.llm_client import (
    FinalReportLLM,
    InterviewTurnLLM,
    LLMClient,
    LLMConfigurationError,
    default_llm_client,
)
from interviews.models import (
    InterviewMessage,
    InterviewReport,
    InterviewSession,
    InterviewStatusEnum,
    MessageRoleEnum,
)
from interviews.prompts import (
    final_report_system_prompt,
    interviewer_continue_user_message,
    interviewer_first_user_message,
    interviewer_system_prompt,
    transcript_for_report,
)
from interviews.schemas import (
    InterviewCreate,
    InterviewCreateResponse,
    InterviewDetailResponse,
    InterviewListItem,
    InterviewListResponse,
    InterviewMessageOut,
    InterviewReportOut,
    InterviewReplyResponse,
    InterviewSessionOut,
    ProgressSummaryResponse,
)
from users.models import User


def _session_to_out(s: InterviewSession) -> InterviewSessionOut:
    return InterviewSessionOut(
        id=s.id,
        track=_enum_value(s.track),
        level=_enum_value(s.level),
        mode=_enum_value(s.mode),
        stress=bool(s.stress),
        status=_enum_value(s.status),
        max_turns=s.max_turns,
        created_at=s.created_at,
        completed_at=s.completed_at,
    )


def _msg_to_out(m: InterviewMessage) -> InterviewMessageOut:
    return InterviewMessageOut(
        id=m.id,
        role=_enum_value(m.role),
        content=m.content,
        created_at=m.created_at,
    )


def _enum_value(v: Any) -> str:
    return v.value if hasattr(v, "value") else str(v)


class InterviewService:
    def __init__(self, llm: Optional[LLMClient] = None) -> None:
        self.llm = llm or default_llm_client

    async def _get_owned_session(self, session_id: int, user: User) -> InterviewSession:
        session = await InterviewSession.objects.get_or_none(id=session_id, user=user)
        if session is None:
            raise InterviewNotFoundException()
        return session

    async def _count_user_messages(self, session_id: int) -> int:
        return await InterviewMessage.objects.filter(
            session_id=session_id, role=MessageRoleEnum.USER
        ).count()

    async def _load_messages_ordered(self, session_id: int) -> list[InterviewMessage]:
        return (
            await InterviewMessage.objects.filter(session_id=session_id)
            .order_by(InterviewMessage.id.asc())
            .all()
        )

    def _messages_for_llm(
        self, session: InterviewSession, rows: list[InterviewMessage]
    ) -> list[dict[str, str]]:
        system = interviewer_system_prompt(session)
        out: list[dict[str, str]] = [{"role": "system", "content": system}]
        for m in rows:
            role = _enum_value(m.role)
            if role == MessageRoleEnum.SYSTEM.value:
                continue
            out.append({"role": role, "content": m.content})
        return out

    async def create_session(
        self, user: User, payload: InterviewCreate
    ) -> InterviewCreateResponse:
        session = await InterviewSession(
            user=user,
            track=payload.track,
            level=payload.level,
            mode=payload.mode,
            stress=payload.stress,
            status=InterviewStatusEnum.ACTIVE,
            max_turns=payload.max_turns,
        ).save()

        messages_payload = self._messages_for_llm(session, [])
        messages_payload.append(
            {"role": "user", "content": interviewer_first_user_message()}
        )

        try:
            turn = await self.llm.chat_completion_json(
                messages_payload, InterviewTurnLLM
            )
        except LLMConfigurationError as e:
            raise LLMUnavailableException(str(e)) from e
        except Exception as e:
            raise LLMUnavailableException(f"LLM error: {e}") from e

        assistant = await InterviewMessage(
            session=session,
            role=MessageRoleEnum.ASSISTANT,
            content=turn.reply_text,
            raw_llm_payload=turn.model_dump(),
        ).save()

        return InterviewCreateResponse(
            session=_session_to_out(session),
            assistant_message=_msg_to_out(assistant),
        )

    async def post_message(
        self, user: User, session_id: int, content: str
    ) -> InterviewReplyResponse:
        session = await self._get_owned_session(session_id, user)
        if _enum_value(session.status) != InterviewStatusEnum.ACTIVE.value:
            raise InterviewConflictException("Interview session is not active")

        await InterviewMessage(
            session=session,
            role=MessageRoleEnum.USER,
            content=content,
        ).save()

        user_count = await self._count_user_messages(session_id)
        force_finish = user_count >= session.max_turns

        rows = await self._load_messages_ordered(session_id)
        messages_payload = self._messages_for_llm(session, rows)
        messages_payload.append(
            {
                "role": "user",
                "content": interviewer_continue_user_message(
                    user_turn_index=user_count,
                    max_turns=session.max_turns,
                    force_finish=force_finish,
                ),
            }
        )

        try:
            turn = await self.llm.chat_completion_json(
                messages_payload, InterviewTurnLLM
            )
        except LLMConfigurationError as e:
            raise LLMUnavailableException(str(e)) from e
        except Exception as e:
            raise LLMUnavailableException(f"LLM error: {e}") from e

        assistant = await InterviewMessage(
            session=session,
            role=MessageRoleEnum.ASSISTANT,
            content=turn.reply_text,
            raw_llm_payload=turn.model_dump(),
        ).save()

        finished = bool(turn.interview_finished or force_finish)
        if finished:
            session.status = InterviewStatusEnum.COMPLETED
            session.completed_at = datetime.now().isoformat() + "Z"
            await session.update()

        session_refreshed = await self._get_owned_session(session_id, user)

        return InterviewReplyResponse(
            session=_session_to_out(session_refreshed),
            assistant_message=_msg_to_out(assistant),
            interview_finished=finished,
        )

    async def complete_session(self, user: User, session_id: int) -> InterviewReportOut:
        session = await self._get_owned_session(session_id, user)

        existing = await InterviewReport.objects.get_or_none(session=session)
        if existing:
            return self._report_to_out(existing, session.id)

        rows = await self._load_messages_ordered(session_id)
        pairs: list[tuple[str, str]] = []
        for m in rows:
            role = _enum_value(m.role)
            if role == MessageRoleEnum.SYSTEM.value:
                continue
            pairs.append((role, m.content))

        transcript = transcript_for_report(pairs)
        messages_payload = [
            {"role": "system", "content": final_report_system_prompt()},
            {
                "role": "user",
                "content": f"Транскрипт интервью:\n\n{transcript}",
            },
        ]

        try:
            report_llm = await self.llm.chat_completion_json(
                messages_payload, FinalReportLLM
            )
        except LLMConfigurationError as e:
            raise LLMUnavailableException(str(e)) from e
        except Exception as e:
            raise LLMUnavailableException(f"LLM error: {e}") from e

        report = await InterviewReport(
            session=session,
            summary_text=report_llm.summary_text,
            scores=report_llm.scores,
            recommendations=report_llm.recommendations,
            weak_areas=report_llm.weak_areas,
            study_plan=report_llm.study_plan,
        ).save()

        if _enum_value(session.status) == InterviewStatusEnum.ACTIVE.value:
            session.status = InterviewStatusEnum.COMPLETED
            session.completed_at = datetime.now().isoformat() + "Z"
            await session.update()

        return self._report_to_out(report, session.id)

    def _report_to_out(self, r: InterviewReport, session_id: int) -> InterviewReportOut:
        return InterviewReportOut(
            id=r.id,
            session_id=session_id,
            summary_text=r.summary_text,
            scores=r.scores,
            recommendations=r.recommendations,
            weak_areas=r.weak_areas,
            study_plan=r.study_plan,
            created_at=r.created_at,
        )

    async def get_session_detail(
        self, user: User, session_id: int
    ) -> InterviewDetailResponse:
        session = await self._get_owned_session(session_id, user)
        rows = await self._load_messages_ordered(session_id)
        return InterviewDetailResponse(
            session=_session_to_out(session),
            messages=[_msg_to_out(m) for m in rows],
        )

    async def list_sessions(
        self, user: User, *, offset: int = 0, limit: int = 20
    ) -> InterviewListResponse:
        sessions = await (
            InterviewSession.objects.filter(user=user)
            .order_by(InterviewSession.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        total = await InterviewSession.objects.filter(user=user).count()

        items: list[InterviewListItem] = []
        for s in sessions:
            overall: Optional[float] = None
            rep = await InterviewReport.objects.get_or_none(session=s)
            if rep and isinstance(rep.scores, dict):
                raw = rep.scores.get("overall")
                if isinstance(raw, (int, float)):
                    overall = float(raw)
            items.append(
                InterviewListItem(session=_session_to_out(s), overall_score=overall)
            )

        return InterviewListResponse(items=items, total=total)

    async def progress_summary(self, user: User) -> ProgressSummaryResponse:
        sessions = await InterviewSession.objects.filter(user=user).all()
        completed = [
            s
            for s in sessions
            if _enum_value(s.status) == InterviewStatusEnum.COMPLETED.value
        ]
        reports: list[InterviewReport] = []
        for s in completed:
            r = await InterviewReport.objects.get_or_none(session=s)
            if r:
                reports.append(r)

        scores: list[float] = []
        for r in reports:
            if isinstance(r.scores, dict):
                o = r.scores.get("overall")
                if isinstance(o, (int, float)):
                    scores.append(float(o))

        weak_counter: Counter[str] = Counter()
        for r in reports:
            for w in r.weak_areas or []:
                if isinstance(w, str) and w.strip():
                    weak_counter[w.strip()] += 1

        common_weak = [k for k, _ in weak_counter.most_common(10)]

        avg: Optional[float] = None
        if scores:
            avg = sum(scores) / len(scores)

        return ProgressSummaryResponse(
            sessions_completed=len(reports),
            average_overall_score=avg,
            common_weak_areas=common_weak,
        )


def get_interview_service() -> InterviewService:
    return InterviewService()
