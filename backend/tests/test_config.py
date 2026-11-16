import os
from pathlib import Path

import pytest

from app.core import config as config_module
from app.core.config import Settings


def test_cors_origins_accept_comma_separated_string():
    settings = Settings(CORS_ORIGINS="http://localhost:5173, http://127.0.0.1:5173")

    assert settings.CORS_ORIGINS == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_cors_origins_accept_json_array_string():
    settings = Settings(CORS_ORIGINS='["http://localhost:5173"]')

    assert settings.CORS_ORIGINS == ["http://localhost:5173"]


def test_read_env_file_strips_quotes_and_sets_values(tmp_path, monkeypatch):
    monkeypatch.delenv("SAARTHII_TEST_VALUE", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text('SAARTHII_TEST_VALUE="quoted value"\n', encoding="utf-8")

    config_module.read_env_file(env_file)

    assert os.environ["SAARTHII_TEST_VALUE"] == "quoted value"


def test_read_env_file_does_not_override_existing_environment(
    tmp_path, monkeypatch
):
    monkeypatch.setenv("SAARTHII_TEST_VALUE", "from-environment")
    env_file = tmp_path / ".env"
    env_file.write_text("SAARTHII_TEST_VALUE=from-file\n", encoding="utf-8")

    config_module.read_env_file(env_file)

    assert os.environ["SAARTHII_TEST_VALUE"] == "from-environment"


def test_default_env_file_is_backend_root():
    expected = Path(config_module.__file__).resolve().parents[2] / ".env"

    assert config_module.default_env_file_path() == expected


def test_invalid_cors_value_raises():
    with pytest.raises(Exception):
        Settings(CORS_ORIGINS="[not-json]")
