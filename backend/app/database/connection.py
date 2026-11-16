import os
from typing import Generator
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/saarthii"
)

# Placeholder for SQLAlchemy / asyncpg engine initialization
# Will be fully integrated in database-dependent backend parts.

def get_db() -> Generator:
    """
    Dependency generator for database sessions.
    Returns a database session yielding connection.
    """
    db = None
    try:
        # yield db session when active
        yield db
    finally:
        if db:
            pass
