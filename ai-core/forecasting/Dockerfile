FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application files
COPY . .

# Expose the port
EXPOSE 8001

# Run the server
CMD ["uv", "run", "python", "server.py"]
