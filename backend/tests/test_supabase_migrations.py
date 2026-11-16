"""Structural checks for the Supabase Phase 3 SQL.

These tests do not connect to Supabase. They validate that the migration,
seed and verification scripts contain the required schema and security
controls, so a missing RLS policy or an accidentally committed secret is
caught before the SQL is pasted into the Supabase SQL Editor.
"""

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SUPABASE_DIR = REPO_ROOT / "supabase"
MIGRATIONS_DIR = SUPABASE_DIR / "migrations"
SEED_DIR = SUPABASE_DIR / "seed"
VERIFY_DIR = SUPABASE_DIR / "verify"

EXPECTED_TABLES = {
    "facilities",
    "profiles",
    "user_facility_assignments",
    "patients",
    "referrals",
    "referral_events",
    "referral_outcomes",
    "back_referrals",
    "follow_up_tasks",
    "audit_logs",
    "notifications",
    "escalations",
}

CORE_REALTIME_TABLES = {
    "referrals",
    "referral_events",
    "follow_up_tasks",
    "notifications",
    "escalations",
}

SECRET_PATTERNS = [
    re.compile(r"sb_secret_[A-Za-z0-9_-]{6,}"),
    re.compile(r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{10,}"),
    re.compile(r"postgres(?:ql)?://[^\s:]+:[^\s@]+@"),
]


def read_sql(directory: Path) -> str:
    files = sorted(directory.glob("*.sql"))
    return "\n".join(path.read_text(encoding="utf-8") for path in files)


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text).lower()


def test_migrations_exist_in_ordered_files():
    assert MIGRATIONS_DIR.is_dir(), "supabase/migrations is missing"

    files = sorted(path.name for path in MIGRATIONS_DIR.glob("*.sql"))

    assert files, "no migration files found"
    for name in files:
        assert re.fullmatch(r"\d{4}_[a-z0-9_]+\.sql", name), name


def test_expected_tables_are_created():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    for table in EXPECTED_TABLES:
        assert f"create table if not exists public.{table}" in sql, table


def test_every_sensitive_table_enables_row_level_security():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    for table in EXPECTED_TABLES:
        assert f"alter table public.{table} enable row level security" in sql, table


def test_profiles_is_linked_to_supabase_auth_users():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    assert "references auth.users" in sql
    assert "public.profiles" in sql


def test_new_users_default_to_unprivileged_role():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    assert "role public.user_role not null default 'phc_staff'" in sql
    assert "raw_user_meta_data->>'role'" not in sql


def test_rls_policies_scope_access_to_the_authenticated_user():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    assert "auth.uid()" in sql
    assert "to authenticated" in sql
    assert "public.has_facility_access" in sql


def test_no_allow_all_policy_on_sensitive_tables():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    for table in EXPECTED_TABLES - {"facilities"}:
        for match in re.finditer(rf"create policy [^;]+ on public\.{table} [^;]+;", sql):
            statement = match.group(0)
            assert "using (true)" not in statement, statement


def test_storage_bucket_is_private_with_mime_and_size_limits():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    assert "referral-documents" in sql
    assert "insert into storage.buckets" in sql
    assert "file_size_limit" in sql
    assert "allowed_mime_types" in sql
    assert "public" in sql and "false" in sql


def test_realtime_publication_covers_core_tables():
    sql = normalise(read_sql(MIGRATIONS_DIR))

    assert "supabase_realtime" in sql
    for table in CORE_REALTIME_TABLES:
        assert f"add table public.{table}" in sql, table


def test_seed_scripts_are_idempotent():
    sql = normalise(read_sql(SEED_DIR))

    assert sql.strip(), "no seed SQL found"
    assert "on conflict" in sql


def test_no_secrets_are_committed_in_supabase_sql():
    sql = read_sql(SUPABASE_DIR)

    for pattern in SECRET_PATTERNS:
        assert not pattern.search(sql), pattern.pattern


def test_verification_script_exists():
    files = sorted(path.name for path in VERIFY_DIR.glob("*.sql"))

    assert files, "no verification SQL found"


def test_all_sql_parses_with_the_postgres_parser():
    pglast = pytest.importorskip("pglast")

    for path in sorted(SUPABASE_DIR.rglob("*.sql")):
        text = path.read_text(encoding="utf-8")
        pglast.parse_sql(text)
        pglast.parse_plpgsql(text)
