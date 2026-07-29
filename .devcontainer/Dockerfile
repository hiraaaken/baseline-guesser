FROM debian:trixie-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | sh
ENV PATH="/root/.local/share/mise/shims:/root/.local/bin:$PATH"

# Node LTS + aube (mise作者謹製のnpm互換パッケージマネージャ)
RUN mise use -g node@lts aqua:jdx/aube@latest
RUN mise trust -a || true

WORKDIR /workspace
