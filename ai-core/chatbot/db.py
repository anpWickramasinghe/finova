"""
db.py — Async PostgreSQL couv run python server.pynnection pool using asyncpg.
All tool functions import `get_conn()` from here.
"""
from __future__ import annotations

import asyncpg
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    """Call once at application startup to create the connection pool."""
    global _pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set.")
    _pool = await asyncpg.create_pool(
        dsn=database_url,
        min_size=2,
        max_size=10,
        command_timeout=30,
    )


async def close_pool() -> None:
    """Call on application shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_conn():
    """Async context manager that yields a connection from the pool."""
    if _pool is None:
        raise RuntimeError("Database pool has not been initialised. Call init_pool() first.")
    async with _pool.acquire() as conn:
        yield conn
