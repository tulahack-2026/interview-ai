from __future__ import annotations

import json
from typing import Any, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel, ValidationError

from config import (
    LLM_TIMEOUT_SECONDS,
    YANDEX_CLOUD_API_KEY,
    YANDEX_CLOUD_BASE_URL,
    YANDEX_CLOUD_FOLDER,
    YANDEX_CLOUD_MODEL,
)

T = TypeVar("T", bound=BaseModel)


def extract_json_object(text: str) -> str:
    """Strip markdown fences and return the first JSON object substring."""
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        t = "\n".join(lines).strip()
    decoder = json.JSONDecoder()
    for i, ch in enumerate(t):
        if ch != "{":
            continue
        try:
            _, end = decoder.raw_decode(t, i)
            return t[i:end]
        except json.JSONDecodeError:
            continue
    return t


class InterviewTurnLLM(BaseModel):
    """Structured output for one interview step."""

    reply_text: str
    interview_finished: bool
    suggested_topic_tags: list[str] = []


class FinalReportLLM(BaseModel):
    """Structured output for session report."""

    summary_text: str
    scores: dict[str, Any]
    recommendations: list[str]
    weak_areas: list[str]
    study_plan: list[str]


class LLMConfigurationError(RuntimeError):
    pass


class LLMClient:
    """Chat Completions через Yandex Cloud AI."""

    def __init__(
        self,
        *,
        folder: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else LLM_TIMEOUT_SECONDS
        )
        self._folder = (folder if folder is not None else YANDEX_CLOUD_FOLDER).strip()
        self._api_key = (api_key if api_key is not None else YANDEX_CLOUD_API_KEY).strip()
        self._model_name = (model if model is not None else YANDEX_CLOUD_MODEL).strip()
        self._base_url = (
            (base_url if base_url is not None else YANDEX_CLOUD_BASE_URL).rstrip("/")
        )

        self._client: AsyncOpenAI | None = None
        self.model = ""

        if self._folder and self._api_key:
            self._client = AsyncOpenAI(
                api_key=self._api_key,
                base_url=self._base_url,
                project=self._folder,
                timeout=self.timeout_seconds,
            )
            self.model = f"gpt://{self._folder}/{self._model_name}"

    def _require_client(self) -> AsyncOpenAI:
        if self._client is None:
            raise LLMConfigurationError(
                "Задайте YANDEX_CLOUD_FOLDER и YANDEX_CLOUD_API_KEY для вызовов LLM."
            )
        return self._client

    async def chat_completion_json(
        self,
        messages: list[dict[str, str]],
        response_model: type[T],
        *,
        retry_on_invalid: bool = True,
    ) -> T:
        """Request a JSON object matching response_model."""
        client = self._require_client()
        resp = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        print(resp)
        try:
            content = resp.choices[0].message.content
        except (AttributeError, IndexError, TypeError) as e:
            raise RuntimeError(f"Unexpected LLM response shape: {resp!r}") from e
        if content is None:
            raise RuntimeError("LLM returned empty message content")
        return self._parse_json_content(content, response_model, retry_on_invalid)

    def _parse_json_content(
        self,
        content: str,
        response_model: type[T],
        retry_on_invalid: bool,
    ) -> T:
        raw = extract_json_object(content)
        try:
            return response_model.model_validate_json(raw)
        except (ValidationError, json.JSONDecodeError):
            if not retry_on_invalid:
                raise ValueError(
                    f"LLM returned invalid JSON for {response_model.__name__}: {raw[:500]}"
                )
        try:
            obj = json.loads(raw)
            return response_model.model_validate(obj)
        except (ValidationError, json.JSONDecodeError) as e:
            raise ValueError(
                f"LLM returned invalid JSON for {response_model.__name__}: {raw[:500]}"
            ) from e


default_llm_client = LLMClient()
