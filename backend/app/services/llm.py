"""LLM adapter: Groq cloud free tier, Ollama local, or Gemini free tier."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import Settings, get_settings


class LLMNotReadyError(RuntimeError):
    """Raised when the configured free LLM is unavailable."""


def get_llm(settings: Settings | None = None) -> BaseChatModel:
    settings = settings or get_settings()
    provider = settings.llm_provider.lower().strip()

    if provider == "groq":
        raise LLMNotReadyError(
            "Groq uses the project's direct HTTP adapter; call invoke_text/invoke_json."
        )

    if provider == "gemini":
        if not settings.google_api_key:
            raise LLMNotReadyError(
                "LLM_PROVIDER=gemini but GOOGLE_API_KEY is missing. "
                "Get a free key at https://aistudio.google.com/apikey or use LLM_PROVIDER=groq."
            )
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError as exc:
            raise LLMNotReadyError(
                "langchain-google-genai is not installed."
            ) from exc
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=0.7,
        )

    if provider != "ollama":
        raise LLMNotReadyError(
            f"Unsupported LLM_PROVIDER={provider!r}. Use groq, ollama, or gemini."
        )

    try:
        from langchain_ollama import ChatOllama
    except ImportError as exc:
        raise LLMNotReadyError("langchain-ollama is not installed.") from exc

    return ChatOllama(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        temperature=0.7,
    )


def check_llm_ready(settings: Settings | None = None) -> tuple[bool, str]:
    settings = settings or get_settings()
    provider = settings.llm_provider.lower().strip()

    if provider == "groq":
        if not settings.groq_api_key:
            return False, "GROQ_API_KEY not set for Groq free tier"
        return True, f"Groq cloud model {settings.groq_model} configured"

    if provider == "gemini":
        if not settings.google_api_key:
            return False, "GOOGLE_API_KEY not set for Gemini free tier"
        return True, f"Gemini model {settings.gemini_model} configured"

    if provider != "ollama":
        return False, f"Unsupported LLM_PROVIDER={provider!r}"

    # Probe Ollama tags endpoint
    try:
        url = settings.ollama_base_url.rstrip("/") + "/api/tags"
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                return False, f"Ollama returned HTTP {resp.status_code}"
            data = resp.json()
            models = [m.get("name", "") for m in data.get("models", [])]
            if not models:
                return (
                    False,
                    f"Ollama is running but no models found. Run: ollama pull {settings.ollama_model}",
                )
            # soft match model name
            target = settings.ollama_model
            if not any(target in m or m.startswith(target) for m in models):
                return (
                    False,
                    f"Model '{target}' not pulled. Available: {', '.join(models)}. "
                    f"Run: ollama pull {target}",
                )
            return True, f"Ollama ready ({target})"
    except Exception as exc:  # noqa: BLE001
        return (
            False,
            f"Cannot reach Ollama at {settings.ollama_base_url}: {exc}. "
            "Install from https://ollama.com and run `ollama serve`.",
        )


def invoke_text(
    prompt: str,
    *,
    system: str | None = None,
    settings: Settings | None = None,
) -> str:
    settings = settings or get_settings()
    provider = settings.llm_provider.lower().strip()

    if provider == "groq":
        return _invoke_groq(prompt, system=system, settings=settings)

    llm = get_llm(settings)
    messages: list[Any] = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))
    try:
        result = llm.invoke(messages)
    except Exception as exc:  # noqa: BLE001
        raise LLMNotReadyError(f"LLM invocation failed: {exc}") from exc
    content = result.content
    if isinstance(content, list):
        # Gemini sometimes returns content blocks
        parts = []
        for block in content:
            if isinstance(block, dict) and "text" in block:
                parts.append(block["text"])
            else:
                parts.append(str(block))
        return "".join(parts)
    return str(content)


def _invoke_groq(prompt: str, *, system: str | None, settings: Settings) -> str:
    """Call Groq's OpenAI-compatible chat endpoint without another SDK."""
    if not settings.groq_api_key:
        raise LLMNotReadyError(
            "LLM_PROVIDER=groq but GROQ_API_KEY is missing. "
            "Create a free key at https://console.groq.com/keys."
        )

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    url = settings.groq_base_url.rstrip("/") + "/chat/completions"
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model,
                    "messages": messages,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
        return str(data["choices"][0]["message"]["content"]).strip()
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise LLMNotReadyError(f"Groq invocation failed: {exc}") from exc


def extract_json(text: str) -> Any:
    """Parse JSON from model output, tolerating markdown fences and trailing text."""
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned, re.IGNORECASE)
    if fence:
        cleaned = fence.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Find first { ... } or [ ... ]
    for opener, closer in (("{", "}"), ("[", "]")):
        start = cleaned.find(opener)
        end = cleaned.rfind(closer)
        if start != -1 and end != -1 and end > start:
            snippet = cleaned[start : end + 1]
            try:
                return json.loads(snippet)
            except json.JSONDecodeError:
                continue

    raise ValueError(f"Could not parse JSON from LLM output: {text[:400]}")


def invoke_json(
    prompt: str,
    *,
    system: str | None = None,
    settings: Settings | None = None,
) -> Any:
    text = invoke_text(prompt, system=system, settings=settings)
    return extract_json(text)
