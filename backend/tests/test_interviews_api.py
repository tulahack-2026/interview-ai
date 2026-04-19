import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from main import app


def _llm_json_response(payload: dict) -> httpx.Response:
    import json

    body = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": json.dumps(payload, ensure_ascii=False),
                }
            }
        ]
    }
    return httpx.Response(200, json=body)


def _register_and_token(client: TestClient, email: str) -> str:
    r = client.post(
        "/user/register",
        json={
            "name": "Test",
            "patronymic": "T",
            "surname": "User",
            "date_of_birth": "1990-01-01",
            "email": email,
            "password": "secret123",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@respx.mock
def test_interview_create_reply_complete(unique_email: str) -> None:
    turn1 = {
        "reply_text": "Здравствуйте. Расскажите о вашем опыте с REST API.",
        "interview_finished": False,
        "suggested_topic_tags": ["http"],
    }
    turn2 = {
        "reply_text": "Спасибо за ответ. Интервью завершено.",
        "interview_finished": True,
        "suggested_topic_tags": [],
    }
    report = {
        "summary_text": "Кандидат ответил кратко.",
        "scores": {
            "overall": 7,
            "technical_depth": 6,
            "communication": 7,
            "problem_solving": 6,
        },
        "recommendations": ["Углубить знание HTTP"],
        "weak_areas": ["Кэширование"],
        "study_plan": ["Прочитать про REST best practices"],
    }

    route = respx.post("https://ai.api.cloud.yandex.net/v1/chat/completions")
    route.side_effect = [
        _llm_json_response(turn1),
        _llm_json_response(turn2),
        _llm_json_response(report),
    ]

    with TestClient(app) as client:
        token = _register_and_token(client, unique_email)
        headers = {"Authorization": f"Bearer {token}"}

        cr = client.post(
            "/interviews",
            headers=headers,
            json={
                "track": "Backend",
                "level": "Middle",
                "mode": "technical",
                "stress": False,
                "max_turns": 2,
            },
        )
        assert cr.status_code == 200, cr.text
        sid = cr.json()["session"]["id"]
        assert "REST" in cr.json()["assistant_message"]["content"]

        mr = client.post(
            f"/interviews/{sid}/messages",
            headers=headers,
            json={"content": "Использовал FastAPI и писал CRUD эндпоинты."},
        )
        assert mr.status_code == 200, mr.text
        assert mr.json()["interview_finished"] is True

        fr = client.post(f"/interviews/{sid}/complete", headers=headers)
        assert fr.status_code == 200, fr.text
        assert fr.json()["scores"]["overall"] == 7

        dup = client.post(f"/interviews/{sid}/complete", headers=headers)
        assert dup.status_code == 200
        assert dup.json()["id"] == fr.json()["id"]

        lst = client.get("/interviews", headers=headers)
        assert lst.status_code == 200
        assert lst.json()["total"] >= 1

        prog = client.get("/interviews/progress/summary", headers=headers)
        assert prog.status_code == 200
        assert prog.json()["sessions_completed"] >= 1


@respx.mock
def test_message_on_completed_session_conflict(unique_email: str) -> None:
    turn1 = {
        "reply_text": "Первый вопрос.",
        "interview_finished": False,
        "suggested_topic_tags": [],
    }
    turn2 = {
        "reply_text": "Спасибо, интервью окончено.",
        "interview_finished": True,
        "suggested_topic_tags": [],
    }
    route = respx.post("https://ai.api.cloud.yandex.net/v1/chat/completions")
    route.side_effect = [
        _llm_json_response(turn1),
        _llm_json_response(turn2),
    ]

    with TestClient(app) as client:
        token = _register_and_token(client, unique_email)
        headers = {"Authorization": f"Bearer {token}"}

        cr = client.post(
            "/interviews",
            headers=headers,
            json={
                "track": "QA",
                "level": "Junior",
                "mode": "hr",
                "max_turns": 1,
            },
        )
        assert cr.status_code == 200
        sid = cr.json()["session"]["id"]

        ok = client.post(
            f"/interviews/{sid}/messages",
            headers=headers,
            json={"content": "Ответ."},
        )
        assert ok.status_code == 200
        assert ok.json()["interview_finished"] is True

        bad = client.post(
            f"/interviews/{sid}/messages",
            headers=headers,
            json={"content": "Ещё ответ."},
        )
        assert bad.status_code == 409


def test_extract_json_object() -> None:
    from interviews.llm_client import extract_json_object

    raw = '```json\n{"a": 1}\n```'
    assert extract_json_object(raw) == '{"a": 1}'
