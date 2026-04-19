from __future__ import annotations

from interviews.models import InterviewSession


def _track_label(session: InterviewSession) -> str:
    return session.track.value if hasattr(session.track, "value") else str(session.track)


def _level_label(session: InterviewSession) -> str:
    return session.level.value if hasattr(session.level, "value") else str(session.level)


def _mode_label(session: InterviewSession) -> str:
    return session.mode.value if hasattr(session.mode, "value") else str(session.mode)


def interviewer_system_prompt(session: InterviewSession) -> str:
    track = _track_label(session)
    level = _level_label(session)
    mode = _mode_label(session)
    stress = session.stress

    mode_lines = {
        "technical": "Фокус: технические знания, архитектура, инструменты, практика, разбор кейсов.",
        "hr": "Фокус: мотивация, поведение в команде, конфликты, карьерные цели, сильные стороны/зоны роста.",
        "mixed": "Смешай технические вопросы и поведенческие (примерно попеременно), сохраняя реалистичный ритм интервью.",
    }
    mode_instruction = mode_lines.get(
        mode, "Следуй выбранному формату интервью и поддерживай профессиональный тон."
    )

    stress_block = ""
    if stress:
        stress_block = (
            "Режим повышенного давления (без оскорблений и дискриминации): "
            "короткие уточняющие вопросы, проверка глубины, иногда намеренно неудобные формулировки "
            "и запрос примеров из опыта. Сохраняй уважительный тон и границы этики."
        )

    return f"""Ты — опытный интервьюер. Язык общения: русский.
Направление интервью: {track}.
Уровень кандидата: {level}.
Формат: {mode}.
{mode_instruction}
{stress_block}

Правила:
- Задавай ровно один основной вопрос за ход (можно одно короткое вступление в 1 предложение).
- Учитывай предыдущие ответы: уточняй детали, углубляйся или переходи к новой теме в зависимости от качества ответа.
- Будь последовательным: не перескакивай хаотично; адаптируй сложность под уровень {level}.
- Если ответ поверхностный — задай уточняющий вопрос по той же теме; если ответ сильный — переходи к смежной теме или повысь сложность.
- Не выдумывай факты о кандидате; оценивай только по тексту ответов.
- Ответ модели должен быть СТРОГО одним JSON-объектом со полями:
  "reply_text" (строка, текст для кандидата),
  "interview_finished" (boolean),
  "suggested_topic_tags" (массив коротких строк-тегов темы, например ["sql","transactions"]).
- Когда лимит ходов достигнут или интервью логически завершено, поставь interview_finished=true и коротко подведи итог в reply_text без нового вопроса."""


def interviewer_first_user_message() -> str:
    return (
        "Интервью начинается. Поприветствуй кандидата в одном коротком предложении "
        "и задай первый вопрос по выбранному направлению и уровню."
    )


def interviewer_continue_user_message(
    *,
    user_turn_index: int,
    max_turns: int,
    force_finish: bool,
) -> str:
    if force_finish:
        return (
            f"Это ответ кандидата #{user_turn_index} из максимум {max_turns}. "
            "Лимит ходов исчерпан: заверши интервью без нового вопроса, "
            "поблагодари кандидата и поставь interview_finished=true."
        )
    return "Ниже ответ кандидата. Продолжай интервью согласно правилам."


def final_report_system_prompt() -> str:
    return """Ты — ведущий технический рекрутер и ментор.
По полному тексту интервью (вопросы и ответы) сформируй итог на русском языке.
Ответь СТРОГО одним JSON-объектом с полями:
- "summary_text": краткое резюме сессии (3-6 предложений)
- "scores": объект с числовыми оценками 1-10 по ключам: overall, technical_depth, communication, problem_solving
- "recommendations": массив строк — конкретные рекомендации по улучшению
- "weak_areas": массив строк — зоны, где ответы были слабее
- "study_plan": массив строк — персональный план подготовки на 1-2 недели (конкретные шаги)

Будь конструктивным и объективным."""


def transcript_for_report(messages: list[tuple[str, str]]) -> str:
    lines: list[str] = []
    for role, content in messages:
        label = "Интервьюер" if role == "assistant" else "Кандидат"
        lines.append(f"{label}: {content}")
    return "\n\n".join(lines)
