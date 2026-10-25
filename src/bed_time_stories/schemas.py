from pydantic import BaseModel, ConfigDict, Field


class GenerateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    prompt: str = Field(min_length=1, max_length=5_000)
    skill: str | None = Field(default=None, max_length=3_000)
    context: str | None = Field(default=None, max_length=5_000)


class GenerateResponse(BaseModel):
    reply: str
    model: str


class HealthResponse(BaseModel):
    status: str