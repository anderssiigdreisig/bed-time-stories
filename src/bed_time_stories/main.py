import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from openai import AsyncOpenAI, OpenAIError

from bed_time_stories.config import Settings
from bed_time_stories.schemas import GenerateRequest, GenerateResponse, HealthResponse

logger = logging.getLogger(__name__)

DEFAULT_SKILL = (
    "Skriv altid på naturligt og grammatisk korrekt dansk. "
    "Skriv en børnevenlig, rolig og sammenhængende godnathistorie med et enkelt "
    "ordforråd og korte, behagelige sætninger. "
    "Skriv kun selve historien, eventuelt med en kort titel. "
    "Medtag ikke analyse, arbejdsnoter, forklaringer eller tekst på engelsk."
)


def build_messages(payload: GenerateRequest) -> list[dict[str, str]]:
    instructions = []
    if payload.skill:
        instructions.append(payload.skill)
    instructions.append(DEFAULT_SKILL)

    user_content = payload.prompt
    if payload.context:
        user_content = f"Context:\n{payload.context}\n\nPrompt:\n{payload.prompt}"

    return [
        {"role": "system", "content": "\n\n".join(instructions)},
        {"role": "user", "content": user_content},
    ]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = Settings()
    app.state.settings = settings
    app.state.openai_client = None

    if settings.openai_api_key or settings.openai_base_url:
        api_key = (
            settings.openai_api_key.get_secret_value()
            if settings.openai_api_key
            else "local-provider"
        )
        app.state.openai_client = AsyncOpenAI(
            api_key=api_key,
            base_url=settings.openai_base_url,
        )

    try:
        yield
    finally:
        if app.state.openai_client is not None:
            await app.state.openai_client.close()


app = FastAPI(
    title="Bedtime Stories API",
    description="Generate bedtime stories using a configurable chat-completions API.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/api/generate", response_model=GenerateResponse, tags=["stories"])
async def generate_reply(
    payload: GenerateRequest,
    request: Request,
) -> GenerateResponse:
    client: AsyncOpenAI | None = request.app.state.openai_client
    settings: Settings = request.app.state.settings
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Configure OPENAI_API_KEY or OPENAI_BASE_URL to enable generation.",
        )

    try:
        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=build_messages(payload),
        )
    except OpenAIError as exc:
        logger.exception("Story generation provider request failed")
        raise HTTPException(
            status_code=502,
            detail="The story generation provider could not complete the request.",
        ) from exc

    if not completion.choices or not completion.choices[0].message.content:
        raise HTTPException(
            status_code=502,
            detail="The story generation provider returned an empty reply.",
        )

    return GenerateResponse(
        reply=completion.choices[0].message.content,
        model=settings.openai_model,
    )