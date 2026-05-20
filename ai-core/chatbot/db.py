"""
db.py — Async PostgreSQL connection pool using asyncpg.
All tool functions import `get_conn()` and `run_in_loop()` from here.
"""
from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager
import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool: asyncpg.Pool | None = None
_main_loop: asyncio.AbstractEventLoop | None = None


async def init_pool() -> None:
    """Call once at application startup to create the connection pool and capture the event loop."""
    global _pool, _main_loop
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set.")
    
    _main_loop = asyncio.get_running_loop()
    
    _pool = await asyncpg.create_pool(
        dsn=database_url,
        min_size=2,
        max_size=10,
        command_timeout=30,
    )


async def close_pool() -> None:
    """Call on application shutdown."""
    global _pool, _main_loop
    if _pool:
        await _pool.close()
        _pool = None
    _main_loop = None


@asynccontextmanager
async def get_conn():
    """Async context manager that yields a connection from the pool."""
    if _pool is None:
        raise RuntimeError("Database pool has not been initialised. Call init_pool() first.")
    async with _pool.acquire() as conn:
        yield conn


def run_in_loop(coro):
    """
    Runs a coroutine on the main event loop thread-safely.
    Falls back to a new event loop if the main loop isn't active (e.g. CLI testing).
    """
    global _main_loop
    if _main_loop and _main_loop.is_running():
        future = asyncio.run_coroutine_threadsafe(coro, _main_loop)
        return future.result()
    else:
        return asyncio.run(coro)
