from types import SimpleNamespace

from fastapi.testclient import TestClient

from bed_time_stories.main import app


class FakeCompletions:
    def __init__(self) -> None:
        self.request: dict[str, object] | None = None

    async def create(self, **request: object) -> SimpleNamespace:
        self.request = request
        message = SimpleNamespace(content="Den lille ræv fandt trygt hjem under stjernerne.")
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


def test_generate_includes_skill_and_context() -> None:
    completions = FakeCompletions()
    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=completions))

    async def close_fake_client() -> None:
        return None

    fake_client.close = close_fake_client

    with TestClient(app) as client:
        app.state.openai_client = fake_client
        response = client.post(
            "/api/generate",
            json={
                "prompt": "Tell me a story about a sleepy fox.",
                "skill": "Use a calm, lyrical tone.",
                "context": "The fox lives beside a little pond.",
            },
        )

    assert response.status_code == 200
    assert response.json()["reply"] == "Den lille ræv fandt trygt hjem under stjernerne."
    assert completions.request is not None
    messages = completions.request["messages"]
    assert "Use a calm, lyrical tone." in messages[0]["content"]
    assert messages[0]["content"].index("Use a calm, lyrical tone.") < messages[0][
        "content"
    ].index("Skriv altid på naturligt og grammatisk korrekt dansk.")
    assert "The fox lives beside a little pond." in messages[1]["content"]


def test_generate_rejects_blank_prompt() -> None:
    with TestClient(app) as client:
        response = client.post("/api/generate", json={"prompt": "   "})

    assert response.status_code == 422